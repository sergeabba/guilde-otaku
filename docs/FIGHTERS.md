# Guilde Fighters v3

Jeu de combat 2D de `/fighters` : écran titre, sélection arcade, ordre de
passage, écran VS, combat à quatre boutons avec données propres à chaque
personnage.

## Parcours

1. **Accueil** : format (équipes 3 contre 3 ou duel), adversaire (IA ou
   2 joueurs sur le même clavier), niveau de l'IA.
2. **Sélection arcade** : grands portraits en miroir (J1 à gauche, J2 ou IA à
   droite), roster en nid d'abeille au centre, curseurs rouge (J1) et bleu
   (J2) qui bougent en même temps au clavier, 3 emplacements par camp, rang et
   rōmaji, statistiques, spéciale, état du sprite (« Sprite perso » ou
   « Sprite provisoire »). L'IA tire son équipe au sort parmi les vrais membres,
   curseur visible. Toucher : un premier appui montre le membre, un second le
   choisit.
3. **Ordre de passage** (équipes) : chaque camp touche ses combattants dans
   l'ordre ; l'IA tire le sien. Puis **confirmation** (« Lancer le combat »).
4. **VS**, puis **combat** : intro de manche, chrono 60 s, vie, jauge POW,
   compteur de combo, réserve d'équipe ou manches gagnées, pause, revanche.

Téléphone en portrait : les deux portraits face à face en bandeau, roster
dessous, barre d'action compacte. Téléphone à l'horizontale : miroir comme sur
ordinateur.

## Combat (principes inspirés de MUGEN, sans aucun fichier repris)

- **Données par personnage** (`lib/fighters/characters.ts`) : vitesse, saut,
  taille, coups (démarrage, actif, récupération, dégâts, garde, zone
  d'attaque, recul, annulations), spéciales avec commande, super, talent
  passif. Les zones d'attaque de Craig et Melrick sont calées sur la portée
  réelle de leurs dessins (valeur `reach` des planches).
- **Coups** : poing léger, poing fort, pied léger, pied fort, debout,
  accroupi et sauté (12 coups), projection (avant + poing fort au contact).
- **Garde** : reculer protège en haut et au milieu ; reculer accroupi protège
  en bas et au milieu. Les balayages passent la garde debout, les coups sautés
  passent la garde accroupie. La projection est imparable.
- **Esquive** : roulade avant invulnérable (touche dédiée, ou poing léger +
  pied léger).
- **Combos** : coups légers enchaînables, annulation en spéciale quand le coup
  touche, compteur affiché, dégâts dégressifs.
- **Jauge POW** : monte en frappant et en encaissant ; pleine, elle permet la
  super. En équipes, la jauge passe au coéquipier suivant.
- **Commandes** : tampon de directions (quart de cercle avant 2-3-6 + poing
  pour la spéciale, deux quarts de cercle + poing pour la super) et tampon
  d'appuis (un coup appuyé juste avant la fin du précédent est retenu).
  Raccourcis : touches Spé et Super, boutons tactiles.
- **Arrêt sur image** à l'impact, chute au sol puis relevé invulnérable.

### Personnages personnalisés

| Membre | Sprite | Spéciale | Talent | Source |
| --- | --- | --- | --- | --- |
| Craig Ryan (id 1) | personnalisé | **Quiz Omniscient** : bulle-question qui étourdit | — | fiche : « Stun l'adversaire avec une question impossible » |
| Emmanuel Melrick (id 56) | personnalisé | spéciale commune **provisoire** | **Régénération de Cell** : revient une fois par match avec 20 % de vie | fiche : « Revient d'un K.O. avec 20 % de sa santé si tué » |

La super de tous les personnages (« Furie de la Guilde ») est commune et
provisoire. Les autres membres utilisent la silhouette provisoire et une
spéciale commune qui porte le nom de leur fiche.

## Commandes clavier (touches physiques, AZERTY ou QWERTY)

| | J1 | J2 (2 joueurs) |
| --- | --- | --- |
| Bouger, sauter, s'accroupir | Q D Z S (A D W S en QWERTY) | flèches |
| Poing léger / fort | U / I | pavé 4 / 5 (ou 7 / 8) |
| Pied léger / fort | J / K | pavé 1 / 2 (ou 9 / 0) |
| Spéciale (raccourci) | O | pavé 6 (ou -) |
| Super (raccourci) | L | pavé 3 (ou =) |
| Esquive | H | pavé 0 (ou .) |
| Pause | Échap ou P | |

Sélection : J1 ZQSD + U ou J (choisir) + K (annuler) ; J2 flèches + Entrée
(choisir) + Retour arrière (annuler).

Tactile : manette à 8 directions (glisser le pouce, quarts de cercle
possibles), boutons PL, PF, KL, KF, Spé, Super, Esq.

## Sprites

Pipeline (`scripts/fighters/`) :

1. Chaque personnage personnalisé a son fichier (`chars/craig.ts`,
   `chars/melrick.ts`) : palette, proportions, tête dessinée pixel par pixel
   (avec variantes douleur, K.-O., cri), vêtements, et 35 animations (garde,
   marche avant et arrière, accroupi, sauts, 12 coups, projection, spéciale,
   super, touché debout et accroupi, garde haute et basse, chute, au sol,
   relevé, étourdi, esquive, K.-O., victoire, entrée).
2. `node --experimental-strip-types scripts/fighters/bake-sprites.ts` dessine
   chaque image, regroupe les doublons, puis **vérifie chaque image** : pieds
   sur la ligne de sol de l'ancrage, aucun pixel coupé au bord de la cellule,
   couleurs opaques uniquement, tête présente (peau et cheveux), continuité
   des boucles (pas de saut de taille ou de position). Le script échoue si un
   contrôle ne passe pas.
3. Sorties : `public/fighters/sheets/<clé>.png` (cellules 128 × 112, ancrage
   aux pieds 52, 106) et `lib/fighters/sheets/<clé>.json` (animations, phases
   des coups, portée, tailles).
4. `lib/fighters/sprites.ts` choisit l'image selon l'état du combattant et la
   phase du coup ; `render.ts` dessine la planche, ou la silhouette provisoire.

Vérification des scripts : `npx tsc -p scripts/fighters`.

Références visuelles : **photos réelles** des membres (tenue, coiffure,
lunettes, masque, posture). Les avatars anime des membres représentent des
personnages protégés : ils ne sont pas repris dans les sprites (ils restent
affichés comme portraits de profil, comme ailleurs sur le site).

## Droits

- Aucun personnage, sprite, décor, son, logo ou interface exacte de SNK, de
  MUGEN ou d'un autre jeu. Les références servent de principes (curseurs J1/J2,
  miroir, roster dense, ordre de passage, garde haute et basse, jauge).
- Décors, sprites, effets et projectiles dessinés par le code du dépôt.
- Police pixel : Press Start 2P (SIL OFL). Aucun son.

## Tests

- `tests/fighters-engine.test.ts` : intro, 4 boutons, portée, garde haute et
  basse, coup sauté contre garde basse, projection, esquive, combo et
  compteur, spéciale par commande (une à la fois), jauge et super, Quiz
  Omniscient (étourdi), Régénération de Cell (une fois), statistiques, duel,
  équipes (jauge transmise), temps écoulé, IA reproductible qui fait des
  combos et des spéciales.
- `tests/fighters-sheets.test.ts` : planches complètes, sprites limités à Craig
  et Melrick, zones d'attaque calées sur le dessin.

## Reste à décider ou à créer

- Spéciale active de Melrick (sa fiche ne décrit que le talent passif).
- Supers personnalisées (aujourd'hui commune et provisoire).
- Sprites des autres membres, après validation visuelle de Craig et Melrick.
- Couleur alternative en cas de match miroir, sons, jeu en ligne.
