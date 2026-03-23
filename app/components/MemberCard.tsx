"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Member, rankJP } from "../../data/members";
import { useState } from "react";
import { ViewMode } from "../page";
import { User, Sword, Cake } from "lucide-react";

const rankAccents: Record<string, string> = {
  "Fondateur": "#f59e0b", "Monarque": "#c9a84c", "Ex Monarque": "#fb923c",
  "Ordre Céleste": "#7c3aed", "New G dorée": "#db2777", "Futurs Espoirs": "#2563eb",
  "Vieux Briscard": "#0d9488", "Fantôme": "#64748b", "Revenant": "#8b5cf6",
};

const darkRanks = ["Fondateur", "Monarque", "Ex Monarque", "Ordre Céleste", "Revenant"];

export default function MemberCard({ member, index, viewMode, onClick }: {
  member: Member; index: number; viewMode: ViewMode; onClick: () => void;
}) {
  const [imgErrorReal, setImgErrorReal] = useState(false);
  const [imgErrorAnime, setImgErrorAnime] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accent = rankAccents[member.rank] ?? "#111";
  const isDark = darkRanks.includes(member.rank);
  const isAnime = viewMode === "anime";
  const photoSrc = isAnime ? member.animeChar : member.photo;
  const hasError = isAnime ? imgErrorAnime : imgErrorReal;
  const onError = isAnime ? () => setImgErrorAnime(true) : () => setImgErrorReal(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        aspectRatio: "2/3",
        boxShadow: hovered
          ? `0 32px 64px rgba(0,0,0,0.28), 0 0 0 2px ${accent}, 0 0 40px ${accent}55`
          : `0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)`,
        transform: hovered
          ? "translateY(-8px) scale(1.02) perspective(1000px) rotateX(1deg)"
          : "translateY(0px) scale(1)",
        transition: "box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.23,1,0.32,1)",
        background: isDark ? "#0d0d14" : "#f5f5f2",
      }}
    >
      {/* Photo switchable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          {!hasError ? (
            <Image
              src={photoSrc}
              alt={member.name}
              fill
              className="object-cover object-top"
              onError={onError}
              style={{
                transition: "transform 0.6s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: isDark
                ? "linear-gradient(135deg, #0d0d14, #1a1a2e)"
                : "linear-gradient(135deg, #f5f5f3, #ebebeb)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "12px",
            }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: `${accent}20`, border: `2px solid ${accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isAnime
                  ? <Sword size={24} color={accent} strokeWidth={2} />
                  : <User size={24} color={accent} strokeWidth={2} />
                }
              </div>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "10px", fontWeight: 600,
                color: isDark ? "#555" : "#bbb",
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}>
                {isAnime ? "Alter ego à venir" : "Photo à venir"}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: isDark
          ? "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 35%, rgba(0,0,0,0.9) 100%)"
          : "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.82) 100%)",
        opacity: hasError ? 0 : 1,
        pointerEvents: "none",
      }} />

      {/* Glow hover */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${accent}28 0%, transparent 65%)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }} />

      {/* Accent line top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "4px",
        background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`,
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.3s ease",
      }} />

      {/* Watermark numéro */}
      <div style={{
        position: "absolute", top: "8px", right: "12px",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "72px", fontWeight: 900,
        color: accent, opacity: hovered ? 0.18 : 0.08,
        lineHeight: 1, letterSpacing: "-0.05em",
        transition: "opacity 0.4s ease",
        userSelect: "none", pointerEvents: "none",
      }}>
        {String(member.id).padStart(2, "0")}
      </div>

      {/* Badge anime */}
      {isAnime && (
        <div style={{
          position: "absolute", top: "14px", left: "14px", zIndex: 3,
          background: "rgba(0,0,0,0.6)",
          border: `1px solid ${accent}60`,
          backdropFilter: "blur(8px)",
          color: accent,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "9px", fontWeight: 800,
          letterSpacing: "0.16em", textTransform: "uppercase",
          padding: "4px 10px", borderRadius: "4px",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <Sword size={10} strokeWidth={2.5} />
          Alter Ego
        </div>
      )}

      {/* Badge membre (mode réel seulement) */}
      {!isAnime && member.badge && (
        <div style={{
          position: "absolute", top: "14px", left: "14px", zIndex: 2,
          background: accent, color: "#fff",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "9px", fontWeight: 800,
          letterSpacing: "0.16em", textTransform: "uppercase",
          padding: "4px 10px", borderRadius: "4px",
          boxShadow: `0 2px 12px ${accent}60`,
        }}>
          {member.badge}
        </div>
      )}

      {/* Info bottom */}
<div style={{
  position: "absolute", bottom: 0, left: 0, right: 0,
  padding: "20px 18px", zIndex: 2,
  background: hasError ? (isDark ? "#0d0d14" : "#fff") : "transparent",
  borderTop: hasError ? `3px solid ${accent}` : "none",
}}>
  {/* Rang */}
  <div style={{
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "11px", fontWeight: 800,
    color: accent, letterSpacing: "0.22em",
    textTransform: "uppercase", marginBottom: "4px",
  }}>
    {member.rank}
  </div>

  {/* Nom */}
  <div style={{
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "clamp(18px, 2.2vw, 26px)", fontWeight: 900,
    color: hasError ? (isDark ? "#fff" : "#111") : "#fff",
    lineHeight: 1,
    textTransform: "uppercase", letterSpacing: "-0.01em",
    fontStyle: "italic",
    textShadow: hasError ? "none" : "0 2px 12px rgba(0,0,0,0.5)",
  }}>
    {member.name}
  </div>

  {/* Anniversaire */}
  <div style={{
    display: "flex", alignItems: "center", gap: "5px",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "12px", fontWeight: 700,
    color: hasError ? accent : "rgba(255,255,255,0.65)",
    letterSpacing: "0.12em", marginTop: "7px",
    textTransform: "uppercase",
  }}>
    <Cake size={11} strokeWidth={2} />
    {member.birthday}
  </div>
</div>
    </motion.div>
  );
}