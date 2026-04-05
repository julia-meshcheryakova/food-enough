import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  name: string;
  restrictions: string[];
  hatedIngredients: string[];
  favoriteIngredients: string[];
  goals: string[];
  excludedCategories: string[];
}

const DEFAULT_PROFILE: ProfileData = {
  name: "Custom",
  restrictions: [],
  hatedIngredients: [],
  favoriteIngredients: [],
  goals: [],
  excludedCategories: [],
};

const STORAGE_KEY = "foodEnoughProfile";

/** Load profile from localStorage (guest fallback). */
function loadLocalProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || "Custom",
      restrictions: [...(parsed.restrictions || []), ...(parsed.allergies || [])],
      hatedIngredients: parsed.hatedIngredients || [],
      favoriteIngredients: parsed.favoriteIngredients || [],
      goals: parsed.goals || [],
      excludedCategories: parsed.excludedCategories || [],
    };
  } catch {
    return null;
  }
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Load profile: Supabase if authenticated, else localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (user) {
        // Try Supabase first
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!cancelled) {
          if (data && !error) {
            setProfile({
              name: data.profile_name || "Custom",
              restrictions: data.restrictions || [],
              hatedIngredients: data.hated_ingredients || [],
              favoriteIngredients: data.favorite_ingredients || [],
              goals: data.goals || [],
              excludedCategories: data.excluded_categories || [],
            });
          } else {
            // Profile row might not exist yet — try migrating from localStorage
            const local = loadLocalProfile();
            if (local) {
              setProfile(local);
              // Migrate to Supabase in background
              await supabase.from("profiles").upsert({
                id: user.id,
                profile_name: local.name,
                restrictions: local.restrictions,
                hated_ingredients: local.hatedIngredients,
                favorite_ingredients: local.favoriteIngredients,
                goals: local.goals,
                excluded_categories: local.excludedCategories,
                updated_at: new Date().toISOString(),
              });
            } else {
              setProfile(DEFAULT_PROFILE);
            }
          }
        }
      } else {
        // Guest: use localStorage
        const local = loadLocalProfile();
        if (!cancelled) {
          setProfile(local || DEFAULT_PROFILE);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const saveProfile = useCallback(
    async (data: ProfileData) => {
      setProfile(data);

      // Always save to localStorage as cache
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, savedAt: new Date().toISOString() })
      );

      if (user) {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          profile_name: data.name,
          restrictions: data.restrictions,
          hated_ingredients: data.hatedIngredients,
          favorite_ingredients: data.favoriteIngredients,
          goals: data.goals,
          excluded_categories: data.excludedCategories,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error("Failed to save profile to Supabase:", error);
      }
    },
    [user]
  );

  return { profile, loading, saveProfile };
}
