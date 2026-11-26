"use client";

// Profondeur des scènes de pouvoir : particules propres à la famille (feuilles, braises,
// flocons, étincelles, poussière d'or, pétales, cendres d'encre…) sur trois plans de
// profondeur, avec une parallaxe liée au pointeur et au défilement. Canvas 2D, résolution
// adaptée, pause hors écran et onglet caché ; rien en mouvement réduit ou en mode allégé.
import { useEffect, useRef } from "react";
import type { Family } from "../../../lib/power-scene";
import { PALETTE } from "../../../lib/power-scene";
import { isLite } from "../../../lib/perf";

type Kind = "leaf" | "ember" | "flake" | "spark" | "dust" | "petal" | "ash" | "streak" | "bubble";
const KIND: Partial<Record<Family, Kind>> = {
  vegetation: "leaf", feu: "ember", glace: "flake", foudre: "spark", lumiere: "dust", royaute: "dust", nuit: "dust",
  fete: "petal", couleur: "petal", ombre: "ash", fantome: "ash", vide: "ash", vitesse: "streak", sport: "streak", vent: "streak",
  voix: "bubble", savoir: "dust", spectacle: "dust", pierre: "spark", temps: "dust", miroir: "spark", force: "ember",
};

interface P { x: number; y: number; z: number; vx: number; vy: number; r: number; a: number; s: number; c: string }

export default function SceneDepth({ family, slow = 1, burst = false }: { family: Family; slow?: number; burst?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches || isLite()) return;
    const g = cv.getContext("2d"); if (!g) return;
    const kind = KIND[family] ?? "dust";
    const pal = PALETTE[family];
    const colors = [pal.glow, pal.hue, "#ffffff"];
    let w = 0, h = 0, dpr = 1, raf = 0, visible = false, last = 0;
    const ps: P[] = [];
    const mouse = { x: 0, y: 0 };
    const resize = () => {
      dpr = Math.min(1.5, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr;
      ps.length = 0;
      const n = Math.round(Math.min(90, (w * h) / 9000) * (burst ? 1.3 : 1));
      for (let i = 0; i < n; i++) ps.push(spawn(true));
    };
    const spawn = (init = false): P => {
      const z = [0.35, 0.7, 1.15][Math.floor(Math.random() * 3)];
      const up = kind === "ember" || kind === "bubble";
      const side = kind === "streak";
      return {
        x: side ? (init ? Math.random() * w : -40) : Math.random() * w,
        y: init ? Math.random() * h : up ? h + 10 : -10,
        z, r: (kind === "streak" ? 1.4 : 2 + Math.random() * 3) * z,
        vx: side ? (3 + Math.random() * 4) * z : (Math.random() - 0.5) * 0.4 * z,
        vy: up ? -(0.4 + Math.random() * 0.8) * z : side ? 0 : (0.25 + Math.random() * 0.6) * z,
        a: Math.random() * Math.PI * 2, s: (Math.random() - 0.5) * 0.04, c: colors[Math.floor(Math.random() * colors.length)],
      };
    };
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      const dt = Math.min(2, (t - last) / 16.7 || 1) / slow; last = t;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const sc = cv.getBoundingClientRect().top / innerHeight; // défilement : -1 → 1
      for (const p of ps) {
        p.x += (p.vx + Math.sin(t / 900 + p.a) * 0.2 * p.z) * dt; p.y += p.vy * dt; p.a += p.s * dt;
        if (p.y > h + 20 || p.y < -30 || p.x > w + 60) Object.assign(p, spawn());
        // Parallaxe : les plans proches bougent plus avec le pointeur et le défilement.
        const ox = mouse.x * 14 * p.z, oy = mouse.y * 10 * p.z + sc * 40 * p.z;
        g.globalAlpha = 0.35 + 0.5 * (p.z / 1.15);
        g.fillStyle = p.c; g.strokeStyle = p.c;
        const x = p.x + ox, y = p.y + oy;
        g.save(); g.translate(x, y); g.rotate(p.a);
        if (kind === "leaf" || kind === "petal") { g.beginPath(); g.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2); g.fill(); }
        else if (kind === "flake") { g.lineWidth = 0.8 * p.z; for (let k = 0; k < 3; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-p.r * 1.4, 0); g.lineTo(p.r * 1.4, 0); g.stroke(); } }
        else if (kind === "spark") { g.lineWidth = 1.2 * p.z; g.beginPath(); g.moveTo(-p.r * 2, 0); g.lineTo(p.r * 2, 0); g.moveTo(0, -p.r * 2); g.lineTo(0, p.r * 2); g.stroke(); }
        else if (kind === "streak") { g.rotate(-p.a); g.fillRect(-p.r * 30, -p.r / 2, p.r * 30, p.r); }
        else if (kind === "bubble") { g.lineWidth = 1; g.beginPath(); g.arc(0, 0, p.r * 1.6, 0, Math.PI * 2); g.stroke(); }
        else if (kind === "ash") { g.globalAlpha *= 0.7; g.fillStyle = "#000"; g.beginPath(); g.arc(0, 0, p.r * 1.4, 0, Math.PI * 2); g.fill(); }
        else { g.beginPath(); g.arc(0, 0, p.r * (kind === "ember" ? 0.8 : 0.6), 0, Math.PI * 2); g.fill(); if (kind === "ember") { g.globalAlpha *= 0.3; g.beginPath(); g.arc(0, 0, p.r * 2.6, 0, Math.PI * 2); g.fill(); } }
        g.restore();
      }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; };
    resize(); io.observe(cv);
    addEventListener("resize", resize); addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize); removeEventListener("pointermove", onMove); };
  }, [family, slow, burst]);
  return <canvas ref={ref} className="ps-depth" aria-hidden="true" />;
}
