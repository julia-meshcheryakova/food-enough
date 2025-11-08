import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
  excludedCategories?: string[];
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

    // Ensure all profile arrays have default values
    const safeProfile = {
      allergies: profile.allergies || [],
      restrictions: profile.restrictions || [],
      hatedIngredients: profile.hatedIngredients || [],
      favoriteIngredients: profile.favoriteIngredients || [],
      goals: profile.goals || [],
      excludedCategories: profile.excludedCategories || [],
    };

    console.log("Received profile:", safeProfile);
    console.log("Received menu with", menu.length, "dishes");

    // Filter out excluded categories first
    const filteredMenu = menu.filter((dish) => {
      const categoryLower = dish.category.toLowerCase();
      const isExcluded = safeProfile.excludedCategories.some(
        (excluded) => excluded.toLowerCase() === categoryLower
      );
      return !isExcluded;
    });

    console.log("After category filtering:", filteredMenu.length, "dishes");

    const scoredDishes: ScoredDish[] = filteredMenu.map((dish) => {
      let score = 0;
      const reasoning: string[] = [];

      const ingredientsLower = dish.ingredients.map((i) => i.toLowerCase());
      const allergensLower = dish.allergens.map((a) => a.toLowerCase());
      const tagsLower = dish.tags.map((t) => t.toLowerCase());

      // ---- Favorites (check both ingredients and tags) ----
      const favIngredientsMatches = includesAny(ingredientsLower, safeProfile.favoriteIngredients);
      const favTagsMatches = includesAny(tagsLower, safeProfile.favoriteIngredients);
      const allFavMatches = [...new Set([...favIngredientsMatches, ...favTagsMatches])];
      allFavMatches.forEach((f) => reasoning.push(`Contains your favorite: ${f}`));
      score += allFavMatches.length * SCORE.FAVORITE;

      // ---- Hated ----
      const hateMatches = includesAny(ingredientsLower, safeProfile.hatedIngredients);
      hateMatches.forEach((h) => reasoning.push(`Contains ingredient you dislike: ${h}`));
      score += hateMatches.length * SCORE.HATED;

      // ---- Allergies ----
      const allergyMatches = includesAny(allergensLower, safeProfile.allergies);
      allergyMatches.forEach((a) => reasoning.push(`⚠️ Contains allergen: ${a}`));
      score += allergyMatches.length * SCORE.ALLERGEN;

      // ---- Restrictions (check both ingredients and tags) ----
      const restrictionIngredientsMatches = includesAny(ingredientsLower, safeProfile.restrictions);
      const restrictionTagsMatches = includesAny(tagsLower, safeProfile.restrictions);
      const allRestrictionMatches = [...new Set([...restrictionIngredientsMatches, ...restrictionTagsMatches])];
      allRestrictionMatches.forEach((r) => reasoning.push(`May conflict with restriction: ${r}`));
      score += allRestrictionMatches.length * SCORE.RESTRICTION;

      if (reasoning.length === 0) reasoning.push("Good general choice");

      return { ...dish, score, reasoning };
    });

    const topDishes = scoredDishes.sort((a, b) => b.score - a.score).slice(0, 3);
    console.log(
      "Top 3 dishes:",
      topDishes.map((d) => ({ name: d.name, score: d.score })),
    );

    // Check cache for existing images
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Supabase credentials not configured, returning without images");
      return new Response(JSON.stringify({ 
        recommendations: topDishes.map(d => ({ ...d, imageUrl: null })) 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache for each dish
    const dishesWithCachedImages = await Promise.all(
      topDishes.map(async (dish) => {
        try {
          const { data: cached } = await supabase
            .from("dish_images")
            .select("image_url")
            .eq("dish_name", dish.name)
            .eq("dish_description", dish.description)
            .maybeSingle();

          if (cached?.image_url) {
            console.log(`Cache hit for: ${dish.name}`);
            return { ...dish, imageUrl: cached.image_url };
          }

          console.log(`No cached image for: ${dish.name}`);
          return { ...dish, imageUrl: null };
        } catch (error) {
          console.error(`Error checking cache for ${dish.name}:`, error);
          return { ...dish, imageUrl: null };
        }
      })
    );

    return new Response(JSON.stringify({ recommendations: dishesWithCachedImages }), {
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
