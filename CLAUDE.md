# AgiliFind

Dog agility trial aggregator. Scrapes AKC, USDAA, CPE, NADAC, UKI, CKC, AAC, TDAA listings into a single searchable platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + CSS custom properties, shadcn/ui
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Auth:** Supabase Auth (email + OAuth)
- **Hosting:** Vercel
- **Scraping:** Cheerio-based scrapers extending `BaseScraper`
- **Maps:** Leaflet / react-leaflet
- **PDF:** jspdf
- **Email:** Resend
- **Testing:** Vitest (unit), Playwright (e2e)
- **Fonts:** Bebas Neue (headings), DM Sans (body)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
```

## Foundation Files (Single Source of Truth)

These files are the foundation layer. Every other file imports from them. Never redefine their contents elsewhere.

| File | What it owns |
|------|-------------|
| `src/lib/constants.ts` | Org metadata, hex colors, trial status types, sort options, levels, localStorage keys, API defaults |
| `src/types/trial.ts` | DB-aligned types: `OrganizationId`, `Trial`, `Venue`, `Organization` (snake_case) |
| `src/types/search.ts` | API response types: `TrialResult`, `SearchParams`, `SearchResult` |
| `src/types/filters.ts` | UI/filter types: `SearchFilters`, `DEFAULT_FILTERS`, `Notification`, `AlertPreferences`, `User` |
| `src/types/scraper.ts` | Scraper types: `ScrapedTrial`, `ScrapePageResult`, `ScrapeRunStats` |
| `src/lib/utils.ts` | `cn()`, `slugify()`, `formatDistance()`, `formatDateRange()`, `formatTrialDateRange()`, `getTrialStatus()`, `formatRelativeTime()`, `groupNotificationsByDate()` |
| `src/lib/nav.ts` | All nav link configs: `TOP_NAV_LINKS`, `QUICK_LINKS`, `SIDEBAR_NAV` |
| `src/lib/class-data.ts` | Agility class definitions per org with descriptions |
| `src/app/globals.css` | All CSS: tokens, light/dark themes, `.chip-*` classes, `.status-*` classes |

### Import rules

- **Org codes, colors, status labels** → `@/lib/constants`
- **DB trial types** → `@/types/trial`
- **API result types** → `@/types/search`
- **Filter/UI types** → `@/types/filters`
- **Scraper types** → `@/types/scraper`
- **Formatting, slugify, status computation** → `@/lib/utils`
- **Org chip/badge UI** → `@/components/ui/OrgChip` (unified, has `size` + `className` props)
- **localStorage keys** → `STORAGE_KEYS` from `@/lib/constants`
- **CSS colors** → use `var(--akc)`, `var(--cream)`, etc. Never hardcode hex in components.

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home — search + results (list/map toggle)
│   ├── layout.tsx              # Root layout, providers, fonts
│   ├── globals.css             # AUTHORITATIVE CSS (Tailwind v4 + tokens + chips + badges)
│   ├── api/                    # API routes
│   │   ├── trials/             # Main search (nearby_trials + count_trials RPC)
│   │   ├── judges/             # Judge CRUD + search
│   │   ├── saved-trials/       # Save/unsave trials
│   │   ├── schedule/           # Shared schedule
│   │   ├── cron/               # Scheduled jobs (scrape, email-digest, places-warm)
│   │   ├── providers/          # Service provider CRUD
│   │   ├── body-workers/       # Body worker CRUD
│   │   ├── seminars/           # Seminar CRUD
│   │   └── training-spaces/    # Training space CRUD
│   ├── trials/[id]/            # Trial detail page
│   ├── judges/[slug]/          # Judge profile page
│   ├── schedule/builder/       # Schedule builder + PDF export
│   ├── s/[shareId]/            # Public shared schedule
│   ├── login/, signup/         # Auth pages
│   └── ...                     # dashboard, alerts, settings, admin, etc.
│
├── components/
│   ├── search/                 # search-form, results-list, trial-card, judge-profile-card
│   ├── trials/                 # FilterDrawer, FilterSidebar, TrialCard (legacy)
│   ├── judges/                 # course-map-gallery, course-map-upload, judge-search
│   ├── auth/                   # login-form, signup-form, user-menu
│   ├── layout/                 # Navbar, DashboardSidebar, page-header
│   ├── map/                    # Leaflet map wrapper
│   ├── services/               # Provider cards, services panel
│   └── ui/                     # OrgChip, SaveButton, StatusBadge, etc.
│
├── lib/
│   ├── constants.ts            # CANONICAL: orgs, colors, statuses, levels, storage keys
│   ├── utils.ts                # CANONICAL: formatting, slugify, getTrialStatus
│   ├── nav.ts                  # CANONICAL: nav link configs
│   ├── class-data.ts           # CANONICAL: agility class definitions per org
│   ├── types.ts                # DEPRECATED: legacy re-exports for TrialCard migration
│   ├── data.ts                 # DEPRECATED: re-exports from utils.ts
│   ├── supabase/               # client.ts (browser), server.ts (SSR), admin.ts (service role)
│   ├── scrapers/               # base.ts + per-org scrapers + processor.ts
│   ├── geocoding/              # client.ts (browser), nominatim.ts (server), venue-cache.ts
│   ├── services/               # pdfExport, judgeNormalization, bodyWorkerExtractor
│   ├── hooks/                  # saved-trials-context, use-click-outside
│   ├── auth/                   # provider-auth
│   ├── geo.ts                  # Haversine distance, maps URL parsing
│   └── api-error.ts            # API error helper
│
├── types/
│   ├── trial.ts                # CANONICAL: DB-aligned Trial, Venue, Organization, OrganizationId
│   ├── search.ts               # CANONICAL: TrialResult, SearchParams, SearchResult
│   ├── filters.ts              # CANONICAL: SearchFilters, Notification, AlertPreferences, User
│   ├── judge.ts                # JudgeSearchResult
│   ├── body-worker.ts          # BodyWorker types + modalities
│   ├── scraper.ts              # ScrapedTrial, ScrapePageResult, ScrapeRunStats
│   └── services.ts             # Provider, PlaceCache, TrialServices types
│
├── db/migrations/              # SQL migrations 001–018 (authoritative)
└── middleware.ts               # Session refresh (no auth redirect — search is public)
```

## Design Rules

1. **Dark mode default**, light mode via `[data-theme="light"]`. All colors via CSS variables.
2. **No hardcoded hex in components.** Use CSS vars (`var(--cream)`) or Tailwind tokens.
3. **Org chips:** Use `<OrgChip orgId="akc" />` from `@/components/ui/OrgChip`.
4. **Status badges:** Use `.status-open`, `.status-low`, `.status-soon`, `.status-reg` CSS classes.
5. **48px minimum tap targets** on all interactive elements.
6. **16px minimum font** on inputs (prevents iOS Safari zoom).
7. **Mobile-first** at 375px, expand upward.
8. **Frosted glass nav** only: `.glass` class.
9. **Flat design** — no gradients, no heavy shadows.

## Key Architecture Decisions

- **Middleware does NOT redirect.** Search is fully public. Auth guards are per-page (`useAuth()` + `useEffect` redirect).
- **Trial search** uses Supabase RPC functions `nearby_trials` (PostGIS) and `count_trials` (pagination total), called in parallel.
- **Scrapers** all extend `BaseScraper` which handles rate limiting, robots.txt, retry with backoff.
- **Three Supabase clients:** browser (`client.ts`), SSR with cookies (`server.ts`), admin/service-role (`admin.ts`). This is intentional.
- **Provider tree:** `ThemeProvider > PreferencesProvider > ErrorBoundary > ToastProvider > AuthProvider > SavedTrialsProvider`

## Cron Jobs (vercel.json)

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| 04:00 UTC | `/api/cron/scrape` | Run all scrapers |
| 05:00 UTC | `/api/cron/places-warm` | Warm places cache |
| 13:00 UTC | `/api/cron/email-digest` | Send email digests |
| 14:00 UTC | `/api/notifications/check` | Check notification triggers |

## Remaining Technical Debt

### Two geocoding Nominatim callers

- `src/lib/geocoding/client.ts` — Browser-side, returns `GeoLocation`.
- `src/lib/geocoding/nominatim.ts` — Server-side with rate limiting, returns `GeocodingResult`.

Both hit the same Nominatim API. Intentionally split (client vs server), but result types could be unified.

### Two migration directories

- `src/db/migrations/` (001–018) — **authoritative**, complete.
- `supabase/migrations/` (4 files) — Partial/archive. Only `src/db/` should be used.

### Alerts not yet persisted

- `src/app/alerts/page.tsx` — Preferences panel is functional UI but doesn't save to Supabase yet. Notifications show empty state; no notifications table exists.

### Notifications table needed

- No `notifications` table in the DB yet. The email digest cron exists (`/api/cron/email-digest`) but real-time in-app notifications require a new table + subscription.

## What's Next

- Wire alert preferences to a `user_preferences` table in Supabase
- Build the notifications table and populate from cron jobs
- Unify geocoding result types between client.ts and nominatim.ts
- Clean up `supabase/migrations/` directory (archive or remove)
