"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Maximize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  /** "cover" (default) remplit le conteneur | "contain" montre tout le sujet */
  fit?: "cover" | "contain";
  /**
   * Position auto : "smart" décale légèrement vers le haut pour centrer le visage.
   * Passe une valeur CSS directe ("center", "50% 30%"…) pour override manuel.
   */
  objectPosition?: "smart" | string;
  style?: React.CSSProperties;
  /** Affiche le bouton plein écran */
  fullscreenBtn?: boolean;
  /** Classes Tailwind supplémentaires sur la <video> */
  className?: string;
}

export default function VideoPlayer({
  src,
  fit = "cover",
  objectPosition = "smart",
  style,
  fullscreenBtn = true,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const resolvedPosition =
    objectPosition === "smart"
      ? fit === "cover"
        ? "center 18%"
        : "center bottom"
      : objectPosition;

  const requestFs = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).webkitEnterFullscreen) {
      (el as any).webkitEnterFullscreen();
    }
  }, []);

  // On touch devices the button is always visible (no hover state)
  const btnVisible = isTouchDevice ? true : hovered;

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: fit,
          objectPosition: resolvedPosition,
          display: "block",
          // Prevent the video element itself from capturing touch events so that:
          // 1. Scrolling over the video works on iOS
          // 2. iOS won't open the native video player on tap
          pointerEvents: "none",
        }}
      />

      {/* Bouton plein écran */}
      {fullscreenBtn && (
        <button
          onClick={(e) => { e.stopPropagation(); requestFs(); }}
          aria-label="Plein écran"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            opacity: btnVisible ? (isTouchDevice ? 0.75 : 1) : 0,
            transform: btnVisible ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.18s, transform 0.18s",
            pointerEvents: "auto",
          }}
        >
          <Maximize2 size={15} />
        </button>
      )}
    </div>
  );
}
