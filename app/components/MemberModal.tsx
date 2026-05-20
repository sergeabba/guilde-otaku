"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Member } from "../../data/members";
import { useEffect, useRef, useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents, rankBg, darkRanks } from "../config/ranks";
import { Trophy, ArrowLeft, Share2 } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

const PLACEHOLDER = "/placeholder.svg";

function ModalContent({ member, onClose, viewMode }: {
  member: Member;
  onClose: () => void;
  viewMode: ViewMode;
}) {
  // Synchronous — safe because ModalContent only renders after the `mounted` guard (client-only).
  // Using useIsMobile() starts at false (SSR-safe), then flips in useEffect → wrong initial
  // animation and layout flash. useState lazy initializer runs synchronously before first paint.
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  // ── Thème adaptatif ────────────────────────────────────────────────────────
  const isDark     = darkRanks.includes(member.rank);
  const bg         = rankBg[member.rank]?.bg ?? "#09080a";
  const accent     = rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c";
  const textPrimary = isDark ? "#ffffff"               : "#111111";
  const textMuted   = isDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.52)";
  const borderColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const cardBg      = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)";
  const navBg       = isDark ? "rgba(4,4,8,0.90)"        : "rgba(255,255,255,0.90)";
  const btnBg       = isDark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.06)";
  const btnBorder   = isDark ? "rgba(255,255,255,0.14)"   : "rgba(0,0,0,0.1)";
  const infoBg      = isDark ? "rgba(0,0,0,0.18)"         : "rgba(255,255,255,0.6)";

  // ── State ──────────────────────────────────────────────────────────────────
  const [localMode, setLocalMode]       = useState<ViewMode>(viewMode);
  const [showBadge, setShowBadge]       = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [card1ImgError, setCard1ImgError] = useState(false);
  const [card2ImgError, setCard2ImgError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef  = useRef<HTMLButtonElement>(null);
  const titleId   = "modal-member-title";

  useEffect(() => {
    setLocalMode(viewMode);
    setHeroImgError(false);
    setCard1ImgError(false);
    setCard2ImgError(false);
    setShowBadge(Boolean(member.badge));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(() => closeRef.current?.focus());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  useEffect(() => {
    if (!showBadge) return;
    const t = setTimeout(() => setShowBadge(false), 3500);
    return () => clearTimeout(t);
  }, [showBadge]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showBadge) setShowBadge(false);
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, showBadge]);

  const [shareToast, setShareToast] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/membres/${member.id}`;
    const shareData = { title: `${member.name} — Guilde Otaku`, text: `Découvre le profil de ${member.name} sur la Guilde Otaku !`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  // iOS Safari scroll lock
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, []);

  // ── Médias ─────────────────────────────────────────────────────────────────
  const isAnime       = localMode === "anime";
  const heroVideoSrc  = isAnime ? member.animeVideo : member.photoVideo;
  const card2VideoSrc = isAnime ? member.photoVideo : member.animeVideo;
  const heroSrc  = heroImgError  ? PLACEHOLDER : (isAnime ? member.animeChar : member.photo)     ?? PLACEHOLDER;
  const card1Src = card1ImgError ? PLACEHOLDER : (isAnime ? member.animeChar : member.photo)     ?? PLACEHOLDER;
  const card2Src = card2ImgError ? PLACEHOLDER : (isAnime ? member.photo     : member.animeChar) ?? PLACEHOLDER;
  const card1Label = isAnime ? "Alter Ego Manga"   : "Dans la vraie vie";
  const card2Label = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  const HeroMedia = (
    <AnimatePresence mode="wait">
      <motion.div
        key={localMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32 }}
        style={{ position: "absolute", inset: 0 }}
      >
        {heroVideoSrc ? (
          <VideoPlayer src={heroVideoSrc} fit="cover" objectPosition="smart" fullscreenBtn />
        ) : (
          <Image
            src={heroSrc}
            alt={`${member.name} — ${isAnime ? "avatar anime" : "photo réelle"}`}
            fill
            sizes="(max-width: 767px) 100vw, 44vw"
            className="object-cover"
            style={{ objectPosition: "center 15%" }}
            onError={() => setHeroImgError(true)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  const stats = [
    { label: "Rang",         value: member.rank     },
    { label: "Anniversaire", value: member.birthday },
    { label: "Guilde",       value: "Otaku"         },
  ];

  // ── Section info — desktop garde la grille 3 colonnes, mobile garde les séparateurs ──
  const InfoSection = (
    <div style={{ background: infoBg, minHeight: "100%" }}>
      <div style={{ padding: isMobile ? "0" : "52px 56px 72px", maxWidth: isMobile ? "none" : 560 }}>

        {/* STATS */}
        {isMobile ? (
          // Mobile : sections verticales avec lignes séparatrices pleine largeur
          <div style={{ marginBottom: 36 }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ height: 1.5, background: accent }} />
                <div style={{ padding: "20px 20px", textAlign: "center" }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12, fontWeight: 800,
                    color: accent, textTransform: "uppercase",
                    letterSpacing: "0.22em", marginBottom: 6,
                  }}>
                    {s.label}
                  </p>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 26, fontWeight: 900,
                    color: textPrimary, lineHeight: 1.1,
                  }}>
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
            <div style={{ height: 1.5, background: accent }} />
          </div>
        ) : (
          // Desktop : grille 3 colonnes
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2, borderRadius: 14, overflow: "hidden",
            border: `1px solid ${borderColor}`,
            marginBottom: 44,
            boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)",
          }}>
            {stats.map((s) => (
              <div key={s.label} style={{
                padding: "24px 16px",
                borderTop: `3px solid ${accent}`,
                textAlign: "center",
                background: cardBg,
              }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11, fontWeight: 700,
                  color: accent, textTransform: "uppercase",
                  letterSpacing: "0.12em", marginBottom: 6,
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20, fontWeight: 900,
                  color: textPrimary, lineHeight: 1.1,
                }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* BIO */}
        <div style={{ marginBottom: isMobile ? 36 : 52, padding: isMobile ? "0 20px" : "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 22, height: 2, background: accent, borderRadius: 2, flexShrink: 0 }} />
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13, fontWeight: 800,
              color: accent, letterSpacing: "0.24em", textTransform: "uppercase",
            }}>
              BIOGRAPHIE
            </p>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: isMobile ? 17 : 18,
            fontWeight: 600, lineHeight: 1.85,
            color: textPrimary,
          }}>
            {member.bio ?? "Aucune biographie disponible pour ce membre."}
          </p>
        </div>

        {/* ALTER EGO */}
        <div style={{ padding: isMobile ? "0 20px 48px" : "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 22, height: 2, background: accent, borderRadius: 2, flexShrink: 0 }} />
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13, fontWeight: 800,
              color: accent, letterSpacing: "0.24em", textTransform: "uppercase",
            }}>
              PERSONNAGE ASSOCIÉ
            </p>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            {[
              { video: heroVideoSrc,  img: card1Src, label: card1Label, onErr: () => setCard1ImgError(true) },
              { video: card2VideoSrc, img: card2Src, label: card2Label, onErr: () => setCard2ImgError(true) },
            ].map(({ video, img, label, onErr }) => (
              <div key={label} style={{
                position: "relative",
                height: isMobile ? 200 : 220,
                borderRadius: 12, overflow: "hidden",
                border: `1px solid ${borderColor}`,
                background: isDark ? "#050508" : "#e8e8ec",
                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                {video ? (
                  <VideoPlayer src={video} fit="cover" objectPosition="smart" fullscreenBtn />
                ) : (
                  <Image
                    src={img}
                    alt={`${member.name} — ${label}`}
                    fill
                    sizes="(max-width: 767px) 100vw, 280px"
                    className="object-cover"
                    style={{ objectPosition: "center 15%" }}
                    onError={onErr}
                  />
                )}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 52%)",
                }} />
                <div style={{ position: "absolute", bottom: 12, left: 10, right: 10, textAlign: "center" }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 9, fontWeight: 800,
                    color: accent, textTransform: "uppercase",
                    letterSpacing: "0.16em", marginBottom: 2,
                  }}>
                    {label}
                  </p>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 18, fontWeight: 900,
                    color: "#fff", lineHeight: 1,
                    textTransform: "uppercase", fontStyle: "italic",
                  }}>
                    {member.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* ── BADGE SPLASH ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBadge && member.badge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => setShowBadge(false)}
            role="alertdialog"
            aria-label={`Award Otaku obtenu : ${member.badge}`}
            style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(0,0,0,0.96)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 32 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 200, damping: 22 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 28px" }}
            >
              <Trophy
                size={isMobile ? 72 : 110}
                color="#ffd700"
                strokeWidth={1.5}
                style={{ marginBottom: 22, filter: "drop-shadow(0 0 28px rgba(255,215,0,0.75))" }}
              />
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 12, fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14,
              }}>
                AWARDS OTAKU OBTENU
              </p>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(38px,10vw,76px)",
                fontWeight: 900, color: "#ffd700",
                lineHeight: 0.92, fontStyle: "italic",
                textTransform: "uppercase",
                textShadow: "0 0 50px rgba(255,215,0,0.55)",
              }}>
                {member.badge}
              </p>
            </motion.div>
            <p style={{
              position: "absolute", bottom: 28,
              color: "rgba(255,255,255,0.22)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              Appuyer pour continuer
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACKDROP ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onClick={isMobile ? onClose : undefined}
        style={{
          position: "fixed", inset: 0, zIndex: 9997,
          background: isMobile ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.75)",
          backdropFilter: isMobile ? undefined : "blur(10px)",
          WebkitBackdropFilter: isMobile ? undefined : "blur(10px)",
          cursor: isMobile ? "pointer" : "default",
        }}
      />

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.94, y: 40 }}
        animate={isMobile ? { y: 0 }      : { opacity: 1, scale: 1,    y: 0  }}
        exit={isMobile
          ? { y: "100%", transition: { type: "spring", stiffness: 260, damping: 30 } }
          : { opacity: 0, scale: 0.96, y: 30, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }
        }
        transition={isMobile
          ? { type: "spring", stiffness: 240, damping: 28, mass: 0.85 }
          : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          background: bg,
        }}
      >
        {isMobile ? (

          /* ── MOBILE : plein écran ─────────────────────────────────────────── */
          <div
            ref={scrollRef}
            style={{
              flex: 1, minHeight: 0,
              overflowY: "scroll",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            {/* Hero pleine largeur */}
            <div style={{ position: "relative", height: "62vh", minHeight: 280, overflow: "hidden", flexShrink: 0 }}>
              {HeroMedia}

              {/* Gradient — plus sombre en haut pour lisibilité des boutons */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.88) 100%)",
              }} />

              {/* ── CONTRÔLES FLOTTANTS : RETOUR + RÉEL / ANIME ── */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: "max(16px, env(safe-area-inset-top, 16px))",
                  left: 16,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  zIndex: 5,
                }}
              >
                {/* Bouton Retour */}
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Fermer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px 8px 10px",
                    borderRadius: 100,
                    background: "rgba(0,0,0,0.52)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "#fff", cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}
                >
                  <ArrowLeft size={14} />
                  Retour
                </button>

                {/* Switch Réel / Anime */}
                <div style={{
                  display: "flex", gap: 4,
                  background: "rgba(0,0,0,0.52)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 100, padding: 4,
                }}>
                  {(["real", "anime"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLocalMode(mode)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 100,
                        border: "none", cursor: "pointer",
                        background: localMode === mode ? accent : "transparent",
                        color: localMode === mode ? "#fff" : "rgba(255,255,255,0.7)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 13, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        transition: "background 0.2s, color 0.2s",
                        boxShadow: localMode === mode ? `0 2px 10px ${accent}55` : "none",
                      }}
                    >
                      {mode === "real" ? "Réel" : "Anime"}
                    </button>
                  ))}
                </div>

                {/* Share */}
                <button
                  onClick={handleShare}
                  aria-label="Partager"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 38, height: 38, borderRadius: 100,
                    background: `linear-gradient(135deg, ${accent}dd, ${accent}88)`,
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "none",
                    color: "#000", cursor: "pointer",
                    boxShadow: `0 4px 16px ${accent}55`,
                  }}
                >
                  <Share2 size={15} strokeWidth={2.5} />
                </button>
              </motion.div>

              {/* Nom + Rang en bas du hero */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 22px", zIndex: 3 }}
              >
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 12, fontWeight: 700,
                  color: accent, letterSpacing: "0.28em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  {member.rank}
                </p>
                <h1
                  id={titleId}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "clamp(40px, 12vw, 66px)",
                    fontWeight: 900, color: "#fff",
                    lineHeight: 0.88, fontStyle: "italic", textTransform: "uppercase",
                  }}
                >
                  {member.name}
                </h1>
              </motion.div>

              {/* Ligne accent bas du hero */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: accent, zIndex: 4 }} />
            </div>

            {/* Contenu info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {InfoSection}
            </motion.div>
          </div>

        ) : (

          /* ── DESKTOP : nav + 2 colonnes ────────────────────────────────────── */
          <>
            {/* NAV */}
            <div style={{ flexShrink: 0, background: navBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${borderColor}`, zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Fermer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px", borderRadius: 100,
                    background: btnBg, border: `1px solid ${btnBorder}`,
                    color: textPrimary, cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                    transition: "background 0.18s", flexShrink: 0,
                  }}
                >
                  <ArrowLeft size={14} />
                  Retour
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Partager le profil"
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 20px", borderRadius: 100,
                    background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                    border: `1.5px solid ${accent}66`,
                    color: accent, cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    transition: "all 0.2s",
                  }}
                >
                  <Share2 size={14} />
                  Partager
                </button>
                </div>
                <div style={{ textAlign: "center", flex: 1, padding: "0 8px", minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    color: accent, letterSpacing: "0.22em",
                    textTransform: "uppercase", marginBottom: 2,
                  }}>
                    {member.rank}
                  </p>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 24, fontWeight: 900,
                    color: textPrimary, fontStyle: "italic",
                    textTransform: "uppercase", lineHeight: 1,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {member.name}
                  </p>
                </div>
                <div style={{ width: 90, flexShrink: 0 }} />
              </div>
            </div>

            {/* BODY 2 colonnes */}
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                style={{ flex: "0 0 44%", position: "relative", overflow: "hidden" }}
              >
                {HeroMedia}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 36px 36px", zIndex: 3 }}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: accent, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>
                    {member.rank}
                  </p>
                  <h1
                    id={titleId}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(48px,5.5vw,86px)", fontWeight: 900, color: "#fff", lineHeight: 0.86, fontStyle: "italic", textTransform: "uppercase" }}
                  >
                    {member.name}
                  </h1>
                </div>
                <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 3, background: accent, zIndex: 4 }} />
              </motion.div>

              <motion.div
                ref={scrollRef}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                style={{ flex: 1, overflowY: "scroll", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
              >
                {InfoSection}
              </motion.div>
            </div>
          </>
        )}
      </motion.div>

      {/* ── SWITCH FLOTTANT — desktop seulement ─────────────────────────────── */}
      {/* ── SHARE TOAST ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: "fixed", bottom: isMobile ? 90 : 110, left: "50%", transform: "translateX(-50%)",
              zIndex: 10010,
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 28px", borderRadius: 14,
              background: "rgba(10,10,18,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${accent}`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, #ffd700)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Share2 size={13} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14, fontWeight: 800, color: "#fff",
                letterSpacing: "0.04em", margin: 0, lineHeight: 1.2,
              }}>
                Lien copié
              </p>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                margin: 0, lineHeight: 1.2,
              }}>
                Prêt à partager sur WhatsApp, Insta...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.88, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 24, scale: 0.88, x: "-50%" }}
          transition={{ delay: 0.45, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: "32px",
            left: "50%",
            zIndex: 10002,
            display: "flex",
            background: isDark ? "rgba(10,10,18,0.88)" : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 100,
            padding: 5,
            border: `1px solid ${btnBorder}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${accent}33`,
          }}
          role="group"
          aria-label="Mode d'affichage"
        >
          {(["real", "anime"] as ViewMode[]).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setLocalMode(mode)}
              whileTap={{ scale: 0.93 }}
              style={{
                padding: "10px 28px",
                borderRadius: 100,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 15, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: localMode === mode ? accent : "transparent",
                color: localMode === mode ? "#fff" : textMuted,
                transition: "background 0.22s, color 0.22s",
                boxShadow: localMode === mode ? `0 3px 14px ${accent}66` : "none",
              }}
            >
              {mode === "real" ? "Réel" : "Anime"}
            </motion.button>
          ))}
        </motion.div>
      )}

    </>
  );
}

export default function MemberModal({ member, onClose, viewMode }: {
  member: Member | null;
  onClose: () => void;
  viewMode: ViewMode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {member && (
        <ModalContent
          key={member.id}
          member={member}
          onClose={onClose}
          viewMode={viewMode}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
