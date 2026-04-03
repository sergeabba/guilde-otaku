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
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-[100]"
      style={{
        background: bgColor,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── LIGNE 1 : Logo + rightSlot ──────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between ${isMobile ? "px-4" : "px-12"} h-14`}
      >
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline shrink-0"
        >
          <img
            src="/logo.png"
            className="h-[34px] brightness-[1.1]"
            alt="Logo Guilde Otaku"
            loading="eager"
          />
          <div>
            <div
              className="font-guilde font-black leading-none"
              style={{ fontSize: isMobile ? "16px" : "19px", color: textColor }}
            >
              GUILDE OTAKU
            </div>
            <div
              className="font-guilde font-semibold tracking-widest"
              style={{ fontSize: "9px", color: accentColor }}
            >
              DEPUIS 2020
            </div>
          </div>
        </Link>

        {/* rightSlot (toggle Réel/Anime, etc.) */}
        {rightSlot && (
          <div className="shrink-0 ml-3">
            {rightSlot}
          </div>
        )}
      </div>

      {/* ── LIGNE 2 : Navigation ────────────────────────────────────────────── */}
      <nav
        className={`flex items-center overflow-x-auto scrollbar-hide ${isMobile ? "px-2" : "px-10"} border-t border-white/[0.04]`}
      >
        {navLinks.map((link) => {
          const isActive = activePage === link.id;
          const inactiveColor = textColor === "#111" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)";
          return (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center relative no-underline uppercase whitespace-nowrap shrink-0 font-guilde font-black tracking-wide transition-[color] duration-200"
              style={{
                padding: isMobile ? "0 10px" : "0 14px",
                height: "42px",
                fontSize: isMobile ? "13px" : "14px",
                color: isActive ? accentColor : inactiveColor,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}

              {/* ── Indicateur de page active animé ───────────────────────── */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 h-[2px] rounded-t"
                  style={{
                    left: isMobile ? "10px" : "14px",
                    right: isMobile ? "10px" : "14px",
                    background: accentColor,
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