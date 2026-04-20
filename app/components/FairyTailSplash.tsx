"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
   Phases :
   "black"   → écran noir initial (300 ms)
   "reveal"  → la vidéo fade-in avec un léger dézoom (300→1200 ms)
   "playing" → title + barre apparaissent, progression = currentTime/duration
   "outro"   → fade-out cinématique, puis onFinish()
──────────────────────────────────────────────────────────────────────────────── */
type Phase = "black" | "reveal" | "playing" | "outro";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase]       = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── Phase timeline ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"),  300);
    const t2 = setTimeout(() => setPhase("playing"), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── Synchro progression ↔ durée vidéo ──────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "playing") return;

    const onTimeUpdate = () => {
      if (video.duration && isFinite(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const onEnded = () => {
      setProgress(100);
      setPhase("outro");
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended",      onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended",      onEnded);
    };
  }, [phase]);

  /* ── Fallback : si vidéo indisponible, timer autonome ────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const FALLBACK_DELAY = 3000; // si la vidéo n'a pas chargé en 3 s

    const timer = setTimeout(() => {
      if (video.readyState < 2) {
        // La vidéo n'est pas dispo → on pilote la barre manuellement
        const interval = setInterval(() => {
          setProgress(p => {
            if (p >= 100) { clearInterval(interval); setPhase("outro"); return 100; }
            const speed = p < 60 ? 1.2 : p < 90 ? 0.7 : 0.2;
            return Math.min(p + speed + Math.random() * 0.5, 100);
          });
        }, 45);
      }
    }, FALLBACK_DELAY);

    return () => clearTimeout(timer);
  }, []);

  /* ── Tente d'activer le son une fois la vidéo en lecture ─────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tryUnmute = () => { try { video.muted = false; video.volume = 1; } catch {} };
    video.addEventListener("playing", tryUnmute, { once: true });
    return () => video.removeEventListener("playing", tryUnmute);
  }, []);

  /* ── Sortie : appelle onFinish après le fondu ────────────────────────────── */
  useEffect(() => {
    if (phase !== "outro") return;
    const t = setTimeout(onFinish, 1100);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  /* ── Label barre ─────────────────────────────────────────────────────────── */
  const barLabel =
    phase === "outro" || progress >= 100
      ? "Bienvenue dans la Guilde !"
      : progress < 5
        ? "Connexion en cours…"
        : progress < 40
          ? "Chargement des membres…"
          : progress < 75
            ? "Initialisation de la Guilde…"
            : "Presque prêt…";

  const contentVisible = phase === "playing" || phase === "outro";

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "outro" ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
    >

      {/* ── Vidéo plein écran ─────────────────────────────────────────────── */}
      <motion.video
        ref={videoRef}
        src="/Ma%20vid%C3%A9o.mp4"
        autoPlay
        muted
        playsInline
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{
          scale:   phase === "black" ? 1.08 : 1,
          opacity: phase === "black" ? 0    : 1,
        }}
        transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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

      {/* ── Barres cinématiques (letterbox) ──────────────────────────────── */}
      <motion.div
        className="ft-letterbox ft-letterbox--top"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: phase === "black" ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        className="ft-letterbox ft-letterbox--bottom"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: phase === "black" ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* ── Vignette sur la vidéo ─────────────────────────────────────────── */}
      <div className="ft-vignette-video" />

      {/* ── Titre centré ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            className="ft-center-title"
            initial={{ opacity: 0, y: 24, letterSpacing: "0.15em" }}
            animate={{ opacity: 1,  y: 0,  letterSpacing: "0.22em" }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <h1 className="ft-title-main">GUILDE OTAKU</h1>
            <p className="ft-title-sub">— La légende commence ici —</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barre de progression (bottom) ────────────────────────────────── */}
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            className="ft-loading-block"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1,  y: 0  }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >

            {/* Track */}
            <div className="ft-bar-track">
              <motion.div
                className="ft-bar-fill"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.12, ease: "linear" }}
              />
              {/* Flamme au bout */}
              <div
                className="ft-bar-flame-tip"
                style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
              />
              {/* Point lumineux */}
              <div
                className="ft-bar-glow-dot"
                style={{ left: `${Math.max(progress - 0.5, 0)}%` }}
              />
            </div>

            {/* Meta row */}
            <div className="ft-bar-meta">
              <span className="ft-bar-percent">{Math.floor(progress)}%</span>
              <motion.span
                key={barLabel}
                className="ft-bar-label"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1,  x: 0 }}
                transition={{ duration: 0.35 }}
              >
                {barLabel}
              </motion.span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
