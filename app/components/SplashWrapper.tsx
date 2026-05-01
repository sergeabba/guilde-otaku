"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FairyTailSplash from "./FairyTailSplash";

/* useSyncExternalStore with a never-changing subscriber = reliable
   "am I on the client yet?" flag, without setState-in-effect. */
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

/*
  Stratégie :
  - Rendu toujours des enfants pour le SSR/SEO.
  - Pendant splash + reveal : on les enveloppe dans un motion.div
    (opacity + scale + blur) pour l'animation cinématique.
  - Dès que le reveal est terminé, on rend les enfants SANS wrapper —
    sinon transform/filter créent un containing block qui casse les
    position: fixed des enfants (modal, toggles, scroll lock, etc.).
*/

type RevealState = "idle-hidden" | "revealing" | "done";

export default function SplashWrapper({
  children,
  hasSeenSplash = false,
}: {
  children: React.ReactNode;
  hasSeenSplash?: boolean;
}) {
  const mounted = useMounted();
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  const [reveal, setReveal] = useState<RevealState>(
    hasSeenSplash ? "done" : "idle-hidden"
  );
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      sessionStorage.removeItem("guilde-splash-v2");
    } catch {}
  }, []);

  const handleFinish = useCallback(() => {
    try {
      document.cookie = "guilde-splash-seen=1; path=/; max-age=86400; SameSite=Lax";
    } catch {}
    setShowSplash(false);
    setReveal("revealing");
    // Une fois l'anim terminée, on drop le motion wrapper.
    setTimeout(() => setReveal("done"), 1200);
  }, []);

  const showingSplash = mounted && showSplash;

  return (
    <>
      <AnimatePresence>
        {showingSplash && (
          <FairyTailSplash key="splash" onFinish={handleFinish} />
        )}
      </AnimatePresence>

      {reveal === "done" ? (
        // Pas de wrapper motion → aucun containing block généré,
        // les position:fixed des enfants fonctionnent normalement.
        <>{children}</>
      ) : reveal === "revealing" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, filter: "blur(14px)" }}
          animate={{ opacity: 1, scale: 1,    filter: "blur(0px)"  }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center center" }}
        >
          {children}
        </motion.div>
      ) : (
        // Splash visible ou pas encore monté → on cache simplement
        // les enfants, sans transform (opacity seule).
        <div
          style={{
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 0.4s ease",
          }}
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      {!mounted && !hasSeenSplash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
          }}
        />
      )}
    </>
  );
}
