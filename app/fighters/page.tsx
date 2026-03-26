"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { members, Member } from "../../data/members";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight,
  Zap, Trophy, RotateCcw, Shuffle, Shield, Flame, Star,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewMode = "real" | "anime";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ostList = ["/fighter.mp3", "/fighter2.mp3", "/fighter3.mp3"];

const arenas = [
  { id: 1, name: "Cité des Flammes",  subtitle: "8ème Brigade",      bg: "/arena_fire.jpg",   color: "#f97316", accent2: "#fbbf24" },
  { id: 2, name: "Stade Galactique",  subtitle: "Inazuma Eleven",    bg: "/arena_soccer.jpg", color: "#3b82f6", accent2: "#60a5fa" },
  { id: 3, name: "Paysage Fracturé",  subtitle: "Tales of Xillia 2", bg: "/arena_xillia.jpg", color: "#a855f7", accent2: "#c084fc" },
  { id: 4, name: "Dojo Vagabond",     subtitle: "Kenshin",           bg: "/arena_dojo.jpg",   color: "#ef4444", accent2: "#f87171" },
];

const RANKS_ORDER = [
  "Fondateur","Monarque","Ex Monarque","Ordre Céleste",
  "New G dorée","Futurs Espoirs","Vieux Briscard","Fantôme","Revenant",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPowerScore(m: Member) {
  return Math.round((m.stats.force + m.stats.vitesse + m.stats.technique) / 3);
}

// ─── POWER RING ───────────────────────────────────────────────────────────────
function PowerRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: size > 50 ? "16px" : "12px", fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>PWR</span>
      </div>
    </div>
  );
}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, color, delay = 0, compact = false }: {
  label: string; value: number; color: string; delay?: number; compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? "5px" : "8px", marginBottom: compact ? "4px" : "7px" }}>
      <span style={{
        flexShrink: 0, width: "26px",
        fontSize: compact ? "8px" : "9px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.45)",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>{label}</span>
      <div style={{
        flex: 1, height: compact ? "4px" : "5px",
        background: "rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}80`,
            borderRadius: "10px",
          }}
        />
      </div>
      <span style={{
        flexShrink: 0, fontSize: compact ? "11px" : "13px", fontWeight: 900,
        width: "24px", textAlign: "right", color: "#fff",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>{value}</span>
    </div>
  );
}

// ─── FIGHTER PANEL DESKTOP ────────────────────────────────────────────────────
function FighterPanelDesktop({
  member, side, viewMode, arenaColor, onClear,
}: {
  member: Member | null; side: "left" | "right";
  viewMode: ViewMode; arenaColor: string; onClear: () => void;
}) {
  const isLeft = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const playerLabel = isLeft ? "PLAYER 1" : "PLAYER 2";
  const power = member ? getPowerScore(member) : 0;

  if (!member) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${playerColor}07 1px, transparent 1px), linear-gradient(90deg, ${playerColor}07 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${playerColor}03 2px, ${playerColor}03 4px)` }} />
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ width: "80px", height: "80px", borderRadius: "50%", border: `2px dashed ${playerColor}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
          <User size={28} color={`${playerColor}40`} />
        </motion.div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900, letterSpacing: "0.5em", color: `${playerColor}30`, textTransform: "uppercase", margin: "0 0 4px" }}>{playerLabel}</p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", color: `${playerColor}20`, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>CHOISIR UN FIGHTER</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, x: isLeft ? -60 : 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isLeft ? -40 : 40 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, position: "relative", overflow: "hidden" }}
    >
      <AnimatePresence mode="wait">
        <motion.img key={`${member.id}-${viewMode}`}
          src={viewMode === "anime" ? member.animeChar : member.photo}
          initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.45 }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          alt={member.name}
        />
      </AnimatePresence>
      <div style={{ position: "absolute", inset: 0, background: isLeft ? "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 65%, transparent 80%)" : "linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 65%, transparent 80%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, [isLeft ? "left" : "right"]: 0, width: "3px", background: `linear-gradient(to bottom, transparent, ${playerColor}, transparent)`, boxShadow: `0 0 20px ${playerColor}` }} />
      <div style={{ position: "absolute", fontSize: "200px", fontWeight: 900, fontStyle: "italic", color: playerColor, opacity: 0.03, lineHeight: 1, pointerEvents: "none", userSelect: "none", fontFamily: "'Barlow Condensed', sans-serif", [isLeft ? "right" : "left"]: "8px", top: "50%", transform: "translateY(-50%)" }}>
        {String(member.id).padStart(2, "0")}
      </div>
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 36px", alignItems: isLeft ? "flex-start" : "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: isLeft ? "row" : "row-reverse", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: `${playerColor}20`, border: `1px solid ${playerColor}50`, padding: "5px 12px", borderRadius: "100px", backdropFilter: "blur(8px)" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: playerColor, boxShadow: `0 0 8px ${playerColor}` }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "0.3em", color: playerColor }}>{playerLabel}</span>
          </div>
          {member.badge && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "linear-gradient(135deg,#b8860b,#ffd700,#b8860b)", padding: "4px 10px", borderRadius: "100px", boxShadow: "0 2px 12px rgba(255,215,0,0.4)" }}>
              <Trophy size={9} color="#000" />
              <span style={{ fontSize: "8px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>{member.badge}</span>
            </div>
          )}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClear}
            style={{ marginLeft: "auto", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
            <RotateCcw size={12} />
          </motion.button>
        </div>
        <div style={{ width: "100%", maxWidth: "320px", alignSelf: isLeft ? "flex-start" : "flex-end" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>{member.rank}</p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 3.5vw, 52px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.88, margin: "0 0 6px", fontStyle: "italic", color: "#fff", textShadow: `0 2px 30px rgba(0,0,0,0.9), 0 0 60px ${playerColor}15` }}>
            {member.name}
          </motion.h2>
          <div style={{ width: "40px", height: "2px", background: `linear-gradient(90deg, ${playerColor}, transparent)`, margin: isLeft ? "10px 0" : "10px 0 10px auto", transform: isLeft ? "none" : "scaleX(-1)" }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexDirection: isLeft ? "row" : "row-reverse" }}>
            <div style={{ flex: 1 }}>
              <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0.2} />
              <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0.3} />
              <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0.4} />
            </div>
            <PowerRing score={getPowerScore(member)} color={playerColor} size={68} />
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ marginTop: "12px", background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${playerColor}15, ${playerColor}05)`, border: `1px solid ${playerColor}25`, borderLeft: isLeft ? `3px solid ${playerColor}` : "1px solid rgba(255,255,255,0.05)", borderRight: !isLeft ? `3px solid ${playerColor}` : "1px solid rgba(255,255,255,0.05)", padding: "10px 14px", borderRadius: isLeft ? "0 8px 8px 0" : "8px 0 0 8px", backdropFilter: "blur(8px)" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: playerColor, display: "flex", alignItems: "center", gap: "6px", margin: "0 0 4px", flexDirection: isLeft ? "row" : "row-reverse" }}>
              <Zap size={10} fill={playerColor} /> COUP SPÉCIAL · {member.special.name}
            </p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4, margin: 0, textAlign: isLeft ? "left" : "right" }}>{member.special.effect}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── VS BADGE ─────────────────────────────────────────────────────────────────
function VSBadge({ p1, p2 }: { p1: Member | null; p2: Member | null }) {
  const both = p1 && p2;
  return (
    <motion.div animate={{ scale: both ? [1, 1.08, 1] : 1 }} transition={{ duration: 0.6, repeat: both ? Infinity : 0, repeatDelay: 2 }}
      style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 50, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: both ? "72px" : "48px", fontWeight: 900, fontStyle: "italic", lineHeight: 0.85, transition: "font-size 0.4s ease" }}>
        <div style={{ WebkitTextStroke: both ? "2.5px #f03e3e" : "1.5px rgba(240,62,62,0.3)", color: "transparent", filter: both ? "drop-shadow(0 0 25px #f03e3e80)" : "none", transition: "all 0.4s ease" }}>V</div>
        <div style={{ WebkitTextStroke: both ? "2.5px #3b82f6" : "1.5px rgba(59,130,246,0.3)", color: "transparent", filter: both ? "drop-shadow(0 0 25px #3b82f680)" : "none", marginTop: "-8px", transition: "all 0.4s ease" }}>S.</div>
      </div>
      {both && <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, #f03e3e, #3b82f6)", marginTop: "4px" }} />}
    </motion.div>
  );
}

// ─── ROSTER CARD ──────────────────────────────────────────────────────────────
function RosterCard({ member, isP1, isP2, isDimmed, onClick, viewMode, isMobile }: {
  member: Member; isP1: boolean; isP2: boolean;
  isDimmed: boolean; onClick: () => void; viewMode: ViewMode; isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const power = getPowerScore(member);
  const borderColor = isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)";

  return (
    <motion.button layout whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.92 }}
      onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "2/3", padding: 0,
        background: isP1 ? "rgba(240,62,62,0.1)" : isP2 ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
        cursor: "pointer", position: "relative", borderRadius: isMobile ? "6px" : "10px",
        border: `1.5px solid ${borderColor}`, overflow: "hidden",
        opacity: isDimmed ? 0.2 : 1,
        filter: isDimmed ? "grayscale(100%) brightness(0.5)" : "none",
        boxShadow: isP1 ? "0 0 20px rgba(240,62,62,0.5), 0 0 40px rgba(240,62,62,0.2)" : isP2 ? "0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(59,130,246,0.2)" : hovered ? "0 8px 24px rgba(0,0,0,0.6)" : "none",
        transition: "all 0.25s ease",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.img key={viewMode} src={viewMode === "anime" ? member.animeChar : member.photo}
          initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
          alt={member.name}
        />
      </AnimatePresence>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: isMobile ? "4px" : "6px", left: 0, right: 0, textAlign: "center", padding: "0 3px" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "8px" : "10px", fontWeight: 900, textTransform: "uppercase", color: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.85)", lineHeight: 1 }}>
          {member.name.split(" ")[0]}
        </div>
        <div style={{ margin: isMobile ? "2px 4px 0" : "3px 6px 0", height: "2px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${power}%`, background: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.4)", borderRadius: "2px", transition: "background 0.3s" }} />
        </div>
      </div>
      {member.badge && (
        <div style={{ position: "absolute", top: isMobile ? "3px" : "5px", right: isMobile ? "3px" : "5px", background: "linear-gradient(135deg,#FFDF00,#D4AF37)", borderRadius: "50%", padding: isMobile ? "2px" : "3px", boxShadow: "0 1px 6px rgba(255,215,0,0.6)" }}>
          <Trophy size={isMobile ? 6 : 8} color="#000" />
        </div>
      )}
      {(isP1 || isP2) && (
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, background: isP1 ? "linear-gradient(90deg,#f03e3e,#f87171)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", color: "#fff", fontSize: isMobile ? "7px" : "8px", fontWeight: 900, padding: isMobile ? "2px 0" : "3px 0", textAlign: "center", letterSpacing: "0.2em", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {isP1 ? "P1" : "P2"}
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── MOBILE FIGHTER INFO CARD ─────────────────────────────────────────────────
// Le nouveau composant clé : affiche tout les infos du fighter sélectionné
function MobileFighterInfoCard({
  member, side, viewMode, onClear, arenaColor,
}: {
  member: Member; side: "left" | "right";
  viewMode: ViewMode; onClear: () => void; arenaColor: string;
}) {
  const isLeft = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const playerLabel = isLeft ? "PLAYER 1" : "PLAYER 2";
  const power = getPowerScore(member);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7))`,
        border: `1px solid ${playerColor}30`,
        borderRadius: "14px",
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 30px ${playerColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Barre colorée en haut */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, ${playerColor}, ${playerColor}80, transparent)` }} />

      {/* Contenu principal */}
      <div style={{ display: "flex", gap: "0", minHeight: "130px" }}>

        {/* Photo */}
        <div style={{ width: "90px", flexShrink: 0, position: "relative", overflow: "hidden", borderRadius: "0 0 0 13px" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={`${member.id}-${viewMode}`}
              src={viewMode === "anime" ? member.animeChar : member.photo}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
              alt={member.name}
            />
          </AnimatePresence>
          {/* Gradient sur la photo */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 50%, rgba(0,0,0,0.7))" }} />
          {/* Label P1/P2 */}
          <div style={{
            position: "absolute", top: "6px", left: "6px",
            background: playerColor, borderRadius: "4px",
            padding: "2px 6px",
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 900, color: "#fff", letterSpacing: "0.15em",
          }}>{isLeft ? "P1" : "P2"}</div>
        </div>

        {/* Infos */}
        <div style={{ flex: 1, padding: "10px 12px 10px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>

          {/* Header : nom + power ring + clear */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "0.25em", color: playerColor, margin: "0 0 2px", textTransform: "uppercase" }}>
                {playerLabel}
              </p>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "20px", fontWeight: 900, textTransform: "uppercase",
                fontStyle: "italic", color: "#fff", lineHeight: 0.9,
                margin: "0 0 2px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{member.name}</h3>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
                {member.rank}
              </p>
              {member.badge && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "linear-gradient(135deg,#b8860b,#ffd700)", padding: "2px 6px", borderRadius: "4px", marginTop: "4px" }}>
                  <Trophy size={7} color="#000" />
                  <span style={{ fontSize: "7px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>{member.badge}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <PowerRing score={power} color={playerColor} size={52} />
              <motion.button whileTap={{ scale: 0.85 }} onClick={onClear}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "3px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 700 }}>
                <RotateCcw size={9} /> CHANGER
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop: "8px" }}>
            <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0.1} compact />
            <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0.2} compact />
            <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0.3} compact />
          </div>
        </div>
      </div>

      {/* Coup spécial — section dédiée */}
      <div style={{
        margin: "0 10px 10px",
        background: `linear-gradient(90deg, ${playerColor}12, ${playerColor}06)`,
        border: `1px solid ${playerColor}25`,
        borderLeft: `3px solid ${playerColor}`,
        borderRadius: "0 8px 8px 0",
        padding: "8px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
          <Zap size={10} fill={playerColor} color={playerColor} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 900, color: playerColor, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            COUP SPÉCIAL
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            · {member.special.name}
          </span>
        </div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.6)", lineHeight: 1.45, margin: 0 }}>
          {member.special.effect}
        </p>
      </div>

      {/* Coin décoratif */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", background: `radial-gradient(circle at 100% 0%, ${playerColor}15, transparent 70%)`, pointerEvents: "none" }} />
    </motion.div>
  );
}

// ─── MOBILE EMPTY SLOT ────────────────────────────────────────────────────────
function MobileEmptySlot({ side, arenaColor }: { side: "left" | "right"; arenaColor: string }) {
  const isLeft = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "relative", overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
        border: `1px dashed ${playerColor}20`,
        borderRadius: "14px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "8px", minHeight: "100px",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${playerColor}05 1px, transparent 1px), linear-gradient(90deg, ${playerColor}05 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
        style={{ width: "40px", height: "40px", borderRadius: "50%", border: `2px dashed ${playerColor}25`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <User size={18} color={`${playerColor}35`} />
      </motion.div>
      <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, color: `${playerColor}30`, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 2px" }}>
          {isLeft ? "PLAYER 1" : "PLAYER 2"}
        </p>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", color: `${playerColor}20`, letterSpacing: "0.15em", margin: 0 }}>
          Sélectionne un fighter
        </p>
      </div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function FightersPage() {
  const [p1, setP1] = useState<Member | null>(null);
  const [p2, setP2] = useState<Member | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [arenaIdx, setArenaIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [filterRank, setFilterRank] = useState<string>("Tous");

  const isMobile = useIsMobile(900);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentArena = arenas[arenaIdx];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.35;
  }, []);

  const toggleSound = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else { audioRef.current.volume = 0.35; audioRef.current.play().catch(() => {}); }
    setIsPlaying(p => !p);
  }, [isPlaying]);

  const nextTrack = useCallback(() => setTrackIdx(p => (p + 1) % ostList.length), []);
  const nextArena  = useCallback(() => setArenaIdx(p => (p + 1) % arenas.length), []);
  const prevArena  = useCallback(() => setArenaIdx(p => (p - 1 + arenas.length) % arenas.length), []);

  const selectMember = (member: Member) => {
    if (p1?.id === member.id) { setP1(null); return; }
    if (p2?.id === member.id) { setP2(null); return; }
    if (!p1) { setP1(member); return; }
    if (!p2) { setP2(member); return; }
  };

  const randomFight = () => {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    setP1(shuffled[0]);
    setP2(shuffled[1]);
  };

  const filteredMembers = filterRank === "Tous"
    ? members
    : members.filter(m => m.rank === filterRank);

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{
        minHeight: "100dvh", width: "100vw",
        display: "flex", flexDirection: "column",
        background: "#060608", overflowX: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative",
      }}>
        <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />

        {/* BG Arène */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div key={currentArena.id}
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
              style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentArena.bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(1.5)" }}
            />
          </AnimatePresence>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${currentArena.color}12, transparent 60%)` }} />
        </div>

        {/* ── HEADER ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${currentArena.color}20`,
        }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "16px", fontWeight: 900 }}>←</Link>

          {/* Arène */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}><ChevronLeft size={14} /></button>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{currentArena.subtitle}</p>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color, textShadow: `0 0 12px ${currentArena.color}` }}>{currentArena.name}</p>
            </div>
            <button onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}><ChevronRight size={14} /></button>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: "7px", padding: "2px", gap: "1px" }}>
              {(["real", "anime"] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "5px 8px", borderRadius: "5px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900,
                  background: viewMode === m ? currentArena.color : "transparent",
                  color: viewMode === m ? "#fff" : "rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", transition: "all 0.2s",
                }}>{m === "real" ? <User size={11} /> : <Sword size={11} />}</button>
              ))}
            </div>
            <button onClick={toggleSound} style={{
              background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "7px",
              padding: "6px 8px", cursor: "pointer",
              color: isPlaying ? currentArena.color : "rgba(255,255,255,0.3)", display: "flex",
            }}>
              {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>
        </header>

        <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── SECTION FIGHTERS SÉLECTIONNÉS ── */}
          <div style={{ padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: "8px" }}>

            {/* VS Banner quand les deux sont choisis */}
            <AnimatePresence>
              {p1 && p2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "12px", padding: "8px 16px",
                    background: "rgba(0,0,0,0.5)", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Miniature P1 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "2px solid #f03e3e", flexShrink: 0 }}>
                      <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt="" />
                    </div>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, color: "#f03e3e", textTransform: "uppercase" }}>{p1.name.split(" ")[0]}</span>
                  </div>

                  {/* VS */}
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, fontStyle: "italic", lineHeight: 1, textAlign: "center" }}>
                    <span style={{ WebkitTextStroke: "1.5px #f03e3e", color: "transparent" }}>V</span>
                    <span style={{ WebkitTextStroke: "1.5px #3b82f6", color: "transparent" }}>S</span>
                  </div>

                  {/* Miniature P2 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, color: "#3b82f6", textTransform: "uppercase" }}>{p2.name.split(" ")[0]}</span>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "2px solid #3b82f6", flexShrink: 0 }}>
                      <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt="" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cards P1 et P2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <AnimatePresence mode="wait">
                {p1 ? (
                  <MobileFighterInfoCard key={`p1-${p1.id}`} member={p1} side="left"  viewMode={viewMode} onClear={() => setP1(null)} arenaColor={currentArena.color} />
                ) : (
                  <MobileEmptySlot key="p1-empty" side="left"  arenaColor={currentArena.color} />
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {p2 ? (
                  <MobileFighterInfoCard key={`p2-${p2.id}`} member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} arenaColor={currentArena.color} />
                ) : (
                  <MobileEmptySlot key="p2-empty" side="right" arenaColor={currentArena.color} />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── TOOLBAR : Random + filtres rang ── */}
          <div style={{
            flexShrink: 0, display: "flex", gap: "6px",
            padding: "6px 12px",
            overflowX: "auto", WebkitOverflowScrolling: "touch",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={randomFight}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "5px",
                background: `${currentArena.color}20`, border: `1px solid ${currentArena.color}40`,
                borderRadius: "100px", padding: "5px 12px", cursor: "pointer",
                color: currentArena.color,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "0.1em",
              }}>
              <Shuffle size={10} /> RANDOM
            </motion.button>
            {["Tous", ...RANKS_ORDER].map(rank => (
              <button key={rank} onClick={() => setFilterRank(rank)} style={{
                flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "9px", fontWeight: 800, padding: "5px 10px",
                borderRadius: "100px", cursor: "pointer", letterSpacing: "0.06em",
                background: filterRank === rank ? currentArena.color : "rgba(255,255,255,0.04)",
                color: filterRank === rank ? "#000" : "rgba(255,255,255,0.4)",
                border: `1px solid ${filterRank === rank ? currentArena.color : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.2s", textTransform: "uppercase",
              }}>
                {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* ── ROSTER ── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "8px 10px",
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
            gap: "5px", alignContent: "start",
          }}>
            <AnimatePresence>
              {filteredMembers.map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.012 }}
                >
                  <RosterCard
                    member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id}
                    isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)}
                    onClick={() => selectMember(m)}
                    viewMode={viewMode} isMobile
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT (identique à la version précédente, inchangé)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", flexDirection: "column",
      background: "#050506", overflow: "hidden",
      fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative",
    }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />
      <style>{`
        .rscroll::-webkit-scrollbar { width: 3px; }
        .rscroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .rscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* BG */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentArena.id}
            initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentArena.bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.18) saturate(1.6)" }}
          />
        </AnimatePresence>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />
        <motion.div key={currentArena.id} animate={{ opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 4, repeat: Infinity }}
          style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${currentArena.color}30, transparent 60%)` }} />
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${currentArena.color}60, transparent)` }} />
      </div>

      {/* Header desktop */}
      <header style={{
        position: "relative", zIndex: 30, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "64px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
        borderBottom: `1px solid ${currentArena.color}15`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 900, letterSpacing: "0.2em" }}>← GUILDE OTAKU</Link>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, fontStyle: "italic" }}>
            <span style={{ color: currentArena.color }}>SELECT</span> FIGHTER
          </div>
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", padding: "8px 20px", borderRadius: "100px", border: `1px solid ${currentArena.color}25` }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }}><ChevronLeft size={16} /></motion.button>
          <div style={{ textAlign: "center", minWidth: "160px" }}>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{currentArena.subtitle}</p>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "17px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color, textShadow: `0 0 20px ${currentArena.color}80` }}>{currentArena.name}</p>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }}><ChevronRight size={16} /></motion.button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={randomFight}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: `${currentArena.color}15`, border: `1px solid ${currentArena.color}35`, borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900, color: currentArena.color, letterSpacing: "0.1em" }}>
            <Shuffle size={12} /> RANDOM FIGHT
          </motion.button>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", borderRadius: "8px", padding: "3px", border: "1px solid rgba(255,255,255,0.06)", gap: "2px" }}>
            {(["real", "anime"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "5px 13px", borderRadius: "5px", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
                background: viewMode === m ? currentArena.color : "transparent",
                color: viewMode === m ? "#fff" : "rgba(255,255,255,0.35)",
                boxShadow: viewMode === m ? `0 2px 12px ${currentArena.color}50` : "none",
                transition: "all 0.25s ease",
              }}>
                {m === "real" ? <User size={11} /> : <Sword size={11} />}
                {m === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSound}
            style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: `1px solid ${isPlaying ? currentArena.color + "40" : "rgba(255,255,255,0.07)"}`, borderRadius: "8px", cursor: "pointer", color: isPlaying ? currentArena.color : "rgba(255,255,255,0.35)", transition: "all 0.25s ease" }}>
            {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </motion.button>
        </div>
      </header>

      {/* Layout principal */}
      <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 10, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <FighterPanelDesktop key={`p1-${p1?.id ?? "empty"}`} member={p1} side="left" viewMode={viewMode} arenaColor={currentArena.color} onClear={() => setP1(null)} />
        </AnimatePresence>

        {/* Roster central */}
        <div className="rscroll" style={{ width: "340px", flexShrink: 0, background: "rgba(4,4,6,0.88)", backdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)", zIndex: 30, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "16px 14px 10px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={14} color={currentArena.color} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "#fff" }}>
                  {filteredMembers.length} <span style={{ color: currentArena.color }}>FIGHTERS</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[{p: p1, c: "#f03e3e", l: "P1"}, {p: p2, c: "#3b82f6", l: "P2"}].map(({p, c, l}) => (
                  <div key={l} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, padding: "3px 8px", borderRadius: "4px", background: p ? `${c}20` : "rgba(255,255,255,0.04)", border: `1px solid ${p ? c + "50" : "rgba(255,255,255,0.06)"}`, color: p ? c : "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
                    {l} {p ? "✓" : "—"}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {["Tous", ...RANKS_ORDER].map(rank => (
                <button key={rank} onClick={() => setFilterRank(rank)} style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "0.06em",
                  padding: "3px 8px", borderRadius: "100px", cursor: "pointer",
                  background: filterRank === rank ? currentArena.color : "rgba(255,255,255,0.04)",
                  color: filterRank === rank ? "#000" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${filterRank === rank ? currentArena.color : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.2s", textTransform: "uppercase",
                }}>
                  {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "7px", padding: "10px", alignContent: "start" }}>
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((m, i) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.25, delay: i * 0.012 }}>
                  <RosterCard member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id} isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)} onClick={() => selectMember(m)} viewMode={viewMode} isMobile={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <FighterPanelDesktop key={`p2-${p2?.id ?? "empty"}`} member={p2} side="right" viewMode={viewMode} arenaColor={currentArena.color} onClear={() => setP2(null)} />
        </AnimatePresence>
      </div>

      <VSBadge p1={p1} p2={p2} />
    </div>
  );
}
