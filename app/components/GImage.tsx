"use client";

// Image du site : comme next/image, mais les images externes (Supabase, TMDB, AniList,
// MangaDex…) sont servies en direct, sans l'optimiseur de Vercel (quota mensuel limité).
// Les grandes images du site ont des versions WebP pré-calculées (lib/local-image.ts).
import NextImage, { type ImageProps } from "next/image";
import { directSrc, widthHint } from "../../lib/image-loader";
import { hasLocalVariants, localVariant } from "../../lib/local-image";

export default function GImage(props: ImageProps) {
  if (typeof props.src === "string") {
    const src = props.src;
    // Grande image du site : le navigateur choisit la version WebP adaptée à l'écran.
    // Secours si le navigateur ne lit pas l'AVIF : ImageFallback (originalOf).
    if (hasLocalVariants(src)) return <NextImage {...props} loader={({ width }) => localVariant(src, width) ?? src} />;
    return <NextImage {...props} src={directSrc(src, widthHint(props))} unoptimized />;
  }
  return <NextImage {...props} />;
}
