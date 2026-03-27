"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";

interface GuildeHeaderProps {
  // J'ai ajouté tes nouvelles pages ici pour éviter les erreurs TypeScript
  activePage: "membres" | "birthdays" | "fighters" | "bibliotheque" | "wanted" | "bons-plans" | "atelier";
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  rightSlot?: React.ReactNode; 
}

export default function GuildeHeader({ 
  activePage, 
  accentColor = "#c9a84c", // Ton doré officiel
  bgColor = "rgba(5,5,8,0.7)",
  textColor = "#fff",
  rightSlot 
}: GuildeHeaderProps) {
  const isMobile = useIsMobile();

  // Tes 6 liens complets
  const navLinks = [
    { id: "membres", label: "MEMBRES", href: "/" },
    { id: "birthdays", label: "ANNIVERSAIRES", href: "/birthdays" },
    { id: "wanted", label: "WANTED", href: "/wanted" },
    { id: "fighters", label: "FIGHTERS", href: "/fighters" },
    { id: "bons-plans", label: "BONS PLANS", href: "/bons-plans" },
    { id: "bibliotheque", label: "BIBLIOTHÈQUE", href: "/bibliotheque" },
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "sticky", 
        top: 0, 
        zIndex: 100,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
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

      {/* C'est ici que la police Barlow et le gras 900 sont forcés */}
      <nav 
        style={{ 
          fontFamily: "'Barlow Condensed', sans-serif", 
          display: "flex", 
          alignItems: "center", 
          gap: isMobile ? "16px" : "32px", 
          fontWeight: 900, 
          fontSize: isMobile ? "13px" : "17px", 
          overflowX: isMobile ? "auto" : "visible", 
          whiteSpace: "nowrap" 
        }}
      >
        {navLinks.map((link) => (
          <Link 
            key={link.id} 
            href={link.href} 
            style={{ 
              color: activePage === link.id ? accentColor : (textColor === "#111" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)"), 
              textDecoration: "none",
              transition: "color 0.3s ease"
            }}
          >
            {link.label}
          </Link>
        ))}
        {rightSlot && <div style={{ marginLeft: isMobile ? "0" : "16px" }}>{rightSlot}</div>}
      </nav>
    </motion.header>
  );
}