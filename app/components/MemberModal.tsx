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

  const [localMode, setLocalMode]             = useState<ViewMode>("real");
  const [showBadgeSplash, setShowBadgeSplash] = useState(false);
  const [heroImgError, setHeroImgError]       = useState(false);
  const [card1ImgError, setCard1ImgError]     = useState(false);
  const [card2ImgError, setCard2ImgError]     = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const titleId        = "modal-member-title";

  useEffect(() => {
    if (!member) return;
    setLocalMode(viewMode);
    setHeroImgError(false);
    setCard1ImgError(false);
    setCard2ImgError(false);
    setShowBadgeSplash(Boolean(member.badge));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  useEffect(() => {
    if (member?.badge && showBadgeSplash) {
      const t = setTimeout(() => setShowBadgeSplash(false), 3500);
      return () => clearTimeout(t);
    }
  }, [member, showBadgeSplash]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showBadgeSplash) setShowBadgeSplash(false);
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showBadgeSplash]);

  // Body scroll lock — use overflow:hidden only (avoids the iOS vh recalculation
  // bug that position:fixed on body causes inside vh-based scroll containers).
  useEffect(() => {
    if (!member) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [member]);

  const isAnime      = localMode === "anime";
  const heroVideoSrc = isAnime ? member?.animeVideo   : member?.photoVideo;
  const card2VideoSrc= isAnime ? member?.photoVideo   : member?.animeVideo;
  const heroSrc      = heroImgError   ? PLACEHOLDER : (isAnime ? member?.animeChar  : member?.photo)    ?? PLACEHOLDER;
  const card1Src     = card1ImgError  ? PLACEHOLDER : (isAnime ? member?.animeChar  : member?.photo)    ?? PLACEHOLDER;
  const card2Src     = card2ImgError  ? PLACEHOLDER : (isAnime ? member?.photo      : member?.animeChar) ?? PLACEHOLDER;
  const card1Label   = isAnime ? "Alter Ego Manga"   : "Dans la vraie vie";
  const card2Label   = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          // Full-screen fixed overlay — NOT scrollable itself.
          // The inner scrollRef div handles all scrolling so iOS never
          // fights between the fixed overlay and the scroll container.
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#08080f",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ── BADGE SPLASH ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {showBadgeSplash && member.badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
                onClick={() => setShowBadgeSplash(false)}
                role="alertdialog"
                aria-label={`Award Otaku obtenu : ${member.badge}`}
                style={{
                  position: "fixed", inset: 0, zIndex: 10002,
                  background: "rgba(0,0,0,0.94)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
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
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "20px" : "28px", fontWeight: 700, color: "#fff", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
                    AWARDS OTAKU OBTENU
                  </p>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "clamp(36px,10vw,60px)" : "clamp(60px,8vw,100px)", fontWeight: 900, color: "#ffd700", lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase", textShadow: "0 0 40px rgba(255,215,0,0.4), 0 4px 10px rgba(0,0,0,0.8)" }}>
                    {member.badge}
                  </h2>
                </motion.div>
                <p style={{ position: "absolute", bottom: "30px", color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Appuyez n&apos;importe où pour continuer
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BARRE STICKY ─────────────────────────────────────────────── */}
          {/* This is a flex child (not sticky), which is more reliable than
              position:sticky inside an overflow container on iOS.            */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: isMobile ? "10px 16px" : "14px 24px",
              background: "rgba(8,8,15,0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              zIndex: 10001,
              // iOS safe area
              paddingTop: isMobile ? "max(10px, env(safe-area-inset-top))" : "14px",
            }}
          >
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Fermer la fiche membre"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "14px", fontWeight: 700, textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              {isMobile ? "Retour" : "Fermer"}
            </button>

            <div role="group" aria-label="Mode d'affichage" style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: "100px", padding: "3px", border: "1px solid rgba(255,255,255,0.14)" }}>
              {(["real", "anime"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLocalMode(mode)}
                  aria-pressed={localMode === mode}
                  style={{
                    padding: isMobile ? "5px 14px" : "6px 18px",
                    borderRadius: "100px", border: "none", cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px", fontWeight: 700, textTransform: "uppercase",
                    background: localMode === mode ? accent : "transparent",
                    color: localMode === mode ? "#fff" : "rgba(255,255,255,0.5)",
                    transition: "background 0.25s, color 0.25s",
                    boxShadow: localMode === mode ? `0 2px 10px ${accent}55` : "none",
                  }}
                >
                  {mode === "real" ? "Réel" : "Anime"}
                </button>
              ))}
            </div>

            <div style={{ width: isMobile ? 0 : "96px" }} />
          </div>

          {/* ── SCROLLABLE BODY ───────────────────────────────────────────── */}
          {/* flex: 1 + overflow-y: scroll is the most iOS-reliable pattern.
              The outer div is NOT scrollable — only this inner div scrolls.
              This avoids the iOS bug where overflow:auto on a position:fixed
              element ignores touches when body is also locked.               */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "scroll",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              // paddingBottom for iOS home bar
              paddingBottom: "env(safe-area-inset-bottom, 20px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* ── HERO IMAGE ──────────────────────────────────────────── */}
              <div style={{
                position: "relative",
                width: "100%",
                // Fixed px heights avoid the iOS vh recalculation bug
                height: isMobile ? "300px" : "100vh",
                minHeight: isMobile ? "300px" : "600px",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                background: "#08080f", overflow: "hidden",
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={localMode}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: isMobile ? "100%" : "55%",
                      height: isMobile ? "100%" : "90%",
                      zIndex: 1,
                    }}
                  >
                    {heroVideoSrc ? (
                      <VideoPlayer
                        src={heroVideoSrc}
                        fit="cover"
                        objectPosition={isMobile ? "smart" : "center bottom"}
                        fullscreenBtn
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroSrc}
                        alt={`${member.name} — ${isAnime ? "avatar anime" : "photo réelle"}`}
                        style={{
                          position: "absolute", inset: 0,
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          objectPosition: "center 20%",
                        }}
                        onError={() => setHeroImgError(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Gradient overlay */}
                <div style={{
                  position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                  background: isMobile
                    ? "linear-gradient(to top, #08080f 0%, rgba(8,8,15,0.55) 50%, rgba(8,8,15,0.15) 100%)"
                    : "linear-gradient(to right, #08080f 0%, rgba(8,8,15,0.85) 30%, rgba(8,8,15,0.2) 60%, transparent 100%)",
                }} />

                {/* Name overlay */}
                <div style={{ position: "relative", padding: isMobile ? "16px 20px 22px" : "0 0 60px 5%", zIndex: 5 }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: isMobile ? "11px" : "16px",
                    fontWeight: 700, color: accent,
                    letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "4px",
                  }}>
                    {member.rank}
                  </p>
                  <h1
                    id={titleId}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: isMobile ? "clamp(34px, 9vw, 52px)" : "clamp(60px, 8vw, 100px)",
                      fontWeight: 900, color: "#fff",
                      lineHeight: 0.9, fontStyle: "italic", textTransform: "uppercase",
                    }}
                  >
                    {member.name}
                  </h1>
                </div>

                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: accent, zIndex: 10 }} />
              </div>

              {/* ── INFOS ──────────────────────────────────────────────────── */}
              <div style={{ padding: isMobile ? "28px 20px 20px" : "72px 5%", background: "#0d0d14", color: "#fff" }}>
                <div style={{ maxWidth: "960px", margin: "0 auto" }}>

                  {/* STATS */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
                    gap: "2px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "14px", overflow: "hidden",
                    marginBottom: isMobile ? "32px" : "60px",
                  }}>
                    {[
                      { label: "Rang",         value: member.rank     },
                      { label: "Anniversaire", value: member.birthday },
                      { label: "Guilde",       value: "Otaku"         },
                    ].map((stat) => (
                      <div key={stat.label} style={{
                        background: "rgba(255,255,255,0.03)",
                        padding: isMobile ? "14px 8px" : "25px",
                        borderTop: `3px solid ${accent}`,
                        textAlign: "center",
                      }}>
                        <p style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: isMobile ? "10px" : "13px",
                          fontWeight: 700, color: accent,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>
                          {stat.label}
                        </p>
                        <p style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: isMobile ? "16px" : "28px",
                          fontWeight: 900, color: "#fff", marginTop: "4px",
                          lineHeight: 1.1,
                        }}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* BIOGRAPHIE */}
                  <div style={{ marginBottom: isMobile ? "36px" : "80px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
                      <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                      <p style={{ fontWeight: 800, color: accent, letterSpacing: "0.2em", fontSize: isMobile ? "13px" : "18px", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        BIOGRAPHIE
                      </p>
                      <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                    </div>
                    <p style={{
                      fontSize: isMobile ? "16px" : "22px",
                      fontWeight: 400, lineHeight: 1.65,
                      maxWidth: "760px", margin: "0 auto",
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {member.bio ?? "Aucune biographie disponible pour ce membre."}
                    </p>
                  </div>

                  {/* ALTER EGO */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: isMobile ? "32px" : "60px", paddingBottom: isMobile ? "20px" : "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "28px" }}>
                      <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                      <p style={{ fontSize: isMobile ? "13px" : "22px", fontWeight: 900, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        PERSONNAGE ASSOCIÉ
                      </p>
                      <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                      {[
                        { videoSrc: heroVideoSrc,  imgSrc: card1Src, label: card1Label, onError: () => setCard1ImgError(true), imgError: card1ImgError },
                        { videoSrc: card2VideoSrc, imgSrc: card2Src, label: card2Label, onError: () => setCard2ImgError(true), imgError: card2ImgError },
                      ].map(({ videoSrc, imgSrc, label, onError }) => (
                        <div
                          key={label}
                          style={{
                            position: "relative",
                            height: isMobile ? "240px" : "440px",
                            borderRadius: "16px", overflow: "hidden",
                            border: `1px solid ${accent}25`,
                            background: "#08080f",
                          }}
                        >
                          {videoSrc ? (
                            <VideoPlayer src={videoSrc} fit="cover" objectPosition="smart" fullscreenBtn />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={`${member.name} — ${label}`}
                              loading="lazy"
                              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                              onError={onError}
                            />
                          )}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 50%)" }} />
                          <div style={{ position: "absolute", bottom: "16px", left: "14px", right: "14px", textAlign: "center" }}>
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>
                              {label}
                            </p>
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", fontStyle: "italic" }}>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
