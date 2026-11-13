-- Guilde Otaku : verrouillage des écritures anonymes (fighters, bibliotheque, bons_plans).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture, et seulement
-- APRÈS la mise en production du code qui passe par /api/admin/db (sinon l'admin
-- ne peut plus écrire). Ne modifie aucune donnée. Réversible (voir DOWN).
--
-- Pourquoi : la clé "anon" est publique (elle est dans le navigateur). Tant que les
-- policies RLS autorisent l'écriture anonyme, n'importe qui peut modifier ces tables
-- sans passer par l'écran de connexion. Le code admin utilise désormais la clé
-- serveur (service_role), qui ignore RLS : on peut donc refuser toute écriture anonyme.

-- ── 0. ÉTAT ACTUEL (à lancer d'abord, garder le résultat) ──────────────────────
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('fighters', 'bibliotheque', 'bons_plans')
order by tablename, cmd;

select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relname in ('fighters', 'bibliotheque', 'bons_plans');

-- ── 1. UP ─────────────────────────────────────────────────────────────────────
alter table public.fighters     enable row level security;
alter table public.bibliotheque enable row level security;
alter table public.bons_plans   enable row level security;

-- Lecture publique conservée (le site lit ces tables avec la clé anon).
do $$
declare t text;
begin
  foreach t in array array['fighters', 'bibliotheque', 'bons_plans'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'public_read') then
      execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', t);
    end if;
  end loop;
end $$;

-- 2. Supprimer ENSUITE, à la main, chaque policy listée à l'étape 0 dont la
--    commande (cmd) est INSERT, UPDATE, DELETE ou ALL et qui s'applique à anon,
--    authenticated ou public. Exemple (remplacer le nom) :
--      drop policy "nom_de_la_policy" on public.fighters;
--    Aucune policy d'écriture n'est nécessaire : le serveur utilise service_role.

-- ── 3. VÉRIFICATION ───────────────────────────────────────────────────────────
-- Relancer la requête de l'étape 0 : il ne doit rester que des policies SELECT.
-- Puis, depuis le site : l'admin peut toujours masquer un membre (via le serveur),
-- et une écriture avec la clé anon renvoie une erreur ou 0 ligne modifiée.

-- ── DOWN (retour arrière) ─────────────────────────────────────────────────────
-- Recréer les policies supprimées à partir du résultat sauvegardé à l'étape 0, puis :
--   drop policy if exists public_read on public.fighters;
--   drop policy if exists public_read on public.bibliotheque;
--   drop policy if exists public_read on public.bons_plans;
-- (et "disable row level security" seulement si RLS était désactivé avant).
