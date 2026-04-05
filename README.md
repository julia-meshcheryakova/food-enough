# Food Enough – AI Waiter & Menu Assistant

Your AI-powered dining assistant. Upload a menu, get personalised dish recommendations based on your dietary profile.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173

## Required Services

### Supabase
Create a project at [supabase.com](https://supabase.com) and set:
- `VITE_SUPABASE_URL` — your project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — your anon/public key

### Google AI API Key (for Gemini)
Set `GOOGLE_AI_API_KEY` as a **Supabase Edge Function secret** (not in `.env`):
```bash
supabase secrets set GOOGLE_AI_API_KEY=your_key
```
This powers menu parsing and dish image generation via Supabase Edge Functions.

## SQL Migrations

Run these in your Supabase SQL editor (in order):
1. `supabase/migrations/001_profiles.sql` — user profiles table + RLS
2. `supabase/migrations/002_usage.sql` — usage tracking table + RLS
3. `supabase/migrations/20251101130013_*.sql` — menu parse cache table
4. `supabase/migrations/20251101151942_*.sql` — dish image cache table

## Edge Functions

Deploy with `supabase functions deploy`:
- `parse-menu` — OCR + AI menu parsing (Gemini)
- `recommend-dishes` — rule-based dish scoring + ranking
- `generate-dish-image` — AI dish image generation (Gemini)
- `clear-menu-cache` — admin: clear parse cache
- `clear-dish-image-cache` — admin: clear image cache

## Features

- **Landing page** with pricing (Free vs Premium)
- **Auth** — email/password + Google OAuth via Supabase
- **Profile** — dietary restrictions, allergens, favourites, goals
- **Menu upload** — photo or text, parsed by Gemini AI
- **Smart recommendations** — top 3 dishes scored against your profile
- **AI dish images** — generated visuals for recommended dishes
- **Usage tracking** — 5 free analyses/month, paywall for premium
- **Responsive** — works on mobile and desktop

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Google Gemini AI (via Supabase Edge Functions)
