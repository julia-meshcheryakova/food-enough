# Food Enough — Application Analysis

**Date:** 2026-04-05
**Live URL:** https://food-enough.lovable.app/

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Routing** | React Router DOM v6 |
| **UI** | Tailwind CSS + shadcn/ui (Radix primitives) |
| **State** | TanStack React Query, React Hook Form + Zod |
| **Backend** | Supabase (Edge Functions in Deno) |
| **AI** | Lovable AI Gateway → Google Gemini 2.5 Flash (menu parsing, dish image generation) |
| **Database** | Supabase PostgreSQL (2 tables) |
| **Hosting** | Lovable.app (built-in deployment) |
| **Dev tooling** | ESLint, PostCSS, Autoprefixer, lovable-tagger |

---

## Feature Inventory

### ✅ Working (Core Flow)

1. **Landing page** — Marketing page with hero, features section, how-it-works, FAQ, CTA buttons
2. **Profile setup** (`/profile`) — Users set allergies, dietary restrictions, hated/favorite ingredients, goals, excluded categories via multi-step form with tag inputs
3. **Menu upload** (`/menu`) — Upload menu photo OR paste menu text. Sends to Supabase Edge Function for OCR + AI parsing via Gemini 2.5 Flash. Returns structured dish data (name, description, ingredients, allergens, calories, tags, category)
4. **Results** (`/results`) — Scores dishes against user profile (favorites +3, hated -5, allergens -10, restrictions -10). Shows top 3 recommendations with reasoning. Lazy-loads AI-generated dish images via Gemini image model
5. **Admin** (`/admin`) — Cache clearing for menu parses and dish images
6. **Caching** — SHA-256 hashing of menu input → Supabase cache table. Dish images cached by name+description
7. **Ingredient category mapping** — Expands high-level categories (e.g., "meat" → chicken, beef, pork...) for smarter matching

### ⚠️ Partially Working / Concerns

- **Profile is ephemeral** — stored in browser state only (passed via navigation state between routes). No persistence. Refresh = lost
- **Menu parsing** depends entirely on Lovable AI Gateway (LOVABLE_API_KEY) — vendor-locked
- **Image generation** uses Gemini image preview model via Lovable gateway — same vendor lock
- **Scoring is deterministic but simplistic** — just ingredient/tag matching with fixed weights. No learning, no user history
- **RLS is permissive** — `menu_parse_cache` allows anyone to read AND insert. No auth required

### ❌ Not Working / Placeholder

- **Chat** (`/chat`) — "Coming soon" placeholder only
- **No authentication** — no login, no user accounts, no Supabase Auth
- **No payment/monetization** — zero billing, subscription, or Stripe code
- **No user data persistence** — profiles aren't saved to DB
- **No restaurant management** — no restaurant accounts, menu management, or dashboard
- **No sharing/social** — can't share recommendations

---

## Database Schema

Only 2 tables — both are caches:

### `menu_parse_cache`
- `image_checksum` (TEXT) + `model_name` (TEXT) → unique key
- `parsed_result` (JSONB) — structured dish array
- Public read/write RLS (no auth)

### `dish_images`
- `dish_name` (TEXT) + `dish_description` (TEXT) → unique key
- `image_url` (TEXT) — generated image URL
- Public read, service-role write

**Notable absence:** No `users`, `profiles`, `restaurants`, `menus`, `orders`, `subscriptions` tables.

---

## What's Needed for MVP (Shippable Product People Pay For)

### Must-Have (MVP)

1. **User authentication** — Supabase Auth (email + Google/Apple social login). Gate the core flow behind sign-up
2. **Persistent user profiles** — Save allergy/restriction/preference data to a `profiles` table. Load on return visits
3. **Usage tracking/limits** — Count menu scans per user. Free tier (e.g., 3 scans/day) + paid tier
4. **Stripe integration** — Payment for premium features (unlimited scans, saved menus, history)
5. **Menu history** — Save parsed menus and recommendations. Let users revisit past restaurant analyses
6. **Mobile responsiveness audit** — The app's primary use case is in-restaurant on a phone. Must be flawless on mobile
7. **Error handling** — Better error states for failed OCR, API errors, empty menus
8. **Remove Lovable AI Gateway dependency** — Switch to direct OpenAI/Google API calls for portability

### Should-Have (Post-MVP)

9. **AI Chat** (`/chat`) — Conversational interface about menu options (the placeholder exists)
10. **Restaurant-side features** — Restaurant accounts, menu management, QR code generation
11. **Sharing** — Share recommendations via link or social
12. **Multi-language support** — Menu OCR already handles multiple languages, but UI is English-only
13. **PWA** — Add to homescreen, offline profile access
14. **Analytics** — What dishes are popular, allergen frequency, user demographics

### Nice-to-Have

15. **Group dining** — Combine multiple profiles to find dishes everyone can eat
16. **Price awareness** — Factor in menu prices
17. **Nutritional detail** — More than just calorie estimates
18. **Review/rating system** — Rate recommendations after trying them

---

## Monetization Readiness

**Current state: Zero.** No auth, no payment, no usage limits.

### Recommended Monetization Model

**Freemium SaaS** targeting individual diners:
- **Free tier:** 3 menu scans/day, basic profile, top 3 recommendations
- **Premium ($4.99/mo or $39.99/yr):** Unlimited scans, saved history, AI chat, dish images, group dining

**Alternative/complementary:** B2B for restaurants
- Restaurants pay to have their menus pre-loaded and optimized
- QR code on table → direct to pre-parsed menu with personalized recommendations
- White-label option for restaurant websites

### Implementation Path
1. Add Supabase Auth → user table
2. Add usage counter (scans_today column or separate table)
3. Integrate Stripe Checkout for subscription
4. Webhook to update user subscription status
5. Gate features behind subscription check

---

## Deployment Options Beyond Lovable

| Option | Effort | Cost | Notes |
|--------|--------|------|-------|
| **Vercel** | Low | Free tier generous | React SPA deploys trivially. Keep Supabase for backend. |
| **Netlify** | Low | Free tier generous | Same as Vercel. Auto-deploy from GitHub. |
| **Cloudflare Pages** | Low | Free | Fast global CDN. Edge functions available. |
| **Railway** | Medium | ~$5/mo | Full-stack option if you want to move off Supabase Edge Functions |
| **Fly.io** | Medium | ~$5/mo | Good for edge deployment near users |
| **Self-hosted VPS** | High | ~$5-10/mo | Full control but more ops work |

**Recommended:** Vercel or Netlify for frontend + keep Supabase for DB/auth/edge functions. Replace Lovable AI Gateway with direct API calls to Google AI (Gemini) or OpenAI.

**Key migration tasks:**
1. Replace `ai.gateway.lovable.dev` calls with direct Gemini/OpenAI API endpoints
2. Move LOVABLE_API_KEY → your own Google AI / OpenAI API key
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as env vars in new host
4. Deploy static build (`npm run build` → `dist/`)

---

## Priority Build List

| # | Task | Effort | Impact | Category |
|---|------|--------|--------|----------|
| 1 | **Add Supabase Auth** (email + social login) | Medium | Critical | Auth |
| 2 | **Persistent profiles** table + save/load | Medium | Critical | Data |
| 3 | **Replace Lovable AI Gateway** with direct Gemini API | Medium | Critical | Independence |
| 4 | **Mobile UX audit + fixes** | Low-Med | High | UX |
| 5 | **Error handling & loading states** | Low | High | UX |
| 6 | **Usage tracking** (scans per user) | Low | High | Monetization |
| 7 | **Stripe subscription** integration | Medium | High | Monetization |
| 8 | **Menu history** (save parsed menus) | Medium | Medium | Feature |
| 9 | **Deploy to Vercel/Netlify** | Low | Medium | Ops |
| 10 | **AI Chat feature** | High | Medium | Feature |
| 11 | **Restaurant accounts + QR codes** | High | Medium | B2B |
| 12 | **PWA support** | Low | Medium | Mobile |
| 13 | **Group dining mode** | Medium | Low | Feature |
| 14 | **Analytics dashboard** | Medium | Low | Insight |

---

## Architecture Notes

- **State management gap:** Profile data flows via React Router's `navigate(path, { state })`. This is fragile — browser refresh loses everything. Must move to persistent storage (Supabase + React Query) ASAP.
- **Edge function coupling:** All 5 edge functions use `LOVABLE_API_KEY` and `ai.gateway.lovable.dev`. This is the single biggest vendor lock-in risk.
- **Scoring algorithm** is purely rule-based (no ML). This is fine for MVP but limits personalization.
- **No tests.** Zero test files in the repo. Adding tests before major refactoring would be wise.
- **Heavy UI library:** ~50 shadcn/ui component files imported, many unused. Consider tree-shaking or removing unused components to reduce bundle.
