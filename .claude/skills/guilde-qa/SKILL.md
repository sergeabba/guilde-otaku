---
name: guilde-qa
description: Vérifier une modification de Guilde Otaku dans un vrai navigateur sans toucher aux données de production (faux Supabase en lecture seule, serveur de dev, captures ordinateur et téléphone, erreurs JS, débordement), puis lancer tests, lint et build. À utiliser après tout changement d'interface ou avant de proposer une publication.
---

# Guilde Otaku : vérification

Objectif : prouver que ça marche avec le moins d'étapes et de contexte possible.

## 1. Données de test (jamais la vraie base)

```bash
node scripts/qa/fake-supabase.mjs 5556 &
```

Sert `scripts/qa/fixture.json` (Craig id 1 avec palmarès, favoris et musique
YouTube/Spotify/Apple ; Melrick id 56 ; Merveille id 2 sans données). Lecture seule :
toute écriture renvoie 405. Ajouter un cas au fichier si besoin.

## 2. Serveur de dev branché dessus

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5556 NEXT_PUBLIC_SUPABASE_ANON_KEY=test npx next dev -p 3008 &
```

Sans ces variables, le site passe en mode démo (`data/members.ts`, sans `extras`).

## 3. Captures et contrôles

```bash
node scripts/qa/shoot.mjs /membres/1 qa-shots
```

Ordinateur 1440 px et iPhone 13, défilement lent (déclenche les apparitions
`data-gk-motion`), sortie JSON : `overflowX` (doit valoir 0) et `errors` (doit être vide).
Regarder les PNG avant de conclure. `qa-shots/` est ignoré par git.

Pièges connus :
- Capture « pleine page » sur téléphone : en-tête, sommaire et barre du bas
  collants apparaissent au milieu ; ce n'est pas un bug.
- Sections vides sur une capture = apparition pas encore déclenchée : défiler plus lentement.
- YouTube, Spotify, AniList, pochettes `i.ytimg.com` et Supabase sont souvent bloqués
  dans l'environnement cloud : simuler `https://www.youtube.com/iframe_api` avec
  `context.route` pour tester le lecteur flottant.
- `/fighters` en dev expose `window.__fxState` (état du combat) pour les tests.

## 4. Avant de proposer une publication

```bash
npx jest && npx tsc --noEmit -p . && npm run -s romaji:lint && npx next build
npx eslint <fichiers modifiés>
```

Le dépôt contient des erreurs de lint anciennes dans d'autres fichiers : ne linter que
ce qui a changé et le dire. Sprites Fighters : `node --experimental-strip-types
scripts/fighters/bake-sprites.ts` puis `npx tsc -p scripts/fighters`.

Ne jamais : lancer de migration Supabase, écrire dans la vraie base, mettre un secret
dans le code ou le chat, pousser sur `main` sans accord explicite.
