# Get Involved

**Know Your Candidates · Watch Your Polling Unit**

Get Involved is a non-partisan civic information platform for Nigeria. It is the canonical, source-cited directory of every candidate contesting for public office across the federation — and, on election day, the place where citizens can save the polling unit they'll vote at and follow community-reported updates from polling units across the country.

The product is for every Nigerian voter who wants to know exactly who is on their ballot before they step into a polling unit, and for every citizen standing in a polling station line who wants to see what is happening nearby. It is also for journalists, monitors, and civic organisations that need a single credible reference for what is up for election and where.

## What the product does

**1. Candidate directory (shipped).** Search every candidate in the federation by name, office, party, state, or local government. Open any candidate's profile, see their party affiliation, education, career, and the public sources the profile was built from. Submit corrections and missing profiles when you spot them.

**2. Polling Unit Watch (shipped).** Save the polling unit where you will vote on election day. The save lives in the user's browser (`localStorage`) — no account required — and the unit can be opened from any device the citizen uses on election day. Solve the million-times-asked question "where do I vote?" in under thirty seconds, anywhere, even on a low-bandwidth connection.

**3. Election Watch (shipping now — view-first slice).** A floating "Election Feed" button on every page of the app. Tap it once and the panel opens into a live feed of community updates tagged to specific State → LGA → Ward → Polling Unit locations. Anyone with the app can see the feed; the feed shows what is happening at polling units in real time. Filtering at the top narrows to a specific step in the hierarchy. Messages display poster name, monospace timestamp, polling-unit anchor, body, and any AI-summarised tag chips. The panel behaves like an Instagram Live list: older messages disappear at the top as new messages pop in at the bottom.

   In this slice we ship the **view only**: see the feed, filter by State / LGA / Ward / Polling Unit, watch new messages arrive in real time. The **post journey** (joining a polling unit to be allowed to post, and AI summarisation suggestions as you type) is the next slice and is intentionally not yet built — message bodies render as plain text plus a future-friendly `tags[]` array, ready for that.

## Why this matters

The premise of every free election is that citizens know who they can vote for and where. Both questions can be shockingly hard to answer in Nigeria today: candidate lists surface in scattered PDFs, last-minute court rulings reshuffle the ballot, and the polling-unit "where do I go" answer is often buried in a tool no one can find in the heat of election morning. Get Involved solves both at once, with a single source-cited directory that is also a place to see what is unfolding on the ground.

## Non-goals

- Get Involved is **not** an electoral management system. We are not INEC. We mirror and cite; we do not adjudicate results.
- Get Involved is **not** a partisan tool. We list every candidate and party that contests; we do not endorse.
- Get Involved is **not** a content moderation platform. Posting in the Election Watch is anchored to a real polling unit (in the next slice), so anonymous drive-by posting is structurally prevented, not after-the-fact moderated.

## Design language

Editorial, archival, civic. The directive is "this should feel like a fellowship of independent newspapers that happen to share a database." Three font families: Chakra Petch (display), Inter (body), Space Mono (timestamps and metadata). Nigeria green (`#008753`) is the only accent, used sparingly — for call-to-action, the active bar of a card, the live indicator in Election Watch. Hairlines and thin rules over heavy shadows; cards have top accent bars; mono microcopy powers every "eyebrow" label. Spacing is anchored to the design-system scale (`--ds-space-1` through `--ds-space-10`), not Magic Numbers.

Dark mode is a first-class state, swapped at the document level via the `theme` CSS custom property. All colors are tokens; raw `#hex` colours are not allowed in component CSS.

## Tech stack at a glance

- **Next.js 16** App Router (server components by default; `"use client"` islands only where needed).
- **React 19**, **TypeScript 6**.
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for candidates, polling units, election facts, and (in the next slice) election feed posts.
- **TanStack React Query** with `staleTime: Infinity` for read-mostly client data.
- **Custom CSS design system** in `src/styles/` (no Tailwind, no CSS-in-JS).
- Local geography fallback shipped in-repo at `src/data/nigeria.js` (36 states + FCT · 774 LGAs) so the app does not hard-fail when the database is briefly unavailable.

## Slice-cadence roadmap

| Slice | Status | Note |
|---|---|---|
| Candidate directory (search, profile, submit, report) | Shipped | — |
| Polling Unit Watch (save to localStorage, profile pages) | Shipped | — |
| **Election Watch — view** | **Shipping today** | Floating fab + ig-live feed + 4-tier filter; mock cadence |
| Election Watch — post journey | Next | Polling-unit join step + AI tag suggestions; layered on top of view slice |
| Election Watch — moderation / abuse controls | Planned, post-launch | Anchored to the polling-unit join step, not bolted on after |

## Local dev

```bash
npm install
npm run dev
```

The app boots clean against `localStorage` and the static geography fallback even without Supabase configured. To wire to a Supabase instance, copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SECRET_KEY`.

## Where the context lives

- `README.md` — this file. Product description and feature roadmap. Read first.
- `project.md` — architecture, file structure, naming conventions, the design system, data sources, and where each feature physically lives. Read **before** adding or refactoring code.
- `AGENTS.md` — operating notes for AI coding agents. Conventions, the slice-first delivery pattern, mock-data strategy, and review expectations. Read **before** any autonomous coding task on this repo.
