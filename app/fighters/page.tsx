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

  // BARRE DE STATS
  const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "10px", marginBottom: isMobile ? "4px" : "8px" }}>
      <span style={{ width: isMobile ? "35px" : "65px", fontSize: isMobile ? "8px" : "12px", fontWeight: 900, textTransform: "uppercase", color: "rgba(255,255,255,0.8)", textShadow: "0 2px 4px #000" }}>{label}</span>
      <div style={{ flex: 1, height: isMobile ? "4px" : "6px", background: "rgba(0,0,0,0.5)", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ height: "100%", background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <span style={{ fontSize: isMobile ? "10px" : "16px", fontWeight: 900, width: isMobile ? "16px" : "26px", textAlign: "right", color: "#fff", textShadow: "0 2px 4px #000" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#000", overflow: "hidden", fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative" }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />
      
      <style>{`
        .smooth-scroll::-webkit-scrollbar { width: 6px; }
        .smooth-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .smooth-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>

      {/* BACKGROUND ARENA */}
      <AnimatePresence mode="wait">
        <motion.div key={currentArena.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
          style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentArena.bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.3)", zIndex: 0 }}
        />
      </AnimatePresence>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 100%)", zIndex: 1, pointerEvents: "none" }} />

      {/* HEADER NAVBAR */}
      <header style={{ position: "relative", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "10px 15px" : "20px 40px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? "14px" : "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>← RETOUR</Link>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "4px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 900, textTransform: "uppercase", padding: isMobile ? "6px 10px" : "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", background: viewMode === mode ? "#f03e3e" : "transparent", color: viewMode === mode ? "#fff" : "rgba(255,255,255,0.4)" }}>
                {mode === "real" ? <User size={12} /> : <Sword size={12} />} {!isMobile && mode}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={toggleSound} style={{ background: "transparent", border: "none", cursor: "pointer", color: isPlaying ? "#f03e3e" : "#fff" }}>{isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
            <button onClick={nextTrack} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}><SkipForward size={20} /></button>
          </div>
        </div>
      </header>

      {/* TITRE ET ARÈNE (POUR MOBILE ET PC) */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 20, padding: isMobile ? "5px 0" : "0 0 10px 0" }}>
        <h1 style={{ fontSize: isMobile ? "22px" : "36px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", margin: 0, textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
          <span style={{ color: "#f03e3e" }}>OTAKU</span> FIGHTERS
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginTop: "5px" }}>
          <button onClick={prevArena} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><ChevronLeft size={16} /></button>
          <div style={{ textAlign: "center", minWidth: "150px" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>ARENA</p>
            <p style={{ fontSize: isMobile ? "12px" : "16px", fontWeight: 900, color: currentArena.color, textTransform: "uppercase", margin: 0, textShadow: `0 0 15px ${currentArena.color}80` }}>{currentArena.name}</p>
          </div>
          <button onClick={nextArena} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* ==================== LAYOUT MOBILE ==================== */}
      {/* ======================================================= */}
      {isMobile ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 10 }}>
          
          {/* HAUT : P1 & P2 CÔTE À CÔTE */}
          <div style={{ display: "flex", height: "42vh", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            
            {/* P1 MOBILE */}
            <div style={{ flex: 1, position: "relative", borderRight: "1px solid rgba(255,255,255,0.1)", background: "rgba(240,62,62,0.05)" }}>
              <AnimatePresence>
                {p1 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", height: "100%", position: "relative" }}>
                    {p1.badge && (
                      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 20, background: "linear-gradient(135deg, #b8860b, #ffd700)", padding: "4px 8px", borderRadius: "6px", boxShadow: "0 2px 10px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Trophy size={10} color="#000" />
                        <span style={{ fontSize: "8px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>{p1.badge}</span>
                      </div>
                    )}
                    {/* Zone Image protégée */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "100px" }}>
                      <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom", filter: "drop-shadow(2px 2px 10px rgba(0,0,0,0.8))" }} alt={p1.name} />
                    </div>
                    {/* Zone Texte fixe */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: "linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 80%, transparent 100%)", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <p style={{ color: "#f03e3e", fontSize: "10px", fontWeight: 900, fontStyle: "italic", margin: 0 }}>PLAYER 1</p>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p1.name}</h2>
                      <div style={{ marginTop: "4px" }}>
                        <StatBar label="For" value={p1.stats.force} color="#f03e3e" />
                        <StatBar label="Vit" value={p1.stats.vitesse} color="#eab308" />
                        <StatBar label="Tec" value={p1.stats.technique} color="#3b82f6" />
                      </div>
                    </div>
                  </motion.div>
                ) : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,62,62,0.3)", fontSize: "20px", fontWeight: 900, fontStyle: "italic" }}>P1 SELECT</div>}
              </AnimatePresence>
            </div>

            {/* P2 MOBILE */}
            <div style={{ flex: 1, position: "relative", background: "rgba(59,130,246,0.05)" }}>
              <AnimatePresence>
                {p2 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", height: "100%", position: "relative" }}>
                    {p2.badge && (
                      <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 20, background: "linear-gradient(135deg, #b8860b, #ffd700)", padding: "4px 8px", borderRadius: "6px", boxShadow: "0 2px 10px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "8px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>{p2.badge}</span>
                        <Trophy size={10} color="#000" />
                      </div>
                    )}
                    {/* Zone Image protégée */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "100px" }}>
                      <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom", filter: "drop-shadow(-2px 2px 10px rgba(0,0,0,0.8))" }} alt={p2.name} />
                    </div>
                    {/* Zone Texte fixe */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: "linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 80%, transparent 100%)", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", textAlign: "right" }}>
                      <p style={{ color: "#3b82f6", fontSize: "10px", fontWeight: 900, fontStyle: "italic", margin: 0 }}>PLAYER 2</p>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p2.name}</h2>
                      <div style={{ marginTop: "4px", width: "100%" }}>
                        <StatBar label="For" value={p2.stats.force} color="#f03e3e" />
                        <StatBar label="Vit" value={p2.stats.vitesse} color="#eab308" />
                        <StatBar label="Tec" value={p2.stats.technique} color="#3b82f6" />
                      </div>
                    </div>
                  </motion.div>
                ) : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(59,130,246,0.3)", fontSize: "20px", fontWeight: 900, fontStyle: "italic" }}>P2 SELECT</div>}
              </AnimatePresence>
            </div>

            {/* VS LOGO MOBILE */}
            {p1 && p2 && (
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 20 }}>
                <div style={{ fontSize: "40px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #fff, #aaa)", WebkitBackgroundClip: "text", color: "transparent", WebkitTextStroke: "1px #f03e3e", filter: "drop-shadow(0 0 10px rgba(0,0,0,0.8))" }}>V.S.</div>
              </div>
            )}
          </div>

          {/* BAS : ROSTER MOBILE (GRILLE COMPACTE) */}
          <div className="smooth-scroll" style={{ flex: 1, overflowY: "auto", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(15px)", padding: "15px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {members.map((m) => {
                const isP1 = p1?.id === m.id;
                const isP2 = p2?.id === m.id;
                const isSelected = isP1 || isP2;
                const isDimmed = p1 && p2 && !isSelected;

                return (
                  <motion.button key={m.id} whileTap={{ scale: 0.95 }} onClick={() => handleSelect(m)} style={{
                      aspectRatio: "1/1", width: "100%", padding: 0, background: "rgba(255,255,255,0.02)", cursor: "pointer", position: "relative",
                      borderRadius: "12px", border: isP1 ? "3px solid #f03e3e" : isP2 ? "3px solid #3b82f6" : "1px solid rgba(255,255,255,0.15)",
                      overflow: "hidden", opacity: isDimmed ? 0.3 : 1, filter: isDimmed ? "grayscale(100%)" : "none",
                      boxShadow: isSelected ? (isP1 ? "0 0 15px rgba(240,62,62,0.8)" : "0 0 15px rgba(59,130,246,0.8)") : "0 2px 5px rgba(0,0,0,0.5)"
                    }}>
                    <img src={viewMode === "anime" ? m.animeChar : m.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt={m.name} />
                    {m.badge && <div style={{ position: "absolute", top: "2px", right: "2px", background: "linear-gradient(135deg, #b8860b, #ffd700)", borderRadius: "50%", padding: "3px" }}><Trophy size={8} color="#000" /></div>}
                    {isP1 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#f03e3e", color: "#fff", fontSize: "10px", fontWeight: 900 }}>P1</div>}
                    {isP2 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#3b82f6", color: "#fff", fontSize: "10px", fontWeight: 900 }}>P2</div>}
                  </motion.button>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* ======================================================= */
        /* ==================== LAYOUT DESKTOP =================== */
        /* ======================================================= */
        <div style={{ flex: 1, display: "flex", flexDirection: "row", position: "relative", zIndex: 10, overflow: "hidden" }}>
          
          {/* P1 DESKTOP */}
          <div style={{ flex: 1, position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <AnimatePresence mode="wait">
              {p1 ? (
                <motion.div key="p1-selected" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "150px" }}>
                    <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "left bottom", filter: "drop-shadow(10px 10px 25px rgba(0,0,0,0.9))" }} alt={p1.name} />
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)", padding: "40px 50px", zIndex: 10 }}>
                    {p1.badge && (
                      <div style={{ display: "inline-flex", background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                        <Trophy size={12} color="#000" />
                        <span style={{ fontSize: "11px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p1.badge}</span>
                      </div>
                    )}
                    <p style={{ color: "#f03e3e", fontSize: "18px", fontWeight: 900, fontStyle: "italic", textShadow: "0 2px 4px #000", margin: 0, letterSpacing: "0.1em" }}>PLAYER 1</p>
                    <h2 style={{ fontSize: "56px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>{p1.name}</h2>
                    <div style={{ maxWidth: "380px", marginBottom: "20px" }}>
                      <StatBar label="Force" value={p1.stats.force} color="#f03e3e" />
                      <StatBar label="Vitesse" value={p1.stats.vitesse} color="#eab308" />
                      <StatBar label="Techniq" value={p1.stats.technique} color="#3b82f6" />
                    </div>
                    <div style={{ background: "rgba(240,62,62,0.1)", borderLeft: "4px solid #f03e3e", padding: "15px", borderRadius: "0 12px 12px 0", backdropFilter: "blur(8px)", maxWidth: "450px" }}>
                      <p style={{ fontSize: "16px", color: "#f03e3e", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 2px 4px #000" }}>
                        <Zap size={18} fill="#f03e3e" /> {p1.special.name}
                      </p>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0 0", lineHeight: 1.5 }}>{p1.special.effect}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="p1-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ color: "rgba(240,62,62,0.6)", fontSize: "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.15em", textShadow: "0 0 20px rgba(240,62,62,0.4)" }}>P1 SELECT</motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ROSTER DESKTOP (LA RUCHE AÉRÉE) */}
          <div style={{ width: "650px", height: "100%", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 60px rgba(0,0,0,0.9)", zIndex: 30 }}>
            <div style={{ padding: "25px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}>
              <h1 style={{ fontSize: "32px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", margin: 0, textShadow: "0 4px 15px #000" }}><span style={{ color: "#f03e3e" }}>SELECT</span> FIGHTER</h1>
            </div>
            <div className="smooth-scroll" style={{ flex: 1, overflowY: "auto", padding: "30px 25px", display: "grid", justifyContent: "center", gridTemplateColumns: "repeat(5, 80px)", gap: "25px", alignContent: "start" }}>
              {members.map((m, index) => {
                const isP1 = p1?.id === m.id;
                const isP2 = p2?.id === m.id;
                const isSelected = isP1 || isP2;
                const isDimmed = p1 && p2 && !isSelected;

                return (
                  <motion.button key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: index * 0.02, ease: "easeOut" }} whileHover={{ scale: 1.15, zIndex: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.8)" }} whileTap={{ scale: 0.95 }} onClick={() => handleSelect(m)} style={{
                      width: "100%", height: "80px", padding: 0, background: "rgba(255,255,255,0.02)", cursor: "pointer", position: "relative",
                      borderRadius: "16px", border: isP1 ? "3px solid #f03e3e" : isP2 ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.15)",
                      overflow: "hidden", opacity: isDimmed ? 0.3 : 1, filter: isDimmed ? "grayscale(100%)" : "none",
                      boxShadow: isSelected ? (isP1 ? "0 0 20px rgba(240,62,62,0.8)" : "0 0 20px rgba(59,130,246,0.8)") : "0 4px 10px rgba(0,0,0,0.5)",
                      transition: "border 0.2s ease, opacity 0.3s ease, filter 0.3s ease"
                    }}>
                    <img src={viewMode === "anime" ? m.animeChar : m.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} alt={m.name} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)", pointerEvents: "none" }} />
                    {m.badge && <div style={{ position: "absolute", top: "6px", right: "6px", background: "linear-gradient(135deg, #b8860b, #ffd700)", borderRadius: "50%", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.8)" }}><Trophy size={10} color="#000" /></div>}
                    {isP1 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#f03e3e", color: "#fff", fontSize: "12px", fontWeight: 900, padding: "4px 0", textAlign: "center" }}>P1</div>}
                    {isP2 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#3b82f6", color: "#fff", fontSize: "12px", fontWeight: 900, padding: "4px 0", textAlign: "center" }}>P2</div>}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* P2 DESKTOP */}
          <div style={{ flex: 1, position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <AnimatePresence mode="wait">
              {p2 ? (
                <motion.div key="p2-selected" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", height: "100%", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "150px" }}>
                    <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "right bottom", filter: "drop-shadow(-10px 10px 25px rgba(0,0,0,0.9))" }} alt={p2.name} />
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)", padding: "40px 50px", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                    {p2.badge && (
                      <div style={{ display: "inline-flex", background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)", padding: "4px 10px", borderRadius: "6px", alignItems: "center", gap: "6px", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p2.badge}</span>
                        <Trophy size={12} color="#000" />
                      </div>
                    )}
                    <p style={{ color: "#3b82f6", fontSize: "18px", fontWeight: 900, fontStyle: "italic", textShadow: "0 2px 4px #000", margin: 0, letterSpacing: "0.1em" }}>PLAYER 2</p>
                    <h2 style={{ fontSize: "56px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, margin: "4px 0", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>{p2.name}</h2>
                    <div style={{ width: "100%", maxWidth: "380px", marginBottom: "20px" }}>
                      <StatBar label="Force" value={p2.stats.force} color="#f03e3e" />
                      <StatBar label="Vitesse" value={p2.stats.vitesse} color="#eab308" />
                      <StatBar label="Techniq" value={p2.stats.technique} color="#3b82f6" />
                    </div>
                    <div style={{ background: "rgba(59,130,246,0.1)", borderRight: "4px solid #3b82f6", padding: "15px", borderRadius: "12px 0 0 12px", backdropFilter: "blur(8px)", maxWidth: "450px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <p style={{ fontSize: "16px", color: "#3b82f6", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0, textShadow: "0 2px 4px #000" }}>
                        {p2.special.name} <Zap size={18} fill="#3b82f6" />
                      </p>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0 0", lineHeight: 1.5 }}>{p2.special.effect}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="p2-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ color: "rgba(59,130,246,0.6)", fontSize: "60px", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.15em", textShadow: "0 0 20px rgba(59,130,246,0.4)" }}>P2 SELECT</motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOGO VS DESKTOP */}
          {p1 && p2 && (
            <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%, -50%)", zIndex: 50, pointerEvents: "none" }}>
              <motion.div initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6, duration: 0.8 }} style={{ fontSize: "130px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #fff 30%, #888 100%)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 10px 30px rgba(0,0,0,1))" }}>
                <span style={{ WebkitTextStroke: "3px #f03e3e" }}>V</span><span style={{ WebkitTextStroke: "3px #3b82f6" }}>.S.</span>
              </motion.div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}