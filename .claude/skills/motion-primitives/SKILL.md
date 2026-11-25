---
name: motion-primitives
description: Composants d'interface animés Motion Primitives (ibelick, MIT), sources dans components/ - texte qui se révèle, se transforme, défile ou se brouille (text-effect, text-morph, text-roll, text-scramble, text-loop, text-shimmer), chiffres animés (animated-number, sliding-number), dialogue et popover qui se déforment depuis leur déclencheur (morphing-dialog, morphing-popover), fond qui suit la sélection (animated-background), dock, aimant, spotlight, bordure qui court, flou progressif, comparaison d'images, curseur, carrousel, défilement infini, barre de progression. À utiliser pour une micro-interaction ou un composant animé en React, avant d'en écrire un.
---

# Motion Primitives pour Guilde Otaku

34 composants React de référence dans `components/` (copie intégrale, MIT).
Ils servent de **modèles à adapter**, pas à coller tels quels :

1. **Moteur** : ils importent `motion/react`. Le site utilise `framer-motion` (même
   moteur, mêmes API) : remplacer l'import.
2. **Styles** : ils sont écrits en classes Tailwind et `cn()` (`@/lib/utils`). Le site
   n'utilise pas Tailwind : traduire en CSS du site (tokens `--gk-*`, skill
   `guilde-design`), dans un fichier `.css` à côté du composant.
3. **Dépendances** : `react-use-measure` (dialog, toolbar, transition-panel) ; sinon
   `ResizeObserver` direct. `useClickOutside`, `usePreventScroll` : à réécrire (quelques
   lignes) ou utiliser les hooks existants du site (`useBackClose`).
4. **Ranger** dans `app/components/motion/<Nom>.tsx`, en-tête :
   `// D'après Motion Primitives (<nom>), ibelick/motion-primitives, MIT.`
5. **Mouvement réduit** : `useReducedMotion()` de framer-motion et le réglage du site
   (`MotionSettings`) ; état final visible sans animation.
6. **Ressorts** plutôt que durées fixes pour ce qui suit un geste (skill `apple-design`).

Choisir entre ce skill et `react-bits` : Motion Primitives pour l'interface (dialogues,
chiffres, textes d'UI, navigation), React Bits pour les effets spectaculaires (fonds,
titres, curseurs). Le routeur `guilde-studio` tranche en cas de doute.
