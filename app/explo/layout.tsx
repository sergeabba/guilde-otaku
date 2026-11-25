import type { Metadata } from "next";
import "../studio/studio.css";
import "./explo.css";

// Exploration artistique (trois directions radicales) : pages d'essai, hors moteurs de recherche.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ExploLayout({ children }: { children: React.ReactNode }) {
  return children;
}
