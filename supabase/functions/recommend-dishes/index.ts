import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, menu } = (await req.json()) as { profile: Profile; menu: Dish[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received profile:", profile);
    console.log("Received menu with", menu.length, "dishes");

    // Score each dish
    const scoredDishes: ScoredDish[] = menu.map((dish) => {
      let score = 0;
      const reasoning: string[] = [];

      // Check favorite ingredients (+3 each)
      const dishIngredientsLower = dish.ingredients.map((i) => i.toLowerCase());
      profile.favoriteIngredients.forEach((fav) => {
        if (dishIngredientsLower.some((ing) => ing.includes(fav.toLowerCase()))) {
          score += 3;
          reasoning.push(`Contains your favorite: ${fav}`);
        }
      });

      // Check hated ingredients (-5 each)
      profile.hatedIngredients.forEach((hate) => {
        if (dishIngredientsLower.some((ing) => ing.includes(hate.toLowerCase()))) {
          score -= 5;
          reasoning.push(`Contains ingredient you dislike: ${hate}`);
        }
      });

      // Check allergens (-10 each)
      profile.allergies.forEach((allergy) => {
        if (dish.allergens.some((a) => a.toLowerCase().includes(allergy.toLowerCase()))) {
          score -= 10;
          reasoning.push(`⚠️ Contains allergen: ${allergy}`);
        }
      });

      // Check dietary goals (+2 for match)
      profile.goals.forEach((goal) => {
        if (goal.toLowerCase().includes("low-calorie") && dish.calories < 400) {
          score += 2;
          reasoning.push(`Matches your low-calorie goal (${dish.calories} kcal)`);
        }
        if (goal.toLowerCase().includes("high-protein")) {
          // Assume high-protein if description mentions protein
          if (
            dish.description.toLowerCase().includes("protein") ||
            dishIngredientsLower.some((i) => ["chicken", "beef", "fish", "tofu", "egg"].includes(i))
          ) {
            score += 2;
            reasoning.push("High in protein");
          }
        }
        if (goal.toLowerCase().includes("low-carb") && dish.calories < 300) {
          score += 2;
          reasoning.push("Low in carbs");
        }
      });

      // Check restrictions (-2 for violations)
      restriction_score = -10;
      profile.restrictions.forEach((restriction) => {
        if (restriction.toLowerCase().includes("vegetarian")) {
          if (
            dishIngredientsLower.some((i) => ["meat", "chicken", "beef", "pork", "fish"].some((m) => i.includes(m)))
          ) {
            score += restriction_score;
            reasoning.push("Contains meat (vegetarian restriction)");
          }
        }
        if (restriction.toLowerCase().includes("vegan")) {
          if (
            dishIngredientsLower.some((i) =>
              ["dairy", "cheese", "milk", "egg", "meat", "chicken", "beef", "fish"].some((m) => i.includes(m)),
            )
          ) {
            score += restriction_score;
            reasoning.push("Contains animal products (vegan restriction)");
          }
        }
        if (restriction.toLowerCase().includes("gluten-free")) {
          if (dishIngredientsLower.some((i) => ["wheat", "bread", "pasta", "flour"].some((g) => i.includes(g)))) {
            score += restriction_score;
            reasoning.push("Contains gluten");
          }
        }
      });

      // Check spicy/alcohol tags
      if (dish.tags.includes("spicy") && profile.restrictions.some((r) => r.toLowerCase().includes("no spicy"))) {
        score += restriction_score;
        reasoning.push("Contains spice");
      }
      if (dish.tags.includes("alcohol") && profile.restrictions.some((r) => r.toLowerCase().includes("no alcohol"))) {
        score += restriction_score;
        reasoning.push("Contains alcohol");
      }

      if (reasoning.length === 0) {
        reasoning.push("Good general choice");
      }

      return {
        ...dish,
        score,
        reasoning,
      };
    });

    // Sort by score and take top 3
    const topDishes = scoredDishes.sort((a, b) => b.score - a.score).slice(0, 3);

    console.log(
      "Top 3 dishes:",
      topDishes.map((d) => ({ name: d.name, score: d.score })),
    );

    // Generate images for top dishes using Gemini 2.5 Flash Image
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
              messages: [
                {
                  role: "user",
                  content: imagePrompt,
                },
              ],
              modalities: ["image", "text"],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Image generation failed for ${dish.name}:`, response.status, errorText);
            return {
              ...dish,
              imageUrl: null,
              imageError: true,
            };
          }

          const data = await response.json();
          const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageUrl) {
            console.error(`No image URL returned for ${dish.name}`);
            return {
              ...dish,
              imageUrl: null,
              imageError: true,
            };
          }

          console.log(`Image generated successfully for: ${dish.name}`);

          return {
            ...dish,
            imageUrl,
            imageError: false,
          };
        } catch (error) {
          console.error(`Error generating image for ${dish.name}:`, error);
          return {
            ...dish,
            imageUrl: null,
            imageError: true,
          };
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
