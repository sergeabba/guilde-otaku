# Exploration artistique : trois directions radicales

Prototypes : `/explo` (sommaire), `/explo/a`, `/explo/b`, `/explo/c`, et `/explo/{a,b,c}/membre/[id]`.
Données réelles uniquement. Nouveauté transversale : les **détourages** des portraits anime
(47 générés en local avec le modèle isnet-anime de rembg ; 8 écartés automatiquement car le
fond n'a pas été retiré proprement ; `scripts/make-cutouts.py`, `lib/cutouts.json`). Ils
permettent enfin aux personnages de sortir des cadres.

## A · La planche vivante (manga éditorial expérimental)
- **Langage** : la page est une planche. Cases tracées en diagonale (clip-path, trait d'encre
  qui suit les angles), gouttières blanches, encre noire et un seul vermillon d'impression.
  Personnages encrés (niveaux de gris) qui débordent de leur case et prennent leurs couleurs
  au survol. Onomatopées, bulles, encadrés de narration, tampon de grade.
- **Navigation** : onglets de tranche d'un livre sur le bord droit ; chaque onglet sort au
  survol et montre son « hôte » (membre choisi d'après les données : le plus fort pour
  Fighters, le plus lecteur pour la Bibliothèque…). Téléphone : marque-page rouge qui déplie
  un sommaire en planche de cases. Transition : la page se tourne en diagonale.
- **Membre** : un chapitre. Page d'ouverture (splash), bio découpée en encadrés, fiche en
  cases (statistiques au pinceau), puis la séquence du bankai pilotée par le défilement : la
  planche se brise, l'encre envahit, « BAN… KAI ! », le personnage surgit aux couleurs du
  membre, gros plan, nom du bankai ; enfin le territoire s'étend en cercle et inverse tout
  l'environnement (anneaux de trame, nom qui tourne autour du personnage).

## B · Grand menu (interface de JRPG)
- **Langage** : nuit indigo, couleur du membre en grands aplats, étoiles géantes qui tournent,
  rayures, tout incliné. Lettres découpées dans six polices de la Guilde (collage stable par
  nom). Personnages détourés doublés de deux silhouettes décalées (blanche et noire).
- **Navigation** : l'accueil est le menu principal (barres en escalier, curseur triangulaire,
  ↑ ↓ Entrée). Chaque rubrique change le personnage affiché (hôte d'après les données) et la
  couleur du décor. « Nakama » ouvre une sélection d'équipe (← → Entrée). Transition : coupe
  en diagonale. Le menu revient avec Échap.
- **Membre** : écran de statut. Nom en lettres découpées, carte de grade ornementale (numéro
  en chiffres romains), onglets Q / E (Statut avec radar, Pouvoirs, Palmarès, Univers).
  « Libérer le bankai » : incrustation plein écran (éclair, bandes noires, gros plan sur le
  regard, nom). « Étendre le territoire » : toute l'interface change d'environnement
  (anneaux, palette, texte qui tourne, secousse) jusqu'à « Dissiper ».

## C · Butai (cinéma immersif WebGL)
- **Langage** : salle noire, lumière chaude, grain, grande italique de cinéma. Une scène
  WebGL unique (shader écrit pour la Guilde, sans bibliothèque) : portraits en trame de points,
  fondu « à l'encre » d'un portrait à l'autre, lumière qui suit le pointeur, éclatement avec
  décalage chromatique, anneaux du territoire. Résolution adaptative.
- **Navigation** : frise de chapitres façon timecode (saut direct), index plein écran en
  grande italique avec le personnage au survol.
- **Membre** : son film. Titre en trame, puis le portrait anime se dissout à l'encre dans sa
  photo réelle (« dans la vraie vie », bio en sous-titres), fiche, bankai (l'image éclate et
  se reforme), territoire (anneaux qui envahissent l'image), séance suivante.

## Critique (la mienne, exigeante)

| | A · Planche | B · Grand menu | C · Butai |
|---|---|---|---|
| Rupture avec l'ancien site | Forte | Très forte | Forte |
| Identité propre à la Guilde | Forte (langage manga) | Moyenne : trop proche du vocabulaire des JRPG si on ne l'approprie pas | Moyenne : beau, mais plus « film » que manga |
| Plaisir d'usage, envie d'explorer | Bon | Le meilleur (menus, hôtes, sélection, bankai à déclencher) | Contemplatif, peu d'interaction |
| Lisibilité | Moyenne sur téléphone | Bonne | Fragile (texte sur image animée) |
| Bankai / territoire | Le plus « manga » (séquence) | Le plus spectaculaire (incrustation, environnement) | Le plus cinéma (éclat, anneaux) |
| Téléphone | Correct, dense | Très bon (pouce, 60 i/s) | Correct, plus lourd |
| Performance (sans carte graphique, mesures pessimistes) | 53-60 i/s | 60 i/s tél., 15-17 i/s ordi (décor en rotation) | 26-44 i/s |
| Note | 7 / 10 | 8 / 10 | 6,5 / 10 |

**Défauts relevés et corrigés pendant l'exploration** : onomatopée qui masquait le titre,
encadrés trop longs, gros plans trop zoomés (on ne voyait plus le regard), onglet actif
illisible, menu qui débordait, titre d'ouverture superposé, personnage en double sur la
scène WebGL, détourages ratés (écartés), texte illisible en mode « différence ».

**Défauts qui restent** :
- A : la planche 2 reste chargée quand les personnages sont larges ; les onomatopées sont
  génériques (il faudrait un lettrage dessiné pour la Guilde) ; la séquence du bankai demande
  4 écrans de défilement.
- B : sans appropriation, le collage de lettres et les étoiles rappellent trop un jeu existant ;
  il faut un vocabulaire graphique propre (emblème de la Guilde, motifs des grades) ; le décor
  en rotation coûte cher sur un ordinateur sans accélération graphique (prévoir un niveau
  allégé).
- C : très beau sur l'accueil, mais pas un langage d'interface : naviguer, chercher, comparer
  y est moins naturel ; texte fragile sur l'image.
- Les trois : quelques illustrations d'origine contiennent du lettrage japonais dessiné (c'est
  l'œuvre elle-même, aucun texte du site) ; les membres sans détourage fiable reviennent au
  portrait entier.

## Recommandation
Une direction principale, pas un mélange tiède : **B comme ossature** (navigation, sélection,
profils, pouvoirs : c'est la plus vivante et la plus « jeu japonais »), **réécrite avec le
langage graphique de A** (encre, trames, cases, onomatopées, papier) pour qu'elle appartienne
à la Guilde et à aucun jeu existant, et **le moteur de C réservé aux moments signature**
(fondu à l'encre anime → réel, territoire, transitions entre membres).
