# Inventaire avant migration (Phase 1, fin)

Toutes les fonctions des trois pages actuelles, et où elles vivent dans les prototypes.
Règle : aucune page n'est remplacée tant qu'une ligne reste « à faire ».

Légende : **ok** présent dans le prototype · **à faire** prévu avant la migration · **choix** décision à valider.

## Accueil actuel (`/`, `HomePageClient`)

| Fonction actuelle | Prototype `/studio/accueil` |
|---|---|
| En-tête commun : logo, recherche (Ctrl K), thème clair/sombre, sommaire, navigation groupée ordinateur | ok (StudioNav reprend recherche, thème, sommaire plein écran) |
| Barre d'onglets mobile (La Guilde, Teams, Fighters, Biblio, Sommaire) | ok (même barre, mêmes liens) |
| Couverture : titre, texte d'accueil, chiffres (membres, grades, pays), boutons annuaire et Chronique | ok (couverture hebdo, chiffres dans les accroches, liens) |
| Cases de portraits qui alternent anime/réel (`CoverFx`) | ok (membre en couverture + polaroïd réel, cases du chapitre « Visages ») |
| Générique du jour (`SongOfTheDay`, `?generique=N` depuis la recherche) | ok (chapitre « Générique du jour », même composant, même paramètre) |
| Histoire de la Guilde (`ChapterStory`) | ok (lien dans « Au sommaire » ; à faire : chapitre dédié si gardé à l'accueil) |
| Mur de l'atelier (`AtelierWall`) | ok (rubrique « À la une ») |
| Vote du film (`FilmPoll compact`) | ok (rubrique « À la une », même composant) |
| Sommaire des rubriques (`NAV`) | ok (sommaire plein écran + chapitre final) |
| À la une : film de la semaine, prochain anniversaire, bibliothèque, futilités | ok (mises en avant d'événements, éditions spéciales) |
| Annuaire intégré `#annuaire` (filtres, recherche, pays, anime/réel, fiche rapide) | déplacé vers `/studio/annuaire` ; à faire : redirection de `/#annuaire` |
| Fiche rapide `MemberQuickView` (partage, palmarès, favoris, musique) | remplacée par la scène / feuille de la collection ; partage : ok via le tome |
| Bouton flottant anime/réel (`hm-float`) | ok (bascule dans la collection) |
| Transitions de vue carte vers fiche (`viewTransition`) | ok (carte qui devient la couverture du tome) |
| Intro Fairy Tail (`SplashWrapper`, rejouable) | inchangé (niveau application) |

## Annuaire actuel (section de l'accueil)

| Fonction actuelle | Prototype `/studio/annuaire` |
|---|---|
| Filtre par grade avec compteurs | ok (intercalaires) |
| Recherche par nom (sans accents) | ok (+ alias, raccourci « / ») |
| Filtre par pays (drapeaux, compteurs) | ok |
| Portrait anime ou réel | ok |
| Fiche rapide au clic, clavier Entrée/Espace | ok (scène, feuille mobile, flèches) |
| Lien vers la fiche complète | ok (« Ouvrir son tome ») |
| Compteur de membres affichés | ok (+ « découverts ») |
| Groupes par grade avec logo de série | ok (vue par générations, vue classique) |

## Fiche membre actuelle (`/membres/[id]`)

| Fonction actuelle | Prototype `/studio/membre/[id]` |
|---|---|
| Métadonnées, aperçu de lien (OG), 404 pour un membre masqué | ok (mêmes règles ; à faire : reprendre les métadonnées OG à la migration) |
| Deux styles : fiche et planche (`?vue=planche`) | ok (le tome ; planche gardée en carte partageable) |
| Portraits : les deux, réel, anime ; portraits animés (vidéo) | ok (bascule anime/réel, vidéo si elle existe) |
| Logo de la série du portrait | ok (couverture) |
| Alias en rōmaji | ok |
| Pays, anniversaire et compte à rebours | ok |
| Bio | ok |
| Télécharger la carte / la planche (image) | ok (bouton de partage du tome) |
| Partager (`ShareSheet` : lien, WhatsApp…) | ok (même feuille) |
| Badges des jeux (`MemberBadges`) | ok (chapitre Palmarès) |
| Palmarès (`MemberAwards`) | ok (vitrine) |
| Fiche de combat (statistiques, attaque spéciale) | ok |
| Bankai et extension du territoire (`POUVOIRS`) | ok (révélation) |
| Favoris anime et manga, mini-fiche d'œuvre, lien Chronique | ok (étagère ; mini-fiche : même composant `WorkSheet`) |
| Bandes-annonces des favoris (`TrailerReel`) | ok (dans la mini-fiche, sans lecture automatique) |
| Playlist et lecteur flottant (`MemberMusic`, `MusicDock`) | ok (« Générique du tome », mêmes règles de lecture) |
| Activité : records, votes (`MemberActivity`) | ok (chapitre dédié, chargé à l'approche) |
| Membres précédent / suivant, préchargés | ok (boutons, flèches clavier, balayage) |
| Retour à l'annuaire | ok |

## Données : ce qui n'existe pas

- **Date d'arrivée dans la Guilde** : absente. La « vue par générations » regroupe donc les grades
  existants et le dit. Pour une vraie chronologie, ajouter une année d'arrivée dans l'admin.
- **Liens entre membres** : seulement ce que les données prouvent (favoris en commun, même pays,
  même grade, membre cité dans une distinction, même équipe publiée).
