# Get Involved — Technical Architecture Document

> **Project**: Get Involved | Know Your Candidates  
> **Stack**: Next.js 16 (App Router) + TypeScript + Supabase + Sanity CMS  
> **Domain**: Nigerian Political Candidate Directory  
> **Last Updated**: July 5, 2026  

---

## 1. Overview

**Get Involved** is a public candidate directory built for Nigeria's elections. It allows voters to search for candidates by name, office, party, state, and local government area (LGA) to understand who is on the ballot and under which party.

The application is a server-side rendered (SSR) Next.js 16 app using the App Router, with Supabase (PostgreSQL) as the primary data store and Sanity CMS as a headless content management layer for editorial workflows.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Next.js   │  │ TanStack     │  │ Supabase Browser  │ │
│  │ App Router│  │ React Query  │  │ Client (read-only)│ │
│  └──────────┘  └──────────────┘  └───────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────┐
│                 Next.js Server (Node.js)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Server      │  │ API Routes   │  │ Server Actions │ │
│  │ Components  │  │ /api/studio/*│  │ (submit forms) │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │         content-store.server.ts                    │ │
│  │    (Data access layer — Supabase queries)          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│   Supabase      │      │  Sanity CMS      │
│  (PostgreSQL)   │      │  (Content Studio) │
│                 │      │                   │
│ • parties       │      │ • Publish hooks   │
│ • profile       │      │   sync to Supabase│
│ • candidates    │      │ • /studio route   │
│ • candidate     │      │ • Auth-protected  │
│   applications  │      │                   │
│ • election_facts│      │                   │
└─────────────────┘      └──────────────────┘
```

### 2.1 Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **SSR with force-dynamic** | All candidate pages are `force-dynamic` to serve fresh data on every request. No stale caching for election data. |
| **Supabase for primary storage** | PostgreSQL with RLS, real-time, and a generous free tier. Used both server-side (service key) and client-side (anon key). |
| **Sanity CMS for editorial** | Headless CMS for content editors. Publish actions trigger Supabase sync via custom `wrapPublishWithSupabaseSync`. |
| **TanStack React Query** | Client-side state management with `staleTime: Infinity` and `refetchOnWindowFocus: false` — data is refreshed via SSR navigations, not polling. |
| **Pure CSS design system** | No CSS framework. Custom design tokens (`--ds-*` CSS variables) in `tokens.css`, component styles in `design-system.css`, page layouts in `page.css`. |
| **Static geo data** | Nigeria's 36 states + FCT and 774 LGAs are bundled as a static JS file (`src/data/nigeria.js`) — no DB query needed. |

---

## 3. Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage (SSR) → HomeClient.tsx
│   ├── layout.tsx                # Root layout (metadata, Providers)
│   ├── globals.css               # CSS entry point
│   ├── providers.tsx             # TanStack Query provider
│   ├── candidates/               # /candidates route
│   │   ├── page.tsx              # List view (SSR, filterable)
│   │   ├── CandidateClient.tsx   # Client component (filters, pagination)
│   │   └── [id]/page.tsx         # Single candidate detail
│   ├── states/                   # /states route
│   │   ├── page.tsx              # States browser (SSR)
│   │   └── StatesClient.tsx      # Split-pane desktop + accordion mobile
│   ├── search/                   # /search → delegates to CandidateClient
│   ├── submit-candidate/         # /submit-candidate route
│   │   ├── page.tsx              # SSR (loads parties, positions, states)
│   │   └── SubmitCandidateClient.tsx  # Form with validation + TanStack mutation
│   ├── about/                    # /about (force-static)
│   ├── report/                   # /report (force-static)
│   ├── studio/                   # Sanity Studio embedded route
│   │   ├── (protected)/          # Auth-gated studio
│   │   └── login/                # Studio login page
│   ├── actions/                  # Server Actions
│   │   └── submit-candidate.ts   # Inserts into Supabase + fires webhook
│   └── api/studio/               # API routes for Sanity sync
│       ├── candidates/           # CRUD for candidates
│       ├── parties/              # CRUD for parties
│       ├── profiles/             # CRUD for profiles
│       └── upload/               # File upload handler
├── components/                   # Reusable UI components
│   ├── SiteHeader.tsx            # Sticky nav: Search, States, Candidates, Submit, About, Report
│   ├── SiteFooter.tsx            # 3-column footer with links + colophon
│   ├── Wordmark.tsx              # "Get Involved · Know Your Candidates" brand mark
│   ├── PageBreadcrumb.tsx        # Breadcrumb navigation
│   ├── CandidateCard.tsx         # Full candidate card (photo, logo, party, office, state/LGA, sources)
│   ├── SafeCandidateCard.tsx     # Error-boundary-wrapped CandidateCard
│   ├── SearchFilter.tsx          # Homepage search (query + state + LGA dropdowns)
│   ├── DropdownSelect.tsx        # Custom accessible dropdown with type-to-filter
│   ├── Pagination.tsx            # Page navigation with truncation
│   ├── EvidenceCard.tsx          # Tilted fact/candidate card (homepage carousel)
│   └── ComponentErrorBoundary.tsx # React class-based error boundary
├── hooks/                        # Custom React hooks
│   ├── useCarouselIndex.ts       # Auto-advancing carousel with manual interaction
│   ├── usePagination.ts          # Page state with reset-on-dependency-change
│   ├── useUrlSyncedState.ts      # Generic URL ↔ state bidirectional sync
│   └── useCandidateDirectoryFilters.ts  # Filters with URL sync + derived options
├── lib/                          # Server-side utilities
│   ├── content-store.server.ts   # **Primary data access layer** — Supabase queries
│   ├── candidateSearch.ts        # URL param builder for candidate search
│   └── queryKeys.ts              # TanStack Query key factory
├── utils/
│   ├── supabase/                 # Supabase client factories
│   │   ├── server.ts             # Server client (cookies-based)
│   │   ├── client.ts             # Browser client
│   │   └── middleware.ts         # Middleware client + session refresh
│   └── formatters.ts             # Position name formatting (e.g. "house-of-reps" → "Federal House of Reps")
├── data/                         # Static/bundled data
│   ├── nigeria.js                # 36 states + FCT, 774 LGAs, capitals, zones, slogans
│   ├── submissions.js            # Report submission webhook helper
│   └── directoryOptions.js       # Async wrappers for state/LGA fetching
├── types/
│   └── domain.ts                 # TypeScript types: Candidate, Party, Fact, State, Submissions
├── constants/
│   └── nigeria.ts                # Sorted states derived from nigeria.js
├── styles/
│   ├── tokens.css                # Design tokens (--ds-*) + @font-face declarations
│   ├── design-system.css         # Component-level CSS (cards, buttons, dropdowns, forms, pagination)
│   └── page.css                  # Page layouts (hero, about, states, submit, footer, responsive)
├── proxy.ts                      # Next.js middleware → Supabase session refresh
└── sanity/                       # Sanity CMS schema + publish hooks
    └── (omitted from tree — integrated via sanity.config.ts)
```

---

## 4. Data Layer

### 4.1 Supabase Schema (PostgreSQL)

Five tables with Row Level Security enabled:

| Table | Purpose | RLS |
|---|---|---|
| `parties` | Political parties (id slug, name, abbreviation, logo) | Public read, auth write |
| `profile` | Real people (one person can have multiple candidacies) | Public read, auth write |
| `candidates` | One electoral run (person × election × race) with FK to profile & parties | Public read, auth write |
| `candidate_applications` | User-submitted candidate proposals | Public read + public insert, auth write |
| `election_facts` | Carousel facts on homepage | Public read, auth write |

**Key schema decisions:**
- **Normalized**: Personal details live in `profile`, not `candidates`. Party info lives in `parties`. This avoids duplication and enables tracking a person across multiple elections.
- **JSONB history**: `profile` has `party_history` and `office_history` as JSONB arrays for fast reads of a person's career arc.
- **Idempotent DDL**: The schema SQL uses `create if not exists`, `add column if not exists`, and `drop policy if exists` — safe to re-run.

### 4.2 Data Access Pattern

```
Server Component (page.tsx)
  → content-store.server.ts
    → createClient(SUPABASE_URL, SERVICE_KEY)  // server-side, no RLS
    → .from("candidates").select("*").eq("display", true)
    → .from("profile").select(...)             // enrich with personal details
    → .from("parties").select(...)             // enrich with party info
    → mapSupabaseCandidate()                   // transform DB row → domain type
    → sort by position order → preferred parties → name
  → Return Candidate[] to client component
```

The service key is used server-side (bypasses RLS), while the anon key is used client-side (read-only, RLS-enforced).

### 4.3 Sanity CMS Integration

Sanity is mounted at `/studio` within the Next.js app. When an editor publishes a document (`candidate`, `party`, or `position` type), the custom `wrapPublishWithSupabaseSync` action syncs the published data to Supabase.

---

## 5. Routing & Pages

| Route | Render Strategy | Purpose |
|---|---|---|
| `/` | `force-dynamic` (SSR) | Homepage: hero search, facts carousel, stats marquee, candidate deck |
| `/candidates` | `force-dynamic` (SSR) | Directory: filterable candidate grid with pagination |
| `/candidates/[id]` | `force-dynamic` (SSR) | Single candidate detail |
| `/states` | `force-dynamic` (SSR) | States browser: desktop split-pane, mobile accordion |
| `/search` | `force-dynamic` (SSR) | Delegates to CandidateClient with no initial filters |
| `/submit-candidate` | `force-dynamic` (SSR) | Candidate submission form |
| `/about` | `force-static` | Static about page |
| `/report` | `force-static` | Static report/corrections page |
| `/studio` | Auth-protected | Sanity CMS studio |

---

## 6. Component Design

### 6.1 Design System

All styling is done with CSS custom properties (design tokens) defined in `tokens.css`:

- **Colors**: `--ds-color-ink` (near-black), `--ds-color-accent` (Nigerian green #008753), `--ds-color-paper`/`--ds-color-surface` (backgrounds)
- **Typography**: Chakra Petch (display), Inter (body), Space Mono (mono/eyebrow)
- **Spacing**: 8-step scale from `--ds-space-1` (0.25rem) to `--ds-space-10` (8rem)
- **Borders**: `--ds-rule-thin` (1px), `--ds-rule-medium` (2px), `--ds-rule-accent` (4px)

### 6.2 Key Components

**DropdownSelect**: A custom accessible dropdown with:
- Type-to-filter when open
- Proper ARIA attributes (`role="listbox"`, `aria-selected`)
- Hidden native `<select>` for form compatibility
- Three variants: `filter`, `field`, `compact`

**CandidateCard**: Displays party abbreviation, position badge, candidate name (linked), running mate, state/LGA links, party logo, profile picture, and sources.

**SearchFilter**: Homepage search with query input, state dropdown, and LGA dropdown (LGA options update when state changes).

**Pagination**: Page navigation with smart truncation (ellipsis for large page counts).

---

## 7. Hooks

| Hook | Purpose |
|---|---|
| `useCarouselIndex` | Auto-advances through facts; resets timer on manual interaction |
| `usePagination` | Manages current page, resets to page 1 when dependencies change |
| `useUrlSyncedState` | Generic hook: state ↔ URL search params bidirectional sync via `replaceState` |
| `useCandidateDirectoryFilters` | Combines URL-synced state with derived options (parties, positions, LGAs) and filtering logic |

---

## 8. Data Flow: Candidate Submission

```
User fills form in SubmitCandidateClient.tsx
  → Client-side validation (required fields)
  → TanStack useMutation calls submitCandidateApplication (Server Action)
    → Server Action (src/app/actions/submit-candidate.ts):
      1. Insert into Supabase candidate_applications table
      2. POST to NEXT_PUBLIC_FORMS_API_URL webhook
    → On success: show success view, reset form
    → On error: show error notice
```

**Security features:**
- Honeypot field (`website`) — hidden via CSS, if filled the submission is silently rejected
- Server Action runs server-side, accessing `SUPABASE_SECRET_KEY` (not exposed to client)

---

## 9. Responsive Strategy

Three breakpoints govern layout changes:

| Breakpoint | Target |
|---|---|
| `> 64rem` (1024px) | Desktop: full multi-column layouts |
| `38.75rem – 64rem` (620–1024px) | Tablet: 2-column grids, stacked hero |
| `< 38.75rem` (620px) | Mobile: single-column, accordion states, hidden nav items, compact cards |

**States page**: Desktop uses a two-column split-pane (state list | detail panel). Mobile switches to an accordion list with inline detail panels.

---

## 10. Performance Considerations

- **SSR for data pages**: All candidate pages use `force-dynamic` — no stale data served
- **Static geo data**: Nigeria's state/LGA data is bundled as a JS file — zero DB queries for dropdowns
- **TanStack Query staleTime: Infinity**: Client-side data is never refetched in the background — data freshness is guaranteed by SSR navigations
- **CSS-only design system**: No runtime CSS-in-JS overhead
- **Custom fonts in WOFF2**: Optimized web font format with `font-display: swap`

---

## 11. Current Gaps & Opportunities

### 11.1 Missing/Incomplete

| Area | Status |
|---|---|
| **Studio API routes** | Routes exist (`/api/studio/candidates`, `/api/studio/parties`, `/api/studio/profiles`, `/api/studio/upload`) but appear incomplete — referenced in file tree but contents not verified |
| **Sanity schema types** | `sanity.config.ts` references `./src/sanity/schemaTypes` and `./src/sanity/actions/publishAndSyncAction` — these files are not present in the source tree |
| **Error handling** | Server-side Supabase failures fall back to empty arrays (`return []`) — no error logging or user-facing error states beyond ComponentErrorBoundary |
| **Loading states** | No skeleton/loading UI between SSR navigations |
| **Testing** | No test files present (no Jest, Vitest, or Playwright configuration) |
| **TypeScript strictness** | `strict: true` in tsconfig but `allowJs: true` allows JS files without type checking |
| **Environment validation** | No startup validation of required env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, etc.) |

### 11.2 Hardening Opportunities

1. **Environment variable validation** — fail fast at startup if required env vars are missing
2. **Error boundary at layout level** — catch SSR/rendering errors gracefully
3. **API route authentication** — studio API routes should verify Supabase auth
4. **Input sanitization** — candidate submission form sanitizes on client but server action should also sanitize
5. **Rate limiting** — candidate submission endpoint has no rate limiting
6. **Metadata/SEO** — only the root layout has metadata; individual pages lack unique titles/descriptions/OG tags
7. **Type safety for Supabase responses** — currently using type assertions (`as unknown as CandidateRow`)
8. **CSS organization** — 3 large CSS files (>1000 lines combined) with some duplicated responsive patterns

### 11.3 Feature Opportunities

1. **Candidate comparison** — side-by-side comparison of candidates for the same office
2. **Saved searches / watchlist** — allow users to bookmark candidates or save filter combinations
3. **Ballot preview** — show a mock ballot for a given state + LGA
4. **Candidate timeline** — visualize party/office history from the `office_history` JSONB
5. **Social sharing** — Open Graph images for candidate profiles
6. **Analytics** — track which candidates/states are most searched
7. **RSS/API feeds** — public API for candidate data consumption
8. **Offline support** — PWA/service worker for low-connectivity areas

---

## 12. Environment Variables

| Variable | Used By | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Server & Client Supabase clients | Yes |
| `SUPABASE_SECRET_KEY` | Server-side data access (content-store, server actions) | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase SSR client (cookies/auth) | Yes |
| `NEXT_PUBLIC_FORMS_API_URL` | Webhook for candidate/report submissions | No (graceful fallback) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity CMS configuration | Only if using Sanity |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity CMS configuration | Only if using Sanity |

---

## 13. Development Commands

```bash
npm run dev      # Start Next.js dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
```

No test, lint, or format scripts are configured in `package.json`.
