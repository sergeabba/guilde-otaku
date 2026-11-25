// Images du site (dossier public) servies depuis leurs versions AVIF pré-calculées
// (scripts/optimize-images.mjs, lib/image-variants.json) au lieu de l'optimiseur de
// Vercel, dont le quota mensuel est limité. Si le navigateur ne lit pas l'AVIF,
// ImageFallback charge l'original (originalOf). Originaux intacts.
import variants from "./image-variants.json";

interface Variant { w: number[]; h: string; ow: number; oh: number; dir: string; full?: boolean }
const MAP = variants as Record<string, Variant>;

function key(src: string): string {
  const path = src.split(/[?#]/)[0];
  try { return decodeURIComponent(path); } catch { return path; }
}

/** Version AVIF d'une image locale à la largeur voulue (la plus petite qui couvre), ou null. */
export function localVariant(src: string, width: number): string | null {
  if (!src.startsWith("/")) return null;
  const v = MAP[key(src)];
  if (!v) return null;
  const w = v.w.find((x) => x >= width);
  // Plus large que toutes les versions : l'original s'il est plus léger que le WebP pleine taille.
  if (w === undefined && v.full) return src;
  return `${v.dir}/${w ?? v.w[v.w.length - 1]}-${v.h}.avif`;
}

/** Vrai si l'image locale a des versions optimisées. */
export const hasLocalVariants = (src: string) => src.startsWith("/") && !!MAP[key(src)];

/** Miniature WebP de 32 px (fonds CSS flous), ou null. */
export function tinyWebp(src: string): string | null {
  const v = MAP[key(src)];
  return v && v.w[0] === 32 ? `${v.dir}/32-${v.h}.webp` : null;
}

const BY_DIR = new Map(Object.entries(MAP).map(([src, v]) => [v.dir, src]));
/** Original d'une version AVIF du site (secours des navigateurs sans AVIF), ou null. */
export function originalOf(url: string): string | null {
  const m = /^(?:https?:\/\/[^/]+)?(\/_opt\/img\/.+)\/[^/]+\.avif$/.exec(url);
  return m ? BY_DIR.get(m[1]) ?? null : null;
}

/**
 * À appeler au début d'un onError d'image : vrai si ImageFallback vient de remplacer
 * l'AVIF par l'original (il faut alors attendre ce chargement, pas afficher d'erreur).
 */
export function rescuedByFallback(el: HTMLImageElement): boolean {
  if (el.dataset.gkFallback !== "1" || el.dataset.gkRetried) return false;
  el.dataset.gkRetried = "1";
  return true;
}
