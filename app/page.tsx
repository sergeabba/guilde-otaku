"use client";

import { useState, useMemo, useEffect } from "react";
import { members, rankColors, rankJP, Rank, Member } from "../data/members";
import MemberCard from "./components/MemberCard";
import MemberModal from "./components/MemberModal";
import Link from "next/link";
import { Search, User, Sword, Flame, Gift, Target, Database } from "lucide-react";
const rankLogos: Partial<Record<Rank | "Tous", string>> = {
  "Fondateur":      "/ranks/fondateur.png",
  "Monarque":       "/ranks/monarque.png",
  "Ex Monarque":    "/ranks/ex-monarque.png",
  "Ordre Céleste":  "/ranks/ordre-celeste.png", // Corrigé ici
  "New G dorée":    "/ranks/new-g-doree.png",   // Corrigé ici
  "Futurs Espoirs": "/ranks/futurs-espoirs.png",
  "Vieux Briscard": "/ranks/vieux-briscard.png",
  "Fantôme":        "/ranks/fantome.png",        // Corrigé ici
  "Revenant":       "/ranks/revenant.png",
};
export type ViewMode = "real" | "anime"; // Assure-toi qu'il y a "export"

export default function HomePage() {
  const [activeRank, setActiveRank] = useState<Rank | "Tout">("Tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("real");
  
  // --- DÉTECTEUR MOBILE (Nouveau) ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Vérifie au chargement
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- FILTRAGE DES MEMBRES ---
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesRank = activeRank === "Tout" || m.rank === activeRank;
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.bio.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRank && matchesSearch;
    });
  }, [activeRank, searchTerm]);

  // --- COMPOSANT SWITCH RÉEL/ANIME (Responsive) ---
  const ViewSwitch = () => (
    <div style={{
      display: "flex", alignItems: "center", gap: "2px",
      background: "#f0f0f0", border: "1px solid #ddd",
      borderRadius: "100px", padding: "4px",
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
    }}>
      {(["real", "anime"] as ViewMode[]).map((mode) => (
        <button key={mode} onClick={() => setViewMode(mode)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: isMobile ? "8px 14px" : "10px 20px", borderRadius: "100px", border: "none", cursor: "pointer",
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "12px" : "14px", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.2s ease",
          background: viewMode === mode ? "#f03e3e" : "transparent",
          color: viewMode === mode ? "#fff" : "#555",
          boxShadow: viewMode === mode ? "0 4px 10px rgba(240, 62, 62, 0.3)" : "none",
        }}>
          {mode === "real" ? <User size={isMobile ? 14 : 16} /> : <Sword size={isMobile ? 14 : 16} />}
          {mode === "real" ? "Réel" : "Anime"}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#fff", color: "#000",
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      
      {/* --- HEADER RESPONSIVE --- */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #eee",
        padding: isMobile ? "15px" : "20px 40px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // Empilement sur mobile
        alignItems: "center",
        justifyContent: "space-between",
        gap: isMobile ? "15px" : "0",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* LOGO & TITRE */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src="/logo.png" alt="Logo Guilde" style={{ height: isMobile ? "45px" : "60px", width: "auto" }} />
          <div>
            <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1 }}>GUILDE OTAKU</h1>
            <p style={{ fontSize: isMobile ? "10px" : "12px", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "2px" }}>Le Trombinoscope Légendaire</p>
          </div>
        </div>

        {/* RECHERCHE, SWITCH & NAV */}
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row", 
          alignItems: "center", 
          gap: isMobile ? "15px" : "20px",
          width: isMobile ? "100%" : "auto",
        }}>
          {/* BARRE DE RECHERCHE */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#f5f5f5", border: "1px solid #eee", borderRadius: "100px",
            padding: "10px 20px", width: isMobile ? "100%" : "280px",
          }}>
            <Search size={18} color="#999" />
            <input type="text" placeholder="Rechercher un membre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontSize: "15px", width: "100%", color: "#000", fontFamily: "'Barlow Condensed', sans-serif" }} />
          </div>
          
          <ViewSwitch />

          {/* NAVIGATION (Horizontal scroll sur mobile) */}
          <nav style={{ 
            display: "flex", alignItems: "center", gap: "20px",
            overflowX: isMobile ? "auto" : "visible",
            maxWidth: isMobile ? "100vw" : "auto",
            padding: isMobile ? "5px 10px" : "0",
            whiteSpace: "nowrap",
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "flex-start" : "flex-end",
            WebkitOverflowScrolling: "touch", // Smooth scroll iOS
          }}>
            {[
              { href: "/birthdays", label: "Anniversaires", icon: Gift, color: "#e03e3e" },
              { href: "/wanted", label: "Wanted", icon: Target, color: "#fcc419" },
              { href: "/fighters", label: "Fighters", icon: Flame, color: "#ff922b" },
              { href: "/bons-plans", label: "Bons Plans", icon: Database, color: "#51cf66" },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} style={{
                  display: "flex", alignItems: "center", gap: "8px", textDecoration: "none",
                  fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                  color: "#555", transition: "color 0.2s"
                }} onMouseEnter={(e) => (e.currentTarget.style.color = link.color)} onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>
                  <Icon size={16} color={link.color} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* --- FILTRE DES RANGS RESPONSIVE --- */}
      <div style={{
        background: "#fbfbfb", borderBottom: "1px solid #eee",
        padding: isMobile ? "15px 10px" : "20px 40px",
        display: "flex", 
        flexWrap: "wrap", // TRÈS IMPORTANT : permet de passer à la ligne sur mobile
        justifyContent: "center", 
        gap: isMobile ? "10px" : "15px",
      }}>
        {/* BOUTON TOUT */}
        <button onClick={() => setActiveRank("Tout")} style={{
          background: activeRank === "Tout" ? "#000" : "#fff",
          color: activeRank === "Tout" ? "#fff" : "#000",
          border: "1px solid #ddd", borderRadius: "100px",
          padding: isMobile ? "8px 16px" : "10px 25px", cursor: "pointer",
          fontSize: isMobile ? "12px" : "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
          transition: "all 0.2s",
        }}>
          Tout ({members.length})
        </button>

        {/* LOGOS One Piece / DBZ */}
        {Object.keys(rankColors).map((rank) => {
          const rankName = rank as Rank;
          const count = members.filter((m) => m.rank === rankName).length;
          const isActive = activeRank === rankName;
          const rankKey = rankName.toLowerCase().replace(/ /g, "-");
          
          return (
            <button key={rank} onClick={() => setActiveRank(rankName)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: isActive ? "#eee" : "#fff",
              border: "1px solid #ddd", borderRadius: "100px",
              padding: isMobile ? "6px 12px" : "8px 15px", cursor: "pointer",
              transition: "all 0.2s",
              opacity: isActive ? 1 : 0.7,
              transform: isActive ? "scale(1.05)" : "scale(1)",
            }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#999")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ddd")}>
              <img src={`/ranks/${rankKey}.png`} alt={rankName} style={{ height: isMobile ? "22px" : "28px", width: "auto" }} />
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: 800, textTransform: "uppercase", color: "#000", display: "block" }}>
                  {rankName}
                </span>
                <span style={{ fontSize: isMobile ? "9px" : "10px", fontWeight: 600, color: "#888", display: "block", marginTop: "-1px" }}>
                  {rankJP[rankName]} • {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* --- GRILLE DES MEMBRES RESPONSIVE --- */}
      <main style={{ padding: isMobile ? "20px 10px" : "40px" }}>
        {/* TITRE DE LA SECTION */}
        <div style={{ marginBottom: "30px", textAlign: isMobile ? "center" : "left" }}>
          <h2 style={{ 
            fontSize: isMobile ? "32px" : "48px", // Réduit sur mobile
            fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 
          }}>
            {activeRank === "Tout" ? "Membres de la Guilde" : activeRank}
          </h2>
          <p style={{ fontSize: isMobile ? "14px" : "18px", color: "#666", marginTop: "4px" }}>
            {filteredMembers.length} {filteredMembers.length > 1 ? "légendes trouvées" : "légende trouvée"}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        {/* LA GRILLE (Dynamique PC/Mobile) */}
<div style={{
  display: "grid",
  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(280px, 1fr))",
  gap: isMobile ? "10px" : "25px",
}}>
  {filteredMembers.map((member: Member, i: number) => (
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
        {/* AUCUN RÉSULTAT */}
        {filteredMembers.length === 0 && (
          <div style={{
            textAlign: "center", padding: "100px 20px", background: "#f9f9f9",
            borderRadius: "20px", border: "2px dashed #eee", marginTop: "40px",
          }}>
            <Search size={48} color="#ccc" style={{ marginBottom: "20px" }} />
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#555" }}>Aucun membre ne correspond à tes critères.</p>
            <p style={{ color: "#888", marginTop: "8px" }}>Essaie de réinitialiser les filtres ou de changer ta recherche.</p>
            <button onClick={() => { setActiveRank("Tout"); setSearchTerm(""); }} style={{
              marginTop: "25px", background: "#000", color: "#fff", border: "none",
              padding: "12px 30px", borderRadius: "100px", cursor: "pointer",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em"
            }}>
              Réinitialiser
            </button>
          </div>
        )}
      </main>

      {/* --- PIED DE PAGE --- */}
      <footer style={{
        textAlign: "center", padding: isMobile ? "30px 15px" : "40px",
        borderTop: "1px solid #eee", marginTop: "40px", background: "#f9f9f9"
      }}>
        <img src="/logo.png" alt="Logo" style={{ height: "40px", marginBottom: "15px", opacity: 0.5 }} />
        <p style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
          Guilde Otaku • Depuis 2020 • Le Trombinoscope
        </p>
        <p style={{ fontSize: "12px", color: "#bbb", marginTop: "8px" }}>© Tous Droits Réservés à la Guilde</p>
      </footer>

      {/* --- MODAL DE DÉTAILS --- */}
      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} viewMode={viewMode} isMobile={isMobile} />
    </div>
  );
}