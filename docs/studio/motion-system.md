# Système de mouvement de la Guilde (base de la Phase 2)

Source unique : `lib/motion.ts` (Framer Motion) et `app/studio/motion.css` (variables `--m-*`).
Les valeurs ci-dessous sont celles déjà utilisées par les trois prototypes.

## 1. Trois familles, une par registre

| Registre | Sensation | Courbe | Rebond | Exemples |
|---|---|---|---|---|
| Hebdo (magazine) | la page qu'on tourne | `out` (0.22, 1, 0.36, 1) | jamais | entrée de la une, volets de portrait, cartes |
| Kirikomi (compétition) | l'impact | `strike` (0.7, 0, 0.2, 1) | court, réservé au choc | révélation du bankai, onomatopées |
| Densetsu (prestige) | la cérémonie | `rite` (0.16, 1, 0.3, 1) | jamais | extension du territoire, dorure, plaques |

## 2. Jetons

| Jeton | Valeur | Usage |
|---|---|---|
| `DUR.tap` / `--m-tap` | 120 ms | appui (le bouton s'enfonce comme un tampon, classe `m-press`) |
| `DUR.swap` / `--m-swap` | 220 ms | changement d'état dans un composant (onglet, survol) |
| `DUR.enter` / `--m-enter` | 420 ms | entrée d'un élément, ouverture du sommaire |
| `DUR.page` / `--m-page` | 620 ms | couverture, passage carte vers tome |
| `DUR.reveal` / `--m-reveal` | 900 ms | révélations, toujours rejouables, jamais bloquantes |
| `SPRING.cursor` | 520 / 38 | curseur P1, encre des onglets de mode |
| `SPRING.sheet` | 380 / 36 | feuilles et cartes tirées au doigt |
| `SPRING.punch` | 700 / 22 | réservé au registre Kirikomi |
| `stagger(i)` | 40 ms, plafonné à 8 | listes ; au-delà, tout arrive ensemble |

## 3. Chorégraphies en place

| Moment | Comment | Durée |
|---|---|---|
| Une de l'hebdo | titre lettre par lettre, vedette qui se lève, accroches tamponnées | 0 à 0,9 s |
| Volet de portrait | découpe `clip-path` (WIPE), dans le sens de lecture de la couverture | 0,62 s |
| Curseur P1 | `layoutId` partagé entre les cartes | ressort `cursor` |
| Carte vers couverture | View Transitions : l'image touchée devient la couverture du tome | 0,62 s, `inOut` |
| Tome à tome | View Transitions : la page glisse dans le sens choisi | 0,2 à 0,26 s |
| Bankai | bandes noires, éclair, « Ban… kai ! », nom lettre par lettre | 1,3 s, bouton « Revoir » |
| Extension du territoire | le domaine s'ouvre depuis le sol (cercle) puis le texte | 1,1 s, bouton « Rouvrir » |
| Distinctions | éclat doré au survol, entrée au défilement | 0,9 s |
| Générique | le vinyle ne tourne que pendant l'écoute | 3,6 s par tour |
| Découverte | le compteur « découverts » fait un saut à chaque nouveau membre | 0,42 s |
| Défilement | révélations liées au défilement (`animation-timeline: view()`) | selon le défilement |

## 4. Règles

1. **Mouvement réduit** : chaque animation a son état final sans mouvement (vérifié : aucune
   animation active sur les trois pages, hors barre de lecture qui suit le défilement).
2. **Jamais imposé** : rien ne bloque la lecture ; les révélations se rejouent par un bouton ;
   aucune musique ni vidéo ne démarre seule.
3. **Chaque geste a son bouton** : balayer la couverture = boutons ‹ › et flèches du clavier ;
   tirer la feuille = bouton Fermer et retour du téléphone ; balayer la feuille = boutons ‹ ›.
4. **Interruptible** : une nouvelle action coupe la transition en cours (`lib/view-transition.ts`).
5. **Propriétés composées seulement** : `transform`, `opacity`, `clip-path` ; pas de flou animé.
6. **Hors écran** : chapitres en `content-visibility: auto`, animations infinies en pause
   (`OffscreenPause`, vinyle en pause hors écoute).

## 5. Phase 2 : où l'étendre

- **Fighters et Teams (Kirikomi)** : écrans VS et compositions d'équipe avec `strike` et `punch`,
  arrêt sur image (hit-stop) de 60 à 90 ms, tremblement limité à l'élément touché.
- **Cérémonies, musée, palmarès (Densetsu)** : révélations lentes en `rite`, une seule à la fois.
- **Navigation** : étendre la transition carte vers couverture aux pages Fighters, Bibliothèque et
  Anniversaires (même nom de transition, même durée).
- **Outils** : Framer Motion et CSS suffisent pour tout ce qui précède. GSAP ne serait justifié que
  pour une scène longue et synchronisée (cérémonie avec musique) ; à proposer avec mesure à l'appui.
