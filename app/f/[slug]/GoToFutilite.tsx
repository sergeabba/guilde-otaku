"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Ouvre la futilité dans la galerie (le lien court garde son aperçu pour les réseaux). */
export default function GoToFutilite({ href }: { href: string }) {
  useEffect(() => { window.location.replace(href); }, [href]);
  return (
    <main className="gk-page gk-loading" role="status">
      <p className="gk-loading-text">Ouverture de la futilité…</p>
      <Link href={href} className="gk-btn gk-btn--sm">Ouvrir</Link>
    </main>
  );
}
