"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useState } from "react";
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
  
  // --- NOUVEAU : État local pour gérer le switch DANS la modal ---
  const [localMode, setLocalMode] = useState<ViewMode>("real");

  // Synchronise le mode local avec le mode de la page quand on ouvre un profil
  useEffect(() => {
    if (member) setLocalMode(viewMode);
  }, [member, viewMode]);

  const isAnime = localMode === "anime";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "#08080f", zIndex: 9999 }}
        >
          {/* --- NOUVEAU : SWITCH RÉEL / ANIME CENTRÉ --- */}
          <div style={{
            position: "fixed", 
            top: isMobile ? "20px" : "30px", 
            left: "50%", transform: "translateX(-50%)", 
            zIndex: 10000,
            display: "flex", background: "rgba(0,0,0,0.6)", borderRadius: "100px", padding: "4px",
            backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}>
            <button onClick={() => setLocalMode("real")} style={{ padding: "6px 16px", borderRadius: "100px", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", background: localMode === "real" ? accent : "transparent", color: localMode === "real" ? "#fff" : "#aaa", transition: "0.3s" }}>Réel</button>
            <button onClick={() => setLocalMode("anime")} style={{ padding: "6px 16px", borderRadius: "100px", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", background: localMode === "anime" ? accent : "transparent", color: localMode === "anime" ? "#fff" : "#aaa", transition: "0.3s" }}>Anime</button>
          </div>

          {/* BOUTON FERMER / RETOUR */}
          <button onClick={onClose} style={{
            position: "fixed", 
            top: isMobile ? "20px" : "30px", 
            left: isMobile ? "20px" : "auto", 
            right: isMobile ? "auto" : "30px", 
            zIndex: 10000,
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
            {isMobile ? (<><span style={{ fontSize: "18px", marginTop: "-2px" }}>←</span> Retour</>) : (<span style={{ fontSize: "20px", lineHeight: 1, padding: "0 4px" }}>✕</span>)}
          </button>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.4 }}>
           {/* --- HERO SECTION --- */}
            <div style={{
              position: "relative", width: "100%", 
              height: isMobile ? "65vh" : "100vh",
              minHeight: isMobile ? "400px" : "700px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              background: "#08080f", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: isMobile ? "100%" : "55%", height: isMobile ? "100%" : "90%", zIndex: 1
              }}>
                {/* --- LA MAGIE DE LA TRANSITION SMOOTH EST ICI --- */}
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={localMode} // Change la clé pour déclencher l'animation
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    src={isAnime ? member.animeChar : member.photo} 
                    alt={member.name} 
                    style={{ 
                      position: "absolute", inset: 0, // Indispensable pour que les 2 images se croisent proprement
                      width: "100%", height: "100%", 
                      objectFit: isMobile ? "cover" : "contain", 
                      objectPosition: isMobile ? "center 20%" : "bottom" 
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                  />
                </AnimatePresence>

                {isMobile && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to top, rgba(8,8,15,1) 0%, rgba(8,8,15,0.5) 40%, transparent 100%)" }} />
                )}
              </div>

              <div style={{ position: "relative", padding: isMobile ? "20px 20px 30px" : "0 0 80px 5%", zIndex: 5 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "14px" : "20px", fontWeight: 700, color: accent, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "5px" }}>
                  {member.rank}
                </p>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "100px", fontWeight: 900, color: "#fff", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase" }}>
                  {member.name}
                </h1>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: accent, zIndex: 10 }} />
            </div>

            {/* --- INFO SECTION --- */}
            <div style={{ padding: isMobile ? "40px 20px" : "80px 5%", background: "#fff", color: "#000" }}>
              <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                
                {/* STATS */}
                <div style={{
                  display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: isMobile ? "10px" : "2px", background: "rgba(0,0,0,0.06)",
                  borderRadius: "14px", overflow: "hidden", marginBottom: "60px",
                }}>
                  {[
                    { label: "Rang", value: member.rank },
                    { label: "Anniversaire", value: member.birthday },
                    { label: "Guilde", value: "Otaku" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "#fff", padding: "25px", borderTop: `4px solid ${accent}`, textAlign: "center" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#111", marginTop: "5px" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* BIOGRAPHIE */}
                <div style={{ marginBottom: "80px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "25px" }}>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                    <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em", fontSize: "18px" }}>BIOGRAPHIE</p>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                  </div>
                  <p style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 600, lineHeight: 1.6, maxWidth: "800px", margin: "0 auto", color: "#333" }}>
                    {member.bio}
                  </p>
                </div>

                {/* --- ALTER EGO SECTIONS --- */}
                <div style={{ borderTop: "1px solid #eee", paddingTop: "60px", paddingBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "40px" }}>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                    <p style={{ fontSize: "22px", fontWeight: 900, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>PERSONNAGE ASSOCIÉ</p>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "40px" }}>
                    
                    {/* CARTE 1 */}
                    <div style={{ position: "relative", height: isMobile ? "350px" : "450px", borderRadius: "24px", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.12)", border: `1px solid #eaeaea`, transform: "translateZ(0)" }}>
                      <img src={isAnime ? member.animeChar : member.photo} alt="Mode Actuel" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
                      <div style={{ position: "absolute", bottom: "25px", left: "20px", right: "20px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                          {isAnime ? "Alter Ego Manga" : "Dans la vraie vie"}
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>{member.name}</p>
                      </div>
                    </div>

                    {/* CARTE 2 */}
                    <div style={{ position: "relative", height: isMobile ? "350px" : "450px", borderRadius: "24px", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.12)", border: `1px solid #eaeaea`, transform: "translateZ(0)" }}>
                      <img src={isAnime ? member.photo : member.animeChar} alt="Opposé" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
                      <div style={{ position: "absolute", bottom: "25px", left: "20px", right: "20px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                          {isAnime ? "Dans la vraie vie" : "Alter Ego Manga"}
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>{member.name}</p>
                      </div>
                    </div>

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