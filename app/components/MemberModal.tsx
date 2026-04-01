"use client";

// ─── app/components/MemberModal.tsx ──────────────────────────────────────────
// v2 — Améliorations :
//   1. role="dialog" + aria-modal + aria-labelledby pour l'accessibilité
//   2. Fix chemin placeholder ("/placeholder.svg" sans espace)
//   3. Gestion d'erreur image améliorée avec état local
//   4. Badge splash : fermeture aussi sur touche Escape
//   5. Focus trap : focus automatique sur le bouton fermer à l'ouverture
//   6. aria-pressed sur les boutons de mode

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useRef, useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents } from "../config/ranks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Trophy, X, ArrowLeft } from "lucide-react";

const PLACEHOLDER = "/placeholder.svg"; // ← Fix : plus d'espace dans le chemin

export default function MemberModal({ member, onClose, viewMode }: {
  member: Member | null;
  onClose: () => void;
  viewMode: ViewMode;
}) {
  const isMobile = useIsMobile();
  const accent   = member
    ? (rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c")
    : "#c9a84c";

  const [localMode, setLocalMode]             = useState<ViewMode>("real");
  const [showBadgeSplash, setShowBadgeSplash] = useState(false);
  const [heroImgError, setHeroImgError]       = useState(false);
  const [card1ImgError, setCard1ImgError]     = useState(false);
  const [card2ImgError, setCard2ImgError]     = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = "modal-member-title";

  // Sync mode + badge splash à l'ouverture
  useEffect(() => {
    if (member) {
      setLocalMode(viewMode);
      setHeroImgError(false);
      setCard1ImgError(false);
      setCard2ImgError(false);
      if (member.badge) {
        setShowBadgeSplash(true);
        const timer = setTimeout(() => setShowBadgeSplash(false), 3500);
        return () => clearTimeout(timer);
      } else {
        setShowBadgeSplash(false);
      }
    }
  }, [member, viewMode]);

  // Fermeture clavier (Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showBadgeSplash) setShowBadgeSplash(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showBadgeSplash]);

  // Bloquer le scroll du body + focus trap à l'ouverture
  useEffect(() => {
    if (member) {
      document.body.style.overflow = "hidden";
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [member]);

  const isAnime = localMode === "anime";
  const heroSrc = heroImgError
    ? PLACEHOLDER
    : (isAnime ? member?.animeChar : member?.photo) ?? PLACEHOLDER;

  // Sources pour les cartes alter ego
  const card1Src = card1ImgError ? PLACEHOLDER : (isAnime ? member?.animeChar : member?.photo) ?? PLACEHOLDER;
  const card2Src = card2ImgError ? PLACEHOLDER : (isAnime ? member?.photo : member?.animeChar) ?? PLACEHOLDER;
  const card1Label = isAnime ? "Alter Ego Manga" : "Dans la vraie vie";
  const card2Label = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
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
                role="alertdialog"
                aria-label={`Award Otaku obtenu : ${member.badge}`}
                style={{
                  position: "fixed", inset: 0, zIndex: 99999,
                  background: "rgba(0,0,0,0.85)", backdropFilter: "blur(15px)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}
                >
                  <Trophy
                    size={isMobile ? 80 : 120}
                    color="#ffd700"
                    strokeWidth={1.5}
                    aria-hidden="true"
                    style={{ marginBottom: "20px", filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }}
                  />
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: isMobile ? "20px" : "28px",
                    fontWeight: 700, color: "#fff",
                    letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px",
                  }}>
                    AWARDS OTAKU OBTENU
                  </p>
                  <h2 style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: isMobile ? "clamp(36px,10vw,60px)" : "clamp(60px,8vw,100px)",
                    fontWeight: 900, color: "#ffd700", lineHeight: 0.9,
                    fontStyle: "italic", textTransform: "uppercase",
                    textShadow: "0 0 40px rgba(255,215,0,0.4), 0 4px 10px rgba(0,0,0,0.8)",
                  }}>
                    {member.badge}
                  </h2>
                </motion.div>
                <p style={{
                  position: "absolute", bottom: "30px",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  Appuyez n'importe où pour continuer
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SWITCH RÉEL / ANIME ─────────────────────────────────────── */}
          <div
            role="group"
            aria-label="Mode d'affichage"
            style={{
              position: "fixed",
              top: isMobile ? "16px" : "24px",
              left: "50%", transform: "translateX(-50%)",
              zIndex: 10000,
              display: "flex",
              background: "rgba(0,0,0,0.6)",
              borderRadius: "100px",
              padding: "4px",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLocalMode(mode)}
                aria-pressed={localMode === mode}
                style={{
                  padding: isMobile ? "6px 14px" : "7px 18px",
                  borderRadius: "100px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "13px", fontWeight: 700, textTransform: "uppercase",
                  background: localMode === mode ? accent : "transparent",
                  color: localMode === mode ? "#fff" : "#aaa",
                  transition: "all 0.3s",
                  minHeight: "unset", minWidth: "unset",
                }}
              >
                {mode === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>

          {/* ── BOUTON FERMER ────────────────────────────────────────────── */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fermer la fiche membre"
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
              minHeight: "unset", minWidth: "unset",
            }}
          >
            {isMobile
              ? <><ArrowLeft size={16} aria-hidden="true" /> Retour</>
              : <X size={18} aria-hidden="true" />
            }
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
              {/* Image hero */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: isMobile ? "100%" : "55%",
                height: isMobile ? "100%" : "90%",
                zIndex: 1,
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={localMode}
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroSrc}
                      alt={`${member.name} — ${isAnime ? "avatar anime" : "photo réelle"}`}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: isMobile ? "cover" : "contain",
                        objectPosition: isMobile ? "center 20%" : "bottom",
                      }}
                      onError={() => setHeroImgError(true)}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Gradient overlay mobile */}
                {isMobile && (
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                    background: "linear-gradient(to top, rgba(8,8,15,1) 0%, rgba(8,8,15,0.5) 40%, transparent 100%)",
                  }} />
                )}
              </div>

              {/* Texte hero */}
              <div style={{ position: "relative", padding: isMobile ? "20px 20px 30px" : "0 0 80px 5%", zIndex: 5 }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: isMobile ? "13px" : "18px",
                  fontWeight: 700, color: accent,
                  letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "5px",
                }}>
                  {member.rank}
                </p>
                <h1
                  id={titleId}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: isMobile ? "clamp(32px, 10vw, 52px)" : "clamp(60px,8vw,100px)",
                    fontWeight: 900, color: "#fff",
                    lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase",
                  }}
                >
                  {member.name}
                </h1>
              </div>

              {/* Barre accent en bas */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: accent, zIndex: 10 }} />
            </div>

            {/* ── INFOS ─────────────────────────────────────────────────────── */}
            <div style={{ padding: isMobile ? "36px 20px" : "72px 5%", background: "#fff", color: "#000" }}>
              <div style={{ maxWidth: "960px", margin: "0 auto" }}>

                {/* STATS */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: "2px",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: "14px", overflow: "hidden",
                  marginBottom: isMobile ? "40px" : "60px",
                }}>
                  {[
                    { label: "Rang",         value: member.rank     },
                    { label: "Anniversaire", value: member.birthday },
                    { label: "Guilde",       value: "Otaku"         },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: "#fff",
                      padding: isMobile ? "20px" : "25px",
                      borderTop: `4px solid ${accent}`,
                      textAlign: "center",
                    }}>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "13px", fontWeight: 700,
                        color: accent, textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>
                        {stat.label}
                      </p>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: isMobile ? "22px" : "28px",
                        fontWeight: 900, color: "#111", marginTop: "5px",
                      }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* BIOGRAPHIE */}
                <div style={{ marginBottom: isMobile ? "48px" : "80px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "25px" }}>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                    <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em", fontSize: isMobile ? "15px" : "18px", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      BIOGRAPHIE
                    </p>
                    <div style={{ width: "30px", height: "3px", background: accent }} />
                  </div>
                  <p style={{
                    fontSize: isMobile ? "17px" : "22px",
                    fontWeight: 600, lineHeight: 1.6,
                    maxWidth: "760px", margin: "0 auto", color: "#333",
                    fontFamily: "'Barlow', sans-serif",
                  }}>
                    {member.bio}
                  </p>
                </div>

                {/* ALTER EGO */}
                <div style={{ borderTop: "1px solid #eee", paddingTop: isMobile ? "40px" : "60px", paddingBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "36px" }}>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                    <p style={{
                      fontSize: isMobile ? "16px" : "22px",
                      fontWeight: 900, color: accent,
                      letterSpacing: "0.2em", textTransform: "uppercase",
                      fontFamily: "'Barlow Condensed', sans-serif",
                    }}>
                      PERSONNAGE ASSOCIÉ
                    </p>
                    <div style={{ width: "40px", height: "4px", background: accent, borderRadius: "2px" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {/* Carte 1 */}
                    <div style={{
                      position: "relative",
                      height: isMobile ? "320px" : "440px",
                      borderRadius: "20px", overflow: "hidden",
                      boxShadow: "0 12px 36px rgba(0,0,0,0.1)",
                      border: "1px solid #eaeaea",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card1Src}
                        alt={`${member.name} — ${card1Label}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                        onError={() => setCard1ImgError(true)}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
                      <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                          {card1Label}
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>
                          {member.name}
                        </p>
                      </div>
                    </div>

                    {/* Carte 2 */}
                    <div style={{
                      position: "relative",
                      height: isMobile ? "320px" : "440px",
                      borderRadius: "20px", overflow: "hidden",
                      boxShadow: "0 12px 36px rgba(0,0,0,0.1)",
                      border: "1px solid #eaeaea",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card2Src}
                        alt={`${member.name} — ${card2Label}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                        onError={() => setCard2ImgError(true)}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
                      <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                          {card2Label}
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>
                          {member.name}
                        </p>
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
