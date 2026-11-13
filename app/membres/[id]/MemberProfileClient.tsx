"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { rankAccents, rankJapanese, Rank } from "../../config/ranks";

interface MemberRow {
  id: number;
  name: string;
  rank: string;
}

export default function MemberProfileClient({ member }: { member: MemberRow }) {
  const router = useRouter();

  useEffect(() => {
    // Petit délai de transition pour laisser apprécier l'intro manga du dossier
    const timer = setTimeout(() => {
      router.replace(`/?membre=${member.id}`);
    }, 450);
    return () => clearTimeout(timer);
  }, [member.id, router]);

  const accent = rankAccents[member.rank as Rank] ?? "#c9a84c";
  const jpRank = rankJapanese[member.rank as Rank] ?? "冒険者";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#08070d",
        color: "#fff",
        fontFamily: "'Barlow Condensed', sans-serif",
        flexDirection: "column",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial anime glow */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Trame Manga / Screentone */}
      <div
        className="manga-screentone"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          color: "#fff",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span className="kanji-stamp">
            『照合中』
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            DOSSIER D&apos;AVENTURIER
          </span>
        </div>

        <p
          className="font-bricolage"
          style={{
            fontSize: "clamp(32px, 8vw, 48px)",
            fontWeight: 800,
            textTransform: "uppercase",
            lineHeight: 1,
            color: "#fff",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          {member.name}
        </p>

        <p
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: "24px",
          }}
        >
          {member.rank} • <span style={{ color: accent }}>『{jpRank}』</span>
        </p>

        {/* Loading bar animation */}
        <div
          style={{
            width: "160px",
            height: "3px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "3px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "60%",
              height: "100%",
              background: accent,
              borderRadius: "3px",
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
        </div>

        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginTop: "16px",
          }}
        >
          Accès au registre officiel...
        </p>
      </motion.div>
    </div>
  );
}
