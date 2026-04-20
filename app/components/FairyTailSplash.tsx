"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Seeded RNG ─────────────────────────────────────────────────────────────── */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* ─── Authentic Fairy Tail Emblem SVG ────────────────────────────────────────── */
function FairyTailEmblemSVG({ phase }: { phase: string }) {
  return (
    <svg
      viewBox="0 0 300 340"
      className="fairy-emblem-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Fire gradient for emblem */}
        <linearGradient id="emblemFireGrad" x1="0%" y1="100%" x2="30%" y2="0%">
          <stop offset="0%" stopColor="#cc1100" />
          <stop offset="25%" stopColor="#ee3300" />
          <stop offset="55%" stopColor="#ff6600" />
          <stop offset="80%" stopColor="#ff9900" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
        <linearGradient id="emblemFireGrad2" x1="100%" y1="100%" x2="70%" y2="0%">
          <stop offset="0%" stopColor="#cc1100" />
          <stop offset="30%" stopColor="#dd2200" />
          <stop offset="65%" stopColor="#ff5500" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
        <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,220,150,0.6)" />
          <stop offset="100%" stopColor="rgba(255,100,0,0)" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="fireGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur1" />
          <feGaussianBlur stdDeviation="8" result="blur2" in="SourceGraphic" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="innerGlow" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Outer Glow Halo ────────────────────────────────────────────────────── */}
      <ellipse
        cx="150" cy="175"
        rx="90" ry="100"
        fill="rgba(255,80,0,0.08)"
        className={phase !== "igniting" ? "halo-pulse" : ""}
      />

      {/* ── Main Fairy Tail Emblem (authentic shape) ───────────────────────────── */}
      <g filter="url(#fireGlow)" className="ft-emblem-group">

        {/* Main body - the phoenix/fairy wing shape */}
        {/* Left lower wing / tail */}
        <path
          d="M 60 290
             C 50 270, 45 240, 55 215
             C 62 195, 75 185, 85 175
             C 92 168, 95 158, 90 145
             C 85 132, 78 125, 80 110
             C 83 95, 95 88, 105 95
             L 110 100
             C 105 115, 100 125, 105 140
             C 110 152, 125 158, 130 170
             C 115 180, 108 195, 112 215
             C 116 230, 128 245, 125 265
             C 122 280, 110 290, 100 295 Z"
          fill="url(#emblemFireGrad)"
          className="emblem-body-left"
        />

        {/* Right lower wing / tail */}
        <path
          d="M 240 290
             C 250 270, 255 240, 245 215
             C 238 195, 225 185, 215 175
             C 208 168, 205 158, 210 145
             C 215 132, 222 125, 220 110
             C 217 95, 205 88, 195 95
             L 190 100
             C 195 115, 200 125, 195 140
             C 190 152, 175 158, 170 170
             C 185 180, 192 195, 188 215
             C 184 230, 172 245, 175 265
             C 178 280, 190 290, 200 295 Z"
          fill="url(#emblemFireGrad2)"
          className="emblem-body-right"
        />

        {/* Central torso */}
        <path
          d="M 130 170
             C 135 162, 142 158, 150 157
             C 158 158, 165 162, 170 170
             C 173 178, 175 190, 173 205
             C 170 220, 165 238, 165 255
             C 165 270, 168 282, 165 292
             L 150 300
             L 135 292
             C 132 282, 135 270, 135 255
             C 135 238, 130 220, 127 205
             C 125 190, 127 178, 130 170 Z"
          fill="url(#emblemFireGrad)"
          className="emblem-torso"
        />

        {/* Left upper wing */}
        <path
          d="M 105 95
             C 100 80, 95 65, 90 50
             C 86 38, 80 30, 82 20
             C 84 12, 92 8, 100 12
             C 108 16, 112 25, 115 38
             C 118 50, 118 65, 120 80
             C 122 92, 125 100, 125 112
             C 120 108, 112 102, 105 95 Z"
          fill="url(#emblemFireGrad)"
          className="emblem-wing-left-upper"
        />

        {/* Right upper wing */}
        <path
          d="M 195 95
             C 200 80, 205 65, 210 50
             C 214 38, 220 30, 218 20
             C 216 12, 208 8, 200 12
             C 192 16, 188 25, 185 38
             C 182 50, 182 65, 180 80
             C 178 92, 175 100, 175 112
             C 180 108, 188 102, 195 95 Z"
          fill="url(#emblemFireGrad2)"
          className="emblem-wing-right-upper"
        />

        {/* Left sweeping lower tail flame */}
        <path
          d="M 85 175
             C 70 170, 50 165, 32 155
             C 18 147, 10 138, 8 128
             C 6 118, 12 108, 22 110
             C 32 112, 42 122, 55 132
             C 68 142, 80 152, 90 145
             C 83 155, 82 165, 85 175 Z"
          fill="url(#emblemFireGrad)"
          className="emblem-tail-left"
        />

        {/* Right sweeping lower tail flame */}
        <path
          d="M 215 175
             C 230 170, 250 165, 268 155
             C 282 147, 290 138, 292 128
             C 294 118, 288 108, 278 110
             C 268 112, 258 122, 245 132
             C 232 142, 220 152, 210 145
             C 217 155, 218 165, 215 175 Z"
          fill="url(#emblemFireGrad2)"
          className="emblem-tail-right"
        />

        {/* Head/top flame crown */}
        <path
          d="M 115 38
             C 118 28, 125 18, 132 12
             C 138 6, 145 2, 150 5
             C 155 2, 162 6, 168 12
             C 175 18, 182 28, 185 38
             C 182 25, 172 18, 162 20
             C 158 21, 155 25, 150 28
             C 145 25, 142 21, 138 20
             C 128 18, 118 25, 115 38 Z"
          fill="#ffcc00"
          opacity="0.9"
          className="emblem-crown"
        />

        {/* Inner highlight left */}
        <path
          d="M 108 98
             C 103 85, 100 70, 96 55
             C 98 65, 102 78, 110 95 Z"
          fill="rgba(255,220,150,0.5)"
          className="emblem-highlight"
        />

        {/* Inner highlight right */}
        <path
          d="M 192 98
             C 197 85, 200 70, 204 55
             C 202 65, 198 78, 190 95 Z"
          fill="rgba(255,220,150,0.5)"
          className="emblem-highlight"
        />

        {/* Inner glow layer */}
        <path
          d="M 130 170
             C 135 162, 142 158, 150 157
             C 158 158, 165 162, 170 170
             C 165 165, 158 162, 150 162
             C 142 162, 135 165, 130 170 Z"
          fill="rgba(255,200,50,0.6)"
          filter="url(#innerGlow)"
        />
      </g>

      {/* ── FAIRY TAIL Text ────────────────────────────────────────────────────── */}
      <g filter="url(#softGlow)" className="ft-text-group">
        <text
          x="150" y="330"
          textAnchor="middle"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="28"
          fontWeight="900"
          letterSpacing="6"
          fill="#ffd700"
        >
          FAIRY TAIL
        </text>
      </g>
    </svg>
  );
}

/* ─── Canvas Fire Particle System ────────────────────────────────────────────── */
function FireCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<FireParticle[]>([]);

  interface FireParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    hue: number;
  }

  const spawnParticle = useCallback((canvas: HTMLCanvasElement): FireParticle => {
    const cx = canvas.width / 2;
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 0.5 + Math.random() * 2.5;
    return {
      x: cx + (Math.random() - 0.5) * 100,
      y: canvas.height * 0.65 + (Math.random() - 0.5) * 40,
      vx: Math.sin(angle) * speed * 0.6,
      vy: -(0.8 + Math.random() * 2.5),
      life: 0,
      maxLife: 40 + Math.random() * 60,
      size: 3 + Math.random() * 10,
      hue: Math.random() > 0.6 ? 40 : Math.random() > 0.3 ? 25 : 10,
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      for (let i = 0; i < 4; i++) {
        if (particlesRef.current.length < 180) {
          particlesRef.current.push(spawnParticle(canvas));
        }
      }

      // Update & draw
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.15) * 0.4;
        p.y += p.vy;
        p.vy -= 0.02;
        p.vx *= 0.99;
        p.size *= 0.985;

        const t = p.life / p.maxLife;
        const alpha = t < 0.1 ? t * 10 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
        const lightness = 45 + (1 - t) * 35;

        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `hsla(${p.hue + 15}, 100%, ${lightness + 20}%, 1)`);
        grad.addColorStop(0.4, `hsla(${p.hue}, 100%, ${lightness}%, 0.8)`);
        grad.addColorStop(1, `hsla(${p.hue - 5}, 100%, 30%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.life < p.maxLife && p.size > 0.5;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, spawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fire-canvas"
      style={{ display: active ? "block" : "none" }}
    />
  );
}

/* ─── Ember Sparks ───────────────────────────────────────────────────────────── */
function EmberSparks() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: 5 + seededRandom(i * 11 + 50) * 90,
        delay: seededRandom(i * 17 + 50) * 5,
        duration: 3 + seededRandom(i * 29 + 50) * 4,
        size: 1.5 + seededRandom(i * 41 + 50) * 3,
        drift: (seededRandom(i * 53) - 0.5) * 60,
      })),
    []
  );

  return (
    <div className="ember-sparks-container">
      {sparks.map((s) => (
        <div
          key={s.id}
          className="ember-spark"
          style={{
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            width: s.size,
            height: s.size,
            ["--drift" as string]: `${s.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Splash Component ──────────────────────────────────────────────────── */
export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"intro" | "igniting" | "burning" | "complete">("intro");

  /* Phase timeline */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("igniting"), 600);
    const t2 = setTimeout(() => setPhase("burning"), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* Progress bar — durée min garantie ~3.5s */
  useEffect(() => {
    if (phase !== "burning") return;
    // Rythme de chargement : lent au début, accélère au milieu, ralentit à la fin
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("complete");
          return 100;
        }
        // Speed curve: slow → medium → crawl to 100
        const speed =
          prev < 20 ? 0.9 :
          prev < 50 ? 1.3 :
          prev < 80 ? 0.95 :
          prev < 95 ? 0.45 :
          0.18;
        return Math.min(prev + speed + Math.random() * 0.6, 100);
      });
    }, 45);
    return () => clearInterval(interval);
  }, [phase]);

  /* Auto dismiss */
  useEffect(() => {
    if (phase !== "complete") return;
    const t = setTimeout(onFinish, 900);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  const isFireActive = phase === "burning" || phase === "complete";

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Background ─────────────────────────────────────────────────────────── */}
      <div className="ft-bg" />
      <div className="ft-bg-radial" />

      {/* ── Ember sparks ───────────────────────────────────────────────────────── */}
      <EmberSparks />

      {/* ── Canvas fire ────────────────────────────────────────────────────────── */}
      <FireCanvas active={isFireActive} />

      {/* ── Main content ───────────────────────────────────────────────────────── */}
      <div className="ft-content">

        {/* Logo */}
        <motion.div
          className="ft-logo-wrapper"
          initial={{ scale: 0.2, opacity: 0, rotateY: -30 }}
          animate={{
            scale: phase === "complete" ? 1.15 : phase === "intro" ? 0.5 : 1,
            opacity: phase === "intro" ? 0 : 1,
            rotateY: 0,
          }}
          transition={{
            scale: { duration: 1.0, type: "spring", bounce: 0.35 },
            opacity: { duration: 0.7, ease: "easeOut" },
            rotateY: { duration: 1.0, ease: "easeOut" },
          }}
        >
          {/* Fire aura ring */}
          <div className={`ft-aura-ring ${isFireActive ? "active" : ""}`} />
          <div className={`ft-aura-outer ${isFireActive ? "active" : ""}`} />

          {/* The SVG emblem */}
          <FairyTailEmblemSVG phase={phase} />
        </motion.div>

        {/* Title */}
        <motion.div
          className="ft-title-block"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: phase !== "intro" ? 1 : 0, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: "easeOut" }}
        >
          <h1 className="ft-title-main">GUILDE OTAKU</h1>
          <p className="ft-title-sub">— La légende commence ici —</p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="ft-loading-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === "burning" || phase === "complete" ? 1 : 0, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {/* Bar track */}
          <div className="ft-bar-track">
            <motion.div
              className="ft-bar-fill"
              style={{ width: `${progress}%` }}
            />
            {/* Leading flame tip */}
            <div
              className="ft-bar-flame-tip"
              style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
            />
            {/* Glow dot */}
            <div
              className="ft-bar-glow-dot"
              style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
            />
          </div>

          {/* Text row */}
          <div className="ft-bar-meta">
            <span className="ft-bar-percent">{Math.floor(progress)}%</span>
            <span className="ft-bar-label">
              {phase === "complete" ? "Prêt à rejoindre la Guilde !" : "Chargement en cours..."}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Vignette ───────────────────────────────────────────────────────────── */}
      <div className="ft-vignette" />
    </motion.div>
  );
}
