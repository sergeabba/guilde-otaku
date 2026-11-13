"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="gk-page tone-dark" style={{ display: "grid", placeItems: "center", padding: "48px 0" }}>
      <div className="gk-wrap" style={{ maxWidth: 720 }}>
        <p className="gk-stamp" style={{ fontSize: "1rem" }}>Koshō, panne</p>
        <h1 className="gk-display gk-h2" style={{ marginTop: 20 }}>La planche n&apos;a pas pu se charger.</h1>
        <p className="gk-body" style={{ marginTop: 14 }}>
          Une erreur est survenue pendant l&apos;affichage de cette page. Recharge-la ; si ça recommence,
          le souci vient sûrement de la connexion aux données.
        </p>
        {error.digest && (
          <p className="gk-body" style={{ marginTop: 8, fontSize: "0.85rem" }}>Référence : {error.digest}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <button type="button" className="gk-btn" onClick={reset}>Recharger la page</button>
          <Link href="/" className="gk-btn gk-btn--ghost">Retour à l&apos;accueil</Link>
        </div>
      </div>
    </main>
  );
}
