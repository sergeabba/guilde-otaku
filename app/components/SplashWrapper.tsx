"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import FairyTailSplash from "./FairyTailSplash";

const SPLASH_KEY = "guilde-otaku-splash-seen";

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate hydration: sessionStorage only exists on client
      setShowSplash(false);
    }
    setHydrated(true);
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  };

  if (!hydrated) {
    return <div style={{ background: "#0a0000", minHeight: "100vh" }} />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <FairyTailSplash onFinish={handleFinish} />}
      </AnimatePresence>
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: "opacity 0.8s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
