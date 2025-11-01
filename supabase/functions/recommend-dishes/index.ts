import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Scoring Constants ----
const SCORE = {
  FAVORITE: 3,
  HATED: -5,
  ALLERGEN: -10,
  RESTRICTION: -10,
};

// ---- Interfaces ----
interface Profile {
  allergies: string[];
  restrictions: string[];
  hatedIngredients: string[];
  favoriteIngredients: string[];
  goals: string[];
}

interface Dish {
  name: string;
  description: string;
  ingredients: string[];
  category: string;
  calories: number;
  allergens: string[];
  tags: string[];
}

interface ScoredDish extends Dish {
  score: number;
  reasoning: string[];
}

// ---- Helper: Case-insensitive match ----
function includesAny(source: string[], targets: string[]): string[] {
  const found: string[] = [];
  for (const target of targets) {
    const match = source.find((s) => s.toLowerCase().includes(target.toLowerCase()));
    if (match) found.push(target);
  }
  return found;
}

// ---- Main Server ----
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, menu } = (await req.json()) as { profile: Profile; menu: Dish[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Received profile:", profile);
    console.log("Received menu with", menu.length, "dishes");

    const scoredDishes: ScoredDish[] = menu.map((dish) => {
      let score = 0;
      const reasoning: string[] = [];

      const ingredientsLower = dish.ingredients.map((i) => i.toLowerCase());
      const allergensLower = dish.allergens.map((a) => a.toLowerCase());

      // ---- Favorites ----
      const favMatches = includesAny(ingredientsLower, profile.favoriteIngredients);
      favMatches.forEach((f) => reasoning.push(`Contains your favorite: ${f}`));
      score += favMatches.length * SCORE.FAVORITE;

      // ---- Hated ----
      const hateMatches = includesAny(ingredientsLower, profile.hatedIngredients);
      hateMatches.forEach((h) => reasoning.push(`Contains ingredient you dislike: ${h}`));
      score += hateMatches.length * SCORE.HATED;

      // ---- Allergies ----
      const allergyMatches = includesAny(allergensLower, profile.allergies);
      allergyMatches.forEach((a) => reasoning.push(`⚠️ Contains allergen: ${a}`));
      score += allergyMatches.length * SCORE.ALLERGEN;

      // ---- Restrictions ----
      const restrictionMatches = includesAny(ingredientsLower, profile.restrictions);
      restrictionMatches.forEach((r) => reasoning.push(`May conflict with restriction: ${r}`));
      score += restrictionMatches.length * SCORE.RESTRICTION;

      if (reasoning.length === 0) reasoning.push("Good general choice");

      return { ...dish, score, reasoning };
    });

    const topDishes = scoredDishes.sort((a, b) => b.score - a.score).slice(0, 3);
    console.log(
      "Top 3 dishes:",
      topDishes.map((d) => ({ name: d.name, score: d.score })),
    );

    // ---- Generate Images ----
    const dishesWithImages = await Promise.all(
      topDishes.map(async (dish) => {
        try {
          const imagePrompt = `A beautiful, appetizing photo of ${dish.name}. ${dish.description}. Professional food photography, high quality, well-lit, restaurant-style plating.`;

          console.log(`Generating image for: ${dish.name}`);

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
            console.error(`Image generation failed for ${dish.name}:`, response.status);
            return { ...dish, imageUrl: null, imageError: true };
          }

          const data = await response.json();
          const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!imageUrl) return { ...dish, imageUrl: null, imageError: true };

          console.log(`Image generated successfully for: ${dish.name}`);
          return { ...dish, imageUrl, imageError: false };
        } catch (error) {
          console.error(`Error generating image for ${dish.name}:`, error);
          return { ...dish, imageUrl: null, imageError: true };
        }
      }),
    );

    return new Response(JSON.stringify({ recommendations: dishesWithImages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recommend-dishes function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
