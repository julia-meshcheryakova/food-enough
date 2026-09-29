import { supabase } from "@/integrations/supabase/client";

const GUEST_ID_KEY = "foodEnoughGuestId";

/** Stable per-device guest identifier, generated once and persisted in
 *  localStorage. Used to attribute a Trip Pass purchase for guests (no
 *  auth.users row to key off), mirroring the guest fallback already used by
 *  useProfile.ts / useUsage.ts. */
export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export type TripPassTier = "7day" | "30day";

/** Calls the create-checkout Edge Function and returns the Stripe Checkout
 *  Session URL to redirect the browser to. */
export async function startTripPassCheckout(tier: TripPassTier, userId: string | null): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      tier,
      userId: userId || undefined,
      guestId: userId ? undefined : getGuestId(),
      returnUrl: window.location.origin + window.location.pathname,
    },
  });

  if (error) throw new Error(error.message || "Failed to start checkout");
  if (!data?.url) throw new Error("No checkout URL returned");
  return data.url as string;
}

/** True if the current user/guest has a non-expired, active trip pass. */
export async function hasActiveTripPass(userId: string | null): Promise<boolean> {
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("trip_pass")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .gt("expires_at", nowIso);

  query = userId ? query.eq("user_id", userId) : query.eq("guest_id", getGuestId());

  const { count, error } = await query;
  if (error) {
    console.error("Failed to check trip pass status:", error);
    return false;
  }
  return (count ?? 0) > 0;
}
