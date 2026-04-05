import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FREE_ANALYSES_PER_MONTH = 5;

export function useUsage() {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    if (!user) {
      setUsageCount(0);
      setLoading(false);
      return;
    }

    // Count analyses this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error } = await supabase
      .from("usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "menu_analysis")
      .gte("created_at", monthStart);

    if (!error && count !== null) {
      setUsageCount(count);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const trackAnalysis = useCallback(async () => {
    if (!user) return false;

    // Check limit first
    if (usageCount >= FREE_ANALYSES_PER_MONTH) {
      return false; // Over limit
    }

    const { error } = await supabase.from("usage").insert({
      user_id: user.id,
      action: "menu_analysis",
    });

    if (!error) {
      setUsageCount((prev) => prev + 1);
      return true;
    }
    return false;
  }, [user, usageCount]);

  return {
    usageCount,
    limit: FREE_ANALYSES_PER_MONTH,
    remaining: Math.max(0, FREE_ANALYSES_PER_MONTH - usageCount),
    isOverLimit: usageCount >= FREE_ANALYSES_PER_MONTH,
    loading,
    trackAnalysis,
    reload: loadUsage,
  };
}
