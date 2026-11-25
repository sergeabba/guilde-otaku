---
name: guilde-studio
description: Routeur de tous les skills de design, de mouvement et de jeu de Guilde Otaku - dit quel skill (actif ou de la bibliothèque .claude/skill-library) utiliser pour chaque tâche, l'ordre de priorité en cas de conflit, la politique technique (Framer Motion, GSAP, Three.js, PixiJS, Phaser), les références artistiques et les niveaux de performance. À lire en premier pour toute tâche de direction artistique, page, animation, interaction, Fighters ou mini-jeu.
---

# Guilde Studio : le routeur

## 1. Priorités (de la plus forte à la plus faible)

1. **Les règles du projet** : `CLAUDE.md`, données préservées, rōmaji seulement (aucune
   écriture japonaise affichée), aucune donnée inventée, rien repris d'une œuvre existante.
2. **`guilde-design`** : l'identité de la Guilde (tokens, rangs, thèmes, composants).
3. **Ce routeur** : les arbitrages ci-dessous.
4. Les skills spécialisés.

Règles d'autres skills **qui ne s'appliquent pas** ici (elles visent des sites d'entreprise) :
l'interdiction du violet (taste-skill : nos rangs en utilisent), « une section par écran »,
« aucune légende sous une image », « aucune apparition au défilement » (on en garde, mesurées),
les photos d'illustration achetées (on n'utilise que les portraits et œuvres de la Guilde).
On garde de ces skills : le refus du générique, la rigueur des bords, le texte concret.

## 2. Qui fait quoi

| Tâche | Skill d'abord | Puis |
|---|---|---|
| Direction artistique d'une page, critique, audit visuel | `impeccable` (critique, audit, bolder, delight, overdrive, layout, typeset, colorize) | `design-taste-frontend`, `no-ai-design-slop`, `audit-ai-design-slop` |
| Nouvelle page signature, niveau Awwwards | `build-awwwards-quality-sites` | `frontend-design`, `impeccable` (craft), `ui-ux-pro-max` (idées de style) |
| Système de design, tokens, DESIGN.md | `guilde-design` | `design-system`, `ui-styling`, `impeccable` (document, extract) |
| Créer une animation | `animate` (Emil) | `animation-vocabulary` (trouver le mot juste), `apple-design` (ressorts, physique) |
| Plusieurs éléments qui bougent ensemble | `choreograph` | `cinematic-gsap-lenis-motion-system` si GSAP est retenu |
| Gestes (glisser, tirer, balayer) | `gestures` | `mobile-native` |
| Revue ou audit des animations | `review-animations`, `improve-animations` | `find-animation-opportunities`, `remove-animations` |
| Performance des animations | `animation-performance` | `optimize-web-animations`, `performance-optimization` |
| Composant animé prêt à adapter | `motion-primitives` (interface) | `react-bits` (effets spectaculaires) |
| Tester une interface jusqu'à la casser | `break-ui` | `guilde-qa` |
| Plusieurs variantes à comparer | `prototype` (Emil) | |
| Retenir une correction de goût | `learn-taste` (vers `guilde-design` ou ce routeur) | |
| Choisir une bibliothèque | `pick-ui-library` | ce routeur, section 4 |
| Fighters : coups, équilibrage, test | `fighters-studio` | `game-feel`, `design-action-combat`, `game-dev-combat-animation` |
| Fighters : finition des attaques | `game-dev-combat-skill-polish` | `create-game-vfx`, `pixelfx` |
| Fighters : effets d'impact et de spéciales | `pixelfx` (pixel art, sans dépendance) | `create-game-vfx`, `shader-programming` |
| Sprites d'un membre | `codixel` (à partir de son portrait, validé avec l'utilisateur) | `create-game-assets` |
| IA d'adversaire | `game-ai`, `tune-enemy-ai` | `fighters-studio` |
| Commandes clavier, manette, tactile | `input-systems` | `mobile-native` |
| Son de jeu, retours sonores | `build-game-audio-feedback`, `audio-design` | |
| Caméra (zoom, secousse, cadrage) | `camera-systems` | `game-feel` |
| Interface de jeu (menus, HUD, sélection) | `game-ui-ux` | `impeccable` |
| Nouveau mini-jeu web | `phaser-core` ou `pixijs-rendering` (voir section 4) | `test-playable-web-games` |
| Tester un jeu jouable | `test-playable-web-games` | `fighters-studio` (test de jeu) |
| Vérifier avant d'annoncer | `guilde-qa`, `verification-before-completion` | |

**Bibliothèque à la demande** (`.claude/skill-library/INDEX.md`, 287 skills) : lire le
`SKILL.md` voulu avec Read. Familles utiles :
- `mengto/web-design` (104) : fonds, grilles, lasers, verre, défilement cinéma, tramage,
  particules, typographie éditoriale ; `mengto/3d` (33) : Three.js, eau, lumière ;
  `mengto/illustration` (16) : trames, encre, demi-teinte (utile pour le style manga) ;
  `mengto/game-development` (26) : sélecteur de personnage 3D, VFX, ennemis, caméra ;
  `mengto/media`, `video-editing` : bandes-annonces et captures.
- `gamedev/genres` : jeu de rythme absent, mais `rpg`, `visual-novel`, `card-game`,
  `puzzle`, `platformer`, `roguelike` ; `gamedev/workflows` : `prototype-fast`, `game-jam` ;
  `gamedev/web-engines` : Three.js (scène, matériaux, glTF).
- `emil` : Swift, Expo, Sonner, `ask-emil`, aide-mémoires UI et performance.
- `ui-ux-pro-max` : `brand`, `design`, `banner-design`, `slides`.

## 3. Références artistiques (inspiration, jamais copie)

| Domaine | Référence | Ce qu'on en retient |
|---|---|---|
| Créativité web | Awwwards | compositions qui surprennent, transitions mémorables |
| Fluidité | Apple | ressorts, interruptibilité, détail invisible |
| Personnalité graphique | Persona 5 Royal | typographie découpée, angles, contraste violent, menus qui bougent |
| Sélection de personnages | Bleach Rebirth of Souls | portraits en grand, présentation dramatique, couleur par perso |
| Rangs et distinctions | Metaphor ReFantazio | interface RPG ornementale, cartes d'archétype, cérémonie de rang |
| Mise en scène des combats | Guilty Gear Strive | caméra dynamique, impact lisible, ralentis, contre-coups |
| Pixel art et animation | King of Fighters XIII | sprites détaillés, animations fluides, poses fortes |
| Attaques spéciales | Naruto Ultimate Ninja Storm | cinématique de super, gros plans, coupure d'écran |

Interdit : reprendre leurs images, logos, sons, polices, noms, personnages ou interfaces
reconnaissables. On transpose un principe, avec les rangs, couleurs et membres de la Guilde.

**Chaque rubrique a sa personnalité**, dans le même univers manga :
Accueil (couverture de magazine, chapitre 1) · Membres (écran de sélection) · Fiche (dossier
et planche) · Teams (jour de match) · Fighters (arcade) · Jeux (salle d'arcade, quiz-show) ·
Cinéma (salle obscure) · Bibliothèque (étagère de mangas) · Calendrier (grille de diffusion) ·
Anniversaires (fête) · Wanted (avis de recherche) · Futilités (atelier).
À éviter partout : halos flous, dégradés gratuits, animations sans rôle, mise en page de
modèle générique.

## 4. Politique technique

- **Framer Motion** : moteur principal pour l'interface (React, ressorts, gestes, layout).
- **CSS** (transitions, `@keyframes`, View Transitions, `animation-timeline`) : tout ce qui
  peut l'être, c'est le moins coûteux.
- **GSAP** (+ ScrollTrigger) : seulement pour une séquence longue pilotée par le défilement
  (page signature en scrollytelling) que Framer Motion rend fragile. Une page, chargé à la
  demande. Proposer avant d'ajouter.
- **Three.js** : seulement pour une vraie scène 3D (sélection de personnage en volume,
  arène 3D). Chargé à la demande, une scène par page, repli 2D.
- **PixiJS** : si le rendu canvas 2D de Fighters ou d'un mini-jeu sature (beaucoup de
  particules, filtres). Le moteur de Fighters reste ; seul `render.ts` changerait.
- **Phaser** : pour un nouveau mini-jeu complet (physique, scènes), jamais pour Fighters.
- Une seule bibliothèque par besoin. Toute nouvelle dépendance : justification écrite
  (gain mesuré, poids, chargement), validation de l'utilisateur.

## 5. Niveaux de performance

- **Objectif** : 60 images/s sur les appareils compatibles, pas une promesse universelle.
- **Trois niveaux** (déjà amorcés dans `lib/perf.ts`) : complet (ordinateur, téléphone
  récent), allégé (appareil lent, économie d'énergie, batterie faible : moins de particules,
  pas de flou ni de WebGL), réduit (`prefers-reduced-motion` ou réglage du site : aucun
  mouvement décoratif, états finaux visibles, fondus courts au plus).
- Animer `transform` et `opacity` ; pas de layout dans une boucle ; pause hors écran et
  onglet caché ; images aux bonnes tailles.
- Chaque phase : mesure avant / après (Playwright : temps de chargement, décalages de mise
  en page, images par seconde sur la page animée), `guilde-qa`, revue de sécurité des
  dépendances ajoutées.

## 6. Branche et validation

Travail sur `claude/guilde-niveau-superieur`. Rien n'est fusionné dans `main` sans la
validation de l'utilisateur. Chaque phase se termine par : skills utilisés, captures
avant/après, mesures, risques, propositions pour la suite.
