"use client";

// ─── app/components/GuildeHeader.tsx ─────────────────────────────────────────
// v3 — Améliorations :
//   1. "atelier" ajouté au type activePage (corrige l'erreur TypeScript silencieuse)
//   2. useIsMobile hook (cohérent avec le reste du projet)
//   3. rightSlot affiché correctement sur mobile (dans son propre conteneur)
//   4. Scroll-to-top sur le logo supprimé pour la clarté
//   5. Nav scrollable aussi sur desktop si trop de liens

import Link from "next/link";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";

interface GuildeHeaderProps {
  activePage:
    | "membres"
    | "birthdays"
    | "fighters"
    | "bibliotheque"
    | "wanted"
    | "bons-plans"
    | "atelier"; // ← CORRIGÉ : était manquant
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode;
}

const navLinks = [
  { id: "membres",      label: "Membres",      href: "/"            },
  { id: "birthdays",    label: "Anniversaires", href: "/birthdays"   },
  { id: "wanted",       label: "Wanted",        href: "/wanted"      },
  { id: "fighters",     label: "Fighters",      href: "/fighters"    },
  { id: "bons-plans",   label: "Bons Plans",    href: "/bons-plans"  },
  { id: "bibliotheque", label: "Bibliothèque",  href: "/bibliotheque"},
  { id: "atelier",      label: "Atelier",       href: "/atelier"     },
];

export default function GuildeHeader({
  activePage,
  accentColor = "#c9a84c",
  bgColor     = "rgba(5,5,8,0.7)",
  textColor   = "#fff",
  rightSlot,
}: GuildeHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: bgColor,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── LIGNE 1 : Logo + rightSlot ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 48px",
          height: "56px",
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            style={{ height: "34px", filter: "brightness(1.1)" }}
            alt="Logo Guilde Otaku"
            loading="eager"
          />
          <div>
            <div
              style={{
                fontSize: isMobile ? "16px" : "19px",
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              GUILDE OTAKU
            </div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "0.22em",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              DEPUIS 2020
            </div>
          </div>
        </Link>

        {/* rightSlot (toggle Réel/Anime, etc.) */}
        {rightSlot && (
          <div style={{ flexShrink: 0, marginLeft: "12px" }}>
            {rightSlot}
          </div>
        )}
      </div>

      {/* ── LIGNE 2 : Navigation ────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          padding: isMobile ? "0 8px 0" : "0 40px",
          gap: 0,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {navLinks.map((link) => {
          const isActive = activePage === link.id;
          return (
            <Link
              key={link.id}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "0 10px" : "0 14px",
                height: "42px",
                position: "relative",
                textDecoration: "none",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: isActive
                  ? accentColor
                  : textColor === "#111"
                  ? "rgba(0,0,0,0.4)"
                  : "rgba(255,255,255,0.4)",
                transition: "color 0.25s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {link.label}

              {/* ── Indicateur de page active animé ───────────────────────── */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: isMobile ? "10px" : "14px",
                    right: isMobile ? "10px" : "14px",
                    height: "2px",
                    background: accentColor,
                    borderRadius: "2px 2px 0 0",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.header>
  );
}