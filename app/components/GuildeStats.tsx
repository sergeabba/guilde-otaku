"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Swords, BookOpen } from "lucide-react";

interface GuildeStatsProps {
  memberCount: number;
  fightCount: number;
  biblioCount: number;
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
      // easeOutCubic
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

export default function GuildeStats({ memberCount, fightCount, biblioCount, isDark = false }: GuildeStatsProps) {
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
  const animatedFights = useAnimatedCounter(fightCount, visible);
  const animatedBiblio = useAnimatedCounter(biblioCount, visible);

  const stats = [
    { icon: Users, value: animatedMembers, label: "Membres" },
    { icon: Swords, value: animatedFights, label: "Combats" },
    { icon: BookOpen, value: animatedBiblio, label: "Entrées Biblio" },
  ];

  return (
    <div ref={ref} style={{ marginBottom: "40px" }}>
      {/* Gold top border line */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          marginBottom: "0",
          borderRadius: "2px",
        }}
      />
      {/* Card */}
      <div
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
          borderTop: "none",
          borderRadius: "0 0 20px 20px",
          backdropFilter: "blur(12px)",
          padding: "40px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Icon size={28} style={{ color: "#c9a84c", opacity: 0.8 }} />
            <span
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900,
                color: "#c9a84c",
                fontFamily: "'Barlow Condensed', sans-serif",
                lineHeight: 1,
              }}
            >
              {value}
            </span>
            <span
              style={{
                fontSize: "clamp(12px, 2vw, 15px)",
                color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
