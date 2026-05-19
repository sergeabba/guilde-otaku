"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import VideoPlayer from "../components/VideoPlayer";
import { Rank, type Member } from "../../data/members";
import { rankAccents } from "../config/ranks";
import { type ViewMode } from "./kof-ui";

const rc = (rank: string) => {
  const main = rankAccents[rank as Rank] ?? rankAccents.Tous;
  return { main, bg: `${main}18`, glow: `${main}66` };
};
const portrait = (m: Member, mode: ViewMode) => (mode === "anime" ? m.animeChar : m.photo);
const videoSrc = (m: Member, mode: ViewMode) => (mode === "anime" ? (m.animeVideo ?? "") : (m.photoVideo ?? ""));

function HPBar({ hp, color, glow, side, name, combo }: { hp: number; color: string; glow: string; side: "left" | "right"; name: string; combo: number }) {
  const danger = hp <= 25;
  const bc = danger ? "#FF1A1A" : color;
  return (
    <div className={`flex-1 ${side === "right" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-2 mb-1 ${side === "right" ? "flex-row-reverse" : ""}`}>
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, fontWeight: 700, color, letterSpacing: 1 }}>{side === "left" ? "P1" : "P2"}</span>
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(12px,2vw,18px)", fontWeight: 900, color: "#fff", letterSpacing: 2 }}>{name.toUpperCase()}</span>
        <AnimatePresence>
          {combo > 1 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "#FF4500", fontWeight: 900, background: "rgba(255,69,0,0.15)", padding: "1px 6px", borderRadius: 2 }}>
              {combo}HIT
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div style={{ position: "relative", height: 18, background: "rgba(0,0,0,0.7)", border: `1px solid ${bc}20`, borderRadius: 1, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${hp}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{
            position: "absolute", top: 0, bottom: 0,
            [side === "right" ? "right" : "left"]: 0,
            background: danger ? "linear-gradient(90deg,#FF1A1A,#FF5500)" : `linear-gradient(90deg,${color}cc,${color})`,
            boxShadow: `0 0 8px ${glow}`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 900, color: "#fff", textShadow: "0 1px 3px #000" }}>{hp}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   PARTICLE SYSTEM (canvas, object-pooled)
   Game-developer pattern: pool of 120 pre-allocated particles,
   driven by requestAnimationFrame + delta time — zero GC pressure.
═══════════════════════════════ */
interface Particle {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

const POOL_SIZE = 120;

function useParticleSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const pool = useRef<Particle[]>(
    Array.from({ length: POOL_SIZE }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 2, color: "#FFD700",
    }))
  );
  const rafRef = useRef(0);
  const lastTs  = useRef(0);

  /* Spawn a burst at (x,y) — reuses inactive pool slots */
  const burst = useCallback((x: number, y: number, color: string, count = 18, crit = false) => {
    let spawned = 0;
    for (let i = 0; i < POOL_SIZE && spawned < count; i++) {
      const p = pool.current[i];
      if (p.active) continue;
      const angle  = Math.random() * Math.PI * 2;
      const speed  = (crit ? 4 : 2.5) + Math.random() * (crit ? 5 : 3);
      p.active  = true;
      p.x       = x; p.y = y;
      p.vx      = Math.cos(angle) * speed;
      p.vy      = Math.sin(angle) * speed - (crit ? 4 : 2);
      p.life    = 0;
      p.maxLife = 0.35 + Math.random() * 0.4;
      p.size    = crit ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2;
      p.color   = color;
      spawned++;
    }
  }, []);

  /* RAF game loop — delta time ensures frame-independence */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTs.current) / 1000, 0.05); // cap at 50 ms
      lastTs.current = ts;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of pool.current) {
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) { p.active = false; continue; }
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 80 * dt; // gravity
        p.vx *= 0.96;
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [canvasRef]);

  return burst;
}

/* ═══════════════════════════════
   FIGHT STATE MACHINE
   States: intro → fighting → ko → done
   Driven by RAF + delta time — no setInterval drift.
═══════════════════════════════ */
type FightState = "intro" | "fighting" | "ko" | "done";

interface FightStateData {
  hp1: number; hp2: number;
  combo1: number; combo2: number;
  hitSide: "left" | "right" | null;
  shake: boolean;
  roundText: string | null;
  winner: Member | null;
  fightState: FightState;
}

function Arena({ p1, p2, mode, onExit }: { p1: Member; p2: Member; mode: ViewMode; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burst = useParticleSystem(canvasRef);

  /* All mutable fight data in a single ref — no re-render per tick */
  const gs = useRef<FightStateData>({
    hp1: 100, hp2: 100,
    combo1: 0, combo2: 0,
    hitSide: null, shake: false,
    roundText: "ROUND 1",
    winner: null,
    fightState: "intro",
  });

  /* React state — only the values actually rendered */
  const [snap, setSnap] = useState<FightStateData>({ ...gs.current });
  const commit = useCallback(() => setSnap({ ...gs.current }), []);

  const rafRef   = useRef(0);
  const lastTs   = useRef(0);
  const accumRef = useRef(0);       // time since last attack tick
  const TICK_S   = 0.72;            // ~700ms attack cadence

  const s1 = p1.stats ?? { force: 80, vitesse: 80, technique: 80 };
  const s2 = p2.stats ?? { force: 80, vitesse: 80, technique: 80 };
  const total = (s1.force + s1.vitesse + s1.technique) + (s2.force + s2.vitesse + s2.technique);
  const p1Bias = (s1.force + s1.vitesse + s1.technique) / total;

  const c1 = rc(p1.rank), c2 = rc(p2.rank);

  /* Intro sequence: ROUND 1 → FIGHT! → fighting */
  useEffect(() => {
    const t0 = setTimeout(() => { gs.current.roundText = "FIGHT!"; commit(); }, 1200);
    const t1 = setTimeout(() => { gs.current.roundText = null; gs.current.fightState = "fighting"; commit(); }, 2400);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [commit]);

  /* Main game loop — RAF with delta time */
  useEffect(() => {
    const loop = (ts: number) => {
      const dt = Math.min((ts - lastTs.current) / 1000, 0.05);
      lastTs.current = ts;
      const g = gs.current;

      if (g.fightState === "fighting") {
        accumRef.current += dt;
        if (accumRef.current >= TICK_S) {
          accumRef.current = 0;
          const r    = Math.random();
          const p1Hits = r < p1Bias * 0.72;
          const attacker = p1Hits ? s1 : s2;
          const crit = Math.random() < attacker.technique / 380;
          const dmg  = crit
            ? Math.round((attacker.force / 100) * (Math.random() * 6 + 4) * 2.4 + 8)
            : Math.round((attacker.force / 100) * (Math.random() * 5 + 2));

          if (p1Hits) {
            g.hp2     = Math.max(0, g.hp2 - dmg);
            g.hitSide = "right";
            g.combo2++;  g.combo1 = 0;
            /* spawn particles on right side ~65% x */
            burst(
              (canvasRef.current?.offsetWidth ?? 400) * 0.72,
              (canvasRef.current?.offsetHeight ?? 300) * 0.55,
              c1.main, crit ? 28 : 14, crit
            );
          } else {
            g.hp1     = Math.max(0, g.hp1 - dmg);
            g.hitSide = "left";
            g.combo1++;  g.combo2 = 0;
            burst(
              (canvasRef.current?.offsetWidth ?? 400) * 0.28,
              (canvasRef.current?.offsetHeight ?? 300) * 0.55,
              c2.main, crit ? 28 : 14, crit
            );
          }
          if (crit) { g.shake = true; setTimeout(() => { gs.current.shake = false; commit(); }, 350); }
          setTimeout(() => { gs.current.hitSide = null; commit(); }, 200);

          /* KO check */
          if (g.hp1 <= 0 || g.hp2 <= 0) {
            g.fightState = "ko";
            g.winner     = g.hp1 <= 0 ? p2 : p1;
            g.shake      = true;
            burst(
              (canvasRef.current?.offsetWidth ?? 400) * 0.5,
              (canvasRef.current?.offsetHeight ?? 300) * 0.5,
              "#FFD700", 60, true
            );
            setTimeout(() => { gs.current.shake = false; gs.current.fightState = "done"; commit(); }, 600);
          }
          commit();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [burst, c1.main, c2.main, p1, p2, p1Bias, s1, s2, commit]);

  return (
    <div
      className={snap.shake ? "arena-shake" : ""}
      style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#050510" }}
    >
      <style jsx global>{`
        @keyframes arenaShake { 0%,100%{transform:translate(0)} 20%{transform:translate(-14px,-5px)} 40%{transform:translate(11px,7px)} 60%{transform:translate(-7px,-3px)} 80%{transform:translate(5px,2px)} }
        @keyframes hitAnim    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px) rotate(-1deg)} 50%{transform:translateX(6px)} 70%{transform:translateX(-4px)} }
        .arena-shake { animation: arenaShake 0.5s ease-out; }
        .hit-anim    { animation: hitAnim 0.28s ease-out; }
      `}</style>

      {/* Particle canvas — full screen, on top of fighters */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
        style={{ width: "100%", height: "100%" }}
      />

      {/* BG */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 80%,#100a20,#060612 45%,#050510)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        transform: "perspective(500px) rotateX(55deg)",
        transformOrigin: "bottom",
        opacity: 0.7,
      }} />

      {/* HP Bars */}
      <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-3">
        <div className="flex items-start gap-3 max-w-[1200px] mx-auto">
          <HPBar hp={snap.hp1} color={c1.main} glow={c1.glow} side="left"  name={p1.name.split(" ")[0]} combo={snap.combo1} />
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: "#FFD700", padding: "0 6px", marginTop: 6, flexShrink: 0 }}>VS</div>
          <HPBar hp={snap.hp2} color={c2.main} glow={c2.glow} side="right" name={p2.name.split(" ")[0]} combo={snap.combo2} />
        </div>
      </div>

      {/* Fighters */}
      <div className="absolute inset-0 flex items-end pb-6">
        <motion.div initial={{ x: "-80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.2 }}
          className="flex-1 flex items-end justify-center">
          <div className={snap.hitSide === "left" ? "hit-anim" : ""} style={{ width: "clamp(200px,28vw,380px)", height: "clamp(280px,52vh,560px)", position: "relative" }}>
            {videoSrc(p1, mode) ? (
              <div style={{ width: "100%", height: "100%", filter: snap.hitSide === "left" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 28px ${c1.glow})`, transition: "filter 0.1s" }}>
                <VideoPlayer src={videoSrc(p1, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
              </div>
            ) : portrait(p1, mode) ? (
              <Image src={portrait(p1, mode)} alt={p1.name} fill={false} width={380} height={480} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom", filter: snap.hitSide === "left" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 28px ${c1.glow})`, transition: "filter 0.1s" }} />
            ) : null}
          </div>
        </motion.div>

        <div style={{ width: 1, height: "55%", background: "linear-gradient(to bottom,transparent,rgba(255,255,255,0.05),transparent)", flexShrink: 0 }} />

        <motion.div initial={{ x: "80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.2 }}
          className="flex-1 flex items-end justify-center">
          <div className={snap.hitSide === "right" ? "hit-anim" : ""} style={{ width: "clamp(200px,28vw,380px)", height: "clamp(280px,52vh,560px)", position: "relative" }}>
            {videoSrc(p2, mode) ? (
              <div style={{ width: "100%", height: "100%", filter: snap.hitSide === "right" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 28px ${c2.glow})`, transition: "filter 0.1s", transform: "scaleX(-1)" }}>
                <VideoPlayer src={videoSrc(p2, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
              </div>
            ) : portrait(p2, mode) ? (
              <Image src={portrait(p2, mode)} alt={p2.name} fill={false} width={380} height={480} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom", filter: snap.hitSide === "right" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 28px ${c2.glow})`, transition: "filter 0.1s", transform: "scaleX(-1)" }} />
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Round text overlay */}
      <AnimatePresence>
        {snap.roundText && (
          <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 160, damping: 15 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(48px,12vw,140px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,0.7),0 6px 0 #7a5700", letterSpacing: 8 }}>{snap.roundText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner screen */}
      <AnimatePresence>
        {snap.winner && snap.fightState === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-center">
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(10px,1.5vw,14px)", color: "rgba(255,215,0,0.7)", letterSpacing: 8, marginBottom: 8 }}>WINNER</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(36px,7vw,90px)", fontWeight: 900, color: "#FFD700", letterSpacing: 6, textShadow: "0 0 40px rgba(255,215,0,0.8),0 6px 0 #7a5700" }}>{snap.winner.name.toUpperCase()}</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(28px,5vw,64px)", fontWeight: 900, color: "#FF4500", letterSpacing: 10, marginTop: 4, textShadow: "0 0 30px rgba(255,69,0,0.9)" }}>K.O.</div>
              <motion.button onClick={onExit} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="mt-8 cursor-pointer"
                style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 900, color: "#000", background: "#FFD700", padding: "12px 32px", borderRadius: 2, border: "none", letterSpacing: 4, boxShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
                RETOUR ▶
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Arena;
