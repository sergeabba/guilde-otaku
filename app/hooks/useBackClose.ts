"use client";
// Bouton « Retour » d'Android (et geste retour d'iPhone) : ferme la fenêtre ouverte
// (fiche, partage, menu, lecteur…) au lieu de quitter la page. À l'ouverture, une entrée
// d'historique sur la même adresse est ajoutée ; « Retour » la retire et ferme la fenêtre.
// Fermée autrement (croix, Échap), la fenêtre retire elle-même son entrée.
import { useEffect, useRef } from "react";

interface OverlayState { gkOverlay?: string; gkDepth?: number }
const stateOf = (): OverlayState => (typeof history !== "undefined" && history.state && typeof history.state === "object" ? history.state : {});

/** Dernier clic sur un lien ou navigation annoncée : la fenêtre se ferme parce qu'on change de page. */
let navigatingAt = 0;
export const markNavigation = () => { navigatingAt = performance.now(); };
/** Fenêtres ouvertes en ce moment (leurs entrées d'historique). */
const live = new Set<string>();
if (typeof window !== "undefined") {
  // Entrée d'une fenêtre déjà fermée (on est parti vers une autre page depuis elle, puis revenu) :
  // on la saute, pour qu'un seul « Retour » suffise.
  window.addEventListener("popstate", () => {
    const id = stateOf().gkOverlay;
    if (id && !live.has(id)) window.setTimeout(() => { if (stateOf().gkOverlay === id && !live.has(id)) history.back(); }, 50);
  });
  window.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (a && !a.target && a.origin === location.origin && (a.pathname !== location.pathname || a.search !== location.search)) markNavigation();
  }, true);
}

export function useBackClose(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const id = Math.random().toString(36).slice(2);
    const depth = (stateOf().gkDepth ?? 0) + 1;
    // Les clés internes de Next.js sont gardées : il reconnaît la page en revenant dessus.
    history.pushState({ ...stateOf(), gkOverlay: id, gkDepth: depth }, "");
    live.add(id);
    let popped = false;
    const onPop = () => {
      // Fenêtres empilées (fiche puis partage) : seule celle du dessus se ferme.
      if ((stateOf().gkDepth ?? 0) < depth && !popped) { popped = true; close.current(); }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      live.delete(id);
      if (popped) return;
      // Fermée à la main : on retire l'entrée ajoutée, sauf si l'on part vers une autre page.
      const href = location.href;
      window.setTimeout(() => {
        if (performance.now() - navigatingAt < 1500) return;
        if (stateOf().gkOverlay === id && location.href === href) history.back();
      }, 0);
    };
  }, [open]);
}
