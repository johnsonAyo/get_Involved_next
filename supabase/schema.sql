-- ═══════════════════════════════════════════════════════════════════════════
-- Get Involved — Supabase Schema (Normalized)
-- Apply idempotently: safe to re-run after partial migrations.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Parties ─────────────────────────────────────────────────────────────────

create table if not exists public.parties (
  id           text        primary key,         -- stable slug, e.g. "apc"
  name         text        not null,
  abbreviation text        not null,
  logo         text,
  updated_at   timestamptz not null default timezone('utc', now())
);

alter table public.parties
  add column if not exists name         text,
  add column if not exists abbreviation text,
  add column if not exists logo         text,
  add column if not exists updated_at   timestamptz;

update public.parties set
  name         = coalesce(name, id),
  abbreviation = coalesce(abbreviation, upper(id)),
  updated_at   = coalesce(updated_at, timezone('utc', now()));

alter table public.parties
  alter column name         set not null,
  alter column abbreviation set not null,
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
  current_party_id    text        references public.parties(id)    on delete set null on update cascade,
  latest_election_year integer,
  last_known_position text,
  -- Personal details
  profile_picture_url text,
  age                 integer,
  birth_year          integer,
  contact_email       text,
  contact_phone       text,
  bio                 text,
  state_of_origin     text,
  profile_url         text,
  -- Structured history (derived, kept for fast reads)
  education           jsonb       not null default '[]'::jsonb,
  career_history      jsonb       not null default '[]'::jsonb,
  profile_highlights  jsonb       not null default '[]'::jsonb,
  party_history       jsonb       not null default '[]'::jsonb,
  office_history      jsonb       not null default '[]'::jsonb,
  links               jsonb       not null default '[]'::jsonb,
  updated_at          timestamptz not null default timezone('utc', now())
);

alter table public.profile
  add column if not exists full_name            text,
  add column if not exists slug                 text,
  add column if not exists current_party_id     text,
  add column if not exists profile_picture_url  text,
  add column if not exists age                  integer,
  add column if not exists birth_year           integer,
  add column if not exists contact_email        text,
  add column if not exists contact_phone        text,
  add column if not exists bio                  text,
  add column if not exists state_of_origin      text,
  add column if not exists profile_url          text,
  add column if not exists education            jsonb,
  add column if not exists career_history       jsonb,
  add column if not exists profile_highlights   jsonb,
  add column if not exists links                jsonb,
  add column if not exists latest_election_year integer,
  add column if not exists last_known_position  text,
  add column if not exists party_history        jsonb,
  add column if not exists office_history       jsonb,
  add column if not exists updated_at           timestamptz;

update public.profile set
  full_name     = coalesce(full_name, slug),
  education     = coalesce(education,     '[]'::jsonb),
  career_history= coalesce(career_history,'[]'::jsonb),
  profile_highlights = coalesce(profile_highlights, '[]'::jsonb),
  links         = coalesce(links,         '[]'::jsonb),
  party_history = coalesce(party_history, '[]'::jsonb),
  office_history= coalesce(office_history,'[]'::jsonb),
  updated_at    = coalesce(updated_at, timezone('utc', now()));

alter table public.profile
  alter column full_name     set not null,
  alter column slug          set not null,
  alter column education     set not null,
  alter column career_history set not null,
  alter column profile_highlights set not null,
  alter column links         set not null,
  alter column party_history set not null,
  alter column office_history set not null,
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
  id                   uuid        primary key default gen_random_uuid(),
  profile_id           uuid        not null references public.profile(id)   on delete cascade,
  -- The specific electoral contest
  year                 integer     default 2027,
  position             text,                         -- id from static POSITIONS data (e.g. "governor")
  party_id             text        references public.parties(id)    on delete set null on update cascade,
  state_id             text,                         -- null for national offices
  lga                  text,                         -- null unless local race
  vice_candidate_name  text,                         -- running mate
  -- Content controls
  display              boolean     not null default true,
  source               jsonb       not null default '[]'::jsonb,
  updated_at           timestamptz not null default timezone('utc', now())
);

-- Safe idempotent adds (for existing tables that predate this schema version)
alter table public.candidates
  add column if not exists profile_id          uuid,
  add column if not exists year                integer,
  add column if not exists position            text,
  add column if not exists party_id            text,
  add column if not exists state_id            text,
  add column if not exists lga                 text,
  add column if not exists vice_candidate_name text,
  add column if not exists display             boolean,
  add column if not exists source              jsonb,
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
      foreign key (party_id) references public.parties(id) on delete set null on update cascade;
  end if;
end $$;

-- Back-fill defaults on existing rows before setting NOT NULL
update public.candidates set
  source     = coalesce(source, '[]'::jsonb),
  display    = coalesce(display, true),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.candidates
  alter column source     set not null,
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


create index if not exists candidates_profile_idx
  on public.candidates (profile_id);

create index if not exists candidates_position_idx
  on public.candidates (position, year desc);

create index if not exists candidates_party_idx
  on public.candidates (party_id);

create index if not exists candidates_state_idx
  on public.candidates (state_id, lga);

create index if not exists candidates_year_idx
  on public.candidates (year desc);

create index if not exists candidates_display_idx
  on public.candidates (display) where display = true;


-- ─── Candidate Applications ──────────────────────────────────────────────────
-- Stores submissions from users proposing a new candidate or aspirant.

create table if not exists public.candidate_applications (
  id               uuid        primary key default gen_random_uuid(),
  website          text,
  candidate_name   text        not null,
  position         text        not null,
  party            text        not null,
  state            text,
  local_government text,
  source           text,
  source_url       text,
  status           text        not null default 'pending',
  created_at       timestamptz not null default timezone('utc', now())
);

-- ─── Election Facts ──────────────────────────────────────────────────────────
-- Stores election facts displayed in the carousel on the home page.

create table if not exists public.election_facts (
  id         uuid        primary key default gen_random_uuid(),
  category   text,
  text       text        not null,
  source     text,
  display    boolean     not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ─── Geographic Hierarchy ────────────────────────────────────────────────────
-- Normalised lookup tables for State → LGA → Ward.
-- Populated from the polling_units import and used as the canonical source for
-- all dropdown/select menus across the app.

create table if not exists public.geo_states (
  id    text        primary key,         -- slug, e.g. "lagos" (matches state_slug)
  name  text        not null,            -- display name, e.g. "Lagos"
  code  text                             -- state_code if available
);

create table if not exists public.geo_lgas (
  id        uuid        primary key default gen_random_uuid(),
  state_id  text        not null references public.geo_states(id) on delete cascade on update cascade,
  name      text        not null,
  unique (state_id, name)
);

create table if not exists public.geo_wards (
  id      uuid        primary key default gen_random_uuid(),
  lga_id  uuid        not null references public.geo_lgas(id) on delete cascade on update cascade,
  name    text        not null,
  unique (lga_id, name)
);

create index if not exists geo_lgas_state_id_idx on public.geo_lgas (state_id);
create index if not exists geo_lgas_name_idx     on public.geo_lgas (name);
create index if not exists geo_wards_lga_id_idx  on public.geo_wards (lga_id);
create index if not exists geo_wards_name_idx    on public.geo_wards (name);

-- ─── Polling Units ───────────────────────────────────────────────────────────
-- Official polling-unit directory used as the anchor for election-day reports.
-- Stored in a slim table and exposed through a compatibility view so the app can
-- read state/LGA/ward names without repeating them on every polling-unit row.

create table if not exists public.polling_units_core (
  id                    text        primary key,
  polling_unit_code     text,
  polling_unit_name     text        not null,
  remark                text,
  ward_id               uuid        not null references public.geo_wards(id) on delete restrict on update cascade,
  address               text,
  latitude              double precision,
  longitude             double precision,
  coordinate_quality    text,
  coordinate_confidence numeric,
  coordinate_source     text,
  coordinate_label      text,
  coordinate_match      text,
  source_snapshot_url   text,
  source_generated_at   timestamptz,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now())
);

create unique index if not exists polling_units_core_code_unique_idx
  on public.polling_units_core (polling_unit_code)
  where polling_unit_code is not null;

create index if not exists polling_units_core_ward_id_idx
  on public.polling_units_core (ward_id);

create index if not exists polling_units_core_ward_id_id_idx
  on public.polling_units_core (ward_id, id);

create index if not exists polling_units_core_location_idx
  on public.polling_units_core (latitude, longitude)
  where latitude is not null and longitude is not null;

create or replace view public.polling_units
with (security_invoker = true) as
select
  pu.id,
  pu.polling_unit_code,
  pu.polling_unit_name,
  pu.remark,
  gs.code as state_code,
  gs.name as state,
  gs.id as state_slug,
  gl.name as lga,
  gw.name as ward,
  pu.address,
  pu.latitude,
  pu.longitude,
  pu.coordinate_quality,
  pu.coordinate_confidence,
  pu.coordinate_source,
  pu.coordinate_label,
  pu.coordinate_match,
  pu.source_snapshot_url,
  pu.source_generated_at,
  pu.created_at,
  pu.updated_at
from public.polling_units_core pu
join public.geo_wards gw on gw.id = pu.ward_id
join public.geo_lgas gl on gl.id = gw.lga_id
join public.geo_states gs on gs.id = gl.state_id;

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────

alter table public.parties enable row level security;
alter table public.profile enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_applications enable row level security;
alter table public.election_facts enable row level security;
alter table public.polling_units_core enable row level security;
alter table public.geo_states enable row level security;
alter table public.geo_lgas enable row level security;
alter table public.geo_wards enable row level security;

-- Drop existing policies to ensure idempotency
drop policy if exists "Allow public select on parties" on public.parties;
drop policy if exists "Allow public select on profile" on public.profile;
drop policy if exists "Allow public select on candidates" on public.candidates;
drop policy if exists "Allow public select on candidate_applications" on public.candidate_applications;
drop policy if exists "Allow public select on election_facts" on public.election_facts;
drop policy if exists "Allow public select on polling_units_core" on public.polling_units_core;

drop policy if exists "Allow auth write on parties" on public.parties;
drop policy if exists "Allow auth write on profile" on public.profile;
drop policy if exists "Allow auth write on candidates" on public.candidates;
drop policy if exists "Allow auth write on candidate_applications" on public.candidate_applications;
drop policy if exists "Allow auth write on election_facts" on public.election_facts;
drop policy if exists "Allow auth write on polling_units_core" on public.polling_units_core;

drop policy if exists "Allow public insert on candidate_applications" on public.candidate_applications;

drop policy if exists "Allow public select on geo_states" on public.geo_states;
drop policy if exists "Allow public select on geo_lgas"   on public.geo_lgas;
drop policy if exists "Allow public select on geo_wards"  on public.geo_wards;
drop policy if exists "Allow auth write on geo_states" on public.geo_states;
drop policy if exists "Allow auth write on geo_lgas"   on public.geo_lgas;
drop policy if exists "Allow auth write on geo_wards"  on public.geo_wards;

-- Public READ (SELECT) access for all tables
create policy "Allow public select on parties" on public.parties for select using (true);
create policy "Allow public select on profile" on public.profile for select using (true);
create policy "Allow public select on candidates" on public.candidates for select using (true);
create policy "Allow public select on candidate_applications" on public.candidate_applications for select using (true);
create policy "Allow public select on election_facts" on public.election_facts for select using (true);
create policy "Allow public select on polling_units_core" on public.polling_units_core for select using (true);
create policy "Allow public select on geo_states" on public.geo_states for select using (true);
create policy "Allow public select on geo_lgas"   on public.geo_lgas   for select using (true);
create policy "Allow public select on geo_wards"  on public.geo_wards  for select using (true);

-- Authenticated WRITE (ALL) access for all tables
create policy "Allow auth write on parties" on public.parties for all to authenticated using (true) with check (true);
create policy "Allow auth write on profile" on public.profile for all to authenticated using (true) with check (true);
create policy "Allow auth write on candidates" on public.candidates for all to authenticated using (true) with check (true);
create policy "Allow auth write on candidate_applications" on public.candidate_applications for all to authenticated using (true) with check (true);
create policy "Allow auth write on election_facts" on public.election_facts for all to authenticated using (true) with check (true);
create policy "Allow auth write on polling_units_core" on public.polling_units_core for all to authenticated using (true) with check (true);
create policy "Allow auth write on geo_states" on public.geo_states for all to authenticated using (true) with check (true);
create policy "Allow auth write on geo_lgas"   on public.geo_lgas   for all to authenticated using (true) with check (true);
create policy "Allow auth write on geo_wards"  on public.geo_wards  for all to authenticated using (true) with check (true);

-- Public WRITE (INSERT) access for candidate_applications only
create policy "Allow public insert on candidate_applications" on public.candidate_applications for insert to public with check (true);
