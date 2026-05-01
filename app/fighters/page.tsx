"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Rank, RANK_FILTER_ORDER, type Member } from "../../data/members";
import { Dices, Swords, Flame, Shield, Wind } from "lucide-react";

import type { ViewMode } from "../types";
import { supabase } from "../../lib/supabase";

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
  "Fondateur": { main: "#FFD700", glow: "rgba(255,215,0,.6)", gradient: "linear-gradient(135deg,#FFD700,#FFA000)", dark: "#1a1500" },
  "Monarque": { main: "#FFD700", glow: "rgba(255,215,0,.6)", gradient: "linear-gradient(135deg,#FFD700,#FF8C00)", dark: "#1a1500" },
  "Ex Monarque": { main: "#FF6B35", glow: "rgba(255,107,53,.6)", gradient: "linear-gradient(135deg,#FF6B35,#D35400)", dark: "#1a0e00" },
  "Ordre Céleste": { main: "#C084FC", glow: "rgba(192,132,252,.6)", gradient: "linear-gradient(135deg,#C084FC,#7C3AED)", dark: "#0e0a1e" },
  "New G dorée": { main: "#F472B6", glow: "rgba(244,114,182,.6)", gradient: "linear-gradient(135deg,#F472B6,#BE185D)", dark: "#1a0a12" },
  "Vieux Briscard": { main: "#34D399", glow: "rgba(52,211,153,.6)", gradient: "linear-gradient(135deg,#34D399,#059669)", dark: "#001a12" },
  "Futurs Espoirs": { main: "#60A5FA", glow: "rgba(96,165,250,.6)", gradient: "linear-gradient(135deg,#60A5FA,#1D4ED8)", dark: "#051a35" },
  "Revenant": { main: "#9CA3AF", glow: "rgba(156,163,175,.5)", gradient: "linear-gradient(135deg,#9CA3AF,#4B5563)", dark: "#111827" },
  "Fantôme": { main: "#6B7280", glow: "rgba(107,114,128,.4)", gradient: "linear-gradient(135deg,#6B7280,#374151)", dark: "#0d1117" },
};

function rc(rank: string) { return RC[rank] ?? RC["Fondateur"]; }
function pwr(m: Member) { const s = m.stats ?? { force: 80, vitesse: 80, technique: 80 }; return Math.round((s.force + s.vitesse + s.technique) / 3); }
function img(m: Member, mode: ViewMode) { return mode === "anime" ? m.animeChar : m.photo; }

type Phase = "select" | "intro" | "fight";

/* ─── Global Styles ─── */
function Styles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700;900&family=Orbitron:wght@400;500;700;900&display=swap');

      @keyframes scanlines { 0%{transform:translateY(0)} 100%{transform:translateY(4px)} }
      @keyframes hpPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.5) saturate(2)} }
      @keyframes comboPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      @keyframes vsSlam { 0%{transform:scale(5) rotate(-15deg);opacity:0} 40%{transform:scale(.85) rotate(4deg);opacity:1} 60%{transform:scale(1.12) rotate(-2deg)} 80%{transform:scale(.97) rotate(1deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
      @keyframes screenShake { 0%,100%{transform:translate(0,0) rotate(0)} 10%{transform:translate(-15px,-5px) rotate(-3deg)} 20%{transform:translate(12px,8px) rotate(2deg)} 30%{transform:translate(-8px,-3px) rotate(-1deg)} 40%{transform:translate(5px,2px) rotate(1deg)} 50%{transform:translate(-3px,-1px)} }
      @keyframes hitShake { 0%,100%{transform:translateX(0)} 10%{transform:translateX(-8px) rotate(-1deg)} 30%{transform:translateX(6px) rotate(1deg)} 50%{transform:translateX(-4px)} 70%{transform:translateX(3px)} }
      @keyframes gridPulse { 0%,100%{opacity:.03} 50%{opacity:.08} }
      @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes glowCharge { 0%{background-position:200% center} 100%{background-position:-200% center} }
      @keyframes electricPulse { 0%,100%{opacity:1;filter:brightness(1)} 50%{opacity:.85;filter:brightness(1.5)} }
      @keyframes glitchText { 0%,90%,100%{transform:translate(0);filter:none} 92%{transform:translate(-2px,1px);filter:hue-rotate(90deg)} 94%{transform:translate(2px,-1px);filter:hue-rotate(-90deg)} 96%{transform:translate(-1px,-1px)} 98%{transform:translate(1px,1px);filter:hue-rotate(45deg)} }

      .hit-shake { animation: hitShake .3s ease-out; }
      .ko-shake { animation: screenShake .5s ease-out; }
      .custom-scroll::-webkit-scrollbar { width:3px; height:3px; }
      .custom-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,.02); }
      .custom-scroll::-webkit-scrollbar-thumb { background:rgba(220,38,38,.4); border-radius:2px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background:rgba(220,38,38,.65); }

      .r-pill { transition: all .2s ease; cursor: pointer; white-space: nowrap; }
      .r-pill:hover { transform: translateY(-1px); }

      /* ─── KOF-style compact square roster ─── */
      .kof-roster {
        display: grid;
        gap: 4px;
        grid-template-columns: repeat(8, 1fr);
      }
      @media(min-width:640px)  { .kof-roster { grid-template-columns: repeat(9, 1fr);  gap: 5px; } }
      @media(min-width:900px)  { .kof-roster { grid-template-columns: repeat(10,1fr);  gap: 6px; } }
      @media(min-width:1200px) { .kof-roster { grid-template-columns: repeat(11,1fr);  gap: 6px; } }

      /* Diagonal P1/P2 background (rouge → bleu) */
      .kof-diagonal-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 15% 50%, rgba(220,38,38,.55) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 50%, rgba(29,78,216,.55) 0%, transparent 45%),
          linear-gradient(115deg, #7a0f12 0%, #2a0f2f 45%, #0f1f55 100%);
      }
      .kof-diagonal-bg::before {
        content: "";
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
        background-size: 42px 42px;
        mix-blend-mode: overlay;
        opacity: .25;
      }
      .kof-diagonal-bg::after {
        content: "";
        position: absolute; inset: 0;
        background:
          repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.12) 3px 4px);
        pointer-events: none;
        mix-blend-mode: multiply;
        opacity: .45;
      }

      .kof-portrait-side {
        animation: kof-portrait-float 4.5s ease-in-out infinite;
      }
      @keyframes kof-portrait-float {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(-6px); }
      }

      @keyframes kof-press-blink {
        0%,100% { opacity: 1; }
        50%     { opacity: .25; }
      }

      .kof-tile { position: relative; }
      .kof-tile::after {
        content: "";
        position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%);
        pointer-events: none;
      }
    `}</style>
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

      {/* Diagonal split */}
      {step !== "slash" && (
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .3 }} className="absolute inset-0 origin-center" style={{ background: "linear-gradient(135deg,#07070f 0%,#0f0718 50%,#07070f 100%)" }} />
      )}

      {/* P1 left panel */}
      {["p1", "vs", "p2", "fight"].includes(step) && (
        <AnimatePresence>
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 60, damping: 12 }}
            className="absolute top-0 bottom-0 left-0 z-10 w-[50%]" style={{ clipPath: "polygon(0 0,100% 0,80% 100%,0 100%)" }}>
            <div className="relative w-full h-full" style={{ background: `linear-gradient(135deg,${c1.dark},#030308)` }}>
              {img(p1, mode) && (
                <div className="absolute inset-0 flex items-end justify-center">
                  <Image src={img(p1, mode)} alt={p1.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c1.glow})` }} />
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

      {/* P2 right panel */}
      {["p2", "fight"].includes(step) && (
        <AnimatePresence>
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 60, damping: 12 }}
            className="absolute top-0 bottom-0 right-0 z-10 w-[50%]" style={{ clipPath: "polygon(20% 0,100% 0,100% 100%,0 100%)" }}>
            <div className="relative w-full h-full" style={{ background: `linear-gradient(225deg,${c2.dark},#030308)` }}>
              {img(p2, mode) && (
                <div className="absolute inset-0 flex items-end justify-center">
                  <Image src={img(p2, mode)} alt={p2.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ width: "80%", height: "90%", filter: `drop-shadow(0 0 50px ${c2.glow})`, transform: "scaleX(-1)" }} />
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

      {/* VS */}
      {step === "vs" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,transparent 49.4%,#FFD700 49.4%,#FFD700 50.6%,transparent 50.6%)" }} />
          <div style={{ animation: "vsSlam .8s cubic-bezier(.34,1.56,.64,1)" }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(90px,22vw,260px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,.8),0 0 80px rgba(255,69,0,.5),0 8px 0 #7a5700", letterSpacing: "12px" }}>VS</span>
          </div>
        </div>
      )}

      {/* FIGHT */}
      {step === "fight" && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/90"
            style={{ transition: "opacity .4s" }}
            /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
          />
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
          style={{ [side === "right" ? "right" : "left"]: 0, background: danger ? "linear-gradient(90deg,#FF1A1A,#FF5500)" : `linear-gradient(90deg,${color}cc,${color})`, boxShadow: `0 0 10px ${glow}`, animation: danger ? "hpPulse .8s infinite" : undefined }}
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
  }, [roundText, hp1, hp2, winner]);

  useEffect(() => {
    if (hp1 <= 0 && !winner) { setWinner(p2); setShake(true); sfx?.play("ko"); setTimeout(() => setShake(false), 500); }
    if (hp2 <= 0 && !winner) { setWinner(p1); setShake(true); sfx?.play("ko"); setTimeout(() => setShake(false), 500); }
  }, [hp1, hp2, winner]);

  return (
    <div className={`relative w-full h-screen overflow-hidden ${shake ? "ko-shake" : ""}`} style={{ background: "#050510" }}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 70%,#100a20,#060612 45%,#050510)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "40px 40px", perspective: "500px", transform: "rotateX(55deg)", transformOrigin: "bottom", animation: "gridPulse 4s infinite" }} />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px" style={{ background: `linear-gradient(90deg,transparent,${c1.glow}40,${c2.glow}40,transparent)` }} />
      </div>

      {/* HUD */}
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

      {/* Fighters */}
      <div className="absolute inset-0 flex h-full items-end pb-8">
        <motion.div initial={{ x: "-80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: .2 }} className="flex-1 relative flex items-end justify-center">
          <div className={`relative ${hitFlash === "left" ? "hit-shake" : ""}`} style={{ width: "clamp(220px,30vw,420px)", height: "clamp(300px,55vh,600px)" }}>
            {img(p1, mode) && (
              <Image src={img(p1, mode)} alt={p1.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ filter: hitFlash === "left" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c1.glow})`, transition: "filter .1s" }} />
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full" style={{ background: `radial-gradient(ellipse,${c1.glow}25,transparent 70%)`, filter: "blur(8px)" }} />
          </div>
        </motion.div>
        <div className="w-px h-[60%] self-center shrink-0" style={{ background: "linear-gradient(to bottom,transparent,rgba(255,255,255,.06),transparent)" }} />
        <motion.div initial={{ x: "80%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50, damping: 12, delay: .2 }} className="flex-1 relative flex items-end justify-center">
          <div className={`relative ${hitFlash === "right" ? "hit-shake" : ""}`} style={{ width: "clamp(220px,30vw,420px)", height: "clamp(300px,55vh,600px)" }}>
            {img(p2, mode) && (
              <Image src={img(p2, mode)} alt={p2.name} fill={false} width={400} height={500} className="object-contain object-bottom" style={{ filter: hitFlash === "right" ? "brightness(3) saturate(0)" : `drop-shadow(0 0 30px ${c2.glow})`, transition: "filter .1s", transform: "scaleX(-1)" }} />
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full" style={{ background: `radial-gradient(ellipse,${c2.glow}25,transparent 70%)`, filter: "blur(8px)" }} />
          </div>
        </motion.div>
      </div>

      <Sparks active={!winner && !roundText} color="#FF4500" intensity={.25} />

      {/* Round text */}
      <AnimatePresence>
        {roundText && (
          <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .3, opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 150, damping: 15 }} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(48px,14vw,140px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,.6),0 0 80px rgba(255,69,0,.3),0 8px 0 #7a5700", letterSpacing: "10px" }}>{roundText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* K.O. */}
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }} className="absolute inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: .2 }} className="relative z-10 text-center">
              <GlitchText text="K.O." style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(80px,20vw,200px)", fontWeight: 900, color: "#FF1A1A", textShadow: "0 0 60px rgba(255,26,26,.8),0 0 120px rgba(255,0,0,.3),0 8px 0 #5c0000", letterSpacing: "14px" }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8 }}>
                <div className="mt-4" style={{ color: rc(winner.rank).main, fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px,5vw,56px)", textShadow: `0 0 24px ${rc(winner.rank).glow}`, letterSpacing: "6px" }}>
                  {winner.name.toUpperCase()}
                </div>
              </motion.div>
              <button onClick={onExit} className="mt-6 px-8 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10" style={{ background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.3)" }}>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "11px", color: "#FFD700", letterSpacing: "4px" }}>NOUVEAU COMBAT</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit */}
      <button onClick={onExit} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-pointer text-white/30 hover:text-white/60 transition-colors text-xs" style={{ fontFamily: "'Orbitron',monospace", fontSize: "9px", letterSpacing: "2px", background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.08)" }}>
        RETOUR
      </button>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-30" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.01) 2px,rgba(255,255,255,.01) 4px)", animation: "scanlines .1s linear infinite" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.4) 100%)" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════
   FIGHTER TILE (KOF-style)
   ════════════════════════════════════════════════════ */
function FighterCard({ member, mode, selected, hovered, idx, onSelect, onHover }: {
  member: Member; mode: ViewMode; selected: boolean; hovered: boolean;
  idx: number; onSelect: (m: Member) => void; onHover: (m: Member | null) => void;
}) {
  const c = rc(member.rank);
  const active = selected || hovered;

  return (
    <motion.button
      initial={{ opacity: 0, scale: .7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: .25, delay: Math.min(idx * .012, .3), ease: "easeOut" }}
      onClick={() => onSelect(member)}
      onMouseEnter={() => { onHover(member); sfx?.play("hover"); }}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member)}
      onBlur={() => onHover(null)}
      className="kof-tile relative w-full overflow-hidden cursor-pointer block"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 4,
        outline: selected
          ? `2px solid ${c.main}`
          : hovered
            ? `2px solid #fff`
            : "1px solid rgba(255,255,255,.18)",
        outlineOffset: selected || hovered ? -2 : -1,
        boxShadow: selected
          ? `0 0 0 2px rgba(0,0,0,.9), 0 0 22px ${c.glow}, 0 0 42px ${c.glow}`
          : hovered
            ? `0 0 0 2px rgba(0,0,0,.9), 0 0 14px rgba(255,255,255,.35)`
            : "inset 0 0 0 1px rgba(0,0,0,.6)",
        transition: "outline .12s, box-shadow .2s, transform .15s",
        transform: hovered && !selected ? "scale(1.06)" : "scale(1)",
        background: `linear-gradient(160deg, ${c.dark}, #050510 70%)`,
        zIndex: hovered || selected ? 3 : 1,
      }}
    >
      {/* Portrait */}
      {img(member, mode) && (
        <Image
          src={img(member, mode)}
          alt={member.name}
          width={140}
          height={140}
          className="object-cover"
          style={{
            width: "100%",
            height: "100%",
            objectPosition: "center 22%",
            filter: active ? "saturate(1.15) brightness(1.05)" : "saturate(.85) brightness(.85)",
            transition: "filter .18s",
          }}
        />
      )}

      {/* Rank stripe */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 3,
          background: c.gradient,
          opacity: active ? 1 : .55,
          transition: "opacity .15s",
        }}
      />

      {/* Selected top-arrow */}
      {selected && (
        <motion.div
          className="absolute -top-[7px] left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: .7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div style={{
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `8px solid ${c.main}`,
            filter: `drop-shadow(0 0 6px ${c.glow})`,
          }} />
        </motion.div>
      )}
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
      {/* Top accent */}
      <div className="h-[3px]" style={{ background: c.gradient }} />
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Portrait */}
        <div className="relative w-full h-48 sm:w-28 sm:h-36 rounded-lg overflow-hidden shrink-0">
          {img(member, mode) && (
            <Image src={img(member, mode)} alt={member.name} fill={false} width={160} height={200} className="object-cover"
              style={{ width: "100%", height: "100%", filter: `drop-shadow(0 0 12px ${c.glow})` }}
            />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top,rgba(10,10,25,.85),transparent 50%)` }} />
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(0,0,0,.7)", border: `1px solid ${c.main}30`, fontFamily: "'Orbitron',monospace", color: c.main, letterSpacing: "1px" }}>
              PWR {power}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(22px,3vw,30px)", color: "#fff", letterSpacing: "3px", lineHeight: 1, textShadow: `0 0 14px ${c.glow}20` }}>
            {member.name.toUpperCase()}
          </h3>
          {member.rank && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-sm text-[10px] font-bold" style={{ background: c.gradient, color: "#000", fontFamily: "'Orbitron',monospace", letterSpacing: "1px" }}>
              {member.rank.toUpperCase()}
            </span>
          )}
          {member.special && (
            <div className="mt-1.5 flex items-center gap-1" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "12px", color: c.main }}>
              <Flame size={11} />
              <span>{member.special.name}</span>
            </div>
          )}

          <div className="space-y-1.5 mt-3">
            <StatBar label="FOR" value={s.force} color="#EF4444" icon={<Flame size={11} />} delay={0} />
            <StatBar label="VIT" value={s.vitesse} color="#38BDF8" icon={<Wind size={11} />} delay={80} />
            <StatBar label="TEC" value={s.technique} color="#A78BFA" icon={<Shield size={11} />} delay={160} />
          </div>

          {member.special?.effect && (
            <div className="mt-2 px-2 py-1.5 rounded text-xs" style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", color: "rgba(255,255,255,.35)", fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1.4 }}>
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
   KOF SIDE PORTRAIT (big character on left/right)
   ════════════════════════════════════════════════════ */
function SidePortrait({ member, mode, side }: { member: Member | null; mode: ViewMode; side: "left" | "right" }) {
  const c = member ? rc(member.rank) : null;
  const tag = side === "left" ? "P1" : "P2";
  const tagColor = side === "left" ? "#FF3B30" : "#1DA1F2";

  return (
    <div className="relative w-full h-full flex flex-col justify-end overflow-hidden">
      <AnimatePresence mode="wait">
        {member && c ? (
          <motion.div
            key={member.id}
            className="absolute inset-0 flex items-end justify-center kof-portrait-side"
            initial={{ opacity: 0, x: side === "left" ? -40 : 40, scale: .95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: side === "left" ? -30 : 30, scale: .98 }}
            transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}
          >
            {img(member, mode) && (
              <Image
                src={img(member, mode)}
                alt={member.name}
                width={500}
                height={700}
                className="object-contain object-bottom"
                style={{
                  width:  "100%",
                  height: "100%",
                  maxHeight: "100%",
                  filter: `drop-shadow(0 0 40px ${c.glow}) drop-shadow(0 8px 22px rgba(0,0,0,.7))`,
                  transform: side === "right" ? "scaleX(-1)" : undefined,
                }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(42px,10vw,120px)",
              fontWeight: 900,
              color: "rgba(255,255,255,.08)",
              letterSpacing: "6px",
              textShadow: "0 4px 24px rgba(0,0,0,.6)",
            }}>
              {side === "left" ? "?" : "?"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYER tag (top-left or top-right) */}
      <div
        className={`absolute top-3 ${side === "left" ? "left-3" : "right-3"} z-10 pointer-events-none`}
        style={{
          padding: "4px 10px",
          background: "rgba(0,0,0,.6)",
          border: `1px solid ${tagColor}66`,
          borderRadius: 4,
          fontFamily: "'Orbitron', monospace",
          fontSize: 11,
          fontWeight: 900,
          color: tagColor,
          letterSpacing: "3px",
          boxShadow: `0 0 14px ${tagColor}55`,
        }}
      >
        {tag}
      </div>

      {/* Name block */}
      {member && c && (
        <motion.div
          key={`name-${member.id}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .35, delay: .1 }}
          className={`absolute bottom-3 ${side === "left" ? "left-3" : "right-3"} z-10 pointer-events-none ${side === "right" ? "text-right" : ""}`}
        >
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 10,
            color: c.main,
            letterSpacing: "3px",
            textShadow: `0 0 10px ${c.glow}`,
          }}>
            {member.rank.toUpperCase()}
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(22px,3.5vw,44px)",
            color: "#fff",
            letterSpacing: "3px",
            lineHeight: .95,
            textShadow: `0 2px 10px rgba(0,0,0,.85), 0 0 18px ${c.glow}`,
          }}>
            {member.name.toUpperCase()}
          </div>
        </motion.div>
      )}
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
  const filtered = filter === "Tous" ? members : members.filter(m => m.rank === filter);

  // Preview = selected (P1) à gauche, et survol/random (P2) à droite
  const leftFighter  = selected;
  const rightFighter = hovered && hovered.id !== selected?.id ? hovered : null;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0b0a14" }}>
      {/* Diagonal P1/P2 background */}
      <div className="kof-diagonal-bg" />

      {/* Floating light-particles */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              left: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? "#FFD700" : "#DC2626",
              opacity: .2 + Math.random() * .25,
              filter: "blur(.5px)",
            }}
            animate={{ y: ["110vh", "-10vh"] }}
            transition={{
              duration: 18 + Math.random() * 18,
              repeat: Infinity,
              ease: "linear",
              delay: -Math.random() * 15,
            }}
          />
        ))}
      </div>

      {/* ─── Top bar ───────────────────────────────── */}
      <div className="relative z-40 border-b" style={{ borderColor: "rgba(255,255,255,.08)", background: "rgba(0,0,0,.35)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Swords size={18} style={{ color: "#FFD700", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(13px,2vw,18px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "5px",
              whiteSpace: "nowrap",
            }}>
              SELECT · FIGHTER
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { if (sfx) sfx.muted = !sfx.muted; }}
              className="p-1.5 rounded cursor-pointer text-white/40 hover:text-white/80 transition-colors"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1 }}
              aria-label="Toggle sound"
            >
              {sfx?.muted ? "MUTE" : "SFX"}
            </button>
            {(["real", "anime"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); sfx?.play("select"); }}
                className="px-3 py-1 rounded cursor-pointer text-[10px] font-bold transition-all duration-200"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: "1px",
                  background: mode === m ? "rgba(255,215,0,.18)" : "transparent",
                  color:      mode === m ? "#FFD700" : "rgba(255,255,255,.35)",
                  border:     mode === m ? "1px solid rgba(255,215,0,.4)" : "1px solid rgba(255,255,255,.1)",
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
                className="r-pill px-3 py-1 rounded-sm text-[10px] font-bold flex-shrink-0"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: "1px",
                  background: active ? `${col}22` : "rgba(0,0,0,.35)",
                  color: active ? col : "rgba(255,255,255,.45)",
                  border: `1px solid ${active ? col + "70" : "rgba(255,255,255,.08)"}`,
                  boxShadow: active ? `0 0 12px ${col}45` : "none",
                }}
              >
                {r === "Tous" ? "TOUS" : r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main KOF layout ────────────────────────── */}
      <div className="relative z-10 max-w-[1700px] mx-auto px-3 sm:px-5 py-4 sm:py-6">
        <div
          className="grid gap-3 sm:gap-5 items-stretch"
          style={{
            gridTemplateColumns: "minmax(0, 1fr)",
            gridTemplateAreas: `
              "left"
              "grid"
              "right"
            `,
          }}
        >
          {/* Desktop override via className */}
          <style jsx>{`
            .kof-layout {
              grid-template-columns: minmax(0, 1fr);
              grid-template-areas:
                "grid"
                "left"
                "right";
            }
            @media (min-width: 900px) {
              .kof-layout {
                grid-template-columns: minmax(210px, 19%) minmax(0, 1fr) minmax(210px, 19%);
                grid-template-areas: "left grid right";
              }
            }
            .kof-left  { grid-area: left;  }
            .kof-grid  { grid-area: grid;  }
            .kof-right { grid-area: right; }

            /* Mobile : portraits en petite rangée au dessus */
            .kof-mini-preview {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 14px;
            }
            .kof-mini-slot {
              position: relative;
              aspect-ratio: 3/4;
              border-radius: 10px;
              overflow: hidden;
              background: linear-gradient(160deg, rgba(220,38,38,.25), rgba(0,0,0,.6));
              border: 1px solid rgba(255,255,255,.1);
            }
            .kof-mini-slot.right {
              background: linear-gradient(200deg, rgba(29,78,216,.25), rgba(0,0,0,.6));
            }
            @media (min-width: 900px) {
              .kof-mini-preview { display: none; }
            }
          `}</style>

          <div className="kof-layout grid gap-3 sm:gap-5 items-stretch" style={{ minHeight: "min(620px, 70vh)" }}>

            {/* ─── Mobile mini previews (P1 + P2) ── */}
            <div className="kof-mini-preview col-span-full">
              <div className="kof-mini-slot">
                <SidePortrait member={leftFighter} mode={mode} side="left" />
              </div>
              <div className="kof-mini-slot right">
                <SidePortrait member={rightFighter || (hovered?.id === selected?.id ? null : hovered)} mode={mode} side="right" />
              </div>
            </div>

            {/* ─── LEFT portrait (desktop) ─── */}
            <div className="kof-left relative hidden md:flex" style={{ minHeight: 400 }}>
              <div className="relative flex-1 rounded-xl overflow-hidden"
                style={{
                  background: "linear-gradient(160deg, rgba(220,38,38,.25) 0%, rgba(40,0,10,.6) 60%, rgba(0,0,0,.8) 100%)",
                  border: "1px solid rgba(220,38,38,.35)",
                  boxShadow: "0 0 30px rgba(220,38,38,.18), inset 0 0 80px rgba(0,0,0,.6)",
                }}>
                <SidePortrait member={leftFighter} mode={mode} side="left" />
              </div>
            </div>

            {/* ─── CENTRAL GRID ─── */}
            <div className="kof-grid relative flex flex-col">
              {/* PRESS START */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 11,
                  color: "#FFD700",
                  letterSpacing: 3,
                  animation: "kof-press-blink 1s infinite",
                  textShadow: "0 0 8px rgba(255,215,0,.6)",
                }}>
                  ★ PRESS · START ★
                </span>
                <span style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 10,
                  color: "rgba(255,255,255,.4)",
                  letterSpacing: 2,
                }}>
                  {filtered.length} COMBATANTS
                </span>
              </div>

              {/* Grid + random button */}
              <div
                className="relative rounded-xl p-2 sm:p-3"
                style={{
                  background: "rgba(0,0,0,.55)",
                  border: "1px solid rgba(255,255,255,.1)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "inset 0 0 60px rgba(0,0,0,.55), 0 12px 42px rgba(0,0,0,.45)",
                }}
              >
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
                    transition={{ delay: Math.min(filtered.length * .012, .3) + .05 }}
                    onClick={() => {
                      const list = selected ? members.filter(m => m.id !== selected.id) : members;
                      if (list.length) {
                        onSelect(list[Math.floor(Math.random() * list.length)]);
                        sfx?.play("select");
                      }
                    }}
                    className="kof-tile relative w-full cursor-pointer flex items-center justify-center"
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 4,
                      background: "linear-gradient(160deg, rgba(255,215,0,.18), rgba(0,0,0,.8))",
                      border: "1px dashed rgba(255,215,0,.45)",
                    }}
                    whileHover={{ scale: 1.06 }}
                  >
                    <motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2 }}>
                      <Dices size={22} style={{ color: "#FFD700" }} />
                    </motion.div>
                    <span
                      className="absolute bottom-1 left-0 right-0 text-center"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 8,
                        fontWeight: 900,
                        color: "#FFD700",
                        letterSpacing: 1.2,
                        textShadow: "0 1px 3px rgba(0,0,0,.8)",
                      }}
                    >
                      ?
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Hovered name caption */}
              <div className="mt-2 min-h-[24px] text-center">
                <AnimatePresence mode="wait">
                  {(hovered || selected) && (
                    <motion.div
                      key={(hovered ?? selected)!.id + "-caption"}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: .15 }}
                    >
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "clamp(16px, 2vw, 22px)",
                        color: "#fff",
                        letterSpacing: 3,
                        textShadow: `0 0 10px ${rc((hovered ?? selected)!.rank).glow}`,
                      }}>
                        {(hovered ?? selected)!.name.toUpperCase()}
                      </span>
                      <span className="ml-2" style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 9,
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

            {/* ─── RIGHT portrait (desktop) ─── */}
            <div className="kof-right relative hidden md:flex" style={{ minHeight: 400 }}>
              <div className="relative flex-1 rounded-xl overflow-hidden"
                style={{
                  background: "linear-gradient(200deg, rgba(29,78,216,.28) 0%, rgba(0,10,40,.65) 60%, rgba(0,0,0,.8) 100%)",
                  border: "1px solid rgba(29,78,216,.4)",
                  boxShadow: "0 0 30px rgba(29,78,216,.22), inset 0 0 80px rgba(0,0,0,.6)",
                }}>
                <SidePortrait member={rightFighter} mode={mode} side="right" />
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel (hide on small, show as bottom drawer on desktop below grid if selected) */}
        {selected && (
          <div className="mt-5 max-w-[720px] mx-auto">
            <AnimatePresence mode="wait">
              <DetailPanel key={selected.id} member={selected} mode={mode} />
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── FIGHT BUTTON — fixed bottom ───────────── */}
      <AnimatePresence>
        {selected && onFight && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.55) 65%, transparent 100%)",
              paddingTop: 24,
              paddingBottom: "max(14px, env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex justify-center px-4">
              <motion.button
                onClick={() => onFight(selected)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: .96 }}
                className="px-10 sm:px-14 py-3 rounded-md cursor-pointer font-bold relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#DC2626 0%,#991B1B 100%)",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "clamp(13px, 1.6vw, 16px)",
                  color: "#fff",
                  letterSpacing: 6,
                  boxShadow: "0 0 26px rgba(220,38,38,.5), 0 10px 34px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.15)",
                }}
              >
                <span className="flex items-center gap-3 relative z-10">
                  <Swords size={15} />
                  COMBATTRE
                  <Swords size={15} style={{ transform: "scaleX(-1)" }} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      // We need to store both fighters for intro
      // Use a closure to pass them
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
