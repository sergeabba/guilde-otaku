import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("fighters", "/fighters", "Fighters", "Choisis ton combattant parmi les membres de la Guilde et lance le duel.");
}

export default function FightersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
