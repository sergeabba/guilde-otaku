"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "complete">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Start progress immediately (don't wait for video — avoids crash if blocked) */
  useEffect(() => {
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
  }, []);

  /* Try to unmute after user interaction / once video plays */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryUnmute = () => {
      video.muted = false;
      video.volume = 1;
    };

    video.addEventListener("playing", tryUnmute, { once: true });
    return () => video.removeEventListener("playing", tryUnmute);
  }, []);

  /* Auto dismiss */
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
      {/* ── Full-screen HD Video ── */}
      <video
        ref={videoRef}
        src="/Ma%20vid%C3%A9o.mp4"
        autoPlay
        muted          /* must start muted for autoplay to work on mobile */
        loop
        playsInline
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

      {/* ── Dark vignette ── */}
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

      {/* ── Loading bar (bottom) ── */}
      <motion.div
        className="ft-loading-block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ position: "relative", zIndex: 2 }}
      >
        <div className="ft-bar-track">
          <div className="ft-bar-fill" style={{ width: `${progress}%` }} />
          <div className="ft-bar-flame-tip" style={{ left: `${Math.max(progress - 0.5, 0)}%` }} />
          <div className="ft-bar-glow-dot"  style={{ left: `${Math.max(progress - 0.5, 0)}%` }} />
        </div>
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
