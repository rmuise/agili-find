# AgiFind

> Find AKC, USDAA, CPE, NADAC, UKI, and CKC dog agility trials in one place.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + CSS custom properties
- **Supabase** (target — not yet wired)
- **Vercel** (deployment target)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page + trial preview cards |
| `/trials` | Search results with filter sidebar |
| `/trials/[id]` | Trial detail with tabs + registration |

## Key files

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All TypeScript types |
| `src/lib/data.ts` | Mock trial data + helpers |
| `src/styles/globals.css` | Design tokens (CSS variables) |
| `AGIFIND_CLAUDE_CODE_PROMPT.md` | Full Claude Code context prompt |

## Next steps

See `AGIFIND_CLAUDE_CODE_PROMPT.md` for the full Phase 1 build roadmap including
Supabase integration, scrapers, auth, and email alerts.
