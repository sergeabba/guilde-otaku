// Images du site (dossier public) servies depuis leurs versions WebP pré-calculées
// (scripts/optimize-images.mjs, lib/image-variants.json) au lieu de l'optimiseur de
// Vercel, dont le quota mensuel est épuisé. Les originaux restent intacts dans public/.
import variants from "./image-variants.json";

interface Variant { w: number[]; h: string; ow: number; oh: number; dir: string; full?: boolean }
const MAP = variants as Record<string, Variant>;

function key(src: string): string {
  const path = src.split(/[?#]/)[0];
  try { return decodeURIComponent(path); } catch { return path; }
}

/** Version WebP d'une image locale à la largeur voulue (la plus petite qui couvre), ou null. */
export function localVariant(src: string, width: number): string | null {
  if (!src.startsWith("/")) return null;
  const v = MAP[key(src)];
  if (!v) return null;
  const w = v.w.find((x) => x >= width);
  // Plus large que toutes les versions : l'original s'il est plus léger que le WebP pleine taille.
  if (w === undefined && v.full) return src;
  return `${v.dir}/${w ?? v.w[v.w.length - 1]}-${v.h}.webp`;
}

/** Vrai si l'image locale a des versions optimisées. */
export const hasLocalVariants = (src: string) => src.startsWith("/") && !!MAP[key(src)];
