# Phase 5 : un univers communautaire connecté

Principe : pas de pages isolées. Chaque expérience **réutilise les données réelles**
(membres, grades, palmarès, chroniques, films, équipes, jeux) et **renvoie vers les
rubriques** existantes. Aucune donnée n'est inventée : là où une information manque
(date d'arrivée d'un membre, événements passés), l'expérience propose de la saisir dans
l'administration au lieu de la fabriquer.

## Le fil rouge : le Quartier général (QG)

Une page `/qg`, carte illustrée du repaire de la Guilde (SVG original, vue de biais
façon menu de Persona 3 Reload, salles éclairées au survol). Chaque salle ouvre une
expérience et cite les rubriques liées :

| Salle | Expérience | Données réelles utilisées | Renvoie vers |
|---|---|---|---|
| Le Hall des grades | **Chronologie des générations** : les grades comme des ères, du Fondateur aux Revenants | grades, ordre des membres, palmarès | Annuaire, fiches |
| Le Musée | **Musée de la Guilde** : vitrines (affiches Wanted record, chroniques marquantes, films élus, meilleurs scores) | primes, chroniques, films de la semaine, classements des jeux | Wanted, Bibliothèque, Film, Jeux |
| La Salle des cérémonies | **Cérémonies de promotion** : quand un membre change de grade, une scène de sacre (sceau qui tombe, nom gravé) | historique de grade (à enregistrer à partir de maintenant, sans rétroactif inventé) | Fiche du membre |
| Le Comptoir des cartes | **Cartes à collectionner** : chaque membre = une carte (rareté selon le grade, statistiques réelles) ; tu « obtiens » une carte en visitant une fiche, en jouant, en votant | cartes déjà générées (PNG), statistiques, actions de l'appareil | Fiches, Jeux, Votes |
| Les Archives | **Archives des événements** : soirées ciné, tournois, anniversaires passés | films élus et vus, vidéos Drive, anniversaires | Cinéma, Film, Anniversaires |
| L'Imprimerie | **Éditions collector** : un numéro spécial de la Chronique (couverture de saison, sommaire, verdicts) téléchargeable | chroniques d'une saison | Bibliothèque |

## Liens narratifs entre membres et rubriques

- Sur chaque fiche : « Vu dans… » (sa prime au classement Wanted, son équipe et son
  poste dans Teams, ses chroniques favorites, ses meilleurs scores).
- Sur chaque rubrique : « Les membres de cette page » (qui suit cet anime au Calendrier,
  qui a voté pour ce film, qui est capitaine).

## Easter eggs (discrets, jamais bloquants)

- Taper « Tsuzuku » dans la recherche : rejoue l'intro.
- Code Konami sur le QG : les salles passent en « nuit de l'Heure sombre » (palette P3R).
- Toucher 7 fois le sceau d'un grade : son rōmaji se traduit en clair.

## Mes propositions supplémentaires

1. **Le Journal de la Guilde** : une page « cette semaine dans la Guilde » générée
   automatiquement (anniversaires, film élu, nouvelles chroniques, nouveaux membres).
2. **Rivalités** : à partir des duels de goûts et des primes, une page de « rivaux
   désignés » (deux membres aux goûts opposés), avec affiche VS réutilisant celle de Teams.
3. **Passeport du membre** : tampons gagnés en visitant chaque rubrique (stocké sur
   l'appareil), qui débloquent des fonds de carte.

## Réalisé

- **Quartier général** (`/qg`) : tour en coupe de neuf étages dessinés en SVG (toit, trône,
  musée, projection, bibliothèque, arcade, fêtes, vestiaire, atelier), occupants et images
  réels, salles qui s'allument au passage, ascenseur qui suit le défilement, heure sombre
  (code Konami ou sept touches sur l'enseigne). Accès : en-tête (La Guilde), sommaire,
  menu de l'accueil.

## Ordre proposé

1. QG (la carte, sans contenu nouveau : chaque salle renvoie aux rubriques existantes).
2. Musée et Archives (uniquement des données déjà présentes).
3. Cartes à collectionner (réutilise les cartes PNG existantes).
4. Cérémonies (demande d'enregistrer l'historique des grades : petite évolution de
   l'administration, sans migration sensible, via `extras`).
5. Chronologie, éditions collector, easter eggs.

## Phase 6 (optimisation) prévue ensuite

Poids des pages (images au format servi, polices), mesures sur téléphone moyen,
accessibilité (contrastes des deux thèmes, focus, lecteurs d'écran), Safari réel.
