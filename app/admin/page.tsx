"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, BookOpen, User, Flame, ArrowUpRight,
  Palette, Film, Globe, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";

const MODULES = [
  {
    href: "/admin-fighters",
    label: "Roster Fighters",
    sub: "Ajouter, modifier, supprimer des membres",
    icon: Flame,
    color: "#f87171",
    glow: "rgba(248,113,113,0.18)",
    tag: "MEMBRES",
  },
  {
    href: "/admin-membres",
    label: "Upload Médias",
    sub: "Photos & vidéos des membres",
    icon: User,
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.18)",
    tag: "MÉDIAS",
  },
  {
    href: "/admin-biblio",
    label: "Bibliothèque",
    sub: "Animes, mangas, films & scores",
    icon: BookOpen,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.18)",
    tag: "BIBLIO",
  },
  {
    href: "/admin-atelier",
    label: "Atelier Visuel",
    sub: "Galerie d'art IA de la Guilde",
    icon: Palette,
    color: "#c9a84c",
    glow: "rgba(201,168,76,0.18)",
    tag: "ART",
  },
  {
    href: "/admin-film-semaine",
    label: "Film de la Semaine",
    sub: "Programmer les soirées cinéma",
    icon: Film,
    color: "#e50914",
    glow: "rgba(229,9,20,0.18)",
    tag: "CINÉMA",
  },
  {
    href: "/admin-bons-plans",
    label: "Bons Plans",
    sub: "Sites streaming, scans & outils",
    icon: Globe,
    color: "#10b981",
    glow: "rgba(16,185,129,0.18)",
    tag: "RESSOURCES",
  },
];

export default function AdminHubPage() {
  const { authed, checking, password, setPassword, error: pwError, login } = useAdminAuth();
  const [showPw, setShowPw] = useState(false);

  if (checking) return null;

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#050508",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif",
        backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.08) 0%, transparent 60%)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "min(420px, 92vw)",
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${pwError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "24px",
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: pwError ? "0 0 40px rgba(248,113,113,0.12)" : "0 40px 80px rgba(0,0,0,0.5)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 28px",
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={26} color="#c9a84c" />
          </div>

          <p style={{ fontSize: 11, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}>
            GUILDE OTAKU
          </p>
          <h1 style={{ fontSize: "clamp(28px,6vw,38px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: 32 }}>
            ESPACE ADMIN
          </h1>

          {/* Password input */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") login(); }}
              placeholder="Mot de passe..."
              autoFocus
              style={{
                width: "100%", padding: "14px 44px 14px 16px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${pwError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18, textAlign: "center", letterSpacing: "0.25em",
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
            <button
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", padding: 0,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {pwError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 12 }}
              >
                Mot de passe incorrect
              </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={() => login()}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              border: "none", borderRadius: 12,
              color: "#000", fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 16, fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.1em", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
            }}
          >
            ENTRER
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#050508",
      fontFamily: "'Barlow Condensed', sans-serif", color: "#fff",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(201,168,76,0.06) 0%, transparent 60%)",
    }}>
      <style>{`
        .admin-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s; }
        .admin-card:hover { transform: translateY(-4px) scale(1.012); }
        .admin-link { transition: color 0.15s, gap 0.15s; }
        .admin-link:hover { gap: 10px !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding: "40px 48px 0",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <ShieldCheck size={18} color="#c9a84c" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              ACCÈS AUTORISÉ · RÉSEAU SÉCURISÉ
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(44px,7vw,80px)", fontWeight: 900, fontStyle: "italic",
            textTransform: "uppercase", lineHeight: 0.88, marginBottom: 16,
          }}>
            COMMANDEMENT<br />
            <span style={{ color: "#c9a84c" }}>OTAKU</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 520, lineHeight: 1.5, marginBottom: 0 }}>
            Centre de contrôle. Toute modification ici est appliquée en direct sur la plateforme.
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)", margin: "36px 0" }} />
      </div>

      {/* ── GRID ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="admin-card"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20,
                  padding: "28px 28px 24px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {/* Glow blob */}
                <div style={{
                  position: "absolute", top: -30, right: -30,
                  width: 160, height: 160,
                  background: mod.glow,
                  borderRadius: "50%",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }} />

                {/* Top accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${mod.color}, transparent)`,
                }} />

                {/* Tag */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 10px", borderRadius: 100, marginBottom: 20,
                  background: `${mod.color}15`,
                  border: `1px solid ${mod.color}30`,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: mod.color, letterSpacing: "0.2em" }}>
                    {mod.tag}
                  </span>
                </div>

                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${mod.color}12`,
                  border: `1px solid ${mod.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                }}>
                  <Icon size={22} color={mod.color} />
                </div>

                <h2 style={{
                  fontSize: 22, fontWeight: 900, textTransform: "uppercase",
                  color: "#fff", lineHeight: 1, marginBottom: 8,
                }}>
                  {mod.label}
                </h2>
                <p style={{
                  fontSize: 14, color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.5, marginBottom: 28,
                }}>
                  {mod.sub}
                </p>

                <Link
                  href={mod.href}
                  className="admin-link"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: mod.color,
                    textDecoration: "none",
                  }}
                >
                  Accéder <ArrowUpRight size={14} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
