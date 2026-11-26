// Détourages des portraits anime (scripts/make-cutouts.py, lib/cutouts.json). Module serveur :
// le manifeste n'est envoyé au navigateur que pour les portraits réellement affichés.
import cutouts from "./cutouts.json";

export interface Cutout { src: string; w: number; h: number; box: [number, number, number, number]; edge?: number }

const CUT = cutouts as unknown as Record<string, Cutout>;

/** Détourage du portrait anime, écarté s'il reste opaque sur les bords (fond mal retiré). */
export function cutoutFor(anime: string | null | undefined): Cutout | null {
  const c = anime ? CUT[anime] : undefined;
  return c && (c.edge ?? 0) <= 0.55 ? c : null;
}
