---
name: react-bits
description: Composants animés React Bits (DavidHDev/react-bits) pour Guilde Otaku : textes animés, animations, fonds, micro-interactions. À utiliser quand une page a besoin d'un effet animé (titre qui se révèle, fond animé, curseur, compteur, bordure lumineuse...) avant d'en coder un soi-même. Donne le catalogue, la récupération du code depuis GitHub et l'adaptation aux règles du site.
---

# React Bits pour Guilde Otaku

React Bits est une collection de composants animés à copier dans le projet (pas un paquet
npm). Catalogue des composants gratuits : `references/catalogue.md` (nom, effet, identifiant).

## 1. Choisir

- Chercher dans `references/catalogue.md` par effet voulu. Préférer, dans l'ordre :
  1. un composant sans dépendance, ou qui n'utilise que `framer-motion` (déjà installé ;
     React Bits l'importe sous le nom `motion/react`, remplacer par `framer-motion`) ;
  2. `gsap` ou `ogl` (légers) : à ajouter, en le disant dans le compte rendu ;
  3. `three` seulement pour un effet qui le mérite (page entière, chargé à la demande).
- Un fond WebGL par page au plus ; jamais derrière un long texte.
- Le site a déjà ses effets (`lib/fx.ts`, `app/styles/ambiance.css`, `motion.css`,
  `MusicPulse`) : ne pas doubler un effet existant.

## 2. Récupérer le code (variante TypeScript + CSS)

`reactbits.dev` est bloqué par le réseau de cet environnement ; GitHub passe :

```bash
B=https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/ts-default
curl -fsS "$B/<Catégorie>/<Nom>/<Nom>.tsx" -o /tmp/<Nom>.tsx
curl -fsS "$B/<Catégorie>/<Nom>/<Nom>.css" -o /tmp/<Nom>.css   # absent pour certains
```

Catégories : `TextAnimations`, `Animations`, `Components`, `Backgrounds`, `Micro`.
Si un nom ne répond pas, lister le dossier avec
`gh api repos/DavidHDev/react-bits/contents/src/ts-default/<Catégorie>` ou cloner le dépôt
(`git clone --depth 1`, 800 Mo : dans le scratchpad, puis le supprimer).
Lire tout le fichier avant de l'utiliser (imports, dépendances, effets de bord).

## 3. Adapter au site

- Ranger dans `app/components/bits/<Nom>.tsx` (+ `<nom>.css`), avec en tête :
  `// D'après React Bits (<Nom>), DavidHDev/react-bits, licence MIT + Commons Clause.`
- `"use client"` en première ligne. Imports `motion/react` vers `framer-motion`.
- Mouvement réduit : rien ne bouge avec `prefers-reduced-motion: reduce` (garder l'état
  final visible). Respecter aussi le réglage d'animations du site (`MotionSettings`).
- Performance : WebGL et canvas chargés avec `next/dynamic` (`ssr: false`), en pause hors
  écran (IntersectionObserver) et onglet caché, pixel ratio plafonné à 2 ; pas d'effet de
  curseur sur écran tactile.
- Couleurs et polices : tokens `--gk-*` et `--gk-accent` (skill `guilde-design`), jamais de
  couleurs en dur hors du composant ; textes en français, rōmaji seulement, aucune écriture
  japonaise (`npm run romaji:lint`).
- Accessibilité : un texte animé découpé en lettres garde son texte entier pour les lecteurs
  d'écran (`aria-label` sur le conteneur, morceaux en `aria-hidden`).
- Pas de `any` ajouté au-delà de ce que le fichier d'origine impose ; lint et types propres.

## 4. Vérifier

`npx tsc --noEmit -p .`, `npx eslint`, `npm run romaji:lint`, build, puis skill `guilde-qa`
(ordinateur et téléphone, débordement, erreurs JS, mouvement réduit).

## Licence

MIT + Commons Clause : usage libre dans le site, y compris commercial ; interdit de vendre
ou redistribuer les composants eux-mêmes (pas de paquet de composants React Bits).
Les offres React Bits Pro (payantes) ne sont pas couvertes ici.
