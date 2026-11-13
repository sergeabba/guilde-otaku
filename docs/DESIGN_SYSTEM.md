# Guilde Otaku : système "Shōnen Editorial"

Référence du système graphique partagé par les huit rubriques.
Source des tokens et composants : `app/styles/shonen.css` (préfixe `gk-`).
Couche d'animation au défilement : `app/styles/motion.css` (voir `MOTION_V3.md`).

## Parti pris

Le site est traité comme un magazine shōnen : des cases à bordure franche et
ombre dure, des trames, des titres de couverture massifs, un sommaire numéroté.
Les huit rubriques sont les huit chapitres du numéro, d'où la numérotation
01 à 08 dans la navigation, le menu mobile, le pied de page et les en-têtes.

Chaque rubrique garde son ambiance propre (avis de recherche pour Wanted,
borne d'arcade pour Fighters, programme de festival pour le Film de la semaine,
artbook pour l'Atelier) mais partage la coque, les tokens et les composants.

À éviter : halos lumineux, glassmorphism, coins arrondis génériques, dégradés
violets, animations permanentes.

## Tokens

| Rôle | Variable | Valeur |
| --- | --- | --- |
| Encre | `--gk-ink` | `#0d0c10` |
| Papier | `--gk-paper` | `#f4efe4` |
| Or de la Guilde | `--gk-gold` | `#c9a84c` |
| Rouge tampon | `--gk-hanko` | `#d7332b` |
| Accent de page | `--gk-accent` | défini par chaque page |

Tons sémantiques (`--gk-bg`, `--gk-surface`, `--gk-text`, `--gk-dim`,
`--gk-rule`, `--gk-border`) : sombres par défaut, clairs avec
`html[data-theme="light"]`. Une page à ambiance fixe force son ton avec la
classe `tone-dark` ou `tone-light` sur son conteneur, et passe la même valeur
à `<GuildeHeader tone="...">`.

Typographie :

- `--gk-font-display` : Dela Gothic One, titres de couverture uniquement.
- `--gk-font-ui` : Barlow Condensed, navigation, boutons, intertitres.
- `--gk-font-body` : Barlow, texte courant.
- `--gk-font-hand` : Caveat, annotations manuscrites ponctuelles.
- `--gk-font-jp` : gothique système pour les petits corps japonais (la police
  de couverture s'empâte sous 20 px).

Échelle fluide `--gk-step--1` à `--gk-step-5`, espacements `--gk-s1` à
`--gk-s9`, gouttière `--gk-gutter`, largeur maximale `--gk-max`.

Relief : `--gk-stroke` (2,5 px) et ombre dure décalée `--gk-lift`. Jamais de flou.

## Composants

| Classe | Usage |
| --- | --- |
| `gk-page`, `gk-wrap` | Conteneur de page et colonne centrée |
| `gk-display` + `gk-h1`..`gk-h4` | Titres de couverture |
| `gk-ui-title` | Intertitre condensé italique |
| `gk-inked` | Titre doublé d'un aplat décalé (effet d'encrage) |
| `gk-chapter` | Repère de chapitre : numéro + intitulé |
| `gk-panel` (+ `gk-press`) | Case manga, version cliquable avec relief |
| `gk-btn` (`--ghost`, `--ink`, `--red`, `--sm`) | Boutons |
| `gk-icon-btn` | Bouton icône 44 px |
| `gk-chips` + `gk-chip` | Filtres, état actif via `aria-pressed` |
| `gk-switch` | Bascule à deux positions (Réel / Anime, Liste / Calendrier) |
| `gk-field` + `gk-input` | Champ de recherche |
| `gk-tag`, `gk-stamp` | Étiquette, tampon rouge |
| `gk-empty` | État vide : glyphe, titre, explication, action |
| `gk-skel` | Squelette de chargement |
| `gk-toast` | Confirmation courte (via `useShare`) |
| `gk-tone`, `gk-speed`, `gk-hatch` | Trame, lignes de vitesse, hachures |

Coque partagée : `GuildeHeader` (en-tête, sommaire mobile, dock),
`CommandPalette` (recherche globale, Ctrl+K), `Footer`, `BackToTop`,
`not-found.tsx`, `error.tsx`, `loading.tsx`.

## Mouvement

- Durées : `--gk-fast` 140 ms, `--gk-med` 260 ms, `--gk-slow` 520 ms.
- Un seul moment orchestré par page : `gk-reveal` sur l'en-tête de rubrique.
- Les grilles apparaissent en séquence avec `gk-stagger` et `--i`.
- Transition de page : `gk-page-enter`, sans transform ni filter résiduel
  (ils piégeraient les éléments `position: fixed`).
- Tout est neutralisé sous `prefers-reduced-motion: reduce`.
- Seuls `transform`, `opacity` et `clip-path` sont animés.

## Règles d'accessibilité

- Cibles tactiles de 44 px, focus visible, lien "Aller au contenu".
- Les filtres exposent leur état avec `aria-pressed`, les compteurs de
  résultats sont annoncés (`role="status"`).
- Les calques (lecteur, visionneuse, lightbox, sommaire) sont des dialogues
  modaux : Échap pour fermer, focus rendu à l'élément d'origine.
- Les images décoratives ont un `alt` vide, les portraits porteurs de sens
  sont décrits par le libellé du bouton qui les contient.

## Règles de contenu

- Aucun chiffre inventé : tous les compteurs sont calculés depuis les données.
- Une fonction qui demande un backend absent n'est pas simulée.
- Favoris et préférences sont locaux (`localStorage`), et c'est écrit à l'écran.
- Les mentions japonaises sont décoratives, courtes et masquées aux lecteurs
  d'écran (`aria-hidden`).

## Ajouter une rubrique

1. Déclarer l'entrée dans `app/config/nav.ts` (source unique de la navigation).
2. Envelopper la page dans `<div className="gk-page tone-dark|tone-light">`
   et définir `--gk-accent`.
3. Poser `<GuildeHeader activePage="..." tone="..." accentColor="..." />`.
4. Ouvrir par `gk-hero` + `gk-chapter` + un titre `gk-display`.
5. Prévoir les trois états : chargement (`gk-skel`), vide (`gk-empty`), erreur.
