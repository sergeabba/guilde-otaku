"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Rank, Member } from "../data/members";
import { supabase } from "../lib/supabase";
import MemberCard from "./components/MemberCard";
import MemberModal from "./components/MemberModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Sword, Sparkles, ArrowRight, Palette } from "lucide-react";
import { rankAccents, rankBg, rankLogos, darkRanks } from "./config/ranks";
import GuildeHeader from "./components/GuildeHeader";
import { useIsMobile } from "./hooks/useIsMobile";
import type { ViewMode } from "./types";

export type { ViewMode }; // ré-exporté pour rétro-compat si importé ailleurs

export default function HomePage() {
  const [activeRank, setActiveRank] = useState<Rank | "Tous">("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [members, setMembers] = useState<Member[]>([]);
  const isMobile = useIsMobile(); // ← hook centralisé

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from("fighters").select("*").order("id", { ascending: true });
      if (data) {
        setMembers(data.map(m => ({
          ...m,
          animeChar: m.animechar,
          rankJP: m.rankjp
        })));
      }
    };
    fetchMembers();
  }, []);

  const theme  = rankBg[activeRank] ?? rankBg["Tous"];
  const accent = rankAccents[activeRank as Rank | "Tous"];
  const isDark = darkRanks.includes(activeRank as Rank);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesRank   = activeRank === "Tous" || m.rank === activeRank;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRank && matchesSearch;
    });
  }, [activeRank, searchTerm, members]);

  // ─── VIEW TOGGLE mémoïsé pour éviter les re-renders inutiles ───────────────
  const ViewToggle = useMemo(() => (
    <div style={{
      display: "flex",
      background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      borderRadius: "100px",
      padding: "4px",
    }}>
      {(["real", "anime"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          style={{
            padding: "6px 14px",
            borderRadius: "100px",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "12px",
            fontWeight: 900,
            textTransform: "uppercase",
            background: viewMode === mode ? accent : "transparent",
            color: viewMode === mode ? "#fff" : (isDark ? "#aaa" : "#666"),
            transition: "all 0.3s",
          }}
        >
          {mode === "real" ? "Réel" : "Anime"}
        </button>
      ))}
    </div>
  ), [viewMode, accent, isDark]);

  return (
    <motion.div
      animate={{ backgroundColor: theme.bg }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        minHeight: "100vh",
        color: theme.text,
        overflowX: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif",
        position: "relative",
      }}
    >

      {/* floatSlow est défini dans globals.css — pas besoin de le rédéfinir ici */}

      {/* ── ARRIÈRE-PLAN MESH GRADIENT ── */}
      <AnimatePresence>
        {activeRank === "Tous" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
          >
            <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0) 70%)", filter: "blur(60px)", animation: "floatSlow 15s ease-in-out infinite" }} />
            <div style={{ position: "absolute", top: "40%", right: "-5%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0) 70%)", filter: "blur(80px)", animation: "floatSlow 18s ease-in-out infinite reverse" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')", opacity: 0.04, mixBlendMode: "overlay" }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HEADER ── */}
        <GuildeHeader
          activePage="membres"
          accentColor={accent}
          bgColor={rankBg[activeRank as Rank | "Tous"].nav}
          textColor={isDark ? "#fff" : "#111"}
          rightSlot={ViewToggle}
        />

        {/* ── BARRE DE FILTRES ── */}
        <div style={{
          display: "flex",
          gap: isMobile ? "10px" : "15px",
          padding: isMobile ? "15px 20px" : "20px 40px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${isDark ? "transparent" : "rgba(0,0,0,0.03)"}`,
        }}>
          {["Tous", ...Object.keys(rankLogos)].map((rank) => (
            <button
              key={rank}
              onClick={() => setActiveRank(rank as Rank | "Tous")}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "8px" : "12px",
                padding: isMobile ? "8px 16px" : "10px 24px",
                borderRadius: "100px",
                border: activeRank === rank ? `2px solid ${accent}` : "1px solid transparent",
                background: activeRank === rank ? `${accent}20` : "transparent",
                color: activeRank === rank ? accent : (isDark ? "#888" : "#555"),
                cursor: "pointer",
                transition: "0.3s",
                whiteSpace: "nowrap",
              }}
            >
              {rank !== "Tous" && (
                <img
                  src={rankLogos[rank as Rank]}
                  style={{ height: isMobile ? "22px" : "30px", objectFit: "contain" }}
                  alt=""
                />
              )}
              <span style={{ fontWeight: 900, fontSize: isMobile ? "14px" : "17px", letterSpacing: "0.05em" }}>
                {rank.toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "30px 15px" : "60px 40px" }}>

          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            marginBottom: isMobile ? "30px" : "40px",
            gap: "20px",
          }}>
            <motion.div layout style={{ position: "relative" }}>
              <p style={{ color: accent, letterSpacing: "0.4em", fontWeight: 900, fontSize: "14px", textShadow: isDark ? "none" : "0 2px 10px rgba(255,255,255,0.8)" }}>
                2025 / 26 MODE {viewMode.toUpperCase()}
              </p>
              <h2 style={{ fontSize: isMobile ? "50px" : "100px", fontWeight: 900, lineHeight: 0.8, fontStyle: "italic", marginTop: "10px" }}>
                MEMBRES<br /><span style={{ color: accent }}>DE LA GUILDE</span>
              </h2>
            </motion.div>

            {/* ── SEARCH ── */}
            <div style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
              <Search
                style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: accent }}
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher une légende..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "15px 15px 15px 45px",
                  borderRadius: "12px",
                  width: isMobile ? "100%" : "320px",
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                  border: "none",
                  color: "inherit",
                  outline: `2px solid ${accent}40`,
                  fontFamily: "inherit",
                  boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.04)",
                  fontSize: "15px",
                }}
              />
            </div>
          </div>

          {/* ── NOUVEAU : BANNIÈRE DE L'ATELIER (Au coeur de la page d'accueil) ── */}
          <Link href="/atelier" style={{ textDecoration: "none", display: "block", marginBottom: isMobile ? "40px" : "60px" }}>
            <motion.div
              whileHover={{ scale: 1.015, boxShadow: `0 20px 40px ${accent}30` }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: "relative",
                overflow: "hidden",
                background: isDark ? `linear-gradient(135deg, ${accent}15 0%, rgba(255,255,255,0.02) 100%)` : `linear-gradient(135deg, ${accent}30 0%, rgba(255,255,255,0.8) 100%)`,
                border: `1px solid ${accent}40`,
                borderRadius: "24px",
                padding: isMobile ? "24px" : "32px 40px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: "20px",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Effet de lueur interne */}
              <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "300px", height: "300px", background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
              
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "24px", position: "relative", zIndex: 1 }}>
                {/* Icône encadrée */}
                <div style={{ width: isMobile ? "48px" : "64px", height: isMobile ? "48px" : "64px", borderRadius: "16px", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}50`, flexShrink: 0 }}>
                  <Palette size={isMobile ? 24 : 32} color={accent} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Sparkles size={14} color={accent} />
                    <span style={{ fontSize: "12px", fontWeight: 800, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>Nouveau</span>
                  </div>
                  <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, color: theme.text, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, margin: 0 }}>
                    L'Atelier de la Guilde
                  </h3>
                  <p style={{ fontSize: isMobile ? "14px" : "16px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontWeight: 500, margin: "8px 0 0 0" }}>
                    Découvre notre galerie d'Art générée par Intelligence Artificielle.
                  </p>
                </div>
              </div>

              {/* Bouton d'action */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: accent, borderRadius: "100px", color: "#000", fontWeight: 900, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, alignSelf: isMobile ? "stretch" : "auto", justifyContent: "center", position: "relative", zIndex: 1 }}>
                Explorer l'Atelier <ArrowRight size={16} />
              </div>
            </motion.div>
          </Link>

          {/* ── GRILLE DES MEMBRES ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {(activeRank === "Tous" ? Object.keys(rankLogos) : [activeRank]).map((rank) => {
                const rankMembers = filteredMembers.filter((m) => m.rank === rank);
                if (rankMembers.length === 0) return null;

                return (
                  <section key={rank} style={{ marginBottom: isMobile ? "60px" : "80px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "15px" : "20px", marginBottom: "30px" }}>
                      <img
                        src={rankLogos[rank as Rank]}
                        style={{ height: isMobile ? "50px" : "70px", objectFit: "contain" }}
                        alt=""
                      />
                      <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, fontStyle: "italic", color: rankAccents[rank as Rank] }}>
                        {rank.toUpperCase()}
                      </h3>
                      <div style={{ flexGrow: 1, height: "1px", background: `linear-gradient(90deg, ${rankAccents[rank as Rank]}40, transparent)` }} />
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(230px, 1fr))",
                      gap: isMobile ? "10px" : "25px",
                    }}>
                      {rankMembers.map((member, i) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          index={i}
                          viewMode={viewMode}
                          onClick={() => setSelectedMember(member)}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MemberModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        viewMode={viewMode}
      />

      {/* ── BOUTON FLOTTANT SWITCH RÉEL / ANIME ── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
        style={{
          position: "fixed",
          bottom: isMobile ? "20px" : "40px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          display: "flex",
          background: isDark ? "rgba(10,10,10,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "6px",
          borderRadius: "100px",
          boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.8)" : "0 10px 40px rgba(0,0,0,0.15)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        {(["real", "anime"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: isMobile ? "10px 20px" : "12px 28px",
              borderRadius: "100px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: viewMode === mode ? accent : "transparent",
              color: viewMode === mode ? "#fff" : (isDark ? "#888" : "#888"),
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: viewMode === mode ? `0 4px 15px ${accent}60` : "none",
            }}
          >
            {mode === "real" ? <User size={isMobile ? 16 : 18} /> : <Sword size={isMobile ? 16 : 18} />}
            {mode === "real" ? "Réel" : "Anime"}
          </button>
        ))}
      </motion.div>

    </motion.div>
  );
}