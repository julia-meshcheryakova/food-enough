import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dishName, dishDescription } = await req.json();
    
    if (!dishName || !dishDescription) {
      return new Response(
        JSON.stringify({ error: "Missing dishName or dishDescription" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from("dish_images")
      .select("image_url")
      .eq("dish_name", dishName)
      .eq("dish_description", dishDescription)
      .maybeSingle();

    if (cacheError) {
      console.error("Cache lookup error:", cacheError);
    }

    if (cached?.image_url) {
      console.log(`Cache hit for: ${dishName}`);
      return new Response(
        JSON.stringify({ imageUrl: cached.image_url, cached: true }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new image
    console.log(`Generating image for: ${dishName}`);
    const imagePrompt = `A beautiful, appetizing photo of ${dishName}. ${dishDescription}. Professional food photography, high quality, well-lit, restaurant-style plating.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Image generation failed for ${dishName}:`, response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Image generation failed", imageUrl: null }), 
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL in response", imageUrl: null }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the generated image
    const { error: insertError } = await supabase
      .from("dish_images")
      .insert({
        dish_name: dishName,
        dish_description: dishDescription,
        image_url: imageUrl,
      });

    if (insertError) {
      console.error("Failed to cache image:", insertError);
      // Still return the image even if caching fails
    } else {
      console.log(`Cached image for: ${dishName}`);
    }

    return new Response(
      JSON.stringify({ imageUrl, cached: false }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-dish-image function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
