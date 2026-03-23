"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect } from "react";
import { ViewMode } from "../page";

const rankAccents: Record<string, string> = {
  "Fondateur": "#f59e0b", "Monarque": "#c9a84c", "Ex Monarque": "#fb923c",
  "Ordre Céleste": "#7c3aed", "New G dorée": "#db2777", "Futurs Espoirs": "#2563eb",
  "Vieux Briscard": "#0d9488", "Fantôme": "#64748b", "Revenant": "#7c3aed",
};

export default function MemberModal({ member, onClose, viewMode, isMobile }: {
  member: Member | null; onClose: () => void; viewMode: ViewMode; isMobile?: boolean;
}) {
  const accent = member ? (rankAccents[member.rank] ?? "#111") : "#111";
  const isAnime = viewMode === "anime";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "#08080f" }}
        >
          {/* BOUTON FERMER / RETOUR */}
          <button onClick={onClose} style={{
            position: "fixed", 
            top: isMobile ? "20px" : "30px", 
            left: isMobile ? "20px" : "auto", // À gauche sur mobile
            right: isMobile ? "auto" : "30px", // À droite sur PC
            zIndex: 100,
            display: "flex", alignItems: "center", gap: "8px",
            padding: isMobile ? "8px 16px" : "10px",
            borderRadius: "100px",
            background: "rgba(0,0,0,0.6)", 
            border: "1px solid rgba(255,255,255,0.2)", 
            color: "#fff", 
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "16px", fontWeight: 700, textTransform: "uppercase",
            backdropFilter: "blur(8px)", cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}> 
            {isMobile ? (
              <>
                <span style={{ fontSize: "18px", marginTop: "-2px" }}>←</span> Retour
              </>
            ) : (
              <span style={{ fontSize: "20px", lineHeight: 1, padding: "0 4px" }}>✕</span>
            )}
          </button>
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
           {/* --- HERO SECTION --- */}
            <div style={{
              position: "relative", width: "100%", 
              height: isMobile ? "65vh" : "100vh", // Hauteur réduite sur mobile (65% de l'écran)
              minHeight: isMobile ? "400px" : "700px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              background: "#08080f", overflow: "hidden"
            }}>
              {/* Photo Hero */}
              <div style={{
                position: "absolute", // En absolu partout pour servir de fond
                bottom: 0, right: 0,
                width: isMobile ? "100%" : "55%", 
                height: isMobile ? "100%" : "90%",
                zIndex: 1
              }}>
                <img 
                  src={isAnime ? member.animeChar : member.photo} 
                  alt={member.name} 
                  style={{ 
                    width: "100%", height: "100%", 
                    objectFit: isMobile ? "cover" : "contain", // "cover" remplit tout l'espace sur mobile
                    objectPosition: isMobile ? "center 20%" : "bottom" // Centre l'image un peu vers le haut pour voir les visages
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                />
                {/* Dégradé sombre indispensable sur mobile pour lire le texte blanc par dessus l'image */}
                {isMobile && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(8,8,15,1) 0%, rgba(8,8,15,0.5) 40%, transparent 100%)"
                  }} />
                )}
              </div>

              {/* Titre et Rang */}
              <div style={{ position: "relative", padding: isMobile ? "20px 20px 30px" : "0 0 80px 5%", zIndex: 5 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "14px" : "20px", fontWeight: 700, color: accent, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "5px" }}>
                  {member.rank}
                </p>
                <h1 style={{ 
                  fontFamily: "'Barlow Condensed', sans-serif", 
                  fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "100px", // Taille dynamique qui rétrécit si le nom est trop long
                  fontWeight: 900, color: "#fff", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase" 
                }}>
                  {member.name}
                </h1>
              </div>

              {/* Barre d'accentuation en bas du Hero */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: accent, zIndex: 10 }} />
            </div>

            {/* --- INFO SECTION --- */}
            <div style={{ padding: isMobile ? "40px 20px" : "64px 5%", background: "#fff", color: "#000" }}>
              
              {/* STATS */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: isMobile ? "10px" : "2px",
                background: "rgba(0,0,0,0.06)",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "64px",
              }}>
                {[
                  { label: "Rang", value: member.rank },
                  { label: "Anniversaire", value: member.birthday },
                  { label: "Guilde", value: "Otaku" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: "#fff", padding: "25px", borderTop: `4px solid ${accent}`,
                  }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, color: accent, textTransform: "uppercase" }}>
                      {stat.label}
                    </p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#111" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* BIOGRAPHIE */}
              <div style={{ marginBottom: "64px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ width: "30px", height: "3px", background: accent }} />
                  <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>BIOGRAPHIE</p>
                </div>
                <p style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 600, lineHeight: 1.5 }}>
                  {member.bio}
                </p>
              </div>

              {/* ALTER EGO SECTIONS */}
              <div style={{ borderTop: "1px solid #eee", paddingTop: "40px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
                  <div style={{ width: "30px", height: "3px", background: accent }} />
                  <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>PERSONNAGE ASSOCIÉ</p>
                </div>
                
                <div style={{
                  display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "10px", borderRadius: "16px", overflow: "hidden"
                }}>
                  <div style={{ position: "relative", height: "350px", background: "#f0f0f0" }}>
                    <img src={isAnime ? member.animeChar : member.photo} alt="Mode Actuel" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: "15px", left: "15px", color: "#fff", zIndex: 2 }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>{isAnime ? "Alter Ego" : "Réel"}</p>
                      <p style={{ fontSize: "20px", fontWeight: 900 }}>{member.name}</p>
                    </div>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                  </div>

                  <div style={{ position: "relative", height: "350px", background: "#f0f0f0" }}>
                    <img src={isAnime ? member.photo : member.animeChar} alt="Opposé" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: "15px", left: "15px", color: "#fff", zIndex: 2 }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>{isAnime ? "Réel" : "Alter Ego"}</p>
                      <p style={{ fontSize: "20px", fontWeight: 900 }}>{member.name}</p>
                    </div>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}