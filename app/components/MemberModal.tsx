"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useRef, useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents } from "../config/ranks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Trophy, ArrowLeft } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

const PLACEHOLDER = "/placeholder.svg";

export default function MemberModal({ member, onClose, viewMode }: {
  member: Member | null;
  onClose: () => void;
  viewMode: ViewMode;
}) {
  const isMobile = useIsMobile();
  const accent = member
    ? (rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c")
    : "#c9a84c";

  const [localMode, setLocalMode]         = useState<ViewMode>("real");
  const [showBadge, setShowBadge]         = useState(false);
  const [heroImgError, setHeroImgError]   = useState(false);
  const [card1ImgError, setCard1ImgError] = useState(false);
  const [card2ImgError, setCard2ImgError] = useState(false);
  const closeRef  = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId   = "modal-member-title";

  // Reset state when member changes
  useEffect(() => {
    if (!member) return;
    setLocalMode(viewMode);
    setHeroImgError(false);
    setCard1ImgError(false);
    setCard2ImgError(false);
    setShowBadge(Boolean(member.badge));
    // reset scroll position
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(() => closeRef.current?.focus());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  // Auto-dismiss badge splash
  useEffect(() => {
    if (!showBadge) return;
    const t = setTimeout(() => setShowBadge(false), 3500);
    return () => clearTimeout(t);
  }, [showBadge]);

  // Keyboard close
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showBadge) setShowBadge(false);
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, showBadge]);

  // Body scroll lock — iOS Safari requires position:fixed on body to truly prevent
  // background scroll. We save/restore scrollY so the page doesn't jump.
  useEffect(() => {
    if (!member) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [member]);

  const isAnime       = localMode === "anime";
  const heroVideoSrc  = isAnime ? member?.animeVideo  : member?.photoVideo;
  const card2VideoSrc = isAnime ? member?.photoVideo  : member?.animeVideo;
  const heroSrc    = heroImgError  ? PLACEHOLDER : (isAnime ? member?.animeChar : member?.photo)    ?? PLACEHOLDER;
  const card1Src   = card1ImgError ? PLACEHOLDER : (isAnime ? member?.animeChar : member?.photo)    ?? PLACEHOLDER;
  const card2Src   = card2ImgError ? PLACEHOLDER : (isAnime ? member?.photo     : member?.animeChar) ?? PLACEHOLDER;
  const card1Label = isAnime ? "Alter Ego Manga"   : "Dans la vraie vie";
  const card2Label = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  return (
    <>
      {/* ── BADGE SPLASH ───────────────────────────────────────────────────────
          Rendered as a sibling OUTSIDE the modal motion.div so that
          Framer Motion's internal transform on the modal cannot trap this
          position:fixed element inside a sub-stacking context.               */}
      <AnimatePresence>
        {showBadge && member?.badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.45 }}
            onClick={() => setShowBadge(false)}
            role="alertdialog"
            aria-label={`Award Otaku obtenu : ${member.badge}`}
            style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(0,0,0,0.95)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.15, duration: 0.55, type: "spring", stiffness: 200, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 32px" }}
            >
              <Trophy
                size={isMobile ? 80 : 120}
                color="#ffd700"
                strokeWidth={1.5}
                style={{ marginBottom: "24px", filter: "drop-shadow(0 0 24px rgba(255,215,0,0.7))" }}
              />
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "12px" }}>
                AWARDS OTAKU OBTENU
              </p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(40px, 11vw, 80px)", fontWeight: 900, color: "#ffd700", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase", textShadow: "0 0 40px rgba(255,215,0,0.5)" }}>
                {member.badge}
              </p>
            </motion.div>
            <p style={{ position: "absolute", bottom: "32px", color: "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Appuyer pour continuer
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL ──────────────────────────────────────────────────────────────
          Architecture iOS-safe :
          • Outer div: position:fixed, display:flex, flex-direction:column,
            overflow:hidden  →  defines the viewport-sized shell, NO scroll
          • Nav bar: flex-shrink:0  →  always on screen, never scrolls
          • Inner div: flex:1, overflow-y:scroll  →  THE only scroll container
            overflow-y:scroll (not auto!) forces iOS to recognise it as
            a scroll container even before the first user touch.              */}
      <AnimatePresence>
        {member && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="modal-fullscreen"
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              background: "#08080f",
            }}
          >
            {/* ── NAV BAR ──────────────────────────────────────────────────── */}
            <div
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px",
                paddingTop: isMobile ? "max(10px, env(safe-area-inset-top, 10px))" : "14px",
                background: "rgba(8,8,15,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                zIndex: 2,
              }}
            >
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "100px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#fff", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px", fontWeight: 700, textTransform: "uppercase",
                }}
              >
                <ArrowLeft size={15} />
                Retour
              </button>

              <div
                role="group"
                aria-label="Mode d'affichage"
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: "100px", padding: "3px",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                {(["real", "anime"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLocalMode(mode)}
                    aria-pressed={localMode === mode}
                    style={{
                      padding: "6px 16px", borderRadius: "100px",
                      border: "none", cursor: "pointer",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "13px", fontWeight: 700, textTransform: "uppercase",
                      background: localMode === mode ? accent : "transparent",
                      color: localMode === mode ? "#fff" : "rgba(255,255,255,0.45)",
                      transition: "background 0.22s, color 0.22s",
                      boxShadow: localMode === mode ? `0 2px 10px ${accent}55` : "none",
                    }}
                  >
                    {mode === "real" ? "Réel" : "Anime"}
                  </button>
                ))}
              </div>

              {/* spacer so switch is centred */}
              <div style={{ width: "80px" }} aria-hidden="true" />
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "scroll",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                paddingBottom: "env(safe-area-inset-bottom, 20px)",
              }}
            >
              {/* HERO */}
              <div style={{
                position: "relative",
                // Fixed px on mobile — vh recalculates when browser chrome
                // hides/shows on iOS, causing jumps and black flashes.
                height: isMobile ? "300px" : "85vh",
                minHeight: isMobile ? "300px" : "560px",
                background: "#050508",
                overflow: "hidden",
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={localMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: "absolute", inset: 0, zIndex: 1 }}
                  >
                    {heroVideoSrc ? (
                      <VideoPlayer
                        src={heroVideoSrc}
                        fit="cover"
                        objectPosition="smart"
                        fullscreenBtn
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroSrc}
                        alt={`${member.name} — ${isAnime ? "avatar anime" : "photo réelle"}`}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          objectPosition: "center 15%",
                        }}
                        onError={() => setHeroImgError(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Gradient overlay */}
                <div style={{
                  position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                  background: "linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.5) 45%, rgba(5,5,8,0.1) 100%)",
                }} />

                {/* Name */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: isMobile ? "16px 20px 20px" : "0 5% 48px",
                  zIndex: 3,
                }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "11px", fontWeight: 700,
                    color: accent, letterSpacing: "0.28em", textTransform: "uppercase",
                    marginBottom: "4px",
                  }}>
                    {member.rank}
                  </p>
                  <h1
                    id={titleId}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: isMobile ? "clamp(34px, 9vw, 54px)" : "clamp(60px, 8vw, 100px)",
                      fontWeight: 900, color: "#fff",
                      lineHeight: 0.88, fontStyle: "italic", textTransform: "uppercase",
                    }}
                  >
                    {member.name}
                  </h1>
                </div>

                {/* Accent bar */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: accent, zIndex: 4 }} />
              </div>

              {/* INFO SECTION */}
              <div style={{ background: "#0d0d14", color: "#fff", padding: isMobile ? "28px 18px 32px" : "64px 5% 80px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>

                  {/* STATS ROW */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                    borderRadius: "12px", overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                    marginBottom: isMobile ? "32px" : "56px",
                  }}>
                    {[
                      { label: "Rang",        value: member.rank     },
                      { label: "Anniversaire",value: member.birthday },
                      { label: "Guilde",      value: "Otaku"         },
                    ].map((s) => (
                      <div key={s.label} style={{
                        padding: isMobile ? "14px 8px" : "22px",
                        borderTop: `3px solid ${accent}`,
                        textAlign: "center",
                        background: "rgba(255,255,255,0.02)",
                      }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "9px" : "12px", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {s.label}
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "15px" : "26px", fontWeight: 900, color: "#fff", marginTop: "4px", lineHeight: 1.1 }}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* BIOGRAPHIE */}
                  <div style={{ marginBottom: isMobile ? "36px" : "64px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ width: "28px", height: "3px", background: accent, borderRadius: "2px" }} />
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "13px" : "17px", fontWeight: 800, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        BIOGRAPHIE
                      </p>
                      <div style={{ width: "28px", height: "3px", background: accent, borderRadius: "2px" }} />
                    </div>
                    <p style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: isMobile ? "15px" : "20px",
                      fontWeight: 400, lineHeight: 1.7,
                      color: "rgba(255,255,255,0.72)",
                      maxWidth: "680px", margin: "0 auto",
                    }}>
                      {member.bio ?? "Aucune biographie disponible pour ce membre."}
                    </p>
                  </div>

                  {/* ALTER EGO */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: isMobile ? "28px" : "56px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
                      <div style={{ width: "28px", height: "3px", background: accent, borderRadius: "2px" }} />
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "13px" : "18px", fontWeight: 900, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        PERSONNAGE ASSOCIÉ
                      </p>
                      <div style={{ width: "28px", height: "3px", background: accent, borderRadius: "2px" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                      {[
                        { video: heroVideoSrc,  img: card1Src, label: card1Label, onErr: () => setCard1ImgError(true) },
                        { video: card2VideoSrc, img: card2Src, label: card2Label, onErr: () => setCard2ImgError(true) },
                      ].map(({ video, img, label, onErr }) => (
                        <div
                          key={label}
                          style={{
                            position: "relative",
                            height: isMobile ? "220px" : "400px",
                            borderRadius: "14px", overflow: "hidden",
                            border: `1px solid ${accent}20`,
                            background: "#050508",
                          }}
                        >
                          {video ? (
                            <VideoPlayer src={video} fit="cover" objectPosition="smart" fullscreenBtn />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt={`${member.name} — ${label}`}
                              loading="lazy"
                              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                              onError={onErr}
                            />
                          )}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
                          <div style={{ position: "absolute", bottom: "14px", left: "12px", right: "12px", textAlign: "center" }}>
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "3px" }}>
                              {label}
                            </p>
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>
                              {member.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
            {/* end scrollable body */}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
