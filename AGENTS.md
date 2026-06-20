# AGENTS.md — Operating notes for AI coding agents

This document is the operating manual for any AI coding agent touching this repo. Read it **before** opening a file. If the user gives you a task that contradicts an entry below, ask before proceeding.

For what the product is, see `README.md`. For where things live in the codebase, see `project.md`. This file is about **how you should behave** while working on it.

---

## 0. You are on a live civic-information project

`get_Involved_next` is a non-partisan directory + election watch tool for Nigerian voters. The bar is:

- **No fabricated facts**. If a claim is unverified, render it as unverified. Never paste fake polling-unit counts, fake candidate names, or fake vote tallies as if they were real.
- **No partisan framing**. Never side with a party, candidate, or faction in copy. Candidates and parties are listed, not endorsed.
- **Accessibility**. The Election Watch feed is for everyone, including people on slow connections and assistive tech. Use anchors, live regions, mono microcopy, ARIA roles.
- **Premium feel**. The directive is "declassified local-newspaper archive" — restrained type, mono metadata, hairlines. Do not import the generic-AI dashboard look (rounded-everything + gradient shadows + rainbow chips).

If the user asks you to invent data for demo or "placeholder" purposes (e.g. mock election feed), that is fine **only if labeled ** as mock and only inside this codebase's seeded demo. Never publish that data through public APIs or copy-paste it into a candidate profile.

---

## 1. Slice-first delivery

The repo uses a **slice-first** delivery cadence. A "slice" is a thin, vertical, end-to-end usable thing the user can see and click in production.

**Rules for slices:**

1. **A slice is always view > post > moderation.** Build what the user can see first. Posting is a follow-up slice that hardens the surface (auth, validation, anti-abuse). Moderation is a third slice that lands on top.
2. **Mock data is expected in the view slice.** Use seeded mocks that look real enough to test, then replace them with Supabase calls in the next slice. Do not stage all three slices at once.
3. **Don't refactor existing features inside a slice.** A slice touches only the new surface area. If a refactor is unavoidable (the user explicitly asks, e.g. "also extract `lib/election-utils.ts`"), say so and ask before doing it.
4. **Don't ship a slice that "almost works".** Either it ships or you go back. Half-working UI is worse than no UI here.
5. **Document the slice in `project.md` as you build it.** The "Feature surface" section in `project.md` is the live catalogue of slices. Update it.

---

## 2. Research before you code

The repo follows `README.md → project.md → component file → styles file → server data layer`. Read in that order before opening an editor.

Research output expectations:

- **Always read the existing patterns.** If you want to add a new dropdown, read `DropdownSelect.tsx` first — there is likely one already. If you want to add a filter, read `PollingUnitSearchForm` in `PollingUnitWatchClient.tsx` first.
- **Always read the design tokens.** Open `src/styles/tokens.css`. Use tokens, never new color/spacing literals.
- **Always check existing server actions / fetchers.** Do not open a second Supabase client; use the existing ones in `src/lib/content-store.server.ts` and `src/app/actions/polling-units.ts`.
- **Always check the typography scale.** If you want a "small label", use `ds-eyebrow` (mono, uppercase). If you want a heading, use a Chakra Petch family via `ds-page-title` or `--ds-font-display`.

---

## 2.5 Data layer — geography topology vs facts (READ before adding geo_* code)

The Supabase schema exposes the State → LGA → Ward → Polling-Unit chain as **two distinct shapes that look similar but are not interchangeable**:

| Type | Tables | Purpose | Read pattern |
|---|---|---|---|
| **Topology** | `geo_states`, `geo_lgas`, `geo_wards` | "What belongs to what." Reference rows only. | Derived cascading dropdowns. Joins walk the chain (e.g. `getPollingUnitWards`). |
| **Fact table** | `polling_units_core` | "What is." One row per polling unit, anchored to `geo_wards.id` via FK. | NEVER queried directly for cascading dropdowns — that would lead you to invent a non-existent `geo_polling_units` table. |
| **Read view** | `polling_units` (SQL view) | Denormalized projection of `polling_units_core` + `geo_wards` + `geo_lgas` + `geo_states`. Columns: `state_slug`, `lga`, `ward`, `polling_unit_code`, `polling_unit_name`, `address`, `latitude`, `longitude`. | **Always use this view for polling-unit reads.** Single `SELECT`, no joins, fastest path. Canonical example: `src/lib/content-store.server.ts:getPollingUnits`. |

**Anti-patterns to avoid:**

- ❌ Don't assume `geo_polling_units` exists. It does not. Polling-unit rows live in `polling_units_core`, exposed through the `polling_units` view.
- ❌ Don't write a polling-unit fetcher that walks `geo_*` tables via nested joins — there is no topological tier for polling units, so the join will fail.
- ❌ Don't add a `geo_*` table for polling units. The schema topology ends at `geo_wards`; below that, it's a fact-table anchor.

**Read order before adding geographic code:**

1. `supabase/schema.sql` — confirm what the schema actually defines.
2. `src/lib/content-store.server.ts:getPollingUnits` — canonical read pattern.
3. `src/app/actions/polling-units.ts` — canonical cascading-dropdown pattern (states/LGAs/wards).
4. `src/data/nigeria.js` — static fallback for state/LGA only.

The `CONTRIBUTING.md` in the repo root has the same checklist in human-friendly language.

---

## 3. Component & file conventions you must follow

These are the rules from `project.md`, repeated here because they are about **how you behave**:

- One component per file unless trivially small.
- Per-feature folders live under `src/components/<feature>/`. Add an `index.ts` barrel.
- Client components MUST start with `"use client"`. Server components MUST NOT.
- Props: type inline (`type Props = {…}`), no `React.FC`, no `any`.
- Server-only code MUST use `@supabase/supabase-js` from the secret-key env, not the public one.
- Never call `localStorage` or `window` at module top-level. Guard with `typeof window !== "undefined"` or put the call inside `useEffect`.
- Effects that register timers / listeners MUST return a cleanup function.
- Don't use the `set_output` tool. Don't use a CSS-in-JS library. Don't import a UI framework.

---

## 4. CSS conventions

- All new components compose from `tokens.css` + `design-system.css` + `page.css`+.
- New per-feature CSS files go to `src/styles/<feature>.css` and are imported by `src/app/globals.css`'s `@import` chain.
- BEM-ish names: `.feature-name__element--modifier`.
- No Tailwind. No inline `style={{ color: "#xxxxxx" }}` color literals — always a token via `var(--ds-color-...)`. (Layout-only inline styles like `marginTop: "1rem"` are tolerated only in pages where a token would be a stretch.)
- Dark mode rules go under `html[data-theme="dark"]` in the same file.

---

## 5. The mock-data contract (specifically for the Election Watch slice)

This is the active contract until the Posting journey slice lands:

- Mock messages are authored in `src/components/election-feed/mockMessages.ts`.
- Each message references a **real** polling-unit hierarchy (State → LGA → Ward → Polling Unit), so filters stay meaningful.
- Mock cadence is set inside `useElectionFeedState.ts` (currently 9–14s random). It runs **only while the panel is open**.
- Cap at **40 messages**, oldest dropped from the head.
- When you swap the mock stream for a real React Query feed in the post-journey slice, do not delete mockMessages.ts; keep it but only import it in dev (`process.env.NODE_ENV !== "production"`).

If you find yourself adding fake vote counts, fake turnout percentages, or specific candidate names to mock messages, stop and ask the user. The mock dataset is **hand-curated civic micro-storytelling**, not invented outcomes.

---

## 6. Workflow expectations

When you receive a task:

1. **Spawn context-gatherers in parallel** (`file-picker`, `code-searcher`, `researcher_docs`). Don't open files speculatively.
2. **Read what they find** with `read_files`. Don't skim.
3. **Plan with `write_todos`**. A 3+ step task needs a todo list. Order matters: explore → plan → implement → review → typecheck → browser-test.
4. **Implement with `str_replace` or `write_file`** — use `str_replace` for targeted edits inside existing files (faster, more feedback), use `write_file` for new files or full rewrites.
5. **Typecheck** with the appropriate command — for Next.js, `npx tsc --noEmit` is the minimal viable check; `npm run build` is the strongest. Pick the lightest that proves your change.
6. **Spawn `code-reviewer-minimax-m3`** in parallel with typecheck, after code changes are complete. Don't skip this for "minor" changes — the user has said the slice is shipping today, so quality is critical.
7. **Browser-test** with `browser_use` when the change has a visible UI surface. Don't rely on typecheck alone for visual work.
8. **Summarize in one sentence** at the end. The user reads the diff and the summary is the recap.

If you can't finish, say what's left. Don't pretend.

---

## 7. Decision-making

The user is product-savvy and will give big-picture intent rather than step-by-step specs. When the intent is clear and the path is obvious, **just do it**. When the intent is clear but the path has 2+ reasonable options, **ask the user with `ask_user`** before pivoting. When the intent is unclear, **ask first, code never**.

The user has explicitly said "we are not validating an idea; the idea is already validated; we are just implementing." That means:

- Pick the cleaner architecture over the more conservative one when both work.
- Ship the polish (motion, captions, hover micro-details) **on the first cut** — they have asked for it on prior slices.
- Stand on existing components (e.g. `DropdownSelect`, `ds-eyebrow`, `ds-button`) rather than rolling your own.

If you are about to make a choice that the user has not weighed in on and the choice is irreversible (e.g. schema migration, deleting a file), **stop and ask**.

---

## 8. Current shipping focus — Election Watch view slice

As of today:

- **What is shipping**: the Election Watch floating widget. Floating button → expanded panel → IG-live message feed with mono timestamps, polling-unit anchors, tag chips. Top filter row: State → LGA → Ward → Polling Unit. Mock cadence from `useElectionFeedState`.
- **What is NOT shipping yet**: the post journey, the AI tag-suggestion engine, the polling-unit join step. These are deliberate next slices.
- **Active feature files** (find these when extending):
  - `src/components/election-feed/ElectionFeedWidget.tsx`
  - `src/components/election-feed/ElectionFeedFab.tsx`
  - `src/components/election-feed/ElectionFeedPanel.tsx`
  - `src/components/election-feed/ElectionFeedMessage.tsx`
  - `src/components/election-feed/useElectionFeedState.ts`
  - `src/components/election-feed/mockMessages.ts`
  - `src/styles/election-feed.css`
  - `src/app/layout.tsx` (mount point)
  - `src/app/providers.tsx` (do **not** edit; the widget just consumes it)
- **Recent docs**: `README.md` and `project.md` were updated today with this slice. Any future slice's contract should land in `project.md`'s "Feature surface" section.
- **Geography data layer convention**: documented at the top of `supabase/schema.sql`, in AGENTS.md §2.5, and in `CONTRIBUTING.md`. Read those before adding any geo_* server action.

If you are reading this because you were just spawned on a different task, **read `README.md` and `project.md` first.** Then come back here for behavior. Then read the relevant section of code (or spawn `file-picker` to locate it).
