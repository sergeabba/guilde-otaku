"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ─── Main Splash Component ──────────────────────────────────────────────────── */
export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "complete">("loading");
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Start progress once video can play */
  useEffect(() => {
    if (!videoReady) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("complete");
          return 100;
        }
        const speed =
          prev < 20 ? 0.9 :
          prev < 50 ? 1.3 :
          prev < 80 ? 0.95 :
          prev < 95 ? 0.45 :
          0.18;
        return Math.min(prev + speed + Math.random() * 0.6, 100);
      });
    }, 45);

    return () => clearInterval(interval);
  }, [videoReady]);

  /* Auto dismiss after complete */
  useEffect(() => {
    if (phase !== "complete") return;
    const t = setTimeout(onFinish, 900);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Full-screen HD Video ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src="/Ma vidéo.mp4"
        autoPlay
        loop
        playsInline
        /* muted={false} — son activé */
        onCanPlay={() => setVideoReady(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
      />

      {/* ── Dark vignette overlay ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Loading bar (bottom) ─────────────────────────────────────────────────── */}
      <motion.div
        className="ft-loading-block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: videoReady ? 1 : 0, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: "relative", zIndex: 2 }}
      >
        <div className="ft-bar-track">
          <motion.div
            className="ft-bar-fill"
            style={{ width: `${progress}%` }}
          />
          {/* Leading flame tip */}
          <div
            className="ft-bar-flame-tip"
            style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
          />
          {/* Glow dot */}
          <div
            className="ft-bar-glow-dot"
            style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
          />
        </div>

        {/* Text row */}
        <div className="ft-bar-meta">
          <span className="ft-bar-percent">{Math.floor(progress)}%</span>
          <span className="ft-bar-label">
            {phase === "complete" ? "Prêt à rejoindre la Guilde !" : "Chargement en cours..."}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
