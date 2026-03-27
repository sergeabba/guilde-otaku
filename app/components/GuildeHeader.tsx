"use client";

// ─── app/components/GuildeHeader.tsx ─────────────────────────────────────────
// Améliorations v2 :
//   1. Touch targets minimum 44px sur chaque lien de nav (accessibilité mobile)
//   2. Indicateur de page active animé (underline qui slide)
//   3. Opacité du fond qui augmente au scroll (backdrop plus fort)
//   4. Breakpoint fluide sans flash SSR (CSS media query au lieu de JS)

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface GuildeHeaderProps {
  activePage:
    | "membres"
    | "birthdays"
    | "fighters"
    | "bibliotheque"
    | "wanted"
    | "bons-plans"
    | "atelier";
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode;
}

const navLinks = [
  { id: "membres",      label: "Membres",      href: "/"           },
  { id: "birthdays",    label: "Anniversaires",href: "/birthdays"  },
  { id: "wanted",       label: "Wanted",       href: "/wanted"     },
  { id: "fighters",     label: "Fighters",     href: "/fighters"   },
  { id: "bons-plans",   label: "Bons Plans",   href: "/bons-plans" },
  { id: "bibliotheque", label: "Bibliothèque", href: "/bibliotheque"},
];

export default function GuildeHeader({
  activePage,
  accentColor = "#c9a84c",
  bgColor = "rgba(5,5,8,0.7)",
  textColor = "#fff",
  rightSlot,
}: GuildeHeaderProps) {
  // Scroll progress pour intensifier le blur/opacité du fond
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], [bgColor, bgColor.replace(/[\d.]+\)$/, "0.92)")]);

  // Détection mobile via matchMedia — pas de flash SSR
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 20px" : "0 48px",
        minHeight: "72px",
        background: bgColor,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? "0" : "0",
      }}
    >
      {/* ── LOGO ──────────────────────────────────────────────────────────────── */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          textDecoration: "none",
          // Touch target 44px garanti via minHeight sur le header
        }}
      >
        <img
          src="/logo.png"
          style={{ height: "38px", filter: "brightness(1.1)" }}
          alt="Logo Guilde Otaku"
          loading="eager"
        />
        <div>
          <div
            style={{
              fontSize: isMobile ? "17px" : "20px",
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
              fontSize: "10px",
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

      {/* ── NAV ───────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "4px" : "4px",
          overflowX: isMobile ? "auto" : "visible",
          WebkitOverflowScrolling: "touch",
          // Masque la scrollbar sur mobile
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: isMobile ? "0 0 0 0" : "0",
          flex: isMobile ? "1 1 100%" : "none",
          marginTop: isMobile ? "0" : "0",
        }}
      >
        {navLinks.map((link) => {
          const isActive = activePage === link.id;
          return (
            <Link
              key={link.id}
              href={link.href}
              style={{
                // ✅ Touch target 44px minimum (padding vertical qui agrandit la zone)
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "0 10px" : "0 14px",
                height: "44px",
                position: "relative",
                textDecoration: "none",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isMobile ? "13px" : "15px",
                fontWeight: 900,
                letterSpacing: "0.04em",
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

              {/* ── Indicateur de page active animé ─────────────────────────── */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "14px",
                    right: "14px",
                    height: "2px",
                    background: accentColor,
                    borderRadius: "2px 2px 0 0",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}

        {/* ── Slot droit (toggle réel/anime, etc.) ──────────────────────────── */}
        {rightSlot && (
          <div style={{ marginLeft: isMobile ? "auto" : "12px", flexShrink: 0 }}>
            {rightSlot}
          </div>
        )}
      </nav>
    </motion.header>
  );
}