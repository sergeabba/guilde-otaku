import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("bons-plans", "/bons-plans", "Bons plans", "Les adresses que la Guilde se refile : animes, scans, films et outils.");
}

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
