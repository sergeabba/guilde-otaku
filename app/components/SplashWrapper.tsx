"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import FairyTailSplash from "./FairyTailSplash";

/*
  Stratégie :
  - On affiche TOUJOURS le splash au premier rendu (SSR-safe : state initial = "pending")
  - Après hydration, on vérifie sessionStorage
  - Si déjà vu dans cette session → on skip immédiatement SANS flash noir
  - Si pas encore vu → on laisse le splash se dérouler normalement
*/

type State = "pending" | "showing" | "done";

const SPLASH_KEY = "guilde-splash-v2";   // nouvelle clé pour reset propre

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("pending");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    try {
      const seen = sessionStorage.getItem(SPLASH_KEY);
      if (seen) {
        // Déjà vu → skip direct, pas de flash
        setState("done");
      } else {
        // Première fois → on lance le splash
        setState("showing");
      }
    } catch {
      // sessionStorage indisponible (mode privé strict, etc.) → on lance quand même
      setState("showing");
    }
  }, []);

  const handleFinish = () => {
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch {}
    setState("done");
  };

  /* Pendant le SSR et avant hydration : fond noir neutre, évite le flash */
  if (state === "pending") {
    return <div style={{ background: "#000", minHeight: "100vh" }} />;
  }

  return (
    <>
      <AnimatePresence>
        {state === "showing" && (
          <FairyTailSplash key="splash" onFinish={handleFinish} />
        )}
      </AnimatePresence>

      {/* Le contenu est toujours monté mais invisible pendant le splash */}
      <div
        style={{
          opacity:    state === "done" ? 1 : 0,
          transition: state === "done" ? "opacity 0.6s ease" : "none",
          /* Empêche toute interaction avec le site pendant le splash */
          pointerEvents: state === "done" ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
