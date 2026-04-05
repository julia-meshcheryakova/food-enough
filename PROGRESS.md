# Food Enough — Progress Report

## Date: 2026-04-05

## What Was Implemented

### 1. Replace Lovable AI Gateway (feature/replace-ai-gateway)
- **parse-menu**: Now uses Google's OpenAI-compatible endpoint (`generativelanguage.googleapis.com/v1beta/openai`) with graceful fallback to Lovable gateway
- **generate-dish-image**: Rewrote to use native Gemini API (`generateContent` with `responseModalities: ["TEXT", "IMAGE"]`) for image generation, with Lovable fallback
- **recommend-dishes**: Removed hard dependency on `LOVABLE_API_KEY`
- New env var: `GOOGLE_AI_API_KEY` (preferred; falls back to `LOVABLE_API_KEY`)

### 2. Supabase Auth + Persistent Profiles (feature/auth-profiles)
- **AuthContext** (`src/contexts/AuthContext.tsx`): Email/password + Google OAuth support
- **Auth page** (`src/pages/Auth.tsx`): Sign in/up tabs with Google button
- **ProtectedRoute** component: Guards `/profile`, `/menu`, `/results`, `/admin`
- **useProfile hook** (`src/hooks/useProfile.ts`): Loads/saves profiles from Supabase; falls back to localStorage for guests; auto-migrates localStorage data on first auth
- **Profiles table** migration (`supabase/migrations/001_profiles.sql`) with RLS, trigger for auto-creating profile on signup
- Updated Navigation with auth-aware sign in/out
- Updated ProfileSetup and Results to use useProfile hook
- Removed Chat page (was placeholder)
- Updated Supabase types

### 3. Usage Tracking & Freemium Paywall (feature/usage-tracking)
- **Usage table** migration (`supabase/migrations/002_usage.sql`) with RLS
- **useUsage hook** (`src/hooks/useUsage.ts`): Tracks menu analyses per user per calendar month
- **Paywall component** (`src/components/Paywall.tsx`): Shows when free limit (5/month) reached
- Integrated into MenuUpload: shows remaining count, blocks at limit, tracks after successful analysis

### 4. Landing Page Pricing Section (feature/landing-page)
- Added pricing section with Free and Premium tiers
- Free: 5 analyses/month, allergen checking, personalized recommendations
- Premium: $4.99/month, unlimited analyses (coming soon)
- Visual pricing cards with feature comparison

## Branches Created
- `candidate/v1` — main candidate branch (all features merged)
- `feature/replace-ai-gateway` — AI gateway swap
- `feature/auth-profiles` — Authentication + persistent profiles
- `feature/usage-tracking` — Usage tracking + freemium
- `feature/landing-page` — Landing page pricing

All pushed to `origin`.

## How to Test

### Local Development
```bash
cd projects/food-enough
npm install
npm run dev
```

### Before Deploying — Supabase Setup Required
1. **Run migrations**: Execute `001_profiles.sql` and `002_usage.sql` in Supabase SQL Editor
2. **Set secret**: `supabase secrets set GOOGLE_AI_API_KEY=<your-google-ai-key>` (or keep using LOVABLE_API_KEY)
3. **Enable Google OAuth** in Supabase Auth > Providers (optional but recommended)
4. **Deploy edge functions**: `supabase functions deploy parse-menu && supabase functions deploy generate-dish-image && supabase functions deploy recommend-dishes`

### Testing the Auth Flow
1. Visit `/auth` → sign up with email/password
2. After signup, redirected to `/profile`
3. Set preferences → Save → redirected to `/menu`
4. Upload a menu image → Get Recommendations
5. Profile persists across sessions (refresh, re-login)

### Testing the Paywall
- After 5 successful menu analyses in a month, the MenuUpload page shows the paywall instead of the upload form
- Usage count shown below the page title

## Build Status
- ✅ TypeScript compiles cleanly (`npx tsc --noEmit`)
- ✅ Vite build succeeds (`npm run build`)
- ✅ No new dependencies added

## What's Next

### Immediate (before deploying)
1. **Run SQL migrations** on Supabase
2. **Get a Google AI API key** and set it as Supabase secret
3. **Enable Google OAuth** in Supabase dashboard
4. **Deploy updated edge functions**

### Phase 2 — Revenue
5. **Stripe integration** — actual payment for Premium tier (replace "Coming Soon" button)
6. **Premium status check** — bypass paywall for paying users

### Phase 3 — Polish
7. **Mobile UX review** — responsive design pass
8. **PWA support** — installable on mobile
9. **Analytics** — basic event tracking (Plausible or similar)
10. **Error boundaries** — better error handling throughout

### Technical Debt
- The app-mockup.png import was removed but the file still exists in assets — can be deleted
- Consider code splitting (single JS bundle is 555KB)
- Menu data still passes through localStorage between pages — could use React context or URL state
