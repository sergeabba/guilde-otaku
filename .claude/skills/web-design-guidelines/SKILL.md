---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance (accessibility, focus, forms, animation, typography, images, performance, touch, safe areas, theming, hydration). Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel (règles), adaptation locale Guilde Otaku
  source: https://github.com/vercel-labs/web-interface-guidelines (command.md, copie figée le 2026-11-13)
  license: MIT
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines (copie locale)

Les règles sont dans `guidelines.md`, à côté de ce fichier. Copie relue et figée :
on ne télécharge rien à l'usage (pas d'instructions distantes qui changent sans relecture).
Pour mettre à jour, récupérer à nouveau le fichier source, le relire, puis le remplacer.

## Usage

1. Lire `guidelines.md`.
2. Lire les fichiers demandés (ou demander lesquels).
3. Appliquer toutes les règles, sortie au format `file:line` décrit dans `guidelines.md`.

## Adaptations pour ce projet (priment sur `guidelines.md`)

- Site en français : pas de « Title Case » ; casse de phrase, typographie française
  (espace insécable avant `: ; ! ?`, guillemets « »).
- Aucune écriture japonaise dans l'interface : rōmaji uniquement (`npm run romaji:lint`).
- Les composants suivent le système `gk-*` (voir la skill `guilde-design`).
