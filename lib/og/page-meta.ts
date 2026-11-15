// Métadonnées de partage d'une rubrique (titre, description, image d'aperçu du jour).
import type { Metadata } from "next";
import { pageOgUrl, type PageId } from "./page-art";

export function pageMetadata(page: PageId, path: string, title: string, description: string): Metadata {
  const image = { url: pageOgUrl(page), width: 1200, height: 630, type: "image/jpeg", alt: `${title} · Guilde Otaku` };
  return {
    title: `${title} | Guilde Otaku`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · Guilde Otaku`, description, url: path, siteName: "Guilde Otaku", images: [image], locale: "fr_FR", type: "website" },
    twitter: { card: "summary_large_image", title: `${title} · Guilde Otaku`, description, images: [image.url] },
  };
}
