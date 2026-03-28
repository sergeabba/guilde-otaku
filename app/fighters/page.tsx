"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { members, Member } from "../../data/members";
import { useIsMobile } from "../hooks/useIsMobile";
import { Zap, Trophy, RotateCcw, Shuffle, User, Sword, ChevronLeft, ChevronRight } from "lucide-react";
import { font, colors } from "../../outputs/styles/tokens";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewMode = "real" | "anime";

const RANKS_ORDER = [
  "Fondateur","Monarque","Ex Monarque","Ordre Céleste",
  "New G dorée","Futurs Espoirs","Vieux Briscard","Fantôme","Revenant",
];

function getPower(m: Member) {
  return Math.round((m.stats.force + m.stats.vitesse + m.stats.technique) / 3);
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  .fighters-root {
    min-height: 100dvh;
    background: #08080f;
    color: #fff;
    font-family: '${font}';
    overflow: hidden;
    position: relative;
  }

  /* Scanlines CRT */
  .fighters-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.08) 2px,
      rgba(0,0,0,0.08) 4px
    );
    pointer-events: none;
    z-index: 999;
  }

  /* ── TITLE SCREEN ── */
  .vs-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(80px, 18vw, 220px);
    line-height: 0.85;
    letter-spacing: 0.02em;
    text-align: center;
    text-transform: uppercase;
  }
  .vs-title .p1-color { color: #f03e3e; filter: drop-shadow(0 0 30px #f03e3e); }
  .vs-title .vs-text  {
    -webkit-text-stroke: 3px #fff;
    color: transparent;
    font-size: clamp(40px, 8vw, 100px);
    display: block;
    filter: drop-shadow(0 0 20px rgba(255,255,255,0.4));
  }
  .vs-title .p2-color { color: #3b82f6; filter: drop-shadow(0 0 30px #3b82f6); }

  /* ── FIGHTER SLOT ── */
  .fighter-slot {
    position: relative;
    overflow: hidden;
    flex: 1;
    min-height: 0;
  }

  .fighter-slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  /* Gradient latéral selon le côté */
  .fighter-slot.left  .slot-gradient { background: linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.05) 70%, transparent 100%); }
  .fighter-slot.right .slot-gradient { background: linear-gradient(to left,  rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.05) 70%, transparent 100%); }
  .slot-gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  /* Gradient bas */
  .slot-gradient-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 40%;
    background: linear-gradient(to top, rgba(0,0,0,0.98), transparent);
    pointer-events: none;
  }

  /* ── PLAYER BADGE ── */
  .player-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 4px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    letter-spacing: 0.1em;
  }

  /* ── STAT BAR ── */
  .stat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .stat-label { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); width: 28px; flex-shrink: 0; }
  .stat-track { flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
  .stat-fill  { height: 100%; border-radius: 3px; }
  .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #fff; width: 26px; text-align: right; flex-shrink: 0; }

  /* ── POWER RING ── */
  .power-ring { position: relative; flex-shrink: 0; }
  .power-ring-label {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    line-height: 1;
  }

  /* ── ROSTER CARD ── */
  .roster-card {
    position: relative;
    aspect-ratio: 2/3;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }
  .roster-card:hover { transform: translateY(-4px) scale(1.04); }
  .roster-card img   { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .roster-card .card-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 55%;
    background: linear-gradient(to top, rgba(0,0,0,0.97), transparent);
  }
  .roster-card .card-name {
    position: absolute; bottom: 5px; left: 0; right: 0;
    text-align: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 11px;
    letter-spacing: 0.05em;
    color: #fff;
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .roster-card .card-power-bar {
    position: absolute; bottom: 0; left: 4px; right: 4px;
    height: 2px;
    background: rgba(255,255,255,0.1);
    border-radius: 1px;
  }
  .roster-card .card-power-fill {
    height: 100%;
    border-radius: 1px;
    transition: background 0.3s;
  }
  .roster-card .card-badge {
    position: absolute; top: 4px; right: 4px;
    background: linear-gradient(135deg,#FFDF00,#D4AF37);
    border-radius: 50%;
    width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .roster-card .player-tag {
    position: absolute; top: 0; left: 0; right: 0;
    text-align: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 10px;
    letter-spacing: 0.15em;
    padding: 3px 0;
  }

  /* ── SPECIAL MOVE BOX ── */
  .special-box {
    border-radius: 8px;
    padding: 10px 14px;
  }
  .special-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 13px;
    letter-spacing: 0.2em;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .special-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    line-height: 1.45;
  }

  /* ── EMPTY SLOT ── */
  .empty-slot {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    position: relative;
  }
  .empty-slot-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .empty-slot-pulse {
    width: 72px; height: 72px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2;
  }
  .empty-slot-text { position: relative; z-index: 2; text-align: center; }

  /* ── HEALTH BAR (déco) ── */
  .hbar-track {
    height: 10px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
    flex: 1;
  }
  .hbar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ade80, #22c55e);
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  /* ── READY FLASH ── */
  @keyframes readyFlash {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }
  .ready-flash { animation: readyFlash 0.8s ease-in-out infinite; }

  /* ── COIN INSERT ── */
  @keyframes coinBlink {
    0%,49%  { opacity: 1; }
    50%,100% { opacity: 0; }
  }
  .coin-blink { animation: coinBlink 1s step-end infinite; }

  /* ── MOBILE ROSTER SCROLL ── */
  .roster-scroll::-webkit-scrollbar { display: none; }

  @keyframes slideInLeft  { from { opacity:0; transform: translateX(-60px); } to { opacity:1; transform: translateX(0); } }
  @keyframes slideInRight { from { opacity:0; transform: translateX(60px);  } to { opacity:1; transform: translateX(0); } }
  @keyframes zoomIn       { from { opacity:0; transform: scale(1.08) blur(8px); } to { opacity:1; transform: scale(1) blur(0); } }
`;

// ─── POWER RING ───────────────────────────────────────────────────────────────
function PowerRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="power-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: [0.22,1,0.36,1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="power-ring-label">
        <span style={{ fontSize: size > 55 ? "18px" : "13px", fontWeight: 900, color, fontFamily: "'Bebas Neue', sans-serif" }}>{score}</span>
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontFamily: font }}>PWR</span>
      </div>
    </div>
  );
}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <motion.div
          className="stat-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.22,1,0.36,1], delay }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ─── FIGHTER INFO PANEL ───────────────────────────────────────────────────────
function FighterInfoPanel({
  member, side, viewMode, onClear,
}: {
  member: Member; side: "left" | "right";
  viewMode: ViewMode; onClear: () => void;
}) {
  const isLeft       = side === "left";
  const playerColor  = isLeft ? "#f03e3e" : "#3b82f6";
  const playerLabel  = isLeft ? "PLAYER 1" : "PLAYER 2";
  const power        = getPower(member);
  const align        = isLeft ? "flex-start" : "flex-end";
  const textAlign    = isLeft ? "left" : "right";

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isLeft ? -20 : 20 }}
      transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
      className={`fighter-slot ${side}`}
    >
      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${member.id}-${viewMode}`}
          src={viewMode === "anime" ? member.animeChar : member.photo}
          alt={member.name}
          initial={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1,    filter: "blur(0px)" }}
          exit={{   opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      {/* Gradients */}
      <div className="slot-gradient" />
      <div className="slot-gradient-bottom" />

      {/* Barre colorée latérale */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        [isLeft ? "left" : "right"]: 0,
        width: "3px",
        background: `linear-gradient(to bottom, transparent, ${playerColor}, transparent)`,
        boxShadow: `0 0 20px ${playerColor}`,
      }} />

      {/* Numéro watermark */}
      <div style={{
        position: "absolute", top: "50%", [isLeft ? "right" : "left"]: "12px",
        transform: "translateY(-50%)",
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "180px", fontStyle: "italic",
        color: playerColor, opacity: 0.04,
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
      }}>
        {String(member.id).padStart(2, "0")}
      </div>

      {/* Contenu texte */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 32px",
        alignItems: align,
      }}>
        {/* TOP : badge player + clear */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: isLeft ? "row" : "row-reverse" }}>
          <div className="player-badge" style={{ background: `${playerColor}20`, border: `1px solid ${playerColor}60`, color: playerColor }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: playerColor, boxShadow: `0 0 8px ${playerColor}` }} />
            {playerLabel}
          </div>
          {member.badge && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "linear-gradient(135deg,#b8860b,#ffd700)", padding: "3px 10px", borderRadius: "100px", boxShadow: "0 2px 12px rgba(255,215,0,0.4)" }}>
              <Trophy size={9} color="#000" />
              <span style={{ fontFamily: font, fontSize: "8px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>{member.badge}</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClear}
            style={{ marginLeft: "auto", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", minHeight: "unset", minWidth: "unset" }}
          >
            <RotateCcw size={12} />
          </motion.button>
        </div>

        {/* BOTTOM : nom + stats */}
        <div style={{ width: "100%", maxWidth: "320px", alignSelf: isLeft ? "flex-start" : "flex-end" }}>

          {/* Barre HP décorative */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexDirection: isLeft ? "row" : "row-reverse" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", color: playerColor, letterSpacing: "0.2em" }}>HP</span>
            <div className="hbar-track">
              <motion.div className="hbar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, 60 + power / 5)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
              />
            </div>
          </div>

          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", marginBottom: "4px", textAlign }}>
            {member.rank}
          </p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(28px, 3.8vw, 58px)",
              fontWeight: 900,
              lineHeight: 0.88,
              textTransform: "uppercase",
              color: "#fff",
              textAlign,
              marginBottom: "12px",
              textShadow: `0 2px 30px rgba(0,0,0,0.9), 0 0 60px ${playerColor}20`,
            }}
          >
            {member.name}
          </motion.h2>

          {/* Ligne déco */}
          <div style={{ width: "40px", height: "2px", background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${playerColor}, transparent)`, marginBottom: "14px", marginLeft: isLeft ? 0 : "auto" }} />

          {/* Stats + power ring */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexDirection: isLeft ? "row" : "row-reverse" }}>
            <div style={{ flex: 1 }}>
              <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0.2} />
              <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0.3} />
              <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0.4} />
            </div>
            <PowerRing score={power} color={playerColor} size={72} />
          </div>

          {/* Coup spécial */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="special-box"
            style={{
              marginTop: "14px",
              background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${playerColor}12, ${playerColor}05)`,
              border: `1px solid ${playerColor}25`,
              borderLeft:  isLeft  ? `3px solid ${playerColor}` : `1px solid rgba(255,255,255,0.05)`,
              borderRight: !isLeft ? `3px solid ${playerColor}` : `1px solid rgba(255,255,255,0.05)`,
              borderRadius: isLeft ? "0 8px 8px 0" : "8px 0 0 8px",
            }}
          >
            <div className="special-title" style={{ color: playerColor, flexDirection: isLeft ? "row" : "row-reverse" }}>
              <Zap size={11} fill={playerColor} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em" }}>COUP SPÉCIAL</span>
              <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>· {member.special.name}</span>
            </div>
            <p className="special-desc" style={{ textAlign }}>{member.special.effect}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── EMPTY SLOT ───────────────────────────────────────────────────────────────
function EmptySlot({ side }: { side: "left" | "right" }) {
  const isLeft      = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const playerLabel = isLeft ? "PLAYER 1" : "PLAYER 2";

  return (
    <div className="empty-slot">
      <div className="empty-slot-grid" />
      <motion.div
        className="empty-slot-pulse"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ border: `2px dashed ${playerColor}30`, background: `${playerColor}06` }}
      >
        <User size={28} color={`${playerColor}40`} />
      </motion.div>
      <div className="empty-slot-text">
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.4em", color: `${playerColor}40`, margin: "0 0 4px" }}>
          {playerLabel}
        </p>
        <p style={{ fontFamily: font, fontSize: "10px", color: `${playerColor}25`, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
          Choisis ton fighter
        </p>
      </div>
    </div>
  );
}

// ─── VS CENTER ────────────────────────────────────────────────────────────────
function VSCenter({ p1, p2 }: { p1: Member | null; p2: Member | null }) {
  const both = !!(p1 && p2);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 50, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <motion.div
        animate={{ scale: both ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.7, repeat: both ? Infinity : 0, repeatDelay: 2 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: both ? "72px" : "52px", lineHeight: 0.85, transition: "font-size 0.4s" }}>
          <div style={{ WebkitTextStroke: both ? "3px #f03e3e" : "2px rgba(240,62,62,0.3)", color: "transparent", filter: both ? "drop-shadow(0 0 25px #f03e3e80)" : "none", transition: "all 0.4s" }}>V</div>
          <div style={{ WebkitTextStroke: both ? "3px #3b82f6" : "2px rgba(59,130,246,0.3)", color: "transparent", filter: both ? "drop-shadow(0 0 25px #3b82f680)" : "none", marginTop: "-10px", transition: "all 0.4s" }}>S.</div>
        </div>
      </motion.div>
      {both && (
        <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
          style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, #f03e3e, #3b82f6)" }} />
      )}
    </div>
  );
}

// ─── ROSTER CARD ─────────────────────────────────────────────────────────────
function RosterCard({ member, isP1, isP2, isDimmed, onClick, viewMode }: {
  member: Member; isP1: boolean; isP2: boolean;
  isDimmed: boolean; onClick: () => void; viewMode: ViewMode;
}) {
  const power       = getPower(member);
  const borderColor = isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "transparent";
  const glow        = isP1
    ? "0 0 20px rgba(240,62,62,0.6), 0 0 40px rgba(240,62,62,0.2)"
    : isP2
    ? "0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.2)"
    : "none";

  return (
    <motion.button
      whileHover={{ scale: isDimmed ? 1 : 1.06, y: isDimmed ? 0 : -3 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="roster-card"
      style={{
        borderColor,
        boxShadow: glow,
        opacity: isDimmed ? 0.2 : 1,
        filter: isDimmed ? "grayscale(80%) brightness(0.5)" : "none",
        background: isP1 ? "rgba(240,62,62,0.08)" : isP2 ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
        padding: 0, minHeight: "unset", minWidth: "unset",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={viewMode}
          src={viewMode === "anime" ? member.animeChar : member.photo}
          alt={member.name}
          initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>
      <div className="card-overlay" />
      <div className="card-name">{member.name.split(" ")[0]}</div>
      <div className="card-power-bar">
        <div className="card-power-fill" style={{ width: `${power}%`, background: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.35)" }} />
      </div>
      {member.badge && (
        <div className="card-badge"><Trophy size={8} color="#000" /></div>
      )}
      {(isP1 || isP2) && (
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          className="player-tag"
          style={{ background: isP1 ? "linear-gradient(90deg,#f03e3e,#f87171)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", color: "#fff" }}
        >
          {isP1 ? "P1" : "P2"}
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── MOBILE FIGHTER CARD ──────────────────────────────────────────────────────
function MobileFighterCard({ member, side, viewMode, onClear }: {
  member: Member; side: "left" | "right"; viewMode: ViewMode; onClear: () => void;
}) {
  const isLeft      = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const power       = getPower(member);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "relative", overflow: "hidden",
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${playerColor}30`,
        borderRadius: "12px",
        backdropFilter: "blur(16px)",
        boxShadow: `0 0 30px ${playerColor}15`,
      }}
    >
      <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, ${playerColor}, transparent)` }} />
      <div style={{ display: "flex", gap: 0 }}>
        {/* Photo */}
        <div style={{ width: "86px", flexShrink: 0, position: "relative", overflow: "hidden", borderRadius: "0 0 0 11px" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={`${member.id}-${viewMode}`}
              src={viewMode === "anime" ? member.animeChar : member.photo}
              alt={member.name}
              initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
            />
          </AnimatePresence>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(0,0,0,0.6))" }} />
          <div style={{ position: "absolute", top: 5, left: 5, background: playerColor, borderRadius: "4px", padding: "2px 6px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "0.15em", color: "#fff" }}>
            {isLeft ? "P1" : "P2"}
          </div>
        </div>

        {/* Infos */}
        <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "8px", letterSpacing: "0.25em", color: playerColor, margin: "0 0 2px", textTransform: "uppercase" }}>
                {member.rank}
              </p>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", textTransform: "uppercase", color: "#fff", lineHeight: 0.9, margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {member.name}
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0, marginLeft: "8px" }}>
              <PowerRing score={power} color={playerColor} size={48} />
              <motion.button whileTap={{ scale: 0.85 }} onClick={onClear}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontFamily: font, fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px", minHeight: "unset", minWidth: "unset" }}>
                <RotateCcw size={8} /> CHANGER
              </motion.button>
            </div>
          </div>

          <div>
            <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0.1} />
            <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0.2} />
            <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0.3} />
          </div>
        </div>
      </div>

      {/* Coup spécial */}
      <div style={{ margin: "0 10px 10px", background: `${playerColor}10`, border: `1px solid ${playerColor}20`, borderLeft: `3px solid ${playerColor}`, borderRadius: "0 6px 6px 0", padding: "7px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
          <Zap size={9} fill={playerColor} color={playerColor} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "0.2em", color: playerColor }}>COUP SPÉCIAL · {member.special.name}</span>
        </div>
        <p style={{ fontFamily: font, fontSize: "10px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4, margin: 0 }}>{member.special.effect}</p>
      </div>
    </motion.div>
  );
}

// ─── MOBILE EMPTY ─────────────────────────────────────────────────────────────
function MobileEmpty({ side }: { side: "left" | "right" }) {
  const playerColor = side === "left" ? "#f03e3e" : "#3b82f6";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: "rgba(255,255,255,0.02)", border: `1px dashed ${playerColor}18`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "90px", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${playerColor}05 1px, transparent 1px), linear-gradient(90deg, ${playerColor}05 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
        style={{ width: "36px", height: "36px", borderRadius: "50%", border: `2px dashed ${playerColor}25`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <User size={16} color={`${playerColor}35`} />
      </motion.div>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "0.3em", color: `${playerColor}30`, margin: 0, position: "relative", zIndex: 2 }}>
        {side === "left" ? "PLAYER 1" : "PLAYER 2"}
      </p>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function FightersPage() {
  const [p1,         setP1]         = useState<Member | null>(null);
  const [p2,         setP2]         = useState<Member | null>(null);
  const [viewMode,   setViewMode]   = useState<ViewMode>("anime");
  const [filterRank, setFilterRank] = useState("Tous");

  const isMobile = useIsMobile(900);

  const selectMember = useCallback((m: Member) => {
    if (p1?.id === m.id) { setP1(null); return; }
    if (p2?.id === m.id) { setP2(null); return; }
    if (!p1) { setP1(m); return; }
    if (!p2) { setP2(m); return; }
  }, [p1, p2]);

  const randomFight = () => {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    setP1(shuffled[0]);
    setP2(shuffled[1]);
  };

  // Navigation clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setP1(null); setP2(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredMembers = filterRank === "Tous"
    ? members
    : members.filter(m => m.rank === filterRank);

  const bothSelected = !!(p1 && p2);

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="fighters-root" style={{ display: "flex", flexDirection: "column", overflow: "hidden auto" }}>
        <style>{CSS}</style>

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← GUILDE</Link>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", letterSpacing: "0.15em" }}>
            <span style={{ color: "#f03e3e" }}>SELECT</span>
            <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 6px" }}>·</span>
            <span style={{ color: "#3b82f6" }}>FIGHTER</span>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
            {(["real","anime"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: "5px 9px", borderRadius: "5px", border: "none", cursor: "pointer", background: viewMode === m ? "#c9a84c" : "transparent", color: viewMode === m ? "#fff" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", minHeight: "unset", minWidth: "unset" }}>
                {m === "real" ? <User size={12} /> : <Sword size={12} />}
              </button>
            ))}
          </div>
        </header>

        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* VS Banner compact */}
          <AnimatePresence>
            {bothSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "10px 16px", background: "rgba(0,0,0,0.5)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", overflow: "hidden", border: "2px solid #f03e3e" }}>
                    <img src={viewMode === "anime" ? p1!.animeChar : p1!.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt="" />
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#f03e3e" }}>{p1!.name.split(" ")[0]}</span>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", lineHeight: 1 }}>
                  <span style={{ WebkitTextStroke: "1.5px #f03e3e", color: "transparent" }}>V</span>
                  <span style={{ WebkitTextStroke: "1.5px #3b82f6", color: "transparent" }}>S</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#3b82f6" }}>{p2!.name.split(" ")[0]}</span>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", overflow: "hidden", border: "2px solid #3b82f6" }}>
                    <img src={viewMode === "anime" ? p2!.animeChar : p2!.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt="" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slots P1 / P2 */}
          <AnimatePresence mode="wait">
            {p1 ? <MobileFighterCard key={`p1-${p1.id}`} member={p1} side="left"  viewMode={viewMode} onClear={() => setP1(null)} />
                : <MobileEmpty key="p1-empty" side="left" />}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {p2 ? <MobileFighterCard key={`p2-${p2.id}`} member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} />
                : <MobileEmpty key="p2-empty" side="right" />}
          </AnimatePresence>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "6px", padding: "6px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch" as any, background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }} className="roster-scroll">
          <motion.button whileTap={{ scale: 0.9 }} onClick={randomFight}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "5px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "100px", padding: "5px 12px", cursor: "pointer", color: "#c9a84c", fontFamily: font, fontSize: "9px", fontWeight: 900, letterSpacing: "0.1em", minHeight: "unset", minWidth: "unset" }}>
            <Shuffle size={10} /> RANDOM
          </motion.button>
          {["Tous", ...RANKS_ORDER].map(rank => (
            <button key={rank} onClick={() => setFilterRank(rank)} style={{ flexShrink: 0, fontFamily: font, fontSize: "9px", fontWeight: 800, padding: "5px 10px", borderRadius: "100px", cursor: "pointer", background: filterRank === rank ? "#c9a84c" : "rgba(255,255,255,0.04)", color: filterRank === rank ? "#000" : "rgba(255,255,255,0.4)", border: `1px solid ${filterRank === rank ? "#c9a84c" : "rgba(255,255,255,0.06)"}`, textTransform: "uppercase", letterSpacing: "0.06em", minHeight: "unset", minWidth: "unset" }}>
              {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Roster */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px", alignContent: "start" }}>
          <AnimatePresence>
            {filteredMembers.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.01 }}>
                <RosterCard member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id} isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)} onClick={() => selectMember(m)} viewMode={viewMode} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fighters-root" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Fond noise + gradient ambient */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(240,62,62,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.06) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", opacity: 0.025 }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{ position: "relative", zIndex: 30, flexShrink: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← GUILDE OTAKU</Link>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "0.15em" }}>
            <span style={{ color: "#f03e3e", filter: "drop-shadow(0 0 8px #f03e3e60)" }}>SELECT</span>
            {" "}
            <span style={{ color: "rgba(255,255,255,0.3)" }}>YOUR</span>
            {" "}
            <span style={{ color: "#3b82f6", filter: "drop-shadow(0 0 8px #3b82f660)" }}>FIGHTER</span>
          </div>
        </div>

        {/* Insert coin si rien de sélectionné */}
        <AnimatePresence>
          {!bothSelected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
              <p className="coin-blink" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.4em", color: "rgba(255,215,0,0.7)" }}>
                INSERT COIN
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {bothSelected && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <p className="ready-flash" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", letterSpacing: "0.4em", color: "#4ade80", filter: "drop-shadow(0 0 12px #4ade8080)" }}>
              FIGHT !
            </p>
          </motion.div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={randomFight}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: font, fontSize: "11px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <Shuffle size={12} /> RANDOM
          </motion.button>

          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
            {(["real","anime"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ fontFamily: font, fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 14px", borderRadius: "5px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", background: viewMode === m ? "#c9a84c" : "transparent", color: viewMode === m ? "#fff" : "rgba(255,255,255,0.35)", boxShadow: viewMode === m ? "0 2px 12px rgba(201,168,76,0.4)" : "none", transition: "all 0.25s", minHeight: "unset", minWidth: "unset" }}>
                {m === "real" ? <User size={11} /> : <Sword size={11} />}
                {m === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT : P1 | ROSTER | P2 ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 10 }}>

        {/* FIGHTER P1 */}
        <AnimatePresence mode="wait">
          {p1
            ? <FighterInfoPanel key={`p1-${p1.id}`} member={p1} side="left"  viewMode={viewMode} onClear={() => setP1(null)} />
            : <EmptySlot key="p1-empty" side="left" />
          }
        </AnimatePresence>

        {/* ROSTER CENTRAL */}
        <div style={{ width: "360px", flexShrink: 0, background: "rgba(4,4,8,0.92)", backdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)", zIndex: 30, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Sticky header roster */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(4,4,8,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px 10px" }}>

            {/* Score P1 vs P2 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "0.3em", color: "#f03e3e40", margin: "0 0 1px" }}>P1</p>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#f03e3e", margin: 0, lineHeight: 1 }}>{p1 ? p1.name.split(" ")[0] : "—"}</p>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "12px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)" }}>VS</div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "0.3em", color: "#3b82f640", margin: "0 0 1px" }}>P2</p>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#3b82f6", margin: 0, lineHeight: 1 }}>{p2 ? p2.name.split(" ")[0] : "—"}</p>
              </div>
            </div>

            {/* Filtres rang */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {["Tous", ...RANKS_ORDER].map(rank => (
                <button key={rank} onClick={() => setFilterRank(rank)}
                  style={{ fontFamily: font, fontSize: "8px", fontWeight: 800, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: "100px", cursor: "pointer", background: filterRank === rank ? "#c9a84c" : "rgba(255,255,255,0.04)", color: filterRank === rank ? "#000" : "rgba(255,255,255,0.35)", border: `1px solid ${filterRank === rank ? "#c9a84c" : "rgba(255,255,255,0.06)"}`, transition: "all 0.2s", textTransform: "uppercase", minHeight: "unset", minWidth: "unset" }}>
                  {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Compteur */}
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", margin: "8px 0 0", textAlign: "center" }}>
              {filteredMembers.length} FIGHTERS
            </p>
          </div>

          {/* Grille roster */}
          <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "7px", alignContent: "start" }}>
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((m, i) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.22, delay: i * 0.01 }}>
                  <RosterCard member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id} isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)} onClick={() => selectMember(m)} viewMode={viewMode} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* FIGHTER P2 */}
        <AnimatePresence mode="wait">
          {p2
            ? <FighterInfoPanel key={`p2-${p2.id}`} member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} />
            : <EmptySlot key="p2-empty" side="right" />
          }
        </AnimatePresence>

        {/* VS badge flottant */}
        <VSCenter p1={p1} p2={p2} />
      </div>
    </div>
  );
}