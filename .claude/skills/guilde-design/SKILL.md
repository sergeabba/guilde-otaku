---
name: guilde-design
description: Système visuel et règles de contenu de Guilde Otaku (tokens gk-*, polices, composants, rōmaji, thèmes, mouvement, musique). À charger avant de créer ou modifier une page, un composant ou du CSS de ce site, pour réutiliser l'existant au lieu de relire app/styles/shonen.css (100 Ko).
---

# Guilde Otaku : système visuel

Esthétique « shōnen / manga » : traits francs, ombres dures décalées, jamais de halo
flou sur les cartes, italique condensé en majuscules pour l'interface, couleur
d'accent = couleur du rang du membre.

## Où sont les choses

- Tokens et composants : `app/styles/shonen.css` (préfixe `gk-`). Ne pas tout lire :
  chercher la classe voulue avec Grep.
- Mouvement : `app/styles/motion.css`, `MotionDirector` (attribut `data-gk-motion`
  sur une section = apparition au défilement ; classe `gk-reveal`, `gk-stagger`).
- Polices auto-hébergées : `app/styles/fonts.css` (jamais `next/font/google`).
- Couleurs de rang, logos, rōmaji : `app/config/ranks.ts` (`rankAccents`, `rankLogos`, `rankRomaji`).
- Musique : `app/styles/music.css`, `app/components/MusicDock.tsx` (lecteur global),
  `app/components/MemberMusic.tsx` (playlist).
- Fiche membre : `app/membres/[id]/` ; Fighters : `app/fighters/` (style propre `fx-` / `fxs-`).

## Tokens (extraits)

| Rôle | Valeur |
| --- | --- |
| Encre / surfaces sombres | `--gk-ink #0d0c10`, `--gk-ink-2 #17151c`, `--gk-ink-3 #221f2a` |
| Papier (thème clair) | `--gk-paper #f4efe4`, `--gk-paper-2`, `--gk-white #fffdf8` |
| Or / tampon | `--gk-gold #c9a84c`, `--gk-hanko #d7332b` |
| Sémantiques | `--gk-bg`, `--gk-surface`, `--gk-surface-2`, `--gk-text`, `--gk-dim`, `--gk-faint`, `--gk-rule`, `--gk-border` |
| Accent | `--gk-accent` (couleur du rang), `--gk-accent-text` (lisible sur fond clair) ; `--pf-on` = texte sur accent (`onColor()`) |
| Trait | `--gk-stroke: 2.5px`, ombre dure `N px N px 0` |
| Polices | `--gk-font-display` (Dela Gothic One), `--gk-font-ui` (Barlow Condensed), `--gk-font-body` (Barlow), `--gk-font-hand` (Caveat) |
| Échelle | `--gk-step--1` à `--gk-step-5`, espacements `--gk-s1` (4px) à `--gk-s9` (112px) |
| Mouvement | `--gk-ease`, `--gk-fast 140ms`, `--gk-med 260ms` |

Thèmes : sombre par défaut, clair via `html[data-theme="light"]`. Forcer localement
avec `.tone-dark` / `.tone-light`. Toujours utiliser les variables sémantiques, pas
les couleurs brutes, pour que les deux thèmes marchent.

## Composants existants (réutiliser avant d'en créer)

`gk-page`, `gk-wrap` (largeur max + gouttières), `gk-btn` (+ `--ghost`, `--sm`,
`--ink`, `--red`), `gk-icon-btn`, `gk-chip(s)`, `gk-switch` (groupe de boutons
`aria-pressed`), `gk-panel` (+ `--accent`, `--flat`), `gk-tag`, `gk-display`,
`gk-h1`…`gk-h4`, `gk-hand` (manuscrit), `gk-chapter`, `gk-rule`, `gk-input`,
`gk-field`, `gk-toast`, `gk-skel`, `gk-sr` (texte lecteur d'écran), `gk-skip`.
Composants React : `GuildeHeader`, `RomajiLabel` (rōmaji + traduction française),
`ShareSheet`, `MemberAwards`, `MemberMusic`, `VideoPlayer`.

## Règles de contenu (non négociables)

- **Aucune écriture japonaise affichée** (kana, kanji) : rōmaji uniquement, avec
  `RomajiLabel`. Vérifier avec `npm run romaji:lint`. Les jaquettes officielles
  gardent leur texte imprimé.
- Interface en **français**, casse de phrase, typographie française.
- **Aucune donnée inventée** : pas de faux titres, liens, pouvoirs ou statistiques.
  Ce qui est dérivé (ex. note S à D calculée d'une statistique) doit l'être
  visiblement à partir d'une donnée réelle.
- Données membres : `fighters.extras` (JSON) validé par `lib/member-extras.ts`.
- Musique : YouTube (lecture complète pour tous) conseillé, Spotify accepté (extrait),
  Apple Music plus lu. Rien ne se lance sans appui. Lecteur YouTube visible ≥ 200 × 200 px
  pendant la lecture (règle YouTube).

## Qualité minimale

- Mobile d'abord : 320 px sans défilement horizontal, cibles tactiles ≥ 44 px,
  barre de navigation mobile `gk-mobile-dock` en bas (≤ 899 px) à ne pas recouvrir.
- `prefers-reduced-motion` respecté ; focus visible ; `aria-label` sur les boutons-icônes.
- Pour un travail visuel : skills `frontend-design` (direction) et
  `web-design-guidelines` (relecture), puis vérifier avec la skill `guilde-qa`.
