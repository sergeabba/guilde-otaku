# Direction artistique v3 : moodboard annoté et critique

Aucune image des jeux n'est copiée dans le dépôt (droits d'Atlus) : chaque écran est décrit,
avec ce qu'on en retient comme **principe**. Les sources sont en bas.

## 1. Persona 5 Royal : écran par écran

| Écran | Ce qu'on voit | Principe |
| --- | --- | --- |
| Menu de pause | Le héros en très grand, coupé par le bord de l'écran, pose différente selon l'entrée choisie. Les entrées (une dizaine de mots) ont chacune leur taille, leur angle et leur position, en escalier désordonné. L'entrée choisie s'inverse (blanc sur noir) sur une dalle rouge qui déborde. | **La typographie est la mise en page.** Chaque mot est un objet. Le personnage réagit à la navigation. |
| Choix d'une commande en combat | Les commandes sont réparties autour du personnage, chacune sur un bouton de manette dessiné, avec une icône et un mot découpé. | **L'interface tourne autour du corps**, pas dans une colonne. |
| Statut et équipement | Portrait en buste incliné, chiffres énormes en contour, barres en lames, fond de trame (pois, étoiles) en deux tons. | **Chiffres comme graphisme.** Fond en motif, jamais en dégradé. |
| Confidents | Une carte de tarot par personnage (arcane, rang en chiffres romains, étoiles de progression), portrait qui sort de la carte. | **Chaque relation a un objet** (la carte) et une progression visible. |
| Résultats de combat | Le personnage traverse tout l'écran en diagonale, les gains s'empilent en rubans inclinés, « Results » en lettres géantes. | **La diagonale porte la lecture** ; la composition change d'un écran à l'autre. |
| Calendrier | Bloc date en haut à gauche : jour en chiffre géant, jour de la semaine en dalle, météo en pictogramme. | **Repère permanent et identitaire**, toujours au même endroit. |
| Transitions | Volets graphiques (silhouettes, étoiles, éclaboussures) qui recouvrent l'écran en moins d'une demi-seconde. | **Une transition est une forme**, pas un fondu. |
| Couleur | Rouge, noir, blanc. Les sous-couleurs sont bannies sauf pour PV et PM (conférence CEDEC 2017). | **Trois tons et c'est tout** : la contrainte fait l'identité. |
| Lettrage | Mots en lettres découpées (polices différentes par lettre), contours épais, dalles de papier. | **Le collage est un langage**, utilisé pour les moments, pas partout. |

## 2. Metaphor: ReFantazio : écran par écran

| Écran | Ce qu'on voit | Principe |
| --- | --- | --- |
| Menu principal | Collage d'éléments disparates qui « tombent » à des angles décalés ; bords peints au pinceau ; papier visible. | **L'interface est une œuvre manipulée** (papier, peinture), pas un écran. |
| Fiches de personnages | Portrait peint en pied, intégré par un masque de pinceau, nom en grande capitale à empattements avec lettrine, ornements dorés. | **L'illustration est fondue dans la page**, jamais encadrée. |
| Archétypes | Arbre de progression en constellation ornementale ; chaque archétype a un sceau et un nom gravé. | **Le symbole porte le sens** : un rang = un emblème reconnaissable. |
| Dialogues | Bulles comme morceaux de parchemin posés sur l'image. | **Matière** : papier, encre, dorure. |
| Progression | Calendrier en almanach, jauges en ornements. | Même l'information chiffrée est **ornementée**. |
| Typographie | Capitales à empattements élégantes + interface condensée ; lettrage ajusté mot par mot (selon la presse, lettre par lettre par menu). | **Dualité** : prestige (serif) et action (condensé). |

## 3. Les deux ensemble

Persona apporte l'**énergie** (dalles, angles, contraste, collage, personnage qui réagit) ;
Metaphor le **prestige** (sceaux, ornements, papier, peinture, lettrines). Les deux partagent :
le refus du rectangle, la composition hors grille, l'illustration qui traverse l'interface,
une transition qui est une forme.

## 4. Critique honnête de notre interface (état `ab45ef4`)

Si on retire les effets, il reste un site classique :
- **Accueil** : seule la couverture a une composition ; dessous, des bandes rectangulaires
  pleine largeur (générique, histoire, Futilités, sommaire, « À la une » en cartes, annuaire en grille).
- **Rubriques** : même gabarit partout (repère de chapitre, grand titre, chapeau, contenu) ;
  le décor de planche ajouté reste un décor.
- **Fiche en planche** : une grille de boîtes rectangulaires ; le portrait est posé dans un cadre.
- **Boutons, filtres, onglets** : rectangles à bordure ; aucune forme propre à la Guilde.
- **Grades** : une couleur et un logo d'image ; aucun emblème dessiné, aucune cérémonie.
- **Bankai** : un bandeau sur fond radial.

## 5. Structures à remplacer

| Structure générique | Remplacée par |
| --- | --- |
| Section rectangulaire pleine largeur | Scène composée (plans superposés, diagonale, personnage qui traverse) |
| Titre + chapeau identiques | Composition de titre propre à chaque rubrique (sceau, phylactère, lame) |
| Bouton rectangle | Lame (quadrilatère irrégulier déterministe) avec dalle d'ombre |
| Portrait dans un cadre | Masque de pinceau ou détourage + silhouettes d'écho |
| Couleur de grade seule | Sceau de grade dessiné (SVG original) |
| Fond uni ou dégradé | Papier grainé + motif trois tons (pois, étoiles, rayures) |

## Sources

- [PC Gamer : les menus d'Atlus « vraiment pénibles » à concevoir](https://www.pcgamer.com/games/rpg/persona-series-director-says-atluss-flashy-menus-are-actually-really-annoying-to-design)
- [Kotaku : Hashino sur les menus de Metaphor et Persona 5](https://kotaku.com/metaphor-refantazio-persona-5-menu-ui-hashino-1851667088)
- [GamesRadar : le lead UI de Metaphor (Koji Ise), « Hyper stylish »](https://www.gamesradar.com/games/jrpg/the-lead-ui-designer-on-metaphor-refantazio-had-never-designed-for-a-game-before-he-just-rolled-up-and-made-some-of-the-best-ui-ive-ever-seen-in-a-jrpg)
- [GamesRadar : comment Atlus a obtenu ses interfaces](https://gamesradar.com/games/rpg/how-did-persona-5-persona-3-and-now-metaphor-refantazio-achieve-some-of-the-best-ui-in-jrpg-history-its-veteran-atlus-director-stresses-unity-and-support-for-dev-teams)
- [PC Gamer : accessibilité des menus jugés surchargés](https://pcgamer.com/games/rpg/persona-and-metaphor-refantazios-ui-designer-is-open-to-accessibility-options-for-players-who-find-the-stylish-menus-overstimulating-that-is-something-we-understand-well-need-to-work-on-and-provide-in-the-future)
- [Siliconera : conférence CEDEC sur l'interface de Persona 5](https://www.siliconera.com/?p=668266)
- [Source Gaming : chronique de Sakurai sur l'interface (Famitsu 515)](https://sourcegaming.info/2016/11/24/the-aims-of-ui-sakurais-famitsu-column-vol-515/)
