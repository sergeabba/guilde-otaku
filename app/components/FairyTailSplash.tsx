"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "black" | "opening" | "playing" | "outro";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase]       = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const [videoOk, setVideoOk]   = useState(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── 1. Phase timeline ──────────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 200);
    const t2 = setTimeout(() => setPhase("playing"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── 2. Sync barre ↔ vidéo (ou fallback timer) ─────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    /* Fallback timer — toujours actif, s'arrête si la vidéo prend le relais */
    let usingVideo = false;

    const startFallback = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (usingVideo) { clearFallback(); return; }
        setProgress(p => {
          if (p >= 100) { clearFallback(); triggerOutro(); return 100; }
          return Math.min(p + 0.55 + Math.random() * 0.35, 100);
        });
      }, 50);
    };

    const clearFallback = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    const triggerOutro = () => setPhase("outro");

    /* Sync sur la durée réelle */
    const onTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || !isFinite(v.duration) || v.duration <= 0) return;
      usingVideo = true;
      const pct = (v.currentTime / v.duration) * 100;
      setProgress(pct);
    };

    const onEnded = () => {
      usingVideo = true;
      clearFallback();
      setProgress(100);
      triggerOutro();
    };

    const onCanPlay = () => {
      setVideoOk(true);
      // Tente d'activer le son (fonctionne si l'utilisateur a déjà interagi)
      video.muted = false;
      video.volume = 1;
    };

    const onError = () => {
      // Vidéo indisponible → fallback timer prend le relais
      setVideoOk(false);
      startFallback();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended",      onEnded);
    video.addEventListener("canplay",    onCanPlay);
    video.addEventListener("error",      onError);

    // Lancer fallback après 1.5 s si la vidéo n'a pas démarré
    const safetyTimer = setTimeout(() => {
      if (!usingVideo) startFallback();
    }, 1500);

    return () => {
      clearFallback();
      clearTimeout(safetyTimer);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended",      onEnded);
      video.removeEventListener("canplay",    onCanPlay);
      video.removeEventListener("error",      onError);
    };
  }, []);

  /* ── 3. Sortie ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "outro") return;
    const t = setTimeout(onFinish, 950);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  /* ── 4. Label dynamique ─────────────────────────────────────────────────── */
  const label =
    phase === "outro" || progress >= 100 ? "Bienvenue dans la Guilde !" :
    progress < 5  ? "Connexion en cours…"          :
    progress < 35 ? "Chargement des membres…"      :
    progress < 70 ? "Initialisation de la Guilde…" :
                    "Presque prêt…";

  const showUI = phase === "playing" || phase === "outro";

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "outro" ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Vidéo en fond plein écran (élément natif, pas motion.video) ── */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          transform: phase === "black" ? "scale(1.07)" : "scale(1)",
          opacity:   phase === "black" ? 0 : 1,
          transition: "opacity 1.3s ease, transform 1.4s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <video
          ref={videoRef}
          src="/Ma%20vid%C3%A9o.mp4"
          autoPlay
          muted        /* obligatoire pour l'autoplay mobile */
          playsInline
          loop={false}
          preload="auto"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
          }}
        />
      </div>

      {/* ── Vignette ─────────────────────────────────────────────────────── */}
      <div className="ft-vignette-video" />

      {/* ── Barres letterbox ─────────────────────────────────────────────── */}
      <div
        className="ft-letterbox ft-letterbox--top"
        style={{
          transform: `scaleY(${phase === "black" ? 1 : 0})`,
          transition: "transform 0.85s cubic-bezier(0.76,0,0.24,1)",
        }}
      />
      <div
        className="ft-letterbox ft-letterbox--bottom"
        style={{
          transform: `scaleY(${phase === "black" ? 1 : 0})`,
          transition: "transform 0.85s cubic-bezier(0.76,0,0.24,1)",
        }}
      />

      {/* ── Titre centré ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            key="title"
            className="ft-center-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          >
            <h1 className="ft-title-main">GUILDE OTAKU</h1>
            <p className="ft-title-sub">— La légende commence ici —</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barre de progression ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            key="bar"
            className="ft-loading-block"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="ft-bar-track">
              <div className="ft-bar-fill" style={{ width: `${progress}%` }} />
              <div className="ft-bar-flame-tip"
                   style={{ left: `${Math.max(progress - 0.5, 0)}%` }} />
              <div className="ft-bar-glow-dot"
                   style={{ left: `${Math.max(progress - 0.5, 0)}%` }} />
            </div>
            <div className="ft-bar-meta">
              <span className="ft-bar-percent">{Math.floor(progress)}%</span>
              <motion.span
                key={label}
                className="ft-bar-label"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {label}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
