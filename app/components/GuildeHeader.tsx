"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";

interface GuildeHeaderProps {
  activePage: "membres" | "birthdays" | "fighters" | "bibliotheque";
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode; // Pour ajouter un bouton switch Vue Réel/Anime plus tard
}

export default function GuildeHeader({ 
  activePage, 
  accentColor = "#c9a84c",
  bgColor = "rgba(5,5,8,0.7)",
  textColor = "#fff",
  rightSlot 
}: GuildeHeaderProps) {
  const isMobile = useIsMobile();

  const navLinks = [
    { id: "membres", label: "MEMBRES", href: "/" },
    { id: "birthdays", label: "ANNIVERSAIRES", href: "/birthdays" },
    { id: "fighters", label: "FIGHTERS", href: "/fighters" },
    { id: "bibliotheque", label: "BIBLIOTHÈQUE", href: "/bibliotheque" },
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "14px 20px" : "0 48px",
        minHeight: "72px",
        background: bgColor,
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? "12px" : "0",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
        {/* Assure-toi que le chemin vers ton logo est correct */}
        <img src="/logo.png" style={{ height: "38px", filter: "brightness(1.1)" }} alt="Logo Guilde" />
        <div>
          <div style={{ fontSize: isMobile ? "17px" : "20px", fontWeight: 900, color: textColor, lineHeight: 1 }}>
            GUILDE OTAKU
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: accentColor, letterSpacing: "0.22em" }}>
            DEPUIS 2020
          </div>
        </div>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "32px", fontWeight: 800, fontSize: isMobile ? "13px" : "17px", overflowX: isMobile ? "auto" : "visible", whiteSpace: "nowrap" }}>
        {navLinks.map((link) => (
          <Link 
            key={link.id} 
            href={link.href} 
            style={{ 
              color: activePage === link.id ? accentColor : "rgba(255,255,255,0.45)", 
              textDecoration: "none",
              transition: "color 0.3s ease"
            }}
          >
            {link.label}
          </Link>
        ))}
        {/* Emplacement réservé pour un bouton spécifique à une page (ex: switch Anime/Réel) */}
        {rightSlot && <div style={{ marginLeft: isMobile ? "0" : "16px" }}>{rightSlot}</div>}
      </nav>
    </motion.header>
  );
}