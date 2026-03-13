# AgiFind — Claude Code Kickoff Prompt

Paste this into Claude Code to bootstrap the project with full context.

---

## Project

**AgiFind** — a web-first dog agility trial aggregator that scrapes and consolidates
trial listings from AKC, USDAA, CPE, NADAC, UKI, and CKC into a single searchable
interface. The UI has been fully designed and the component scaffold is complete.

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + CSS custom properties (design tokens in `globals.css`)
- **Fonts:** Bebas Neue (display) + DM Sans (body) via `next/font/google`
- **Data:** Mock data in `src/lib/data.ts` — replace with real scraper/DB calls
- **Hosting target:** Vercel
- **DB target:** Supabase (not yet wired)

## Design system

Black (`#090909`) background. Electric yellow-green (`#e8ff47`) accent.
Frosted glass nav. Apple-inspired mobile UX — 48px tap targets, bottom sheet drawers,
safe area insets, 16px inputs to prevent iOS zoom.

All design tokens are CSS variables in `src/styles/globals.css`.
Org color classes (`chip-akc`, `chip-usdaa`, etc.) and status classes
(`status-open`, `status-low`, etc.) are pre-defined there — use them.

## File structure

```
src/
  app/
    layout.tsx          # Root layout, font setup, metadata
    page.tsx            # Landing / hero page
    trials/
      page.tsx          # Search results page
      [id]/
        page.tsx        # Trial detail page
  components/
    layout/
      Navbar.tsx        # Sticky frosted nav, mobile hamburger menu
    ui/
      OrgChip.tsx       # Org color badge (AKC, USDAA, CPE, etc.)
      StatusBadge.tsx   # Registration status pill
      SaveButton.tsx    # Star/save toggle
    trials/
      TrialCard.tsx     # Result card used on /trials
      FilterSidebar.tsx # Desktop filter panel
      FilterDrawer.tsx  # Mobile bottom sheet filter drawer
  lib/
    types.ts            # All TS types: Trial, OrgId, SearchFilters, etc.
    data.ts             # Mock trial data + utility helpers
  styles/
    globals.css         # Design tokens, org chip styles, status styles
```

## What's built

- [x] Landing page with hero, live trial previews, stats strip, features, footer
- [x] Search results page with sidebar filters, active filter chips, sort, pagination
- [x] Trial detail page with tabbed layout (Overview / Schedule / Judges / Venue)
- [x] Registration sidebar card with class selector, progress bar, deadline
- [x] Mobile-responsive: all three pages have full mobile layouts
- [x] Shared component library: OrgChip, StatusBadge, SaveButton, Navbar
- [x] TypeScript types for all data structures

## What needs building next (Phase 1 priorities)

### 1. Supabase integration
- Replace mock data in `src/lib/data.ts` with Supabase queries
- Schema: `trials`, `organizations`, `judges`, `venues`, `user_saved_trials`
- Add a `src/lib/supabase.ts` client

### 2. Scraper layer
- Build scrapers for each org (AKC, USDAA, CPE, NADAC, UKI, CKC)
- Normalize to the `Trial` type defined in `src/lib/types.ts`
- Run on a cron (Vercel cron jobs or Railway)
- Store results in Supabase

### 3. Real search
- Wire the search bar and filters to Supabase queries with postgis distance filtering
- URL-driven filter state (already partially wired with `useSearchParams`)

### 4. User auth + saved trials
- Supabase Auth (magic link or Google OAuth)
- Persist saved trials to `user_saved_trials` table
- Replace in-memory save state in `SaveButton.tsx`

### 5. Email alerts
- Resend or Postmark for "new trial near you" notifications
- User preference: org, distance radius, frequency

## Coding conventions

- All components are `'use client'` where they use state/effects
- Server components where possible (detail page can be async/server-rendered)
- Tailwind for layout/spacing, CSS variables for brand colors — don't hardcode hex
- Keep `globals.css` as the single source of truth for design tokens
- Mobile-first: start every component at 375px, expand upward

## Running locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Key types (for reference)

```ts
type OrgId = 'AKC' | 'USDAA' | 'CPE' | 'NADAC' | 'UKI' | 'CKC'
type TrialStatus = 'open' | 'low' | 'soon' | 'registering' | 'closed' | 'waitlist'

interface Trial {
  id: string
  name: string
  org: OrgId
  startDate: string       // ISO
  endDate: string         // ISO
  city: string
  province: string
  status: TrialStatus
  levels: string[]
  classes: TrialClass[]
  distanceKm?: number
  spotsRemaining?: number
  registrationCloses?: string
  entryUrl?: string
  judges?: Judge[]
  // ...see src/lib/types.ts for full shape
}
```
