import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase Edge Function: creates a Stripe Checkout Session for a Trip Pass.
//
// Secrets (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY — Stripe secret key
//
// Two tiers, server-enforced (never trust amount/duration from the client):
//   '7day'  -> £3.99, 7 days unlimited
//   '30day' -> £6.99, 30 days unlimited

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIERS: Record<string, { amount: number; label: string; days: number }> = {
  "7day": { amount: 399, label: "Trip Pass — 7 days unlimited", days: 7 },
  "30day": { amount: 699, label: "Trip Pass — 30 days unlimited", days: 30 },
};

// STUB MODE: while Stripe account setup is pending, skip real payment entirely.
// Set to false once STRIPE_SECRET_KEY is configured and this should charge for real.
const STUB_MODE = true;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tier, userId, guestId, returnUrl } = (await req.json()) as {
      tier?: string;
      userId?: string;
      guestId?: string;
      returnUrl?: string;
    };

    const selectedTier = TIERS[tier ?? ""];
    if (!selectedTier) {
      return new Response(JSON.stringify({ error: "Invalid tier. Use '7day' or '30day'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exactly one of userId (signed-in) / guestId (localStorage UUID) must be
    // present — mirrors the trip_pass_owner_check constraint in the migration.
    const safeUserId = typeof userId === "string" && userId.trim() ? userId.trim() : null;
    const safeGuestId = typeof guestId === "string" && guestId.trim() ? guestId.trim().slice(0, 100) : null;
    if ((safeUserId && safeGuestId) || (!safeUserId && !safeGuestId)) {
      return new Response(JSON.stringify({ error: "Provide exactly one of userId or guestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Base site URL for redirect back after checkout. Falls back to the
    // request Origin header if the client didn't send one.
    const origin = (typeof returnUrl === "string" && returnUrl) || req.headers.get("Origin") || "";
    const successUrl = origin ? `${origin}?trip_pass=success` : undefined;
    const cancelUrl = origin ? `${origin}?trip_pass=cancelled` : undefined;

    if (STUB_MODE) {
      // No real Stripe call. Activate the trip pass directly (same write path the
      // webhook would do), then send the client straight to the success URL.
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Server misconfigured (stub)" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const fakeSessionId = `stub_${crypto.randomUUID()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + selectedTier.days * 24 * 60 * 60 * 1000);
      const row = {
        user_id: safeUserId,
        guest_id: safeGuestId,
        tier,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_checkout_session_id: fakeSessionId,
        stripe_payment_intent_id: null,
        status: "active",
      };
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/trip_pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(row),
      });
      if (!insertRes.ok) {
        const errText = await insertRes.text();
        console.error("Stub trip_pass insert failed:", insertRes.status, errText);
        return new Response(JSON.stringify({ error: "Stub activation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ url: successUrl || "/" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      "mode": "payment",
      "line_items[0][price_data][currency]": "gbp",
      "line_items[0][price_data][product_data][name]": selectedTier.label,
      "line_items[0][price_data][unit_amount]": String(selectedTier.amount),
      "line_items[0][quantity]": "1",
      "metadata[tier]": tier as string,
    });
    if (safeUserId) params.set("metadata[user_id]", safeUserId);
    if (safeGuestId) params.set("metadata[guest_id]", safeGuestId);
    if (successUrl) params.set("success_url", successUrl);
    if (cancelUrl) params.set("cancel_url", cancelUrl);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error("Stripe error creating checkout session:", session.error);
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
