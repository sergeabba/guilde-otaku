"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { members, Member, Rank, RANK_FILTER_ORDER } from "../../data/members";
import { Shuffle, ChevronLeft, Zap, Shield, Trophy, Flame } from "lucide-react";

type ViewMode = "real" | "anime";

const fontHud = "'Bebas Neue', 'Impact', sans-serif";
const fontMono = "ui-monospace, 'Cascadia Code', monospace";

// Couleurs hyper saturées
const P1 = { main: "#ff003c", glow: "rgba(255,0,60,0.8)", dark: "#590015", light: "#ff6685" };
const P2 = { main: "#00e5ff", glow: "rgba(0,229,255,0.8)", dark: "#004d56", light: "#88f2ff" };

function pickSrc(m: Member, mode: ViewMode) {
  return mode === "anime" ? m.animeChar : m.photo;
}

// ──────────────────────────────────────────────────────────
// HUD: BARRES DE VIE ET LOGO VS
// ──────────────────────────────────────────────────────────
function HudBar({ p1Active, p2Active, both }: { p1Active: boolean; p2Active: boolean; both: boolean }) {
  return (
    <div style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 40, display: "flex", alignItems: "center", gap: "20px" }}>
      
      {/* Barre P1 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "100%", maxWidth: "600px", height: "30px", background: "#111", transform: "skewX(-20deg)", border: `3px solid ${P1.dark}`, position: "relative", overflow: "hidden", boxShadow: `0 0 20px ${p1Active ? P1.glow : 'transparent'}` }}>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: p1Active ? 1 : 0 }} transition={{ type: "spring", stiffness: 100 }} style={{ position: "absolute", inset: 0, transformOrigin: "right", background: `linear-gradient(to right, #ff9900, ${P1.main})` }} />
        </div>
      </div>

      {/* Centre: VS dynamique */}
      <div style={{ position: "relative", width: "100px", display: "flex", justifyContent: "center" }}>
        <motion.div 
          animate={both ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : { scale: 1 }} 
          transition={{ duration: 0.5, repeat: both ? Infinity : 0, repeatDelay: 2 }}
          style={{ fontFamily: fontHud, fontSize: "65px", color: "#fff", textShadow: `0 0 20px #fff, 0 0 40px ${both ? P1.main : '#555'}`, lineHeight: 0.8, zIndex: 50, transform: "skewX(-10deg)" }}
        >
          VS
        </motion.div>
        {both && (
          <motion.div 
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 45, color: "#ffee00" }}
          >
            <Zap size={80} fill="#ffee00" opacity={0.3} />
          </motion.div>
        )}
      </div>

      {/* Barre P2 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: "600px", height: "30px", background: "#111", transform: "skewX(-20deg)", border: `3px solid ${P2.dark}`, position: "relative", overflow: "hidden", boxShadow: `0 0 20px ${p2Active ? P2.glow : 'transparent'}` }}>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: p2Active ? 1 : 0 }} transition={{ type: "spring", stiffness: 100 }} style={{ position: "absolute", inset: 0, transformOrigin: "left", background: `linear-gradient(to left, #0055ff, ${P2.main})` }} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// PERSONNAGES DANS L'ARÈNE
// ──────────────────────────────────────────────────────────
function ArenaFighter({ member, side, viewMode, onClear }: { member: Member; side: "left" | "right"; viewMode: ViewMode; onClear: () => void }) {
  const L = side === "left";
  const C = L ? P1 : P2;
  const imgSrc = pickSrc(member, viewMode);
  
  // Utilisation directe des nouvelles données de ton members.ts
  const stats = member.stats;
  const special = member.special;

  return (
    <motion.div
      initial={{ opacity: 0, x: L ? -100 : 100, skewX: L ? 10 : -10 }} 
      animate={{ opacity: 1, x: 0, skewX: 0 }} 
      exit={{ opacity: 0, x: L ? -50 : 50, filter: "blur(10px)" }} 
      transition={{ type: "spring", damping: 18, stiffness: 120 }}
      style={{ flex: 1, position: "relative", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* Fond flouté */}
      <div style={{ position: "absolute", inset: "-20%", zIndex: 0, opacity: 0.4, filter: "blur(30px) saturate(1.5)" }}>
        <Image src={imgSrc} alt="bg" fill style={{ objectFit: "cover" }} />
      </div>

      {/* Rayures lumineuses directionnelles */}
      <div style={{ position: "absolute", inset: "-10%", background: `repeating-linear-gradient(${L ? '45deg' : '-45deg'}, transparent, transparent 10px, ${C.main} 10px, ${C.main} 12px)`, opacity: 0.05, zIndex: 1 }} />
      <div style={{ position: "absolute", inset: "-10%", background: C.main, transform: `skewX(${L ? '-15deg' : '15deg'})`, opacity: 0.2, zIndex: 1 }} />

      {/* Image du personnage */}
      <div style={{ position: "absolute", top: "15%", bottom: "5%", left: "5%", right: "5%", zIndex: 10, cursor: "pointer" }} onClick={onClear}>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }} style={{ width: "100%", height: "100%", position: "relative" }}>
          <Image 
            src={imgSrc} 
            alt={member.name} 
            fill 
            priority 
            style={{ objectFit: "contain", objectPosition: "center bottom", filter: `contrast(1.1) saturate(1.2) drop-shadow(0 0 30px ${C.glow})` }} 
          />
        </motion.div>
      </div>

      {/* Typographie Géante Arrière-plan */}
      <div style={{ position: "absolute", top: "10%", [L ? "left" : "right"]: "-10%", zIndex: 5, opacity: 0.3 }}>
        <span style={{ fontFamily: fontHud, fontSize: "180px", color: "transparent", WebkitTextStroke: `2px ${C.main}`, whiteSpace: "nowrap", transform: "skewX(-15deg)", display: "block" }}>
          {member.name.split(" ")[0]}
        </span>
      </div>

      {/* Dégradé sombre pour l'incrustation */}
      <div style={{ position: "absolute", bottom: 0, left: "-10%", right: "-10%", height: "50%", background: "linear-gradient(to top, #000 15%, transparent)", zIndex: 15, pointerEvents: "none" }} />

      {/* ── BLOC D'INFORMATIONS (Nom + Stats + Coup Spécial) ── */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, type: "spring" }}
        style={{ position: "absolute", bottom: "30px", [L ? "left" : "right"]: "40px", zIndex: 20, display: "flex", flexDirection: "column", gap: "8px", alignItems: L ? "flex-start" : "flex-end" }}
      >
        
        {/* Ligne 1 : Grade et Badge */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ background: "rgba(0,0,0,0.8)", border: `1px solid ${C.light}`, padding: "2px 10px", transform: "skewX(-15deg)", display: "flex", alignItems: "center", gap: "6px", boxShadow: `0 0 10px ${C.glow}` }}>
            <Shield size={12} color={C.light} style={{ transform: "skewX(15deg)" }} />
            <span style={{ fontFamily: fontHud, fontSize: "14px", color: "#fff", transform: "skewX(15deg)", letterSpacing: "1px" }}>{member.rank}</span>
          </div>
          {member.badge && (
            <div style={{ background: "rgba(0,0,0,0.8)", border: `1px solid #ffcc00`, padding: "2px 10px", transform: "skewX(-15deg)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Trophy size={12} color="#ffcc00" style={{ transform: "skewX(15deg)" }} />
              <span style={{ fontFamily: fontHud, fontSize: "14px", color: "#ffcc00", transform: "skewX(15deg)", letterSpacing: "1px" }}>{member.badge.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Ligne 2 : Stats de combat */}
        {stats && (
          <div style={{ display: "flex", gap: "4px" }}>
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} style={{ background: "linear-gradient(180deg, rgba(30,30,30,0.9), rgba(0,0,0,0.9))", borderBottom: `2px solid ${C.main}`, padding: "2px 10px", transform: "skewX(-15deg)" }}>
                <span style={{ display: "block", transform: "skewX(15deg)", fontFamily: fontHud, fontSize: "16px", color: "#fff" }}>
                  <span style={{ color: C.light, fontSize: "10px", marginRight: "6px" }}>{key.toUpperCase()}</span>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Ligne 3 : Coup Spécial (Nom + Effet) */}
        {special && (
          <motion.div 
            initial={{ opacity: 0, x: L ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ 
              background: L ? "linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2))" : "linear-gradient(-90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2))", 
              borderLeft: L ? `3px solid ${C.light}` : "none", 
              borderRight: !L ? `3px solid ${C.light}` : "none", 
              padding: "6px 16px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "4px", 
              backdropFilter: "blur(4px)",
              marginTop: "4px",
              maxWidth: "340px",
              textAlign: L ? "left" : "right"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: L ? "flex-start" : "flex-end" }}>
              {L && <Flame size={14} color={C.light} />}
              <span style={{ fontFamily: fontHud, fontSize: "20px", color: C.light, textTransform: "uppercase", letterSpacing: "1px", textShadow: "1px 1px 0 #000" }}>
                {special.name}
              </span>
              {!L && <Flame size={14} color={C.light} />}
            </div>
            <span style={{ fontFamily: fontMono, fontSize: "10px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.4, textShadow: "1px 1px 2px #000" }}>
              {special.effect}
            </span>
          </motion.div>
        )}

        {/* Bannière du Nom principal */}
        <div style={{ background: "#000", transform: "skewX(-15deg)", borderLeft: L ? `8px solid ${C.main}` : "none", borderRight: !L ? `8px solid ${C.main}` : "none", padding: "4px 30px", boxShadow: `0 10px 20px ${C.glow}`, marginTop: "4px" }}>
          <span style={{ display: "block", transform: "skewX(15deg)", fontFamily: fontHud, fontSize: "48px", color: "#fff", textTransform: "uppercase", letterSpacing: "2px", textShadow: "2px 2px 0px #000", lineHeight: 1 }}>
            {member.name}
          </span>
        </div>

      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────────────────────
export default function FightersPage() {
  const [p1, setP1] = useState<Member | null>(null);
  const [p2, setP2] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [filterRank, setFilterRank] = useState<Rank | "Tous">("Tous");
  
  const both = !!(p1 && p2);

  const select = useCallback((m: Member) => {
    if (p1?.id === m.id) { setP1(null); return; }
    if (p2?.id === m.id) { setP2(null); return; }
    if (!p1) { setP1(m); return; }
    if (!p2) { setP2(m); return; }
  }, [p1, p2]);

  const random = () => {
    const n = members.length;
    if (n < 2) return;
    let i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * (n - 1));
    if (j >= i) j++;
    setP1(members[i]);
    setP2(members[j]);
  };

  const filtered = useMemo(() => members.filter((m) => filterRank === "Tous" || m.rank === filterRank), [filterRank]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#050505", overflow: "hidden", position: "relative" }}>
      
      <style>{`
        /* Lignes de vitesse */
        @keyframes slideBackground {
          from { background-position: 0 0; }
          to { background-position: -100px 100px; }
        }
        .speed-bg {
          background-image: repeating-linear-gradient(45deg, #111 0px, #111 2px, transparent 2px, transparent 12px);
          background-size: 100px 100px;
          animation: slideBackground 2s linear infinite;
        }
        
        /* Scanlines pour l'effet CRT (Écran d'Arcade) */
        .scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 999;
        }

        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Filtre CRT global */}
      <div className="scanlines" />

      {/* ── HEADER ── */}
      <header style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#000", borderBottom: "1px solid #333", zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: fontHud, fontSize: "16px", color: "#888", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
          <ChevronLeft size={18} /> GUILDE
        </Link>
        <h1 style={{ fontFamily: fontHud, fontSize: "28px", color: "#fff", letterSpacing: "4px", margin: 0, textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>MEMBER SELECT</h1>
        <div style={{ display: "flex", gap: "4px", background: "#111", padding: "4px", borderRadius: "4px" }}>
          {(["real", "anime"] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: "4px 12px", border: "none", cursor: "pointer", fontFamily: fontHud, fontSize: "14px", background: viewMode === m ? "#fff" : "transparent", color: viewMode === m ? "#000" : "#666", transition: "all 0.2s" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* ── ARENA (Moitié Supérieure) ── */}
      <section className="speed-bg" style={{ flex: "0 0 55vh", position: "relative", display: "flex", borderBottom: "4px solid #fff", overflow: "hidden", backgroundBlendMode: "overlay", backgroundColor: "#0a0a0a" }}>
        
        {/* Flash blanc quand les 2 sont sélectionnés */}
        <AnimatePresence>
          {both && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 90, pointerEvents: "none" }} />}
        </AnimatePresence>

        <HudBar p1Active={!!p1} p2Active={!!p2} both={both} />
        
        <AnimatePresence mode="wait">
          {p1 ? <ArenaFighter key={`p1-${p1.id}`} member={p1} side="left" viewMode={viewMode} onClear={() => setP1(null)} /> : <div style={{ flex: 1 }} />}
        </AnimatePresence>

        {/* Ligne de séparation oblique au centre */}
        <div style={{ position: "absolute", left: "50%", top: "-10%", bottom: "-10%", width: "10px", background: "#000", transform: "translateX(-50%) rotate(10deg)", zIndex: 30, borderLeft: "2px solid #333", borderRight: "2px solid #333", boxShadow: "0 0 20px rgba(0,0,0,0.8)" }} />

        <AnimatePresence mode="wait">
          {p2 ? <ArenaFighter key={`p2-${p2.id}`} member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} /> : <div style={{ flex: 1 }} />}
        </AnimatePresence>
      </section>

      {/* ── ROSTER (Moitié Inférieure) ── */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000" }}>
        
        {/* Filtres */}
        <div className="hide-scroll" style={{ display: "flex", gap: "8px", padding: "15px", overflowX: "auto", borderBottom: "1px solid #222" }}>
          {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map((r) => (
            <button key={r} onClick={() => setFilterRank(r)} style={{ flexShrink: 0, fontFamily: fontHud, fontSize: "16px", letterSpacing: "1px", padding: "6px 20px", cursor: "pointer", background: filterRank === r ? "#ffee00" : "#111", color: filterRank === r ? "#000" : "#888", border: "none", transform: "skewX(-10deg)", transition: "all 0.2s" }}>
              <span style={{ display: "block", transform: "skewX(10deg)" }}>{r === "Tous" ? "TOUS" : r.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Grille de sélection */}
        <div className="hide-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", maxWidth: "1200px", margin: "0 auto" }}>
            
            <button onClick={random} style={{ height: "100px", background: "#111", border: "2px solid #444", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transform: "skewX(-5deg)", transition: "all 0.2s" }}>
               <Shuffle size={24} style={{ transform: "skewX(5deg)" }} />
            </button>

            {filtered.map((m) => {
              const isP1 = p1?.id === m.id;
              const isP2 = p2?.id === m.id;
              const sel = isP1 || isP2;
              const dimmed = both && !sel;

              return (
                <motion.button 
                  key={m.id} 
                  onClick={() => select(m)}
                  whileHover={!dimmed ? { scale: 1.1, zIndex: 10, borderColor: "#fff" } : {}}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    position: "relative", height: "100px", padding: 0, cursor: dimmed ? "default" : "pointer", 
                    border: isP1 ? `4px solid ${P1.main}` : isP2 ? `4px solid ${P2.main}` : "2px solid #222",
                    opacity: dimmed ? 0.3 : 1, overflow: "hidden", background: "#000",
                    boxShadow: isP1 ? `0 0 20px ${P1.glow}` : isP2 ? `0 0 20px ${P2.glow}` : "none",
                    transform: "skewX(-5deg)",
                    transition: "border-color 0.2s"
                  }}
                >
                  <div style={{ position: "absolute", inset: -10, transform: "skewX(5deg)" }}>
                    <Image src={pickSrc(m, viewMode)} alt={m.name} fill sizes="100px" style={{ objectFit: "cover", objectPosition: "center", filter: dimmed ? "grayscale(80%)" : "none" }} />
                  </div>
                  {sel && (
                    <div style={{ position: "absolute", top: 0, left: 0, background: isP1 ? P1.main : P2.main, color: "#fff", fontFamily: fontHud, fontSize: "14px", padding: "2px 8px" }}>
                      {isP1 ? "1P" : "2P"}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}