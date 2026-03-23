"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members, Member } from "../../data/members";
import Link from "next/link";
import { Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight, Zap, SkipForward } from "lucide-react";

type ViewMode = "real" | "anime";

const textContrastShadow = {
  textShadow: "0 3px 6px rgba(0,0,0,1), 0 0 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.9)"
};

const ostList = [
  "/fighter.mp3",
  "/fighter2.mp3",
  "/fighter3.mp3"
];

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
  const [showAnnouncer, setShowAnnouncer] = useState(true);
  const [arenaIdx, setArenaIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0); 
  
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentArena = arenas[arenaIdx];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;

    const forceAudioPlay = () => {
      if (!isPlaying) {
        audio.play().then(() => {
          setIsPlaying(true);
          ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, forceAudioPlay));
        }).catch(e => console.log("Bloqué :", e));
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => setIsPlaying(true)).catch(() => {
        ['click', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, forceAudioPlay, { once: true }));
      });
    }

    const timer = setTimeout(() => setShowAnnouncer(false), 2500);
    return () => {
      clearTimeout(timer);
      ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, forceAudioPlay));
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } 
    else { audioRef.current.volume = 0.5; audioRef.current.play().catch(e => console.log(e)); }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => setTrackIdx((prev) => (prev + 1) % ostList.length);

  useEffect(() => {
    if (isPlaying && audioRef.current) audioRef.current.play().catch(e => console.log(e));
  }, [trackIdx, isPlaying]);

  const handleSelect = (member: Member) => {
    const isP1 = p1?.id === member.id;
    const isP2 = p2?.id === member.id;
    if (isP1) { setP1(null); } 
    else if (isP2) { setP2(null); } 
    else if (!p1) { setP1(member); } 
    else if (!p2) { setP2(member); }
  };

  const nextArena = () => setArenaIdx((prev) => (prev + 1) % arenas.length);
  const prevArena = () => setArenaIdx((prev) => (prev - 1 + arenas.length) % arenas.length);

  const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: isMobile ? "6px" : "4px" }}>
      <span style={{ width: isMobile ? "45px" : "65px", fontSize: isMobile ? "9px" : "12px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.8)", ...textContrastShadow }}>{label}</span>
      <div style={{ flex: 1, height: isMobile ? "6px" : "6px", background: "rgba(255,255,255,0.2)", borderRadius: "3px", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ height: "100%", background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <span style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 900, width: "20px", textAlign: "right", color: "#fff", ...textContrastShadow }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#050505", color: "#fff",
      fontFamily: "'Barlow Condensed', sans-serif",
      position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />
      
      <AnimatePresence mode="wait">
        <motion.div key={currentArena.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: `url(${currentArena.bg}), radial-gradient(ellipse at center, #1a1008 0%, #0d0a04 100%)`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.4) contrast(1.2)" }} />
      </AnimatePresence>
      <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "repeating-linear-gradient(45deg, #1a1a1a 0, #1a1a1a 1px, transparent 1px, transparent 10px)", zIndex: 1, pointerEvents: "none" }} />

      {/* --- NAVBAR --- */}
      <div style={{ position: "relative", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "16px 32px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? "13px" : "15px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>← Guilde</Link>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "100px", padding: "3px", gap: "1px" }}>
            {(["real", "anime"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: isMobile ? "6px 10px" : "6px 16px", borderRadius: "100px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.2s ease", background: viewMode === mode ? "#f03e3e" : "transparent", color: viewMode === mode ? "#fff" : "rgba(255,255,255,0.4)" }}>
                {mode === "real" ? <User size={isMobile ? 11 : 13} strokeWidth={2.5} /> : <Sword size={isMobile ? 11 : 13} strokeWidth={2.5} />}
                {!isMobile && (mode === "real" ? "Réel" : "Anime")}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={toggleSound} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%", width: isMobile ? "34px" : "40px", height: isMobile ? "34px" : "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isPlaying ? "#f03e3e" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}>{isPlaying ? <Volume2 size={isMobile ? 14 : 18} /> : <VolumeX size={isMobile ? 14 : 18} />}</button>
            <button onClick={nextTrack} title="Musique suivante" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%", width: isMobile ? "34px" : "40px", height: isMobile ? "34px" : "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }}><SkipForward size={isMobile ? 14 : 18} /></button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 20, marginTop: isMobile ? "5px" : "10px" }}>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 68px)", fontWeight: 900, color: "#f03e3e", fontStyle: "italic", lineHeight: 1, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 0 20px rgba(240, 62, 62, 0.6)" }}>OTAKU FIGHTERS</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? "8px" : "16px", marginTop: isMobile ? "4px" : "10px" }}>
          <button onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "5px" }}><ChevronLeft size={isMobile ? 16 : 20} /></button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: isMobile ? "160px" : "220px" }}>
            <p style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{isMobile ? "TERRAIN" : "TERRAIN SÉLECTIONNÉ"}</p>
            <p style={{ fontSize: isMobile ? "14px" : "18px", fontWeight: 900, color: currentArena.color, textTransform: "uppercase", letterSpacing: "0.1em", textShadow: `0 0 10px ${currentArena.color}80` }}>{currentArena.name}</p>
          </div>
          <button onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "5px" }}><ChevronRight size={isMobile ? 16 : 20} /></button>
        </div>
      </div>

      {/* --- ZONE DE VERSUS --- */}
      <div style={{ 
        flex: 1, display: "flex", 
        flexDirection: "row", // TOUJOURS EN ROW, MÊME SUR MOBILE
        alignItems: isMobile ? "flex-start" : "center", 
        justifyContent: "space-between", 
        padding: isMobile ? "10px 2%" : "0 4%", 
        position: "relative", zIndex: 10, 
      }}>
        
        {/* PLAYER 1 */}
        <div style={{ width: isMobile ? "48%" : "42%", height: isMobile ? "auto" : "65vh", position: "relative" }}>
          <AnimatePresence>
            {p1 && (
              <motion.div key={`p1-${p1.id}`} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ type: "spring", stiffness: 100, damping: 14 }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                
                {/* L'image reste au dessus */}
                <div style={{ height: isMobile ? "200px" : "100%", position: "relative", marginBottom: isMobile ? "10px" : "0" }}>
                  <AnimatePresence mode="wait">
                    <motion.img key={viewMode} src={viewMode === "anime" ? p1.animeChar : p1.photo} alt={p1.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ position: "absolute", bottom: 0, right: 0, height: "100%", width: "100%", objectFit: "contain", objectPosition: "bottom center", filter: "drop-shadow(5px 5px 0px rgba(240, 62, 62, 0.4))", zIndex: 1 }} />
                  </AnimatePresence>
                </div>

                {/* HUD Player 1 (En bas sur mobile, Absolu sur PC) */}
                <div style={{ 
                  position: isMobile ? "relative" : "absolute", 
                  bottom: isMobile ? "auto" : "8%", left: 0, zIndex: 10, 
                  background: isMobile ? "rgba(0,0,0,0.5)" : "linear-gradient(90deg, rgba(0,0,0,0.85) 50%, transparent)", 
                  padding: isMobile ? "10px" : "15px 30px 15px 15px", 
                  borderRadius: "8px", border: isMobile ? "1px solid rgba(240,62,62,0.3)" : "none",
                  width: "100%", minWidth: isMobile ? "auto" : "320px" 
                }}>
                  <p style={{ color: "#f03e3e", fontSize: isMobile ? "12px" : "20px", fontWeight: 900, fontStyle: "italic", marginBottom: "-2px", ...textContrastShadow }}>PLAYER 1</p>
                  <h2 style={{ fontSize: isMobile ? "16px" : "clamp(28px, 4vw, 50px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, ...textContrastShadow }}>{p1.name.replace(/"/g, "")}</h2>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: isMobile ? "10px" : "16px", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px", marginBottom: "12px", ...textContrastShadow }}>{p1.rank}</p>
                  
                  <StatBar label="Force" value={p1.stats.force} color="#f03e3e" />
                  <StatBar label="Vitesse" value={p1.stats.vitesse} color="#eab308" />
                  <StatBar label="Techniq" value={p1.stats.technique} color="#3b82f6" />

                  {/* Attaque Spéciale : TOUJOURS VISIBLE */}
                  <div style={{ marginTop: "12px", padding: "8px", background: "rgba(240,62,62,0.15)", borderLeft: "3px solid #f03e3e", borderRadius: "0 4px 4px 0" }}>
                    <p style={{ fontSize: isMobile ? "12px" : "16px", color: "#f03e3e", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", ...textContrastShadow }}><Zap size={isMobile ? 12 : 18} fill="#f03e3e"/> {p1.special.name}</p>
                    <p style={{ fontSize: isMobile ? "10px" : "14px", color: "rgba(255,255,255,0.8)", marginTop: "4px", lineHeight: 1.2, ...textContrastShadow }}>{p1.special.effect}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LOGO V.S. */}
        <div style={{ position: "absolute", left: "50%", top: isMobile ? "15%" : "50%", transform: "translate(-50%, -50%)", zIndex: 20 }}>
          <AnimatePresence>
            {p1 && p2 && (
              <motion.div initial={{ scale: 6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.6 }} style={{ fontSize: isMobile ? "45px" : "130px", fontWeight: 900, fontStyle: "italic", background: "linear-gradient(to bottom, #f03e3e 30%, #8b0000 100%)", WebkitBackgroundClip: "text", color: "transparent", WebkitTextStroke: isMobile ? "1px #fff" : "2.5px #fff", filter: "drop-shadow(0 0 10px rgba(240,62,62,0.8))" }}>V.S.</motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PLAYER 2 */}
        <div style={{ width: isMobile ? "48%" : "42%", height: isMobile ? "auto" : "65vh", position: "relative" }}>
          <AnimatePresence>
            {p2 && (
              <motion.div key={`p2-${p2.id}`} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} transition={{ type: "spring", stiffness: 100, damping: 14 }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                
                {/* L'image reste au dessus */}
                <div style={{ height: isMobile ? "200px" : "100%", position: "relative", marginBottom: isMobile ? "10px" : "0" }}>
                  <AnimatePresence mode="wait">
                    <motion.img key={viewMode} src={viewMode === "anime" ? p2.animeChar : p2.photo} alt={p2.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ position: "absolute", bottom: 0, left: 0, height: "100%", width: "100%", objectFit: "contain", objectPosition: "bottom center", filter: "drop-shadow(-5px 5px 0px rgba(59, 130, 246, 0.4))", zIndex: 1 }} />
                  </AnimatePresence>
                </div>

                {/* HUD Player 2 (En bas sur mobile, Absolu sur PC) */}
                <div style={{ 
                  position: isMobile ? "relative" : "absolute", 
                  bottom: isMobile ? "auto" : "8%", right: 0, textAlign: isMobile ? "left" : "right", zIndex: 10, 
                  background: isMobile ? "rgba(0,0,0,0.5)" : "linear-gradient(270deg, rgba(0,0,0,0.85) 50%, transparent)", 
                  padding: isMobile ? "10px" : "15px 15px 15px 30px", 
                  borderRadius: "8px", border: isMobile ? "1px solid rgba(59,130,246,0.3)" : "none",
                  width: "100%", minWidth: isMobile ? "auto" : "320px" 
                }}>
                  <p style={{ color: "#3b82f6", fontSize: isMobile ? "12px" : "20px", fontWeight: 900, fontStyle: "italic", marginBottom: "-2px", ...textContrastShadow }}>PLAYER 2</p>
                  <h2 style={{ fontSize: isMobile ? "16px" : "clamp(28px, 4vw, 50px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, ...textContrastShadow }}>{p2.name.replace(/"/g, "")}</h2>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: isMobile ? "10px" : "16px", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px", marginBottom: "12px", ...textContrastShadow }}>{p2.rank}</p>

                  <StatBar label="Force" value={p2.stats.force} color="#f03e3e" />
                  <StatBar label="Vitesse" value={p2.stats.vitesse} color="#eab308" />
                  <StatBar label="Techniq" value={p2.stats.technique} color="#3b82f6" />

                  {/* Attaque Spéciale : TOUJOURS VISIBLE */}
                  <div style={{ marginTop: "12px", padding: "8px", background: "rgba(59,130,246,0.15)", borderLeft: isMobile ? "3px solid #3b82f6" : "none", borderRight: isMobile ? "none" : "3px solid #3b82f6", borderRadius: isMobile ? "0 4px 4px 0" : "4px 0 0 4px", display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "flex-end" }}>
                    <p style={{ fontSize: isMobile ? "12px" : "16px", color: "#3b82f6", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", ...textContrastShadow }}>{isMobile ? "" : p2.special.name} <Zap size={isMobile ? 12 : 18} fill="#3b82f6"/> {isMobile ? p2.special.name : ""}</p>
                    <p style={{ fontSize: isMobile ? "10px" : "14px", color: "rgba(255,255,255,0.8)", marginTop: "4px", lineHeight: 1.2, ...textContrastShadow }}>{p2.special.effect}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- GRILLE DE SÉLECTION (Avec Scroll Horizontal sur mobile) --- */}
      <div style={{ 
        padding: isMobile ? "12px 10px" : "20px 4%", 
        background: "linear-gradient(to top, #000 70%, rgba(0,0,0,0.4) 100%)", 
        position: "relative", zIndex: 30, 
        display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", 
        justifyContent: isMobile ? "flex-start" : "center", 
        gap: isMobile ? "8px" : "8px", marginTop: "auto", 
        overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch"
      }}>
        {members.map((m) => {
          const isP1 = p1?.id === m.id;
          const isP2 = p2?.id === m.id;
          const isSelected = isP1 || isP2;
          const size = isMobile ? "55px" : "80px";
          return (
            <motion.div key={m.id} whileHover={!isMobile ? { scale: 1.1, y: -5, zIndex: 10 } : {}} onClick={() => handleSelect(m)} style={{ width: size, height: size, flexShrink: 0, cursor: "pointer", position: "relative", border: isP1 ? "2px solid #f03e3e" : isP2 ? "2px solid #3b82f6" : "1px solid #333", boxShadow: isP1 ? "0 0 10px rgba(240,62,62,0.6)" : isP2 ? "0 0 10px rgba(59,130,246,0.6)" : "none", borderRadius: isMobile ? "4px" : "0", clipPath: isMobile ? "none" : "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)", background: "#111", overflow: "hidden", filter: (!p1 || !p2 || isSelected) ? "none" : "grayscale(0.7) brightness(0.6)", transition: "all 0.3s ease", }}>
              <AnimatePresence mode="wait">
                <motion.img key={viewMode} src={viewMode === "anime" ? m.animeChar : m.photo} alt={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </AnimatePresence>
              {isP1 && <div style={{ position: "absolute", top: 0, left: 0, background: "#f03e3e", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 4px", borderBottomRightRadius: "4px" }}>P1</div>}
              {isP2 && <div style={{ position: "absolute", top: 0, right: 0, background: "#3b82f6", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 4px", borderBottomLeftRadius: "4px" }}>P2</div>}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAnnouncer && (
          <motion.div initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0, filter: "blur(12px)" }} transition={{ type: "spring", bounce: 0.5, duration: 0.7 }} style={{ position: "absolute", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", fontSize: isMobile ? "clamp(40px, 12vw, 80px)" : "clamp(50px, 10vw, 140px)", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.04em", textAlign: "center", padding: "20px", textShadow: "0 0 30px rgba(255,255,255,0.5)" }}>CHOOSE YOUR FIGHTER!</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}