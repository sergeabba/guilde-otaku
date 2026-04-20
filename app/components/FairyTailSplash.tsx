"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  iOS Safari autoplay rules (2024):
  - <video muted autoPlay playsInline> works most of the time
  - BUT: Low Power Mode, cellular data, or certain iOS versions block it silently
  - Solution: start the progress IMMEDIATELY via a timer, video sync is a bonus
*/

type Phase = "black" | "opening" | "playing" | "outro";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [phase,    setPhase]    = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef    = useRef(false);

  /* ── 1. Phase timeline ──────────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 200);
    const t2 = setTimeout(() => setPhase("playing"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── 2. Timer de progression — TOUJOURS actif dès "playing" ─────────────── */
  /*
      On n'attend PAS la vidéo. Le timer est la source principale.
      Si la vidéo est disponible, elle accélère/ajuste la progression.
      iOS ne peut pas crasher car il n'y a aucune dépendance à la vidéo.
  */
  useEffect(() => {
    if (phase !== "playing") return;

    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            if (!doneRef.current) { doneRef.current = true; setPhase("outro"); }
            return 100;
          }
          // Vitesse variable : lent → moyen → lent en fin (simuler un vrai chargement)
          const spd =
            p < 15 ? 0.6 :
            p < 45 ? 1.1 :
            p < 75 ? 0.85 :
            p < 92 ? 0.4 :
            0.15;
          return Math.min(p + spd + Math.random() * 0.25, 100);
        });
      }, 50);
    };

    // Timer démarre immédiatement, indépendamment de la vidéo
    startTimer();

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [phase]);

  /* ── 3. Sync vidéo (bonus — accélère la barre si la vidéo joue plus vite) ─ */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isFinite(video.duration) || video.duration <= 0) return;
      const videoPct = (video.currentTime / video.duration) * 100;
      // N'avance la barre que si la vidéo est devant le timer
      setProgress(p => videoPct > p ? videoPct : p);
    };

    const onEnded = () => {
      setProgress(100);
      if (!doneRef.current) { doneRef.current = true; setPhase("outro"); }
    };

    // Tente unmute une fois (iOS bloque, mais ça ne crashe pas)
    const tryUnmute = () => {
      try { video.muted = false; video.volume = 1; } catch {}
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended",      onEnded);
    video.addEventListener("playing",    tryUnmute, { once: true });

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended",      onEnded);
    };
  }, []);

  /* ── 4. Fin du splash ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "outro") return;
    const t = setTimeout(onFinish, 950);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  /* ── Labels ─────────────────────────────────────────────────────────────── */
  const label =
    progress >= 100 ? "Bienvenue dans la Guilde !" :
    progress < 5    ? "Connexion en cours…"          :
    progress < 35   ? "Chargement des membres…"      :
    progress < 72   ? "Initialisation de la Guilde…" :
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

      {/* ── Vidéo HD en fond (best-effort sur iOS) ───────────────────────── */}
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
          muted         /* requis iOS autoplay */
          playsInline   /* requis iOS — évite le fullscreen natif */
          loop={false}
          preload="metadata"   /* "auto" peut être ignoré sur iOS cellulaire */
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* ── Vignette cinématique ──────────────────────────────────────────── */}
      <div className="ft-vignette-video" />

      {/* ── Barres letterbox ─────────────────────────────────────────────── */}
      <div className="ft-letterbox ft-letterbox--top" style={{
        transform: `scaleY(${phase === "black" ? 1 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>
      <div className="ft-letterbox ft-letterbox--bottom" style={{
        transform: `scaleY(${phase === "black" ? 1 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>

      {/* ── Scène centrale ───────────────────────────────────────────────── */}
      <div className="ft-stage">
        <AnimatePresence mode="wait">
          {showUI && (
            <motion.div
              key="title"
              className="ft-title-block"
              initial={{ opacity: 0, scale: 1.5, filter: "blur(24px)" }}
              animate={{ opacity: 1, scale: 1,   filter: "blur(0px)"  }}
              exit={{    opacity: 0, scale: 0.92, filter: "blur(8px)"  }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Ligne dorée top */}
              <motion.div
                className="ft-deco-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.65, ease: "easeOut" }}
              />

              {/* ✦ Titre principal — police Cinzel Decorative style guild fantasy */}
              <h1 className="ft-title-main">GUILDE OTAKU</h1>

              {/* Sous-ligne avec lettre-espacement animé */}
              <motion.p
                className="ft-title-sub"
                initial={{ opacity: 0, letterSpacing: "0.08em" }}
                animate={{ opacity: 1, letterSpacing: "0.35em" }}
                transition={{ delay: 0.3, duration: 1.0, ease: "easeOut" }}
              >
                — La légende commence ici —
              </motion.p>

              {/* Ligne dorée bottom */}
              <motion.div
                className="ft-deco-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.65, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Barre de progression ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            key="bar"
            className="ft-loading-block"
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                animate={{ opacity: 1, x: 0  }}
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
