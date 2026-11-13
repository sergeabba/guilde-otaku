"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * A progressive-enhancement layer for the editorial layouts. Content remains
 * visible without JavaScript and for visitors requesting reduced motion.
 * The observer only animates sections that start below the first viewport.
 */
export default function MotionDirector() {
  const pathname = usePathname();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || typeof IntersectionObserver === "undefined") return;

    const observed = new WeakSet<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        element.classList.remove("gk-motion-pending");
        element.classList.add("gk-motion-visible");
        observer.unobserve(element);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-gk-motion]").forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        // Do not flash or hide above-the-fold content while hydrating.
        if (element.getBoundingClientRect().top < window.innerHeight * 0.86) {
          element.classList.add("gk-motion-visible");
          return;
        }
        element.classList.add("gk-motion-pending");
        observer.observe(element);
      });
    };

    let frame = requestAnimationFrame(scan);
    const scheduleScan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };

    // Covers data-driven sections added after a Supabase response/filter change.
    const root = document.getElementById("contenu") ?? document.body;
    const mutations = new MutationObserver(scheduleScan);
    mutations.observe(root, { childList: true, subtree: true });

    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pending = target.closest<HTMLElement>(".gk-motion-pending");
      if (!pending) return;
      pending.classList.remove("gk-motion-pending");
      pending.classList.add("gk-motion-visible");
      observer.unobserve(pending);
    };
    const onReducedMotion = () => {
      if (!media.matches) return;
      document.querySelectorAll<HTMLElement>(".gk-motion-pending").forEach((element) => {
        element.classList.remove("gk-motion-pending");
        element.classList.add("gk-motion-visible");
      });
      observer.disconnect();
    };
    document.addEventListener("focusin", onFocus);
    media.addEventListener("change", onReducedMotion);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      document.removeEventListener("focusin", onFocus);
      media.removeEventListener("change", onReducedMotion);
      document.querySelectorAll<HTMLElement>(".gk-motion-pending").forEach((element) => {
        element.classList.remove("gk-motion-pending");
      });
    };
  }, [pathname]);

  return <div className="gk-reading-progress" aria-hidden="true" />;
}
