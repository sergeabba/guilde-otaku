"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import FairyTailSplash from "./FairyTailSplash";

/* useSyncExternalStore avec subscribe stable = flag client-only fiable,
   sans setState-in-effect. */
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

/*
  Stratégie :
  - Un seul <div> wrapper, toujours présent → pas de remount des enfants.
  - On n'applique JAMAIS `transform` ni `filter` sur ce wrapper une fois
    le splash terminé : sinon ça crée un containing block qui casse tous
    les `position: fixed` descendants (modal, badge splash, toggles, etc.).
  - Pendant le reveal on n'anime QUE l'opacity (safe).
  - Les effets de zoom/blur restent dans le splash lui-même.
*/

type RevealState = "hidden" | "revealing" | "done";

export default function SplashWrapper({
  children,
  hasSeenSplash = false,
}: {
  children: React.ReactNode;
  hasSeenSplash?: boolean;
}) {
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const bypassSplash = hasSeenSplash || reducedMotion === true;
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  const [reveal, setReveal] = useState<RevealState>(
    hasSeenSplash ? "done" : "hidden"
  );
  const checkedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      sessionStorage.removeItem("guilde-splash-v2");
    } catch {}
  }, []);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      document.cookie = "guilde-splash-seen=1; path=/; max-age=86400; SameSite=Lax";
    } catch {}
    setShowSplash(false);
    setReveal("revealing");
    const t = setTimeout(() => setReveal("done"), 1000);
    return () => clearTimeout(t);
  }, []);

  const showingSplash = mounted && showSplash && !bypassSplash;
  // Returning/mobile visitors see the SSR page immediately; reduced-motion users bypass the cinematic intro.
  const hidden = !bypassSplash && (reveal === "hidden" || showingSplash || !mounted);

  return (
    <>
      <AnimatePresence>
        {showingSplash && (
          <FairyTailSplash key="splash" onFinish={handleFinish} />
        )}
      </AnimatePresence>

      <div
        style={{
          opacity: hidden ? 0 : 1,
          transition:
            reveal === "revealing"
              ? "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)"
              : "opacity 0.3s ease",
          pointerEvents: hidden ? "none" : "auto",
        }}
        aria-hidden={hidden ? "true" : undefined}
      >
        {children}
      </div>

      {!mounted && !bypassSplash && (
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
