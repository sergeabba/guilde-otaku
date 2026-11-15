import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("wanted", "/wanted", "Wanted", "Les avis de recherche et les primes des membres de la Guilde.");
}

export default function WantedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
