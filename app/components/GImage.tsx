// Image du site : comme next/image, mais les images externes (Supabase, TMDB, AniList,
// MangaDex…) sont servies en direct, sans l'optimiseur de Vercel (quota mensuel limité).
// Les images du site lui-même (dossier public) restent optimisées.
import NextImage, { type ImageProps } from "next/image";
import { directSrc } from "../../lib/image-loader";

/** Largeur utile en pixels : attribut width, sinon la plus grande taille en px de « sizes », ×2 (écrans denses). */
function widthHint(p: ImageProps): number {
  if (typeof p.width === "number") return p.width * 2;
  const px = [...(p.sizes ?? "").matchAll(/(\d+)px/g)].map((m) => Number(m[1]));
  return px.length ? Math.max(...px) * 2 : 780;
}

export default function GImage(props: ImageProps) {
  if (typeof props.src === "string") {
    const direct = directSrc(props.src, widthHint(props));
    if (direct) return <NextImage {...props} src={direct} unoptimized />;
  }
  return <NextImage {...props} />;
}
