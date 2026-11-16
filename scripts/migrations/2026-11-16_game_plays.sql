-- Guilde Otaku : parties de la page « Jeux » (quiz des génériques, duel de goûts).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Crée UNE table neuve ; ne modifie ni ne supprime aucune donnée existante.
-- Réversible : voir DOWN en bas.
--
-- Sans compte : chaque appareil a un identifiant aléatoire (device) ; le joueur peut
-- dire quel membre il est (member_id) ou donner un pseudo (player_name). Les scores
-- sont calculés par le serveur du site, jamais par le navigateur.
-- Accès : table fermée à la clé publique (anon). Seul le serveur (clé service_role,
-- routes /api/games/*) lit et écrit.

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
create table if not exists public.game_plays (
  id           bigint generated always as identity primary key,
  game         text        not null check (game in ('quiz-generique', 'duel')),
  device       uuid        not null,                                       -- identifiant aléatoire de l'appareil
  member_id    bigint      null references public.fighters(id) on delete set null,
  player_name  text        null check (char_length(player_name) between 1 and 40),
  score        integer     not null default 0 check (score >= 0),
  max_score    integer     not null default 0 check (max_score >= 0),
  detail       jsonb       not null default '{}'::jsonb,                   -- réponses, duo du duel…
  nonce        text        null unique,                                    -- une partie de quiz = un seul enregistrement
  created_at   timestamptz not null default now()
);
create index if not exists game_plays_game_score_idx on public.game_plays (game, score desc);
create index if not exists game_plays_device_idx on public.game_plays (device, created_at desc);
create index if not exists game_plays_member_idx on public.game_plays (member_id, created_at desc);

-- RLS activé sans aucune policy : la clé anon ne peut ni lire ni écrire.
alter table public.game_plays enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select count(*) from public.game_plays;                                 -- 0 au départ
-- select relrowsecurity from pg_class where relname = 'game_plays';     -- true

-- ── 3. DOWN (annulation : supprime la table et toutes les parties) ───────────
-- drop table if exists public.game_plays;
