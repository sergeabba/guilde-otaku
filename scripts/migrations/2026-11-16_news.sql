-- Guilde Otaku : « Actualités » de la Bibliothèque, avec relecture avant publication
-- (cahier des charges V4.2, § 6 et § 7B « news:sync »).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Crée DEUX tables neuves ; ne modifie ni ne supprime aucune donnée existante.
-- Réversible : voir DOWN en bas.
--
-- Fonctionnement :
--   1. Le site lit des flux RSS de médias français (titre, lien, date, court extrait
--      fourni par le média lui-même) et range chaque article en « pending ».
--   2. L'admin relit, peut corriger le titre et l'extrait, puis publie ou écarte.
--   3. Seuls les articles « published » apparaissent sur le site, toujours avec le
--      nom du média et le lien vers l'article d'origine. Rien n'est publié seul,
--      rien n'est signé du nom de Bash.
--
-- Accès : tables fermées à la clé publique (anon). Seul le serveur du site (clé
-- service_role, routes /api/news, /api/admin/news, /api/cron/news) lit et écrit.

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
create table if not exists public.news_items (
  id              bigint generated always as identity primary key,
  source          text        not null check (char_length(source) between 1 and 80),   -- nom du média
  source_url      text        not null unique check (source_url ~ '^https://'),         -- lien de l'article (évite les doublons)
  title           text        not null check (char_length(title) between 1 and 300),
  excerpt         text        null     check (char_length(excerpt) <= 400),            -- extrait fourni par le flux
  author          text        null     check (char_length(author) <= 120),
  categories      text[]      not null default '{}',
  published_at    timestamptz null,                                                     -- date de publication chez le média
  status          text        not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  edited_title    text        null     check (char_length(edited_title) <= 300),        -- titre revu par l'admin
  edited_excerpt  text        null     check (char_length(edited_excerpt) <= 400),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz null
);
create index if not exists news_items_status_idx on public.news_items (status, published_at desc);

-- Journal des récupérations (une ligne par passage et par média).
create table if not exists public.news_runs (
  id          bigint generated always as identity primary key,
  source      text        not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz null,
  read_count  integer     not null default 0,   -- articles lus dans le flux
  added_count integer     not null default 0,   -- nouveaux articles mis en attente
  error       text        null
);
create index if not exists news_runs_started_idx on public.news_runs (started_at desc);

-- RLS activé sans aucune policy : la clé anon ne peut ni lire ni écrire.
alter table public.news_items enable row level security;
alter table public.news_runs  enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select count(*) from public.news_items;                                            -- 0 au départ
-- select relname, relrowsecurity from pg_class where relname in ('news_items', 'news_runs'); -- true, true

-- ── 3. DOWN (annulation : supprime les deux tables et leur contenu) ──────────
-- drop table if exists public.news_runs;
-- drop table if exists public.news_items;
