-- =============================================================================
-- Circolo Tennis Dozza - Database schema for Supabase (PostgreSQL)
-- =============================================================================
-- Run this script once against a fresh Supabase project (SQL editor, or save
-- it as a migration and run it with the Supabase CLI). It creates the three
-- tables from the product spec (soci, partite, sponsor), locks them down
-- with Row Level Security, and adds a single SECURITY DEFINER function used
-- by the "submit match result" Server Action to update both players and
-- record the match atomically.
--
-- Security model summary
-- -----------------------
-- - `anon` / `authenticated` (the public API keys used by the browser and by
--   Server Components) can only ever READ data. For `soci`, `anon` only
--   sees the public-safe columns (never `pin` or `telefono`); `authenticated`
--   (the logged-in club admin) additionally sees `telefono` for the member
--   management screen, but never `pin`.
-- - All writes (adding a member, recording a match, requesting a WhatsApp
--   challenge) go through Next.js Server Actions that use the service_role
--   key (a server-only secret) AFTER performing their own authorization
--   check in TypeScript:
--     * Adding a member requires a valid Supabase Auth session (the admin).
--     * Recording a match / requesting a challenge requires the submitting
--       member's 8-digit PIN to match the bcrypt hash stored in `soci.pin`.
--   See lib/supabase/service.ts and app/actions/*.ts for the application-side
--   half of this contract.
-- - Domain values (e.g. match outcome) are stored in English ('win' / 'loss')
--   to keep the data model/code language-neutral; Italian labels only exist
--   in the UI layer.
-- =============================================================================

-- Needed for gen_random_uuid().
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Table: soci (club members)
-- -----------------------------------------------------------------------------
create table if not exists public.soci (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  cognome text not null check (char_length(trim(cognome)) > 0),
  telefono text not null check (telefono ~ '^\+?[0-9 ]{6,20}$'),
  punti_iniziali integer not null default 1000,
  punti integer not null default 1000,
  -- Bcrypt hash of the member's 8-digit PIN. Never store or return the raw
  -- PIN - see lib/validation.ts (format) and app/actions/members.ts (hashing).
  pin text not null,
  vittorie integer not null default 0 check (vittorie >= 0),
  sconfitte integer not null default 0 check (sconfitte >= 0),
  congelato boolean not null default false,
  data_ultima_partita timestamptz,
  created_at timestamptz not null default now()
);

alter table public.soci
  add column if not exists punti_iniziali integer not null default 1000,
  add column if not exists congelato boolean not null default false;

update public.soci
   set punti_iniziali = punti
 where coalesce(vittorie, 0) = 0
   and coalesce(sconfitte, 0) = 0
   and punti_iniziali = 1000
   and punti <> 1000;

comment on table public.soci is 'Club members: ranking points, contact info and hashed PIN.';
comment on column public.soci.pin is 'Bcrypt hash of the 8-digit member PIN, never the raw value.';

create index if not exists soci_punti_idx on public.soci (punti desc);

-- -----------------------------------------------------------------------------
-- Table: partite (recorded matches)
-- -----------------------------------------------------------------------------
create table if not exists public.partite (
  id uuid primary key default gen_random_uuid(),
  -- Player who submitted the result and the opponent picked in the UI.
  id_inseritore uuid references public.soci (id) on delete set null,
  id_avversario uuid references public.soci (id) on delete set null,
  nome_completo_inseritore text not null,
  nome_completo_avversario text not null,
  -- Outcome from the submitter's point of view ('win' | 'loss'), plus the
  -- derived winner/loser ids (stored so admin statistics don't need to
  -- re-derive them from esito_inseritore on every query).
  esito_inseritore text not null check (esito_inseritore in ('win', 'loss')),
  id_vincitore uuid references public.soci (id) on delete set null,
  id_perdente uuid references public.soci (id) on delete set null,
  risultato text not null check (char_length(trim(risultato)) > 0),
  punti_vincitore_variazioni integer not null check (punti_vincitore_variazioni > 0),
  punti_perdente_variazioni integer not null check (punti_perdente_variazioni > 0),
  data timestamptz not null default now(),
  -- Denormalized winner/loser display names, derived automatically from the
  -- inseritore/avversario pair. Used by the cronologia page to combine the
  -- "name" and "win/loss" filters (e.g. "show Mario Rossi's wins").
  nome_vincitore text generated always as (
    case
      when id_vincitore is null then null
      when id_vincitore = id_inseritore then nome_completo_inseritore
      else nome_completo_avversario
    end
  ) stored,
  nome_perdente text generated always as (
    case
      when id_perdente is null then null
      when id_perdente = id_inseritore then nome_completo_inseritore
      else nome_completo_avversario
    end
  ) stored,
  constraint partite_players_differ check (id_inseritore is distinct from id_avversario)
);

comment on table public.partite is 'Historical log of recorded matches and the Elo-style point swing they caused.';

create index if not exists partite_data_idx on public.partite (data desc);
create index if not exists partite_inseritore_idx on public.partite (id_inseritore);
create index if not exists partite_avversario_idx on public.partite (id_avversario);
create index if not exists partite_vincitore_idx on public.partite (id_vincitore);
create index if not exists partite_nome_vincitore_idx on public.partite (nome_vincitore);
create index if not exists partite_nome_perdente_idx on public.partite (nome_perdente);

-- -----------------------------------------------------------------------------
-- Table: sponsor
-- -----------------------------------------------------------------------------
create table if not exists public.sponsor (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  logo_url text not null,
  link text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.sponsor is 'Sponsors shown as a logo grid on the homepage.';

create index if not exists sponsor_display_order_idx on public.sponsor (display_order);

-- -----------------------------------------------------------------------------
-- Table: site_settings
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id text primary key default 'global' check (id = 'global'),
  maintenance_mode boolean not null default false,
  -- Elo-style rating parameters (see lib/elo.ts and /admin/punteggi).
  elo_k_factor integer not null default 32,
  elo_min_rating integer not null default 100,
  elo_min_delta integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists elo_k_factor integer not null default 32,
  add column if not exists elo_min_rating integer not null default 100,
  add column if not exists elo_min_delta integer not null default 1;

comment on table public.site_settings is 'Singleton row for global site-wide settings such as maintenance mode and the Elo rating parameters.';

insert into public.site_settings (id)
values ('global')
on conflict (id) do nothing;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.soci enable row level security;
alter table public.partite enable row level security;
alter table public.sponsor enable row level security;
alter table public.site_settings enable row level security;

-- soci: anon/authenticated may only SELECT, and only the public-safe columns.
-- `pin` is withheld from everyone except the service_role (used internally
-- by Server Actions after a manual bcrypt check); `telefono` is additionally
-- exposed to `authenticated` (the club admin) for the member-management
-- screen, but still never to `anon`. Column-privilege restrictions sit on
-- top of row level security, so a mistaken `select *` from a
-- non-privileged client fails loudly instead of silently leaking data.
revoke all on table public.soci from anon, authenticated;
grant select (
  id, nome, cognome, punti, vittorie, sconfitte, congelato, data_ultima_partita, created_at
) on table public.soci to anon, authenticated;
grant select (telefono, punti_iniziali) on table public.soci to authenticated;

DROP POLICY IF EXISTS soci_public_read ON public.soci;
create policy "soci_public_read" on public.soci
  for select to anon, authenticated
  using (true);

-- No insert/update/delete policies for anon/authenticated: writes only ever
-- happen via Server Actions using the service_role key, which bypasses RLS
-- after the action has performed its own authorization check.

-- partite: fully public read (match history has no sensitive data).
revoke all on table public.partite from anon, authenticated;
grant select on table public.partite to anon, authenticated;

DROP POLICY IF EXISTS partite_public_read ON public.partite;
create policy "partite_public_read" on public.partite
  for select to anon, authenticated
  using (true);

-- sponsor: fully public read. Writes are allowed for authenticated (admin)
-- sessions so sponsors can be managed from the Supabase dashboard or a
-- future admin screen, without needing the service_role key.
revoke all on table public.sponsor from anon, authenticated;
grant select on table public.sponsor to anon, authenticated;
grant insert, update, delete on table public.sponsor to authenticated;

DROP POLICY IF EXISTS sponsor_public_read ON public.sponsor;
create policy "sponsor_public_read" on public.sponsor
  for select to anon, authenticated
  using (true);

DROP POLICY IF EXISTS sponsor_authenticated_write ON public.sponsor;
create policy "sponsor_authenticated_write" on public.sponsor
  for all to authenticated
  using (true)
  with check (true);

-- site_settings: publicly readable so the maintenance banner can be shown to
-- every visitor; writes still happen only through admin-authenticated server
-- actions using the service_role key.
revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;

DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select to anon, authenticated
  using (true);

-- =============================================================================
-- apply_match_result: atomically records a match and updates both players.
-- =============================================================================
-- Called once from the `submitMatchResult` Server Action, after it has:
--   1. verified the submitting player's PIN (bcrypt compare in TypeScript),
--   2. computed the Elo-style point delta in TypeScript (see lib/elo.ts).
-- This function only performs the trusted, atomic part of the write (row
-- locking + relative point updates + the history row) so a match can never
-- be half-applied, even under concurrent submissions.
create or replace function public.apply_match_result(
  p_inseritore_id uuid,
  p_avversario_id uuid,
  p_esito_inseritore text,
  p_risultato text,
  p_variazione integer
) returns table (id uuid, data timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inseritore public.soci%rowtype;
  v_avversario public.soci%rowtype;
  v_vincitore_id uuid;
  v_perdente_id uuid;
  v_now timestamptz := now();
  v_result_id uuid;
  v_result_data timestamptz;
  -- Ratings never drop below this floor. Read from site_settings so the SQL
  -- side always mirrors the (admin-configurable) MIN_RATING in lib/elo.ts.
  v_min_rating integer;
begin
  -- Note: `id` is qualified because the RETURNS TABLE output parameter `id`
  -- shadows the site_settings.id column inside this function; leaving it
  -- unqualified raises "column reference id is ambiguous" (SQLSTATE 42702).
  select coalesce(
    (select elo_min_rating from public.site_settings where site_settings.id = 'global'),
    100
  ) into v_min_rating;

  if p_esito_inseritore not in ('win', 'loss') then
    raise exception 'invalid esito_inseritore: %', p_esito_inseritore;
  end if;

  if p_variazione <= 0 then
    raise exception 'point variation must be a positive integer';
  end if;

  if p_inseritore_id = p_avversario_id then
    raise exception 'a player cannot play against themselves';
  end if;

  -- Lock both rows in a stable order (by id) so two concurrent matches
  -- between the same two players can never deadlock against each other.
  if p_inseritore_id < p_avversario_id then
    select * into v_inseritore from public.soci where soci.id = p_inseritore_id for update;
    select * into v_avversario from public.soci where soci.id = p_avversario_id for update;
  else
    select * into v_avversario from public.soci where soci.id = p_avversario_id for update;
    select * into v_inseritore from public.soci where soci.id = p_inseritore_id for update;
  end if;

  if v_inseritore.id is null then
    raise exception 'submitting player not found';
  end if;
  if v_avversario.id is null then
    raise exception 'opponent not found';
  end if;

  if p_esito_inseritore = 'win' then
    v_vincitore_id := v_inseritore.id;
    v_perdente_id := v_avversario.id;
  else
    v_vincitore_id := v_avversario.id;
    v_perdente_id := v_inseritore.id;
  end if;

  update public.soci
     set punti = greatest(v_min_rating, punti + p_variazione),
         vittorie = vittorie + 1,
         data_ultima_partita = v_now
   where soci.id = v_vincitore_id;

  update public.soci
     set punti = greatest(v_min_rating, punti - p_variazione),
         sconfitte = sconfitte + 1,
         data_ultima_partita = v_now
   where soci.id = v_perdente_id;

  insert into public.partite (
    id_inseritore, id_avversario,
    nome_completo_inseritore, nome_completo_avversario,
    esito_inseritore, id_vincitore, id_perdente,
    risultato, punti_vincitore_variazioni, punti_perdente_variazioni, data
  ) values (
    v_inseritore.id, v_avversario.id,
    trim(v_inseritore.nome || ' ' || v_inseritore.cognome),
    trim(v_avversario.nome || ' ' || v_avversario.cognome),
    p_esito_inseritore, v_vincitore_id, v_perdente_id,
    p_risultato, p_variazione, p_variazione, v_now
  )
  returning partite.id, partite.data into v_result_id, v_result_data;

  return query select v_result_id, v_result_data;
end;
$$;

comment on function public.apply_match_result(uuid, uuid, text, text, integer) is
  'Atomically applies a match result (point deltas + win/loss counters) and inserts the corresponding partite row. Called only from trusted Server Actions via the service_role key.';

-- Only the service_role (used exclusively by trusted Server Actions) may
-- execute this function; anon/authenticated never call it directly.
revoke all on function public.apply_match_result(uuid, uuid, text, text, integer) from public;
grant execute on function public.apply_match_result(uuid, uuid, text, text, integer) to service_role;

-- =============================================================================
-- Seed data (optional)
-- =============================================================================
-- Sponsors and members are normally managed from the app, but you can seed a
-- sponsor row here to see the homepage grid populated on a fresh project:
--
-- insert into public.sponsor (nome, logo_url, link, display_order) values
--   ('Sponsor Esempio', 'https://placehold.co/240x120?text=Sponsor', 'https://example.com', 0);
--
-- Note on the first admin account: admins authenticate with Supabase Auth
-- (email + password), not with the soci.pin system. Create the first admin
-- from the Supabase Dashboard under Authentication > Users > Add user, or
-- with `supabase.auth.admin.createUser(...)` from a trusted script. There is
-- intentionally no public sign-up page in this app.
