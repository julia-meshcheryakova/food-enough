import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting menu parsing...");
    
    let menuText = text || "";
    
    // If image provided, extract text using Gemini Vision
    if (image) {
      console.log("Extracting text from image with Gemini...");
      
      const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this menu image. Include dish names, descriptions, prices, and any other text visible. Preserve the structure and formatting as much as possible."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
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
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a menu parsing expert. Parse menu text into structured JSON format with dishes."
          },
          {
            role: "user",
            content: `Parse this menu text into a JSON array of dishes. For each dish, extract:
- name: string (dish name)
- description: string (brief description)
- ingredients: array of strings (main ingredients)
- category: string (starter, main, dessert, beverage, side, or other)
- calories: number (estimate if not provided, typical range 200-800)
- allergens: array of strings (common allergens: dairy, gluten, nuts, shellfish, eggs, soy)
- tags: array of strings (spicy, vegetarian, vegan, alcohol, etc.)

Menu text:
${menuText}

Return ONLY a valid JSON array, nothing else. Example format:
[{"name":"Dish Name","description":"Brief description","ingredients":["ingredient1","ingredient2"],"category":"main","calories":450,"allergens":["gluten","dairy"],"tags":["spicy"]}]`
          }
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
    dishesText = dishesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const dishes = JSON.parse(dishesText);
    console.log(`Successfully parsed ${dishes.length} dishes`);

    return new Response(
      JSON.stringify({ dishes }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in parse-menu function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        dishes: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
