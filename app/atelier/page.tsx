import type { Metadata } from "next";
import { getAtelierWork } from "../../lib/atelier-server";
import { pageMetadata } from "../../lib/og/page-meta";
import AtelierClient from "./AtelierClient";

const DEFAULT_TITLE = "Les futilités de la Guilde";
const DEFAULT_DESC = "La galerie des créations de la Guilde Otaku : portraits, scènes et délires visuels.";

// Lien d'une futilité précise (/atelier?oeuvre=…) : aperçu WhatsApp avec CETTE œuvre,
// son titre et sa description. Sans paramètre : aperçu général de la rubrique.
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const raw = (await searchParams).oeuvre;
  const key = typeof raw === "string" ? raw : null;
  const work = key ? await getAtelierWork(key).catch(() => null) : null;
  if (!work) return pageMetadata("atelier", "/atelier", DEFAULT_TITLE, DEFAULT_DESC);
  const isVideo = key!.startsWith("drive:");
  const path = `/atelier?oeuvre=${encodeURIComponent(key!)}`;
  const title = `${work.title} · ${isVideo ? "Vidéo de la Guilde" : "Les futilités de la Guilde"}`;
  const description = work.description || (isVideo ? "Une vidéo de la Guilde Otaku, à regarder sur le site." : "Une création de la Guilde Otaku, à voir en grand sur le site.");
  const image = { url: `/api/og/atelier?f=${encodeURIComponent(key!)}`, width: 1200, height: 630, type: "image/jpeg", alt: work.title };
  return {
    title: `${title} | Guilde Otaku`,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Guilde Otaku", images: [image], locale: "fr_FR", type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default function AtelierPage() {
  return <AtelierClient />;
}
