-- Guilde Otaku : jeux experts (Devine par les thèmes, Qui l'a créé ?, Le studio, La voix).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Ne supprime aucune donnée, ne crée aucune table.
--
-- Au lieu d'ajouter une fois de plus des noms à la liste des jeux autorisés, la règle
-- devient : un nom de jeu est fait de lettres minuscules, chiffres et tirets (2 à 30
-- caractères). Seul le serveur du site écrit dans cette table (clé service_role), et il
-- n'utilise que des noms de jeux connus : plus besoin de migration pour un nouveau jeu.

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
alter table public.game_plays drop constraint if exists game_plays_game_check;
alter table public.game_plays add constraint game_plays_game_check
  check (game ~ '^[a-z0-9-]{2,30}$');

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'game_plays_game_check';
--   -> CHECK ((game ~ '^[a-z0-9-]{2,30}$'::text))

-- ── 3. DOWN (annulation : retour à la liste fermée, après suppression des parties des jeux experts) ──
-- delete from public.game_plays where game in ('themes', 'createur', 'studio', 'voix');
-- alter table public.game_plays drop constraint if exists game_plays_game_check;
-- alter table public.game_plays add constraint game_plays_game_check
--   check (game in ('quiz-generique', 'quiz-nostalgie', 'affiche', 'plus-moins', 'defi-jour',
--                   'devine-anime', 'devine-perso', 'emoji-quiz', 'duel'));
