"use client";

// Célébration : pluie de pétales (couleurs de la saison) et tampon rouge « Victoire »,
// déclenchés par celebrate() (lib/fx.ts). Rien si le visiteur demande moins d'animations,
// sinon un simple tampon sans mouvement.
import { useEffect, useRef, useState } from "react";
import { playWin, type Celebration } from "../../lib/fx";
import { parisNow, seasonOf, SEASON_PARTICLES } from "../../lib/ambiance";

export default function Celebrate() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stamp, setStamp] = useState<Celebration | null>(null);

  useEffect(() => {
    let raf = 0, hide = 0;
    const onWin = (e: Event) => {
      const c = (e as CustomEvent<Celebration>).detail ?? {};
      playWin();
      setStamp(c);
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setStamp(null), c.big ? 2600 : 1900);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cv = canvas.current; if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      const g = cv.getContext("2d"); if (!g) return;
      g.scale(dpr, dpr);
      const { colors } = SEASON_PARTICLES[seasonOf(parisNow().date)];
      const palette = [...colors, "#d7332b", "#c9a84c", "#f6f0e6"];
      const n = c.big ? 140 : 80;
      const ps = Array.from({ length: n }, () => ({
        x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4, y: innerHeight * 0.55,
        vx: (Math.random() - 0.5) * 14, vy: -8 - Math.random() * 10, r: 5 + Math.random() * 7,
        a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.3, c: palette[Math.floor(Math.random() * palette.length)],
      }));
      const t0 = performance.now();
      cancelAnimationFrame(raf);
      const tick = (t: number) => {
        g.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of ps) {
          p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c;
          // Pétale : ellipse aplatie qui « tourne » (largeur qui varie).
          g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.45 * Math.abs(Math.cos(p.a * 2)) + 1, 0, 0, Math.PI * 2); g.fill();
          g.restore();
        }
        if (t - t0 < 2600) raf = requestAnimationFrame(tick); else g.clearRect(0, 0, innerWidth, innerHeight);
      };
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("gk:celebrate", onWin);
    return () => { window.removeEventListener("gk:celebrate", onWin); cancelAnimationFrame(raf); window.clearTimeout(hide); };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="gk-confetti" aria-hidden="true" />
      {stamp && (
        <div className={`gk-stamp${stamp.big ? " is-big" : ""}`} role="status">
          <b>{stamp.title ?? "Victoire"}</b>
          {stamp.sub && <small>{stamp.sub}</small>}
        </div>
      )}
    </>
  );
}
