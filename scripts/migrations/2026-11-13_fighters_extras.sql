-- Guilde Otaku V4.2, Phase A : profil enrichi des membres.
-- Migration ADDITIVE et réversible. Aucune donnée existante n'est modifiée.
-- À exécuter manuellement dans l'éditeur SQL Supabase, après relecture.
--
-- Contenu attendu de `extras` (validé côté application par lib/member-extras.ts) :
--   displayNameRomaji, favoriteAnime[], favoriteManga[], music[], awards[], photoFocus{x,y}, animeFocus{x,y}
-- Les favoris sont des choix éditoriaux du membre : aucun script ne doit les écraser.

-- ── UP ─────────────────────────────────────────────────────────────────────
alter table public.fighters
  add column if not exists extras jsonb not null default '{}'::jsonb;

-- Garde-fou : un objet JSON, jamais un tableau ou un scalaire.
alter table public.fighters
  drop constraint if exists fighters_extras_is_object;
alter table public.fighters
  add constraint fighters_extras_is_object check (jsonb_typeof(extras) = 'object');

comment on column public.fighters.extras is
  'Profil enrichi facultatif (favoris anime/manga, musique, palmarès, points focaux). Validé par lib/member-extras.ts.';

-- Vérification :
--   select id, name, extras from public.fighters order by id limit 5;

-- ── DOWN (retour arrière) ──────────────────────────────────────────────────
-- ATTENTION : supprime les favoris saisis depuis l'UP. Sauvegarder avant :
--   create table public.fighters_extras_backup as select id, extras from public.fighters;
-- puis :
--   alter table public.fighters drop constraint if exists fighters_extras_is_object;
--   alter table public.fighters drop column if exists extras;

-- Rappel sécurité : l'écriture de cette colonne depuis l'administration doit passer
-- par une route serveur authentifiée (phase C), et les policies RLS de `fighters`
-- doivent refuser toute écriture anonyme.
