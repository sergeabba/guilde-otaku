-- Guilde Otaku : les Teams de la Guilde (cinq de basket, onze de foot).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Crée UNE table neuve ; ne modifie ni ne supprime aucune donnée existante.
-- Réversible : voir DOWN en bas.
--
-- guild_teams : une équipe = un nom, un sport, une formation et les postes occupés
--   par des membres (slots : [{ "slot": "PG", "memberId": 14, "number": 9, "captain": true }]).
-- Accès : table fermée à la clé publique (anon). Seul le serveur du site (clé
-- service_role) lit et écrit : page /teams (lecture) et /api/admin/teams (admin).

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
create table if not exists public.guild_teams (
  id          bigint generated always as identity primary key,
  slug        text        not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name        text        not null check (char_length(name) between 1 and 60),
  sport       text        not null check (sport in ('basket', 'foot')),
  formation   text        not null check (char_length(formation) between 1 and 20),
  color       text        null check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  motto       text        null check (motto is null or char_length(motto) <= 140),
  slots       jsonb       not null default '[]'::jsonb check (jsonb_typeof(slots) = 'array' and jsonb_array_length(slots) <= 11),
  position    integer     not null default 0,          -- ordre d'affichage
  published   boolean     not null default false,      -- visible sur le site
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists guild_teams_order_idx on public.guild_teams (position, id);

-- RLS activé sans aucune policy : la clé anon ne peut ni lire ni écrire.
alter table public.guild_teams enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select count(*) from public.guild_teams;                                  -- 0 au départ
-- select relname, relrowsecurity from pg_class where relname = 'guild_teams'; -- true

-- ── 3. DOWN (annulation : supprime la table et toutes les équipes) ──────────
-- drop table if exists public.guild_teams;
