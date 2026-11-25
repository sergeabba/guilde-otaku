# Phase 0 : intégration des skills et audit

Branche : `claude/guilde-niveau-superieur` (rien fusionné dans `main`).
Date : 25 novembre 2026. Captures « avant » : site en ligne, ordinateur 1440 px et iPhone 13.

## 1. Skills intégrés

Organisation :
- `.claude/skills/` : les skills **actifs**, chargés automatiquement (76 au total, dont 47 nouveaux) ;
- `.claude/skill-library/` : la **bibliothèque à la demande** (287 skills), lue au besoin via
  `INDEX.md`, sans alourdir chaque session ;
- `guilde-studio` : le **routeur**, qui dit quel skill utiliser, les priorités, la politique
  technique et les références artistiques.

| Source | Licence | Actifs | Bibliothèque | Retiré, et pourquoi |
|---|---|---|---|---|
| impeccable (pbakaus) | Apache 2.0 | `impeccable` (toutes ses références : critique, audit, polish, animate, bolder, delight, overdrive, layout, typeset, colorize…) | | le lanceur qui télécharge un moteur binaire (sécurité) ; les guides restent complets |
| Emil Kowalski | MIT | 16 : `emil-design-eng`, `animate`, `choreograph`, `apple-design`, `gestures`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `remove-animations`, `animation-performance`, `animation-vocabulary`, `break-ui`, `mobile-native`, `learn-taste`, `pick-ui-library`, `prototype` | Swift, Expo, Sonner, `ask-emil`, aide-mémoires | rien |
| MengTo/Skills | MIT | 12 : `build-awwwards-quality-sites`, `cinematic-gsap-lenis-motion-system`, `no-ai-design-slop`, `audit-ai-design-slop`, `optimize-web-animations`, `game-dev-combat-animation`, `game-dev-combat-skill-polish`, `design-action-combat`, `create-game-vfx`, `tune-enemy-ai`, `build-game-audio-feedback`, `test-playable-web-games` | les 211 autres (web-design 104, 3d 33, game-development 26, illustration 16, codex 20, media, ui, video, workflow) | pages de démonstration et médias (290 Mo) ; scripts et références conservés |
| codixel | MIT | `codixel` + `core/pixel.js` (aucune dépendance) | | images d'exemple |
| PixelFx | MIT + avis tiers | `pixelfx` + bibliothèque complète (244 effets, outils de rendu) | | galerie et sa police (non couverte par MIT) |
| Motion Primitives (ibelick) | MIT | `motion-primitives` (34 composants sources + guide d'adaptation) | | rien |
| UI UX Pro Max | MIT | `ui-ux-pro-max` (mis à jour : 80 styles, 194 palettes, 74 couples de polices, préréglages GSAP), `design-system`, `ui-styling` | `brand`, `design`, `banner-design`, `slides` | rien |
| awesome-gamedev-agent-skills | Apache 2.0 | 11 : `game-feel`, `game-ui-ux`, `input-systems`, `audio-design`, `game-ai`, `camera-systems`, `create-game-assets`, `performance-optimization`, `shader-programming`, `phaser-core`, `pixijs-rendering` | les 69 autres (genres, workflows, Three.js, Unity, Godot, Unreal, Roblox…) | rien |
| Déjà présents | | `design-taste-frontend` (taste-skill), `react-bits`, `fighters-studio` (Game Studios), `guilde-design`, `guilde-qa`, `frontend-design`, `web-design-guidelines` | | |
| playwright-mcp | Apache 2.0 | | | non installé : `guilde-qa` pilote déjà Playwright directement |

**Contrôles réalisés** :
- licences copiées dans chaque dossier, avec un `SOURCE.md` (origine, commit, ce qui a été retiré) ;
- aucun hook automatique dans les skills retenus ;
- recherche de téléchargements, d'`eval`, d'accès aux secrets et d'exécutables : seulement des faux positifs (le mot « curl » dans des shaders), plus le lanceur d'impeccable, retiré ;
- dépendances : codixel et PixelFx n'ont que Node ; Motion Primitives a besoin de `motion/react` (on a `framer-motion`) et de Tailwind (on n'en a pas : composants à traduire en CSS) ;
- outils testés ici : rendu PixelFx, codixel, recherche UI UX Pro Max ;
- `.vercelignore` exclut `.claude/` des envois Vercel (aucun poids ajouté au site).

## 2. Mesures avant (site en ligne)

| Page | Chargement | Images | Défilement |
|---|---|---|---|
| Accueil, téléphone | 2,4 s | **7 Mo** (une image de 6 Mo) | 60 im/s |
| Accueil, ordinateur | **5,2 s** | 0,4 Mo | 51 im/s |
| Fiche membre, ordinateur | 1,0 s | faible | **25 im/s** |
| Planche, ordinateur | 0,8 s | faible | **21 im/s** |
| Fighters, ordinateur | 1,0 s | 1,1 Mo | 58 im/s |
| Autres pages | 0,5 à 1,7 s | faible | 59 à 61 im/s |

Aucune erreur JavaScript, aucun débordement horizontal, sur les 28 combinaisons page × appareil.
(Mesures prises sans accélération graphique : les im/s sont pessimistes, mais les écarts
entre pages sont significatifs.)

## 3. Constats de l'audit

### Direction artistique (impeccable, `no-ai-design-slop`, `design-taste-frontend`)
1. **Toutes les rubriques ont le même en-tête** : pastille « chapitre », grand titre Dela Gothic,
   trait de pinceau sous le titre, texte à gauche. Cohérent, mais la Bibliothèque, les Bons
   plans, les Anniversaires, les Jeux et les Futilités se ressemblent trop. Il manque une
   personnalité par rubrique.
2. **Typographie** : une seule voix forte (Dela Gothic + Barlow Condensed) partout. Il manque
   une deuxième voix expressive pour les moments de mise en scène (titres découpés à la
   Persona, chiffres de match, cartes RPG).
3. **Accueil** : le registre des membres est solide, mais le premier écran n'a pas de
   « moment » : pas d'entrée mémorable, pas de chiffre qui vit, pas d'appel au jeu.
4. **Écrans vides pendant le chargement** (accueil, Futilités, Bibliothèque) : de grands cadres
   sombres vides avant l'arrivée des images. Il faudrait une trame ou un portrait flouté
   comme attente.
5. **Points forts à garder** : planche manga, Teams en grande coupe, Wanted, Cinéma, Fighters
   (titre fort, fond en mosaïque), thème clair papier.

### Mouvement (Emil : `improve-animations`, `animation-performance`, `find-animation-opportunities`)
1. **135 animations CSS, 48 en boucle infinie**. Beaucoup tournent en permanence, même hors
   écran. Coût batterie, et le mouvement perd sa valeur de signal.
2. **63 animations touchent des propriétés de mise en page** (largeur, hauteur, top, left)
   au lieu de `transform` : risque de saccades.
3. **35 flous en filtre**, dont le fond flouté de la fiche membre (une couche de 980 px floutée
   à 14 px sous le texte) : principale cause des **21-25 im/s** au défilement sur grand écran.
4. **8 courbes `ease-in` seules** sur des entrées (ça démarre lentement : impression de lenteur).
5. **Peu de ressorts** (5 usages) : les gestes et changements d'état gagneraient à suivre la
   physique (`apple-design`).
6. **Bien fait** : mouvement réduit respecté (79 règles), View Transitions déjà utilisées
   (61), aucune transition `all`.
7. **Occasions manquées** : chiffres qui roulent (stats, primes, puissance), passage d'une
   fiche à l'autre au geste, sélection de membre façon écran de sélection, transitions entre
   rubriques propres à chacune.

### Performance et poids (`optimize-web-animations`, `performance-optimization`)
1. **`public/` pèse 134 Mo** : 14 images de 4,5 à 8 Mo (Futilités, histoire de l'accueil),
   un `fighter.mp3` de 21 Mo. Le quota d'optimisation Vercel étant épuisé, ces images
   partent en taille d'origine (6 Mo sur l'accueil mobile).
   **Correctif proposé** : générer à la compilation des versions WebP/AVIF aux bonnes
   largeurs avec `sharp` (déjà installé), sans dépendre de l'optimiseur Vercel ; compresser
   la musique.
2. Les pages qui chargent les membres dans le navigateur (Anniversaires, Wanted…)
   gagneraient à les recevoir du serveur, comme l'accueil : affichage immédiat et pas de
   page vide si la base répond lentement.

### Fighters (`fighters-studio`, `game-feel`, `design-action-combat`, `game-dev-combat-skill-polish`)
1. **55 planches de sprites** existent, mais **tous les membres partagent les mêmes coups**
   (seuls Craig et Melrick ont une particularité). Les styles de combat ne sont pas distincts.
2. **Effets d'impact** : étincelles simples. PixelFx apporte 244 effets acteurs (élan, gel,
   retour) prêts à adapter, avec un élément par membre.
3. **Super attaques** : pas de mise en scène (gros plan, coupure d'écran, arrêt sur image).
4. **5 arènes**, toutes en canvas peint : bonne base, peu d'animation de foule ou de premier plan.
5. **Déjà bien** : moteur déterministe (rejouable), IA à 3 niveaux, tampon de commandes,
   garde, projections, manette, tactile, entraînement, équilibrage testé.
6. **Moteur** : aucune raison de migrer. Il est propre et testé. Seul le rendu pourrait
   passer en PixiJS si les effets saturent le canvas 2D (à mesurer en Phase 4).

## 4. Points de vigilance
- La police de la galerie PixelFx n'est pas sous MIT : ne jamais la copier.
- Les skills MengTo de VFX visent Three.js : pour Fighters (pixel art), PixelFx d'abord.
- Les composants Motion Primitives et React Bits sont des modèles : on les traduit en
  CSS du site, sans ajouter Tailwind.
- Mes captures sont prises depuis un bac à sable qui ne joint pas Supabase : les pages qui
  chargent les membres dans le navigateur y apparaissent vides, ce n'est pas le cas chez
  les visiteurs.
