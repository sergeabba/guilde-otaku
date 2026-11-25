"use client";

// Secours des images : si l'optimiseur d'images de Vercel refuse une image (quota
// mensuel épuisé : erreur 402) ou échoue, le navigateur charge l'image d'origine ; si une
// version AVIF du site n'est pas lue (navigateur ancien), l'original la remplace.
import { useEffect } from "react";
import { originalOf } from "../../lib/local-image";

const OPT = /\/_next\/image\?url=([^&]+)/;

function rescue(img: HTMLImageElement) {
  if (img.dataset.gkFallback) return;
  const cur = img.currentSrc || img.src;
  const orig = originalOf(cur);
  if (orig) {
    img.dataset.gkFallback = "1";
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.src = orig;
    return;
  }
  const m = (img.currentSrc || img.src).match(OPT);
  if (!m) return;
  img.dataset.gkFallback = "1";
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  img.src = decodeURIComponent(m[1]);
}

export default function ImageFallback() {
  useEffect(() => {
    const onError = (e: Event) => { if (e.target instanceof HTMLImageElement) rescue(e.target); };
    document.addEventListener("error", onError, true);
    // Images déjà en échec avant que la page soit interactive.
    for (const img of document.images) if (img.complete && img.naturalWidth === 0 && (OPT.test(img.currentSrc || img.src) || !!originalOf(img.currentSrc || img.src))) rescue(img);
    return () => document.removeEventListener("error", onError, true);
  }, []);
  return null;
}
