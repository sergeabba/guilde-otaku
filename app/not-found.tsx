import Link from "next/link";
import type { Metadata } from "next";
import { NAV, chapterNo } from "./config/nav";

export const metadata: Metadata = { title: "Page introuvable | Guilde Otaku" };

export default function NotFound() {
  return (
    <main className="gk-page tone-dark" style={{ display: "grid", placeItems: "center", position: "relative", overflow: "hidden", padding: "48px 0" }}>
      <div className="gk-speed" aria-hidden="true" style={{ position: "absolute", inset: "-30%", pointerEvents: "none" }} />
      <div className="gk-wrap gk-reveal" style={{ position: "relative", maxWidth: 860 }}>
        <p className="gk-chapter"><b>404</b><span>CHAPITRE MANQUANT</span></p>
        <h1 className="gk-display gk-inked" style={{ fontSize: "clamp(5rem, 26vw, 15rem)", lineHeight: 0.85, marginTop: 20 }}>
          404
        </h1>
        <p className="gk-display gk-h4" style={{ marginTop: 24 }}>
          Cette page a quitté la Guilde.
        </p>
        <p className="gk-body" style={{ marginTop: 12 }}>
          Lien périmé ou adresse mal tapée. Le sommaire, lui, est toujours là.
        </p>
        <nav aria-label="Rubriques" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
          <Link href="/" className="gk-btn">Retour à l&apos;accueil</Link>
          {NAV.slice(1).map((n, i) => (
            <Link key={n.id} href={n.href} className="gk-btn gk-btn--ghost gk-btn--sm">
              <span style={{ opacity: 0.6 }}>{chapterNo(i + 1)}</span> {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
