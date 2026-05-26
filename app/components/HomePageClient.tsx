"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Rank, Member } from "../../data/members";
import MemberCard from "./MemberCard";
import MemberModal from "./MemberModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Sword, X } from "lucide-react";
import { rankAccents, rankBg, rankLogos, darkRanks } from "../config/ranks";
import { COUNTRIES, flagUrl, countryAccents } from "../config/countries";
import { useTheme } from "../context/ThemeContext";
import GuildeHeader from "./GuildeHeader";
import { useIsMobile, useBreakpoint } from "../hooks/useIsMobile";
import type { ViewMode } from "../types";
import { ChroniqueBanner, AtelierBanner } from "./PromoBanners";
import GuildeStats from "./GuildeStats";

export default function HomePageClient({ initialMembers }: { initialMembers: Member[] }) {
  const [activeRank, setActiveRank] = useState<Rank | "Tous">("Tous");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const isTablet = breakpoint === "sm" || breakpoint === "md";
  const { isDark: globalDark } = useTheme();
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const membreId = params.get("membre");
    if (membreId) {
      const found = initialMembers.find(m => m.id === Number(membreId));
      if (found) setSelectedMember(found);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [initialMembers]);

  const rankTheme = rankBg[activeRank] ?? rankBg["Tous"];
  const rankAccent = rankAccents[activeRank as Rank | "Tous"];
  const rankIsDark = darkRanks.includes(activeRank as Rank);

  const isDark = activeRank !== "Tous" ? rankIsDark : globalDark;
  const accent = activeCountry && countryAccents[activeCountry] ? countryAccents[activeCountry] : rankAccent;
  const theme = activeRank !== "Tous" ? rankTheme : {
    bg: isDark ? "#0a0a0f" : "#fcfaf8",
    nav: isDark ? "rgba(10,10,15,0.92)" : "rgba(252,250,248,0.75)",
    text: isDark ? "#fff" : "#111",
  };

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of initialMembers) {
      if (m.country) counts[m.country] = (counts[m.country] || 0) + 1;
    }
    return counts;
  }, [initialMembers]);

  const availableCountries = useMemo(() => {
    const codes = new Set(initialMembers.map(m => m.country).filter(Boolean) as string[]);
    return COUNTRIES.filter(c => codes.has(c.code));
  }, [initialMembers]);

  const filteredMembers = useMemo(() => {
    return initialMembers.filter((m) => {
      const matchesRank    = activeRank === "Tous" || m.rank === activeRank;
      const matchesSearch  = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !activeCountry || m.country === activeCountry;
      return matchesRank && matchesSearch && matchesCountry;
    });
  }, [activeRank, searchTerm, activeCountry, initialMembers]);


  return (
    <>
    <motion.div
      animate={{ backgroundColor: theme.bg, color: theme.text }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        minHeight: "100vh",
        color: theme.text,
        overflowX: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif",
        position: "relative",
      }}
    >
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
            <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0) 70%)", filter: "blur(60px)", animation: "floatSlow 15s ease-in-out infinite", willChange: "transform" }} />
            <div style={{ position: "absolute", top: "40%", right: "-5%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0) 70%)", filter: "blur(80px)", animation: "floatSlow 18s ease-in-out infinite reverse", willChange: "transform" }} />
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
        />

        {/* ── BARRE DE FILTRES ── */}
        <div style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: isMobile ? "10px" : "15px",
            padding: isMobile ? "15px 20px" : "20px 40px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${isDark ? "transparent" : "rgba(0,0,0,0.03)"}`,
          }}
        >
          {["Tous", ...Object.keys(rankLogos)].map((rank) => (
            <motion.button
              key={rank}
              onClick={() => setActiveRank(rank as Rank | "Tous")}
              aria-pressed={activeRank === rank}
              whileHover={{ scale: 1.07, y: -2 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
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
                transition: "background 0.3s, border-color 0.3s, color 0.3s",
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
            </motion.button>
          ))}
        </motion.div>
        {/* fade mask droite — signale le scroll */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: `linear-gradient(to left, ${isDark ? rankBg[activeRank as Rank | "Tous"].bg : rankBg[activeRank as Rank | "Tous"].bg}, transparent)`, pointerEvents: "none" }} />
        </div>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "24px 12px" : isTablet ? "40px 24px" : "60px 40px" }}>

          <GuildeStats
            memberCount={initialMembers.length}
            countryCounts={countryCounts}
            isDark={isDark}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "flex-end",
              marginBottom: isMobile ? "30px" : "40px",
              gap: "20px",
            }}
          >
            <motion.div
              layout
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0,  filter: "blur(0px)"  }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative" }}
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.4em" }}
                transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
                style={{ color: accent, fontWeight: 900, fontSize: "14px", textShadow: isDark ? "none" : "0 2px 10px rgba(255,255,255,0.8)" }}
              >
                2025 / 26 MODE {viewMode.toUpperCase()}
              </motion.p>
              <h2 style={{ fontSize: isMobile ? "50px" : "100px", fontWeight: 900, lineHeight: 0.8, fontStyle: "italic", marginTop: "10px" }}>
                MEMBRES<br /><span style={{ color: accent }}>DE LA GUILDE</span>
              </h2>
            </motion.div>

            {/* ── SEARCH ── */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", width: isMobile ? "100%" : "auto" }}
            >
              <Search
                style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: accent, pointerEvents: "none" }}
                size={20}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Rechercher une légende..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Rechercher un membre"
                style={{
                  padding: searchTerm ? "15px 44px 15px 45px" : "15px 15px 15px 45px",
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
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  aria-label="Effacer la recherche"
                  className="no-min"
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)", padding: "4px", display: "flex" }}
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          </motion.div>

          {/* ── FILTRE PAR PAYS ── */}
          {availableCountries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="scrollbar-hide"
              style={{ display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", gap: "8px", marginBottom: "20px", alignItems: "center", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: isMobile ? "4px" : 0 }}
            >
              <button
                onClick={() => setActiveCountry(null)}
                style={{
                  padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                  background: !activeCountry ? `${accent}20` : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  border: `1px solid ${!activeCountry ? accent : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                  color: !activeCountry ? accent : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"),
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                Tous
              </button>
              {availableCountries.map(c => (
                <button
                  key={c.code}
                  onClick={() => setActiveCountry(activeCountry === c.code ? null : c.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                    padding: "6px 12px", borderRadius: "8px", cursor: "pointer",
                    background: activeCountry === c.code ? `${accent}20` : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                    border: `1px solid ${activeCountry === c.code ? accent : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                    color: activeCountry === c.code ? accent : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"),
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700,
                    whiteSpace: "nowrap", transition: "all 0.3s",
                  }}
                >
                  <img src={flagUrl(c.code)} alt={c.label} style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2 }} />
                  {c.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── BANNIÈRES EXTRAITES ── */}
          <ChroniqueBanner isMobile={isMobile} isDark={isDark} theme={theme} />
          <AtelierBanner isMobile={isMobile} isDark={isDark} theme={theme} accent={accent} />

          {/* ── GRILLE DES MEMBRES ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {filteredMembers.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "80px 20px" }}>
                  <p style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)", marginBottom: "12px" }}>
                    Aucun membre trouvé
                  </p>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} style={{ fontSize: "14px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: `1px solid ${accent}40`, borderRadius: "100px", padding: "8px 20px", cursor: "pointer" }}>
                      Effacer « {searchTerm} »
                    </button>
                  )}
                </motion.div>
              )}
              {(activeRank === "Tous" ? Object.keys(rankLogos) : [activeRank]).map((rank) => {
                const rankMembers = filteredMembers.filter((m) => m.rank === rank);
                if (rankMembers.length === 0) return null;

                return (
                  <motion.section
                    key={rank}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: isMobile ? "60px" : "80px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "15px" : "20px", marginBottom: "30px" }}>
                      <motion.img
                        src={rankLogos[rank as Rank]}
                        style={{ height: isMobile ? "50px" : "70px", objectFit: "contain" }}
                        alt=""
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      />
                      <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, fontStyle: "italic", color: rankAccents[rank as Rank] }}>
                        {rank.toUpperCase()}
                      </h3>
                      <div style={{ flexGrow: 1, height: "1px", background: `linear-gradient(90deg, ${rankAccents[rank as Rank]}40, transparent)` }} />
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: breakpoint === "xs" ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(230px, 1fr))",
                      gap: isMobile ? "12px" : isTablet ? "18px" : "25px",
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
                  </motion.section>
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

    </motion.div>

    {/* ── BOUTON FLOTTANT SWITCH RÉEL / ANIME ────────────────────────────────
        Rendu HORS du motion.div principal pour éviter que le stacking context
        créé par animate:backgroundColor ne piège ce position:fixed.           */}
    {mounted && !selectedMember && createPortal(
      <div
        style={{
          position: "fixed",
          bottom: isMobile ? "20px" : "40px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10002,
          display: "flex",
          background: isDark ? "rgba(10,10,10,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "6px",
          borderRadius: "100px",
          boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.8)" : "0 10px 40px rgba(0,0,0,0.15)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        {(["real", "anime"] as ViewMode[]).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setViewMode(mode)}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
              color: viewMode === mode ? "#fff" : "#888",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: viewMode === mode ? `0 4px 15px ${accent}60` : "none",
            }}
          >
            {mode === "real" ? <User size={isMobile ? 16 : 18} /> : <Sword size={isMobile ? 16 : 18} />}
            {mode === "real" ? "Réel" : "Anime"}
          </motion.button>
        ))}
      </div>,
      document.body
    )}
    </>
  );
}
