import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_NAME = "google/gemini-2.5-flash-lite";

// Helper function to calculate SHA-256 hash
async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, text, useCache = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    console.log("Starting menu parsing...");

    // Calculate checksum for cache key
    const cacheInput = image || text || "";
    const imageChecksum = await calculateHash(cacheInput);

    // Check cache first only if useCache is true
    if (useCache) {
      console.log("Checking cache for existing result...");
      const { data: cachedResult, error: cacheError } = await supabase
        .from("menu_parse_cache")
        .select("parsed_result")
        .eq("image_checksum", imageChecksum)
        .eq("model_name", MODEL_NAME)
        .single();

      if (!cacheError && cachedResult) {
        console.log("Cache hit! Returning cached result");
        return new Response(JSON.stringify({ dishes: cachedResult.parsed_result, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Cache miss, proceeding with AI parsing...");
    } else {
      console.log("Cache disabled, proceeding with AI parsing...");
    }

    let menuText = text || "";

    // If image provided, extract text using Gemini Vision
    if (image) {
      console.log("Extracting text from image...");

      const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this menu image. Include dish names, descriptions, prices, and any other text visible. Preserve the structure and formatting as much as possible.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error("OCR failed:", ocrResponse.status, errorText);
        throw new Error(`OCR failed: ${ocrResponse.status}`);
      }

      const ocrData = await ocrResponse.json();
      menuText = ocrData.choices[0].message.content;
      console.log("Extracted text:", menuText.substring(0, 200) + "...");
    }

    // Parse the menu text into structured data
    console.log("Parsing menu into structured format...");

    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "You are a menu parsing expert. Parse menu text into structured JSON format with dishes.",
          },
          {
            role: "user",
            content: `Parse this menu text into a JSON array of dishes. For each dish, extract:
- name: string (dish name)
- description: string (brief description)
- ingredients: array of strings (RAW ingredients only, e.g., "eggs" not "fried eggs", "chicken" not "grilled chicken, "pork" not "bacon")
- probable_ingredients: array of strings (standard ingredients typically used but not listed for the dish, e.g., "oil", "salt", "sugar", "butter" or "beef" for "beef burger")
- category: string (starter, main, dessert, beverage, side, or other)
- calories: number (estimate if not provided, typical range 200-800)
- allergens: array of strings (common allergens: dairy, gluten, nuts, shellfish, eggs, soy)
- tags: array of strings (cooking methods like "fried", "grilled", "baked", plus dietary tags like "spicy", "vegetarian", "vegan", "alcohol")

IMPORTANT: 
- For ingredients, use ONLY raw ingredient names without any descriptors: eggs - not poached eggs, salmon - not smoked salmon, coffee - not espresson or latte
- Move all cooking methods and descriptors (fried, grilled, roasted, fresh, etc.) to tags
- In probable_ingredients, list common cooking staples typically used and ingridients for standard receipts that were not explicitly mentioned

Menu text:
${menuText}

Return ONLY a valid JSON array, nothing else. Example format:
[{"name":"Fried Eggs","description":"Two eggs fried to perfection","ingredients":["eggs"],"probable_ingredients":["oil","salt","pepper"],"category":"main","calories":180,"allergens":["eggs"],"tags":["fried","breakfast"]}]`,
          },
        ],
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("Parse failed:", parseResponse.status, errorText);
      throw new Error(`Parse failed: ${parseResponse.status}`);
    }

    const parseData = await parseResponse.json();
    let dishesText = parseData.choices[0].message.content.trim();

    // Clean up the response to extract JSON
    dishesText = dishesText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const dishes = JSON.parse(dishesText);
    console.log(`Successfully parsed ${dishes.length} dishes`);

    // Store result in cache
    console.log("Storing result in cache...");
    const { error: insertError } = await supabase.from("menu_parse_cache").insert({
      image_checksum: imageChecksum,
      model_name: MODEL_NAME,
      parsed_result: dishes,
    });

    if (insertError) {
      console.error("Failed to cache result:", insertError);
      // Don't fail the request if caching fails
    } else {
      console.log("Result cached successfully");
    }

    return new Response(JSON.stringify({ dishes, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-menu function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        dishes: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
