"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members, Member } from "../../data/members";
import Link from "next/link";
import { Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight, Zap, SkipForward, Trophy } from "lucide-react";

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
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.4;
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); 
    else { audioRef.current.volume = 0.4; audioRef.current.play().catch(e => console.log(e)); }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => setTrackIdx((prev) => (prev + 1) % ostList.length);

  const handleSelect = (member: Member) => {
    const isP1 = p1?.id === member.id;
    const isP2 = p2?.id === member.id;
    if (isP1) setP1(null); 
    else if (isP2) setP2(null); 
    else if (!p1) setP1(member); 
    else if (!p2) setP2(member);
  };

  const nextArena = () => setArenaIdx((prev) => (prev + 1) % arenas.length);
  const prevArena = () => setArenaIdx((prev) => (prev - 1 + arenas.length) % arenas.length);

  const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <span style={{ width: isMobile ? "40px" : "65px", fontSize: isMobile ? "9px" : "12px", fontWeight: 900, textTransform: "uppercase", color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em", textShadow: "0 2px 4px #000" }}>{label}</span>
      <div style={{ flex: 1, height: isMobile ? "4px" : "6px", background: "rgba(0,0,0,0.5)", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }} style={{ height: "100%", background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
      <span style={{ fontSize: isMobile ? "12px" : "16px", fontWeight: 900, width: "26px", textAlign: "right", color: "#fff", textShadow: "0 2px 4px #000" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#000", overflow: "hidden", fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative" }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />
      
      <style>{`
        .smooth-scroll::-webkit-scrollbar { width: 6px; }
        .smooth-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .smooth-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
        .smooth-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
      `}</style>

      {/* BACKGROUND ARENA */}
      <AnimatePresence mode="wait">
        <motion.div key={currentArena.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentArena.bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.3)", zIndex: 0 }}
        />
      </AnimatePresence>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 100%)", zIndex: 1, pointerEvents: "none" }} />

      {/* HEADER NAVBAR */}
      <header style={{ position: "relative", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "15px 20px" : "20px 40px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? "14px" : "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>← RETOUR</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "4px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", background: viewMode === mode ? "#f03e3e" : "transparent", color: viewMode === mode ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.3s ease" }}>
                {mode === "real" ? <User size={14} /> : <Sword size={14} />} {!isMobile && mode}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <button onClick={toggleSound} style={{ background: "transparent", border: "none", cursor: "pointer", color: isPlaying ? "#f03e3e" : "rgba(255,255,255,0.7)", transition: "0.3s", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}</button>
            <button onClick={nextTrack} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "0.3s", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}><SkipForward size={24} /></button>
          </div>
        </div>
      </header>

      {/* STRUCTURE PRINCIPALE - 3 COLONNES */}
      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", position: "relative", zIndex: 10, overflow: "hidden" }}>
        
        {/* ======================================= */}
        {/* P1 - GAUCHE */}
        {/* ======================================= */}
        <div style={{ flex: 1, position: "relative", height: isMobile ? "35vh" : "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <AnimatePresence mode="wait">
            {p1 ? (
              <motion.div key="p1-selected" initial={{ opacity: 0, x: -50, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -50, filter: "blur(10px)" }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", position: "relative" }}>
                <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ position: "absolute", bottom: isMobile ? "40px" : "120px", left: isMobile ? "10%" : "5%", width: "100%", height: isMobile ? "100%" : "85%", objectFit: "contain", objectPosition: "left bottom", zIndex: 1, filter: "drop-shadow(10px 10px 25px rgba(0,0,0,0.9))" }} alt={p1.name} />
                
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)", padding: isMobile ? "15px" : "40px 50px", zIndex: 10 }}>
                  {p1.badge && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: "inline-flex", background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                      <Trophy size={12} color="#000" />
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p1.badge}</span>
                    </motion.div>
                  )}
                  <p style={{ color: "#f03e3e", fontSize: isMobile ? "12px" : "18px", fontWeight: 900, fontStyle: "italic", textShadow: "0 2px 4px #000", margin: 0, letterSpacing: "0.1em" }}>PLAYER 1</p>
                  <h2 style={{ fontSize: isMobile ? "28px" : "56px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>{p1.name}</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: isMobile ? "11px" : "16px", textTransform: "uppercase", marginBottom: isMobile ? "15px" : "25px", letterSpacing: "0.2em" }}>{p1.rank}</p>
                  
                  <div style={{ maxWidth: "380px", marginBottom: isMobile ? "10px" : "20px" }}>
                    <StatBar label="Force" value={p1.stats.force} color="#f03e3e" />
                    <StatBar label="Vitesse" value={p1.stats.vitesse} color="#eab308" />
                    <StatBar label="Techniq" value={p1.stats.technique} color="#3b82f6" />
                  </div>

                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} style={{ background: "rgba(240,62,62,0.1)", borderLeft: "4px solid #f03e3e", padding: isMobile ? "8px" : "15px", borderRadius: "0 12px 12px 0", backdropFilter: "blur(8px)", maxWidth: "450px" }}>
                    <p style={{ fontSize: isMobile ? "12px" : "16px", color: "#f03e3e", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 2px 4px #000" }}>
                      <Zap size={isMobile ? 14 : 18} fill="#f03e3e" /> {p1.special.name}
                    </p>
                    {!isMobile && <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0 0", lineHeight: 1.5 }}>{p1.special.effect}</p>}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="p1-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ color: "rgba(240,62,62,0.6)", fontSize: isMobile ? "24px" : "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.15em", textShadow: "0 0 20px rgba(240,62,62,0.4)" }}>
                  P1 SELECT
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================================= */}
        {/* GRILLE CENTRALE - VRAIMENT AÉRÉE ET FIXE */}
        {/* ======================================= */}
        <div style={{ 
          width: isMobile ? "100%" : "600px", // ENCORE PLUS LARGE POUR AÉRER
          height: isMobile ? "65vh" : "100%", 
          display: "flex", flexDirection: "column", 
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", 
          borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 60px rgba(0,0,0,0.9)", zIndex: 30 
        }}>
          {/* EN-TÊTE */}
          <div style={{ padding: "25px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", margin: 0, textShadow: "0 4px 15px #000" }}>
              <span style={{ color: "#f03e3e" }}>SELECT</span> FIGHTER
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginTop: "12px" }}>
              <button onClick={prevArena} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}><ChevronLeft size={16} /></button>
              <div style={{ textAlign: "center", minWidth: "180px" }}>
                <p style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 4px 0" }}>ARENA</p>
                <p style={{ fontSize: "16px", fontWeight: 900, color: currentArena.color, textTransform: "uppercase", margin: 0, textShadow: `0 0 15px ${currentArena.color}80` }}>{currentArena.name}</p>
              </div>
              <button onClick={nextArena} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* LA GRILLE (ESPACÉE ET FORCÉE) */}
          <div className="smooth-scroll" style={{ 
            flex: 1, overflowY: "auto", padding: "30px 0",
            display: "grid", 
            justifyContent: "center", // Centre la grille
            gridTemplateColumns: isMobile ? "repeat(4, 70px)" : "repeat(5, 75px)", // TAILLES FIXES ! Fini le stretch
            gap: isMobile ? "15px" : "25px", // ÉNORME ESPACE ENTRE LES CARTES
            alignContent: "start"
          }}>
            {members.map((m, index) => {
              const isP1 = p1?.id === m.id;
              const isP2 = p2?.id === m.id;
              const isSelected = isP1 || isP2;
              const isDimmed = p1 && p2 && !isSelected;

              return (
                <motion.button 
                  key={m.id} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.02, ease: "easeOut" }}
                  whileHover={{ scale: 1.15, zIndex: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(m)}
                  style={{
                    width: "100%", height: isMobile ? "70px" : "75px", // TAILLE FORCÉE
                    padding: 0, background: "rgba(255,255,255,0.02)", cursor: "pointer", position: "relative",
                    borderRadius: "16px", // Bords bien ronds
                    border: isP1 ? "3px solid #f03e3e" : isP2 ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.15)",
                    overflow: "hidden", 
                    opacity: isDimmed ? 0.3 : 1, filter: isDimmed ? "grayscale(100%)" : "none",
                    boxShadow: isSelected ? (isP1 ? "0 0 20px rgba(240,62,62,0.8)" : "0 0 20px rgba(59,130,246,0.8)") : "0 4px 10px rgba(0,0,0,0.5)",
                    transition: "border 0.2s ease, opacity 0.3s ease, filter 0.3s ease"
                  }}
                >
                  <img src={viewMode === "anime" ? m.animeChar : m.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt={m.name} />
                  
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)", pointerEvents: "none" }} />

                  {m.badge && (
                     <div style={{ position: "absolute", top: "6px", right: "6px", background: "linear-gradient(135deg, #b8860b, #ffd700)", borderRadius: "50%", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                       <Trophy size={10} color="#000" />
                     </div>
                  )}

                  {isP1 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#f03e3e", color: "#fff", fontSize: "12px", fontWeight: 900, padding: "4px 0", textAlign: "center" }}>P1</div>}
                  {isP2 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#3b82f6", color: "#fff", fontSize: "12px", fontWeight: 900, padding: "4px 0", textAlign: "center" }}>P2</div>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ======================================= */}
        {/* P2 - DROITE */}
        {/* ======================================= */}
        <div style={{ flex: 1, position: isMobile ? "absolute" : "relative", top: 0, right: 0, width: isMobile ? "50%" : "auto", height: isMobile ? "35vh" : "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <AnimatePresence mode="wait">
            {p2 ? (
              <motion.div key="p2-selected" initial={{ opacity: 0, x: 50, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: 50, filter: "blur(10px)" }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", position: "relative" }}>
                <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ position: "absolute", bottom: isMobile ? "40px" : "120px", right: isMobile ? "10%" : "5%", width: "100%", height: isMobile ? "100%" : "85%", objectFit: "contain", objectPosition: isMobile ? "center bottom" : "right bottom", zIndex: 1, filter: "drop-shadow(-10px 10px 25px rgba(0,0,0,0.9))" }} alt={p2.name} />
                
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)", padding: isMobile ? "15px" : "40px 50px", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                  {p2.badge && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: "inline-flex", background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p2.badge}</span>
                      <Trophy size={12} color="#000" />
                    </motion.div>
                  )}
                  <p style={{ color: "#3b82f6", fontSize: isMobile ? "12px" : "18px", fontWeight: 900, fontStyle: "italic", textShadow: "0 2px 4px #000", margin: 0, letterSpacing: "0.1em" }}>PLAYER 2</p>
                  <h2 style={{ fontSize: isMobile ? "28px" : "56px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>{p2.name}</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: isMobile ? "11px" : "16px", textTransform: "uppercase", marginBottom: isMobile ? "15px" : "25px", letterSpacing: "0.2em" }}>{p2.rank}</p>
                  
                  <div style={{ width: "100%", maxWidth: "380px", marginBottom: isMobile ? "10px" : "20px" }}>
                    <StatBar label="Force" value={p2.stats.force} color="#f03e3e" />
                    <StatBar label="Vitesse" value={p2.stats.vitesse} color="#eab308" />
                    <StatBar label="Techniq" value={p2.stats.technique} color="#3b82f6" />
                  </div>

                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} style={{ background: "rgba(59,130,246,0.1)", borderRight: "4px solid #3b82f6", padding: isMobile ? "8px" : "15px", borderRadius: "12px 0 0 12px", backdropFilter: "blur(8px)", maxWidth: "450px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <p style={{ fontSize: isMobile ? "12px" : "16px", color: "#3b82f6", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 2px 4px #000" }}>
                      {p2.special.name} <Zap size={isMobile ? 14 : 18} fill="#3b82f6" />
                    </p>
                    {!isMobile && <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0 0", lineHeight: 1.5 }}>{p2.special.effect}</p>}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="p2-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ color: "rgba(59,130,246,0.6)", fontSize: isMobile ? "24px" : "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.15em", textShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
                  P2 SELECT
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LOGO VS CENTRAL */}
        {p1 && p2 && !isMobile && (
          <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%, -50%)", zIndex: 50, pointerEvents: "none" }}>
            <motion.div initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6, duration: 0.8 }} style={{ fontSize: "130px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #fff 30%, #888 100%)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 10px 30px rgba(0,0,0,1))" }}>
              <span style={{ WebkitTextStroke: "3px #f03e3e" }}>V</span><span style={{ WebkitTextStroke: "3px #3b82f6" }}>.S.</span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}