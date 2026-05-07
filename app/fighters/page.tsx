"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Rank, RANK_FILTER_ORDER, type Member } from "../../data/members";
import { Dices, Swords, Flame, Shield, Wind } from "lucide-react";

import type { ViewMode } from "../types";
import { supabase } from "../../lib/supabase";
import VideoPlayer from "../components/VideoPlayer";

/* ─── Sound Manager ─── */
type HowlInstance = { play: () => void };
class SoundManager {
  private sounds: Record<string, HowlInstance> = {};
  private _muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const { Howl } = require("howler") as { Howl: new (opts: { src: string[]; volume?: number }) => HowlInstance };
      this.sounds = {
        hover: new Howl({ src: ["/sounds/hover.mp3"], volume: 0.15 }),
        select: new Howl({ src: ["/sounds/select.mp3"], volume: 0.3 }),
        confirm: new Howl({ src: ["/sounds/confirm.mp3"], volume: 0.4 }),
        fight: new Howl({ src: ["/sounds/fight.mp3"], volume: 0.5 }),
        hit: new Howl({ src: ["/sounds/hit.mp3"], volume: 0.35 }),
        critical: new Howl({ src: ["/sounds/critical.mp3"], volume: 0.5 }),
        ko: new Howl({ src: ["/sounds/ko.mp3"], volume: 0.6 }),
        whoosh: new Howl({ src: ["/sounds/whoosh.mp3"], volume: 0.25 }),
        round: new Howl({ src: ["/sounds/round.mp3"], volume: 0.4 }),
        victory: new Howl({ src: ["/sounds/victory.mp3"], volume: 0.5 }),
      };
    }
  }

  play(name: string) {
    if (!this._muted && this.sounds[name]) this.sounds[name].play();
  }

  get muted() { return this._muted; }
  set muted(v: boolean) { this._muted = v; }
}

const sfx = typeof window !== "undefined" ? new SoundManager() : null;

/* ─── Rank Colors ─── */
const RC: Record<string, { main: string; glow: string; gradient: string; dark: string }> = {
  "Fondateur":     { main: "#FFD700", glow: "rgba(255,215,0,.6)",   gradient: "linear-gradient(135deg,#FFD700,#FFA000)",  dark: "#1a1500" },
  "Monarque":      { main: "#FFD700", glow: "rgba(255,215,0,.6)",   gradient: "linear-gradient(135deg,#FFD700,#FF8C00)",  dark: "#1a1500" },
  "Ex Monarque":   { main: "#FF6B35", glow: "rgba(255,107,53,.6)",  gradient: "linear-gradient(135deg,#FF6B35,#D35400)",  dark: "#1a0e00" },
  "Ordre Céleste": { main: "#C084FC", glow: "rgba(192,132,252,.6)", gradient: "linear-gradient(135deg,#C084FC,#7C3AED)",  dark: "#0e0a1e" },
  "New G dorée":   { main: "#F472B6", glow: "rgba(244,114,182,.6)", gradient: "linear-gradient(135deg,#F472B6,#BE185D)",  dark: "#1a0a12" },
  "Vieux Briscard":{ main: "#34D399", glow: "rgba(52,211,153,.6)",  gradient: "linear-gradient(135deg,#34D399,#059669)",  dark: "#001a12" },
  "Futurs Espoirs":{ main: "#60A5FA", glow: "rgba(96,165,250,.6)",  gradient: "linear-gradient(135deg,#60A5FA,#1D4ED8)",  dark: "#051a35" },
  "Revenant":      { main: "#9CA3AF", glow: "rgba(156,163,175,.5)", gradient: "linear-gradient(135deg,#9CA3AF,#4B5563)",  dark: "#111827" },
  "Fantôme":       { main: "#6B7280", glow: "rgba(107,114,128,.4)", gradient: "linear-gradient(135deg,#6B7280,#374151)", dark: "#0d1117" },
};

function rc(rank: string) { return RC[rank] ?? RC["Fondateur"]; }
function pwr(m: Member) { const s = m.stats ?? { force: 80, vitesse: 80, technique: 80 }; return Math.round((s.force + s.vitesse + s.technique) / 3); }
function img(m: Member, mode: ViewMode) { return mode === "anime" ? m.animeChar : m.photo; }
function vid(m: Member, mode: ViewMode) { return mode === "anime" ? (m.animeVideo ?? "") : (m.photoVideo ?? ""); }
function hasVideo(m: Member, mode: ViewMode) { return !!vid(m, mode); }

type Phase = "select" | "intro" | "fight";

/* ─── Global Styles ─── */
function Styles() {
  return (
    <style jsx global>{`
      @keyframes scanlines       { 0%{transform:translateY(0)} 100%{transform:translateY(4px)} }
      @keyframes hpPulse         { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.5) saturate(2)} }
      @keyframes comboPop        { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      @keyframes vsSlam          { 0%{transform:scale(5) rotate(-15deg);opacity:0} 40%{transform:scale(.85) rotate(4deg);opacity:1} 60%{transform:scale(1.12) rotate(-2deg)} 80%{transform:scale(.97) rotate(1deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
      @keyframes screenShake     { 0%,100%{transform:translate(0,0) rotate(0)} 10%{transform:translate(-15px,-5px) rotate(-3deg)} 20%{transform:translate(12px,8px) rotate(2deg)} 30%{transform:translate(-8px,-3px) rotate(-1deg)} 40%{transform:translate(5px,2px) rotate(1deg)} 50%{transform:translate(-3px,-1px)} }
      @keyframes hitShake        { 0%,100%{transform:translateX(0)} 10%{transform:translateX(-8px) rotate(-1deg)} 30%{transform:translateX(6px) rotate(1deg)} 50%{transform:translateX(-4px)} 70%{transform:translateX(3px)} }
      @keyframes gridPulse       { 0%,100%{opacity:.03} 50%{opacity:.08} }
      @keyframes marquee         { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes glitchText      { 0%,90%,100%{transform:translate(0);filter:none} 92%{transform:translate(-2px,1px);filter:hue-rotate(90deg)} 94%{transform:translate(2px,-1px);filter:hue-rotate(-90deg)} 96%{transform:translate(-1px,-1px)} 98%{transform:translate(1px,1px);filter:hue-rotate(45deg)} }
      @keyframes chevronScroll   { 0%{background-position:0 0} 100%{background-position:80px 40px} }
      @keyframes lightSweep      { 0%{transform:translateX(-100%) skewX(-20deg)} 100%{transform:translateX(250%) skewX(-20deg)} }
      @keyframes tileScanline    { 0%{top:-100%} 100%{top:110%} }
      @keyframes neonFlicker     { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1;filter:drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor)} 20%,24%,55%{opacity:.55;filter:none} }
      @keyframes arcadeCoin      { 0%,100%{color:#FFD700;text-shadow:0 0 8px rgba(255,215,0,.7)} 50%{color:#fffbcc;text-shadow:0 0 14px #FFD700,0 0 30px rgba(255,215,0,.55)} }
      @keyframes fightBtnStripes { 0%{background-position:0 0} 100%{background-position:40px 0} }
      @keyframes kofCursorPulse  { 0%,100%{opacity:1;filter:drop-shadow(0 0 5px var(--cc))} 50%{opacity:.35;filter:none} }
      @keyframes kofSelectGlow   { 0%,100%{box-shadow:0 0 0 2px var(--cc),0 0 16px var(--cc),0 0 40px color-mix(in srgb,var(--cc) 50%,transparent)} 50%{box-shadow:0 0 0 2px var(--cc),0 0 28px var(--cc),0 0 60px color-mix(in srgb,var(--cc) 30%,transparent)} }
      @keyframes panelBreath     { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes kofPortraitFloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      @keyframes slashEnter      { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
      @keyframes bgDrift         { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }

      .hit-shake { animation: hitShake .3s ease-out; }
      .ko-shake  { animation: screenShake .5s ease-out; }
      .custom-scroll::-webkit-scrollbar       { width:3px; height:3px; }
      .custom-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,.02); }
      .custom-scroll::-webkit-scrollbar-thumb { background:rgba(220,38,38,.4); border-radius:2px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background:rgba(220,38,38,.65); }

      .r-pill { transition: all .2s ease; cursor: pointer; white-space: nowrap; }
      .r-pill:hover { transform: translateY(-1px); }

      /* ─── KOF Portrait grid ─── */
      .kof-roster {
        display: grid;
        gap: 3px;
        grid-template-columns: repeat(3, 1fr);
      }
      @media(min-width:480px)  { .kof-roster { grid-template-columns: repeat(4, 1fr); gap: 4px; } }
      @media(min-width:760px)  { .kof-roster { grid-template-columns: repeat(5, 1fr); gap: 5px; } }
      @media(min-width:1100px) { .kof-roster { grid-template-columns: repeat(6, 1fr); gap: 5px; } }

      /* ─── Tile base ─── */
      .kof-tile {
        position: relative;
        overflow: hidden;
        aspect-ratio: 3 / 4;
        background: #080814;
      }
      .kof-tile::before {
        content: "";
        position: absolute; inset: 0;
        background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.7) 100%);
        pointer-events: none;
        z-index: 2;
      }

      /* Hover scanline sweep */
      .kof-tile > .tile-scan {
        position: absolute;
        left: 0; right: 0;
        height: 35%;
        background: linear-gradient(180deg, transparent, rgba(255,255,255,.22), transparent);
        mix-blend-mode: screen;
        pointer-events: none;
        opacity: 0;
        transition: opacity .1s;
        z-index: 6;
      }
      .kof-tile:hover > .tile-scan { opacity: 1; animation: tileScanline 1s linear infinite; }

      /* Nameplate */
      .kof-tile-plate {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        padding: 18px 5px 4px;
        background: linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.55) 65%, transparent 100%);
        z-index: 3;
        pointer-events: none;
      }
      .kof-tile-name {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(10px, 1.3vw, 13px);
        color: #fff;
        letter-spacing: 1px;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        text-shadow: 0 1px 3px rgba(0,0,0,.9);
      }

      /* KOF-style animated selection cursor (4 corner brackets) */
      .kof-cursor-corner {
        position: absolute;
        width: 11px; height: 11px;
        border-style: solid;
        animation: kofCursorPulse .55s ease-in-out infinite;
        z-index: 10;
        pointer-events: none;
      }

      /* ─── Arcade main background ─── */
      .kof-screen-bg {
        position: absolute; inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 55% 60% at 10% 50%, rgba(180,20,20,.6) 0%, transparent 100%),
          radial-gradient(ellipse 55% 60% at 90% 50%, rgba(20,60,200,.55) 0%, transparent 100%),
          radial-gradient(ellipse 50% 35% at 50% 50%, rgba(60,20,100,.3) 0%, transparent 100%),
          linear-gradient(180deg, #0b0210 0%, #07060f 40%, #060914 100%);
      }
      .kof-screen-bg::before {
        content: "";
        position: absolute; inset: 0;
        background-image:
          repeating-linear-gradient(45deg,
            rgba(255,255,255,.025) 0 1px,
            transparent 1px 36px),
          repeating-linear-gradient(-45deg,
            rgba(255,255,255,.025) 0 1px,
            transparent 1px 36px);
        background-size: 72px 72px;
        animation: chevronScroll 30s linear infinite;
        mix-blend-mode: overlay;
      }
      .kof-screen-bg::after {
        content: "";
        position: absolute; inset: 0;
        background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,.14) 2px 3px);
        mix-blend-mode: multiply;
      }

      /* Central spotlight beam */
      .kof-spotlight {
        position: absolute; inset: 0;
        pointer-events: none;
        z-index: 1;
        background: radial-gradient(ellipse 40% 80% at 50% 50%, rgba(255,220,100,.04) 0%, transparent 70%);
      }

      /* ─── Side panel backgrounds ─── */
      .kof-panel-p1 {
        background:
          radial-gradient(ellipse 120% 90% at -20% 60%, rgba(220,30,30,.55) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 50% 100%, rgba(180,20,20,.3) 0%, transparent 60%),
          linear-gradient(160deg, rgba(100,10,15,.9) 0%, rgba(30,5,10,.95) 55%, rgba(5,5,20,.98) 100%);
        border: 1px solid rgba(220,38,38,.45);
        box-shadow: 0 0 50px rgba(220,38,38,.25), inset 0 0 80px rgba(0,0,0,.6);
      }
      .kof-panel-p2 {
        background:
          radial-gradient(ellipse 120% 90% at 120% 60%, rgba(30,70,220,.55) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 50% 100%, rgba(20,50,180,.3) 0%, transparent 60%),
          linear-gradient(200deg, rgba(10,20,100,.9) 0%, rgba(5,15,45,.95) 55%, rgba(5,5,20,.98) 100%);
        border: 1px solid rgba(29,78,216,.5);
        box-shadow: 0 0 50px rgba(29,78,216,.28), inset 0 0 80px rgba(0,0,0,.6);
      }

      /* Panel clip shapes */
      .kof-panel-p1-clip {
        clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
      }
      .kof-panel-p2-clip {
        clip-path: polygon(22px 0, 100% 0, 100% 100%, 0 100%);
      }

      /* Panel glow streak (top) */
      .kof-panel-streak {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        animation: panelBreath 3s ease-in-out infinite;
      }

      /* Portrait float animation */
      .kof-portrait-float {
        animation: kofPortraitFloat 4s ease-in-out infinite;
      }

      /* ─── Arcade title ─── */
      .arcade-title {
        font-family: 'Black Ops One','Orbitron',sans-serif;
        letter-spacing: 7px;
        color: #ffd700;
        text-shadow:
          0 0 6px #FFD700,
          0 0 18px rgba(255,140,0,.8),
          0 2px 0 #7a5700,
          0 4px 0 #3d2b00;
        animation: neonFlicker 5s infinite;
      }
      .arcade-coin {
        font-family: 'Orbitron', monospace;
        animation: arcadeCoin 1.4s ease-in-out infinite;
      }

      /* ─── FIGHT button ─── */
      .kof-fight-btn {
        position: relative;
        clip-path: polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
        overflow: hidden;
      }
      .kof-fight-btn::before {
        content: "";
        position: absolute; inset: 0;
        background: repeating-linear-gradient(45deg,
          rgba(255,255,255,.1) 0 8px, transparent 8px 20px);
        animation: fightBtnStripes 1s linear infinite;
        pointer-events: none;
      }
      .kof-fight-btn::after {
        content: "";
        position: absolute; top: 0; left: 0; width: 40%; height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.4) 50%, transparent 100%);
        filter: blur(6px);
        animation: lightSweep 2.2s cubic-bezier(.4,0,.2,1) infinite;
        pointer-events: none;
      }

      /* ─── Roster panel glass ─── */
      .kof-roster-panel {
        background: rgba(0,0,0,.6);
        border: 1px solid rgba(255,255,255,.09);
        backdrop-filter: blur(10px);
        box-shadow:
          inset 0 0 60px rgba(0,0,0,.55),
          0 20px 60px rgba(0,0,0,.5),
          inset 0 1px 0 rgba(255,255,255,.05);
      }

      /* ─── P-tag badges ─── */
      .kof-ptag {
        position: absolute;
        top: 10px;
        z-index: 15;
        padding: 3px 10px;
        font-family: 'Orbitron', monospace;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 3px;
        border-radius: 2px;
        backdrop-filter: blur(4px);
        background: rgba(0,0,0,.65);
      }

      /* ─── "CHOOSE YOUR FIGHTER" banner ─── */
      .kof-choose-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 14px;
        background: linear-gradient(90deg,
          rgba(180,20,20,.35) 0%,
          rgba(0,0,0,.55) 40%,
          rgba(0,0,0,.55) 60%,
          rgba(20,60,180,.35) 100%);
        border-top: 2px solid rgba(255,215,0,.4);
        border-bottom: 1px solid rgba(255,255,255,.07);
        position: relative;
        overflow: hidden;
      }
      .kof-choose-banner::before {
        content: "";
        position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,215,0,.7), transparent);
        animation: lightSweep 3s linear infinite;
      }
    `}</style>
  );
}

/* ─── KOF Cursor (4 corner brackets) ─── */
function KofCursor({ color }: { color: string }) {
  const s = (pos: React.CSSProperties): React.CSSProperties => ({
    ...pos,
    borderColor: color,
    // CSS custom property for animation
    ['--cc' as string]: color,
  });
  const base: React.CSSProperties = {
    position: "absolute", width: 12, height: 12,
    borderStyle: "solid", zIndex: 10, pointerEvents: "none",
    filter: `drop-shadow(0 0 5px ${color})`,
    animation: "kofCursorPulse .55s ease-in-out infinite",
  };
  return (
    <>
      <div style={{ ...base, ...s({ top: 3, left: 3, borderWidth: "2px 0 0 2px" }) }} />
      <div style={{ ...base, ...s({ top: 3, right: 3, borderWidth: "2px 2px 0 0" }) }} />
      <div style={{ ...base, ...s({ bottom: 3, left: 3, borderWidth: "0 0 2px 2px" }) }} />
      <div style={{ ...base, ...s({ bottom: 3, right: 3, borderWidth: "0 2px 2px 0" }) }} />
    </>
  );
}

/* ─── Sparks Canvas ─── */
function Sparks({ active, color = "#FFD700", intensity = 1 }: { active: boolean; color?: string; intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; max: number; sz: number; c: string }>>([]);
  const af = useRef(0);

  useEffect(() => {
    if (!active || !ref.current) return;
    const c = ref.current, ctx = c.getContext("2d")!;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2);
    const cols = [color, "#FF4500", "#FF6347", "#FFA500", "#fff"];

    const animate = () => {
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
      for (let i = 0; i < Math.floor(3 * intensity); i++) {
        pts.current.push({ x: Math.random() * c.offsetWidth, y: c.offsetHeight + 5, vx: (Math.random() - .5) * 4, vy: -(Math.random() * 6 + 2), life: 0, max: 30 + Math.random() * 40, sz: Math.random() * 3 + .5, c: cols[Math.floor(Math.random() * cols.length)] });
      }
      pts.current = pts.current.filter(p => {
        p.life++; p.x += p.vx; p.y += p.vy; p.vy += .06; p.vx *= .99;
        const a = 1 - p.life / p.max; if (a <= 0) return false;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a, 0, Math.PI * 2);
        ctx.fillStyle = p.c; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1;
        return true;
      });
      af.current = requestAnimationFrame(animate);
    };
    af.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(af.current);
  }, [active, color, intensity]);

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none z-20" style={{ width: "100%", height: "100%" }} />;
}

/* ─── Glitch Text ─── */
function GlitchText({ text, style: sx = {} }: { text: string; style?: React.CSSProperties }) {
  return (
    <span className="relative inline-block" style={sx}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 z-0 opacity-60" style={{ color: "#ff0040", animation: "glitchText 4s infinite", clipPath: "polygon(0 0,100% 0,100% 45%,0 45%)" }} aria-hidden="true">{text}</span>
      <span className="absolute top-0 left-0 z-0 opacity-60" style={{ color: "#00ffff", animation: "glitchText 4s .15s infinite reverse", clipPath: "polygon(0 55%,100% 55%,100% 100%,0 100%)" }} aria-hidden="true">{text}</span>
    </span>
  );
}

/* ─── Stat Bar ─── */
function StatBar({ label, value, max = 100, color, icon, delay = 0 }: { label: string; value: number; max?: number; color: string; icon: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0 w-4 h-4" style={{ color }}>{icon}</div>
      <span className="shrink-0 w-7 text-right" style={{ fontFamily: "'Orbitron',monospace", fontSize: "9px", color: "rgba(255,255,255,.4)", letterSpacing: "1px" }}>{label}</span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: show ? `${(value / max) * 100}%` : 0 }} transition={{ duration: .8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="shrink-0 w-6 text-right text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   FIGHT INTRO
   ════════════════════════════════════════════════════ */
function FightIntro({ p1, p2, mode, onFinish }: { p1: Member; p2: Member; mode: ViewMode; onFinish: () => void }) {
  const [step, setStep] = useState<"slash" | "p1" | "vs" | "p2" | "fight">("slash");
  const c1 = rc(p1.rank), c2 = rc(p2.rank);

  useEffect(() => {
    sfx?.play("whoosh");
    const t = [
      setTimeout(() => { setStep("p1"); sfx?.play("whoosh"); }, 500),
      setTimeout(() => { setStep("vs"); sfx?.play("confirm"); }, 1800),
      setTimeout(() => { setStep("p2"); sfx?.play("whoosh"); }, 2800),
      setTimeout(() => { setStep("fight"); sfx?.play("fight"); }, 4200),
      setTimeout(() => onFinish(), 5400),
    ];
    return () => t.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black overflow-hidden">
      {step !== "slash" && (
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .3 }} className="absolute inset-0 origin-center" style={{ background: "linear-gradient(135deg,#07070f 0%,#0f0718 50%,#07070f 100%)" }} />
      )}
      {["p1", "vs", "p2", "fight"].includes(step) && (
        <AnimatePresence>
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 60, damping: 12 }}
            className="absolute top-0 bottom-0 left-0 z-10 w-[50%]" style={{ clipPath: "polygon(0 0,100% 0,80% 100%,0 100%)" }}>
            <div className="relative w-full h-full" style={{ background: `linear-gradient(135deg,${c1.dark},#030308)` }}>
              {(vid(p1, mode) || img(p1, mode)) && (
                <div className="absolute inset-0 flex items-end justify-center">
                  {vid(p1, mode) ? (
                    <div style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c1.glow})` }}>
                      <VideoPlayer src={vid(p1, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                    </div>
                  ) : (
                    <Image src={img(p1, mode)} alt={p1.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c1.glow})` }} />
                  )}
                </div>
              )}
              <div className="absolute bottom-10 left-8 z-20">
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", color: c1.main, letterSpacing: "3px" }}>PLAYER 1</span>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px,6vw,80px)", color: "#fff", letterSpacing: "5px", lineHeight: .9, textShadow: `0 0 20px ${c1.glow}` }}>{p1.name.toUpperCase()}</h2>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "2px" }}>{p1.rank}</span>
              </div>
              <Sparks active color={c1.main} intensity={.4} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {["p2", "fight"].includes(step) && (
        <AnimatePresence>
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 60, damping: 12 }}
            className="absolute top-0 bottom-0 right-0 z-10 w-[50%]" style={{ clipPath: "polygon(20% 0,100% 0,100% 100%,0 100%)" }}>
            <div className="relative w-full h-full" style={{ background: `linear-gradient(225deg,${c2.dark},#030308)` }}>
              {(vid(p2, mode) || img(p2, mode)) && (
                <div className="absolute inset-0 flex items-end justify-center">
                  {vid(p2, mode) ? (
                    <div style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c2.glow})`, transform: "scaleX(-1)" }}>
                      <VideoPlayer src={vid(p2, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                    </div>
                  ) : (
                    <Image src={img(p2, mode)} alt={p2.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c2.glow})`, transform: "scaleX(-1)" }} />
                  )}
                </div>
              )}
              <div className="absolute bottom-10 right-8 z-20 text-right">
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", color: c2.main, letterSpacing: "3px" }}>PLAYER 2</span>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px,6vw,80px)", color: "#fff", letterSpacing: "5px", lineHeight: .9, textShadow: `0 0 20px ${c2.glow}` }}>{p2.name.toUpperCase()}</h2>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "2px" }}>{p2.rank}</span>
              </div>
              <Sparks active color={c2.main} intensity={.4} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {step === "vs" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,transparent 49.4%,#FFD700 49.4%,#FFD700 50.6%,transparent 50.6%)" }} />
          <div style={{ animation: "vsSlam .8s cubic-bezier(.34,1.56,.64,1)" }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(90px,22vw,260px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,.8),0 0 80px rgba(255,69,0,.5),0 8px 0 #7a5700", letterSpacing: "12px" }}>VS</span>
          </div>
        </div>
      )}
      {step === "fight" && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }} transition={{ duration: 0.55, times: [0, 0.25, 1], ease: "easeOut" }} className="absolute inset-0" style={{ background: "rgba(255,255,255,1)" }} />
          <motion.div initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: .15 }}>
            <GlitchText text="FIGHT!" style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(60px,16vw,200px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,.8),0 0 80px rgba(255,69,0,.5),0 8px 0 #7a5700", letterSpacing: "14px" }} />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── HP Bar ─── */
function HPBar({ hp, color, glow, side, name, rank, combo }: { hp: number; color: string; glow: string; side: "left" | "right"; name: string; rank: string; combo: number }) {
  const danger = hp <= 25;
  const bc = danger ? "#FF1A1A" : color;
  return (
    <div className={`flex-1 ${side === "right" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-2 mb-1 ${side === "right" ? "justify-end" : ""}`}>
        <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "8px", fontWeight: 700, color, letterSpacing: "1px" }}>{side === "left" ? "P1" : "P2"}</span>
        </div>
        <div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(16px,2.5vw,22px)", color: "#fff", letterSpacing: "3px" }}>{name.toUpperCase()}</span>
          <span className="ml-2" style={{ fontFamily: "'Orbitron',monospace", fontSize: "8px", color: `${color}70`, letterSpacing: "2px" }}>{rank.toUpperCase()}</span>
        </div>
      </div>
      <div className="relative h-5 rounded-sm overflow-hidden" style={{ background: "rgba(0,0,0,.7)", border: `1px solid ${bc}20` }}>
        <motion.div animate={{ width: `${hp}%` }} transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="absolute top-0 bottom-0 rounded-sm"
          style={{ [side === "right" ? "right" : "left"]: 0, background: danger ? `linear-gradient(${side === "right" ? 270 : 90}deg,#FF1A1A,#FF5500)` : `linear-gradient(${side === "right" ? 270 : 90}deg,${color}cc,${color})`, boxShadow: `0 0 10px ${glow}`, animation: danger ? "hpPulse .8s infinite" : undefined }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(255,255,255,.25) 0%,transparent 55%)" }} />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", fontWeight: 900, color: "#fff", textShadow: "0 1px 4px #000" }}>{hp}</span>
        </div>
      </div>
      <AnimatePresence>
        {combo > 1 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className={`mt-1 ${side === "right" ? "text-right" : "text-left"}`}>
            <span className="inline-block px-2 py-0.5 text-white font-bold rounded" style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", background: "linear-gradient(135deg,#FF4500,#DC2626)", boxShadow: "0 0 12px rgba(255,69,0,.5)", animation: "comboPop .4s infinite" }}>{combo} HIT</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ARENA
   ════════════════════════════════════════════════════ */
function Arena({ p1, p2, mode, onExit }: { p1: Member; p2: Member; mode: ViewMode; onExit: () => void }) {
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [hitFlash, setHitFlash] = useState<"left" | "right" | null>(null);
  const [combo1, setCombo1] = useState(0);
  const [combo2, setCombo2] = useState(0);
  const [roundText, setRoundText] = useState<string | null>("ROUND 1");
  const [winner, setWinner] = useState<Member | null>(null);
  const [shake, setShake] = useState(false);
  const winnerRef = useRef<Member | null>(null);
  const c1 = rc(p1.rank), c2 = rc(p2.rank);

  useEffect(() => {
    sfx?.play("round");
    const t0 = setTimeout(() => { setRoundText("FIGHT!"); sfx?.play("fight"); }, 1200);
    const t1 = setTimeout(() => setRoundText(null), 2400);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, []);

  useEffect(() => {
    if (roundText || hp1 <= 0 || hp2 <= 0 || winner) return;
    const s1 = p1.stats ?? { force: 80, vitesse: 80, technique: 80 };
    const s2 = p2.stats ?? { force: 80, vitesse: 80, technique: 80 };
    const t1 = s1.force + s1.vitesse + s1.technique;
    const t2 = s2.force + s2.vitesse + s2.technique;
    const b = t1 / (t1 + t2);

    const iv = setInterval(() => {
      if (winnerRef.current) return;
      const r = Math.random();
      if (r < b * .7) {
        const crit = Math.random() < s1.technique / 400;
        const dmg = crit ? Math.round((s1.force / 100) * (Math.random() * 6 + 3) * 2.5 + 8) : Math.round((s1.force / 100) * (Math.random() * 6 + 3));
        setHp2(p => Math.max(0, p - dmg));
        setHitFlash("right"); setCombo2(c => c + 1); setCombo1(0);
        if (crit) { setShake(true); sfx?.play("critical"); setTimeout(() => setShake(false), 350); } else sfx?.play("hit");
        setTimeout(() => setHitFlash(null), 200);
      } else if (r < (b + (1 - b)) * .7) {
        const crit = Math.random() < s2.technique / 400;
        const dmg = crit ? Math.round((s2.force / 100) * (Math.random() * 6 + 3) * 2.5 + 8) : Math.round((s2.force / 100) * (Math.random() * 6 + 3));
        setHp1(p => Math.max(0, p - dmg));
        setHitFlash("left"); setCombo1(c => c + 1); setCombo2(0);
        if (crit) { setShake(true); sfx?.play("critical"); setTimeout(() => setShake(false), 350); } else sfx?.play("hit");
        setTimeout(() => setHitFlash(null), 200);
      } else { setCombo1(0); setCombo2(0); }
    }, 700);
    return () => clearInterval(iv);
  }, [roundText]);

  useEffect(() => {
    if (hp1 <= 0 && !winnerRef.current) { winnerRef.current = p2; setWinner(p2); setShake(true); sfx?.play("ko"); setTimeout(() => setShake(false), 500); }
    if (hp2 <= 0 && !winnerRef.current) { winnerRef.current = p1; setWinner(p1); setShake(true); sfx?.play("ko"); setTimeout(() => setShake(false), 500); }
  }, [hp1, hp2]);

  return (
    <div className={`relative w-full h-screen overflow-hidden ${shake ? "ko-shake" : ""}`} style={{ background: "#050510" }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 70%,#100a20,#060612 45%,#050510)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "40px 40px", perspective: "500px", transform: "rotateX(55deg)", transformOrigin: "bottom", animation: "gridPulse 4s infinite" }} />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px" style={{ background: `linear-gradient(90deg,transparent,${c1.glow}40,${c2.glow}40,transparent)` }} />
      </div>
      <div className="absolute top-0 left-0 right-0 z-40 px-4 sm:px-6 pt-4">
        <div className="flex items-start gap-3 max-w-[1400px] mx-auto">
          <HPBar hp={hp1} color={c1.main} glow={c1.glow} side="left" name={p1.name.split(" ")[0]} rank={p1.rank} combo={combo1} />
          <div className="flex flex-col items-center pt-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)", border: "2px solid rgba(255,215,0,.25)" }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "18px", fontWeight: 900, color: "#FFD700" }}>VS</span>
            </div>
          </div>
          <HPBar hp={hp2} color={c2.main} glow={c2.glow} side="right" name={p2.name.split(" ")[0]} rank={p2.rank} combo={combo2} />
        </div>
      </div>
      <div className="absolute inset-0 flex h-full items-end pb-8">
        <motion.div initial={{ x: "-80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: .2 }} className="flex-1 relative flex items-end justify-center">
          <div className={`relative ${hitFlash === "left" ? "hit-shake" : ""}`} style={{ width: "clamp(220px,30vw,420px)", height: "clamp(300px,55vh,600px)" }}>
            {vid(p1, mode) ? (
              <div style={{ width: "100%", height: "100%", filter: hitFlash === "left" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c1.glow})`, transition: "filter .1s" }}>
                <VideoPlayer src={vid(p1, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
              </div>
            ) : img(p1, mode) ? (
              <Image src={img(p1, mode)} alt={p1.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ filter: hitFlash === "left" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c1.glow})`, transition: "filter .1s" }} />
            ) : null}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full" style={{ background: `radial-gradient(ellipse,${c1.glow}25,transparent 70%)`, filter: "blur(8px)" }} />
          </div>
        </motion.div>
        <div className="w-px h-[60%] self-center shrink-0" style={{ background: "linear-gradient(to bottom,transparent,rgba(255,255,255,.06),transparent)" }} />
        <motion.div initial={{ x: "80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: .2 }} className="flex-1 relative flex items-end justify-center">
          <div className={`relative ${hitFlash === "right" ? "hit-shake" : ""}`} style={{ width: "clamp(220px,30vw,420px)", height: "clamp(300px,55vh,600px)" }}>
            {vid(p2, mode) ? (
              <div style={{ width: "100%", height: "100%", filter: hitFlash === "right" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c2.glow})`, transition: "filter .1s", transform: "scaleX(-1)" }}>
                <VideoPlayer src={vid(p2, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
              </div>
            ) : img(p2, mode) ? (
              <Image src={img(p2, mode)} alt={p2.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ filter: hitFlash === "right" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c2.glow})`, transition: "filter .1s", transform: "scaleX(-1)" }} />
            ) : null}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full" style={{ background: `radial-gradient(ellipse,${c2.glow}25,transparent 70%)`, filter: "blur(8px)" }} />
          </div>
        </motion.div>
      </div>
      <Sparks active={!winner && !roundText} color="#FF4500" intensity={.25} />
      <AnimatePresence>
        {roundText && (
          <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .3, opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 150, damping: 15 }} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(48px,14vw,140px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,.6),0 0 80px rgba(255,69,0,.3),0 8px 0 #7a5700", letterSpacing: "10px" }}>{roundText}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }} className="absolute inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: .2 }} className="relative z-10 text-center">
              <GlitchText text="K.O." style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(80px,20vw,200px)", fontWeight: 900, color: "#FF1A1A", textShadow: "0 0 60px rgba(255,26,26,.8),0 0 120px rgba(255,0,0,.3),0 8px 0 #5c0000", letterSpacing: "14px" }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8 }}>
                <div className="mt-4" style={{ color: rc(winner.rank).main, fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px,5vw,56px)", textShadow: `0 0 24px ${rc(winner.rank).glow}`, letterSpacing: "6px" }}>{winner.name.toUpperCase()}</div>
              </motion.div>
              <button onClick={onExit} className="mt-6 px-8 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10" style={{ background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.3)" }}>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "11px", color: "#FFD700", letterSpacing: "4px" }}>NOUVEAU COMBAT</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={onExit} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-pointer text-white/30 hover:text-white/60 transition-colors text-xs" style={{ fontFamily: "'Orbitron',monospace", fontSize: "9px", letterSpacing: "2px", background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.08)" }}>
        RETOUR
      </button>
      <div className="absolute inset-0 pointer-events-none z-30" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.01) 2px,rgba(255,255,255,.01) 4px)", animation: "scanlines 8s linear infinite", willChange: "transform" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.4) 100%)" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   FIGHTER TILE — KOF portrait style
   ════════════════════════════════════════════════════ */
function FighterCard({ member, mode, selected, hovered, idx, onSelect, onHover }: {
  member: Member; mode: ViewMode; selected: boolean; hovered: boolean;
  idx: number; onSelect: (m: Member) => void; onHover: (m: Member | null) => void;
}) {
  const c = rc(member.rank);
  const active = selected || hovered;
  const portrait = img(member, mode);
  const videoSrc = vid(member, mode);

  return (
    <motion.button
      initial={{ opacity: 0, scale: .75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: .22, delay: Math.min(idx * .01, .28), ease: "easeOut" }}
      onClick={() => onSelect(member)}
      onMouseEnter={() => { onHover(member); sfx?.play("hover"); }}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member)}
      onBlur={() => onHover(null)}
      className="kof-tile cursor-pointer block"
      style={{
        border: selected
          ? `2px solid ${c.main}`
          : hovered
            ? `1px solid rgba(255,255,255,.55)`
            : `1px solid rgba(255,255,255,.1)`,
        boxShadow: selected
          ? `0 0 0 1px rgba(0,0,0,.8), 0 0 18px ${c.glow}, 0 0 44px ${c.glow}55`
          : hovered
            ? `0 0 14px rgba(255,255,255,.2)`
            : "none",
        transform: hovered && !selected ? "scale(1.06)" : "scale(1)",
        transition: "border .1s, box-shadow .15s, transform .12s",
        zIndex: hovered || selected ? 3 : 1,
      }}
    >
      {/* Left rank accent stripe */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 0, width: 3,
        background: c.gradient, zIndex: 5, pointerEvents: "none",
        opacity: active ? 1 : .6, transition: "opacity .15s",
      }} />

      {/* Portrait — video takes priority over image */}
      {videoSrc ? (
        <div style={{ width: "100%", height: "calc(100% - 28px)", filter: active ? "saturate(1.1) brightness(1.05)" : "saturate(.75) brightness(.78)", transition: "filter .18s" }}>
          <VideoPlayer src={videoSrc} fit="cover" objectPosition="smart" fullscreenBtn={active} />
        </div>
      ) : portrait ? (
        <Image
          src={portrait}
          alt={member.name}
          width={160}
          height={210}
          style={{
            width: "100%",
            height: "calc(100% - 28px)",
            objectFit: "cover",
            objectPosition: "center 12%",
            filter: active
              ? "saturate(1.1) brightness(1.05)"
              : "saturate(.75) brightness(.78)",
            transition: "filter .18s",
            display: "block",
          }}
        />
      ) : (
        <div style={{
          width: "100%",
          height: "calc(100% - 28px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(ellipse at center, ${c.dark} 0%, #050510 100%)`,
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "clamp(20px,4vw,36px)",
            fontWeight: 900,
            color: `${c.main}50`,
            textShadow: `0 0 20px ${c.glow}`,
          }}>?</span>
        </div>
      )}

      {/* Scanline sweep on hover */}
      <span className="tile-scan" aria-hidden="true" />

      {/* Nameplate */}
      <div className="kof-tile-plate">
        <div className="kof-tile-name">{member.name.toUpperCase()}</div>
        <div style={{
          height: 2, marginTop: 2,
          background: c.gradient, borderRadius: 1,
          opacity: active ? 1 : .5, transition: "opacity .15s",
        }} />
      </div>

      {/* KOF selection cursor (4 corner brackets) */}
      {selected && <KofCursor color={c.main} />}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════
   DETAIL PANEL
   ════════════════════════════════════════════════════ */
function DetailPanel({ member, mode }: { member: Member; mode: ViewMode }) {
  const c = rc(member.rank);
  const s = member.stats ?? { force: 80, vitesse: 80, technique: 80 };
  const power = pwr(member);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .2 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(8,8,20,.9)", border: `1px solid ${c.main}20`, backdropFilter: "blur(16px)" }}
    >
      <div className="h-[3px]" style={{ background: c.gradient }} />
      <div className="flex flex-col sm:flex-row gap-5 p-5">
        {/* Portrait — full height on mobile, fixed width on desktop */}
        <div className="relative w-full h-56 sm:w-40 sm:h-52 rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${c.main}20` }}>
          {vid(member, mode) ? (
            <VideoPlayer src={vid(member, mode)!} fit="cover" objectPosition="smart" fullscreenBtn />
          ) : img(member, mode) ? (
            <Image src={img(member, mode)} alt={member.name} fill={false} width={200} height={260}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", filter: `drop-shadow(0 0 16px ${c.glow})` }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse, ${c.dark}, #050510)` }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 40, fontWeight: 900, color: `${c.main}40` }}>?</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top,rgba(5,5,20,.9) 0%,transparent 55%)` }} />
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,.75)", border: `1px solid ${c.main}40`, fontFamily: "'Orbitron',monospace", fontSize: 9, color: c.main, letterSpacing: "1.5px", fontWeight: 700 }}>
              PWR {power}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(26px,3.5vw,36px)", color: "#fff", letterSpacing: "4px", lineHeight: 1, textShadow: `0 0 18px ${c.glow}30` }}>
            {member.name.toUpperCase()}
          </h3>
          {member.rank && (
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-sm" style={{ background: c.gradient, color: "#000", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: "1.5px", fontWeight: 800 }}>
              {member.rank.toUpperCase()}
            </span>
          )}
          {member.special && (
            <div className="mt-2 flex items-center gap-1.5" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: c.main, letterSpacing: "0.5px" }}>
              <Flame size={12} />
              <span>{member.special.name}</span>
            </div>
          )}
          <div className="space-y-2 mt-4">
            <StatBar label="FOR" value={s.force} color="#EF4444" icon={<Flame size={12} />} delay={0} />
            <StatBar label="VIT" value={s.vitesse} color="#38BDF8" icon={<Wind size={12} />} delay={80} />
            <StatBar label="TEC" value={s.technique} color="#A78BFA" icon={<Shield size={12} />} delay={160} />
          </div>
          {member.special?.effect && (
            <div className="mt-3 px-3 py-2 rounded" style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${c.main}12`, color: "rgba(255,255,255,.5)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, lineHeight: 1.5 }}>
              {member.special.effect}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════
   LOADING
   ════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
      <div className="text-center">
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(24px,4vw,48px)", fontWeight: 900, color: "#DC2626", letterSpacing: "10px", textShadow: "0 0 20px rgba(220,38,38,.4)" }}>
          LOADING
        </span>
        <div className="mt-4 mx-auto h-[2px] rounded-full overflow-hidden" style={{ width: 160, background: "rgba(255,255,255,.04)" }}>
          <motion.div className="h-full rounded-full" style={{ width: "40%", background: "linear-gradient(90deg,#DC2626,#FFD700)" }}
            animate={{ x: [-80, 240] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   KOF SIDE PORTRAIT
   ════════════════════════════════════════════════════ */
function SidePortrait({ member, mode, side }: { member: Member | null; mode: ViewMode; side: "left" | "right" }) {
  const c = member ? rc(member.rank) : null;
  const tag = side === "left" ? "P1" : "P2";
  const tagColor = side === "left" ? "#FF3B30" : "#1DA1F2";

  return (
    <div className="relative w-full h-full flex flex-col justify-end overflow-hidden">
      {/* Atmospheric inner glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: side === "left"
          ? `radial-gradient(ellipse 80% 60% at 20% 80%, ${c?.glow ?? "rgba(220,38,38,.3)"} 0%, transparent 65%)`
          : `radial-gradient(ellipse 80% 60% at 80% 80%, ${c?.glow ?? "rgba(29,78,216,.3)"} 0%, transparent 65%)`,
        transition: "background .5s",
        zIndex: 0,
      }} />

      <AnimatePresence mode="wait">
        {member && c ? (
          <motion.div
            key={member.id}
            className="absolute inset-0 flex items-end justify-center kof-portrait-float"
            initial={{ opacity: 0, x: side === "left" ? -50 : 50, scale: .93 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: side === "left" ? -30 : 30, scale: .97 }}
            transition={{ duration: .38, ease: [0.22, 1, 0.36, 1] }}
            style={{ zIndex: 1 }}
          >
            {vid(member, mode) ? (
              <div style={{
                width: "100%", height: "100%", maxHeight: "100%",
                filter: `drop-shadow(0 0 50px ${c.glow}) drop-shadow(0 12px 30px rgba(0,0,0,.8))`,
                transform: side === "right" ? "scaleX(-1)" : undefined,
              }}>
                <VideoPlayer src={vid(member, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn />
              </div>
            ) : img(member, mode) ? (
              <Image
                src={img(member, mode)}
                alt={member.name}
                width={500}
                height={700}
                className="object-contain object-bottom"
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "100%",
                  filter: `drop-shadow(0 0 50px ${c.glow}) drop-shadow(0 12px 30px rgba(0,0,0,.8))`,
                  transform: side === "right" ? "scaleX(-1)" : undefined,
                }}
              />
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ zIndex: 1 }}
          >
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(60px,14vw,140px)",
              fontWeight: 900,
              color: tagColor === "#FF3B30" ? "rgba(220,38,38,.12)" : "rgba(29,78,216,.12)",
              letterSpacing: "4px",
            }}>?</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P-tag badge */}
      <div
        className="kof-ptag"
        style={{
          [side === "left" ? "left" : "right"]: 10,
          color: tagColor,
          border: `1px solid ${tagColor}55`,
          boxShadow: `0 0 18px ${tagColor}44, inset 0 0 8px ${tagColor}22`,
        }}
      >
        {tag}
      </div>

      {/* Name block at bottom */}
      {member && c && (
        <motion.div
          key={`name-${member.id}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .35, delay: .12 }}
          className={`absolute bottom-3 z-10 pointer-events-none ${side === "right" ? "right-3 text-right" : "left-3"}`}
          style={{ maxWidth: "90%" }}
        >
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 9,
            color: c.main,
            letterSpacing: "3px",
            textShadow: `0 0 10px ${c.glow}`,
            marginBottom: 2,
          }}>
            {member.rank.toUpperCase()}
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(20px,3vw,40px)",
            color: "#fff",
            letterSpacing: "3px",
            lineHeight: .95,
            textShadow: `0 2px 10px rgba(0,0,0,.9), 0 0 22px ${c.glow}`,
          }}>
            {member.name.toUpperCase()}
          </div>
          {/* Power bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>PWR</span>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pwr(member)}%`, background: c.gradient, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: c.main, fontWeight: 700 }}>{pwr(member)}</span>
          </div>
        </motion.div>
      )}

      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8,
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.06) 3px,rgba(0,0,0,.06) 4px)",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   CHARACTER SELECT — KOF STYLE
   ════════════════════════════════════════════════════ */
function CharacterSelect({ members, mode, setMode, selected, onSelect, onFight }: {
  members: Member[]; mode: ViewMode; setMode: (m: ViewMode) => void;
  selected: Member | null; onSelect: (m: Member) => void; onFight?: (m: Member) => void;
}) {
  const [filter, setFilter] = useState<Rank | "Tous">("Tous");
  const [hovered, setHovered] = useState<Member | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const filtered = filter === "Tous" ? members : members.filter(m => m.rank === filter);

  const leftFighter  = selected;
  const rightFighter = hovered && hovered.id !== selected?.id ? hovered : null;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#07060f" }}>
      {/* Main atmospheric background */}
      <div className="kof-screen-bg" />
      <div className="kof-spotlight" />

      {/* Floating light particles */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              left: `${(i * 6.25) % 100}%`,
              background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#DC2626" : "#1D4ED8",
              opacity: .15 + (i % 4) * .06,
              filter: "blur(.5px)",
            }}
            animate={{ y: ["110vh", "-10vh"] }}
            transition={{
              duration: 20 + (i % 5) * 5,
              repeat: Infinity,
              ease: "linear",
              delay: -(i * 1.3),
            }}
          />
        ))}
      </div>

      {/* ─── TOP BAR (arcade cab header) ─── */}
      <div
        className="relative z-40"
        style={{
          borderBottom: "2px solid rgba(255,215,0,.3)",
          background: "linear-gradient(180deg, rgba(0,0,0,.9) 0%, rgba(10,5,22,.75) 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 35px rgba(0,0,0,.6), inset 0 -1px 0 rgba(255,255,255,.04)",
        }}
      >
        {/* Tricolor ribbon */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 3,
          background: "repeating-linear-gradient(90deg, #FFD700 0 14px, #DC2626 14px 28px, #1D4ED8 28px 42px)",
          opacity: .8,
        }} />

        <div className="max-w-[1700px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Swords size={20} style={{ color: "#FFD700", flexShrink: 0, filter: "drop-shadow(0 0 8px rgba(255,215,0,.75))" }} />
            <div className="flex flex-col leading-none min-w-0">
              <span className="arcade-title" style={{ fontSize: "clamp(14px, 2.2vw, 24px)", whiteSpace: "nowrap" }}>
                GUILDE · FIGHTERS
              </span>
              <span className="arcade-coin mt-0.5" style={{ fontSize: 9, letterSpacing: 3, whiteSpace: "nowrap" }}>
                ★ INSERT COIN · CREDIT 01 ★
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { const next = !isMuted; setIsMuted(next); if (sfx) sfx.muted = next; }}
              className="p-1.5 rounded cursor-pointer text-white/50 hover:text-white/90 transition-colors"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
              aria-label="Toggle sound"
            >
              {isMuted ? "♪ OFF" : "♪ ON"}
            </button>
            {(["real", "anime"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); sfx?.play("select"); }}
                className="px-3 py-1 cursor-pointer text-[9px] font-bold transition-all duration-200"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: "2px",
                  clipPath: "polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)",
                  background: mode === m
                    ? "linear-gradient(135deg, rgba(255,215,0,.28), rgba(255,120,0,.18))"
                    : "rgba(0,0,0,.5)",
                  color: mode === m ? "#FFD700" : "rgba(255,255,255,.4)",
                  border: "none",
                  boxShadow: mode === m
                    ? "inset 0 0 0 1px rgba(255,215,0,.5), 0 0 14px rgba(255,215,0,.28)"
                    : "inset 0 0 0 1px rgba(255,255,255,.09)",
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Rank filters */}
        <div className="max-w-[1700px] mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto custom-scroll">
          {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map(r => {
            const active = filter === r;
            const col = r === "Tous" ? "#FFD700" : rc(r).main;
            return (
              <button
                key={r}
                onClick={() => { setFilter(r as Rank | "Tous"); sfx?.play("hover"); }}
                className="r-pill px-3 py-1.5 rounded flex-shrink-0"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  background: active ? `${col}22` : "rgba(255,255,255,.04)",
                  color: active ? col : "rgba(255,255,255,.55)",
                  border: `1px solid ${active ? col + "60" : "rgba(255,255,255,.09)"}`,
                  boxShadow: active ? `0 0 14px ${col}38, inset 0 0 0 1px ${col}30` : "none",
                  textTransform: "uppercase",
                }}
              >
                {r === "Tous" ? "TOUS" : r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="relative z-10 max-w-[1700px] mx-auto px-3 sm:px-5 py-4">

        {/* Layout CSS via local style */}
        <style jsx>{`
          .kof-layout {
            display: grid;
            gap: 12px;
            grid-template-columns: 1fr;
            grid-template-areas:
              "previews"
              "center";
          }
          @media (min-width: 900px) {
            .kof-layout {
              grid-template-columns: minmax(0, 18%) minmax(0, 1fr) minmax(0, 18%);
              grid-template-areas: "left center right";
              gap: 14px;
            }
          }
          .kof-area-left     { grid-area: left;  display: none; }
          .kof-area-center   { grid-area: center; }
          .kof-area-right    { grid-area: right; display: none; }
          .kof-area-previews { grid-area: previews; }
          @media (min-width: 900px) {
            .kof-area-left, .kof-area-right { display: block; }
          }

          /* Mobile preview strip */
          .kof-mobile-previews {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .kof-mobile-slot {
            position: relative;
            aspect-ratio: 3/4;
            border-radius: 8px;
            overflow: hidden;
          }
          @media (min-width: 900px) {
            .kof-area-previews { display: none !important; }
          }
        `}</style>

        <div className="kof-layout" style={{ minHeight: "min(660px,75vh)" }}>

          {/* Mobile: mini P1/P2 preview */}
          <div className="kof-area-previews">
            <div className="kof-mobile-previews">
              <div className="kof-mobile-slot kof-panel-p1">
                <SidePortrait member={leftFighter} mode={mode} side="left" />
              </div>
              <div className="kof-mobile-slot kof-panel-p2">
                <SidePortrait member={rightFighter} mode={mode} side="right" />
              </div>
            </div>
          </div>

          {/* Desktop: LEFT panel */}
          <div className="kof-area-left" style={{ minHeight: 420 }}>
            <div className="kof-panel-p1 kof-panel-p1-clip relative h-full overflow-hidden rounded-sm">
              <div className="kof-panel-streak" style={{ background: "linear-gradient(90deg, transparent, rgba(220,38,38,.8), transparent)" }} />
              <SidePortrait member={leftFighter} mode={mode} side="left" />
            </div>
          </div>

          {/* CENTER: roster grid */}
          <div className="kof-area-center flex flex-col gap-2">

            {/* "CHOOSE YOUR FIGHTER" banner */}
            <div className="kof-choose-banner rounded-sm">
              <span className="arcade-coin" style={{ fontSize: 10, letterSpacing: 4 }}>
                ★ CHOOSE · YOUR · FIGHTER ★
              </span>
              <span style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 9,
                color: "rgba(255,255,255,.5)",
                letterSpacing: 2,
              }}>
                [ {filtered.length.toString().padStart(2, "0")} · FIGHTERS ]
              </span>
            </div>

            {/* Roster grid */}
            <div className="kof-roster-panel rounded-sm p-1.5 sm:p-2 flex-1">
              <div className="kof-roster">
                {filtered.map((m, i) => (
                  <FighterCard
                    key={m.id}
                    member={m}
                    mode={mode}
                    selected={selected?.id === m.id}
                    hovered={hovered?.id === m.id}
                    idx={i}
                    onSelect={onSelect}
                    onHover={setHovered}
                  />
                ))}

                {/* Random tile */}
                <motion.button
                  initial={{ opacity: 0, scale: .7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(filtered.length * .01, .28) + .05 }}
                  onClick={() => {
                    const list = selected ? members.filter(m => m.id !== selected.id) : members;
                    if (list.length) {
                      onSelect(list[Math.floor(Math.random() * list.length)]);
                      sfx?.play("select");
                    }
                  }}
                  className="kof-tile cursor-pointer flex items-center justify-center"
                  style={{
                    background: "linear-gradient(160deg, rgba(255,215,0,.12), rgba(0,0,0,.85))",
                    border: "1px dashed rgba(255,215,0,.35)",
                  }}
                  whileHover={{ scale: 1.06 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <motion.div animate={{ rotate: [0, 12, -12, 6, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5 }}>
                      <Dices size={20} style={{ color: "#FFD700", filter: "drop-shadow(0 0 6px rgba(255,215,0,.5))" }} />
                    </motion.div>
                    <span style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 7,
                      fontWeight: 900,
                      color: "rgba(255,215,0,.7)",
                      letterSpacing: 1,
                    }}>RDM</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Hovered/selected name caption */}
            <div style={{ minHeight: 26, textAlign: "center" }}>
              <AnimatePresence mode="wait">
                {(hovered || selected) && (
                  <motion.div
                    key={(hovered ?? selected)!.id + "-cap"}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: .14 }}
                    style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}
                  >
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "clamp(16px,2vw,22px)",
                      color: "#fff",
                      letterSpacing: 3,
                      textShadow: `0 0 12px ${rc((hovered ?? selected)!.rank).glow}`,
                    }}>
                      {(hovered ?? selected)!.name.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 8,
                      color: rc((hovered ?? selected)!.rank).main,
                      letterSpacing: 2,
                    }}>
                      {(hovered ?? selected)!.rank.toUpperCase()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop: RIGHT panel */}
          <div className="kof-area-right" style={{ minHeight: 420 }}>
            <div className="kof-panel-p2 kof-panel-p2-clip relative h-full overflow-hidden rounded-sm">
              <div className="kof-panel-streak" style={{ background: "linear-gradient(90deg, transparent, rgba(29,78,216,.8), transparent)" }} />
              <SidePortrait member={rightFighter} mode={mode} side="right" />
            </div>
          </div>

        </div>

        {/* Detail panel when selected */}
        {selected && (
          <div className="mt-4 max-w-[720px] mx-auto">
            <AnimatePresence mode="wait">
              <DetailPanel key={selected.id} member={selected} mode={mode} />
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── FIGHT BUTTON ─── */}
      <AnimatePresence>
        {selected && onFight && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.65) 70%, transparent 100%)",
              paddingTop: 24,
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            {/* Hint: P1 selected, click a second fighter to fight */}
            <div className="text-center mb-2.5" style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: "rgba(255,255,255,.38)", letterSpacing: "3px" }}>
              <span style={{ color: "#FF3B30", fontWeight: 700 }}>P1 </span>
              <span style={{ color: rc(selected.rank).main }}>{selected.name.toUpperCase()}</span>
              <span style={{ margin: "0 8px", color: "rgba(255,255,255,.2)" }}>·</span>
              CLIQUE UN 2ÈME FIGHTER OU LANCE UN COMBAT ALÉATOIRE
            </div>
            <div className="flex justify-center px-4">
              <motion.button
                onClick={() => onFight(selected)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: .95 }}
                className="kof-fight-btn px-12 sm:px-16 py-3.5 cursor-pointer font-bold"
                style={{
                  background: "linear-gradient(135deg,#FFD700 0%,#DC2626 50%,#7a0f12 100%)",
                  fontFamily: "'Black Ops One', 'Orbitron', monospace",
                  fontSize: "clamp(14px, 1.8vw, 18px)",
                  color: "#fff",
                  letterSpacing: 7,
                  textShadow: "0 2px 4px rgba(0,0,0,.8), 0 0 16px rgba(255,215,0,.4)",
                  boxShadow:
                    "0 0 35px rgba(220,38,38,.65)," +
                    "0 16px 44px rgba(0,0,0,.7)," +
                    "inset 0 0 0 2px rgba(255,215,0,.55)," +
                    "inset 0 2px 0 rgba(255,255,255,.22)," +
                    "inset 0 -3px 0 rgba(0,0,0,.4)",
                  border: "none",
                }}
              >
                <span className="flex items-center gap-3 relative z-10">
                  <Swords size={16} />
                  COMBAT ALÉATOIRE
                  <Swords size={16} style={{ transform: "scaleX(-1)" }} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRT vignette */}
      <div className="fixed inset-0 pointer-events-none z-[2]" style={{
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */
export default function FightersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("anime");
  const [selected, setSelected] = useState<Member | null>(null);
  const [phase, setPhase] = useState<Phase>("select");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("fighters").select("*").order("id", { ascending: true });
        if (error) throw new Error(error.message);
        if (data && !cancelled) {
          const mapped = data.map((m: any) => ({
            id: m.id, name: m.name, rank: m.rank, birthday: m.birthday, bio: m.bio ?? "",
            photo: m.photo ?? "", animeChar: m.animechar ?? "", color: m.color ?? "#FFD700",
            badge: m.badge, rankJP: m.rankjp,
            stats: m.stats ?? { force: 80, vitesse: 80, technique: 80 },
            special: m.special ?? { name: "Inconnu", effect: "?" },
            photoVideo: m.photovideo ?? "",
            animeVideo: m.animevideo ?? "",
          }));
          setMembers(mapped);
        }
      } catch {
        try { const { members: lm } = await import("../../data/members"); if (!cancelled) setMembers(lm); } catch { /* */ }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = useCallback((m: Member) => {
    if (selected?.id === m.id) { setSelected(null); }
    else if (!selected) { setSelected(m); }
    else if (m.id !== selected.id) {
      const p2 = m;
      const p1 = selected;
      setSelected(null);
      setPhase("intro");
      handleIntro(p1, p2);
    }
  }, [selected]);

  const [fightData, setFightData] = useState<{ p1: Member; p2: Member } | null>(null);

  const handleIntro = useCallback((p1: Member, p2: Member) => { setFightData({ p1, p2 }); setPhase("intro"); }, []);
  const handleIntroDone = useCallback(() => setPhase("fight"), []);
  const handleFight = useCallback((fighter: Member) => {
    if (members.length >= 2) {
      const others = members.filter(m => m.id !== fighter.id);
      const random = others[Math.floor(Math.random() * others.length)];
      setFightData({ p1: fighter, p2: random });
      setPhase("intro");
    }
  }, [members]);

  if (loading) return <><Styles /><LoadingScreen /></>;

  return (
    <>
      <Styles />
      {phase === "select" && (
        <CharacterSelect members={members} mode={mode} setMode={setMode} selected={selected} onSelect={handleSelect} onFight={handleFight} />
      )}
      {phase === "intro" && fightData && (
        <FightIntro p1={fightData.p1} p2={fightData.p2} mode={mode} onFinish={handleIntroDone} />
      )}
      {phase === "fight" && fightData && (
        <Arena p1={fightData.p1} p2={fightData.p2} mode={mode} onExit={() => { setFightData(null); setSelected(null); setPhase("select"); }} />
      )}
    </>
  );
}
