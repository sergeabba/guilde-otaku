# Guilde Fighters v2

Refonte complète de `/fighters` : écran titre, sélection en miroir, écran VS et
arène 2D pixel art réellement jouable.

## Parcours

1. **Accueil** : format (équipes 3 contre 3 ou duel 1 contre 1), adversaire
   (IA ou 2 joueurs sur le même clavier), niveau de l'IA.
2. **Sélection** : roster des vrais membres publics (portraits anime ou réels,
   nom, rang, rōmaji du rang, distinctions, statistiques, attaque spéciale).
   Recherche, filtres par rang, curseurs J1 (rouge) et J2/IA (bleu), équipes
   visibles de chaque côté. Sur ordinateur : composition en miroir. Sur
   téléphone : panneau du camp qui choisit, grille tactile, barre d'action.
   Toucher affiche un membre, un second appui ou « Choisir » le sélectionne.
   L'IA tire son équipe au sort parmi les membres, et la montre.
3. **VS** : présentation des deux équipes, passe seule ou au toucher.
4. **Combat** : manche avec intro, chrono 60 s, vie, recharge de la spéciale,
   réserve d'équipe (3 contre 3) ou manches gagnées (duel), pause, revanche,
   retour au roster.

## Ce qui est jouable

- Déplacements, saut, garde en reculant, poing, pied, coup de pied sauté,
  attaque spéciale (projectile) avec temps de recharge.
- Impacts, recul, étourdissement, K.-O., victoire, temps écoulé.
- 3 contre 3 à élimination : le perdant laisse place au suivant, le vainqueur
  garde sa vie avec une petite récupération.
- Duel en deux manches gagnantes.
- IA en trois niveaux : elle appuie sur les mêmes touches qu'un joueur.
- Les statistiques réelles (force, vitesse, technique) nuancent dégâts, vitesse
  de marche et recharge, dans des bornes étroites. Sans statistiques
  renseignées, valeurs neutres (50) et la fiche l'indique.

## Commandes

| | Clavier (touches physiques, AZERTY ou QWERTY) | Tactile |
| --- | --- | --- |
| J1 | Q/A et D déplacer, Z/W sauter, J poing, K pied, L spéciale | croix et 3 boutons |
| J2 (2 joueurs) | flèches, `,` ou 1 poing, `.` ou 2 pied, `/` ou 3 spéciale | — |
| Pause | Échap ou P | bouton pause |

Reculer protège. Le mode 2 joueurs n'existe qu'au clavier.

## Architecture

- `lib/fighters/engine.ts` : moteur pur à pas fixe (60 Hz), déterministe,
  sans DOM. Testé dans `tests/fighters-engine.test.ts`.
- `lib/fighters/ai.ts` : IA séparée, hasard reproductible.
- `lib/fighters/render.ts` : rendu Canvas 384 × 216 agrandi sans lissage,
  caméra qui suit l'action sur téléphone en portrait.
- `app/fighters/page.tsx` (serveur) : membres publics via `getPublicMembers`.
- `app/fighters/FightersApp.tsx` : accueil, sélection, VS.
- `app/fighters/FightScreen.tsx` : boucle de jeu, HUD, commandes, pause.

## Visuels et droits

- **Sprites** : deux silhouettes prototypes originales (« gi » et « manteau »),
  dessinées par le code (`render.ts`), articulées par poses, teintées avec la
  couleur de chaque membre. Ce ne sont pas des sprites individuels : chaque
  membre partage l'une des deux silhouettes. L'interface le dit.
- **Décor** : dojo au crépuscule entièrement dessiné par le code.
- **Police pixel** : Press Start 2P (SIL OFL, `public/fonts/press-start-2p`).
- Aucun personnage, sprite, logo, décor, interface exacte ou son de SNK ou
  d'un autre jeu n'est repris. Les références servent uniquement de principes
  (roster dense, curseurs J1/J2, miroir, écran VS, équipes à élimination).
- Les anciennes images `public/arena_*.jpg` (origine inconnue) ne sont plus
  utilisées par la page.
- Aucun son.

## Accessibilité et confort

- `prefers-reduced-motion` : pas de tremblement d'écran, bandeaux sans
  animation, défilés de l'accueil arrêtés, écran VS plus court et statique.
- Pas de flash plein écran. Le combat se met en pause si l'onglet est masqué.
- Cibles tactiles d'au moins 44 px, commandes dans les marges en paysage.

## Reste à créer

- Sprites individuels par membre (pipeline : remplacer `drawFighter` par une
  feuille de sprites par membre, mêmes poses).
- Coups supplémentaires (accroupi, projection), jauge de super, combos dédiés.
- Choix de l'ordre de passage de l'équipe, et jeu en ligne.
- Sons (désactivés par défaut, avec réglage).
