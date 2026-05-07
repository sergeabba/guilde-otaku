"use client";

import { useRef, useState, useCallback } from "react";
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
  /** Affiche le bouton plein écran au hover */
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
  const [fsActive, setFsActive] = useState(false);

  const resolvedPosition =
    objectPosition === "smart"
      ? fit === "cover"
        ? "center 18%"   // légèrement au-dessus du centre pour capter le visage
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
      // iOS Safari
      (el as any).webkitEnterFullscreen();
    }
    setFsActive(true);
    el.addEventListener("fullscreenchange", () => setFsActive(false), { once: true });
    el.addEventListener("webkitfullscreenchange", () => setFsActive(false), { once: true });
  }, []);

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
        }}
      />

      {/* Bouton plein écran — apparaît au hover */}
      {fullscreenBtn && (
        <button
          onClick={(e) => { e.stopPropagation(); requestFs(); }}
          aria-label="Plein écran"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 20,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.18s, transform 0.18s",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
}
