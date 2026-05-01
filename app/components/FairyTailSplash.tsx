"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  iOS Safari autoplay rules (2024):
  - <video muted autoPlay playsInline> works most of the time
  - BUT: Low Power Mode, cellular data, or certain iOS versions block it silently
  - Solution: start the progress IMMEDIATELY via a timer, video sync is a bonus
*/

type Phase = "black" | "opening" | "playing" | "ignition" | "outro";

export default function FairyTailSplash({ onFinish }: { onFinish: () => void }) {
  const [phase,    setPhase]    = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const [soundOn,  setSoundOn]  = useState(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef    = useRef(false);

  /* ── AUDIO : tente de jouer avec le son dès que possible ────────────────── */
  const tryPlayWithSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = false;
      video.volume = 0.75;
      await video.play();
      setSoundOn(true);
      setNeedsTap(false);
    } catch {
      try {
        video.muted = true;
        await video.play();
      } catch {}
      setNeedsTap(true);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1) Autoplay garanti en muted
    video.muted = true;
    video.play().catch(() => {});

    // 2) Essai d'unmute immédiat (marche sur la plupart des desktops)
    const t = setTimeout(() => { tryPlayWithSound(); }, 80);

    // 3) Fallback : 1ʳᵉ interaction utilisateur → active le son
    const onFirstInteract = () => {
      if (!video.muted) return;
      video.muted = false;
      video.volume = 0.75;
      video.play().then(() => {
        setSoundOn(true);
        setNeedsTap(false);
      }).catch(() => {});
    };
    window.addEventListener("pointerdown", onFirstInteract, { once: true });
    window.addEventListener("touchstart",  onFirstInteract, { once: true });
    window.addEventListener("keydown",     onFirstInteract, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("touchstart",  onFirstInteract);
      window.removeEventListener("keydown",     onFirstInteract);
    };
  }, [tryPlayWithSound]);

  /* ── 1. Phase timeline ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "black") return;
    const t1 = setTimeout(() => setPhase("opening"), 180);
    const t2 = setTimeout(() => setPhase("playing"), 1100);
    const safety = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; setPhase("ignition"); }
    }, 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(safety); };
  }, [phase]);

  /* ── 2. Timer de progression ────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "playing") return;

    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            if (!doneRef.current) { doneRef.current = true; setPhase("ignition"); }
            return 100;
          }
          const spd =
            p < 20 ? 8 :
            p < 50 ? 6 :
            p < 80 ? 4 :
            p < 95 ? 2 :
            1;
          return Math.min(p + spd + Math.random() * 0.25, 100);
        });
      }, 100);
    };

    startTimer();

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [phase]);

  /* ── 3. Sync vidéo ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isFinite(video.duration) || video.duration <= 0) return;
      const videoPct = (video.currentTime / video.duration) * 100;
      setProgress(p => videoPct > p ? videoPct : p);
    };

    const onEnded = () => {
      setProgress(100);
      if (!doneRef.current) { doneRef.current = true; setPhase("ignition"); }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended",      onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended",      onEnded);
    };
  }, []);

  /* ── 4. Phase IGNITION (flash + zoom) puis OUTRO ────────────────────────── */
  useEffect(() => {
    if (phase !== "ignition") return;
    // durée du flash avant le fondu final
    const t = setTimeout(() => setPhase("outro"), 620);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── 5. Fade-out audio + fin du splash ──────────────────────────────────── */
  useEffect(() => {
    if (phase !== "outro") return;

    const video = videoRef.current;

    if (video && !video.muted) {
      const STEPS    = 24;
      const INTERVAL = 30;
      const startVol = video.volume;
      let step = 0;

      const fade = setInterval(() => {
        step++;
        const ratio = 1 - step / STEPS;
        if (step >= STEPS || ratio <= 0) {
          video.volume = 0;
          video.pause();
          clearInterval(fade);
        } else {
          video.volume = startVol * ratio;
        }
      }, INTERVAL);

      const done = setTimeout(onFinish, 900);
      return () => { clearInterval(fade); clearTimeout(done); };
    }

    const t = setTimeout(onFinish, 850);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  /* ── Labels ─────────────────────────────────────────────────────────────── */
  const label =
    progress >= 100 ? "Bienvenue dans la Guilde !" :
    progress < 5    ? "Invocation du grimoire…"     :
    progress < 35   ? "Éveil des esprits…"          :
    progress < 72   ? "Alignement des astres…"      :
                      "La flamme prend vie…";

  const showVideo = phase !== "black";
  const showUI    = phase === "playing";
  const igniting  = phase === "ignition" || phase === "outro";

  /* ── Particules (embers) — générées une fois ────────────────────────────── */
  const embers = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 5 + Math.random() * 4,
      size: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 80,
    })),
    []
  );

  return (
    <motion.div
      className="ft-splash-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "outro" ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
    >

      {/* ── Vidéo HD en fond ────────────────────────────────────────────── */}
      <div
        className="ft-video-wrapper"
        style={{
          opacity:   showVideo ? 1 : 0,
          transform: igniting
            ? "scale(1.18)"
            : showVideo ? "scale(1)" : "scale(1.08)",
          filter: igniting ? "brightness(1.6) saturate(1.2)" : "brightness(1) saturate(1)",
          transition:
            "opacity 1.4s ease, transform 1.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.6s ease",
        }}
      >
        <video
          ref={videoRef}
          src="/Ma%20vid%C3%A9o.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          preload="metadata"
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* ── Vignette cinématique ──────────────────────────────────────────── */}
      <div className="ft-vignette-video" />

      {/* ── Embers / particules flottantes ──────────────────────────────── */}
      {showVideo && (
        <div className="ft-embers-layer" aria-hidden>
          {embers.map(e => (
            <span
              key={e.id}
              className="ft-ember"
              style={{
                left: `${e.left}%`,
                width: `${e.size}px`,
                height: `${e.size}px`,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.duration}s`,
                ['--drift' as string]: `${e.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* ── Barres letterbox ─────────────────────────────────────────────── */}
      <div className="ft-letterbox ft-letterbox--top" style={{
        transform: `scaleY(${phase === "black" ? 1 : igniting ? 0.25 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>
      <div className="ft-letterbox ft-letterbox--bottom" style={{
        transform: `scaleY(${phase === "black" ? 1 : igniting ? 0.25 : 0})`,
        transition: "transform 0.95s cubic-bezier(0.76,0,0.24,1)",
      }}/>

      {/* ── Flash d'ignition (quand la barre atteint 100 %) ─────────────── */}
      <AnimatePresence>
        {igniting && (
          <motion.div
            key="flash"
            className="ft-ignition-flash"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.8, 0], scale: [0.2, 1.2, 2.4, 3.2] }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], times: [0, 0.25, 0.55, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Shockwave ring ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {igniting && (
          <motion.div
            key="ring"
            className="ft-ignition-ring"
            initial={{ opacity: 0.9, scale: 0.1 }}
            animate={{ opacity: 0, scale: 4 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Scène centrale ───────────────────────────────────────────────── */}
      <div className="ft-stage">
        <AnimatePresence mode="wait">
          {(showUI || igniting) && (
            <motion.div
              key="title"
              className="ft-title-block"
              initial={{ opacity: 0, scale: 1.5, filter: "blur(24px)" }}
              animate={
                igniting
                  ? { opacity: 0, scale: 1.8, filter: "blur(16px)" }
                  : { opacity: 1, scale: 1,   filter: "blur(0px)"  }
              }
              exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
              transition={{ duration: igniting ? 0.55 : 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Ligne dorée top */}
              <motion.div
                className="ft-deco-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.65, ease: "easeOut" }}
              />

              {/* ✦ Titre principal — lettre par lettre */}
              <h1 className="ft-title-main" aria-label="GUILDE OTAKU">
                {"GUILDE OTAKU".split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    className="ft-title-letter"
                    initial={{ opacity: 0, y: 30, rotateX: -90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      delay: 0.25 + i * 0.055,
                      duration: 0.7,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </h1>

              {/* Sous-ligne avec lettre-espacement animé */}
              <motion.p
                className="ft-title-sub"
                initial={{ opacity: 0, letterSpacing: "0.08em" }}
                animate={{ opacity: 1, letterSpacing: "0.35em" }}
                transition={{ delay: 0.9, duration: 1.0, ease: "easeOut" }}
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
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
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

      {/* ── Bouton "Activer le son" (fallback iOS) ──────────────────────── */}
      <AnimatePresence>
        {needsTap && !soundOn && phase === "playing" && (
          <motion.button
            key="sound-tap"
            type="button"
            className="ft-sound-tap"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,  scale: 1   }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={tryPlayWithSound}
            aria-label="Activer le son"
          >
            <span className="ft-sound-tap-icon" aria-hidden>♪</span>
            <span className="ft-sound-tap-text">Activer le son</span>
          </motion.button>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
