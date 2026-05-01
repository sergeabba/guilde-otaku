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
  - On rend toujours les enfants pour ne pas casser le SSR et le SEO.
  - Le splash s'affiche par-dessus (z-index élevé).
  - Quand le splash se termine, on révèle le site avec un zoom-in + blur-out
    cinématique pour que la transition sente la continuité.
*/

export default function SplashWrapper({
  children,
  hasSeenSplash = false,
}: {
  children: React.ReactNode;
  hasSeenSplash?: boolean;
}) {
  const mounted = useMounted();
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  const [revealing, setRevealing] = useState(false);
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
    setRevealing(true);
    // le reveal se termine après 1.4s, on coupe l'état après
    setTimeout(() => setRevealing(false), 1400);
  }, []);

  const showingSplash = mounted && showSplash;
  const hidden = !mounted || showingSplash;

  return (
    <>
      <AnimatePresence>
        {showingSplash && (
          <FairyTailSplash key="splash" onFinish={handleFinish} />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={
          hidden
            ? { opacity: 0, scale: 0.96, filter: "blur(14px)" }
            : { opacity: 1, scale: 1,    filter: "blur(0px)"  }
        }
        transition={{
          duration: revealing ? 1.2 : 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          transformOrigin: "center center",
          pointerEvents: hidden ? "none" : "auto",
          willChange: "transform, opacity, filter",
        }}
      >
        {children}
      </motion.div>

      {/* Fallback SSR — évite le FOUC avant l'hydratation */}
      {!mounted && (
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
