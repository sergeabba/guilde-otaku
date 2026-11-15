import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("atelier", "/atelier", "L'Atelier", "La galerie des créations de la Guilde Otaku.");
}

export default function AtelierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
