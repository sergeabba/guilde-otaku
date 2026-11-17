-- Guilde Otaku : jeux « Devine l'anime », « Devine le perso » et « Quiz des émojis ».
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Ne supprime aucune donnée : élargit la liste des jeux autorisés et crée UNE table neuve.
-- Réversible : voir DOWN en bas.

-- ── 1. UP ─────────────────────────────────────────────────────────────────────

-- 1a. game_plays : autoriser les 3 nouveaux jeux (les parties existantes ne bougent pas).
alter table public.game_plays drop constraint if exists game_plays_game_check;
alter table public.game_plays add constraint game_plays_game_check
  check (game in ('quiz-generique', 'quiz-nostalgie', 'affiche', 'plus-moins', 'defi-jour',
                  'devine-anime', 'devine-perso', 'emoji-quiz', 'duel'));

-- 1b. emoji_puzzles : énigmes en émojis proposées par les membres (en attente) ou
--     ajoutées / validées par l'admin. Les 50 énigmes de base restent dans le code du site.
create table if not exists public.emoji_puzzles (
  id           bigint generated always as identity primary key,
  emojis       text        not null check (char_length(emojis) between 2 and 80),
  answer       text        not null check (char_length(answer) between 2 and 80),
  hint         text        null check (char_length(hint) <= 80),
  status       text        not null default 'pending' check (status in ('pending', 'approved')),
  member_id    bigint      null references public.fighters(id) on delete set null,
  player_name  text        null check (char_length(player_name) between 1 and 40),
  created_at   timestamptz not null default now()
);
create index if not exists emoji_puzzles_status_idx on public.emoji_puzzles (status, created_at desc);

-- RLS activé sans aucune policy : la clé publique (anon) ne peut ni lire ni écrire.
-- Seul le serveur du site (routes /api/games/emoji et /api/admin/emoji) y accède.
alter table public.emoji_puzzles enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'game_plays_game_check';
--   -> doit lister les 9 jeux
-- select count(*) from public.emoji_puzzles;                                -- 0 au départ
-- select relrowsecurity from pg_class where relname = 'emoji_puzzles';    -- true

-- ── 3. DOWN (annulation) ──────────────────────────────────────────────────────
-- Attention : supprime les parties de ces 3 jeux et les énigmes proposées.
-- delete from public.game_plays where game in ('devine-anime', 'devine-perso', 'emoji-quiz');
-- alter table public.game_plays drop constraint if exists game_plays_game_check;
-- alter table public.game_plays add constraint game_plays_game_check
--   check (game in ('quiz-generique', 'quiz-nostalgie', 'affiche', 'plus-moins', 'defi-jour', 'duel'));
-- drop table if exists public.emoji_puzzles;
