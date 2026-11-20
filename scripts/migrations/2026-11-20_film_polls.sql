-- Guilde Otaku : votes de films (« Le vote du film de la semaine »).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Crée DEUX tables neuves ; ne modifie ni ne supprime aucune donnée existante.
-- Réversible : voir DOWN en bas.
--
-- film_polls      : un sondage = un titre, 2 à 8 films (infos TMDB figées), une date de fin.
-- film_poll_votes : un vote par appareil et par sondage (modifiable jusqu'à la fin).
-- Accès : tables fermées à la clé publique (anon). Seul le serveur du site (clé
-- service_role) lit et écrit : routes /api/film-polls (vote) et /api/admin/film-polls (admin).

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
create table if not exists public.film_polls (
  id          bigint generated always as identity primary key,
  slug        text        not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),   -- adresse /vote/<slug>
  title       text        not null check (char_length(title) between 1 and 120),
  films       jsonb       not null check (jsonb_typeof(films) = 'array' and jsonb_array_length(films) between 2 and 8),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.film_poll_votes (
  id          bigint generated always as identity primary key,
  poll_id     bigint      not null references public.film_polls(id) on delete cascade,
  voter       uuid        not null,                     -- identifiant aléatoire de l'appareil
  choice      bigint      not null,                     -- numéro TMDB du film choisi
  member_id   bigint      null references public.fighters(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (poll_id, voter)                               -- un vote par appareil et par sondage
);

create index if not exists film_poll_votes_poll_idx on public.film_poll_votes (poll_id);
create index if not exists film_polls_ends_idx on public.film_polls (ends_at desc);

-- RLS activé sans aucune policy : la clé anon ne peut ni lire ni écrire.
alter table public.film_polls enable row level security;
alter table public.film_poll_votes enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select count(*) from public.film_polls;        -- 0 au départ
-- select count(*) from public.film_poll_votes;   -- 0 au départ
-- select relname, relrowsecurity from pg_class where relname in ('film_polls', 'film_poll_votes'); -- true, true

-- ── 3. DOWN (annulation : supprime les deux tables, sondages et votes) ──────
-- drop table if exists public.film_poll_votes;
-- drop table if exists public.film_polls;
