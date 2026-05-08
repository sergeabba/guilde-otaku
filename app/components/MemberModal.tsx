"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (member) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [member]);

  if (!member) return null;

  const isAnime = localMode === "anime";
  const heroVideoSrc = isAnime ? member.animeVideo : member.photoVideo;
  const card2VideoSrc = isAnime ? member.photoVideo : member.animeVideo;
  const heroSrc = (isAnime ? member.animeChar : member.photo) ?? PLACEHOLDER;
  const card1Src = (isAnime ? member.animeChar : member.photo) ?? PLACEHOLDER;
  const card2Src = (isAnime ? member.photo : member.animeChar) ?? PLACEHOLDER;
  const card1Label = isAnime ? "Alter Ego Manga" : "Dans la vraie vie";
  const card2Label = isAnime ? "Dans la vraie vie" : "Alter Ego Manga";

  return (
    <>
      {/* BADGE SPLASH */}
      <AnimatePresence>
        {showBadgeSplash && member.badge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBadgeSplash(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "rgba(0,0,0,0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{ textAlign: "center" }}
            >
              <Trophy
                size={isMobile ? 80 : 120}
                color="#ffd700"
                style={{ marginBottom: 24, filter: "drop-shadow(0 0 30px rgba(255,215,0,0.6))" }}
              />
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}>
                AWARDS OTAKU OBTENU
              </p>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 50 : 80,
                fontWeight: 900,
                color: "#ffd700",
                fontStyle: "italic",
                textTransform: "uppercase",
                textShadow: "0 0 50px rgba(255,215,0,0.5)",
              }}>
                {member.badge}
              </p>
            </motion.div>
            <p style={{
              position: "absolute",
              bottom: 40,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              Appuyez pour continuer
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9000] overflow-y-auto"
          style={{ background: "#08080f" }}
        >
          {/* NAV */}
          <div style={{
            position: "sticky",
            top: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "16px 24px",
            background: "rgba(8,8,15,0.9)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <ArrowLeft size={16} />
              Retour
            </button>

            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 100,
              padding: 3,
            }}>
              {(["real", "anime"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLocalMode(mode)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 100,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: localMode === mode ? accent : "transparent",
                    color: localMode === mode ? "#fff" : "rgba(255,255,255,0.5)",
                    transition: "all 0.2s",
                  }}
                >
                  {mode === "real" ? "Réel" : "Anime"}
                </button>
              ))}
            </div>

            <div style={{ width: 80 }} />
          </div>

          {/* HERO */}
          <div style={{
            position: "relative",
            width: "100%",
            height: isMobile ? 300 : "85vh",
            minHeight: isMobile ? 300 : 560,
            background: "#050508",
          }}>
            {heroVideoSrc ? (
              <VideoPlayer src={heroVideoSrc} fit="cover" fullscreenBtn />
            ) : (
              <img
                src={heroSrc}
                alt={member.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 15%",
                }}
              />
            )}

            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(5,5,8,1) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />

            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: isMobile ? "20px" : "48px 5%",
            }}>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                {member.rank}
              </p>
              <h1 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? 40 : 80,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 0.9,
                fontStyle: "italic",
                textTransform: "uppercase",
              }}>
                {member.name}
              </h1>
            </div>

            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: accent,
            }} />
          </div>

          {/* INFO */}
          <div style={{
            background: "#0d0d14",
            padding: isMobile ? "32px 18px" : "64px 5%",
          }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {/* STATS */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: isMobile ? 32 : 56,
              }}>
                {[
                  { label: "Rang", value: member.rank },
                  { label: "Anniversaire", value: member.birthday },
                  { label: "Guilde", value: "Otaku" },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: isMobile ? "16px 8px" : "22px",
                    borderTop: `3px solid ${accent}`,
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: isMobile ? 9 : 12,
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                      {s.label}
                    </p>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: isMobile ? 15 : 26,
                      fontWeight: 900,
                      color: "#fff",
                      marginTop: 4,
                    }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* BIO */}
              <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 64 }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: isMobile ? 13 : 17,
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}>
                  BIOGRAPHIE
                </p>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: isMobile ? 15 : 18,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: 680,
                  margin: "0 auto",
                }}>
                  {member.bio ?? "Aucune biographie disponible pour ce membre."}
                </p>
              </div>

              {/* ALTER EGO */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: isMobile ? 28 : 56 }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: isMobile ? 13 : 18,
                  fontWeight: 900,
                  color: accent,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginBottom: 24,
                }}>
                  PERSONNAGE ASSOCIÉ
                </p>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 14,
                }}>
                  {[
                    { video: heroVideoSrc, img: card1Src, label: card1Label },
                    { video: card2VideoSrc, img: card2Src, label: card2Label },
                  ].map(({ video, img, label }) => (
                    <div key={label} style={{
                      position: "relative",
                      height: isMobile ? 220 : 400,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#050508",
                    }}>
                      {video ? (
                        <VideoPlayer src={video} fit="cover" fullscreenBtn />
                      ) : (
                        <img
                          src={img}
                          alt={member.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)",
                      }} />
                      <div style={{
                        position: "absolute",
                        bottom: 14,
                        left: 12,
                        right: 12,
                        textAlign: "center",
                      }}>
                        <p style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 10,
                          fontWeight: 800,
                          color: accent,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          marginBottom: 3,
                        }}>
                          {label}
                        </p>
                        <p style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 20,
                          fontWeight: 900,
                          color: "#fff",
                          fontStyle: "italic",
                          textTransform: "uppercase",
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
        </motion.div>
      </AnimatePresence>
    </>
  );
}
