"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Swords, Dices, Zap, Shield, Wind, Flame } from "lucide-react";
import { supabase } from "../../lib/supabase";
import GuildeHeader from "../components/GuildeHeader";
import VideoPlayer from "../components/VideoPlayer";
import { Rank, RANK_FILTER_ORDER, type Member } from "../../data/members";

/* ─── Types ─── */
type ViewMode = "anime" | "real";
type Phase = "select" | "intro" | "fight";

/* ─── Rank palette ─── */
const RANK_COLORS: Record<string, { main: string; bg: string; glow: string }> = {
  "Fondateur":      { main: "#FFD700", bg: "#1a1300", glow: "rgba(255,215,0,0.5)" },
  "Monarque":       { main: "#FFD700", bg: "#1a1300", glow: "rgba(255,215,0,0.5)" },
  "Ex Monarque":    { main: "#FF6B35", bg: "#1a0e00", glow: "rgba(255,107,53,0.5)" },
  "Ordre Céleste":  { main: "#C084FC", bg: "#0e0a1e", glow: "rgba(192,132,252,0.5)" },
  "New G dorée":    { main: "#F472B6", bg: "#1a0a12", glow: "rgba(244,114,182,0.5)" },
  "Vieux Briscard": { main: "#34D399", bg: "#001a12", glow: "rgba(52,211,153,0.5)" },
  "Futurs Espoirs": { main: "#60A5FA", bg: "#051a35", glow: "rgba(96,165,250,0.5)" },
  "Revenant":       { main: "#9CA3AF", bg: "#111827", glow: "rgba(156,163,175,0.4)" },
  "Fantôme":        { main: "#6B7280", bg: "#0d1117", glow: "rgba(107,114,128,0.3)" },
};
const rc = (rank: string) => RANK_COLORS[rank] ?? RANK_COLORS["Fondateur"];
const pwr = (m: Member) => {
  const s = m.stats ?? { force: 80, vitesse: 80, technique: 80 };
  return Math.round((s.force + s.vitesse + s.technique) / 3);
};
const portrait = (m: Member, mode: ViewMode) => mode === "anime" ? m.animeChar : m.photo;
const videoSrc = (m: Member, mode: ViewMode) => mode === "anime" ? (m.animeVideo ?? "") : (m.photoVideo ?? "");

/* ═══════════════════════════════
   LOADING
═══════════════════════════════ */
function LoadingScreen() {
  const [dots, setDots] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const d = setInterval(() => setDots(p => (p + 1) % 4), 400);
    const p = setInterval(() => setPct(v => Math.min(100, v + Math.random() * 8 + 2)), 100);
    return () => { clearInterval(d); clearInterval(p); };
  }, []);
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050008]" style={{ gap: 32 }}>
      {/* scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px)",
        zIndex: 1,
      }} />
      <div className="relative z-10 text-center" style={{ fontFamily: "'Orbitron',monospace" }}>
        <div style={{ fontSize: "clamp(10px,1.2vw,12px)", color: "rgba(255,215,0,0.3)", letterSpacing: 4, whiteSpace: "pre", marginBottom: 24 }}>
          {"╔══════════════════╗\n║  GUILDE FIGHTERS ║\n╚══════════════════╝"}
        </div>
        <div style={{ fontSize: "clamp(24px,4vw,48px)", fontWeight: 900, color: "#DC2626", letterSpacing: 8, textShadow: "0 0 30px rgba(220,38,38,0.7)" }}>
          LOADING{".".repeat(dots)}
        </div>
        <div style={{ marginTop: 6, fontSize: 9, color: "rgba(255,215,0,0.55)", letterSpacing: 5 }}>
          ★ PLEASE WAIT ★
        </div>
      </div>
      <div className="relative z-10" style={{ width: "clamp(260px,44vw,380px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 2 }}>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>PLAYER DATA</span>
          <span style={{ color: "#FFD700" }}>{Math.floor(pct)}%</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#DC2626,#FFD700)", transition: "width 0.1s linear", borderRadius: 2 }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(0,0,0,0.2) 6px,rgba(0,0,0,0.2) 12px)" }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   STAT BAR
═══════════════════════════════ */
function StatBar({ label, value, color, icon, delay = 0 }: { label: string; value: number; color: string; icon: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="flex items-center gap-2">
      <div style={{ color, width: 14, height: 14, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 1, width: 24, textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden", position: "relative" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: show ? `${value}%` : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 1 }}
        />
      </div>
      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color, fontWeight: 700, width: 22, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════
   FIGHTER SHOWCASE (panel gauche)
═══════════════════════════════ */
function FighterShowcase({ member, mode }: { member: Member | null; mode: ViewMode }) {
  const c = member ? rc(member.rank) : null;
  const s = member?.stats ?? { force: 80, vitesse: 80, technique: 80 };
  const power = member ? pwr(member) : 0;
  const vid = member ? videoSrc(member, mode) : "";
  const img = member ? portrait(member, mode) : "";

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: "#08050f" }}>
      {/* BG ambiance */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: c
          ? `radial-gradient(ellipse 80% 60% at 50% 80%, ${c.glow} 0%, transparent 70%)`
          : "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(220,38,38,0.15) 0%, transparent 70%)",
        transition: "background 0.5s",
        zIndex: 0,
      }} />
      {/* scanlines */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 3px)",
      }} />

      <AnimatePresence mode="wait">
        {member && c ? (
          <motion.div
            key={member.id}
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "relative", zIndex: 2 }}
          >
            {/* Portrait zone — 60% de la hauteur */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${member.id}-${mode}`}
                  className="absolute inset-0 flex items-end justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {vid ? (
                    <div style={{ width: "100%", height: "100%", filter: `drop-shadow(0 0 40px ${c.glow})` }}>
                      <VideoPlayer src={vid} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                    </div>
                  ) : img ? (
                    <Image
                      src={img}
                      alt={member.name}
                      fill={false}
                      width={400}
                      height={520}
                      style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 40px ${c.glow})` }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 80, fontWeight: 900, color: `${c.main}20` }}>?</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              {/* gradient bas */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                height: "50%",
                background: "linear-gradient(to top, #08050f 0%, transparent 100%)",
                zIndex: 2,
              }} />
              {/* Rank badge */}
              <div className="absolute top-3 left-3 z-10" style={{
                background: c.main,
                color: "#000",
                fontFamily: "'Orbitron',monospace",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: 2,
                padding: "3px 8px",
                borderRadius: 2,
              }}>
                {member.rank.toUpperCase()}
              </div>
              {/* P1 badge */}
              <div className="absolute top-3 right-3 z-10" style={{
                background: "rgba(220,38,38,0.85)",
                color: "#fff",
                fontFamily: "'Orbitron',monospace",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 3,
                padding: "3px 10px",
                borderRadius: 2,
                border: "1px solid rgba(220,38,38,0.6)",
              }}>
                P1
              </div>
            </div>

            {/* Info zone — bas */}
            <div className="relative z-10 px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${c.main}30` }}>
              {/* Nom + power */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: c.main, letterSpacing: 3, marginBottom: 2 }}>
                    FIGHTER
                  </div>
                  <div style={{
                    fontFamily: "'Orbitron',monospace",
                    fontSize: "clamp(14px,1.8vw,20px)",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: 2,
                    lineHeight: 1.1,
                    textShadow: `0 0 20px ${c.glow}`,
                  }}>
                    {member.name.toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>PWR</div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: c.main, lineHeight: 1, textShadow: `0 0 15px ${c.glow}` }}>
                    {power}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <StatBar label="FOR" value={s.force}     color="#EF4444" icon={<Flame size={12} />}  delay={0}   />
                <StatBar label="VIT" value={s.vitesse}   color="#38BDF8" icon={<Wind  size={12} />}  delay={60}  />
                <StatBar label="TEC" value={s.technique} color="#A78BFA" icon={<Shield size={12} />} delay={120} />
              </div>

              {/* Special */}
              {member.special?.name && (
                <div className="mt-3 px-3 py-2" style={{
                  background: `${c.main}10`,
                  borderLeft: `2px solid ${c.main}60`,
                  borderRadius: "0 4px 4px 0",
                }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: c.main, letterSpacing: 2, marginBottom: 2 }}>
                    ▲ {member.special.name.toUpperCase()}
                  </div>
                  {member.special.effect && (
                    <div style={{ fontFamily: "system-ui,sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      {member.special.effect}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ zIndex: 2 }}
          >
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(80px,14vw,140px)", fontWeight: 900, color: "rgba(220,38,38,0.06)" }}>?</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: 5, marginTop: 8, textAlign: "center" }}>
              SELECT A FIGHTER
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════
   FIGHTER CARD (tile grille)
═══════════════════════════════ */
function FighterCard({
  member, mode, selected, hovered, idx, onSelect, onHover,
}: {
  member: Member; mode: ViewMode; selected: boolean; hovered: boolean; idx: number;
  onSelect: (m: Member) => void; onHover: (m: Member | null) => void;
}) {
  const c = rc(member.rank);
  const vid = videoSrc(member, mode);
  const img = portrait(member, mode);
  const active = selected || hovered;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.015, 0.3), duration: 0.2 }}
      onClick={() => onSelect(member)}
      onMouseEnter={() => onHover(member)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: "relative",
        aspectRatio: "3/4",
        overflow: "hidden",
        background: "#0a0812",
        border: selected
          ? `2px solid ${c.main}`
          : hovered
            ? `1px solid rgba(255,255,255,0.5)`
            : `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 2,
        cursor: "pointer",
        outline: "none",
        transform: selected ? "scale(1.05)" : "scale(1)",
        zIndex: selected ? 3 : 1,
        boxShadow: selected ? `0 0 20px ${c.glow}, 0 0 40px ${c.glow}` : "none",
        transition: "border 0.1s, transform 0.1s, box-shadow 0.15s",
      }}
      whileHover={{ scale: selected ? 1.05 : 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Rank accent stripe gauche */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 0, width: 3,
        background: `linear-gradient(180deg, ${c.main}, ${c.main}40)`,
        zIndex: 5, opacity: active ? 1 : 0.5, transition: "opacity 0.15s",
      }} />

      {/* Portrait */}
      {vid ? (
        <div style={{ width: "100%", height: "calc(100% - 26px)", filter: active ? "saturate(1.1)" : "saturate(0.6) brightness(0.75)", transition: "filter 0.18s" }}>
          <VideoPlayer src={vid} fit="cover" objectPosition="smart" fullscreenBtn={false} />
        </div>
      ) : img ? (
        <Image
          src={img}
          alt={member.name}
          width={160}
          height={210}
          style={{
            width: "100%",
            height: "calc(100% - 26px)",
            objectFit: "cover",
            objectPosition: "center 12%",
            filter: active ? "saturate(1.1)" : "saturate(0.6) brightness(0.75)",
            transition: "filter 0.18s",
            display: "block",
          }}
        />
      ) : (
        <div style={{
          width: "100%", height: "calc(100% - 26px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `radial-gradient(ellipse at center, ${c.bg}, #050508)`,
        }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(18px,3vw,28px)", fontWeight: 900, color: `${c.main}40` }}>?</span>
        </div>
      )}

      {/* gradient bas */}
      <div style={{
        position: "absolute", bottom: 26, left: 0, right: 0, height: "40%",
        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
        pointerEvents: "none", zIndex: 2,
      }} />

      {/* Nameplate */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 26,
        background: "rgba(0,0,0,0.92)",
        borderTop: `1px solid ${c.main}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 4,
      }}>
        <span style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: "clamp(7px,1vw,10px)",
          fontWeight: 700,
          color: active ? "#fff" : "rgba(255,255,255,0.65)",
          letterSpacing: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "90%",
          transition: "color 0.15s",
        }}>
          {member.name.toUpperCase()}
        </span>
      </div>

      {/* Selected: corner brackets KOF style */}
      {selected && (
        <>
          <div style={{ position: "absolute", top: 4, left: 4, width: 10, height: 10, borderTop: `2px solid ${c.main}`, borderLeft: `2px solid ${c.main}`, zIndex: 10 }} />
          <div style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderTop: `2px solid ${c.main}`, borderRight: `2px solid ${c.main}`, zIndex: 10 }} />
          <div style={{ position: "absolute", bottom: 30, left: 4, width: 10, height: 10, borderBottom: `2px solid ${c.main}`, borderLeft: `2px solid ${c.main}`, zIndex: 10 }} />
          <div style={{ position: "absolute", bottom: 30, right: 4, width: 10, height: 10, borderBottom: `2px solid ${c.main}`, borderRight: `2px solid ${c.main}`, zIndex: 10 }} />
        </>
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════
   FIGHT INTRO
═══════════════════════════════ */
function FightIntro({ p1, p2, mode, onFinish }: { p1: Member; p2: Member; mode: ViewMode; onFinish: () => void }) {
  const [step, setStep] = useState<"p1" | "vs" | "p2" | "fight">("p1");
  const c1 = rc(p1.rank), c2 = rc(p2.rank);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("vs"),   900),
      setTimeout(() => setStep("p2"),   1800),
      setTimeout(() => setStep("fight"),3000),
      setTimeout(() => onFinish(),      4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden flex"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: "#060412" }}
    >
      {/* P1 */}
      <motion.div
        className="relative flex-1"
        initial={{ x: "-100%" }} animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 70, damping: 14 }}
        style={{ clipPath: "polygon(0 0,85% 0,100% 100%,0 100%)", background: `linear-gradient(135deg,${c1.bg},#040308)` }}
      >
        {(videoSrc(p1, mode) || portrait(p1, mode)) && (
          <div className="absolute inset-0 flex items-end justify-center pb-12">
            {videoSrc(p1, mode) ? (
              <div style={{ width: "75%", height: "85%", filter: `drop-shadow(0 0 40px ${c1.glow})` }}>
                <VideoPlayer src={videoSrc(p1, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
              </div>
            ) : (
              <Image src={portrait(p1, mode)} alt={p1.name} width={360} height={460} style={{ width: "75%", height: "85%", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 40px ${c1.glow})` }} />
            )}
          </div>
        )}
        <div className="absolute bottom-8 left-6">
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: c1.main, letterSpacing: 4 }}>PLAYER 1</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(28px,5vw,64px)", fontWeight: 900, color: "#fff", letterSpacing: 4, lineHeight: 0.9, textShadow: `0 0 20px ${c1.glow}` }}>{p1.name.toUpperCase()}</div>
        </div>
      </motion.div>

      {/* P2 */}
      <AnimatePresence>
        {["p2", "fight"].includes(step) && (
          <motion.div
            className="absolute top-0 right-0 bottom-0"
            style={{ width: "55%", clipPath: "polygon(15% 0,100% 0,100% 100%,0 100%)", background: `linear-gradient(225deg,${c2.bg},#040308)` }}
            initial={{ x: "100%" }} animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 70, damping: 14 }}
          >
            {(videoSrc(p2, mode) || portrait(p2, mode)) && (
              <div className="absolute inset-0 flex items-end justify-center pb-12">
                {videoSrc(p2, mode) ? (
                  <div style={{ width: "75%", height: "85%", filter: `drop-shadow(0 0 40px ${c2.glow})`, transform: "scaleX(-1)" }}>
                    <VideoPlayer src={videoSrc(p2, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                  </div>
                ) : (
                  <Image src={portrait(p2, mode)} alt={p2.name} width={360} height={460} style={{ width: "75%", height: "85%", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 40px ${c2.glow})`, transform: "scaleX(-1)" }} />
                )}
              </div>
            )}
            <div className="absolute bottom-8 right-6 text-right">
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: c2.main, letterSpacing: 4 }}>PLAYER 2</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(28px,5vw,64px)", fontWeight: 900, color: "#fff", letterSpacing: 4, lineHeight: 0.9, textShadow: `0 0 20px ${c2.glow}` }}>{p2.name.toUpperCase()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VS */}
      <AnimatePresence>
        {["vs", "p2", "fight"].includes(step) && step !== "fight" && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            initial={{ scale: 6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
          >
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(80px,18vw,220px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 50px rgba(255,215,0,0.8),0 0 100px rgba(255,69,0,0.4),0 6px 0 #7a5700", letterSpacing: 10 }}>VS</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIGHT */}
      <AnimatePresence>
        {step === "fight" && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
          >
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(60px,14vw,180px)", fontWeight: 900, color: "#FFD700", textShadow: "0 0 50px rgba(255,215,0,0.8),0 0 100px rgba(255,69,0,0.5),0 6px 0 #7a5700", letterSpacing: 12 }}>FIGHT!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════
   HP BAR
═══════════════════════════════ */
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

/* ═══════════════════════════════
   CHARACTER SELECT
═══════════════════════════════ */
function CharacterSelect({ members, mode, selected, onSelect, onFight }: {
  members: Member[]; mode: ViewMode;
  selected: Member | null; onSelect: (m: Member) => void; onFight: (m: Member) => void;
}) {
  const [filter, setFilter] = useState<Rank | "Tous">("Tous");
  const [hovered, setHovered] = useState<Member | null>(null);
  const showcase = selected ?? hovered;
  const filtered = filter === "Tous" ? members : members.filter(m => m.rank === filter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#07060f", position: "relative" }}>

      {/* Atmospheric BG */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 8% 50%, rgba(180,15,15,0.55) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 92% 50%, rgba(15,45,200,0.5) 0%, transparent 55%), linear-gradient(180deg,#080013 0%,#060411 50%,#050910 100%)",
        zIndex: 0,
      }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,0.02) 0 1px,transparent 1px 36px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.02) 0 1px,transparent 1px 36px)",
        backgroundSize: "72px 72px",
        zIndex: 0,
      }} />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.1) 3px,rgba(0,0,0,0.1) 4px)",
        zIndex: 0,
      }} />

      {/* ─── TOP BAR ─── */}
      <div className="relative z-20 flex-shrink-0" style={{
        background: "linear-gradient(180deg,rgba(0,0,0,0.92) 0%,rgba(8,4,20,0.78) 100%)",
        borderBottom: "1px solid rgba(255,215,0,0.25)",
        backdropFilter: "blur(12px)",
      }}>
        {/* Tricolor ribbon */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "repeating-linear-gradient(90deg,#FFD700 0 14px,#DC2626 14px 28px,#1D4ED8 28px 42px)", opacity: 0.7 }} />

        <div className="flex items-center justify-between px-4 py-2.5 gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Swords size={16} style={{ color: "#FFD700", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))" }} />
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(13px,2vw,20px)", fontWeight: 900, color: "#FFD700", letterSpacing: 6, textShadow: "0 0 12px rgba(255,215,0,0.6)" }}>
              FIGHTERS
            </span>
            <Swords size={16} style={{ color: "#FFD700", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))", transform: "scaleX(-1)" }} />
          </div>
          {/* Fighter count */}
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 3 }}>
            {filtered.length.toString().padStart(2, "0")} FIGHTERS
          </span>
        </div>

        {/* Rank filters */}
        <div className="px-3 pb-2.5 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map(r => {
            const active = filter === r;
            const col = r === "Tous" ? "#FFD700" : rc(r).main;
            return (
              <button
                key={r}
                onClick={() => setFilter(r as Rank | "Tous")}
                className="cursor-pointer flex-shrink-0"
                style={{
                  fontFamily: "'Orbitron',monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  padding: "4px 10px",
                  borderRadius: 2,
                  background: active ? `${col}20` : "rgba(255,255,255,0.03)",
                  color: active ? col : "rgba(255,255,255,0.45)",
                  border: `1px solid ${active ? col + "55" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: active ? `0 0 10px ${col}30` : "none",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* Desktop: SHOWCASE GAUCHE */}
        <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: "clamp(240px,30%,380px)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <FighterShowcase member={showcase} mode={mode} />
        </div>

        {/* GRILLE */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile: showcase compact (2 slots) */}
          <div className="lg:hidden flex gap-2 px-2 pt-2 flex-shrink-0" style={{ height: 120 }}>
            {/* P1 */}
            <div className="flex-1 relative rounded overflow-hidden" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
              {selected ? (
                <>
                  {portrait(selected, mode) && !videoSrc(selected, mode) && (
                    <Image src={portrait(selected, mode)} alt={selected.name} fill style={{ objectFit: "cover", objectPosition: "top", filter: "saturate(0.9)" }} />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)" }} />
                  <div className="absolute bottom-1 left-1 right-1 text-center" style={{ fontFamily: "'Orbitron',monospace", fontSize: 7, color: "#fff", letterSpacing: 1 }}>
                    <div style={{ color: "#FF3B30", fontSize: 6, letterSpacing: 2, marginBottom: 1 }}>P1</div>
                    {selected.name.toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: "'Orbitron',monospace" }}>
                  <span style={{ fontSize: 20, color: "rgba(220,38,38,0.15)", fontWeight: 900 }}>?</span>
                  <span style={{ fontSize: 6, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginTop: 2 }}>P1</span>
                </div>
              )}
            </div>
            {/* P2 */}
            <div className="flex-1 relative rounded overflow-hidden" style={{ background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.25)" }}>
              {hovered && hovered.id !== selected?.id ? (
                <>
                  {portrait(hovered, mode) && !videoSrc(hovered, mode) && (
                    <Image src={portrait(hovered, mode)} alt={hovered.name} fill style={{ objectFit: "cover", objectPosition: "top", filter: "saturate(0.9) scaleX(-1)", transform: "scaleX(-1)" }} />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)" }} />
                  <div className="absolute bottom-1 left-1 right-1 text-center" style={{ fontFamily: "'Orbitron',monospace", fontSize: 7, color: "#fff", letterSpacing: 1 }}>
                    <div style={{ color: "#1DA1F2", fontSize: 6, letterSpacing: 2, marginBottom: 1 }}>P2</div>
                    {hovered.name.toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: "'Orbitron',monospace" }}>
                  <span style={{ fontSize: 20, color: "rgba(29,78,216,0.15)", fontWeight: 900 }}>?</span>
                  <span style={{ fontSize: 6, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginTop: 2 }}>P2</span>
                </div>
              )}
            </div>
          </div>

          {/* Banner */}
          <div className="flex-shrink-0 px-2 pt-2 pb-1 lg:pt-3 lg:pb-2">
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(255,215,0,0.5)", letterSpacing: 5, textAlign: "center" }}>
              ★ CHOOSE YOUR FIGHTER ★
            </div>
          </div>

          {/* Roster grid */}
          <div className="flex-1 overflow-y-auto px-2 pb-32 lg:pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(220,38,38,0.3) transparent" }}>
            <div style={{
              display: "grid",
              gap: "clamp(4px,0.6vw,7px)",
              gridTemplateColumns: "repeat(3,1fr)",
            }}
              className="roster-grid"
            >
              <style jsx>{`
                @media(min-width:480px)  { .roster-grid { grid-template-columns: repeat(4,1fr) !important; } }
                @media(min-width:768px)  { .roster-grid { grid-template-columns: repeat(5,1fr) !important; } }
                @media(min-width:1280px) { .roster-grid { grid-template-columns: repeat(5,1fr) !important; } }
                @media(min-width:1536px) { .roster-grid { grid-template-columns: repeat(6,1fr) !important; } }
              `}</style>
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
              {/* Tile aléatoire */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(filtered.length * 0.012, 0.3) + 0.05 }}
                onClick={() => {
                  const pool = selected ? members.filter(m => m.id !== selected.id) : members;
                  if (pool.length) onSelect(pool[Math.floor(Math.random() * pool.length)]);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer"
                style={{
                  position: "relative",
                  aspectRatio: "3/4",
                  overflow: "hidden",
                  background: "linear-gradient(160deg,rgba(255,215,0,0.08),rgba(0,0,0,0.85))",
                  border: "1px dashed rgba(255,215,0,0.3)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Dices size={22} style={{ color: "#FFD700", filter: "drop-shadow(0 0 6px rgba(255,215,0,0.5))" }} />
                </motion.div>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 7, fontWeight: 900, color: "rgba(255,215,0,0.65)", letterSpacing: 1 }}>RDM</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FIGHT BUTTON flottant ─── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="fixed bottom-0 left-0 right-0 z-[9999]"
            style={{
              background: "linear-gradient(to top,rgba(0,0,0,0.98) 0%,rgba(0,0,0,0.7) 60%,transparent 100%)",
              paddingTop: 24,
              paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))",
            }}
          >
            <div className="text-center mb-2" style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: 3 }}>
              <span style={{ color: rc(selected.rank).main, fontWeight: 700 }}>{selected.name.toUpperCase()}</span>
              <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>
              CLIQUE UN 2ÈME FIGHTER OU LANCE UN COMBAT
            </div>
            <div className="flex justify-center px-4">
              <motion.button
                onClick={() => onFight(selected)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer flex items-center gap-3"
                style={{
                  fontFamily: "'Orbitron',monospace",
                  fontSize: "clamp(11px,1.5vw,14px)",
                  fontWeight: 900,
                  color: "#000",
                  background: "linear-gradient(135deg,#FFD700 0%,#FF6B35 100%)",
                  padding: "13px 40px",
                  border: "none",
                  borderRadius: 2,
                  letterSpacing: 5,
                  boxShadow: "0 0 30px rgba(255,107,53,0.55),0 12px 30px rgba(0,0,0,0.7)",
                  clipPath: "polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%)",
                }}
              >
                <Zap size={16} />
                COMBAT ALÉATOIRE
                <Zap size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRT vignette */}
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: "radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.5) 100%)" }} />
    </div>
  );
}

/* ═══════════════════════════════
   VIEW MODE TOGGLE
═══════════════════════════════ */
function ViewToggle({ mode, setMode }: { mode: ViewMode; setMode: (m: ViewMode) => void }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "28px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10002,
      display: "flex",
      background: "rgba(4,4,12,0.92)",
      backdropFilter: "blur(16px)",
      padding: 4,
      borderRadius: 100,
      boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
      border: "1px solid rgba(255,215,0,0.12)",
    }}>
      {(["real", "anime"] as ViewMode[]).map(m => (
        <motion.button
          key={m}
          onClick={() => setMode(m)}
          whileTap={{ scale: 0.94 }}
          className="cursor-pointer"
          style={{
            padding: "9px 22px",
            borderRadius: 100,
            border: "none",
            fontFamily: "'Orbitron',monospace",
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 2,
            background: mode === m ? "#FFD700" : "transparent",
            color: mode === m ? "#000" : "rgba(255,255,255,0.45)",
            transition: "all 0.2s",
            boxShadow: mode === m ? "0 3px 12px rgba(255,215,0,0.4)" : "none",
          }}
        >
          {m === "real" ? "Réel" : "Anime"}
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════ */
export default function FightersPage() {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<ViewMode>("anime");
  const [selected, setSelected] = useState<Member | null>(null);
  const [phase, setPhase]       = useState<Phase>("select");
  const [fightData, setFightData] = useState<{ p1: Member; p2: Member } | null>(null);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("fighters").select("*").order("id", { ascending: true });
        if (error) throw new Error(error.message);
        if (data && !cancelled) {
          setMembers(data.map((m: Record<string, unknown>) => ({
            id: m.id as number,
            name: m.name as string,
            rank: m.rank as Rank,
            birthday: (m.birthday as string) ?? "",
            bio: (m.bio as string) ?? "",
            photo: (m.photo as string) ?? "",
            animeChar: (m.animechar as string) ?? "",
            color: (m.color as string) ?? "#FFD700",
            badge: m.badge as string | undefined,
            rankJP: m.rankjp as string | undefined,
            stats: (m.stats as { force: number; vitesse: number; technique: number }) ?? { force: 80, vitesse: 80, technique: 80 },
            special: (m.special as { name: string; effect: string }) ?? { name: "Inconnu", effect: "" },
            photoVideo: (m.photovideo as string) ?? "",
            animeVideo: (m.animevideo as string) ?? "",
          })));
        }
      } catch {
        try {
          const { members: lm } = await import("../../data/members");
          if (!cancelled) setMembers(lm);
        } catch { /* */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startFight = useCallback((p1: Member, p2: Member) => {
    setFightData({ p1, p2 });
    setPhase("intro");
  }, []);

  const handleSelect = useCallback((m: Member) => {
    if (selected?.id === m.id) {
      setSelected(null);
    } else if (!selected) {
      setSelected(m);
    } else {
      const p1 = selected;
      setSelected(null);
      startFight(p1, m);
    }
  }, [selected, startFight]);

  const handleFight = useCallback((fighter: Member) => {
    const others = members.filter(m => m.id !== fighter.id);
    if (others.length) {
      const random = others[Math.floor(Math.random() * others.length)];
      setSelected(null);
      startFight(fighter, random);
    }
  }, [members, startFight]);

  const handleExit = useCallback(() => {
    setFightData(null);
    setSelected(null);
    setPhase("select");
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      {phase === "select" && (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <GuildeHeader activePage="fighters" accentColor="#FFD700" bgColor="rgba(4,4,12,0.92)" textColor="#fff" />
          <CharacterSelect
            members={members}
            mode={mode}
            selected={selected}
            onSelect={handleSelect}
            onFight={handleFight}
          />
          {mounted && createPortal(<ViewToggle mode={mode} setMode={setMode} />, document.body)}
        </div>
      )}
      {phase === "intro" && fightData && (
        <FightIntro p1={fightData.p1} p2={fightData.p2} mode={mode} onFinish={() => setPhase("fight")} />
      )}
      {phase === "fight" && fightData && (
        <Arena p1={fightData.p1} p2={fightData.p2} mode={mode} onExit={handleExit} />
      )}
    </>
  );
}
