import type { Metadata } from "next";
import "./studio.css";
import "./motion.css";

// Prototypes de la Phase 1 : pages d'essai, hors moteurs de recherche.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
