"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents } from "../config/ranks"; // ← import centralisé, fini les doublons
import { useIsMobile } from "../hooks/useIsMobile";
import { Trophy } from "lucide-react";

export default function MemberModal({ member, onClose, viewMode }: {
  member: Member | null; onClose: () => void; viewMode: ViewMode;
}) {
  const isMobile = useIsMobile(); // ← hook centralisé, prop supprimée
  const accent = member ? (rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c") : "#c9a84c";

  const [localMode, setLocalMode] = useState<ViewMode>("real");
  const [showBadgeSplash, setShowBadgeSplash] = useState(false);

  useEffect(() => {
    if (member) {
      setLocalMode(viewMode);
      if (member.badge) {
        setShowBadgeSplash(true);
        const timer = setTimeout(() => setShowBadgeSplash(false), 3500);
        return () => clearTimeout(timer);
      } else {
        setShowBadgeSplash(false);
      }
    }
  }, [member, viewMode]);

  // Fermeture clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (member) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [member]);

  const isAnime = localMode === "anime";

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#08080f",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* ── OVERLAY BADGE PLEIN ÉCRAN ──────────────────────────────── */}
          <AnimatePresence>
            {showBadgeSplash && member.badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => setShowBadgeSplash(false)}
                style={{
                  position: "fixed", inset: 0, zIndex: 99999,
                  background: "rgba(0,0,0,0.85)", backdropFilter: "blur(15px)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  initial={{ y: 50 }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}
                >
                  <Trophy size={isMobile ? 80 : 120} color="#ffd700" strokeWidth={1.5} style={{ marginBottom: "20px", filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }} />
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "20px" : "28px", fontWeight: 700, color: "#fff", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
                    AWARDS OTAKU OBTENU
                  </p>
                  <h2 style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: isMobile ? "clamp(36px,10vw,60px)" : "clamp(60px,8vw,100px)",
                    fontWeight: 900, color: "#ffd700", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase",
                    textShadow: "0 0 40px rgba(255,215,0,0.4), 0 4px 10px rgba(0,0,0,0.8)"
                  }}>
                    {member.badge}
                  </h2>
                </motion.div>
                <p style={{ position: "absolute", bottom: "30px", color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Cliquez pour continuer
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SWITCH RÉEL / ANIME ─────────────────────────────────────── */}
          <div style={{
            position: "fixed",
            top: isMobile ? "16px" : "24px",
            left: "50%", transform: "translateX(-50%)",
            zIndex: 10000,
            display: "flex", background: "rgba(0,0,0,0.6)", borderRadius: "100px", padding: "4px",
            backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)",
          }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLocalMode(mode)}
                style={{
                  padding: isMobile ? "6px 14px" : "7px 18px",
                  borderRadius: "100px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, textTransform: "uppercase",
                  background: localMode === mode ? accent : "transparent",
                  color: localMode === mode ? "#fff" : "#aaa",
                  transition: "all 0.3s",
                }}
              >
                {mode === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>

          {/* ── BOUTON FERMER ────────────────────────────────────────────── */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: "fixed",
              top: isMobile ? "16px" : "24px",
              left: isMobile ? "16px" : "auto",
              right: isMobile ? "auto" : "24px",
              zIndex: 10000,
              display: "flex", alignItems: "center", gap: "6px",
              padding: isMobile ? "8px 14px" : "9px 16px",
              borderRadius: "100px",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "15px", fontWeight: 700, textTransform: "uppercase",
              backdropFilter: "blur(8px)", cursor: "pointer",
            }}
          >
            {isMobile ? <><span style={{ fontSize: "16px" }}>←</span> Retour</> : <span style={{ fontSize: "18px", lineHeight: 1, padding: "0 4px" }}>✕</span>}
          </button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <div style={{
              position: "relative", width: "100%",
              height: isMobile ? "65vh" : "100vh",
              minHeight: isMobile ? "380px" : "650px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              background: "#08080f", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: isMobile ? "100%" : "55%",
                height: isMobile ? "100%" : "90%",
                zIndex: 1,
              }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={localMode}
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    src={isAnime ? member.animeChar : member.photo}
                    alt={member.name}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: isMobile ? "cover" : "contain",
                      objectPosition: isMobile ? "center 20%" : "bottom",
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder .jpg"; }}
                  />
                </AnimatePresence>
                {isMobile && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to top, rgba(8,8,15,1) 0%, rgba(8,8,15,0.5) 40%, transparent 100%)" }} />
                )}
              </div>

              <div style={{ position: "relative", padding: isMobile ? "20px 20px 30px" : "0 0 80px 5%", zIndex: 5 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "13px" : "18px", fontWeight: 700, color: accent, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "5px" }}>
                  {member.rank}
                </p>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "clamp(32px, 10vw, 52px)" : "clamp(60px,8vw,100px)", fontWeight: 900, color: "#fff", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase" }}>
                  {member.name}
                </h1>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: accent, zIndex: 10 }} />
            </div>

            {/* ── INFOS ─────────────────────────────────────────────────────── */}
            <div style={{ padding: isMobile ? "36px 20px" : "72px 5%", background: "#fff", color: "#000" }}>
              <div style={{ maxWidth: "960px", margin: "0 auto" }}>

                {/* STATS */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: "2px", background: "rgba(0,0,0,0.06)",
                  borderRadius: "14px", overflow: "hidden", marginBottom: isMobile ? "40px" : "60px",
                }}>
                  {[
                    { label: "Rang",         value: member.rank     },
                    { label: "Anniversaire", value: member.birthday },
                    { label: "Guilde",       value: "Otaku"         },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "#fff", padding: isMobile ? "20px" : "25px", borderTop: `4px solid ${accent}`, textAlign: "center" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "22px" : "28px", fontWeight: 900, color: "#111", marginTop: "5px" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* BIOGRAPHIE */}
                <div style={{ marginBottom: isMobile ? "48px" : "80px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "25px" }}>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                    <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em", fontSize: isMobile ? "15px" : "18px" }}>BIOGRAPHIE</p>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                  </div>
                  <p style={{ fontSize: isMobile ? "17px" : "22px", fontWeight: 600, lineHeight: 1.6, maxWidth: "760px", margin: "0 auto", color: "#333" }}>
                    {member.bio}
                  </p>
                </div>

                {/* ALTER EGO */}
                <div style={{ borderTop: "1px solid #eee", paddingTop: isMobile ? "40px" : "60px", paddingBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "36px" }}>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                    <p style={{ fontSize: isMobile ? "16px" : "22px", fontWeight: 900, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>PERSONNAGE ASSOCIÉ</p>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {[
                      { src: isAnime ? member.animeChar : member.photo, label: isAnime ? "Alter Ego Manga" : "Dans la vraie vie" },
                      { src: isAnime ? member.photo : member.animeChar, label: isAnime ? "Dans la vraie vie" : "Alter Ego Manga" },
                    ].map((card, i) => (
                      <div key={i} style={{ position: "relative", height: isMobile ? "320px" : "440px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 36px rgba(0,0,0,0.1)", border: "1px solid #eaeaea" }}>
                        <img src={card.src} alt={card.label} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder .jpg"; }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
                        <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px", textAlign: "center" }}>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                            {card.label}
                          </p>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>
                            {member.name}
                          </p>
                        </div>
                      </div>
                    ))}
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