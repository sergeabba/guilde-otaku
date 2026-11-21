"use client";

// Ambiance du site : saison et moment de la journée (attributs sur <html>, lus par le CSS),
// sons d'interface au toucher, et cartes de membres qui suivent la souris ou l'inclinaison
// du téléphone (reflet holographique selon le grade). Rien ne bouge avec « moins d'animations ».
import { useEffect } from "react";
import { playClick } from "../../lib/fx";
import { daypartOf, parisNow, seasonOf } from "../../lib/ambiance";
import { detectPerf, isLite } from "../../lib/perf";

const TILT = ".mc, .pf-panel, .fp-poster";
const SOUND = "button, [role='button'], .gk-btn, .gk-chip, a.jx-tile";

export default function Ambiance() {
  useEffect(() => {
    const root = document.documentElement;
    const stamp = () => { const { date, hour } = parisNow(); root.dataset.season = seasonOf(date); root.dataset.daypart = daypartOf(hour); };
    stamp();
    detectPerf();
    const clock = window.setInterval(stamp, 10 * 60_000);

    // Sons : au toucher d'un bouton (hors jeux de combat, qui ont leurs propres touches).
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(SOUND);
      if (el && !el.closest(".fx-fight, .am, [aria-disabled='true']") && !(el as HTMLButtonElement).disabled) playClick();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return () => { window.clearInterval(clock); document.removeEventListener("pointerdown", onDown); };

    // Inclinaison à la souris : la carte survolée reçoit --tx/--ty (-1 à 1).
    let raf = 0, last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || isLite()) return;
      const el = (e.target as Element | null)?.closest?.(TILT) as HTMLElement | null;
      if (last && last !== el) { last.style.removeProperty("--tx"); last.style.removeProperty("--ty"); last.classList.remove("is-tilt"); }
      last = el;
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        el.classList.add("is-tilt");
      });
    };
    const onLeave = () => { if (last) { last.style.removeProperty("--tx"); last.style.removeProperty("--ty"); last.classList.remove("is-tilt"); last = null; } };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Téléphone : l'inclinaison de l'appareil anime toutes les cartes à la fois (Android ;
    // sur iPhone, l'accès au gyroscope demande une autorisation : on s'en passe).
    let base: { b: number; g: number } | null = null, graf = 0;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || isLite()) return;
      base ??= { b: e.beta, g: e.gamma };
      const x = Math.max(-1, Math.min(1, (e.gamma - base.g) / 25)), y = Math.max(-1, Math.min(1, (e.beta - base.b) / 25));
      cancelAnimationFrame(graf);
      graf = requestAnimationFrame(() => { root.style.setProperty("--gyro-x", x.toFixed(3)); root.style.setProperty("--gyro-y", y.toFixed(3)); root.dataset.gyro = "on"; });
    };
    const needsPermission = typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && !needsPermission) window.addEventListener("deviceorientation", onTilt, { passive: true });

    return () => {
      window.clearInterval(clock);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(raf); cancelAnimationFrame(graf);
    };
  }, []);
  return null;
}
