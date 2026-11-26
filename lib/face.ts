// Préférence « portrait anime » ou « photo réelle », partagée par tout le site et gardée sur
// l'appareil. L'attribut html[data-face] est posé avant l'affichage (script de démarrage),
// pour que le CSS montre directement le bon portrait, sans saut.
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { FACE_KEY as KEY } from "./face-script";
import { viewTransition } from "./view-transition";

export type Face = "anime" | "real";
const EVT = "gk-face";

export function readFace(): Face {
  if (typeof document === "undefined") return "anime";
  return document.documentElement.dataset.face === "real" ? "real" : "anime";
}
function apply(f: Face) {
  document.documentElement.dataset.face = f;
  try { localStorage.setItem(KEY, f); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new Event(EVT));
}

// Dernier point touché ou cliqué : la bascule part de là (tache d'encre).
let origin: [number, number] | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { origin = [e.clientX, e.clientY]; }, { capture: true, passive: true });
}

/**
 * Change le portrait affiché sur tout le site. Moment signature : la nouvelle version
 * s'étend en tache d'encre depuis le bouton (transition de vue native). Sans prise en
 * charge ou avec « réduire les animations », le changement est immédiat.
 */
export function setFace(f: Face) {
  if (f === readFace()) return;
  const root = document.documentElement;
  const [x, y] = origin ?? [innerWidth / 2, innerHeight / 2];
  root.style.setProperty("--ink-x", `${Math.round(x)}px`);
  root.style.setProperty("--ink-y", `${Math.round(y)}px`);
  origin = null;
  viewTransition({ kind: "face", update: () => flushSync(() => apply(f)) });
}
const subscribe = (cb: () => void) => { window.addEventListener(EVT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); }; };

/** Portrait affiché (anime par défaut côté serveur). */
export function useFace(): Face {
  return useSyncExternalStore(subscribe, readFace, () => "anime");
}
