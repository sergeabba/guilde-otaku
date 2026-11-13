# Migration `extras` : procédure pas à pas

Effet : ajoute à la table `fighters` une colonne JSON `extras` (vide par défaut).
Elle active dans l'admin le palmarès à plusieurs distinctions, les anime et
mangas préférés, la musique (Spotify, Apple Music, YouTube), le surnom en
rōmaji et le cadrage des portraits.

- **Additive** : aucune ligne ni colonne existante n'est modifiée ou supprimée.
- **Compatible** : le site lit `select *` ; sans la colonne il fonctionne déjà,
  avec elle il affiche les nouvelles sections dès qu'elles sont remplies.
- **Ne touche pas** aux policies RLS (script séparé, non concerné ici).

Tout se fait dans le tableau de bord Supabase, **SQL Editor**. Exécuter chaque
bloc séparément et lire le résultat avant de passer au suivant.

## 1. Vérifier le bon projet

Dans Supabase, ouvrir le projet dont l'URL (Settings > API > Project URL)
correspond à la variable `NEXT_PUBLIC_SUPABASE_URL` de Vercel (Production).

```sql
select count(*) as membres, count(*) filter (where hidden) as masques from public.fighters;
```

Le nombre doit correspondre à ce que montre `/admin-membres`.

## 2. Examiner la table

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'fighters'
order by ordinal_position;
```

- Si une colonne **`extras` existe déjà** : ne rien exécuter, me transmettre ce
  résultat (il ne contient aucune donnée personnelle ni secret).
- Sinon, continuer.

## 3. Sauvegarde

Les sauvegardes automatiques dépendent de l'offre (Database > Backups ; la
restauration à un instant précis n'existe que sur les offres payantes). Faire
dans tous les cas une copie manuelle :

```sql
create table public.fighters_backup_20261114 as table public.fighters;
select (select count(*) from public.fighters) as origine,
       (select count(*) from public.fighters_backup_20261114) as copie;
```

Les deux nombres doivent être identiques. Ne pas continuer sinon.

## 4. Exécuter la migration

Copier le bloc **UP** de `scripts/migrations/2026-11-13_fighters_extras.sql` :

```sql
alter table public.fighters
  add column if not exists extras jsonb not null default '{}'::jsonb;
alter table public.fighters
  drop constraint if exists fighters_extras_is_object;
alter table public.fighters
  add constraint fighters_extras_is_object check (jsonb_typeof(extras) = 'object');
comment on column public.fighters.extras is
  'Profil enrichi facultatif (favoris anime/manga, musique, palmarès, points focaux). Validé par lib/member-extras.ts.';
```

## 5. Vérifier que rien n'a changé

```sql
select count(*) as lignes,
       count(*) filter (where extras = '{}'::jsonb) as extras_vides
from public.fighters;

-- Aucune différence attendue sur les colonnes existantes :
select count(*) as differences
from public.fighters f
join public.fighters_backup_20261114 b using (id)
where (to_jsonb(f) - 'extras') is distinct from to_jsonb(b);
```

Attendu : `lignes` = `extras_vides` = nombre de membres, et `differences` = 0.

## 6. Vérifier dans l'admin

Recharger `/admin-membres`, ouvrir un membre : l'onglet **Univers** et le
**Palmarès** ne doivent plus afficher « après la migration ». Le premier
enregistrement depuis l'admin modifie ce membre réel : choisir un ajout facile
à retirer (par exemple un anime préféré), vérifier la fiche, puis le retirer.

## Retour arrière

Les données existantes n'ayant pas été modifiées, retirer la colonne suffit
(cela efface les favoris, palmarès et musiques saisis depuis) :

```sql
alter table public.fighters drop constraint if exists fighters_extras_is_object;
alter table public.fighters drop column if exists extras;
```

En dernier recours, restaurer depuis la copie de l'étape 3. Quand tout est
validé depuis quelques jours, la copie peut être supprimée :
`drop table public.fighters_backup_20261114;`
