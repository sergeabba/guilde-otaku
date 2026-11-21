"use client";

// Préchargement selon l'intention : dès qu'un doigt se pose sur un lien interne, ou que
// la souris s'y arrête 80 ms, la page suivante se prépare (données et code). Idem pour la
// fiche complète d'un membre quand on survole sa carte. Rien en mode « économie de données ».
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Nav = Navigator & { connection?: { saveData?: boolean } };

export default function IntentPrefetch() {
  const router = useRouter();
  useEffect(() => {
    if ((navigator as Nav).connection?.saveData) return;
    const done = new Set<string>();
    let timer = 0;
    const targetOf = (el: Element | null): string | null => {
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a && !a.target && !a.hasAttribute("download")) {
        const u = new URL(a.href, location.href);
        if (u.origin === location.origin && u.pathname !== location.pathname && !u.pathname.startsWith("/api") && !u.pathname.startsWith("/admin")) return u.pathname + u.search;
      }
      const card = el?.closest?.("[data-member-id]") as HTMLElement | null;
      return card ? `/membres/${card.dataset.memberId}` : null;
    };
    const go = (href: string | null) => {
      if (!href || done.has(href) || done.size > 60) return;
      done.add(href);
      try { router.prefetch(href); } catch { /* préchargement facultatif */ }
    };
    const onTouch = (e: TouchEvent) => go(targetOf(e.target as Element));
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      window.clearTimeout(timer);
      const href = targetOf(e.target as Element);
      if (href) timer = window.setTimeout(() => go(href), 80);
    };
    document.addEventListener("touchstart", onTouch, { passive: true, capture: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => { document.removeEventListener("touchstart", onTouch, true); document.removeEventListener("pointerover", onOver); window.clearTimeout(timer); };
  }, [router]);
  return null;
}
