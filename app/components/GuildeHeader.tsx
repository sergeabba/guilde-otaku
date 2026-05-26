"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";

interface GuildeHeaderProps {
  activePage:
    | "membres"
    | "birthdays"
    | "fighters"
    | "bibliotheque"
    | "wanted"
    | "bons-plans"
    | "atelier"
    | "film-semaine";
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode;
}

const navLinks = [
  { id: "membres",      label: "Membres",       href: "/"             },
  { id: "birthdays",    label: "Anniversaires", href: "/birthdays"    },
  { id: "wanted",       label: "Wanted",        href: "/wanted"       },
  { id: "fighters",     label: "Fighters",      href: "/fighters"     },
  { id: "film-semaine", label: "Film Semaine",  href: "/film-semaine" },
  { id: "bibliotheque", label: "Bibliothèque",  href: "/bibliotheque" },
  { id: "bons-plans",   label: "Bons Plans",    href: "/bons-plans"   },
  { id: "atelier",      label: "Atelier",       href: "/atelier"      },
];

export default function GuildeHeader({
  activePage,
  accentColor = "#c9a84c",
  bgColor,
  textColor,
  rightSlot,
}: GuildeHeaderProps) {
  const isMobile  = useIsMobile();
  const pathname  = usePathname();
  const isHome    = pathname === "/";
  const { isDark } = useTheme();

  const resolvedBg = bgColor || (isDark ? "rgba(5,5,8,0.82)" : "rgba(255,255,255,0.85)");
  const resolvedText = textColor || (isDark ? "#fff" : "#111");

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: resolvedBg,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
        boxShadow: isDark ? "0 4px 32px rgba(0,0,0,0.18)" : "0 4px 24px rgba(0,0,0,0.06)",
        transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
      }}
    >
      {/* ── LIGNE 1 : Logo + back + rightSlot ─────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 14px" : "0 48px",
        height: isMobile ? "62px" : "70px",
      }}>

        {/* GAUCHE : back arrow (si pas accueil) + logo */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "16px" }}>
          {!isHome && (
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "34px" : "38px",
                height: isMobile ? "34px" : "38px",
                borderRadius: "50%",
                background: resolvedText === "#111"
                  ? "rgba(0,0,0,0.07)"
                  : "rgba(255,255,255,0.09)",
                border: resolvedText === "#111"
                  ? "1px solid rgba(0,0,0,0.1)"
                  : "1px solid rgba(255,255,255,0.13)",
                color: resolvedText,
                textDecoration: "none",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <ArrowLeft size={isMobile ? 16 : 18} />
            </Link>
          )}

          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "10px" : "14px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              style={{ height: isMobile ? "36px" : "44px", filter: "brightness(1.1)" }}
              alt="Logo Guilde Otaku"
              loading="eager"
            />
            {!isMobile && (
              <div>
                <div style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: resolvedText,
                  lineHeight: 1,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.04em",
                }}>
                  GUILDE OTAKU
                </div>
                <div style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: accentColor,
                  letterSpacing: "0.28em",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  marginTop: "2px",
                }}>
                  DEPUIS 2020
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* DROITE : toggle + rightSlot */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" }}>
          <ThemeToggle size={isMobile ? 16 : 18} />
          {rightSlot}
        </div>
      </div>

      {/* ── LIGNE 2 : Navigation ────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          padding: isMobile ? "0 4px" : "0 40px",
          gap: 0,
          borderTop: resolvedText === "#111"
            ? "1px solid rgba(0,0,0,0.06)"
            : "1px solid rgba(255,255,255,0.05)",
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
                padding: isMobile ? "0 11px" : "0 18px",
                height: isMobile ? "46px" : "52px",
                position: "relative",
                textDecoration: "none",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? "15px" : "17px",
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: isActive
                  ? accentColor
                  : resolvedText === "#111"
                  ? "#111111"
                  : "#ffffff",
                opacity: isActive ? 1 : 0.72,
                transition: "color 0.2s, opacity 0.2s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: isMobile ? "11px" : "18px",
                    right: isMobile ? "11px" : "18px",
                    height: "3px",
                    background: accentColor,
                    borderRadius: "3px 3px 0 0",
                    boxShadow: `0 0 8px ${accentColor}88`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.header>
  );
}
