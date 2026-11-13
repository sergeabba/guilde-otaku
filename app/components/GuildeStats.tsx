"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Users, Globe, Shield, Sparkles } from "lucide-react";
import { COUNTRIES, flagUrl } from "../config/countries";

interface GuildeStatsProps {
  memberCount: number;
  countryCounts: Record<string, number>;
  isDark?: boolean;
}

function useAnimatedCounter(target: number, trigger: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    if (target === 0) { setValue(0); return; }

    let start: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, trigger, duration]);

  return value;
}

export default function GuildeStats({ memberCount, countryCounts, isDark = false }: GuildeStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animatedMembers = useAnimatedCounter(memberCount, visible);
  const countryCount = useMemo(() => Object.keys(countryCounts).length, [countryCounts]);
  const animatedCountries = useAnimatedCounter(countryCount, visible);

  const topCountries = useMemo(() => {
    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [countryCounts]);

  return (
    <div ref={ref} style={{ marginBottom: "50px", position: "relative" }}>
      {/* Scotch tape on top */}
      <div className="scotch gold" style={{ top: "-12px", width: "90px", height: "24px" }} />

      {/* Main Boarding Pass / Credential Container */}
      <div
        style={{
          position: "relative",
          background: isDark
            ? "linear-gradient(145deg, rgba(22, 22, 30, 0.85) 0%, rgba(10, 10, 16, 0.95) 100%)"
            : "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 245, 240, 0.95) 100%)",
          border: `1.5px solid ${isDark ? "rgba(201, 168, 76, 0.35)" : "rgba(201, 168, 76, 0.45)"}`,
          borderRadius: "18px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isDark
            ? "0 18px 45px -10px rgba(0,0,0,0.7), 0 0 35px rgba(201,168,76,0.08)"
            : "0 18px 45px -10px rgba(180,140,50,0.18), 0 0 20px rgba(201,168,76,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Top hologram foil */}
        <div className="hologram-strip" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", zIndex: 10 }} />

        {/* Trame Manga Screentone Texture */}
        <div
          className="manga-screentone"
          style={{
            position: "absolute",
            inset: 0,
            opacity: isDark ? 0.04 : 0.025,
            color: "#c9a84c",
            pointerEvents: "none",
          }}
        />

        {/* Top Header Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            padding: "12px 24px",
            background: isDark ? "rgba(201, 168, 76, 0.08)" : "rgba(201, 168, 76, 0.12)",
            borderBottom: `1px dashed ${isDark ? "rgba(201, 168, 76, 0.3)" : "rgba(201, 168, 76, 0.35)"}`,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-bricolage), system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#c9a84c",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={14} color="#c9a84c" />
              REGISTRE OFFICIEL DE LA GUILDE
            </span>
            <span className="kanji-stamp gold" style={{ fontSize: "9px", padding: "1px 6px" }}>
              Ryokenshō
            </span>
            <span
              style={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontSize: "16px",
                color: isDark ? "rgba(255, 220, 120, 0.85)" : "#9a7820",
                transform: "rotate(-1.5deg)",
              }}
            >
              promo 2025-2026
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="tampon">
              <Sparkles size={11} /> HOMOLOGUÉ
            </span>
          </div>
        </div>

        {/* Core Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            padding: "28px 24px 22px",
            alignItems: "center",
          }}
        >
          {/* Members Counter Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "16px 20px",
              borderRadius: "14px",
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(201, 168, 76, 0.15)",
                border: "1.5px solid rgba(201, 168, 76, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={28} color="#c9a84c" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), system-ui, sans-serif",
                  fontSize: "clamp(34px, 5vw, 48px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "#c9a84c",
                  letterSpacing: "-0.03em",
                }}
              >
                {animatedMembers}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  marginTop: "4px",
                }}
              >
                Guerriers Inscrits
              </div>
            </div>
          </div>

          {/* Countries Counter Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "16px 20px",
              borderRadius: "14px",
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(167, 139, 250, 0.15)",
                border: "1.5px solid rgba(167, 139, 250, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Globe size={28} color="#a78bfa" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), system-ui, sans-serif",
                  fontSize: "clamp(34px, 5vw, 48px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: isDark ? "#c4b5fd" : "#7c3aed",
                  letterSpacing: "-0.03em",
                }}
              >
                {animatedCountries}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  marginTop: "4px",
                }}
              >
                Nations Représentées
              </div>
            </div>
          </div>
        </div>

        {/* Nations Breakdown Pills + Barcode Decorative Section */}
        {topCountries.length > 0 && (
          <div
            style={{
              padding: "16px 24px 22px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontSize: "17px",
                  color: isDark ? "rgba(255, 215, 120, 0.8)" : "#b3891d",
                  transform: "rotate(-2deg)",
                  marginRight: "4px",
                }}
              >
                Origines :
              </span>
              {topCountries.map(([code, count]) => {
                const c = COUNTRIES.find(x => x.code === code);
                const prep = c?.prep || `en ${code}`;
                return (
                  <div
                    key={code}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "5px 12px",
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)",
                      borderRadius: "8px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      boxShadow: isDark ? "0 2px 6px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.04)",
                    }}
                  >
                    <img
                      src={flagUrl(code)}
                      alt={c?.label || code}
                      style={{ width: 19, height: 14, objectFit: "cover", borderRadius: 2 }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: isDark ? "rgba(255,255,255,0.85)" : "#222",
                        fontFamily: "'Barlow Condensed', sans-serif",
                      }}
                    >
                      {count} {prep}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stylized Simulated Barcode for Boarding Pass / Guild License feel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "3px",
                opacity: isDark ? 0.45 : 0.6,
              }}
            >
              <div
                style={{
                  height: "24px",
                  width: "110px",
                  background: isDark
                    ? "repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 4px, #fff 4px 5px, transparent 5px 8px, #fff 8px 11px, transparent 11px 12px)"
                    : "repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 8px, #111 8px 11px, transparent 11px 12px)",
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                GUILDE-2026-OKU
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
