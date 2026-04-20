"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "black" | "opening" | "playing" | "outro";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [phase,    setPhase]    = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoLive  = useRef(false);

  /* ── 1. Timeline des phases ──────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 250);
    const t2 = setTimeout(() => setPhase("playing"), 1350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── 2. Progression ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const stopTimer = () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    const startTimer = () => {
      if (timerRef.current || videoLive.current) return;
      timerRef.current = setInterval(() => {
        if (videoLive.current) { stopTimer(); return; }
        setProgress(p => {
          if (p >= 100) { stopTimer(); setPhase("outro"); return 100; }
          return Math.min(p + 0.5 + Math.random() * 0.3, 100);
        });
      }, 50);
    };

    const onTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || !isFinite(v.duration) || v.duration <= 0) return;
      videoLive.current = true;
      stopTimer();
      setProgress((v.currentTime / v.duration) * 100);
    };

    const onEnded = () => {
      videoLive.current = true;
      stopTimer();
      setProgress(100);
      setPhase("outro");
    };

    const onCanPlay = () => {
      /* Tente unmute — ne crashe pas si refusé */
      try { video.muted = false; video.volume = 1; } catch {}
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended",      onEnded);
    video.addEventListener("canplay",    onCanPlay);
    video.addEventListener("error",      startTimer);

    /* Safety : si la vidéo ne démarre pas dans 2 s, fallback timer */
    const safe = setTimeout(() => { if (!videoLive.current) startTimer(); }, 2000);

    return () => {
      stopTimer();
      clearTimeout(safe);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended",      onEnded);
      video.removeEventListener("canplay",    onCanPlay);
      video.removeEventListener("error",      startTimer);
    };
  }, []);

  /* ── 3. Fin du splash ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "outro") return;
    const t = setTimeout(onFinish, 1000);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  /* ── Labels ─────────────────────────────────────────────────────────────── */
  const label =
    phase === "outro" || progress >= 100 ? "Bienvenue dans la Guilde !" :
    progress < 5  ? "Connexion en cours…"          :
    progress < 35 ? "Chargement des membres…"      :
    progress < 72 ? "Initialisation de la Guilde…" :
                    "Presque prêt…";

  const showVideo = phase !== "black";
  const showUI    = phase === "playing" || phase === "outro";

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "outro" ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
    >

      {/* ── Vidéo plein écran ─────────────────────────────────────────────── */}
      <div
        className="ft-video-wrapper"
        style={{
          opacity:   showVideo ? 1 : 0,
          transform: showVideo ? "scale(1)" : "scale(1.06)",
          transition: "opacity 1.4s ease, transform 1.7s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <video
          ref={videoRef}
          src="/Ma%20vid%C3%A9o.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          preload="auto"
        />
      </div>

      {/* ── Vignette cinématique ──────────────────────────────────────────── */}
      <div className="ft-vignette-video" />

      {/* ── Barres letterbox haut/bas ─────────────────────────────────────── */}
      <div className="ft-letterbox ft-letterbox--top" style={{
        transform: `scaleY(${phase === "black" ? 1 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>
      <div className="ft-letterbox ft-letterbox--bottom" style={{
        transform: `scaleY(${phase === "black" ? 1 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>

      {/* ── Scène centrale (centre écran garanti par flex) ────────────────── */}
      <div className="ft-stage">
        <AnimatePresence mode="wait">
          {showUI && (
            <motion.div
              key="title"
              className="ft-title-block"
              /* Entrée : snap depuis flou — style ouverture animé */
              initial={{
                opacity: 0,
                scale: 1.55,
                filter: "blur(28px)",
                y: 0,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                filter: "blur(10px)",
              }}
              transition={{
                duration: 0.72,
                ease: [0.16, 1, 0.3, 1],   /* expo.out — snap efficace */
              }}
            >
              {/* Ligne décorative top */}
              <motion.div
                className="ft-deco-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
              />

              <h1 className="ft-title-main">GUILDE OTAKU</h1>

              <motion.p
                className="ft-title-sub"
                initial={{ opacity: 0, letterSpacing: "0.12em" }}
                animate={{ opacity: 1, letterSpacing: "0.38em" }}
                transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
              >
                — La légende commence ici —
              </motion.p>

              {/* Ligne décorative bottom */}
              <motion.div
                className="ft-deco-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Barre de progression (bas d'écran) ───────────────────────────── */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            key="bar"
            className="ft-loading-block"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
                initial={{ opacity: 0, x: 10 }}
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
