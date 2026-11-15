import { pageMetadata } from "../../lib/og/page-meta";

// Aperçu de lien (WhatsApp…) : image du jour générée par /api/og/page.
export async function generateMetadata() {
  return pageMetadata("anniversaires", "/birthdays", "Anniversaires", "Qui souffle ses bougies dans la Guilde, et dans combien de jours.");
}

export default function BirthdaysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
