"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Zap, Shield, Wind } from "lucide-react";
import { type Member } from "../../data/members";
import { rankAccents } from "../config/ranks";
import type { Rank } from "../../data/members";

interface Props {
  members: Member[];
  onClose: () => void;
}

export default function Leaderboard({ members, onClose }: Props) {
  // Sort by total power (force + vitesse + technique)
  const ranked = [...members]
    .map(m => ({
      ...m,
      power: (m.stats?.force ?? 0) + (m.stats?.vitesse ?? 0) + (m.stats?.technique ?? 0),
    }))
    .sort((a, b) => b.power - a.power);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,5,16,0.95)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Orbitron', monospace",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,215,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Trophy size={20} color="#FFD700" />
          <span style={{ fontSize: "clamp(16px,3vw,22px)", fontWeight: 900, color: "#FFD700", letterSpacing: 2 }}>
            POWER RANKING
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "8px 20px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "#fff",
            fontFamily: "'Orbitron', monospace",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          RETOUR
        </button>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {ranked.map((m, i) => {
          const accent = rankAccents[m.rank as Rank] ?? "#c9a84c";
          const isTop3 = i < 3;
          const medalColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "transparent";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                marginBottom: 6,
                borderRadius: 10,
                background: isTop3 ? `${medalColor}12` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isTop3 ? `${medalColor}30` : "rgba(255,255,255,0.05)"}`,
              }}
            >
              {/* Rank number */}
              <div style={{
                width: 36, height: 36,
                borderRadius: 8,
                background: isTop3 ? `${medalColor}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${isTop3 ? `${medalColor}40` : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: isTop3 ? 16 : 13,
                  fontWeight: 900,
                  color: isTop3 ? medalColor : "rgba(255,255,255,0.4)",
                }}>
                  {i + 1}
                </span>
              </div>

              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                overflow: "hidden", flexShrink: 0,
                border: `2px solid ${accent}40`,
                background: "#0a0812",
              }}>
                {m.animeChar ? (
                  <Image src={m.animeChar} alt={m.name} width={40} height={40}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, opacity: 0.3 }}>?</span>
                  </div>
                )}
              </div>

              {/* Name & rank */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "clamp(12px,1.5vw,15px)",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {m.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 9, color: accent, fontWeight: 700, letterSpacing: 1 }}>
                  {m.rank.toUpperCase()}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }} title="Force">
                  <Zap size={10} color="#ef4444" />
                  <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>{m.stats?.force ?? 0}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }} title="Vitesse">
                  <Wind size={10} color="#38bdf8" />
                  <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700 }}>{m.stats?.vitesse ?? 0}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }} title="Technique">
                  <Shield size={10} color="#a78bfa" />
                  <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700 }}>{m.stats?.technique ?? 0}</span>
                </div>
              </div>

              {/* Total power */}
              <div style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: `${accent}15`,
                border: `1px solid ${accent}30`,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>
                  {m.power}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
