# Guilde Otaku V3 - reprise du 13 novembre 2026

## Etat initial du depot

Le depot contient deja un systeme graphique Shonen Editorial (`app/styles/shonen.css`),
une navigation partagee, une recherche Ctrl+K et huit rubriques : membres,
anniversaires, wanted, fighters, film de la semaine, bibliotheque, bons plans et atelier.
Le travail de Claude est conserve, pas remplace.

## Modifications de cette livraison

- Administration : suppression du mot de passe de secours `1111`.
- Authentification : session signee expiree apres 12 heures, envoyee sous forme de cookie
  `HttpOnly`, `SameSite=Lax` et `Secure` en production. Aucun mot de passe / jeton
  d'administration dans `sessionStorage` ou dans la reponse de login.
- Les routes d'edition admin qui utilisent `isAdmin` verifient la session signee.
- La route `DELETE /api/film-semaine` verifie maintenant les droits d'administration.
- Verification de l'origine sur les appels admin modifiant des donnees, si l'en-tete
  `Origin` est present, et rejet explicite des requetes `Sec-Fetch-Site: cross-site`.
- Nouvel endpoint `POST /api/admin/logout` pour revoquer le cookie local.
- Accessibilite : la navigation au clavier (Tab / Maj+Tab) circule normalement
  dans la recherche globale et l'ancre de saut au contenu peut recevoir le focus.
- Responsive : amelioration des marges et de la grille du tableau de bord admin
  sur les petits ecrans.
- SEO : routes `sitemap.xml` et `robots.txt` pour les huit pages publiques.

## IMPORTANT - configurer l'administration AVANT de deployer cette version

Definir dans les variables d'environnement de Vercel (Production et Preview) :

- `ADMIN_PASSWORD` : phrase de passe UNIQUE, aleatoire et d'au moins 12 caracteres.
  L'ancienne valeur de secours `1111` n'est **plus accepte**.
- `ADMIN_SESSION_SECRET` (conseille) : chaine aleatoire d'au moins 32 caracteres,
  distincte du mot de passe. Si omis, une cle de signature est derivee de la
  phrase de passe robuste.

Ne pas exposer ces variables avec le prefixe `NEXT_PUBLIC_`.
Les anciennes sessions seront deconnectees a la mise a jour. C'est normal.

## Limites de securite restantes

Plusieurs interfaces d'administration (`admin-membres`, `admin-fighters`,
`admin-biblio`, `admin-bons-plans`) ecrivent directement dans Supabase via la cle
publique. Un ecran de connexion React **ne protege pas** ces operations :
leur securite depend entierement des policies RLS Supabase existantes.

**Avant d'ouvrir largement le site**, verifier les policies RLS des tables
`fighters`, `bibliotheque`, `bons_plans` et les permissions de stockage.
La prochaine phase recommandee est de migrer ces modifications vers des routes
serveur admin protegees par cookie puis de refuser les ecritures anonymes via RLS.
Aucune policy distante n'a ete modifiee.

Un endpoint de login public reste expose au bruteforce distribue ; configurer
une limite de requetes cote infrastructure ou envisager Supabase Auth.

## Verification

Test autonome de la logique des sessions :

```bash
node --experimental-strip-types --test tests/admin-session.node.mjs
```

Apres `npm ci` :

```bash
npm run lint
npm test
npm run build
```

Puis verifier dans le navigateur : connexion admin, deconnexion, refus des actions
sans connexion, affichage responsive aux largeurs 320 / 390 / 768 / 1440 px,
recherche Ctrl+K au clavier, et `/robots.txt` / `/sitemap.xml`.

Cette livraison n'est **pas** un deploiement de production et n'est pas
une validation visuelle complete. Les donnees et contenus existants sont preserves.
