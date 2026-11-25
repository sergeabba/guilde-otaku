"use client";

// Aperçu des directions typographiques (Phase 1) : ?typo=hebdo | kirikomi | densetsu
// pose <html data-typo> et s'en souvient sur l'appareil pendant la visite ; ?typo=off
// revient au site actuel. Un petit sélecteur reste à l'écran pour comparer.
// À retirer (ou à figer sur la direction choisie) une fois la direction validée.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const TYPO = [
  { id: "hebdo", label: "A · Hebdo" },
  { id: "kirikomi", label: "B · Kirikomi" },
  { id: "densetsu", label: "C · Densetsu" },
] as const;
const KEY = "gk-typo-preview";

function apply(v: string | null) {
  try { if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY); } catch { /* stockage indisponible */ }
  if (v) document.documentElement.dataset.typo = v; else delete document.documentElement.dataset.typo;
}

export default function TypoPreview() {
  const path = usePathname();
  const [cur, setCur] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("typo");
    let v: string | null = null;
    try {
      if (q === "off") sessionStorage.removeItem(KEY);
      else if (q && TYPO.some((t) => t.id === q)) sessionStorage.setItem(KEY, q);
      v = sessionStorage.getItem(KEY);
    } catch { v = q && TYPO.some((t) => t.id === q) ? q : null; }
    apply(v);
    void Promise.resolve().then(() => setCur(v));
  }, [path]);

  if (!cur) return null;
  const pick = (id: string | null) => { apply(id); setCur(id); };
  return (
    <div className="gk-typo-bar" role="group" aria-label="Aperçu typographique">
      {TYPO.map((t) => <button key={t.id} type="button" aria-pressed={cur === t.id} onClick={() => pick(t.id)}>{t.label}</button>)}
      <button type="button" onClick={() => pick(null)}>Actuel</button>
    </div>
  );
}
