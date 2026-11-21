"use client";

// Fond vivant de la couverture de l'accueil : trame de points qui ondule, traits de vitesse
// et particules de la saison (pétales, feuilles, flocons…) qui s'écartent sous le doigt
// ou la souris. En pause hors de l'écran ; absent avec « réduire les animations ».
import { useEffect, useRef } from "react";
import { parisNow, seasonOf, SEASON_PARTICLES } from "../../lib/ambiance";

export default function CoverFx() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const g = cv.getContext("2d"); if (!g) return;
    const season = SEASON_PARTICLES[seasonOf(parisNow().date)];
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--gk-text").trim() || "#f6f0e6";
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const pointer = { x: -999, y: -999 };
    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const count = Math.round(Math.min(34, Math.max(14, (w * h) / 26_000)));
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, r: 4 + Math.random() * 6, a: Math.random() * 6.28,
      s: 0.6 + Math.random() * 0.8, c: season.colors[Math.floor(Math.random() * season.colors.length)],
    }));
    const lines = Array.from({ length: 9 }, () => ({ y: Math.random(), len: 0.2 + Math.random() * 0.35, speed: 0.004 + Math.random() * 0.006, x: Math.random() }));

    const shape = (p: (typeof ps)[number]) => {
      g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c;
      if (season.shape === "flake") { g.globalAlpha = 0.8; g.beginPath(); g.arc(0, 0, p.r * 0.45, 0, Math.PI * 2); g.fill(); }
      else if (season.shape === "spark") { g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(p.a * 3)); g.beginPath(); g.arc(0, 0, p.r * 0.3, 0, Math.PI * 2); g.fill(); }
      else if (season.shape === "leaf") { g.globalAlpha = 0.85; g.beginPath(); g.moveTo(0, -p.r); g.quadraticCurveTo(p.r * 0.9, 0, 0, p.r); g.quadraticCurveTo(-p.r * 0.9, 0, 0, -p.r); g.fill(); }
      else { g.globalAlpha = 0.85; g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.5 * Math.abs(Math.cos(p.a)) + 1, 0, 0, Math.PI * 2); g.fill(); }
      g.restore();
    };
    let t = 0;
    const frame = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      t += 1;
      g.clearRect(0, 0, w, h);
      // Trame de points : rayon qui ondule en vague diagonale.
      g.fillStyle = ink; g.globalAlpha = 0.07;
      for (let y = 10; y < h; y += 18) for (let x = 10 + ((y / 18) % 2) * 9; x < w; x += 18) {
        const k = Math.sin((x + y) * 0.012 - t * 0.03);
        g.beginPath(); g.arc(x, y, 1.2 + k * 1.1, 0, Math.PI * 2); g.fill();
      }
      // Traits de vitesse qui filent de droite à gauche.
      g.globalAlpha = 0.12; g.strokeStyle = ink; g.lineWidth = 1.5;
      for (const l of lines) {
        l.x -= l.speed; if (l.x + l.len < 0) { l.x = 1; l.y = Math.random(); }
        g.beginPath(); g.moveTo(l.x * w, l.y * h); g.lineTo((l.x + l.len) * w, l.y * h); g.stroke();
      }
      g.globalAlpha = 1;
      // Particules de la saison : chute, dérive, et écart autour du pointeur.
      for (const p of ps) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) { const f = (1 - Math.sqrt(d2) / 120) * 0.9; p.vx += (dx / (Math.sqrt(d2) + 1)) * f; p.vy += (dy / (Math.sqrt(d2) + 1)) * f; }
        p.vx = p.vx * 0.94 + Math.sin(t * 0.01 + p.r) * 0.02 * season.drift;
        p.vy = p.vy * 0.94 + 0.02 * season.fall;
        p.x += p.vx + season.drift * 0.25 * Math.sin(t * 0.008 + p.r); p.y += p.vy + season.fall * p.s; p.a += 0.01 * p.s;
        if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; } if (p.y < -14) { p.y = h + 10; }
        if (p.x > w + 12) p.x = -12; if (p.x < -14) p.x = w + 10;
        shape(p);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(cv);
    const move = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    const out = () => { pointer.x = pointer.y = -999; };
    const host = cv.parentElement!;
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerdown", move, { passive: true });
    host.addEventListener("pointerleave", out);
    const ro = new ResizeObserver(size); ro.observe(cv);
    document.addEventListener("visibilitychange", start);
    start();
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", start); host.removeEventListener("pointermove", move); host.removeEventListener("pointerdown", move); host.removeEventListener("pointerleave", out); };
  }, []);
  return <canvas ref={ref} className="hm-cover-fx" aria-hidden="true" />;
}
