-- Guilde Otaku : nouveaux jeux (Blind test Nostalgie, Affiche en morceaux, Plus ou moins,
-- Défi du jour, défi entre amis) et Tier list de la semaine.
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Ne supprime aucune donnée : élargit la liste des jeux autorisés et crée UNE table neuve.
-- Réversible : voir DOWN en bas.

-- ── 1. UP ─────────────────────────────────────────────────────────────────────

-- 1a. game_plays : autoriser les nouveaux jeux.
--     (Le défi entre amis est enregistré comme un quiz : pas de nouveau nom.)
alter table public.game_plays drop constraint if exists game_plays_game_check;
alter table public.game_plays add constraint game_plays_game_check
  check (game in ('quiz-generique', 'quiz-nostalgie', 'affiche', 'plus-moins', 'defi-jour', 'duel'));

-- 1b. tier_lists : un classement par appareil et par semaine (modifiable jusqu'au lundi).
create table if not exists public.tier_lists (
  id           bigint generated always as identity primary key,
  week         text        not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),   -- semaine ISO, ex. 2026-W47
  device       uuid        not null,                                          -- identifiant aléatoire de l'appareil
  member_id    bigint      null references public.fighters(id) on delete set null,
  player_name  text        null check (char_length(player_name) between 1 and 40),
  ranks        jsonb       not null default '[]'::jsonb,                      -- [{ id, title, cover, tier }]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (week, device)
);
create index if not exists tier_lists_week_idx on public.tier_lists (week);

-- RLS activé sans aucune policy : la clé publique (anon) ne peut ni lire ni écrire.
-- Seul le serveur du site (clé service_role, route /api/games/tier) y accède.
alter table public.tier_lists enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'game_plays_game_check';
--   -> doit lister les 6 jeux
-- select count(*) from public.tier_lists;                                  -- 0 au départ
-- select relrowsecurity from pg_class where relname = 'tier_lists';      -- true

-- ── 3. DOWN (annulation) ──────────────────────────────────────────────────────
-- Attention : supprime les parties des nouveaux jeux, puis la tier list.
-- delete from public.game_plays where game not in ('quiz-generique', 'duel');
-- alter table public.game_plays drop constraint if exists game_plays_game_check;
-- alter table public.game_plays add constraint game_plays_game_check check (game in ('quiz-generique', 'duel'));
-- drop table if exists public.tier_lists;
