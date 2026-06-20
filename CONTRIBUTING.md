# Contributing to Get Involved

Thanks for pitching in. This document is the short version of the conventions so newcomers (humans and AI agents) don't trip over the same things.

- For the architecture / file layout, see `project.md`.
- For the AI agent operating manual, see `AGENTS.md`.
- For the design system / tokens, see `src/styles/tokens.css`.

---

## 1. The geography data layer (read before touching any geo_* code)

The Supabase schema exposes Nigeria's State → LGA → Ward → Polling-Unit chain as **two distinct shapes that look similar but are NOT interchangeable**. This is the most common place to make a mistake — read carefully.

### What lives where

| Type | Tables | Purpose | Examples in this repo |
|---|---|---|---|
| **Topology tables** | `geo_states`, `geo_lgas`, `geo_wards` | The SHAPE of the geography — "what belongs to what." Short reference rows. | `getPollingUnitWards(state, lga)` walks this chain. |
| **Fact table** | `polling_units_core` | The RECORDS that hang off the topology — one row per polling unit, anchored to `geo_wards.id` via FK. | (write-only target; do not read directly) |
| **Read view** | `polling_units` | Denormalized projection of `polling_units_core` joined to the geo_* chain. Columns: `state_slug, lga, ward, polling_unit_code, polling_unit_name, address, latitude, longitude, …`. | `src/lib/content-store.server.ts:getPollingUnits` is the canonical read. |

### Anti-patterns

- ❌ **There is NO `geo_polling_units` table.** Don't invent one. Polling-unit rows live ONLY in `polling_units_core`, exposed through the `polling_units` view.
- ❌ **Don't write a polling-unit fetcher that walks `geo_*` tables via nested joins.** There is no topological tier for polling units, so the join will fail.
- ❌ **Don't add a `geo_*` table for polling units.** The topology ends at `geo_wards`; below that, it's a fact-table anchor.
- ✅ **Always read polling units via the `polling_units` view.** Single `SELECT`. Fast. Idempotent.
- ✅ **Always derive cascading dropdowns (state → lga → ward) via the existing server actions** in `src/app/actions/polling-units.ts`.

### Read order before adding geographic code

1. `supabase/schema.sql` — confirm what the schema actually defines.
2. `src/lib/content-store.server.ts:getPollingUnits` — the canonical read pattern.
3. `src/app/actions/polling-units.ts` — the canonical cascading-dropdown pattern (states/LGAs/wards).
4. `src/data/nigeria.js` — the static fallback (state + LGA only — no ward/PU fallback).
5. `AGENTS.md` §2.5 — same rules in agent-operating-manual tone.

---

## 2. Pull-request shape

We slice-first deliver. A slice is a thin, vertical, end-to-end usable thing the user can see and click in production. PRs should:

- Touch only the new surface area. Don't drive-by refactor existing features.
- Come with matching doc updates (`README.md`, `project.md`'s Feature surface, this `CONTRIBUTING.md` if you changed a convention).
- Include a typecheck (`npx tsc --noEmit`) and a browser-test walkthrough for visible UI.
- Never introduce a fabricated fact. Civic information is sacred — no fake polling-unit counts, no invented candidate names, no simulated vote tallies.

---

## 3. Asking the maintainer

The maintainer is product-savvy, ships fast, and weighs in by intent not spec. Decisions that are irreversible (schema migrations, deleting files, public API changes) should be raised **before** opening the PR, not in it.
