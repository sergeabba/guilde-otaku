"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { members, Member, Rank, RANK_FILTER_ORDER } from "../../data/members";
import { Shuffle, Shield, Trophy, Flame } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { useIsMobile } from "../hooks/useIsMobile";
import type { ViewMode } from "../types";

const fontHud = "'Bebas Neue', 'Impact', sans-serif";
const fontMono = "ui-monospace, 'Cascadia Code', monospace";

// Liquid Glass Palette Premium
const P1 = { main: "#c9a84c", glow: "rgba(201,168,76,0.6)", dark: "#1a160c", border: "rgba(201,168,76,0.4)", light: "#e2c984" };
const P2 = { main: "#38bdf8", glow: "rgba(56,189,248,0.6)", dark: "#061825", border: "rgba(56,189,248,0.4)", light: "#7dd3fc" };

function pickSrc(m: Member, mode: ViewMode) {
  return mode === "anime" ? m.animeChar : m.photo;
}

// ──────────────────────────────────────────────────────────
// HUD: BARRES DE VIE ET LOGO VS
// ──────────────────────────────────────────────────────────
function HudBar({ p1Active, p2Active, both, isMobile }: { p1Active: boolean; p2Active: boolean; both: boolean; isMobile: boolean }) {
  return (
    <div style={{ position: "absolute", top: isMobile ? 10 : 20, left: isMobile ? 10 : 20, right: isMobile ? 10 : 20, zIndex: 40, display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px" }}>
      
      {/* Barre P1 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "100%", maxWidth: "500px", height: isMobile ? "12px" : "20px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: `1px solid ${P1.border}`, borderRadius: "100px", position: "relative", overflow: "hidden", boxShadow: `0 0 20px ${p1Active ? P1.glow : 'transparent'}` }}>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: p1Active ? 1 : 0 }} transition={{ type: "spring", stiffness: 100 }} style={{ position: "absolute", inset: 0, transformOrigin: "right", background: `linear-gradient(to right, transparent, ${P1.main})`, borderRadius: "100px" }} />
        </div>
      </div>

      {/* Centre: VS dynamique */}
      <div style={{ position: "relative", width: isMobile ? "60px" : "100px", display: "flex", justifyContent: "center" }}>
        <motion.div 
          animate={both ? { scale: [1, 1.1, 1] } : { scale: 1 }} 
          transition={{ duration: 1, repeat: both ? Infinity : 0, ease: "easeInOut" }}
          style={{ fontFamily: fontHud, fontSize: isMobile ? "36px" : "56px", color: "#fff", textShadow: `0 0 20px #fff, 0 0 40px ${both ? P1.main : '#555'}`, lineHeight: 0.8, zIndex: 50 }}
        >
          VS
        </motion.div>
      </div>

      {/* Barre P2 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: "500px", height: isMobile ? "12px" : "20px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: `1px solid ${P2.border}`, borderRadius: "100px", position: "relative", overflow: "hidden", boxShadow: `0 0 20px ${p2Active ? P2.glow : 'transparent'}` }}>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: p2Active ? 1 : 0 }} transition={{ type: "spring", stiffness: 100 }} style={{ position: "absolute", inset: 0, transformOrigin: "left", background: `linear-gradient(to left, transparent, ${P2.main})`, borderRadius: "100px" }} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// PERSONNAGES DANS L'ARÈNE
// ──────────────────────────────────────────────────────────
function ArenaFighter({ member, side, viewMode, onClear, isMobile }: { member: Member; side: "left" | "right"; viewMode: ViewMode; onClear: () => void; isMobile: boolean }) {
  const L = side === "left";
  const C = L ? P1 : P2;
  const imgSrc = pickSrc(member, viewMode);
  const stats = member.stats;
  const special = member.special;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} 
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      style={{ 
        flex: 1, position: "relative", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Fond Liquid Glass / Mesh Gradient */}
      <div style={{ position: "absolute", inset: "-20%", zIndex: 0, opacity: 0.5, background: `radial-gradient(circle at ${L ? '0% 50%' : '100% 50%'}, ${C.main}22, transparent 60%)` }} />
      <div style={{ position: "absolute", inset: "-10%", zIndex: 0, opacity: 0.4, filter: "blur(30px) saturate(1.5)" }}>
        <Image src={imgSrc} alt="bg" fill style={{ objectFit: "cover" }} />
      </div>

      {/* Image du personnage */}
      <div style={{ position: "absolute", top: isMobile ? "5%" : "15%", bottom: "0%", left: "0%", right: "0%", zIndex: 10, cursor: "pointer" }} onClick={onClear}>
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }} style={{ width: "100%", height: "100%", position: "relative" }}>
          <Image 
            src={imgSrc} 
            alt={member.name} 
            fill 
            priority 
            style={{ objectFit: "contain", objectPosition: "center bottom", filter: `drop-shadow(0 0 40px ${C.glow})` }} 
          />
        </motion.div>
      </div>

      {/* Typographie Géante Arrière-plan */}
      <div style={{ position: "absolute", top: isMobile ? "20%" : "15%", [L ? "left" : "right"]: isMobile ? "5%" : "-5%", zIndex: 5, opacity: 0.15, textShadow: `0 0 20px ${C.main}` }}>
        <span style={{ fontFamily: fontHud, fontSize: isMobile ? "80px" : "180px", color: "transparent", WebkitTextStroke: `1px rgba(255,255,255,0.8)`, whiteSpace: "nowrap", display: "block" }}>
          {member.name.split(" ")[0]}
        </span>
      </div>

      {/* Dégradé sombre pour l'incrustation */}
      <div style={{ position: "absolute", bottom: 0, left: "-5%", right: "-5%", height: isMobile ? "80%" : "60%", background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)", zIndex: 15, pointerEvents: "none" }} />

      {/* ── BLOC D'INFORMATIONS ── */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}
        style={{ 
          position: "absolute", bottom: isMobile ? "20px" : "30px", [L ? "left" : "right"]: isMobile ? "15px" : "40px", 
          zIndex: 20, display: "flex", flexDirection: "column", gap: isMobile ? "6px" : "10px", 
          alignItems: L ? "flex-start" : "flex-end", width: isMobile ? "calc(100% - 30px)" : "auto"
        }}
      >
        
        {/* Ligne 1 : Nom */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexDirection: L ? "row" : "row-reverse" }}>
          <span style={{ fontFamily: fontHud, fontSize: isMobile ? "32px" : "48px", color: "#fff", textTransform: "uppercase", letterSpacing: "1px", textShadow: `0 0 20px ${C.glow}`, lineHeight: 1 }}>{member.name}</span>
        </div>

        {/* Ligne 2 : Grade et Badge (Glassmorphism) */}
        <div style={{ display: "flex", gap: "8px", flexDirection: L ? "row" : "row-reverse", flexWrap: "wrap", justifyContent: L ? "flex-start" : "flex-end" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "100px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 20px rgba(0,0,0,0.5)` }}>
            <Shield size={isMobile ? 12 : 14} color={C.light} />
            <span style={{ fontFamily: fontHud, fontSize: "14px", color: "#fff", letterSpacing: "1px" }}>{member.rank}</span>
          </div>
          {member.badge && (
            <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: `1px solid ${C.border}`, borderRadius: "100px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Trophy size={isMobile ? 12 : 14} color={C.light} />
              <span style={{ fontFamily: fontHud, fontSize: "14px", color: C.light, letterSpacing: "1px" }}>{member.badge.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Ligne 3 : Stats de combat rapides */}
        {stats && (
          <div style={{ display: "flex", gap: "6px", flexDirection: L ? "row" : "row-reverse", flexWrap: "wrap", justifyContent: L ? "flex-start" : "flex-end" }}>
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(5px)", border: `1px solid rgba(255,255,255,0.05)`, borderRadius: "8px", padding: "4px 10px", textAlign: "center", minWidth: isMobile ? "40px" : "50px" }}>
                <span style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "9px", fontFamily: fontMono, textTransform: "uppercase", marginBottom: "2px" }}>{key}</span>
                <span style={{ display: "block", fontFamily: fontHud, fontSize: "16px", color: "#fff" }}>{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ligne 4: Special Move */}
        {special && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: isMobile ? "2px" : "8px", background: "rgba(255,255,255,0.03)", padding: isMobile ? "6px 10px" : "10px 16px", borderRadius: "12px", borderLeft: L ? `2px solid ${C.main}` : "none", borderRight: !L ? `2px solid ${C.main}` : "none", backdropFilter: "blur(10px)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "4px" : "8px", justifyContent: L ? "flex-start" : "flex-end" }}>
               {L && <Flame size={isMobile ? 12 : 14} color={C.light} />}
               <span style={{ fontFamily: fontHud, fontSize: isMobile ? "14px" : "18px", color: C.light, letterSpacing: "1px", lineHeight: 1 }}>{special.name}</span>
               {!L && <Flame size={isMobile ? 12 : 14} color={C.light} />}
             </div>
             <span style={{ fontFamily: fontMono, fontSize: isMobile ? "9px" : "11px", color: "rgba(255,255,255,0.6)", textAlign: L ? "left" : "right", lineHeight: 1.2 }}>{special.effect}</span>
          </div>
        )}

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
  
  const isMobile = useIsMobile();
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

  // Layout Mobile Dynamics
  const showRoster = !isMobile || !both;
  const showArena = !isMobile || both || (p1 || p2);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#050508", overflow: "hidden", position: "relative" }}>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* ── HEADER ── */}
      <GuildeHeader
        activePage="fighters"
        bgColor="rgba(5,5,8,0.8)"
        textColor="#fff"
        accentColor="#c9a84c"
        rightSlot={
          <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.5)", padding: "4px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)" }}>
            {(["real", "anime"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: "4px 12px", border: "none", borderRadius: "100px", cursor: "pointer", fontFamily: fontHud, fontSize: "14px", background: viewMode === m ? "#c9a84c" : "transparent", color: viewMode === m ? "#000" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        
        {/* ── ARENA (Hauteur adaptative) ── */}
        <AnimatePresence>
          {showArena && (
            <motion.section 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: isMobile && both ? "100%" : isMobile ? "45%" : "60%", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{ flex: isMobile && both ? 1 : `0 0 ${isMobile ? "45%" : "60%"}`, position: "relative", display: "flex", flexDirection: isMobile ? "column" : "row", borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", background: "#000" }}
            >
              
              {/* Flash blanc quand les 2 sont sélectionnés */}
              <AnimatePresence>
                {both && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 90, pointerEvents: "none" }} />}
              </AnimatePresence>

              {(p1 || p2) && <HudBar p1Active={!!p1} p2Active={!!p2} both={both} isMobile={isMobile} />}
              
              <AnimatePresence mode="wait">
                {p1 ? <ArenaFighter key={`p1-${p1.id}`} member={p1} side="left" viewMode={viewMode} onClear={() => setP1(null)} isMobile={isMobile} /> : <div style={{ flex: 1 }} />}
              </AnimatePresence>

              {/* Ligne de séparation */}
              {isMobile ? (
                <div style={{ position: "absolute", top: "50%", left: "-10%", right: "-10%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", transform: "translateY(-50%) rotate(-5deg)", zIndex: 30, boxShadow: "0 0 20px rgba(0,0,0,1)" }} />
              ) : (
                <div style={{ position: "absolute", left: "50%", top: "-10%", bottom: "-10%", width: "2px", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)", transform: "translateX(-50%) rotate(10deg)", zIndex: 30, boxShadow: "0 0 20px rgba(0,0,0,1)" }} />
              )}

              <AnimatePresence mode="wait">
                {p2 ? <ArenaFighter key={`p2-${p2.id}`} member={p2} side="right" viewMode={viewMode} onClear={() => setP2(null)} isMobile={isMobile} /> : <div style={{ flex: 1 }} />}
              </AnimatePresence>

              {/* Sur mobile, si les 2 persos sont choisis, bouton pour revenir à la sélection */}
              {isMobile && both && (
                 <button 
                  onClick={() => { setP1(null); setP2(null); }}
                  style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "12px 24px", borderRadius: "100px", fontFamily: fontHud, fontSize: "18px", letterSpacing: "2px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                 >
                   REFAIRE UN MATCH
                 </button>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── ROSTER (Grille de Sélection) ── */}
        <AnimatePresence>
          {showRoster && (
            <motion.section 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50, position: "absolute", zIndex: -1 }} transition={{ duration: 0.3 }}
              style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "radial-gradient(circle at center top, #0a0a0f 0%, #050508 100%)", position: "relative", zIndex: 10 }}
            >
              
              {/* Filtres (Glassmorphism) */}
              <div className="hide-scroll" style={{ display: "flex", gap: "10px", padding: "15px 20px", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map((r) => (
                  <button key={r} onClick={() => setFilterRank(r)} style={{ flexShrink: 0, fontFamily: fontHud, fontSize: "16px", letterSpacing: "1px", padding: "8px 24px", cursor: "pointer", background: filterRank === r ? "#c9a84c" : "rgba(255,255,255,0.02)", color: filterRank === r ? "#000" : "rgba(255,255,255,0.5)", border: `1px solid ${filterRank === r ? '#c9a84c' : 'rgba(255,255,255,0.05)'}`, borderRadius: "100px", transition: "all 0.2s" }}>
                    {r === "Tous" ? "TOUS" : r.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Grille */}
              <div className="hide-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "12px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
                  
                  <button onClick={random} style={{ height: "120px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", color: "rgba(255,255,255,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                     <Shuffle size={28} />
                  </button>

                  <AnimatePresence>
                    {filtered.map((m) => {
                      const isP1 = p1?.id === m.id;
                      const isP2 = p2?.id === m.id;
                      const sel = isP1 || isP2;
                      const dimmed = both && !sel;

                      return (
                        <motion.button 
                          layout
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          key={m.id} 
                          onClick={() => select(m)}
                          whileHover={!dimmed ? { scale: 1.05, zIndex: 10, borderColor: "rgba(255,255,255,0.5)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" } : {}}
                          whileTap={{ scale: 0.95 }}
                          style={{ 
                            position: "relative", height: "120px", padding: 0, cursor: dimmed ? "default" : "pointer", 
                            border: isP1 ? `2px solid ${P1.main}` : isP2 ? `2px solid ${P2.main}` : "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "16px",
                            opacity: dimmed ? 0.3 : 1, overflow: "hidden", background: "rgba(255,255,255,0.02)",
                            boxShadow: isP1 ? `0 0 20px ${P1.glow}` : isP2 ? `0 0 20px ${P2.glow}` : "none",
                            transition: "border-color 0.2s, opacity 0.3s"
                          }}
                        >
                          <div style={{ position: "absolute", inset: 0 }}>
                            <Image src={pickSrc(m, viewMode)} alt={m.name} fill sizes="100px" style={{ objectFit: "cover", objectPosition: "center", filter: dimmed ? "grayscale(100%) opacity(50%)" : "none" }} />
                          </div>
                          {/* Dégradé bas */}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 50%)", pointerEvents: "none" }} />
                          <span style={{ position: "absolute", bottom: "8px", left: "0", right: "0", textAlign: "center", fontFamily: fontHud, fontSize: "14px", color: "#fff", letterSpacing: "1px" }}>
                            {m.name.split(" ")[0]}
                          </span>

                          {sel && (
                            <div style={{ position: "absolute", top: "-2px", left: "-2px", background: isP1 ? P1.main : P2.main, color: "#fff", fontFamily: fontHud, fontSize: "13px", padding: "4px 10px", borderBottomRightRadius: "12px", borderTopLeftRadius: "16px" }}>
                              {isP1 ? "1P" : "2P"}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}