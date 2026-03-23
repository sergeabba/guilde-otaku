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

// AJOUT DE ISMOBILE ICI
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "#08080f" }}
        >
          {/* Bouton fermer (Plus gros sur mobile pour le doigt) */}
          <button onClick={onClose} style={{
            position: "fixed", top: "20px", right: "20px", zIndex: 100,
            width: "44px", height: "44px", borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: "20px",
            backdropFilter: "blur(8px)", cursor: "pointer"
          }}> ✕ </button>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* HERO SECTION */}
            <div style={{
              position: "relative", width: "100%", 
              height: isMobile ? "auto" : "100vh", 
              minHeight: isMobile ? "600px" : "700px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              paddingBottom: isMobile ? "40px" : "0"
            }}>
              {/* Photo Hero */}
              <div style={{
                position: isMobile ? "relative" : "absolute",
                bottom: 0, right: isMobile ? "0" : "5%",
                width: isMobile ? "100%" : "55%", height: isMobile ? "450px" : "90%",
                zIndex: 1
              }}>
                <img src={isAnime ? member.animeChar : member.photo} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }} />
              </div>

              {/* Contenu Texte */}
              // Remplace zSelf: "flex-start" par zIndex: 5 (ou retire simplement le zSelf qui n'existe pas)
<div style={{ position: "relative", padding: isMobile ? "20px" : "0 0 80px 5%", zIndex: 5 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "14px" : "20px", fontWeight: 700, color: accent, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                  {member.rank}
                </p>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "50px" : "110px", fontWeight: 900, color: "#fff", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase" }}>
                  {member.name}
                </h1>
              </div>
            </div>

            {/* INFO SECTION */}
            <div style={{ padding: isMobile ? "30px 20px" : "60px 5%", background: "#fff", color: "#000" }}>
               {/* Ici tu gardes tes Stats, Bio et Personnage associé, le navigateur gérera l'empilement car ce sont des blocs standards */}
               <div style={{ marginBottom: "40px" }}>
                  <h3 style={{ color: accent, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "15px" }}>BIOGRAPHIE</h3>
                  <p style={{ fontSize: isMobile ? "18px" : "26px", lineHeight: 1.5, fontWeight: 600 }}>{member.bio}</p>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}