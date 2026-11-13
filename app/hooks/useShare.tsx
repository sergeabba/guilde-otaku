"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ShareData {
  title: string;
  text?: string;
  /** Chemin relatif ou URL absolue. Par défaut : la page courante. */
  url?: string;
}

/**
 * Partage natif quand le navigateur le propose, sinon copie du lien.
 * Renvoie aussi un <Toast /> à poser dans le rendu pour confirmer l'action.
 */
export function useShare() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const share = useCallback(async ({ title, text, url }: ShareData) => {
    const full = new URL(url ?? window.location.href, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: full });
        return;
      } catch (err) {
        // L'utilisateur a refermé la feuille de partage : rien à signaler.
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      notify("Lien copié");
    } catch {
      notify("Copie impossible sur ce navigateur");
    }
  }, [notify]);

  const Toast = useCallback(() => {
    if (!message || typeof document === "undefined") return null;
    return createPortal(
      <div className="gk-toast" role="status" aria-live="polite">{message}</div>,
      document.body
    );
  }, [message]);

  return { share, notify, Toast };
}
