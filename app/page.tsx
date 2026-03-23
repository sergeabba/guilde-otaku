"use client";

import { useState, useMemo, useEffect } from "react";
import { members, Rank, Member } from "../data/members";
import MemberCard from "./components/MemberCard";
import MemberModal from "./components/MemberModal"; // Importation propre
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

// --- CONFIGURATION DES THÈMES ---
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

const rankLogos: Record<string, string> = {
  "Fondateur": "/ranks/fondateur.png",
  "Monarque": "/ranks/monarque.png",
  "Ex Monarque": "/ranks/ex-monarque.png",
  "Ordre Céleste": "/ranks/ordre-celeste.png",
  "New G dorée": "/ranks/new-g-doree.png",
  "Futurs Espoirs": "/ranks/futurs-espoirs.png",
  "Vieux Briscard": "/ranks/vieux-briscard.png",
  "Fantôme": "/ranks/fantome.png",
  "Revenant": "/ranks/revenant.png",
};

export type ViewMode = "real" | "anime";

export default function HomePage() {
  const [activeRank, setActiveRank] = useState<Rank | "Tous">("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("real");
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const theme = rankBg[activeRank] ?? rankBg["Tous"];
  const accent = rankAccents[activeRank] ?? "#c9a84c";
  const isDark = darkRanks.includes(activeRank);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesRank = activeRank === "Tous" || m.rank === activeRank;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRank && matchesSearch;
    });
  }, [activeRank, searchTerm]);

  return (
    <motion.div 
      animate={{ backgroundColor: theme.bg }}
      transition={{ duration: 0.8, ease: "easeInOut" }} 
      style={{ minHeight: "100vh", color: theme.text, overflowX: "hidden", fontFamily: "'Barlow Condensed', sans-serif" }}
    >
      
      {/* --- HEADER RESPONSIVE --- */}
      <motion.header 
        animate={{ backgroundColor: theme.nav, borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
        style={{
          padding: isMobile ? "15px" : "0 40px", 
          minHeight: "80px", 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: isMobile ? "15px" : "0",
          position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(12px)", borderBottom: "1px solid"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start" }}>
          <img src="/logo.png" style={{ height: isMobile ? "40px" : "45px" }} alt="Logo" />
          <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 900 }}>GUILDE OTAKU</h1>
        </div>

       {/* --- MENU DE NAVIGATION --- */}
        <nav style={{ 
          display: "flex", 
          gap: isMobile ? "20px" : "35px", 
          fontWeight: 800, 
          fontSize: isMobile ? "14px" : "19px", 
          overflowX: isMobile ? "auto" : "visible", 
          width: isMobile ? "100%" : "auto",
          paddingBottom: isMobile ? "5px" : "0", 
          whiteSpace: "nowrap"
        }}>
          <Link href="/birthdays" style={{ textDecoration: "none", color: "inherit", transition: "0.2s" }}>ANNIVERSAIRES</Link>
          <Link href="/wanted" style={{ textDecoration: "none", color: "inherit", transition: "0.2s" }}>WANTED</Link>
          <Link href="/fighters" style={{ textDecoration: "none", color: "inherit", transition: "0.2s" }}>FIGHTERS</Link>
          <Link href="/bons-plans" style={{ textDecoration: "none", color: "inherit", transition: "0.2s" }}>BONS PLANS</Link>
        </nav>
      </motion.header>

      {/* --- BARRE DE FILTRES FIXÉE --- */}
      <div style={{ 
        display: "flex", gap: "10px", padding: isMobile ? "15px 20px" : "20px 40px", 
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
      }}>
        <div style={{ flexShrink: 0, display: "flex", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: "100px", padding: "4px", marginRight: "10px" }}>
          {(["real", "anime"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: "6px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
              background: viewMode === mode ? accent : "transparent",
              color: viewMode === mode ? "#fff" : (isDark ? "#aaa" : "#666"),
              transition: "0.3s"
            }}>
              {mode === "real" ? "Réel" : "Anime"}
            </button>
          ))}
        </div>

        {["Tous", ...Object.keys(rankLogos)].map((rank) => (
          <button 
            key={rank} 
            onClick={() => setActiveRank(rank as Rank | "Tous")}
            style={{
              flexShrink: 0, 
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
              borderRadius: "100px", border: activeRank === rank ? `2px solid ${accent}` : "1px solid transparent",
              background: activeRank === rank ? `${accent}20` : "transparent",
              color: activeRank === rank ? accent : (isDark ? "#888" : "#666"),
              cursor: "pointer", transition: "0.3s", whiteSpace: "nowrap"
            }}
          >
            {rank !== "Tous" && <img src={rankLogos[rank]} style={{ height: "20px" }} alt="" />}
            <span style={{ fontWeight: 800, fontSize: "13px" }}>{rank.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "30px 15px" : "60px 40px" }}>
        
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: isMobile ? "40px" : "80px", gap: "20px" }}>
          <motion.div layout>
            <p style={{ color: accent, letterSpacing: "0.4em", fontWeight: 900, fontSize: "14px" }}>
              2025 / 26 MODE {viewMode.toUpperCase()}
            </p>
            <h2 style={{ fontSize: isMobile ? "50px" : "100px", fontWeight: 900, lineHeight: 0.8, fontStyle: "italic", marginTop: "10px" }}>
              MEMBRES<br /><span style={{ color: accent }}>DE LA GUILDE</span>
            </h2>
          </motion.div>

          <div style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
            <Search style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: accent }} size={20} />
            <input 
              type="text" placeholder="Rechercher une légende..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "15px 15px 15px 45px", borderRadius: "10px", 
                width: isMobile ? "100%" : "320px",
                background: isDark ? "rgba(255,255,255,0.07)" : "#fff",
                border: "none", color: "inherit", outline: `2px solid ${accent}40`, fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeRank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {(activeRank === "Tous" ? Object.keys(rankLogos) : [activeRank]).map((rank) => {
              const rankMembers = filteredMembers.filter(m => m.rank === rank);
              if (rankMembers.length === 0) return null;

              return (
                <section key={rank} style={{ marginBottom: isMobile ? "60px" : "80px" }}>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "15px" : "20px", marginBottom: "30px" }}>
                    <img src={rankLogos[rank as Rank]} style={{ height: isMobile ? "50px" : "70px", objectFit: "contain" }} alt="" />
                    <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, fontStyle: "italic", color: rankAccents[rank as Rank] }}>
                      {rank.toUpperCase()}
                    </h3>
                    <div style={{ flexGrow: 1, height: "1px", background: `linear-gradient(90deg, ${rankAccents[rank as Rank]}40, transparent)` }} />
                  </div>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(230px, 1fr))", 
                    gap: isMobile ? "10px" : "25px" 
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

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} viewMode={viewMode} isMobile={isMobile} />
    </motion.div>
  );
}