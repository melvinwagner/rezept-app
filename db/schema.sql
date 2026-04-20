-- ============================================================================
-- DAWG Rezept-App — Supabase Schema
-- Führe dieses Script im Supabase SQL-Editor aus:
--   Project → SQL Editor → New Query → paste → Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles: Erweiterung zu auth.users mit App-spezifischen Feldern
--    (user_name, Cover-Config — alles was bisher in AsyncStorage lag)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  user_name       text not null default 'Tester',
  cover_color_idx int  not null default 0,
  cover_layout_id text not null default 'classic',
  cover_tagline   text not null default 'Ein Archiv in Bewegung',
  cover_edition   text not null default 'Edition 2026',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Trigger: profile automatisch anlegen wenn User sich registriert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, user_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Tester')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. recipes: pro User, JSONB-Data (flexibel für Schema-Evolution)
-- ----------------------------------------------------------------------------
create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);

-- ----------------------------------------------------------------------------
-- 3. cookbooks: pro User, JSONB-Data
-- ----------------------------------------------------------------------------
create table if not exists public.cookbooks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cookbooks_user_id_idx on public.cookbooks(user_id);

-- ----------------------------------------------------------------------------
-- 4. Row-Level-Security: jeder User sieht nur eigene Daten
-- ----------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.recipes   enable row level security;
alter table public.cookbooks enable row level security;

-- profiles
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile write"  on public.profiles;
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for update using (auth.uid() = id);

-- recipes
drop policy if exists "own recipes read"   on public.recipes;
drop policy if exists "own recipes write"  on public.recipes;
drop policy if exists "own recipes insert" on public.recipes;
drop policy if exists "own recipes delete" on public.recipes;
create policy "own recipes read"   on public.recipes for select using (auth.uid() = user_id);
create policy "own recipes insert" on public.recipes for insert with check (auth.uid() = user_id);
create policy "own recipes write"  on public.recipes for update using (auth.uid() = user_id);
create policy "own recipes delete" on public.recipes for delete using (auth.uid() = user_id);

-- cookbooks
drop policy if exists "own cookbooks read"   on public.cookbooks;
drop policy if exists "own cookbooks write"  on public.cookbooks;
drop policy if exists "own cookbooks insert" on public.cookbooks;
drop policy if exists "own cookbooks delete" on public.cookbooks;
create policy "own cookbooks read"   on public.cookbooks for select using (auth.uid() = user_id);
create policy "own cookbooks insert" on public.cookbooks for insert with check (auth.uid() = user_id);
create policy "own cookbooks write"  on public.cookbooks for update using (auth.uid() = user_id);
create policy "own cookbooks delete" on public.cookbooks for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. updated_at Auto-Update
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch  on public.profiles;
drop trigger if exists recipes_touch   on public.recipes;
drop trigger if exists cookbooks_touch on public.cookbooks;

create trigger profiles_touch  before update on public.profiles  for each row execute procedure public.touch_updated_at();
create trigger recipes_touch   before update on public.recipes   for each row execute procedure public.touch_updated_at();
create trigger cookbooks_touch before update on public.cookbooks for each row execute procedure public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 6. usage_events: App-Aktivitäts-Log (wer hat wann was gemacht)
--    Insert erfolgt server-seitig mit Service-Role-Key (bypasst RLS).
--    User können nur eigene Events lesen.
-- ----------------------------------------------------------------------------
create table if not exists public.usage_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  event       text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists usage_events_user_id_idx    on public.usage_events(user_id);
create index if not exists usage_events_event_idx      on public.usage_events(event);
create index if not exists usage_events_created_at_idx on public.usage_events(created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "own events read" on public.usage_events;
create policy "own events read" on public.usage_events
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. Convenience-View: Events mit Email + Display-Name für Dashboard-Queries
-- ----------------------------------------------------------------------------
create or replace view public.usage_events_enriched as
select
  e.id,
  e.event,
  e.metadata,
  e.created_at,
  e.user_id,
  u.email,
  p.user_name as display_name
from public.usage_events e
left join auth.users u on u.id = e.user_id
left join public.profiles p on p.id = e.user_id;
