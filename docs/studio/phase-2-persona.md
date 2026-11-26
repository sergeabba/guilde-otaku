# Phase 2 : voix « grand menu » et planches sur tout le site

Direction retenue après l'exploration (voir `exploration-3-directions.md`) : l'énergie du grand
menu (direction B) pour l'accueil, Fighters et la typographie ; la planche manga (direction A)
pour les pages internes ; le moteur cinéma (C) réservé aux moments signature.

## Typographie commune (`app/styles/persona-type.css`)

| Rôle | Police | Où |
| --- | --- | --- |
| Titres de page et de section | Barlow Condensed 900 italique, capitales, serrées | `.gk-display`, `.gk-title` (toutes les pages) |
| Impact : chiffres, tampons, onomatopées, logo | Anton | `--gk-font-display`, `--gk-font-impact`, `.gk-num` |
| Petits titres, onglets, boutons | Barlow Condensed 800-900 | `--gk-font-ui`, `.gk-kicker`, `.gk-btn` |
| Lecture, formulaires | Barlow | `--gk-font-body` |
| Lettrage découpé | composant `Ransom` | titre d'accueil, entrée choisie d'un menu |

Polices auto-hébergées sous licence OFL. Barlow Condensed 900 italique et Anton sont
préchargées. Le mot encré d'un titre devient un aplat incliné à la couleur du rang.
Les directions de test `data-typo` gardent leurs polices.

## Préférence Anime / Réel

Une seule préférence (`lib/face.ts`, `html[data-face]` posé avant l'affichage). Elle
s'applique à l'accueil (couverture, annuaire, aperçu rapide), aux fiches en planche,
à Fighters (titre, sélection), à Teams, à la collection, aux tomes et aux prototypes.
« Les deux » reste une option locale de la fiche classique.

## Routes

| Route | Traitement |
| --- | --- |
| `/` | Couverture « grand menu » (titre découpé, membre détouré, entrées en escalier) ; défilement vertical simple sur téléphone ; sections et annuaire existants conservés |
| `/fighters` | Écran titre grand menu ; sélection arcade : roster en haut, deux combattants en grand, VS ; toucher en deux temps (viser, confirmer) ; Retour au pouce |
| `/membres/[id]` | Planche de manga par défaut (`?vue=fiche` pour la fiche classique), portrait selon la préférence, playlist en case pleine largeur |
| `/explo/a/annuaire` | Annuaire en planches : chapitres par grade, mode liste, recherche, filtres, fond d'attente |
| `/birthdays`, `/teams`, `/wanted`, `/film-semaine`, `/bibliotheque`, `/bons-plans`, `/atelier`, `/calendrier`, `/jeux`, `/cinema` | Typographie commune (titres, repères de chapitre, boutons). Wanted garde son affiche |
| `/studio/*`, `/explo/*` | Voix d'impact Anton à la place de Dela Gothic |
| `/admin*` | Déjà en Barlow Condensed italique (interface d'administration sobre) |
| `/vote/[slug]`, `/f/[slug]`, 404 | Typographie commune ; `/f` redirige vers l'atelier |

## Reste à faire

- Teams : les équipes ne s'affichent pas faute de données publiées (« Les équipes arrivent bientôt »).
- Cinéma : le catalogue TMDB demande la clé `TMDB_API_KEY` dans les variables Vercel.
- Mouvement (plan de `motion-system.md`) : hit-stop des écrans VS et cérémonies du palmarès.
