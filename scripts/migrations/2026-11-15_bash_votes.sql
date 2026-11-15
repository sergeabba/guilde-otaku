-- Guilde Otaku : table des votes du « Sondage du Bash » (Je regarde / Je passe).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Crée UNE table neuve ; ne modifie ni ne supprime aucune donnée existante.
-- Réversible : voir DOWN en bas.
--
-- Accès : la table est fermée à la clé publique (anon). Seul le serveur du site
-- (clé service_role, route /api/bash-votes) lit et écrit, après vérification
-- (chronique existante, choix valide, identifiant d'appareil, limite de débit).

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
create table if not exists public.bash_votes (
  id          bigint generated always as identity primary key,
  chronique   text        not null check (char_length(chronique) between 1 and 160),
  voter       uuid        not null,                     -- identifiant aléatoire de l'appareil
  choice      text        not null check (choice in ('watch', 'skip')),
  member_id   bigint      null references public.fighters(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (chronique, voter)                             -- un vote par appareil et par chronique
);

create index if not exists bash_votes_chronique_idx on public.bash_votes (chronique);

-- RLS activé sans aucune policy : la clé anon ne peut ni lire ni écrire.
alter table public.bash_votes enable row level security;

-- ── 2. VÉRIFICATION ───────────────────────────────────────────────────────────
-- select count(*) from public.bash_votes;                       -- 0 au départ
-- select relrowsecurity from pg_class where relname = 'bash_votes'; -- true

-- ── 3. DOWN (annulation : supprime la table et tous les votes) ───────────────
-- drop table if exists public.bash_votes;
