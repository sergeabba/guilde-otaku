// Préférence « portrait anime » ou « photo réelle », partagée par tout le site et gardée sur
// l'appareil. L'attribut html[data-face] est posé avant l'affichage (script de démarrage),
// pour que le CSS montre directement le bon portrait, sans saut.
import { useSyncExternalStore } from "react";
import { FACE_KEY as KEY } from "./face-script";

export type Face = "anime" | "real";
const EVT = "gk-face";

export function readFace(): Face {
  if (typeof document === "undefined") return "anime";
  return document.documentElement.dataset.face === "real" ? "real" : "anime";
}
export function setFace(f: Face) {
  document.documentElement.dataset.face = f;
  try { localStorage.setItem(KEY, f); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new Event(EVT));
}
const subscribe = (cb: () => void) => { window.addEventListener(EVT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); }; };

/** Portrait affiché (anime par défaut côté serveur). */
export function useFace(): Face {
  return useSyncExternalStore(subscribe, readFace, () => "anime");
}
