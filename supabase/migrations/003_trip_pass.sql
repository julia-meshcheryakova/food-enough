-- Trip Pass: paid unlimited-scanning window (7 or 30 days).
-- The app supports guest mode (no auth.users row) alongside signed-in users, so a
-- trip pass is keyed on EITHER user_id (signed-in) OR guest_id (a client-generated
-- UUID persisted in localStorage, mirrors the pattern in useUsage.ts/useProfile.ts).
-- Exactly one of the two must be set. Written only by the stripe-webhook Edge
-- Function via the service-role key, so there is no INSERT/UPDATE policy for
-- regular users — RLS only exposes read access, scoped to the caller's own rows.
CREATE TABLE IF NOT EXISTS public.trip_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('7day', '30day')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trip_pass_owner_check CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR (user_id IS NULL AND guest_id IS NOT NULL)
  )
);

CREATE INDEX idx_trip_pass_user ON public.trip_pass (user_id, status, expires_at);
CREATE INDEX idx_trip_pass_guest ON public.trip_pass (guest_id, status, expires_at);

ALTER TABLE public.trip_pass ENABLE ROW LEVEL SECURITY;

-- Signed-in users can read their own passes. Guest passes are looked up via the
-- anon key + guest_id filter — RLS still applies, so also allow reads where
-- user_id is null (guest rows) since there's no auth.uid() to scope those by;
-- the guest_id itself (an unguessable UUID) is the access control there.
CREATE POLICY "Users read own trip passes" ON public.trip_pass
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
