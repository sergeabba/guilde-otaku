"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useRef, useState } from "react";
import type { ViewMode } from "../types";
import { rankAccents, rankBg, darkRanks } from "../config/ranks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Trophy, ArrowLeft } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

const PLACEHOLDER = "/placeholder.svg";

function ModalContent({ member, onClose, viewMode }: {
  member: Member;
  onClose: () => void;
  viewMode: ViewMode;
}) {
  const isMobile = useIsMobile();

  // ── Thème adaptatif selon le rang ──────────────────────────────────────────
  const isDark  = darkRanks.includes(member.rank);
  const bg      = rankBg[member.rank]?.bg ?? "#09080a";
  const accent  = rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c";

  const textPrimary  = isDark ? "#ffffff"              : "#111111";
  const textMuted    = isDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.52)";
  const borderColor  = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const cardBg       = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)";
  const navBg        = isDark ? "rgba(4,4,8,0.90)"       : "rgba(255,255,255,0.90)";
  const btnBg        = isDark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.06)";
  const btnBorder    = isDark ? "rgba(255,255,255,0.14)"  : "rgba(0,0,0,0.1)";
  const switchBg     = isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.05)";
  const infoBg       = isDark ? "rgba(0,0,0,0.18)"        : "rgba(255,255,255,0.6)";

  // ── State ──────────────────────────────────────────────────────────────────
  const [localMode, setLocalMode]         = useState<ViewMode>(viewMode);
  const [showBadge, setShowBadge]         = useState(false);
  const [heroImgError, setHeroImgError]   = useState(false);
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
  const heroVideoSrc  = isAnime ? member.animeVideo  : member.photoVideo;
  const card2VideoSrc = isAnime ? member.photoVideo  : member.animeVideo;
  const heroSrc    = heroImgError  ? PLACEHOLDER : (isAnime ? member.animeChar : member.photo)     ?? PLACEHOLDER;
  const card1Src   = card1ImgError ? PLACEHOLDER : (isAnime ? member.animeChar : member.photo)     ?? PLACEHOLDER;
  const card2Src   = card2ImgError ? PLACEHOLDER : (isAnime ? member.photo     : member.animeChar) ?? PLACEHOLDER;
  const card1Label = isAnime ? "Alter Ego Manga"   : "Dans la vraie vie";
  const card2Label = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  // ── Section Hero (réutilisée mobile + desktop) ─────────────────────────────
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={`${member.name} — ${isAnime ? "avatar anime" : "photo réelle"}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
            onError={() => setHeroImgError(true)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  // ── Section Info (stats + bio + alter ego) ─────────────────────────────────
  const InfoSection = (
    <div style={{
      padding: isMobile ? "28px 20px 48px" : "52px 56px 72px",
      background: infoBg,
      minHeight: "100%",
    }}>
      <div style={{ maxWidth: isMobile ? "none" : 560 }}>

        {/* STATS */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${borderColor}`,
          marginBottom: isMobile ? 32 : 44,
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          {[
            { label: "Rang",         value: member.rank     },
            { label: "Anniversaire", value: member.birthday },
            { label: "Guilde",       value: "Otaku"         },
          ].map((s) => (
            <div key={s.label} style={{
              padding: isMobile ? "14px 6px" : "20px 14px",
              borderTop: `3px solid ${accent}`,
              textAlign: "center",
              background: cardBg,
            }}>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 9, fontWeight: 700,
                color: accent, textTransform: "uppercase",
                letterSpacing: "0.12em", marginBottom: 5,
              }}>
                {s.label}
              </p>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 14 : 17,
                fontWeight: 900, color: textPrimary, lineHeight: 1.1,
              }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* BIO */}
        <div style={{ marginBottom: isMobile ? 36 : 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 22, height: 2, background: accent, borderRadius: 2, flexShrink: 0 }} />
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, fontWeight: 800,
              color: accent, letterSpacing: "0.24em", textTransform: "uppercase",
            }}>
              BIOGRAPHIE
            </p>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: isMobile ? 15 : 16,
            fontWeight: 700, lineHeight: 1.78,
            color: textPrimary,
          }}>
            {member.bio ?? "Aucune biographie disponible pour ce membre."}
          </p>
        </div>

        {/* ALTER EGO */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 22, height: 2, background: accent, borderRadius: 2, flexShrink: 0 }} />
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, fontWeight: 800,
              color: accent, letterSpacing: "0.24em", textTransform: "uppercase",
            }}>
              PERSONNAGE ASSOCIÉ
            </p>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 12,
          }}>
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={`${member.name} — ${label}`}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
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

      {/* ── BACKDROP ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={isMobile ? onClose : undefined}
        style={{
          position: "fixed", inset: 0, zIndex: 9997,
          background: isMobile ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          cursor: isMobile ? "pointer" : "default",
        }}
      />

      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.97, y: 24 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: "100%", transition: { type: "spring", stiffness: 340, damping: 36 } } : { opacity: 0, scale: 0.97, y: 24 }}
        transition={isMobile
          ? { type: "spring", stiffness: 340, damping: 36, mass: 0.85 }
          : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-fullscreen"
        style={isMobile ? {
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: "92dvh",
          zIndex: 9999,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          background: bg,
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -12px 60px rgba(0,0,0,0.6)",
        } : {
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          background: bg,
        }}
      >
        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, background: navBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${borderColor}`, zIndex: 2 }}>
          {/* Drag handle — mobile only */}
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "8px 16px 12px" : "12px 28px",
          }}>
            {/* GAUCHE : bouton retour */}
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Fermer"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "7px 14px" : "8px 18px", borderRadius: 100,
                background: btnBg, border: `1px solid ${btnBorder}`,
                color: textPrimary, cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 13 : 14, fontWeight: 700, textTransform: "uppercase",
                transition: "background 0.18s",
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={14} />
              Retour
            </button>

            {/* CENTRE */}
            <div style={{ textAlign: "center", flex: 1, padding: "0 8px", minWidth: 0 }}>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 9 : 10, fontWeight: 700,
                color: accent, letterSpacing: "0.22em",
                textTransform: "uppercase", marginBottom: 1,
              }}>
                {member.rank}
              </p>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 16 : 20, fontWeight: 900,
                color: textPrimary, fontStyle: "italic",
                textTransform: "uppercase", lineHeight: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {member.name}
              </p>
            </div>

            {/* DROITE : miroir du bouton pour centrage */}
            <div style={{ width: isMobile ? 82 : 90, flexShrink: 0 }} />
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        {isMobile ? (

          /* ── MOBILE : colonne unique scrollable ─────────────────────────── */
          <div
            ref={scrollRef}
            style={{
              flex: 1, minHeight: 0,
              overflowY: "scroll",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
            }}
          >
            {/* Hero mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", height: "min(55vw, 340px)", overflow: "hidden", flexShrink: 0 }}
            >
              {HeroMedia}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "14px 20px 18px", zIndex: 3,
              }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10, fontWeight: 700,
                  color: accent, letterSpacing: "0.28em",
                  textTransform: "uppercase", marginBottom: 3,
                }}>
                  {member.rank}
                </p>
                <h1
                  id={titleId}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "clamp(34px,9vw,52px)",
                    fontWeight: 900, color: "#fff",
                    lineHeight: 0.88, fontStyle: "italic", textTransform: "uppercase",
                  }}
                >
                  {member.name}
                </h1>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: accent, zIndex: 4 }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              {InfoSection}
            </motion.div>
          </div>

        ) : (

          /* ── DESKTOP : 2 colonnes (photo gauche | info droite) ──────────── */
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>

            {/* Colonne gauche : photo pleine hauteur */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                flex: "0 0 44%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {HeroMedia}

              {/* Gradient bas → nom */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)",
              }} />

              {/* Nom en bas de l'image */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "28px 36px 36px", zIndex: 3,
              }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11, fontWeight: 700,
                  color: accent, letterSpacing: "0.3em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  {member.rank}
                </p>
                <h1
                  id={titleId}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "clamp(44px,5vw,80px)",
                    fontWeight: 900, color: "#fff",
                    lineHeight: 0.86, fontStyle: "italic", textTransform: "uppercase",
                  }}
                >
                  {member.name}
                </h1>
              </div>

              {/* Barre accent droite */}
              <div style={{
                position: "absolute", top: 0, bottom: 0, right: 0,
                width: 3, background: accent, zIndex: 4,
              }} />
            </motion.div>

            {/* Colonne droite : infos scrollables */}
            <motion.div
              ref={scrollRef}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                flex: 1, overflowY: "scroll",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              {InfoSection}
            </motion.div>
          </div>
        )}

      </motion.div>

      {/* ── SWITCH FLOTTANT DU MODAL — frère du modal pour position:fixed réel ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.88, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
        exit={{ opacity: 0, y: 24, scale: 0.88, x: "-50%" }}
        transition={{ delay: 0.45, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          bottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 28px)" : "32px",
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
              padding: isMobile ? "9px 22px" : "10px 28px",
              borderRadius: 100,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isMobile ? 14 : 15, fontWeight: 800,
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
