import { useState, useEffect } from "react";

/**
 * Détecte si l'écran est sous le breakpoint via matchMedia.
 * Plus précis que addEventListener("resize") car correspond aux vraies CSS media queries.
 * Initialise correctement à `false` côté SSR (pas de flash de layout).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
