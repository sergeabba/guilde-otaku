import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("bibliotheque", "/bibliotheque", "La Bibliothèque", "La Chronique du Bash, les verdicts de la Guilde et les notes des épisodes de la semaine.");
}

export default function BibliothequeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
