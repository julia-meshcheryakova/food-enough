import { useCallback, useEffect, useState } from "react";

const FREE_ANALYSES_LIFETIME = 2;
const STORAGE_KEY = "foodEnoughAnalyses"; // lifetime count, guests + fallback

/** Lifetime free-analysis cap, counted client-side in localStorage.
 *  The `usage` table doesn't exist in Supabase, and trip passes aren't wired to
 *  payment yet — so localStorage is the source of truth and we never block on a
 *  backend error. Guests and signed-in users share the same local cap for now. */
function readLocalCount(): number {
  const n = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function useUsage() {
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUsageCount(readLocalCount());
    setLoading(false);
  }, []);

  const trackAnalysis = useCallback(async () => {
    const current = readLocalCount();
    if (current >= FREE_ANALYSES_LIFETIME) return false; // over lifetime cap

    const next = current + 1;
    localStorage.setItem(STORAGE_KEY, String(next));
    setUsageCount(next);
    return true;
  }, []);

  return {
    usageCount,
    limit: FREE_ANALYSES_LIFETIME,
    remaining: Math.max(0, FREE_ANALYSES_LIFETIME - usageCount),
    isOverLimit: usageCount >= FREE_ANALYSES_LIFETIME,
    loading,
    trackAnalysis,
    reload: () => setUsageCount(readLocalCount()),
  };
}
