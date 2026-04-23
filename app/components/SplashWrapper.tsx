"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import FairyTailSplash from "./FairyTailSplash";

/*
  Stratégie Améliorée :
  - On rend TOUJOURS les enfants pour ne pas casser le SSR et le SEO.
  - On affiche le splash par-dessus grâce à un z-index élevé.
  - Dès le montage client, on vérifie sessionStorage pour savoir si on skip.
*/

const SPLASH_KEY = "guilde-splash-v2";

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (checkedRef.current) return;
    checkedRef.current = true;

    try {
      const seen = sessionStorage.getItem(SPLASH_KEY);
      if (seen) {
        setShowSplash(false);
      }
    } catch {
      // Ignore si le sessionStorage est bloqué
    }
  }, []);

  const handleFinish = useCallback(() => {
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch {}
    setShowSplash(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {mounted && showSplash && (
          <FairyTailSplash key="splash" onFinish={handleFinish} />
        )}
      </AnimatePresence>

      {/* 
        Le contenu principal est toujours rendu côté serveur.
        Si on n'est pas encore monté, on peut l'afficher ou le cacher selon le design.
        Ici on le garde invisible pendant le splash pour éviter de voir l'interface.
      */}
      <div
        style={{
          opacity: (!mounted || showSplash) ? 0 : 1,
          transition: "opacity 0.6s ease",
          pointerEvents: (!mounted || showSplash) ? "none" : "auto",
        }}
      >
        {children}
      </div>

      {/* Fallback de sécurité (SSG/SSR initial prevent FOUC) */}
      {!mounted && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000" }} />
      )}
    </>
  );
}
