// Choix de la source des images (composant GImage et optimizedSrc), sans l'optimiseur de
// Vercel (quota mensuel épuisé) :
// - images du site (dossier public) : versions WebP pré-calculées (lib/local-image.ts),
//   l'original pour les petites ;
// - Supabase (futilités, portraits envoyés par l'admin) : tel quel ;
// - TMDB : à la taille la plus proche parmi celles que TMDB fournit lui-même ;
// - MangaDex : vignette 256 ou 512 px fournie par MangaDex ;
// - AniList, YouTube, Apple : déjà à une taille raisonnable.
const TMDB_SIZES = [92, 154, 185, 342, 500, 780, 1280];
const SUPABASE = /^https:\/\/[\w-]+\.supabase\.(co|in)\/storage\/v1\/object\/public\//;
const TMDB = /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)\//;
const MANGADEX = /^https:\/\/uploads\.mangadex\.org\/covers\/[^?]+\.(jpe?g|png|webp)$/i;

import { localVariant } from "./local-image";

/** Adresse directe (sans l'optimiseur de Vercel) d'une image : version WebP pré-calculée
 *  pour une grande image du site, l'original pour une petite, l'adresse adaptée sinon. */
export function directSrc(src: string, width: number): string {
  if (src.startsWith("/")) return localVariant(src, width) ?? src;
  if (SUPABASE.test(src)) return src;
  if (TMDB.test(src)) {
    const size = TMDB_SIZES.find((s) => s >= width);
    return src.replace(TMDB, `https://image.tmdb.org/t/p/${size ? `w${size}` : "original"}/`);
  }
  if (MANGADEX.test(src) && !/\.(256|512)\.jpg$/.test(src)) return `${src}.${width <= 256 ? 256 : 512}.jpg`;
  return src;
}

/** Largeur utile en pixels : attribut width, sinon la plus grande taille en px de « sizes », ×2 (écrans denses). */
export function widthHint(p: { width?: unknown; sizes?: string }): number {
  if (typeof p.width === "number") return p.width * 2;
  // Les conditions entre parenthèses (« (max-width: 899px) ») ne sont pas des tailles d'image.
  const px = [...(p.sizes ?? "").replace(/\([^)]*\)/g, "").matchAll(/(\d+)px/g)].map((m) => Number(m[1]));
  return px.length ? Math.max(...px) * 2 : 780;
}
