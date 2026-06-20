# Project: Get Involved — Architecture & Conventions

This document is the source-of-truth for the **architecture**, **file structure**, **naming conventions**, and **feature surface** of `get_Involved_next`. Read this before adding or refactoring anything.

For the product itself, see `README.md`. For how AI agents should operate on this repo, see `AGENTS.md`.

---

## 1. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.x** App Router | Route handlers in `src/app/api/`, server actions in `src/app/actions/`. Server components by default. |
| UI runtime | **React 19.2** | New hooks + `useTransition`. Server actions are first-class. |
| Language | **TypeScript 6** | `strict` mode enabled. No `any`. |
| Data | **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) | Server-side `createClient` from `SUPABASE_SECRET_KEY`; client browser session via `NEXT_PUBLIC_SUPABASE_URL`. |
| Read cache | **TanStack React Query** | Pre-configured in `src/app/providers.tsx` with `staleTime: Infinity` + `refetchOnWindowFocus: false`. Read queries are wrapped in `useQuery`; mutations in `useMutation`. |
| Styling | **Custom CSS** (no Tailwind) | Tokens in `src/styles/tokens.css`; primitives in `design-system.css`; page-level styles in `page.css`. Per-feature CSS files are added when a feature grows. |
| Fonts | Self-hosted via `@font-face` | Chakra Petch (display), Inter (body), Space Mono (timestamps/metadata). Loaded from `public/assets/fonts/`. |

---

## 2. File layout

```
src/
├── app/                     # Routes & server-side code
│   ├── actions/             # Server actions ("use server") — thin pass-throughs to Supabase
│   ├── api/                 # Route handlers (where server actions aren't a fit)
│   ├── candidates/          # /candidates routes
│   ├── polling-units/       # /polling-units routes (consumes PollingUnitWatchClient.tsx)
│   ├── states/              # /states routes
│   ├── submit-candidate/    # /submit-candidate route
│   ├── report/              # /report route
│   ├── search/              # /search route
│   ├── about/               # /about route
│   ├── layout.tsx           # Root layout — Providers + SiteHeader + {children} + SiteFooter
│   ├── providers.tsx        # Client island: QueryClientProvider
│   ├── page.tsx             # Home page (server-rendered)
│   ├── HomeClient.tsx       # Home page (client island)
│   ├── globals.css          # Imports tokens + design-system + page
│   └── proxy.ts             # Next.js proxy/middleware
│
├── components/              # Reusable UI (per-feature folders encouraged for growth)
│   ├── election-feed/       # Election Watch widgets (floating fab, panel, message)
│   ├── CandidateCard.tsx
│   ├── SafeCandidateCard.tsx
│   ├── SearchFilter.tsx
│   ├── DropdownSelect.tsx
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   ├── EvidenceCard.tsx
│   ├── NigeriaStatesMap.tsx
│   ├── Pagination.tsx, ServerPagination.tsx
│   ├── ThemeToggle.tsx, PageBreadcrumb.tsx
│   └── ...
│
├── constants/               # Small, dependency-free config like `nigeria` state list
├── data/                    # Bundled geographic data (nigeria.js, nigeriaStatesSvg.ts)
├── hooks/                   # Cross-feature React hooks (usePagination, useUrlSyncedState, …)
├── lib/                     # Server + shared utilities (content-store.server, candidateSearch, etc.)
├── styles/                  # CSS: tokens.css, design-system.css, page.css + per-feature CSS
├── types/                   # Type aliases shared across the app (domain.ts)
└── utils/                   # Misc helpers (Supabase client/server/middleware, formatters)
```

Default alias: `@/*` resolves to `src/*`. Use it in imports.

---

## 3. Component conventions

- One component per file unless the component is a 10-line subcomponent used only by its sibling (then inline it).
- Each per-feature folder has an `index.ts` barrel so imports stay flat: `import { ElectionFeedWidget } from "@/components/election-feed"`.
- Client components must begin with `"use client"` at the top of the file. Server components have no directive.
- Props are typed inline (`type Props = { … }`), not with `React.FC`. Never use `React.FC` — it locks the component to `displayName`-only typing.
- Never cast props/state to `any`. Use a discriminated union or a narrowed type. If the value is genuinely unknown, use `unknown` and narrow.
- Effects must include a cleanup return when they register timers, listeners, or subscriptions.
- Tailwind is not used. Compose primitives from `tokens.css` and the existing class system.

---

## 4. The CSS design system

The full token reference is in `src/styles/tokens.css`. Reuse tokens; never invent a new color or shadow value.

| Token class | What it is |
|---|---|
| `--ds-color-accent` | Nigeria green (`#008753` in light, `#17945a` in dark). The only saturated color in the app. Use for CTA, active bar, live indicator. |
| `--ds-color-ink*` | The ink scale (foreground/text). Always set the foreground via a token, never inline `#xxxxxx`. |
| `--ds-color-paper*` | Background scale, including the panel backdrop. |
| `--ds-font-display` | Chakra Petch — for headlines, big numerals, card labels. |
| `--ds-font-body` | Inter — default UI text. |
| `--ds-font-mono` | Space Mono — for "ds-eyebrow" microcopy, timestamps, tag chips, anything monospace. |
| `--ds-rule-thin / medium / accent` | Hairline (1px), standard (2px), and accent-rule (4px) border weights. Mix with `--ds-color-ink` or `--ds-color-accent`. |
| `--ds-motion-fast` / `--ds-motion-card` / `--ds-ease-standard` | Motion presets. Use `var(--ds-motion-fast) var(--ds-ease-standard)` for hover transitions. |
| `--ds-shadow-evidence` | The "evidence card" shadow — the only big shadow we use, reserved for primary cards and the Election Watch panel. |
| `--ds-color-night*` | Reserved dark-mode background scale; default in dark mode under `html[data-theme="dark"]`. |

### Class conventions

- Section CSS classes follow BEM-ish: `.feature-name__element--modifier`. Examples in the codebase: `polling-watch__search`, `home-explore__map`, `ds-candidate-card`.
- "Design-system" primitives begin with `ds-` (`ds-button`, `ds-eyebrow`, `ds-meta`, `ds-inline-link`, `ds-field`). Use these on every new screen.
- A new feature typically introduces one or more CSS files in `src/styles/` (e.g. `election-feed.css`), imported by `globals.css` (or by the root layout's `globals.css` import chain).
- Dark mode CSS sits under `html[data-theme="dark"]` blocks in the same file.

---

## 5. Data sources & server primitives

| Concern | Source |
|---|---|
| Candidates / parties | `src/lib/content-store.server.ts` (server) → Supabase `candidates`/`parties` tables (`getCandidates`, `getParties`). |
| Polling units | `src/lib/content-store.server.ts`: `getPollingUnits`, `getPollingUnitById`, plus `getPollingUnitStateStats`. |
| Geographic hierarchy (state / LGA / ward) | Server actions in `src/app/actions/polling-units.ts`: `getGeoStates`, `getPollingUnitLgas(state)`, `getPollingUnitWards(state, lga)`. |
| Static fallback for geography | `src/data/nigeria.js` (`nigeriaGeo`, `stateNames`, `getLgas(stateId)`, `getState(stateId)`). |
| Election facts | `getFacts()` from `content-store.server.ts` → `election_facts` table. |
| Saved polling unit (user, no account) | Browser `localStorage` key `get-involved:saved-polling-unit`, broadcast via `window.dispatchEvent(new CustomEvent("polling-unit-saved", { detail }))`. |

### Server-action / route-handler rules

- Anything under `app/actions/**` is `"use server"`. These are thin wrappers: validate inputs, query Supabase, return the cleaned Domain type.
- Anything under `app/api/**` is an HTTP route. Use only when the integration cannot be a server action (e.g., external webhook).
- Both must export exactly the helpers the client uses; do not leak Supabase rows. Always run them through the `map*` functions in `content-store.server.ts` to normalize shape.

---

### Geography data layer — topology vs facts (read once)

The Supabase schema exposes Nigeria's State → LGA → Ward → Polling-Unit chain as **two distinct shapes**:

- **Topology tables** (`geo_states`, `geo_lgas`, `geo_wards`) hold the SHAPE of the geography — "what belongs to what." Short reference rows. Cascading dropdowns walk this chain with `state_id`/`lga_id` joins.
- **Fact table** (`polling_units_core`) holds the RECORDS that hang off the topology. Each row is one polling unit anchored to `geo_wards.id` via FK. **There is no `geo_polling_units` tier** — polling units do not get a topology table at this level.
- **Read view** (`polling_units`) is the denormalized projection. It joins `polling_units_core → geo_wards → geo_lgas → geo_states` and exposes the column shape `state_slug`, `lga`, `ward`, `polling_unit_code`, `polling_unit_name`, `address`, `latitude`, `longitude`. **Application reads polling units via this view, not via a `geo_*` chain.** The canonical example is `src/lib/content-store.server.ts:getPollingUnits`.

#### Read order before adding geographic code

This is the canonical order for any agent or contributor adding a geo_* server action, cascading dropdown, or polling-unit fetch:

1. `supabase/schema.sql` — confirm what the schema actually defines.
2. `src/lib/content-store.server.ts:getPollingUnits` — canonical read pattern for polling units (the `polling_units` view).
3. `src/app/actions/polling-units.ts` — canonical cascading-dropdown pattern for states/LGAs/wards (`getGeoStates`, `getPollingUnitLgas`, `getPollingUnitWards`, `getPollingUnitsForWard`).
4. `src/data/nigeria.js` — static fallback (states + LGAs only; no ward/PU fallback).
5. `CONTRIBUTING.md` §1 — the same checklist in human-friendly language with the anti-pattern callouts.
6. `AGENTS.md` §2.5 — same rules in agent-operating-manual tone.

#### Anti-patterns

- ❌ Don't assume `geo_polling_units` exists. It does not. Polling-unit rows live in `polling_units_core`, exposed through the `polling_units` view.
- ❌ Don't write a polling-unit fetcher that walks `geo_*` tables via nested joins — there is no topological tier for polling units, so the join will fail.
- ❌ Don't add a `geo_*` table for polling units. The topology ends at `geo_wards`; below that, it's a fact-table anchor.

---

## 6. Feature surface — what lives where

### Polling Unit Watch (shipped)

- Public page: `/polling-units` (`src/app/polling-units/page.tsx` reads `searchParams`).
- Detail page: `/polling-units/[code]` (renders `PollingUnitActions` for save / share).
- Client islands: `src/app/polling-units/PollingUnitWatchClient.tsx` (search form, saved card, save/share actions). Uses React Query for LGA/ward cascading.
- Homepage tile: `home-watch` section in `HomeClient.tsx`.

### Candidate directory (shipped)

- Public page: `/candidates` with state / LGA / party / position filters.
- Detail page: `/candidates/[id]`.
- API surface for moderation: `src/app/api/studio/...` (read-only `GET` and edit `POST`/`PUT`).

### Election Watch — view slice (shipping today)

This is the feature you are most likely reading this file to extend. Architectural shape:

- **Mount point**: `src/app/layout.tsx` renders `<ElectionFeedWidget />` as a sibling of `{children}`, inside `<Providers>`. It is therefore visible on every page of the app.
- **Component tree**:
  - `ElectionFeedWidget.tsx` (entry) — owns the open/closed state, exposes the floating button and the panel.
  - `ElectionFeedFab.tsx` — the morphing button (green dot, "Election Feed" label, "live" badge).
  - `ElectionFeedPanel.tsx` — the expanded sheet: header (active election name), filter row (State → LGA → Ward → Polling Unit), live feed list, footer hint.
  - `ElectionFeedMessage.tsx` — one row of the IG-live list (mono timestamp, polling-unit anchor, text, tag chips).
  - `useElectionFeedState.ts` — custom hook: holds the message queue, the active filters, the IG-live scroll-anchoring logic, the cadence interval that simulates new posts for the demo.
  - `mockMessages.ts` — curated seed of ~20 hand-typed example messages used until the posting journey lands. Each message references a real Anambra State / LGA / Ward / polling unit so the filters stay meaningful.
- **Stylesheet**: `src/styles/election-feed.css`, imported by `src/app/globals.css`'s `@import` chain.
- **No external dependencies** were added for the view slice. The widget only consumes React (already in scope) + the `nigeriaGeo` / `getPollingUnitLgas` / `getPollingUnitWards` already on the server.

### IG-live scroll-anchoring contract

When the message queue mutates (new message added, message removed, filtered subset replaced):

1. Before state update, capture `wasAtBottom = scrollTop + clientHeight >= scrollHeight - 64px`.
2. Render the new queue.
3. If `wasAtBottom`, force `scrollTop = scrollHeight` (pinned-to-bottom).
4. Else, leave `scrollTop` untouched so the user can scroll up to read history without being yanked by a new arrival.

The `useElectionFeedState` hook is the only thing that should implement this. Consumers (the panel) just call `setFilter` / `setMessage` / etc.

### Cadence contract

- The widget seeds ~20 messages at mount (deterministic ordering, descending by posted time).
- A `useEffect` interval pushes one fresh mock message every **9–14 seconds** (random per cycle to feel organic).
- The visible queue is capped at **40 messages**; over-cap items are dropped from the head.
- The cadence runs only while the panel is open. It stops when the panel is closed.
- When the user filters to a specific polling unit and there is no matching mock, render a single "no updates from this unit yet" placeholder.

Everything in this contract is encapsulated inside `useElectionFeedState.ts`. The panel component never sets timers itself.

### Where the post journey will plug in

The view slice is intentionally a **read view**. The next slice (post journey) will:

1. Add `feedPosts` table in Supabase + a server action to publish (gated: user must have a saved polling unit).
2. Replace `useElectionFeedState`'s `useEffect` interval-driven mock stream with a React Query subscription (polling or Supabase Realtime — decide at slice time).
3. Add the `<ElectionFeedComposer>` at the bottom of the expanded panel (textarea, AI tag suggestion chips, "Attach to <saved polling unit>" footer).
4. Move the mock seed data into a `dev-only` import so demo builds keep working without the database.

When extending `ElectionFeedWidget`, do **not** couple the view component to any of (1)–(4) yet. Keep the seam at `useElectionFeedState.ts`.

---

## 7. Recent architectural decisions

- **State location for Election Watch**: in layout-level island (was: debated between page-level mount and layout-level mount). Landed on layout-level because the user must see the feed on every page.
- **Mock cadence**: not animation-based marquee, but JS-driven push at a low interval. The user explicitly asked for an Instagram-live feel, which is real pushes, not a CSS ticker.
- **Filter scope for polling units**: ward-level (last dropdown). Using `getPollingUnits({state, lga, ward, page: 1})` from the server. Not free-text search — `DropdownSelect`'s built-in search-within-list already covers that.
- **Theming**: the panel uses the same CSS-variable-driven theme as the rest of the app. No hard-coded `#000`/`#fff`. Verified against `html[data-theme="dark"]` blocks.
