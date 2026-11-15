# Administration de Guilde Otaku

## Accéder à `/admin`

L'accès repose sur une phrase de passe définie **uniquement** dans les variables
d'environnement du serveur. Il n'existe aucun mot de passe par défaut.

Vercel : projet **guilde-otaku**, puis **Settings > Environment Variables**.

| Variable | Obligatoire | Règle | Environnements |
| --- | --- | --- | --- |
| `ADMIN_PASSWORD` | oui | au moins 12 caractères, pas `1111`, jamais de préfixe `NEXT_PUBLIC_` | Production (et Preview si besoin) |
| `ADMIN_SESSION_SECRET` | conseillée | au moins 32 caractères, différente du mot de passe ; la changer déconnecte toutes les sessions | Production (et Preview) |
| `SUPABASE_SERVICE_ROLE_KEY` | oui pour écrire | clé `service_role` du projet Supabase (Settings > API) | Production (et Preview) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | déjà utilisées par le site | toutes |

Après toute modification de variable : **Deployments**, dernier déploiement de
production, menu **⋯**, **Redeploy**. Les variables ne s'appliquent qu'aux
nouveaux déploiements.

Si la connexion échoue, la page affiche la règle exacte non respectée
(variable absente, trop courte...), sans jamais afficher de valeur.

### Vérifier la clé serveur sans l'afficher

Connecté à `/admin`, ouvrir `/api/list-storage?folder=fighters` dans le même
navigateur :

- liste de fichiers : la clé est présente et valide ;
- « Configuration manquante » : variable absente en Production ;
- autre erreur : clé incorrecte.

## Gérer les membres (`/admin-membres`)

- Toucher une carte ouvre l'éditeur (téléphone et ordinateur).
- **Identité** : nom, grade, distinction, anniversaire, pays, couleur, présentation.
  Bouton **Enregistrer** en bas ; les erreurs s'affichent en rouge au-dessus.
- **Portraits** : remplacer l'image réelle ou anime (et la vidéo). Les photos
  de téléphone sont réduites automatiquement (2000 px max). Chaque envoi crée un
  nouveau fichier : l'ancien reste dans le stockage, rien n'est effacé.
- **Cadrage** : toucher le visage sur le portrait. Les aperçus montrent le
  résultat sur la fiche, la carte téléchargeable, l'annuaire et l'aperçu WhatsApp.
- **Univers** : anime et mangas préférés (recherche AniList ou saisie manuelle),
  ordre, trois coups de cœur, note personnelle, musique YouTube.
- **Masquer** retire du site sans rien effacer. **Supprimer** est définitif.

Cadrage et Univers nécessitent la migration `extras` ci-dessous. Sans elle,
l'éditeur l'indique et le reste fonctionne.

## Sécurité

Toutes les écritures passent par le serveur (`/api/admin/*`), après contrôle de
la session admin et de l'origine de la requête, avec la clé serveur. Les tables,
colonnes et valeurs sont validées (grade connu, couleur, adresses https, pas
d'écriture japonaise affichée, liens YouTube vérifiés).

## Migrations (à exécuter à la main, dans l'ordre, après relecture)

1. `scripts/migrations/2026-11-13_fighters_extras.sql`
   - Ajoute la colonne `fighters.extras` (JSON, vide par défaut) et une contrainte
     « objet JSON ». **Ne modifie aucune donnée existante.**
   - Effet : active le cadrage, les favoris, la musique et le surnom rōmaji.
   - Retour arrière : section DOWN (sauvegarder `extras` avant).
2. `scripts/migrations/2026-11-14_admin_writes_rls.sql`
   - Lancer d'abord l'étape 0 (lecture seule) et garder le résultat.
   - Active RLS, garde la lecture publique, puis suppression manuelle des
     policies d'écriture anonymes. **Ne modifie aucune donnée.**
   - Effet : la clé publique ne permet plus d'écrire ; l'admin continue de
     fonctionner via le serveur.
   - Prérequis : le code actuel en production et `SUPABASE_SERVICE_ROLE_KEY` vérifiée.

## Contrôles des fiches (V4.2 § 7B : `members:validate`, `media:audit`)

Lecture seule : rien n'est modifié ni effacé, le rapport dit quoi corriger dans l'admin Membres.

- **Admin** : Tableau de bord → « Contrôles des fiches ». « Vérifier aussi les images » teste en plus chaque portrait, jaquette et pochette.
- **Terminal** : `npm run members:validate` (ajouter `-- --links` pour les images, `-- --json` pour une sortie JSON). Lit `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`. Code de sortie 1 s'il reste des erreurs.
- Logique commune : `lib/services/member-quality.ts` (tests : `tests/member-quality.test.ts`).

Contrôles : nom, portraits réel et anime, anniversaire lisible, caractères japonais (nom, présentation, distinction, grade), doublons de nom ou de photo, profil enrichi illisible, favoris/musiques/distinctions écartés ou en double, favoris sans jaquette ni titre, fiches masquées.
