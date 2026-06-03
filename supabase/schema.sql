-- ═══════════════════════════════════════════════════════════════════════════
-- Get Involved — Supabase Schema (Normalized)
-- Apply idempotently: safe to re-run after partial migrations.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Parties ─────────────────────────────────────────────────────────────────

create table if not exists public.parties (
  id           text        primary key,         -- stable slug, e.g. "apc"
  document_id  text        unique,              -- Sanity doc ID (migration)
  name         text        not null,
  abbreviation text        not null,
  logo         text,
  payload      jsonb       not null default '{}'::jsonb,
  updated_at   timestamptz not null default timezone('utc', now())
);

alter table public.parties
  add column if not exists document_id  text,
  add column if not exists name         text,
  add column if not exists abbreviation text,
  add column if not exists logo         text,
  add column if not exists payload      jsonb,
  add column if not exists updated_at   timestamptz;

update public.parties set
  name         = coalesce(name, id),
  abbreviation = coalesce(abbreviation, upper(id)),
  payload      = coalesce(payload, '{}'::jsonb),
  updated_at   = coalesce(updated_at, timezone('utc', now()));

alter table public.parties
  alter column name         set not null,
  alter column abbreviation set not null,
  alter column payload      set not null,
  alter column updated_at   set not null;

create index if not exists parties_name_idx on public.parties (name);

-- NOTE: Positions (President, Governor, Senator, etc.) are constitutionally
-- defined and do not change. They are stored as static data in:
--   src/data/positions.js
-- The candidate.position column stores the stable id (e.g. "governor").

-- ─── Profile ──────────────────────────────────────────────────────────────────
-- A Profile is a real person. One person can have many candidacies over time.
-- All personal details live here; nothing person-specific goes in candidates.

create table if not exists public.profile (
  id                  uuid        primary key default gen_random_uuid(),
  full_name           text        not null,
  slug                text        not null unique,
  -- Current snapshot (maintained by sync logic)
  current_party_id    text        references public.parties(id)    on delete set null,
  latest_election_year integer,
  last_known_position text,
  -- Personal details
  profile_picture_url text,
  age                 integer,
  contact_email       text,
  contact_phone       text,
  bio                 text,
  state_of_origin     text,
  profile_url         text,
  -- Structured history (derived, kept for fast reads)
  party_history       jsonb       not null default '[]'::jsonb,
  office_history      jsonb       not null default '[]'::jsonb,
  links               jsonb       not null default '[]'::jsonb,
  payload             jsonb       not null default '{}'::jsonb,
  updated_at          timestamptz not null default timezone('utc', now())
);

alter table public.profile
  add column if not exists full_name            text,
  add column if not exists slug                 text,
  add column if not exists current_party_id     text,
  add column if not exists profile_picture_url  text,
  add column if not exists age                  integer,
  add column if not exists contact_email        text,
  add column if not exists contact_phone        text,
  add column if not exists bio                  text,
  add column if not exists state_of_origin      text,
  add column if not exists profile_url          text,
  add column if not exists links                jsonb,
  add column if not exists latest_election_year integer,
  add column if not exists last_known_position  text,
  add column if not exists party_history        jsonb,
  add column if not exists office_history       jsonb,
  add column if not exists payload              jsonb,
  add column if not exists updated_at           timestamptz;

update public.profile set
  full_name     = coalesce(full_name, slug),
  links         = coalesce(links,         '[]'::jsonb),
  party_history = coalesce(party_history, '[]'::jsonb),
  office_history= coalesce(office_history,'[]'::jsonb),
  payload       = coalesce(payload,       '{}'::jsonb),
  updated_at    = coalesce(updated_at, timezone('utc', now()));

alter table public.profile
  alter column full_name     set not null,
  alter column slug          set not null,
  alter column links         set not null,
  alter column party_history set not null,
  alter column office_history set not null,
  alter column payload       set not null,
  alter column updated_at    set not null;

create unique index if not exists profile_slug_idx     on public.profile (slug);
create index if not exists profile_full_name_idx        on public.profile (full_name);
create index if not exists profile_current_party_idx    on public.profile (current_party_id);
create index if not exists profile_latest_year_idx      on public.profile (latest_election_year desc);

-- ─── Candidate ────────────────────────────────────────────────────────────────
-- A Candidate row = one electoral run (one person × one election × one race).
-- Personal details (name, bio, photo, etc.) belong in profile — JOIN to get them.
-- Party display text (abbreviation, full name, logo) belongs in parties — JOIN.

create table if not exists public.candidates (
  id                   text        primary key,
  profile_id           uuid        not null references public.profile(id)   on delete cascade,
  document_id          text        unique,           -- Sanity doc ID (migration traceability)
  -- The specific electoral contest
  year                 integer,
  position             text,                         -- id from static POSITIONS data (e.g. "governor")
  position_sort_order  integer,                      -- denormalized from static data for fast ordering
  party_id             text        references public.parties(id)    on delete set null,
  state_id             text,                         -- null for national offices
  lga                  text,                         -- null unless local race
  vice_candidate_name  text,                         -- running mate
  -- Content controls
  display              boolean     not null default true,
  source               jsonb       not null default '[]'::jsonb,
  payload              jsonb       not null default '{}'::jsonb,
  updated_at           timestamptz not null default timezone('utc', now())
);

-- Safe idempotent adds (for existing tables that predate this schema version)
alter table public.candidates
  add column if not exists profile_id          uuid,
  add column if not exists document_id         text,
  add column if not exists year                integer,
  add column if not exists position            text,
  add column if not exists position_sort_order integer,
  add column if not exists party_id            text,
  add column if not exists state_id            text,
  add column if not exists lga                 text,
  add column if not exists vice_candidate_name text,
  add column if not exists display             boolean,
  add column if not exists source              jsonb,
  add column if not exists payload             jsonb,
  add column if not exists updated_at          timestamptz;

-- Ensure the foreign key constraint exists (if the column was added without it)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'candidates_profile_id_fkey'
  ) then
    alter table public.candidates
      add constraint candidates_profile_id_fkey
      foreign key (profile_id) references public.profile(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'candidates_party_id_fkey'
  ) then
    alter table public.candidates
      add constraint candidates_party_id_fkey
      foreign key (party_id) references public.parties(id) on delete set null;
  end if;
end $$;

-- Back-fill defaults on existing rows before setting NOT NULL
update public.candidates set
  source     = coalesce(source, '[]'::jsonb),
  payload    = coalesce(payload, '{}'::jsonb),
  display    = coalesce(display, true),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.candidates
  alter column source     set not null,
  alter column payload    set not null,
  alter column display    set not null,
  alter column updated_at set not null;

-- Drop columns that no longer belong in candidates (personal / denormalized party info)
-- These are safe to drop — all data lives in profile and parties tables.
-- Only run these if the columns still exist (Supabase ignores IF EXISTS on DROP COLUMN
-- via alter table ... drop column if exists).
alter table public.candidates
  drop column if exists candidate_name,
  drop column if exists profile_url,
  drop column if exists party,
  drop column if exists party_full_name,
  drop column if exists logo;

-- Indexes
create unique index if not exists candidates_document_id_idx
  on public.candidates (document_id);

create index if not exists candidates_profile_idx
  on public.candidates (profile_id);

create index if not exists candidates_position_idx
  on public.candidates (position_sort_order, position, year desc);

create index if not exists candidates_party_idx
  on public.candidates (party_id);

create index if not exists candidates_state_idx
  on public.candidates (state_id, lga);

create index if not exists candidates_year_idx
  on public.candidates (year desc);

create index if not exists candidates_display_idx
  on public.candidates (display) where display = true;
