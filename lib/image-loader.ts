// Choix de la source des images (composant GImage et optimizedSrc) : seules les images du site
// lui-même (dossier public : portraits, couvertures locales) passent par l'optimiseur
// de Vercel, dont le quota mensuel est limité. Le reste est servi en direct :
// - Supabase (futilités, portraits envoyés par l'admin) : tel quel ;
// - TMDB : à la taille la plus proche parmi celles que TMDB fournit lui-même ;
// - MangaDex : vignette 256 ou 512 px fournie par MangaDex ;
// - AniList, YouTube, Apple : déjà à une taille raisonnable.
const TMDB_SIZES = [92, 154, 185, 342, 500, 780, 1280];
const SUPABASE = /^https:\/\/[\w-]+\.supabase\.(co|in)\/storage\/v1\/object\/public\//;
const TMDB = /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)\//;
const MANGADEX = /^https:\/\/uploads\.mangadex\.org\/covers\/[^?]+\.(jpe?g|png|webp)$/i;

/** Adresse directe (sans l'optimiseur de Vercel) d'une image externe, ou null pour une image du site. */
export function directSrc(src: string, width: number): string | null {
  if (src.startsWith("/")) return null;
  if (SUPABASE.test(src)) return src;
  if (TMDB.test(src)) {
    const size = TMDB_SIZES.find((s) => s >= width);
    return src.replace(TMDB, `https://image.tmdb.org/t/p/${size ? `w${size}` : "original"}/`);
  }
  if (MANGADEX.test(src) && !/\.(256|512)\.jpg$/.test(src)) return `${src}.${width <= 256 ? 256 : 512}.jpg`;
  return src;
}
