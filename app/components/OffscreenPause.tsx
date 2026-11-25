"use client";

// Les animations en boucle des blocs sortis de l'écran sont mises en pause (marquees,
// faisceaux, vagues, égaliseurs, bandes défilantes…), puis reprennent au retour : moins de
// travail pour le processeur et la batterie, rien de visible pour le visiteur.
// Le bloc reçoit data-offscreen ; la règle CSS est dans app/styles/motion.css.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Blocs qui contiennent des boucles décoratives (à compléter quand on en ajoute). */
export const LOOP_BLOCKS = [
  ".gk-motion-ticker", ".gk-wall", ".gk-bday", ".sotd", ".cin-hero", ".cin-tape", ".cal-hero",
  ".tm-hero", ".tm-stage", ".wt-hero", ".wt-waves", ".jx-eq", ".mpl-eq", ".fxs-decor",
  ".fx-strip", ".fx-title", ".gk-loading", "[data-loop]",
].join(",");

export default function OffscreenPause() {
  const path = usePathname();
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) delete (e.target as HTMLElement).dataset.offscreen;
        else (e.target as HTMLElement).dataset.offscreen = "";
      }
    }, { rootMargin: "120px 0px" });
    const seen = new WeakSet<Element>();
    const scan = () => document.querySelectorAll(LOOP_BLOCKS).forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
    scan();
    // Blocs ajoutés après coup (chargement des données, onglets) : nouvelle passe, groupée.
    let t = 0;
    const mo = new MutationObserver(() => { if (!t) t = window.setTimeout(() => { t = 0; scan(); }, 250); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); window.clearTimeout(t); };
  }, [path]);
  return null;
}
