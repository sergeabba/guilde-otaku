"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  fit?: "cover" | "contain";
  objectPosition?: "smart" | string;
  style?: React.CSSProperties;
  fullscreenBtn?: boolean;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(fsEl === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const resolvedPosition =
    objectPosition === "smart"
      ? fit === "cover"
        ? "center 18%"
        : "center bottom"
      : objectPosition;

  const toggleFs = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).webkitEnterFullscreen) {
        (el as any).webkitEnterFullscreen();
      }
    }
  }, [isFullscreen]);

  const btnVisible = isTouchDevice ? true : hovered;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", background: "#050508", ...style }}
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
          pointerEvents: "none",
        }}
      />

      {fullscreenBtn && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFs(); }}
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
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
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      )}
    </div>
  );
}
