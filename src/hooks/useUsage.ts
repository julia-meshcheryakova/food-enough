import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasActiveTripPass } from "@/api/tripPass";

const FREE_ANALYSES_LIFETIME = 2;
const STORAGE_KEY = "foodEnoughAnalyses"; // lifetime count, guests + fallback

/** Lifetime free-analysis cap, counted client-side in localStorage.
 *  The `usage` table doesn't exist in Supabase, so localStorage is the source
 *  of truth and we never block on a backend error. Guests and signed-in users
 *  share the same local cap for now. An active Trip Pass (server-verified via
 *  the trip_pass table) bypasses the cap entirely. */
function readLocalCount(): number {
  const n = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function useUsage() {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [hasTripPass, setHasTripPass] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkTripPass = useCallback(async () => {
    const active = await hasActiveTripPass(user?.id ?? null);
    setHasTripPass(active);
  }, [user?.id]);

  useEffect(() => {
    setUsageCount(readLocalCount());
    checkTripPass().finally(() => setLoading(false));
  }, [checkTripPass]);

  const trackAnalysis = useCallback(async () => {
    if (hasTripPass) return true; // unlimited during an active trip pass

    const current = readLocalCount();
    if (current >= FREE_ANALYSES_LIFETIME) return false; // over lifetime cap

    const next = current + 1;
    localStorage.setItem(STORAGE_KEY, String(next));
    setUsageCount(next);
    return true;
  }, [hasTripPass]);

  return {
    usageCount,
    limit: FREE_ANALYSES_LIFETIME,
    remaining: Math.max(0, FREE_ANALYSES_LIFETIME - usageCount),
    isOverLimit: !hasTripPass && usageCount >= FREE_ANALYSES_LIFETIME,
    hasTripPass,
    loading,
    trackAnalysis,
    reload: () => {
      setUsageCount(readLocalCount());
      checkTripPass();
    },
  };
}
