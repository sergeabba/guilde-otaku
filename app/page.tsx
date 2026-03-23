"use client";

import MemberModal from "./components/MemberModal";
import { members, Rank, Member } from "../data/members";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MemberCard from "./components/MemberCard";
import Link from "next/link";
import { User, Sword } from "lucide-react";

const ranks: Rank[] = [
  "Fondateur", "Monarque", "Ex Monarque", "Ordre Céleste",
  "New G dorée", "Futurs Espoirs", "Vieux Briscard", "Fantôme", "Revenant",
];

const rankAccents: Record<string, string> = {
  "Fondateur": "#f59e0b", "Monarque": "#c9a84c", "Ex Monarque": "#fb923c",
  "Ordre Céleste": "#7c3aed", "New G dorée": "#db2777", "Futurs Espoirs": "#2563eb",
  "Vieux Briscard": "#0d9488", "Fantôme": "#64748b", "Revenant": "#8b5cf6",
  "Tous": "#c9a84c",
};

const darkRanks = ["Fondateur", "Monarque", "Ex Monarque", "Ordre Céleste", "Revenant"];

const rankBg: Record<string, { bg: string; nav: string; text: string }> = {
  "Tous":           { bg: "#f7f5f0", nav: "rgba(247,245,240,0.92)", text: "#111" },
  "Fondateur":      { bg: "#0a0800", nav: "rgba(10,8,0,0.92)",      text: "#fff" },
  "Monarque":       { bg: "#09080a", nav: "rgba(9,8,10,0.92)",       text: "#fff" },
  "Ex Monarque":    { bg: "#0d0700", nav: "rgba(13,7,0,0.92)",       text: "#fff" },
  "Ordre Céleste":  { bg: "#06030f", nav: "rgba(6,3,15,0.92)",       text: "#fff" },
  "New G dorée":    { bg: "#fff0f6", nav: "rgba(255,240,246,0.92)",  text: "#111" },
  "Futurs Espoirs": { bg: "#f0f5ff", nav: "rgba(240,245,255,0.92)",  text: "#111" },
  "Vieux Briscard": { bg: "#f0fafa", nav: "rgba(240,250,250,0.92)",  text: "#111" },
  "Fantôme":        { bg: "#f2f2f2", nav: "rgba(242,242,242,0.92)",  text: "#111" },
  "Revenant":       { bg: "#08030f", nav: "rgba(8,3,15,0.92)",       text: "#fff" },
};

const rankLogos: Partial<Record<Rank | "Tous", string>> = {
  "Fondateur":      "/ranks/fondateur.png",
  "Monarque":       "/ranks/monarque.png",
  "Ex Monarque":    "/ranks/ex-monarque.png",
  "Ordre Céleste":  "/ranks/ordre-celeste.png",
  "New G dorée":    "/ranks/new-g-doree.png",
  "Futurs Espoirs": "/ranks/futurs-espoirs.png",
  "Vieux Briscard": "/ranks/vieux-briscard.png",
  "Fantôme":        "/ranks/fantome.png",
  "Revenant":       "/ranks/revenant.png",
};

export type ViewMode = "real" | "anime";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeRank, setActiveRank] = useState<Rank | "Tous">("Tous");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("real");

  const theme = rankBg[activeRank] ?? rankBg["Tous"];
  const accent = rankAccents[activeRank] ?? "#c9a84c";
  const isDark = darkRanks.includes(activeRank);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.name.toLowerCase().includes(q) || m.bio.toLowerCase().includes(q)) &&
      (activeRank === "Tous" || m.rank === activeRank)
    );
  });

  const visibleRanks = activeRank === "Tous" ? ranks : [activeRank];

  return (
    <motion.main
      animate={{ backgroundColor: theme.bg }}
      transition={{ duration: 0.5 }}
      style={{ minHeight: "100vh" }}
    >
      {/* TOP NAV */}
      <motion.div
        animate={{ backgroundColor: theme.nav }}
        transition={{ duration: 0.5 }}
        style={{
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
          position: "sticky", top: 0, zIndex: 40,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
      {/* Brand bar */}
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 40px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}>
          {/* LOGO ET TITRE */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src="/logo.png" alt="Guilde Otaku"
              style={{
                width: "52px", height: "52px", objectFit: "contain",
                filter: isDark
                  ? "drop-shadow(0 2px 8px rgba(255,255,255,0.1)) brightness(1.2)"
                  : "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
              }}
            />
            <div>
              <motion.div
                animate={{ color: theme.text }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "26px", fontWeight: 900,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  lineHeight: 1, fontStyle: "italic",
                }}
              >
                GUILDE OTAKU
              </motion.div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "13px", fontWeight: 600,
                color: accent, letterSpacing: "0.25em",
                textTransform: "uppercase", lineHeight: 1, marginTop: "3px",
              }}>
                depuis 2020
              </div>
            </div>
          </div>

          {/* SECTION DROITE (Switch + Liens) */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

            {/* SWITCH MODE */}
            <div style={{
              display: "flex", alignItems: "center",
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              borderRadius: "100px",
              padding: "4px",
              gap: "2px",
            }}>
              {(["real", "anime"] as ViewMode[]).map((mode) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "11px", fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "6px 14px", borderRadius: "100px",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      transition: "all 0.25s ease",
                      background: isActive ? accent : "transparent",
                      color: isActive ? "#fff" : (isDark ? "rgba(255,255,255,0.4)" : "#888"),
                      boxShadow: isActive ? `0 2px 8px ${accent}60` : "none",
                    }}
                  >
                    {mode === "real"
                      ? <User size={13} strokeWidth={2.5} />
                      : <Sword size={13} strokeWidth={2.5} />
                    }
                    {mode === "real" ? "Réel" : "Anime"}
                  </button>
                );
              })}
            </div>

            {/* LIENS DE NAVIGATION */}
            <Link href="/birthdays" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "14px", fontWeight: 700,
              color: isDark ? "rgba(255,255,255,0.5)" : "#666",
              textDecoration: "none",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = accent}
            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "#666"}
            >
              Anniversaires
            </Link>
            
            <Link href="/wanted" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "14px", fontWeight: 700,
              color: isDark ? "rgba(255,255,255,0.5)" : "#666",
              textDecoration: "none",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "#666")}
            >
              Wanted
            </Link>

            <Link href="/fighters" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "14px", fontWeight: 700,
              color: isDark ? "rgba(255,255,255,0.5)" : "#666",
              textDecoration: "none",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
            onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "#666")}
            >
              Fighters
            </Link>
            {/* NOUVEAU LIEN BONS PLANS */}
            <Link href="/bons-plans" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "14px", fontWeight: 700,
              color: isDark ? "rgba(255,255,255,0.5)" : "#666",
              textDecoration: "none",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")} // Un vert émeraude (trésor)
            onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "#666")}
            >
              Bons Plans
            </Link>
          </div>
        </div>

        {/* Rank filters */}
        <div style={{
          maxWidth: "1280px", margin: "0 auto", padding: "0 40px",
          display: "flex", alignItems: "center",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
         {(["Tous", ...ranks] as (Rank | "Tous")[]).map((rank) => {
  const isActive = activeRank === rank;
  const rAccent = rankAccents[rank] ?? "#c9a84c";
  return (
    <button
      key={rank}
      onClick={() => setActiveRank(rank)}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "15px", fontWeight: isActive ? 900 : 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        padding: "16px 20px",
        background: "none", border: "none",
        borderBottom: isActive ? `4px solid ${rAccent}` : "4px solid transparent",
        color: isActive ? rAccent : (isDark ? "rgba(255,255,255,0.35)" : "#aaa"),
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "all 0.2s", flexShrink: 0,
        fontStyle: isActive ? "italic" : "normal",
        display: "flex", alignItems: "center", gap: "6px",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = rAccent;
          e.currentTarget.style.fontStyle = "italic";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.35)" : "#aaa";
          e.currentTarget.style.fontStyle = "normal";
        }
      }}
    >
      {rank !== "Tous" && rankLogos[rank as Rank] && (
        <img
          src={rankLogos[rank as Rank]}
          alt=""
          style={{
            width: "68px", height: "68px",
            objectFit: "contain",
            opacity: isActive ? 1 : 0.45,
            filter: isActive ? "none" : "grayscale(1)",
            transition: "opacity 0.2s, filter 0.2s",
          }}
        />
      )}
      {rank === "Tous" ? "TOUS" : rank.toUpperCase()}
    </button>
  );
})}    </div>
      </motion.div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 40px" }}>

        {/* HERO */}
        <motion.div
          style={{ paddingTop: "64px", paddingBottom: "48px" }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", gap: "24px", flexWrap: "wrap",
          }}>
            <div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.35em", textTransform: "uppercase",
                color: accent, marginBottom: "12px",
              }}>
                2025 / 26  {viewMode === "anime" ? "Mode Anime " : "Mode Réel "}
              </p>
              <motion.h1
                animate={{ color: theme.text }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(72px, 11vw, 120px)",
                  fontWeight: 900, lineHeight: 0.85,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase", fontStyle: "italic",
                }}
              >
                MEMBRES<br />
                <span style={{ color: accent }}>DE LA GUILDE</span>
              </motion.h1>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "4px" }}>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px", fontWeight: 500,
                  padding: "12px 18px 12px 40px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  borderRadius: "10px", outline: "none", width: "240px",
                  color: theme.text,
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(8px)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = accent;
                  e.target.style.boxShadow = `0 2px 16px ${accent}30`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)",
                fontSize: "14px", color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
              }}>↗</span>
            </div>
          </div>
        </motion.div>

        {/* SECTIONS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRank + viewMode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            {visibleRanks.map((rank) => {
              const rankMembers = filtered.filter((m) => m.rank === rank);
              if (rankMembers.length === 0) return null;
              const rAccent = rankAccents[rank] ?? theme.text;

              return (
                <section key={rank} style={{ marginBottom: "80px" }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: "16px", marginBottom: "32px",
                    paddingBottom: "16px",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e8e8e8"}`,
                  }}>
                    {/* Barre colorée */}
                    <div style={{
                      width: "5px", height: "32px",
                      background: rAccent, borderRadius: "3px",
                      flexShrink: 0,
                    }} />
                    <h2 style={{
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "32px", fontWeight: 900,
  color: rAccent,
  textTransform: "uppercase",
  letterSpacing: "-0.01em", fontStyle: "italic",
  display: "flex", alignItems: "center", gap: "10px",
}}>
  {rankLogos[rank] && (
    <img
      src={rankLogos[rank]}
      alt={rank}
      style={{
        width: "188px", height: "188px",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
      }}
    />
  )}
  {rank}
</h2>
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "13px",
                      color: isDark ? "rgba(255,255,255,0.25)" : "#bbb",
                      marginLeft: "auto",
                    }}>
                      {rankMembers.length} membre{rankMembers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px",
                  }}>
                    {rankMembers.map((member, i) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        index={i}
                        viewMode={viewMode}
                        onClick={() => setSelectedMember(member)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "16px",
              color: isDark ? "rgba(255,255,255,0.2)" : "#ccc",
              letterSpacing: "0.1em",
            }}>
              Aucun membre trouvé
            </p>
          </div>
        )}

        <footer style={{
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e8e8e8"}`,
          padding: "32px 0", marginTop: "20px", textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px",
            color: isDark ? "rgba(255,255,255,0.2)" : "#ccc",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>
            Guilde Otaku — Depuis 2020
          </p>
        </footer>
      </div>

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} viewMode={viewMode} />
    </motion.main>
  );
}