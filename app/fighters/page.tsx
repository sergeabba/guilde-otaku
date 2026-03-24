"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members, Member } from "../../data/members";
import Link from "next/link";
import { Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight, Zap, Trophy } from "lucide-react";

type ViewMode = "real" | "anime";

const ostList = ["/fighter.mp3", "/fighter2.mp3", "/fighter3.mp3"];

const arenas = [
  { id: 1, name: "Cité des Flammes", subtitle: "8ème Brigade", bg: "/arena_fire.jpg", color: "#f97316" },
  { id: 2, name: "Stade Galactique", subtitle: "Inazuma Eleven", bg: "/arena_soccer.jpg", color: "#3b82f6" },
  { id: 3, name: "Paysage Fracturé", subtitle: "Tales of Xillia 2", bg: "/arena_xillia.jpg", color: "#a855f7" },
  { id: 4, name: "Dojo Vagabond", subtitle: "Kenshin", bg: "/arena_dojo.jpg", color: "#ef4444" },
];

export default function FightersPage() {
  const [p1, setP1] = useState<Member | null>(null);
  const [p2, setP2] = useState<Member | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("anime"); 
  const [arenaIdx, setArenaIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0); 
  const [isMobile, setIsMobile] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentArena = arenas[arenaIdx];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.4;
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); 
    else { audioRef.current.volume = 0.4; audioRef.current.play().catch(e => console.log(e)); }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => setTrackIdx((prev) => (prev + 1) % ostList.length);

  const handleSelect = (member: Member) => {
    if (p1?.id === member.id) setP1(null); 
    else if (p2?.id === member.id) setP2(null); 
    else if (!p1) setP1(member); 
    else if (!p2) setP2(member);
  };

  const nextArena = () => setArenaIdx((prev) => (prev + 1) % arenas.length);
  const prevArena = () => setArenaIdx((prev) => (prev - 1 + arenas.length) % arenas.length);

  const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", width: "100%" }}>
      <span style={{ flexShrink: 0, width: isMobile ? "30px" : "60px", fontSize: isMobile ? "9px" : "12px", fontWeight: 900, textTransform: "uppercase", color: "rgba(255,255,255,0.8)", textShadow: "0 2px 4px #000" }}>{label}</span>
      <div style={{ flex: 1, height: isMobile ? "4px" : "6px", background: "rgba(0,0,0,0.8)", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ height: "100%", background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
      <span style={{ flexShrink: 0, fontSize: isMobile ? "10px" : "16px", fontWeight: 900, width: isMobile ? "18px" : "28px", textAlign: "right", color: "#fff", textShadow: "0 2px 4px #000" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#050505", overflow: "hidden", fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative" }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.4); border-radius: 10px; border: 1px solid rgba(0,0,0,0.5); }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.8); }
        
        .scanlines {
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
          background-size: 100% 4px;
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
        }
      `}</style>

      {/* BACKGROUND PREMIUM */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentArena.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentArena.bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.35) contrast(1.1)" }}
          />
        </AnimatePresence>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)", zIndex: 1 }} />
        <div className="scanlines" />
      </div>

      {/* HEADER NAVBAR */}
      <header style={{ position: "relative", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "10px 15px" : "15px 30px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)", flexShrink: 0 }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? "14px" : "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>← RETOUR</Link>
        
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "absolute", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", padding: "5px 20px", borderRadius: "30px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={prevArena} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", transition: "transform 0.2s" }}><ChevronLeft size={20} /></button>
            <div style={{ textAlign: "center", minWidth: "150px" }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>{currentArena.subtitle}</p>
              <p style={{ fontSize: "18px", fontWeight: 900, color: currentArena.color, textTransform: "uppercase", margin: 0, textShadow: `0 0 15px ${currentArena.color}` }}>{currentArena.name}</p>
            </div>
            <button onClick={nextArena} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", transition: "transform 0.2s" }}><ChevronRight size={20} /></button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.6)", borderRadius: "6px", padding: "4px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", padding: "6px 14px", borderRadius: "4px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", background: viewMode === mode ? "#f03e3e" : "transparent", color: viewMode === mode ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.3s ease" }}>
                {mode === "real" ? <User size={14} /> : <Sword size={14} />} {!isMobile && mode}
              </button>
            ))}
          </div>
          <button onClick={toggleSound} style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", padding: "8px", cursor: "pointer", color: isPlaying ? "#f03e3e" : "#fff", backdropFilter: "blur(10px)", transition: "all 0.3s ease" }}>
            {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* ARÈNE MOBILE */}
      {isMobile && (
        <div style={{ position: "relative", zIndex: 20, padding: "10px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexShrink: 0 }}>
          <button onClick={prevArena} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", padding: "5px", color: "#fff" }}><ChevronLeft size={16} /></button>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.6)", padding: "4px 15px", borderRadius: "20px", backdropFilter: "blur(5px)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: "14px", fontWeight: 900, color: currentArena.color, textTransform: "uppercase", margin: 0, textShadow: `0 0 10px ${currentArena.color}` }}>{currentArena.name}</p>
          </div>
          <button onClick={nextArena} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", padding: "5px", color: "#fff" }}><ChevronRight size={16} /></button>
        </div>
      )}

      {/* ======================================================= */}
      {/* ==================== LAYOUT PRINCIPAL =================== */}
      {/* ======================================================= */}
      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", position: "relative", zIndex: 10, overflow: "hidden" }}>
        
        {/* ==================== MOBILE TOP (P1 & P2 SIDE BY SIDE) ==================== */}
        {isMobile && (
            <div style={{ height: "280px", display: "flex", position: "relative", zIndex: 10, flexShrink: 0, background: "rgba(0,0,0,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {/* P1 MOBILE */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  <AnimatePresence mode="wait">
                      {p1 ? (
                        <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                            {/* COVER IMAGE */}
                            <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", zIndex: 1 }} alt={p1.name} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 5%, rgba(0,0,0,0.4) 50%, transparent 100%)", zIndex: 2 }} />
                            <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "10px" }}>
                                {p1.badge && (
                                  <div style={{ display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg, #FFDF00, #D4AF37)", padding: "2px 6px", borderRadius: "4px", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "8px", fontWeight: 900, color: "#000" }}>{p1.badge}</span>
                                  </div>
                                )}
                                <p style={{ color: "#f03e3e", fontSize: "10px", fontWeight: 900, fontStyle: "italic", margin: 0, textShadow: "0 2px 4px #000" }}>PLAYER 1</p>
                                <h2 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "2px 0", textShadow: "0 2px 5px #000" }}>{p1.name}</h2>
                                <div style={{ marginTop: "5px", width: "100%" }}>
                                    <StatBar label="For" value={p1.stats.force} color="#f03e3e" />
                                    <StatBar label="Vit" value={p1.stats.vitesse} color="#eab308" />
                                    <StatBar label="Tec" value={p1.stats.technique} color="#3b82f6" />
                                </div>
                                <div style={{ background: "rgba(240,62,62,0.2)", borderLeft: "2px solid #f03e3e", padding: "4px", marginTop: "6px", borderRadius: "0 4px 4px 0" }}>
                                  <p style={{ fontSize: "9px", color: "#f03e3e", fontWeight: 900, textTransform: "uppercase", margin: 0 }}><Zap size={10} style={{ display: "inline", verticalAlign: "middle" }}/> {p1.special.name}</p>
                                </div>
                            </div>
                        </motion.div>
                      ) : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,62,62,0.3)", fontSize: "24px", fontWeight: 900, fontStyle: "italic" }}>P1</div>}
                  </AnimatePresence>
                </div>

                {/* P2 MOBILE */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                    <AnimatePresence mode="wait">
                      {p2 ? (
                        <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                            {/* COVER IMAGE */}
                            <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", zIndex: 1 }} alt={p2.name} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 5%, rgba(0,0,0,0.4) 50%, transparent 100%)", zIndex: 2 }} />
                            <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "10px", alignItems: "flex-end", textAlign: "right" }}>
                                {p2.badge && (
                                  <div style={{ display: "inline-flex", alignSelf: "flex-end", background: "linear-gradient(135deg, #FFDF00, #D4AF37)", padding: "2px 6px", borderRadius: "4px", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "8px", fontWeight: 900, color: "#000" }}>{p2.badge}</span>
                                  </div>
                                )}
                                <p style={{ color: "#3b82f6", fontSize: "10px", fontWeight: 900, fontStyle: "italic", margin: 0, textShadow: "0 2px 4px #000" }}>PLAYER 2</p>
                                <h2 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "2px 0", textShadow: "0 2px 5px #000" }}>{p2.name}</h2>
                                <div style={{ marginTop: "5px", width: "100%" }}>
                                    <StatBar label="For" value={p2.stats.force} color="#f03e3e" />
                                    <StatBar label="Vit" value={p2.stats.vitesse} color="#eab308" />
                                    <StatBar label="Tec" value={p2.stats.technique} color="#3b82f6" />
                                </div>
                                <div style={{ background: "rgba(59,130,246,0.2)", borderRight: "2px solid #3b82f6", padding: "4px", marginTop: "6px", borderRadius: "4px 0 0 4px" }}>
                                  <p style={{ fontSize: "9px", color: "#3b82f6", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>{p2.special.name} <Zap size={10} style={{ display: "inline", verticalAlign: "middle" }}/></p>
                                </div>
                            </div>
                        </motion.div>
                      ) : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(59,130,246,0.3)", fontSize: "24px", fontWeight: 900, fontStyle: "italic" }}>P2</div>}
                  </AnimatePresence>
                </div>

                {/* VS LOGO MOBILE */}
                {p1 && p2 && (
                    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 50, pointerEvents: "none" }}>
                      <motion.div initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6 }} style={{ fontSize: "36px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #fff 30%, #888 100%)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 5px 15px #000)" }}>
                        <span style={{ WebkitTextStroke: "1px #f03e3e" }}>V</span><span style={{ WebkitTextStroke: "1px #3b82f6" }}>.S.</span>
                      </motion.div>
                    </div>
                )}
            </div>
        )}

        {/* ==================== DESKTOP P1 (GAUCHE) ==================== */}
        {!isMobile && (
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              {p1 ? (
                <motion.div key="p1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                  {/* COVER IMAGE pour bien prendre tout l'écran */}
                  <div style={{ position: "absolute", inset: 0 }}>
                    <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "drop-shadow(10px 10px 30px rgba(0,0,0,0.9))" }} alt={p1.name} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,1) 5%, rgba(0,0,0,0.4) 40%, transparent 100%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "40px 50px" }}>
                    {p1.badge && (
                      <div style={{ display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg, #FFDF00, #D4AF37)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                        <Trophy size={14} color="#000" /><span style={{ fontSize: "12px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>{p1.badge}</span>
                      </div>
                    )}
                    <p style={{ color: "#f03e3e", fontSize: "18px", fontWeight: 900, fontStyle: "italic", margin: 0, letterSpacing: "0.15em", textShadow: "0 0 10px rgba(240,62,62,0.8)" }}>PLAYER 1</p>
                    <h2 style={{ fontSize: "60px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 20px #000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p1.name}</h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", textTransform: "uppercase", marginBottom: "20px", letterSpacing: "0.1em", textShadow: "0 2px 4px #000" }}>{p1.rank}</p>
                    
                    <div style={{ maxWidth: "380px", marginBottom: "20px", background: "rgba(0,0,0,0.4)", padding: "15px", borderRadius: "8px", backdropFilter: "blur(5px)" }}>
                      <StatBar label="For" value={p1.stats.force} color="#f03e3e" />
                      <StatBar label="Vit" value={p1.stats.vitesse} color="#eab308" />
                      <StatBar label="Tec" value={p1.stats.technique} color="#3b82f6" />
                    </div>

                    <div style={{ background: "linear-gradient(90deg, rgba(240,62,62,0.2) 0%, transparent 100%)", borderLeft: "4px solid #f03e3e", padding: "15px", borderRadius: "0 12px 12px 0", maxWidth: "450px" }}>
                      <p style={{ fontSize: "16px", color: "#f03e3e", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 0 10px rgba(240,62,62,0.5)" }}><Zap size={18} fill="#f03e3e" /> {p1.special.name}</p>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", margin: "6px 0 0 0", lineHeight: 1.5, textShadow: "0 2px 4px #000" }}>{p1.special.effect}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,62,62,0.15)", fontSize: "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.2em" }}>P1 SELECT</div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==================== LE ROSTER (GRILLE CENTRALE SUR PC / GRILLE BAS SUR MOBILE) ==================== */}
        <div className="custom-scroll" style={{ 
            width: isMobile ? "100%" : "550px", 
            flexShrink: 0, 
            flex: isMobile ? 1 : "none", 
            background: "rgba(0,0,0,0.7)", 
            backdropFilter: "blur(15px)", 
            borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)", 
            borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)", 
            zIndex: 30, 
            boxShadow: isMobile ? "none" : "0 0 50px rgba(0,0,0,0.8)", 
            display: "flex", 
            flexDirection: "column", 
            overflowY: "auto", 
            padding: "20px" 
        }}>
            
            <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h1 style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em", textShadow: "0 2px 10px #000" }}>
                  <span style={{ color: "#f03e3e" }}>SELECT</span> YOUR FIGHTER
                </h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "15px" }}>
              {members.map((m) => {
                const isP1 = p1?.id === m.id;
                const isP2 = p2?.id === m.id;
                const isSelected = isP1 || isP2;
                const isDimmed = p1 && p2 && !isSelected;

                return (
                  <motion.button key={m.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSelect(m)} 
                    style={{
                      aspectRatio: "1/1", padding: 0, background: "#000", cursor: "pointer", position: "relative",
                      borderRadius: "8px", border: isP1 ? "3px solid #f03e3e" : isP2 ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.1)",
                      overflow: "hidden", opacity: isDimmed ? 0.4 : 1, filter: isDimmed ? "grayscale(100%)" : "none",
                      boxShadow: isSelected ? (isP1 ? "0 0 15px rgba(240,62,62,0.8)" : "0 0 15px rgba(59,130,246,0.8)") : "0 4px 10px rgba(0,0,0,0.5)",
                      transition: "all 0.2s ease"
                    }}>
                    
                    <img src={viewMode === "anime" ? m.animeChar : m.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} alt={m.name} />
                    
                    {/* Effet sombre pour mieux lire le nom (Glassmorphism Premium) */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)", paddingTop: "25px", paddingBottom: "5px", backdropFilter: "blur(2px)" }}>
                        <div style={{ textAlign: "center", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#fff", textShadow: "0 2px 4px #000", letterSpacing: "1px" }}>
                          {m.name.split(" ")[0]} 
                        </div>
                    </div>
                    
                    {m.badge && <div style={{ position: "absolute", top: "4px", right: "4px", background: "linear-gradient(135deg, #FFDF00, #D4AF37)", borderRadius: "50%", padding: "4px", boxShadow: "0 2px 5px #000" }}><Trophy size={10} color="#000" /></div>}
                    
                    {isP1 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(to bottom, #f03e3e, #c92a2a)", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 0", textAlign: "center", letterSpacing: "1px" }}>P1</div>}
                    {isP2 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(to bottom, #3b82f6, #1d4ed8)", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 0", textAlign: "center", letterSpacing: "1px" }}>P2</div>}
                  </motion.button>
                );
              })}
            </div>
        </div>

        {/* ==================== DESKTOP P2 (DROITE) ==================== */}
        {!isMobile && (
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              {p2 ? (
                <motion.div key="p2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                  {/* COVER IMAGE */}
                  <div style={{ position: "absolute", inset: 0 }}>
                    <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "drop-shadow(-10px 10px 30px rgba(0,0,0,0.9))" }} alt={p2.name} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,1) 5%, rgba(0,0,0,0.4) 40%, transparent 100%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "40px 50px", alignItems: "flex-end", textAlign: "right" }}>
                    {p2.badge && (
                      <div style={{ display: "inline-flex", alignSelf: "flex-end", background: "linear-gradient(135deg, #FFDF00, #D4AF37)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                        <span style={{ fontSize: "12px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>{p2.badge}</span><Trophy size={14} color="#000" />
                      </div>
                    )}
                    <p style={{ color: "#3b82f6", fontSize: "18px", fontWeight: 900, fontStyle: "italic", margin: 0, letterSpacing: "0.15em", textShadow: "0 0 10px rgba(59,130,246,0.8)" }}>PLAYER 2</p>
                    <h2 style={{ fontSize: "60px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 20px #000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{p2.name}</h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", textTransform: "uppercase", marginBottom: "20px", letterSpacing: "0.1em", textShadow: "0 2px 4px #000" }}>{p2.rank}</p>
                    
                    <div style={{ width: "100%", maxWidth: "380px", marginBottom: "20px", background: "rgba(0,0,0,0.4)", padding: "15px", borderRadius: "8px", backdropFilter: "blur(5px)" }}>
                      <StatBar label="For" value={p2.stats.force} color="#f03e3e" />
                      <StatBar label="Vit" value={p2.stats.vitesse} color="#eab308" />
                      <StatBar label="Tec" value={p2.stats.technique} color="#3b82f6" />
                    </div>

                    <div style={{ background: "linear-gradient(-90deg, rgba(59,130,246,0.2) 0%, transparent 100%)", borderRight: "4px solid #3b82f6", padding: "15px", borderRadius: "12px 0 0 12px", maxWidth: "450px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <p style={{ fontSize: "16px", color: "#3b82f6", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 0 10px rgba(59,130,246,0.5)" }}>
                        {p2.special.name} <Zap size={18} fill="#3b82f6" />
                      </p>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", margin: "6px 0 0 0", lineHeight: 1.5, textShadow: "0 2px 4px #000" }}>{p2.special.effect}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(59,130,246,0.15)", fontSize: "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.2em" }}>P2 SELECT</div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* VS LOGO DESKTOP */}
      {!isMobile && p1 && p2 && (
          <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%, -50%)", zIndex: 50, pointerEvents: "none" }}>
            <motion.div initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6 }} style={{ fontSize: "100px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #fff 20%, #888 100%)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))" }}>
              <span style={{ WebkitTextStroke: "3px #f03e3e" }}>V</span><span style={{ WebkitTextStroke: "3px #3b82f6" }}>.S.</span>
            </motion.div>
          </div>
      )}

    </div>
  );
}