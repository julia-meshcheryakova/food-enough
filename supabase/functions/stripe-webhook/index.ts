import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase Edge Function: Stripe webhook handler for Trip Pass checkouts.
//
// Secrets (set via `supabase secrets set`):
//   STRIPE_WEBHOOK_SECRET      — Stripe webhook signing secret (this endpoint)
//   SUPABASE_URL               — Supabase project REST endpoint
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase service-role key (bypasses RLS)
//
// Configure in Stripe Dashboard: endpoint URL =
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// listening for checkout.session.completed.

const TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-enforced tier durations. Must match create-checkout/index.ts — never
// trust a duration coming from client-controlled metadata.
const TIER_DAYS: Record<string, number> = {
  "7day": 7,
  "30day": 30,
};

function hexToBytes(hex: string): Uint8Array | null {
  if (typeof hex !== "string" || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function verifySignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",");
  let timestamp: string | null = null;
  const v1Signatures: string[] = [];
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    const key = k.trim();
    const v = rest.join("=").trim();
    if (key === "t") timestamp = v;
    else if (key === "v1") v1Signatures.push(v);
  }
  if (!timestamp || v1Signatures.length === 0) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SEC) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const expectedBytes = new Uint8Array(signed);

  for (const sig of v1Signatures) {
    const sigBytes = hexToBytes(sig);
    if (!sigBytes || sigBytes.length !== expectedBytes.length) continue;
    let diff = 0;
    for (let i = 0; i < expectedBytes.length; i++) {
      diff |= expectedBytes[i] ^ sigBytes[i];
    }
    if (diff === 0) return true;
  }

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";

    const valid = await verifySignature(body, sigHeader, webhookSecret);
    if (!valid) {
      console.error("Invalid Stripe signature");
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    if (event.type !== "checkout.session.completed") {
      // Acknowledge but ignore other event types
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const session = event.data.object as {
      id: string;
      payment_intent?: string;
      metadata?: Record<string, string>;
    };
    const metadata = session.metadata || {};
    const tier = metadata.tier;
    const days = TIER_DAYS[tier ?? ""];

    if (!days) {
      console.error("Webhook checkout.session.completed with unknown/missing tier:", tier);
      return new Response("Unknown tier", { status: 400, headers: corsHeaders });
    }

    const userId = metadata.user_id || null;
    const guestId = metadata.guest_id || null;
    if ((userId && guestId) || (!userId && !guestId)) {
      console.error("Webhook metadata must carry exactly one of user_id/guest_id:", metadata);
      return new Response("Invalid metadata", { status: 400, headers: corsHeaders });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const row = {
      user_id: userId,
      guest_id: guestId,
      tier,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      status: "active",
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/trip_pass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Unique constraint on stripe_checkout_session_id — a duplicate delivery
      // of the same event is fine to ignore, not an error.
      const isDuplicate = res.status === 409 || errText.includes("23505");
      if (!isDuplicate) {
        console.error("Supabase trip_pass insert failed:", res.status, errText);
        return new Response("Insert failed", { status: 500, headers: corsHeaders });
      }
      console.warn("Duplicate trip_pass insert (ignored):", errText);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Unhandled webhook error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
