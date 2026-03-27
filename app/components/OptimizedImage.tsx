"use client";

// ─── app/components/OptimizedImage.tsx ────────────────────────────────────────
// Remplace tous les <img> et les OptimizedImage maison éparpillés dans le projet.
// Fonctionnalités :
//   - Shimmer CSS (pas de Framer Motion = plus léger)
//   - Fade-in à 0.4s quand l'image est chargée
//   - Lazy loading natif (loading="lazy")
//   - Fallback si l'image échoue à charger
//   - Props flexibles pour couvrir tous les usages (cover, contain, top center...)

import { useState, CSSProperties } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  /** objectFit : "cover" (défaut) | "contain" */
  fit?: "cover" | "contain";
  /** objectPosition : "top" (défaut) | "center" | "center 20%" etc. */
  position?: string;
  /** style supplémentaire sur le wrapper */
  style?: CSSProperties;
  /** Priorité haute (above the fold) : désactive le lazy loading */
  priority?: boolean;
  /** Couleur du shimmer (défaut : blanc 10%) */
  shimmerColor?: string;
  /** Contenu affiché si l'image échoue */
  fallback?: React.ReactNode;
  /** borderRadius hérité du parent */
  borderRadius?: string | number;
}

export default function OptimizedImage({
  src,
  alt,
  fit = "cover",
  position = "top center",
  style,
  priority = false,
  fallback,
  borderRadius,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const br = borderRadius ?? "inherit";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: br,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* ── SHIMMER (visible tant que l'image charge) ────────────────────────── */}
      {!isLoaded && !hasError && (
        <div
          className="skeleton-cover"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: br,
          }}
        />
      )}

      {/* ── IMAGE ────────────────────────────────────────────────────────────── */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: position,
            display: "block",
            borderRadius: br,
            // Fade-in au chargement — CSS pur, zéro Framer Motion
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
          }}
        />
      )}

      {/* ── FALLBACK (si erreur) ──────────────────────────────────────────────── */}
      {hasError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: br,
          }}
        >
          {fallback ?? (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "11px",
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Image indisponible
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SKELETON CARD ─────────────────────────────────────────────────────────────
// Remplace le composant SkeletonCard dans bibliotheque/page.tsx
// Utilise le shimmer CSS de globals.css au lieu de Framer Motion
export function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Cover */}
      <div
        className="skeleton-cover"
        style={{ width: "100%", height: "200px", borderRadius: "12px" }}
      />
      {/* Catégorie pill */}
      <div
        className="skeleton"
        style={{ width: "60px", height: "18px", borderRadius: "100px" }}
      />
      {/* Titre */}
      <div
        className="skeleton"
        style={{ width: "85%", height: "22px", borderRadius: "4px" }}
      />
      {/* Sous-titre */}
      <div
        className="skeleton"
        style={{ width: "50%", height: "14px", borderRadius: "4px" }}
      />
      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "4px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "12px",
        }}
      >
        <div
          className="skeleton"
          style={{ width: "40px", height: "28px", borderRadius: "4px" }}
        />
        <div
          className="skeleton"
          style={{ width: "70px", height: "20px", borderRadius: "100px" }}
        />
      </div>
    </div>
  );
}
