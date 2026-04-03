import { useState, useEffect, useCallback } from "react";

// ─── BREAKPOINTS (cohérents avec Tailwind CSS) ────────────────────────────────
export const BREAKPOINTS = {
  xs:  480,
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ─── USE MEDIA QUERY ──────────────────────────────────────────────────────────
/**
 * Hook générique pour écouter une media query CSS.
 * Initialise à `false` côté SSR pour éviter les hydration mismatches.
 *
 * @example
 * const isDark = useMediaQuery("(prefers-color-scheme: dark)");
 * const isLandscape = useMediaQuery("(orientation: landscape)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// ─── USE IS MOBILE ────────────────────────────────────────────────────────────
/**
 * Détecte si l'écran est sous le breakpoint `md` (768px par défaut).
 * Plus précis que addEventListener("resize") car correspond aux vraies CSS media queries.
 * Initialise correctement à `false` côté SSR (pas de flash de layout).
 *
 * @param breakpoint - Largeur en px (défaut: 768)
 */
export function useIsMobile(breakpoint = BREAKPOINTS.md): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

// ─── USE IS TABLET ────────────────────────────────────────────────────────────
/**
 * Détecte si l'écran est entre `sm` (640px) et `lg` (1024px).
 * Utile pour adapter les layouts intermédiaires.
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

// ─── USE BREAKPOINT ───────────────────────────────────────────────────────────
/**
 * Retourne le breakpoint Tailwind actif : "xs" | "sm" | "md" | "lg" | "xl" | "2xl".
 * Utile pour des logiques de layout complexes.
 *
 * @example
 * const bp = useBreakpoint();
 * const cols = bp === "xs" ? 1 : bp === "sm" ? 2 : 3;
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("md");

  const update = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    if (w < BREAKPOINTS.xs)       setBp("xs");
    else if (w < BREAKPOINTS.sm)  setBp("sm");
    else if (w < BREAKPOINTS.md)  setBp("md");
    else if (w < BREAKPOINTS.lg)  setBp("lg");
    else if (w < BREAKPOINTS.xl)  setBp("xl");
    else                          setBp("2xl");
  }, []);

  useEffect(() => {
    update();
    let timeout: NodeJS.Timeout;
    const handler = () => { clearTimeout(timeout); timeout = setTimeout(update, 150); };
    window.addEventListener("resize", handler, { passive: true });
    return () => { clearTimeout(timeout); window.removeEventListener("resize", handler); };
  }, [update]);

  return bp;
}

// ─── USE PREFERS REDUCED MOTION ───────────────────────────────────────────────
/**
 * Détecte si l'utilisateur a activé "Réduire les animations" dans son OS.
 * À utiliser pour désactiver les animations Framer Motion si nécessaire.
 *
 * @example
 * const reducedMotion = usePrefersReducedMotion();
 * <motion.div animate={reducedMotion ? {} : { y: [0, -10, 0] }} />
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
