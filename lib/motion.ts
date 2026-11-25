// Système de mouvement de la Guilde (Phase 1, base de la Phase 2). Une seule source
// pour les durées, courbes et ressorts, côté Framer Motion ; les mêmes valeurs existent
// en CSS (app/studio/motion.css, variables --m-*). Voir docs/studio/motion-system.md.
//
// Trois familles, une par registre :
// - Hebdo (magazine) : « la page qu'on tourne », glissements doux, aucun rebond.
// - Kirikomi (compétition) : « l'impact », entrées sèches, petit dépassement, flash.
// - Densetsu (prestige) : « la cérémonie », lent, lumineux, jamais de rebond.

export const DUR = {
  /** Retour d'appui (bouton, carte). */
  tap: 0.12,
  /** Changement d'état dans un même composant. */
  swap: 0.22,
  /** Entrée d'un élément, d'une feuille. */
  enter: 0.42,
  /** Transition de page ou de couverture. */
  page: 0.62,
  /** Révélation (bankai, distinction). Jamais imposée : toujours passable. */
  reveal: 0.9,
} as const;

export const EASE = {
  /** Sortie douce : tout ce qui arrive. */
  out: [0.22, 1, 0.36, 1] as const,
  /** Entrée-sortie : ce qui se déplace d'un point à un autre. */
  inOut: [0.65, 0, 0.35, 1] as const,
  /** Impact : départ franc, arrêt net (Kirikomi). */
  strike: [0.7, 0, 0.2, 1] as const,
  /** Cérémonie : lent au départ, pose finale longue (Densetsu). */
  rite: [0.16, 1, 0.3, 1] as const,
};

export const SPRING = {
  /** Curseur, sélection : suit sans traîner. */
  cursor: { type: "spring", stiffness: 520, damping: 38, mass: 0.7 },
  /** Feuilles et cartes qu'on tire au doigt. */
  sheet: { type: "spring", stiffness: 380, damping: 36 },
  /** Petit dépassement d'impact (Kirikomi uniquement). */
  punch: { type: "spring", stiffness: 700, damping: 22 },
} as const;

/** Volets de révélation par découpe (clip-path) : l'image se dévoile comme une case de manga. */
export const WIPE = {
  fromRight: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
  fromLeft: "polygon(0 0, 0 0, 0 100%, 0 100%)",
  fromBottom: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
  full: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
} as const;

/** Décalage d'une liste : court, plafonné (au-delà de 8 éléments tout arrive ensemble). */
export function stagger(i: number, step = 0.04, cap = 8): number {
  return Math.min(i, cap) * step;
}
