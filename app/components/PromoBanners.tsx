"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sword, Flame, ArrowRight, Palette, Sparkles } from "lucide-react";
import React from "react";

/**
 * Composant Helper pour l'effet de Tilt 3D au survol
 */
function TiltWrapper({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        perspective: 1200,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        whileHover={{ scale: 1.015, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ChroniqueBanner({ isMobile, isDark, theme }: { isMobile?: boolean, isDark: boolean, theme: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
    <Link href="/bibliotheque" style={{ textDecoration: "none", display: "block", marginBottom: "24px" }}>
      <TiltWrapper>
        <div style={{
          position: "relative",
          overflow: "hidden",
          background: isDark ? "linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(255,255,255,0.02) 100%)" : "linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(255,255,255,0.8) 100%)",
          border: "1px solid rgba(74, 222, 128, 0.3)",
          borderRadius: "24px",
          padding: isMobile ? "24px" : "32px 40px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "20px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
        }}>
          {/* Image de fond subtile */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, zIndex: 0 }}>
            <Image src="https://image.tmdb.org/t/p/original/lvndABJgYFihAGocI1hPgqv7yxu.jpg" alt="" fill sizes="100vw" className="object-cover" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "24px", position: "relative", zIndex: 1, transform: "translateZ(30px)" }}>
            <div style={{ width: isMobile ? "48px" : "64px", height: isMobile ? "48px" : "64px", borderRadius: "16px", background: "rgba(74, 222, 128, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(74, 222, 128, 0.4)", flexShrink: 0 }}>
              <Sword size={isMobile ? 24 : 32} color="#4ade80" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Flame size={14} color="#4ade80" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#4ade80", letterSpacing: "0.2em", textTransform: "uppercase" }}>Saison Printemps 2026</span>
              </div>
              <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, color: theme.text, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, margin: 0 }}>
                La Chronique du Bash
              </h3>
              <p style={{ fontSize: isMobile ? "14px" : "16px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontWeight: 500, margin: "8px 0 0 0" }}>
                Les verdicts définitifs de la Guilde sur les animes et mangas.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#4ade80", borderRadius: "100px", color: "#000", fontWeight: 900, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, alignSelf: isMobile ? "stretch" : "auto", justifyContent: "center", position: "relative", zIndex: 1, transform: "translateZ(40px)" }}>
            Accéder aux Chroniques <ArrowRight size={16} />
          </div>
        </div>
      </TiltWrapper>
    </Link>
    </motion.div>
  );
}

export function AtelierBanner({ isMobile, isDark, theme, accent }: { isMobile?: boolean, isDark: boolean, theme: any, accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
    <Link href="/atelier" style={{ textDecoration: "none", display: "block", marginBottom: isMobile ? "40px" : "60px" }}>
      <TiltWrapper>
        <div style={{
          position: "relative",
          overflow: "hidden",
          background: isDark ? `linear-gradient(135deg, ${accent}15 0%, rgba(255,255,255,0.02) 100%)` : `linear-gradient(135deg, ${accent}30 0%, rgba(255,255,255,0.8) 100%)`,
          border: `1px solid ${accent}40`,
          borderRadius: "24px",
          padding: isMobile ? "24px" : "32px 40px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "20px",
          backdropFilter: "blur(12px)",
          boxShadow: `0 10px 40px ${accent}20`,
        }}>
          {/* Effet de lueur interne */}
          <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "300px", height: "300px", background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
          
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "24px", position: "relative", zIndex: 1, transform: "translateZ(30px)" }}>
            <div style={{ width: isMobile ? "48px" : "64px", height: isMobile ? "48px" : "64px", borderRadius: "16px", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}50`, flexShrink: 0 }}>
              <Palette size={isMobile ? 24 : 32} color={accent} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Sparkles size={14} color={accent} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>Nouveau</span>
              </div>
              <h3 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, color: theme.text, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, margin: 0 }}>
                L'Atelier de la Guilde
              </h3>
              <p style={{ fontSize: isMobile ? "14px" : "16px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontWeight: 500, margin: "8px 0 0 0" }}>
                Découvre notre galerie d'Art générée par Intelligence Artificielle.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: accent, borderRadius: "100px", color: "#000", fontWeight: 900, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, alignSelf: isMobile ? "stretch" : "auto", justifyContent: "center", position: "relative", zIndex: 1, transform: "translateZ(40px)" }}>
            Explorer l'Atelier <ArrowRight size={16} />
          </div>
        </div>
      </TiltWrapper>
    </Link>
    </motion.div>
  );
}
