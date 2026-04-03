"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Member } from "../../data/members";
import { useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents, darkRanks } from "../config/ranks"; // ← import centralisé
import { User, Sword, Cake, Trophy } from "lucide-react";

export default function MemberCard({ member, index, viewMode, onClick, isMobile }: {
  member: Member; index: number; viewMode: ViewMode; onClick: () => void; isMobile?: boolean;
}) {
  const [imgErrorReal, setImgErrorReal] = useState(false);
  const [imgErrorAnime, setImgErrorAnime] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accent = rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c";
  const isDark  = darkRanks.includes(member.rank as any);
  const isAnime = viewMode === "anime";
  const photoSrc = isAnime ? member.animeChar : member.photo;
  const hasError = isAnime ? imgErrorAnime : imgErrorReal;
  const onError  = isAnime ? () => setImgErrorAnime(true) : () => setImgErrorReal(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      onClick={onClick}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`relative overflow-hidden cursor-pointer ${isMobile ? "rounded-xl" : "rounded-2xl"} ${isMobile ? "aspect-[3/4]" : "aspect-[2/3]"}`}
      style={{
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
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0"
        >
          {!hasError ? (
            <Image
              src={photoSrc}
              alt={member.name}
              fill
              sizes={isMobile ? "50vw" : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 230px"}
              priority={index < 4}
              className="object-cover object-top"
              onError={onError}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: isDark ? "#0d0d14" : "#f5f5f3" }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: "48px", height: "48px", background: `${accent}20`, border: `2px solid ${accent}40` }}>
                {isAnime ? <Sword size={20} color={accent} /> : <User size={20} color={accent} />}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.95) 100%)"
            : "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.82) 100%)",
          opacity: hasError ? 0 : 1,
        }}
      />

      {/* Watermark ID */}
      <div
        className="absolute font-guilde pointer-events-none leading-none tracking-tight"
        style={{
          top: isMobile ? "2px" : "8px",
          right: isMobile ? "6px" : "12px",
          fontSize: isMobile ? "40px" : "72px",
          fontWeight: 900,
          color: accent,
          opacity: hovered ? 0.18 : 0.08,
        }}
      >
        {String(member.id).padStart(2, "0")}
      </div>

      {/* Info bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ padding: isMobile ? "12px" : "20px 18px" }}>
        <div className="font-guilde font-extrabold uppercase leading-none" style={{ fontSize: isMobile ? "9px" : "11px", color: accent, letterSpacing: "0.22em", marginBottom: "2px" }}>
          {member.rank}
        </div>

        {member.badge && (
          <div className="inline-flex items-center gap-1" style={{ marginTop: "2px", marginBottom: "6px", background: "linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)", padding: isMobile ? "2px 6px" : "4px 8px", borderRadius: "4px", boxShadow: "0 4px 10px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <Trophy size={isMobile ? 10 : 12} color="#000" strokeWidth={3} />
            <span className="font-guilde font-black text-black uppercase" style={{ fontSize: isMobile ? "9px" : "10px" }}>
              {member.badge}
            </span>
          </div>
        )}

        <div className="font-guilde font-black text-white leading-none uppercase italic" style={{ fontSize: isMobile ? "18px" : "26px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
          {member.name}
        </div>
        <div className="flex items-center gap-1 font-guilde mt-1" style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
          <Cake size={isMobile ? 10 : 11} />
          {member.birthday}
        </div>
      </div>
    </motion.div>
  );
}