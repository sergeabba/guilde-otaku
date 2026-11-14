"use client";

// Transition entre les pages : la nouvelle page arrive par une coupe en biais
// (planche de manga), l'ancienne recule. Navigation native de Next (router.push),
// enveloppée dans une transition de vue ; aucune attente imposée (450 ms au plus),
// absente si le navigateur ne la gère pas ou si le visiteur demande moins d'animations.
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canViewTransition, viewTransition } from "../../lib/view-transition";

export default function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  // La nouvelle page est rendue : la transition peut se jouer.
  useLayoutEffect(() => { arrived.current?.(); arrived.current = null; }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.vtOwn !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Même page (ancre, filtre) ou administration : comportement normal.
      if (url.pathname === location.pathname || url.pathname.startsWith("/admin") || location.pathname.startsWith("/admin")) return;
      if (!canViewTransition()) return;
      e.preventDefault();
      e.stopPropagation();
      viewTransition({
        kind: "route",
        update: () => new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 450);
          arrived.current = () => { clearTimeout(timer); resolve(); };
          router.push(url.pathname + url.search + url.hash);
        }),
      });
    };
    // Phase de capture : passe avant le gestionnaire du composant Link.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
