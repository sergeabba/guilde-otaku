"use client";

// Le défilement est la seule source d'état (jamais accumulé) : position → scène et
// avancement. Chaque image, les éléments marqués [data-k] reçoivent --d (distance à leur
// scène, en scènes) et la racine reçoit --p ; les uniformes WebGL sont recalculés.
import { useEffect, useRef } from "react";
import type { InkUniforms } from "../InkStage";

export interface Shot { tint: [number, number, number]; halftone: number; shatter?: number; rings?: number; focusY?: number }

export const hex = (h: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [.8, .66, .3];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Avancement pour une scène donnée : {i, to, mix} ; mix = passage vers la scène suivante. */
export function useFilm(root: React.RefObject<HTMLElement | null>, shots: Shot[], onScene?: (i: number, to: number) => void) {
  const u = useRef<InkUniforms>({ mix: 0, halftone: shots[0]?.halftone ?? .6, shatter: 0, rings: 0, tint: shots[0]?.tint ?? [1, 1, 1], focusY: shots[0]?.focusY ?? .2, light: 1 });
  const last = useRef({ i: -1, to: -1 });
  useEffect(() => {
    const el = root.current; if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = shots.length;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-k]"));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const max = Math.max(1, el.scrollHeight - innerHeight);
      const p = Math.min(1, Math.max(0, (scrollY - el.offsetTop) / max));
      const pos = p * (N - 1);
      const i = Math.min(N - 1, Math.floor(pos)), to = Math.min(N - 1, i + 1);
      const local = pos - i;
      const mix = i === to ? 0 : sstep(.55, .95, local);
      const a = shots[i], b = shots[to];
      const wave = Math.sin(Math.PI * mix);
      u.current.mix = mix;
      u.current.halftone = Math.min(1, lerp(a.halftone, b.halftone, mix) + (reduce ? 0 : wave * .45));
      u.current.shatter = lerp(a.shatter ?? 0, b.shatter ?? 0, mix) + (reduce ? 0 : wave * .12);
      u.current.rings = lerp(a.rings ?? 0, b.rings ?? 0, mix);
      u.current.tint = [0, 1, 2].map((c) => lerp(a.tint[c], b.tint[c], mix)) as [number, number, number];
      u.current.focusY = lerp(a.focusY ?? .2, b.focusY ?? .2, mix);
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--pos", pos.toFixed(3));
      for (const it of items) it.style.setProperty("--d", (pos - Number(it.dataset.k)).toFixed(3));
      if (last.current.i !== i || last.current.to !== to) { last.current = { i, to }; onScene?.(i, to); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [root, shots, onScene]);
  return u;
}

/** Aller à une scène (glissé, ou saut direct si moins d'animations). */
export function goScene(root: HTMLElement, k: number, n: number) {
  const max = root.scrollHeight - innerHeight;
  const y = root.offsetTop + (k / Math.max(1, n - 1)) * max + 2;
  scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
