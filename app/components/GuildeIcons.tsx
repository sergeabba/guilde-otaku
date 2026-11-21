// Icônes dessinées pour la Guilde (barre de navigation mobile) : trait épais à bouts
// ronds, façon coup de pinceau, avec une touche pleine en couleur d'accent.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const Base = ({ children, ...p }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{children}</svg>
);

/** La Guilde : blason et étoile à quatre branches. */
export const IconGuilde = (p: P) => (
  <Base {...p}>
    <path d="M12 2.5 19.5 5.2v6.1c0 4.6-3.2 8.1-7.5 10.2-4.3-2.1-7.5-5.6-7.5-10.2V5.2Z" />
    <path className="gi-fill" d="M12 7.2c.5 2.2 1.2 2.9 3.4 3.4-2.2.5-2.9 1.2-3.4 3.4-.5-2.2-1.2-2.9-3.4-3.4 2.2-.5 2.9-1.2 3.4-3.4Z" fill="currentColor" stroke="none" />
  </Base>
);
/** Wanted : avis de recherche déchiré, portrait au centre. */
export const IconWanted = (p: P) => (
  <Base {...p}>
    <path d="M4.5 3h15v16.6l-2.5-1.4-2.5 1.4-2.5-1.4-2.5 1.4-2.5-1.4-2.5 1.4Z" />
    <path d="M7.5 6.3h9" />
    <circle className="gi-fill" cx="12" cy="10.6" r="2.2" fill="currentColor" stroke="none" />
    <path d="M8.3 16c.8-1.8 2.1-2.7 3.7-2.7s2.9.9 3.7 2.7" />
  </Base>
);
/** Fighters : sabres croisés et éclat d'impact. */
export const IconFighters = (p: P) => (
  <Base {...p}>
    <path d="M5 5l9.5 9.5M19 5l-9.5 9.5" />
    <path d="M7.2 14.2l2.6 2.6M16.8 14.2l-2.6 2.6M5.8 18.2l2-2M18.2 18.2l-2-2" />
    <path className="gi-fill" d="M12 1.8l.7 1.7 1.8-.4-1 1.5 1.3 1.2-1.8.2L12 7.6l-1-1.6-1.8-.2 1.3-1.2-1-1.5 1.8.4Z" fill="currentColor" stroke="none" />
  </Base>
);
/** Bibliothèque : manga ouvert, traits de vitesse sur la page de droite. */
export const IconBiblio = (p: P) => (
  <Base {...p}>
    <path d="M2.8 5.6c3.1-1 6.2-.6 9.2 1.4 3-2 6.1-2.4 9.2-1.4v13c-3.1-1-6.2-.6-9.2 1.4-3-2-6.1-2.4-9.2-1.4Z" />
    <path d="M12 7v13" />
    <path className="gi-accent" d="M14.8 10.2h3.6M14.8 13.2h2.6" />
  </Base>
);
/** Sommaire : trois traits de pinceau en biais. */
export const IconSommaire = (p: P) => (
  <Base {...p} strokeWidth={2.6}>
    <path d="M4 6.8 20 5.6M4 12.6l16-1.2" />
    <path className="gi-accent" d="M4 18.4l10.5-.8" />
  </Base>
);
