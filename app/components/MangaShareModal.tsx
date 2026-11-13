"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Member } from "../../data/members";
import { rankAccents, rankJapanese, Rank } from "../config/ranks";
import { X, Check, Copy, MessageCircle, Send, Sparkles, Shield, Trophy } from "lucide-react";
import type { ViewMode } from "../types";

interface MangaShareModalProps {
  member: Member;
  viewMode: ViewMode;
  isOpen: boolean;
  onClose: () => void;
}

export default function MangaShareModal({
  member,
  viewMode,
  isOpen,
  onClose,
}: MangaShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const accent = rankAccents[member.rank as Rank] ?? "#c9a84c";
  const jpRank = rankJapanese[member.rank as Rank] ?? "冒険者";
  const isAnime = viewMode === "anime";
  const photoSrc = (isAnime ? member.animeChar : member.photo) || "/placeholder.svg";

  const memberUrl = typeof window !== "undefined"
    ? `${window.location.origin}/membres/${member.id}`
    : `https://guilde-otaku.vercel.app/membres/${member.id}`;

  const shareText = `⚔️ Découvre le profil de ${member.name} (${member.rank} • 『${jpRank}』) sur la Guilde Otaku !`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(memberUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = memberUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${memberUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(memberUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(memberUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${member.name} — Guilde Otaku`,
          text: shareText,
          url: memberUrl,
        });
      } catch {
        /* annulé par l'utilisateur */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Partager la licence de ${member.name}`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10015,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(3, 3, 7, 0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "460px",
            background: "#0c0b12",
            borderRadius: "20px",
            border: `1.5px solid ${accent}55`,
            boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 40px ${accent}25`,
            overflow: "hidden",
            color: "#fff",
            zIndex: 2,
          }}
        >
          {/* Top Manga Header Bar */}
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="kanji-stamp">
                『シェア』
              </span>
              <span
                className="font-bricolage"
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#fff",
                }}
              >
                Licence de Guilde
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#bbb",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "20px" }}>
            {/* ── MANGA GUILD LICENSE CARD ── */}
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                background: "linear-gradient(145deg, #161522 0%, #0d0c15 100%)",
                border: `2px solid ${accent}66`,
                boxShadow: `0 12px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)`,
                overflow: "hidden",
                marginBottom: "20px",
                padding: "16px",
              }}
            >
              {/* Holographic Security Strip */}
              <div
                className="hologram-strip"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                }}
              />

              {/* Watermark Screentone dots */}
              <div
                className="manga-screentone"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.04,
                  color: "#fff",
                  pointerEvents: "none",
                }}
              />

              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={14} color={accent} />
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      color: accent,
                      textTransform: "uppercase",
                    }}
                  >
                    GUILDE OTAKU • LICENSE
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.15em",
                  }}
                >
                  #OKU-{String(member.id).padStart(3, "0")}
                </span>
              </div>

              {/* Card Body: Photo + Info */}
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                {/* Photo with Manga frame */}
                <div
                  style={{
                    position: "relative",
                    width: "90px",
                    height: "110px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: `2px solid ${accent}`,
                    boxShadow: `0 4px 14px ${accent}33`,
                    flexShrink: 0,
                    background: "#08080c",
                  }}
                >
                  <Image
                    src={photoSrc}
                    alt={member.name}
                    fill
                    sizes="100px"
                    className="object-cover object-top"
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "2px",
                      background: "rgba(0,0,0,0.7)",
                      textAlign: "center",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "9px",
                      fontWeight: 800,
                      color: accent,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {isAnime ? "ANIME" : "RÉEL"}
                  </div>
                </div>

                {/* Member details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: accent,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}
                    >
                      {member.rank}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "sans-serif",
                      }}
                    >
                      『{jpRank}』
                    </span>
                  </div>

                  <h3
                    className="font-bricolage"
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {member.name}
                  </h3>

                  {member.badge && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "linear-gradient(90deg, #b8860b, #ffd700, #b8860b)",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        marginBottom: "6px",
                      }}
                    >
                      <Trophy size={10} color="#000" strokeWidth={3} />
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 900,
                          color: "#000",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          textTransform: "uppercase",
                        }}
                      >
                        {member.badge}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "6px",
                    }}
                  >
                    <span className="kanji-stamp gold" style={{ fontSize: "9px", padding: "1px 5px" }}>
                      『公式認可』
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.4)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      CARTE OFFICIELLE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SHARE BUTTONS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Copy Link Main Button */}
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: "12px",
                  background: copied
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : `linear-gradient(135deg, ${accent}, #ffd700)`,
                  color: "#000",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "15px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: `0 6px 20px ${copied ? "rgba(16,185,129,0.4)" : `${accent}44`}`,
                  transition: "all 0.25s ease",
                }}
              >
                {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                {copied ? "Lien copié dans le presse-papier !" : "Copier le lien du profil"}
              </button>

              {/* Social Channels Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <button
                  onClick={handleWhatsApp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(37, 211, 102, 0.12)",
                    border: "1px solid rgba(37, 211, 102, 0.3)",
                    color: "#25d366",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </button>

                <button
                  onClick={handleTwitter}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <Sparkles size={14} color={accent} />
                  X / Twitter
                </button>

                <button
                  onClick={handleTelegram}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(0, 136, 204, 0.12)",
                    border: "1px solid rgba(0, 136, 204, 0.3)",
                    color: "#29b6f6",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <Send size={14} />
                  Telegram
                </button>
              </div>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleNativeShare}
                  style={{
                    background: "none",
                    border: "1px dashed rgba(255,255,255,0.18)",
                    borderRadius: "10px",
                    padding: "8px",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  Options de partage système (iOS / Android)
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
