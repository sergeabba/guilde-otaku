"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members, Member } from "../../data/members";
import Link from "next/link";
import MemberModal from "../components/MemberModal";
import { User, Sword, Gift, Crown } from "lucide-react";
import { ViewMode } from "../page"; 
import { rankAccents } from "../config/ranks";

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const monthShort = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
];

const monthThemes: Record<number, { accent: string; bg: string; dark: boolean }> = {
  1:  { accent: "#60a5fa", bg: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%)", dark: true },
  2:  { accent: "#f472b6", bg: "linear-gradient(135deg, #1a0a14 0%, #2d0f22 100%)", dark: true },
  3:  { accent: "#4ade80", bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", dark: false },
  4:  { accent: "#fb923c", bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", dark: false },
  5:  { accent: "#f59e0b", bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", dark: false },
  6:  { accent: "#c9a84c", bg: "linear-gradient(135deg, #0a0800 0%, #1a1200 100%)", dark: true },
  7:  { accent: "#f87171", bg: "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)", dark: true },
  8:  { accent: "#fbbf24", bg: "linear-gradient(135deg, #1a1000 0%, #2d1c00 100%)", dark: true },
  9:  { accent: "#a78bfa", bg: "linear-gradient(135deg, #0d0a1a 0%, #1a1230 100%)", dark: true },
  10: { accent: "#f97316", bg: "linear-gradient(135deg, #1a0800 0%, #2d1200 100%)", dark: true },
  11: { accent: "#94a3b8", bg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", dark: false },
  12: { accent: "#34d399", bg: "linear-gradient(135deg, #f0fdf9 0%, #ccfbf1 100%)", dark: false },
};



function parseBirthday(birthday: string): { day: number; month: number } | null {
  const clean = birthday.trim().toLowerCase();
  const monthMap: Record<string, number> = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
  };
  const parts = clean.split(" ");
  if (parts.length < 2) return null;
  const day = parseInt(parts[0]);
  const month = monthMap[parts[1]];
  if (!day || !month) return null;
  return { day, month };
}

function getDaysUntil(day: number, month: number): number {
  const now = new Date();
  const thisYear = now.getFullYear();
  let next = new Date(thisYear, month - 1, day);
  if (next.getDate() === now.getDate() && next.getMonth() === now.getMonth()) return 0;
  if (next < now) next = new Date(thisYear + 1, month - 1, day);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BirthdaysPage() {
  const [now, setNow] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const interval = setInterval(() => setNow(new Date()), 60_000);
  return () => clearInterval(interval);
}, []);


  const membersWithDates = members
    .map((m) => {
      const parsed = parseBirthday(m.birthday);
      if (!parsed) return null;
      return { ...m, day: parsed.day, month: parsed.month, daysUntil: getDaysUntil(parsed.day, parsed.month) };
    })
    .filter(Boolean) as (typeof members[0] & { day: number; month: number; daysUntil: number })[];

  const next = [...membersWithDates].sort((a, b) => a.daysUntil - b.daysUntil)[0];
  const sameDay = membersWithDates.filter(m => m.daysUntil === next?.daysUntil);
  const isToday = next?.daysUntil === 0; // Trigger de célébration

  const byMonth: Record<number, typeof membersWithDates> = {};
  for (let i = 1; i <= 12; i++) byMonth[i] = [];
  membersWithDates.forEach((m) => byMonth[m.month].push(m));
  Object.values(byMonth).forEach((arr) => arr.sort((a, b) => a.day - b.day));

  const currentMonth = now.getMonth() + 1;
  const orderedMonths = Array.from({ length: 12 }, (_, i) => ((currentMonth - 1 + i) % 12) + 1);
  const visibleMonths = activeMonth ? [activeMonth] : orderedMonths;

  const activeTheme = monthThemes[activeMonth ?? currentMonth];
  const isDark = activeTheme.dark;
  const themeAccent = activeTheme.accent;

  return (
    <motion.main animate={{ background: activeTheme.bg }} transition={{ duration: 0.6 }} style={{ minHeight: "100vh" }}>
      
      {/* ANIMATIONS CSS POUR LA CÉLÉBRATION */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 20px ${themeAccent}40; transform: scale(1); }
          50% { box-shadow: 0 0 50px ${themeAccent}90; transform: scale(1.02); }
          100% { box-shadow: 0 0 20px ${themeAccent}40; transform: scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* HEADER RESPONSIVE UNIFIÉ */}
      <motion.header 
        animate={{ backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)", borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
        style={{
          padding: isMobile ? "15px" : "0 40px", minHeight: "80px", display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: "center", justifyContent: "space-between", gap: isMobile ? "15px" : "0",
          position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid"
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start" }}>
          <img src="/logo.png" style={{ height: isMobile ? "40px" : "45px", filter: isDark ? "brightness(1.2)" : "none" }} alt="Logo" />
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "20px" : "24px", fontWeight: 900, lineHeight: 1, margin: 0, color: isDark ? "#fff" : "#111" }}>GUILDE OTAKU</h1>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700, color: themeAccent, letterSpacing: "0.2em", margin: "2px 0 0 0" }}>DEPUIS 2020</p>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}>
          <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: "100px", padding: "4px" }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "6px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
                background: viewMode === mode ? themeAccent : "transparent",
                color: viewMode === mode ? "#fff" : (isDark ? "#aaa" : "#666"), transition: "0.3s"
              }}>
                {mode === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>
          <nav style={{ display: "flex", gap: isMobile ? "20px" : "35px", fontWeight: 800, fontSize: isMobile ? "14px" : "19px", fontFamily: "'Barlow Condensed', sans-serif", overflowX: isMobile ? "auto" : "visible", width: isMobile ? "100%" : "auto", paddingBottom: isMobile ? "5px" : "0", whiteSpace: "nowrap" }}>
            <Link href="/" style={{ textDecoration: "none", color: isDark ? "rgba(255,255,255,0.6)" : "#666", transition: "0.2s" }}>MEMBRES</Link>
            <Link href="/birthdays" style={{ textDecoration: "none", color: themeAccent, transition: "0.2s" }}>ANNIVERSAIRES</Link>
            <Link href="/wanted" style={{ textDecoration: "none", color: isDark ? "rgba(255,255,255,0.6)" : "#666", transition: "0.2s" }}>WANTED</Link>
            <Link href="/fighters" style={{ textDecoration: "none", color: isDark ? "rgba(255,255,255,0.6)" : "#666", transition: "0.2s" }}>FIGHTERS</Link>
            <Link href="/bons-plans" style={{ textDecoration: "none", color: isDark ? "rgba(255,255,255,0.6)" : "#666", transition: "0.2s" }}>BONS PLANS</Link>
          </nav>
        </div>
      </motion.header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "0 15px" : "0 40px" }}>

        {/* HERO */}
        <motion.div style={{ paddingTop: isMobile ? "40px" : "56px", paddingBottom: "40px" }} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: themeAccent, marginBottom: "12px" }}>
            Guilde Otaku 2025 / 26
          </p>
          <motion.h1 animate={{ color: isDark ? "#fff" : "#111" }} transition={{ duration: 0.4 }} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "50px" : "clamp(52px, 8vw, 88px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em", textTransform: "uppercase", fontStyle: "italic" }}>
            ANNIVER<span style={{ color: themeAccent }}>SAIRES</span>
          </motion.h1>
        </motion.div>

        {/* ========================================================= */}
        {/* ================= CARTE ANNIVERSAIRE ==================== */}
        {/* ========================================================= */}
        {next && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setSelectedMember(next)}
            style={{
              // LA CORRECTION EST LÀ 👇 : On sépare backgroundImage et backgroundColor
              backgroundImage: isToday 
                ? `linear-gradient(270deg, ${isDark ? '#1a1a1a' : '#fff'} 0%, ${themeAccent}25 50%, ${isDark ? '#1a1a1a' : '#fff'} 100%)` 
                : "none",
              backgroundColor: isToday 
                ? "transparent" 
                : (isDark ? "rgba(255,255,255,0.05)" : "#111"),
              backgroundSize: isToday ? "200% 200%" : "auto",
              
              animation: isToday ? "gradientMove 3s ease infinite" : "none",
              border: isToday ? `2px solid ${themeAccent}` : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "transparent"}`,
              boxShadow: isToday ? `0 0 30px ${themeAccent}40` : "none",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              padding: isMobile ? "24px 20px" : "36px 44px",
              marginBottom: "48px",
              display: "flex", flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: "24px", flexWrap: "wrap",
              cursor: "pointer", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: isToday ? "4px" : "3px", background: `linear-gradient(90deg, transparent, ${themeAccent}, transparent)` }} />

            <div style={{ display: "flex", gap: "20px", width: isMobile ? "100%" : "auto", zIndex: 10 }}>
              
              <div style={{
                width: isToday ? "85px" : "72px", height: isToday ? "85px" : "72px", 
                borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                border: `3px solid ${themeAccent}`,
                animation: isToday ? "pulseGlow 2s infinite" : "none",
                position: "relative", transition: "all 0.3s"
              }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={viewMode} src={viewMode === "anime" ? next.animeChar : next.photo} alt={next.name}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                    transition={{ duration: 0.35 }}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                  />
                </AnimatePresence>
                {isToday && (
                  <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", animation: "float 3s ease-in-out infinite", filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.5))" }}>
                    <Crown size={24} color="#FFD700" fill="#FFD700" />
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase",
                  color: isToday ? themeAccent : (isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.4)"), marginBottom: "10px",
                  display: "flex", alignItems: "center", gap: "6px"
                }}>
                  {isToday ? <><Gift size={14}/> C'EST SON ANNIVERSAIRE </> : "PROCHAIN ANNIVERSAIRE"}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  {sameDay.map((m, i) => (
                    <h2 key={m.id} style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "32px" : "clamp(24px, 4vw, 40px)",
                      fontWeight: 900, color: isToday && !isDark ? "#111" : "#fff", letterSpacing: "-0.02em", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1,
                      textShadow: isToday ? `0 2px 10px ${themeAccent}80` : "none"
                    }}>
                      {m.name}{i < sameDay.length - 1 ? " &" : ""}
                    </h2>
                  ))}
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 500, color: isToday && !isDark ? "#444" : "rgba(255,255,255,0.6)", marginTop: "8px" }}>
                  {next.day} {monthNames[next.month - 1]} — {next.rank}
                </p>
              </div>
            </div>

            <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0, width: isMobile ? "100%" : "auto", borderTop: isMobile ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : "none", paddingTop: isMobile ? "15px" : "0", zIndex: 10 }}>
              {isToday ? (
                <div style={{ animation: "pulseGlow 2s infinite", background: themeAccent, padding: "10px 20px", borderRadius: "8px", transform: "rotate(-2deg)" }}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "0.1em", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                    JOYEUX ANNIVERSAIRE ! 
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 900, color: themeAccent, lineHeight: 1, letterSpacing: "-0.04em", fontStyle: "italic" }}>J-{next.daysUntil}</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "4px" }}>
                    {next.daysUntil === 1 ? "DEMAIN" : "JOURS RESTANTS"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* FILTRE PAR MOIS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "40px" }}>
          <button onClick={() => setActiveMonth(null)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 18px", borderRadius: "100px", border: activeMonth === null ? `2px solid ${themeAccent}` : `2px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, background: activeMonth === null ? themeAccent : "transparent", color: activeMonth === null ? "#fff" : (isDark ? "rgba(255,255,255,0.5)" : "#666"), cursor: "pointer", transition: "all 0.2s" }}>
            Tous
          </button>
          {orderedMonths.map((monthNum) => {
            if (byMonth[monthNum].length === 0) return null;
            const isActive = activeMonth === monthNum;
            const isCurrent = monthNum === currentMonth;
            const mTheme = monthThemes[monthNum];
            return (
              <button key={monthNum} onClick={() => setActiveMonth(isActive ? null : monthNum)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 16px", borderRadius: "100px", border: isActive ? `2px solid ${mTheme.accent}` : isCurrent ? `2px solid ${mTheme.accent}60` : `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, background: isActive ? mTheme.accent : isCurrent ? `${mTheme.accent}18` : "transparent", color: isActive ? "#fff" : isCurrent ? mTheme.accent : (isDark ? "rgba(255,255,255,0.45)" : "#555"), cursor: "pointer", transition: "all 0.2s" }}>
                {monthShort[monthNum - 1]} <span style={{ marginLeft: "5px", fontSize: "11px", opacity: 0.6 }}>{byMonth[monthNum].length}</span>
              </button>
            );
          })}
        </motion.div>

        {/* LISTE PAR MOIS */}
        <AnimatePresence mode="wait">
          <motion.div key={activeMonth ?? "tous"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            {visibleMonths.map((monthNum, idx) => {
              const monthMembers = byMonth[monthNum];
              if (monthMembers.length === 0) return null;
              const isCurrentMonth = monthNum === currentMonth;
              const mTheme = monthThemes[monthNum];

              return (
                <motion.section key={monthNum} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} style={{ marginBottom: "48px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                    <div style={{ width: "5px", height: "28px", background: mTheme.accent, borderRadius: "3px", flexShrink: 0 }} />
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: isCurrentMonth ? mTheme.accent : (isDark ? "rgba(255,255,255,0.4)" : "#aaa"), textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic" }}>{monthNames[monthNum - 1]}</h2>
                    {isCurrentMonth && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", background: mTheme.accent, padding: "3px 10px", borderRadius: "100px" }}>CE MOIS-CI</span>}
                    <div style={{ flex: 1, height: "1px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", color: isDark ? "rgba(255,255,255,0.25)" : "#bbb", fontWeight: 600 }}>{monthMembers.length} membre{monthMembers.length > 1 ? "s" : ""}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderRadius: "14px", overflow: "hidden", boxShadow: isDark ? `0 4px 24px rgba(0,0,0,0.3)` : "0 2px 16px rgba(0,0,0,0.06)" }}>
                    {monthMembers.map((m, i) => {
                      const accent = rankAccents[m.rank] ?? "#111";
                      const isTodayRow = m.daysUntil === 0;
                      const isSoon = m.daysUntil <= 7 && m.daysUntil > 0;
                      const rowBg = isTodayRow ? (isDark ? "#1a1a1a" : "#fff5f5") : isDark ? "rgba(255,255,255,0.04)" : "#fff";

                      return (
                        <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }} onClick={() => setSelectedMember(m)} onMouseEnter={(e) => { e.currentTarget.style.background = isTodayRow ? (isDark ? "#222" : "#ffebeb") : isDark ? "rgba(255,255,255,0.08)" : "#f5f3ee"; }} onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }} style={{ background: rowBg, display: "flex", alignItems: "stretch", cursor: "pointer", overflow: "hidden", minHeight: "80px", transition: "background 0.2s" }}>
                          <div style={{ width: "4px", flexShrink: 0, background: accent, opacity: isTodayRow ? 1 : 0.6 }} />
                          <div style={{ width: "80px", height: "80px", flexShrink: 0, overflow: "hidden", background: isDark ? "rgba(255,255,255,0.04)" : "#f0f0ee", position: "relative" }}>
                            <AnimatePresence mode="wait">
                              <motion.img key={viewMode} src={viewMode === "anime" ? m.animeChar : m.photo} alt="" initial={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }} transition={{ duration: 0.35 }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </AnimatePresence>
                          </div>
                          <div style={{ flex: 1, padding: isMobile ? "10px 15px" : "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "28px" : "36px", fontWeight: 900, color: isTodayRow ? mTheme.accent : accent, lineHeight: 1, minWidth: isMobile ? "35px" : "52px", fontStyle: "italic" }}>{String(m.day).padStart(2, "0")}</span>
                              <div>
                                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 800, color: isTodayRow ? (isDark ? "#fff" : "#f03e3e") : (isDark ? "rgba(255,255,255,0.9)" : "#111"), textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1 }}>{m.name} {isTodayRow && <Gift size={14} style={{ display: "inline", marginLeft: "4px" }}/>}</div>
                                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 600, color: isTodayRow ? "rgba(240,62,62,0.6)" : (isDark ? "rgba(255,255,255,0.3)" : "#bbb"), letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "3px" }}>{m.rank}</div>
                              </div>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {isTodayRow ? (
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 800, color: isDark ? mTheme.accent : "#f03e3e", letterSpacing: "0.1em", textTransform: "uppercase" }}>{isMobile ? "Auj." : "AUJOURD'HUI"}</span>
                              ) : isSoon ? (
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 800, color: mTheme.accent, background: `${mTheme.accent}18`, padding: "5px 14px", borderRadius: "100px", border: `1.5px solid ${mTheme.accent}40`, letterSpacing: "0.06em" }}>J-{m.daysUntil}</span>
                              ) : (
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.2)" : "#ccc", letterSpacing: "0.04em" }}>J-{m.daysUntil}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <footer style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, padding: "32px 0", marginTop: "20px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: isDark ? "rgba(255,255,255,0.2)" : "#bbb", letterSpacing: "0.25em", textTransform: "uppercase" }}>Guilde Otaku Depuis 2020</p>
        </footer>
      </div>

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} viewMode={viewMode} isMobile={isMobile} />
    </motion.main>
  );
}