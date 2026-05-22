"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Users, Globe } from "lucide-react";
import { COUNTRIES, flagUrl } from "../config/countries";

interface GuildeStatsProps {
  memberCount: number;
  countryCounts: Record<string, number>;
  isDark?: boolean;
}

function useAnimatedCounter(target: number, trigger: boolean, duration = 1500) {
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
      { threshold: 0.3 }
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
      .slice(0, 5);
  }, [countryCounts]);

  return (
    <div ref={ref} style={{ marginBottom: "40px" }}>
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          marginBottom: "0",
          borderRadius: "2px",
        }}
      />
      <div
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
          borderTop: "none",
          borderRadius: "0 0 20px 20px",
          backdropFilter: "blur(12px)",
          padding: "40px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Top row: members + countries count */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <Users size={28} style={{ color: "#c9a84c", opacity: 0.8 }} />
            <span style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#c9a84c", fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>
              {animatedMembers}
            </span>
            <span style={{ fontSize: "clamp(12px, 2vw, 15px)", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Membres
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <Globe size={28} style={{ color: "#c9a84c", opacity: 0.8 }} />
            <span style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#c9a84c", fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>
              {animatedCountries}
            </span>
            <span style={{ fontSize: "clamp(12px, 2vw, 15px)", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Pays
            </span>
          </div>
        </div>

        {/* Country breakdown */}
        {topCountries.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 16px" }}>
            {topCountries.map(([code, count]) => {
              const c = COUNTRIES.find(x => x.code === code);
              const prep = c?.prep || `en ${code}`;
              return (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
                  <img src={flagUrl(code)} alt={c?.label || code} style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {count} {count > 1 ? "membres" : "membre"} {prep}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
