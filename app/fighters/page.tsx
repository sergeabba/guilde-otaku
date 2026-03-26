"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { members, Member } from "../../data/members";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight,
  Zap, Trophy, RotateCcw, Shuffle, Shield, Flame,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewMode = "real" | "anime";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ostList = ["/fighter.mp3", "/fighter2.mp3", "/fighter3.mp3"];

const arenas = [
  { id: 1, name: "Cité des Flammes",  subtitle: "8ème Brigade",      bg: "/arena_fire.jpg",   color: "#f97316", accent2: "#fbbf24", particle: "#f9731640" },
  { id: 2, name: "Stade Galactique",  subtitle: "Inazuma Eleven",    bg: "/arena_soccer.jpg", color: "#3b82f6", accent2: "#60a5fa", particle: "#3b82f640" },
  { id: 3, name: "Paysage Fracturé",  subtitle: "Tales of Xillia 2", bg: "/arena_xillia.jpg", color: "#a855f7", accent2: "#c084fc", particle: "#a855f740" },
  { id: 4, name: "Dojo Vagabond",     subtitle: "Kenshin",           bg: "/arena_dojo.jpg",   color: "#ef4444", accent2: "#f87171", particle: "#ef444440" },
];

const RANKS_ORDER = [
  "Fondateur","Monarque","Ex Monarque","Ordre Céleste",
  "New G dorée","Futurs Espoirs","Vieux Briscard","Fantôme","Revenant"
];

// ─── POWER SCORE ─────────────────────────────────────────────────────────────
function getPowerScore(m: Member) {
  return Math.round((m.stats.force + m.stats.vitesse + m.stats.technique) / 3);
}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, color, delay = 0 }: {
  label: string; value: number; color: string; delay?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
      <span style={{
        flexShrink: 0, width: "26px",
        fontSize: "9px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.45)",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>{label}</span>
      <div style={{
        flex: 1, height: "5px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "10px", overflow: "hidden",
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
        flexShrink: 0, fontSize: "13px", fontWeight: 900,
        width: "26px", textAlign: "right", color: "#fff",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>{value}</span>
    </div>
  );
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
          stroke={color} strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>PWR</span>
      </div>
    </div>
  );
}

// ─── FIGHTER PANEL (DESKTOP) ──────────────────────────────────────────────────
function FighterPanel({
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
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(${playerColor}08 1px, transparent 1px),
            linear-gradient(90deg, ${playerColor}08 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />
        {/* Scanlines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${playerColor}04 2px, ${playerColor}04 4px)`,
        }} />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: "80px", height: "80px", borderRadius: "50%",
            border: `2px dashed ${playerColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 2,
          }}
        >
          <User size={28} color={`${playerColor}40`} />
        </motion.div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px", fontWeight: 900, letterSpacing: "0.5em",
            color: `${playerColor}30`, textTransform: "uppercase", margin: "0 0 4px",
          }}>{playerLabel}</p>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "9px", color: `${playerColor}20`,
            letterSpacing: "0.2em", textTransform: "uppercase", margin: 0,
          }}>CHOISIR UN FIGHTER</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, x: isLeft ? -60 : 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isLeft ? -40 : 40, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, position: "relative", overflow: "hidden" }}
    >
      {/* Photo plein écran */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${member.id}-${viewMode}`}
          src={viewMode === "anime" ? member.animeChar : member.photo}
          initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.45 }}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "top center",
          }}
          alt={member.name}
        />
      </AnimatePresence>

      {/* Gradients overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: isLeft
          ? "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 65%, transparent 80%)"
          : "linear-gradient(to left,  rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 65%, transparent 80%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
      }} />

      {/* Couleur du joueur en bord */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        [isLeft ? "left" : "right"]: 0, width: "3px",
        background: `linear-gradient(to bottom, transparent 0%, ${playerColor} 30%, ${playerColor} 70%, transparent 100%)`,
        boxShadow: `0 0 20px ${playerColor}`,
      }} />

      {/* Coin accent */}
      <div style={{
        position: "absolute",
        top: 0,
        [isLeft ? "left" : "right"]: 0,
        width: "120px", height: "120px",
        background: `radial-gradient(circle at ${isLeft ? "0% 0%" : "100% 0%"}, ${playerColor}20, transparent 70%)`,
      }} />

      {/* ID watermark */}
      <div style={{
        position: "absolute",
        [isLeft ? "right" : "left"]: "8px",
        top: "50%", transform: "translateY(-50%)",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "200px", fontWeight: 900, fontStyle: "italic",
        color: playerColor, opacity: 0.03, lineHeight: 1,
        pointerEvents: "none", userSelect: "none",
      }}>
        {String(member.id).padStart(2, "0")}
      </div>

      {/* Contenu */}
      <div style={{
        position: "relative", zIndex: 10,
        height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "28px 36px",
        alignItems: isLeft ? "flex-start" : "flex-end",
      }}>
        {/* TOP : player label + bouton clear */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          flexDirection: isLeft ? "row" : "row-reverse",
          width: "100%",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: `${playerColor}20`,
            border: `1px solid ${playerColor}50`,
            padding: "5px 12px", borderRadius: "100px",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: playerColor, boxShadow: `0 0 8px ${playerColor}` }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "0.3em", color: playerColor }}>{playerLabel}</span>
          </div>
          {member.badge && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)",
              padding: "4px 10px", borderRadius: "100px",
              boxShadow: "0 2px 12px rgba(255,215,0,0.4)",
            }}>
              <Trophy size={9} color="#000" />
              <span style={{ fontSize: "8px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>{member.badge}</span>
            </div>
          )}
          {/* Clear button */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClear}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "50%", width: "28px", height: "28px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <RotateCcw size={12} />
          </motion.button>
        </div>

        {/* BOTTOM : infos du fighter */}
        <div style={{ width: "100%", maxWidth: "320px", alignSelf: isLeft ? "flex-start" : "flex-end" }}>
          {/* Rang */}
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "10px", fontWeight: 800, letterSpacing: "0.3em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
            margin: "0 0 4px",
          }}>{member.rank}</p>

          {/* Nom */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(28px, 3.5vw, 52px)",
              fontWeight: 900, textTransform: "uppercase",
              lineHeight: 0.88, margin: "0 0 6px", fontStyle: "italic",
              color: "#fff",
              textShadow: `0 2px 30px rgba(0,0,0,0.9), 0 0 60px ${playerColor}15`,
            }}
          >{member.name}</motion.h2>

          {/* Séparateur */}
          <div style={{
            width: "40px", height: "2px",
            background: `linear-gradient(90deg, ${playerColor}, transparent)`,
            margin: isLeft ? "10px 0" : "10px 0 10px auto",
            transform: isLeft ? "none" : "scaleX(-1)",
          }} />

          {/* Stats + Power Ring */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexDirection: isLeft ? "row" : "row-reverse" }}>
            <div style={{ flex: 1 }}>
              <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0.2} />
              <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0.3} />
              <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0.4} />
            </div>
            <PowerRing score={power} color={playerColor} size={68} />
          </div>

          {/* Coup spécial */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: "12px",
              background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${playerColor}15, ${playerColor}05)`,
              border: `1px solid ${playerColor}25`,
              borderLeft: isLeft ? `3px solid ${playerColor}` : "1px solid rgba(255,255,255,0.05)",
              borderRight: !isLeft ? `3px solid ${playerColor}` : "1px solid rgba(255,255,255,0.05)",
              padding: "10px 14px",
              borderRadius: isLeft ? "0 8px 8px 0" : "8px 0 0 8px",
              backdropFilter: "blur(8px)",
            }}
          >
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.15em", color: playerColor,
              display: "flex", alignItems: "center", gap: "6px",
              margin: "0 0 4px",
              flexDirection: isLeft ? "row" : "row-reverse",
            }}>
              <Zap size={10} fill={playerColor} />
              COUP SPÉCIAL · {member.special.name}
            </p>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "11px", color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4, margin: 0,
              textAlign: isLeft ? "left" : "right",
            }}>{member.special.effect}</p>
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
    <motion.div
      animate={{ scale: both ? [1, 1.08, 1] : 1 }}
      transition={{ duration: 0.6, repeat: both ? Infinity : 0, repeatDelay: 2 }}
      style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50, pointerEvents: "none",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0",
      }}
    >
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: both ? "72px" : "48px",
        fontWeight: 900, fontStyle: "italic", lineHeight: 0.85,
        transition: "font-size 0.4s ease",
      }}>
        <div style={{
          WebkitTextStroke: both ? "2.5px #f03e3e" : "1.5px rgba(240,62,62,0.3)",
          color: "transparent",
          filter: both ? "drop-shadow(0 0 25px #f03e3e80)" : "none",
          transition: "all 0.4s ease",
        }}>V</div>
        <div style={{
          WebkitTextStroke: both ? "2.5px #3b82f6" : "1.5px rgba(59,130,246,0.3)",
          color: "transparent",
          filter: both ? "drop-shadow(0 0 25px #3b82f680)" : "none",
          marginTop: "-8px",
          transition: "all 0.4s ease",
        }}>S.</div>
      </div>
      {both && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          style={{
            width: "60px", height: "1px",
            background: "linear-gradient(90deg, #f03e3e, #3b82f6)",
            marginTop: "4px",
          }}
        />
      )}
    </motion.div>
  );
}

// ─── ROSTER CARD ──────────────────────────────────────────────────────────────
function RosterCard({
  member, isP1, isP2, isDimmed, onClick, viewMode, isMobile,
}: {
  member: Member; isP1: boolean; isP2: boolean;
  isDimmed: boolean; onClick: () => void; viewMode: ViewMode; isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const power = getPowerScore(member);
  const borderColor = isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)";
  const glowColor = isP1 ? "rgba(240,62,62,0.5)" : isP2 ? "rgba(59,130,246,0.5)" : "none";

  return (
    <motion.button
      layout
      whileHover={{ scale: 1.06, y: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "2/3", padding: 0,
        background: isP1 ? "rgba(240,62,62,0.1)" : isP2 ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
        cursor: "pointer", position: "relative",
        borderRadius: isMobile ? "6px" : "10px",
        border: `1.5px solid ${borderColor}`,
        overflow: "hidden",
        opacity: isDimmed ? 0.2 : 1,
        filter: isDimmed ? "grayscale(100%) brightness(0.5)" : "none",
        boxShadow: isP1 || isP2 ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}` : hovered ? "0 8px 24px rgba(0,0,0,0.6)" : "none",
        transition: "all 0.25s ease",
      }}
    >
      {/* Photo */}
      <AnimatePresence mode="wait">
        <motion.img
          key={viewMode}
          src={viewMode === "anime" ? member.animeChar : member.photo}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
          alt={member.name}
        />
      </AnimatePresence>

      {/* Gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "65%",
        background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
      }} />

      {/* Hover overlay */}
      {hovered && !isP1 && !isP2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.04)",
          }}
        />
      )}

      {/* Nom */}
      <div style={{
        position: "absolute", bottom: isMobile ? "4px" : "6px",
        left: 0, right: 0, textAlign: "center", padding: "0 3px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isMobile ? "8px" : "10px", fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.02em",
          color: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.85)",
          lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}>
          {member.name.split(" ")[0]}
        </div>
        {/* Mini power bar */}
        <div style={{
          margin: isMobile ? "2px 4px 0" : "3px 6px 0",
          height: "2px", background: "rgba(255,255,255,0.08)", borderRadius: "2px",
        }}>
          <div style={{
            height: "100%", width: `${power}%`,
            background: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.4)",
            borderRadius: "2px", transition: "background 0.3s",
          }} />
        </div>
      </div>

      {/* Badge trophée */}
      {member.badge && (
        <div style={{
          position: "absolute", top: isMobile ? "3px" : "5px", right: isMobile ? "3px" : "5px",
          background: "linear-gradient(135deg, #FFDF00, #D4AF37)",
          borderRadius: "50%", padding: isMobile ? "2px" : "3px",
          boxShadow: "0 1px 6px rgba(255,215,0,0.6)",
        }}>
          <Trophy size={isMobile ? 6 : 8} color="#000" />
        </div>
      )}

      {/* Label P1 / P2 */}
      {(isP1 || isP2) && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            background: isP1
              ? "linear-gradient(90deg, #f03e3e, #f87171)"
              : "linear-gradient(90deg, #3b82f6, #60a5fa)",
            color: "#fff", fontSize: isMobile ? "7px" : "8px", fontWeight: 900,
            padding: isMobile ? "2px 0" : "3px 0", textAlign: "center",
            letterSpacing: "0.2em", fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {isP1 ? "P1" : "P2"}
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── MOBILE FIGHTER CARD ──────────────────────────────────────────────────────
function MobileFighterCard({
  member, side, viewMode, onClear,
}: {
  member: Member | null; side: "left" | "right";
  viewMode: ViewMode; onClear: () => void;
}) {
  const isLeft = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const playerNum = isLeft ? "P1" : "P2";
  const power = member ? getPowerScore(member) : 0;

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: "200px" }}>
      <AnimatePresence mode="wait">
        {member ? (
          <motion.div
            key={member.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {/* Photo */}
            <AnimatePresence mode="wait">
              <motion.img
                key={`${member.id}-${viewMode}`}
                src={viewMode === "anime" ? member.animeChar : member.photo}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", position: "absolute", inset: 0 }}
                alt={member.name}
              />
            </AnimatePresence>
            {/* Gradient */}
            <div style={{ position: "absolute", inset: 0, background: isLeft ? "linear-gradient(to right, rgba(0,0,0,0.75) 0%, transparent 50%), linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 55%)" : "linear-gradient(to left, rgba(0,0,0,0.75) 0%, transparent 50%), linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 55%)" }} />
            {/* Infos */}
            <div style={{ position: "absolute", bottom: "10px", left: isLeft ? "10px" : "auto", right: isLeft ? "auto" : "10px", textAlign: isLeft ? "left" : "right" }}>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "0.3em", color: playerColor }}>{playerNum}</p>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", color: "#fff", lineHeight: 1 }}>
                {member.name.split(" ")[0]}
              </p>
              {/* Mini stats */}
              <div style={{ marginTop: "6px", width: "110px" }}>
                <StatBar label="FOR" value={member.stats.force}     color="#f03e3e" delay={0} />
                <StatBar label="VIT" value={member.stats.vitesse}   color="#fbbf24" delay={0} />
                <StatBar label="TEC" value={member.stats.technique} color="#3b82f6" delay={0} />
              </div>
            </div>
            {/* Bord coloré */}
            <div style={{ position: "absolute", top: 0, bottom: 0, [isLeft ? "left" : "right"]: 0, width: "2px", background: `linear-gradient(to bottom, transparent, ${playerColor}, transparent)` }} />
            {/* Clear button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClear}
              style={{
                position: "absolute", top: "6px", [isLeft ? "right" : "left"]: "6px",
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%",
                width: "24px", height: "24px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.6)",
              }}
            >
              <RotateCcw size={10} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}
          >
            <div style={{ backgroundImage: `linear-gradient(${playerColor}06 1px, transparent 1px), linear-gradient(90deg, ${playerColor}06 1px, transparent 1px)`, backgroundSize: "24px 24px", position: "absolute", inset: 0 }} />
            <User size={28} color={`${playerColor}25`} style={{ position: "relative", zIndex: 2 }} />
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, color: `${playerColor}25`, letterSpacing: "0.3em", margin: 0, position: "relative", zIndex: 2 }}>{playerNum}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [showRankFilter, setShowRankFilter] = useState(false);

  const isMobile = useIsMobile(900);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentArena = arenas[arenaIdx];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.35;
  }, []);

  const toggleSound = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.volume = 0.35; audioRef.current.play().catch(() => {}); }
    setIsPlaying(p => !p);
  }, [isPlaying]);

  const nextTrack = useCallback(() => setTrackIdx(p => (p + 1) % ostList.length), []);
  const nextArena  = useCallback(() => setArenaIdx(p => (p + 1) % arenas.length), []);
  const prevArena  = useCallback(() => setArenaIdx(p => (p - 1 + arenas.length) % arenas.length), []);

  const handleSelect = useCallback((member: Member) => {
    setP1(prev => {
      if (prev?.id === member.id) return null;
      setP2(prev2 => {
        if (prev2?.id === member.id) return null;
        if (!prev) return prev2;
        if (!prev2) return member;
        return prev2;
      });
      if (!prev) return member;
      return prev;
    });
  }, []);

  // Version plus simple et lisible du handleSelect
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

  // ── MOBILE ────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        height: "100dvh", width: "100vw", display: "flex", flexDirection: "column",
        background: "#060608", overflow: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative",
      }}>
        <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />

        {/* BG Arène */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentArena.id}
              initial={{ opacity: 0 }} animate={{ opacity: 0.18 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${currentArena.bg})`,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: "saturate(1.5)",
              }}
            />
          </AnimatePresence>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${currentArena.color}10, transparent 70%)` }} />
        </div>

        {/* Header mobile */}
        <header style={{
          position: "relative", zIndex: 20, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${currentArena.color}20`,
        }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "18px", fontWeight: 900 }}>←</Link>

          {/* Arène picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}><ChevronLeft size={14} /></button>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{currentArena.subtitle}</p>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color, textShadow: `0 0 12px ${currentArena.color}` }}>{currentArena.name}</p>
            </div>
            <button onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}><ChevronRight size={14} /></button>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "5px" }}>
            {/* View toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: "6px", padding: "2px", gap: "1px" }}>
              {(["real", "anime"] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
                  background: viewMode === m ? currentArena.color : "transparent",
                  color: viewMode === m ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "all 0.2s",
                }}>{m === "real" ? <User size={10} /> : <Sword size={10} />}</button>
              ))}
            </div>
            <button onClick={toggleSound} style={{
              background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "6px",
              padding: "5px 7px", cursor: "pointer",
              color: isPlaying ? currentArena.color : "rgba(255,255,255,0.3)", display: "flex",
            }}>
              {isPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
          </div>
        </header>

        {/* Zone combat */}
        <div style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          height: "210px", display: "flex",
          borderBottom: `1px solid ${currentArena.color}15`,
        }}>
          <MobileFighterCard member={p1} side="left"  viewMode={viewMode} onClear={() => setP1(null)} />

          {/* VS Centre */}
          <div style={{
            flexShrink: 0, width: "46px", zIndex: 5,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "4px",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}>
            {p1 && p2 ? (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, fontStyle: "italic", lineHeight: 0.85 }}>
                  <div style={{ WebkitTextStroke: "1.5px #f03e3e", color: "transparent" }}>V</div>
                  <div style={{ WebkitTextStroke: "1.5px #3b82f6", color: "transparent" }}>S.</div>
                </div>
              </motion.div>
            ) : (
              <>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", border: `1.5px dashed ${p1 ? "rgba(59,130,246,0.4)" : "rgba(240,62,62,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 900, color: p1 ? "rgba(59,130,246,0.5)" : "rgba(240,62,62,0.3)" }}>{p1 ? "P2" : "P1"}</span>
                </div>
              </>
            )}
          </div>

          <MobileFighterCard member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} />
        </div>

        {/* Toolbar mobile : random + filter par rang */}
        <div style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          display: "flex", gap: "6px", padding: "8px 10px",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          {/* Random */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={randomFight}
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: "5px",
              background: `${currentArena.color}20`,
              border: `1px solid ${currentArena.color}40`,
              borderRadius: "100px", padding: "5px 12px", cursor: "pointer",
              color: currentArena.color,
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "0.1em",
            }}
          >
            <Shuffle size={10} /> RANDOM
          </motion.button>

          {/* Filtres rang */}
          {["Tous", ...RANKS_ORDER].map(rank => (
            <button
              key={rank}
              onClick={() => setFilterRank(rank)}
              style={{
                flexShrink: 0,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 800,
                padding: "5px 10px", borderRadius: "100px", cursor: "pointer", letterSpacing: "0.08em",
                background: filterRank === rank ? currentArena.color : "rgba(255,255,255,0.04)",
                color: filterRank === rank ? "#000" : "rgba(255,255,255,0.4)",
                border: `1px solid ${filterRank === rank ? currentArena.color : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.2s",
                textTransform: "uppercase",
              }}
            >
              {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Roster mobile */}
        <div style={{
          flex: 1, overflowY: "auto", position: "relative", zIndex: 10,
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "5px",
          alignContent: "start",
        }}>
          <AnimatePresence>
            {filteredMembers.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.015 }}
              >
                <RosterCard
                  member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id}
                  isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)}
                  onClick={() => selectMember(m)}
                  viewMode={viewMode} isMobile={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────────
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
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* BG Arène */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentArena.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${currentArena.bg})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "brightness(0.18) saturate(1.6)",
            }}
          />
        </AnimatePresence>
        {/* Vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)" }} />
        {/* Scanline subtile */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />
        {/* Couleur arène */}
        <motion.div
          key={currentArena.id}
          animate={{ opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${currentArena.color}30, transparent 60%)` }}
        />
        {/* Ligne du bas */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${currentArena.color}60, transparent)` }}
        />
      </div>

      {/* Header desktop */}
      <header style={{
        position: "relative", zIndex: 30, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
        height: "64px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
        borderBottom: `1px solid ${currentArena.color}15`,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{
            color: "rgba(255,255,255,0.5)", textDecoration: "none",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "12px", fontWeight: 900, letterSpacing: "0.2em",
            display: "flex", alignItems: "center", gap: "6px",
            transition: "color 0.2s",
          }}>
            ← GUILDE OTAKU
          </Link>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.05em" }}>
            <span style={{ color: currentArena.color }}>SELECT</span> FIGHTER
          </div>
        </div>

        {/* Center — Arène */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "12px",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)",
          padding: "8px 20px", borderRadius: "100px",
          border: `1px solid ${currentArena.color}25`,
          boxShadow: `0 0 20px ${currentArena.color}10`,
        }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }}><ChevronLeft size={16} /></motion.button>
          <div style={{ textAlign: "center", minWidth: "160px" }}>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{currentArena.subtitle}</p>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "17px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color, textShadow: `0 0 20px ${currentArena.color}80` }}>{currentArena.name}</p>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }}><ChevronRight size={16} /></motion.button>
        </div>

        {/* Right — controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Random Fight */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={randomFight}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: `${currentArena.color}15`,
              border: `1px solid ${currentArena.color}35`,
              borderRadius: "8px", padding: "7px 14px", cursor: "pointer",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900,
              color: currentArena.color, letterSpacing: "0.1em",
              transition: "all 0.2s",
            }}
          >
            <Shuffle size={12} /> RANDOM FIGHT
          </motion.button>

          {/* View Mode */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", borderRadius: "8px", padding: "3px", border: "1px solid rgba(255,255,255,0.06)", gap: "2px" }}>
            {(["real", "anime"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.1em",
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

          {/* Sound */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleSound}
            style={{
              width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
              border: `1px solid ${isPlaying ? currentArena.color + "40" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "8px", cursor: "pointer",
              color: isPlaying ? currentArena.color : "rgba(255,255,255,0.35)",
              transition: "all 0.25s ease",
            }}
          >
            {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </motion.button>
        </div>
      </header>

      {/* Layout principal */}
      <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 10, overflow: "hidden" }}>

        {/* P1 Panel */}
        <AnimatePresence mode="wait">
          <FighterPanel
            key={`p1-${p1?.id ?? "empty"}`}
            member={p1} side="left"
            viewMode={viewMode} arenaColor={currentArena.color}
            onClear={() => setP1(null)}
          />
        </AnimatePresence>

        {/* ── ROSTER CENTRAL ── */}
        <div
          className="rscroll"
          style={{
            width: "340px", flexShrink: 0,
            background: "rgba(4,4,6,0.88)",
            backdropFilter: "blur(24px)",
            borderLeft: `1px solid rgba(255,255,255,0.04)`,
            borderRight: `1px solid rgba(255,255,255,0.04)`,
            zIndex: 30, display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Header roster */}
          <div style={{
            padding: "16px 14px 10px", flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(0,0,0,0.3)",
            position: "sticky", top: 0, zIndex: 10,
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={14} color={currentArena.color} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "#fff" }}>
                  {filteredMembers.length} <span style={{ color: currentArena.color }}>FIGHTERS</span>
                </span>
              </div>
              {/* P1/P2 indicateur */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[{p: p1, c: "#f03e3e", l: "P1"}, {p: p2, c: "#3b82f6", l: "P2"}].map(({p, c, l}) => (
                  <div key={l} style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 900,
                    padding: "3px 8px", borderRadius: "4px",
                    background: p ? `${c}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${p ? c + "50" : "rgba(255,255,255,0.06)"}`,
                    color: p ? c : "rgba(255,255,255,0.2)",
                    letterSpacing: "0.1em",
                  }}>
                    {l} {p ? "✓" : "—"}
                  </div>
                ))}
              </div>
            </div>
            {/* Filtres par rang */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {["Tous", ...RANKS_ORDER].map(rank => (
                <button
                  key={rank}
                  onClick={() => setFilterRank(rank)}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "8px", fontWeight: 800, letterSpacing: "0.06em",
                    padding: "3px 8px", borderRadius: "100px", cursor: "pointer",
                    background: filterRank === rank ? currentArena.color : "rgba(255,255,255,0.04)",
                    color: filterRank === rank ? "#000" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${filterRank === rank ? currentArena.color : "rgba(255,255,255,0.06)"}`,
                    transition: "all 0.2s", textTransform: "uppercase",
                  }}
                >
                  {rank === "Tous" ? "ALL" : rank.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Grille 4 colonnes */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "7px", padding: "10px",
            alignContent: "start",
          }}>
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25, delay: i * 0.012 }}
                >
                  <RosterCard
                    member={m} isP1={p1?.id === m.id} isP2={p2?.id === m.id}
                    isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)}
                    onClick={() => selectMember(m)}
                    viewMode={viewMode} isMobile={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* P2 Panel */}
        <AnimatePresence mode="wait">
          <FighterPanel
            key={`p2-${p2?.id ?? "empty"}`}
            member={p2} side="right"
            viewMode={viewMode} arenaColor={currentArena.color}
            onClear={() => setP2(null)}
          />
        </AnimatePresence>
      </div>

      {/* VS Badge flottant */}
      <VSBadge p1={p1} p2={p2} />
    </div>
  );
}
