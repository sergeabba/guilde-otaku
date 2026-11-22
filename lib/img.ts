// Version redimensionnée d'une image pour les <img> simples (affiches, vignettes) :
// passe par l'optimiseur du site, comme next/image. Les portraits d'origine font jusqu'à
// 1920 × 2560 : affichés tels quels, une page de 50 membres dépasse la mémoire d'un iPhone.
import { directSrc } from "./image-loader";

const WIDTHS = [64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
const REMOTE = /^https:\/\/([\w-]+\.supabase\.(co|in)\/storage\/v1\/object\/public\/|s4\.anilist\.co\/file\/anilistcdn\/|image\.tmdb\.org\/|uploads\.mangadex\.org\/)/;

export function optimizedSrc(src: string | null | undefined, width: number): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/_next/") || src.startsWith("data:") || /\.svg($|\?)/i.test(src)) return src;
  if (!src.startsWith("/") && !REMOTE.test(src)) return src;
  // Images externes : en direct (quota de l'optimiseur Vercel gardé pour les images du site).
  const direct = directSrc(src, width);
  if (direct) return direct;
  const w = WIDTHS.find((x) => x >= width) ?? 1920;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
