import type { Metadata } from "next";
import { getAtelierWorkBySlug } from "../../../lib/atelier-server";
import { futiliteMetadata } from "../../../lib/og/atelier-meta";
import GoToFutilite from "./GoToFutilite";

// Lien court d'une futilité : /f/<titre>. L'aperçu (WhatsApp, Discord…) montre l'œuvre ;
// le visiteur est aussitôt conduit à la futilité ouverte dans la galerie.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getAtelierWorkBySlug(slug).catch(() => null);
  return futiliteMetadata(work, work?.key ?? null, work ? slug : null);
}

export default async function FutiliteLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GoToFutilite href={`/atelier?f=${encodeURIComponent(slug)}`} />;
}
