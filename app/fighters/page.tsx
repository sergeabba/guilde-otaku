"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members, Member } from "../../data/members";
import Link from "next/link";
import {
  Volume2, VolumeX, User, Sword, ChevronLeft, ChevronRight,
  Zap, Trophy,
} from "lucide-react";

type ViewMode = "real" | "anime";

const ostList = ["/fighter.mp3", "/fighter2.mp3", "/fighter3.mp3"];

const arenas = [
  { id: 1, name: "Cité des Flammes",  subtitle: "8ème Brigade",      bg: "/arena_fire.jpg",   color: "#f97316", accent2: "#fbbf24" },
  { id: 2, name: "Stade Galactique",  subtitle: "Inazuma Eleven",    bg: "/arena_soccer.jpg", color: "#3b82f6", accent2: "#60a5fa" },
  { id: 3, name: "Paysage Fracturé",  subtitle: "Tales of Xillia 2", bg: "/arena_xillia.jpg", color: "#a855f7", accent2: "#c084fc" },
  { id: 4, name: "Dojo Vagabond",     subtitle: "Kenshin",           bg: "/arena_dojo.jpg",   color: "#ef4444", accent2: "#f87171" },
];

// ─── STAT BAR ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, color, isMobile }: {
  label: string; value: number; color: string; isMobile: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
      <span style={{
        flexShrink: 0, width: "28px",
        fontSize: "9px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.55)",
      }}>{label}</span>
      <div style={{
        flex: 1, height: "4px",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "4px", overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 6px ${color}60`,
            borderRadius: "4px",
          }}
        />
      </div>
      <span style={{
        flexShrink: 0, fontSize: "12px", fontWeight: 900,
        width: "24px", textAlign: "right", color: "#fff",
      }}>{value}</span>
    </div>
  );
}

// ─── FIGHTER PANEL ─────────────────────────────────────────────────────────────
function FighterPanel({
  member, side, viewMode, isMobile, arenaColor,
}: {
  member: Member | null; side: "left" | "right";
  viewMode: ViewMode; isMobile: boolean; arenaColor: string;
}) {
  const isLeft = side === "left";
  const playerColor = isLeft ? "#f03e3e" : "#3b82f6";
  const playerLabel = isLeft ? "PLAYER 1" : "PLAYER 2";

  if (!member) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "12px", position: "relative",
        minHeight: isMobile ? "160px" : "auto",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${playerColor}06 1px, transparent 1px), linear-gradient(90deg, ${playerColor}06 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} />
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          border: `2px dashed ${playerColor}25`,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2,
        }}>
          <User size={22} color={`${playerColor}30`} />
        </div>
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "11px", fontWeight: 900, letterSpacing: "0.4em",
          color: `${playerColor}25`, textTransform: "uppercase",
          position: "relative", zIndex: 2, margin: 0,
        }}>{playerLabel}</p>
      </div>
    );
  }

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isLeft ? -40 : 40 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: isMobile ? "200px" : "auto" }}
    >
      {/* Photo — PAS de miroir sur P2 */}
      <div style={{ position: "absolute", inset: 0 }}>
        <img
          src={viewMode === "anime" ? member.animeChar : member.photo}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          alt={member.name}
        />
      </div>

      {/* Gradients */}
      <div style={{
        position: "absolute", inset: 0,
        background: isLeft
          ? "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.1) 70%)"
          : "linear-gradient(to left,  rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.1) 70%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
      }} />

      {/* Bord coloré latéral */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        [isLeft ? "left" : "right"]: 0,
        width: "2px",
        background: `linear-gradient(to bottom, transparent, ${playerColor}70, transparent)`,
      }} />

      {/* Numéro watermark */}
      <div style={{
        position: "absolute",
        [isLeft ? "right" : "left"]: "12px",
        top: "16px",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: isMobile ? "60px" : "100px", fontWeight: 900, fontStyle: "italic",
        color: playerColor, opacity: 0.05, lineHeight: 1, pointerEvents: "none",
      }}>
        {String(member.id).padStart(2, "0")}
      </div>

      {/* Contenu */}
      <div style={{
        position: "relative", zIndex: 10,
        height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: isMobile ? "14px" : "28px 32px",
        alignItems: isLeft ? "flex-start" : "flex-end",
        textAlign: isLeft ? "left" : "right",
      }}>
        {/* Badge */}
        {member.badge && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            background: "linear-gradient(135deg,#b8860b,#ffd700,#b8860b)",
            padding: "3px 8px", borderRadius: "4px", marginBottom: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}>
            <Trophy size={9} color="#000" />
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#000", textTransform: "uppercase" }}>
              {member.badge}
            </span>
          </div>
        )}

        {/* Player label */}
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em",
          color: playerColor, margin: "0 0 3px",
          textShadow: `0 0 15px ${playerColor}`,
        }}>{playerLabel}</p>

        {/* Nom */}
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isMobile ? "22px" : "42px",
          fontWeight: 900, textTransform: "uppercase",
          lineHeight: 0.9, margin: "0 0 4px", fontStyle: "italic",
          color: "#fff",
          textShadow: `0 2px 20px rgba(0,0,0,0.8), 0 0 30px ${playerColor}20`,
        }}>{member.name}</h2>

        {/* Rang */}
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isMobile ? "9px" : "11px", fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", margin: "0 0 12px",
        }}>{member.rank}</p>

        {/* Stats */}
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : "240px" }}>
          <StatBar label="For" value={member.stats.force}     color="#f03e3e" isMobile={isMobile} />
          <StatBar label="Vit" value={member.stats.vitesse}   color="#fbbf24" isMobile={isMobile} />
          <StatBar label="Tec" value={member.stats.technique} color="#3b82f6" isMobile={isMobile} />
        </div>

        {/* Coup spécial */}
        <div style={{
          marginTop: "10px",
          background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${playerColor}18, transparent)`,
          borderLeft:  isLeft  ? `2px solid ${playerColor}` : "none",
          borderRight: !isLeft ? `2px solid ${playerColor}` : "none",
          padding: "8px 10px",
          borderRadius: isLeft ? "0 6px 6px 0" : "6px 0 0 6px",
          maxWidth: isMobile ? "100%" : "280px",
        }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
            letterSpacing: "0.1em", color: playerColor,
            display: "flex", alignItems: "center", gap: "5px",
            margin: "0 0 3px",
            flexDirection: isLeft ? "row" : "row-reverse",
          }}>
            <Zap size={11} fill={playerColor} /> {member.special.name}
          </p>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "10px", color: "rgba(255,255,255,0.65)",
            lineHeight: 1.4, margin: 0,
          }}>{member.special.effect}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ROSTER CARD ───────────────────────────────────────────────────────────────
function RosterCard({
  member, isP1, isP2, isDimmed, onClick, viewMode,
}: {
  member: Member; isP1: boolean; isP2: boolean;
  isDimmed: boolean; onClick: () => void; viewMode: ViewMode;
}) {
  const [hovered, setHovered] = useState(false);
  const borderColor = isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : hovered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "2/3",
        padding: 0, background: "#111",
        cursor: "pointer", position: "relative",
        borderRadius: "7px",
        border: `1.5px solid ${borderColor}`,
        overflow: "hidden",
        opacity: isDimmed ? 0.25 : 1,
        filter: isDimmed ? "grayscale(80%) brightness(0.7)" : "none",
        boxShadow: isP1
          ? "0 0 14px rgba(240,62,62,0.45)"
          : isP2
          ? "0 0 14px rgba(59,130,246,0.45)"
          : hovered ? "0 4px 16px rgba(0,0,0,0.5)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <img
        src={viewMode === "anime" ? member.animeChar : member.photo}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
        alt={member.name}
      />
      {/* Gradient bas */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
      }} />
      {/* Nom */}
      <div style={{
        position: "absolute", bottom: "5px", left: 0, right: 0,
        textAlign: "center", padding: "0 3px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
          letterSpacing: "0.03em",
          color: isP1 ? "#f03e3e" : isP2 ? "#3b82f6" : "rgba(255,255,255,0.9)",
          lineHeight: 1,
        }}>
          {member.name.split(" ")[0]}
        </div>
      </div>
      {/* Badge trophée */}
      {member.badge && (
        <div style={{
          position: "absolute", top: "4px", right: "4px",
          background: "linear-gradient(135deg,#FFDF00,#D4AF37)",
          borderRadius: "50%", padding: "3px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
        }}>
          <Trophy size={7} color="#000" />
        </div>
      )}
      {/* Label P1/P2 */}
      {(isP1 || isP2) && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          background: isP1 ? "#f03e3e" : "#3b82f6",
          color: "#fff", fontSize: "8px", fontWeight: 900,
          padding: "2px 0", textAlign: "center", letterSpacing: "0.15em",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {isP1 ? "P1" : "P2"}
        </div>
      )}
    </motion.button>
  );
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
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
    const fn = () => setIsMobile(window.innerWidth < 900);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.4;
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else { audioRef.current.volume = 0.4; audioRef.current.play().catch(() => {}); }
    setIsPlaying(!isPlaying);
  };
  const nextTrack = () => setTrackIdx((p) => (p + 1) % ostList.length);

  const handleSelect = (member: Member) => {
    if (p1?.id === member.id) { setP1(null); return; }
    if (p2?.id === member.id) { setP2(null); return; }
    if (!p1) { setP1(member); return; }
    if (!p2) { setP2(member); return; }
  };

  const nextArena = () => setArenaIdx((p) => (p + 1) % arenas.length);
  const prevArena = () => setArenaIdx((p) => (p - 1 + arenas.length) % arenas.length);

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        height: "100dvh", width: "100vw", display: "flex", flexDirection: "column",
        background: "#060606", overflow: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative",
      }}>
        <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />

        {/* BG arène */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentArena.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${currentArena.bg})`,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: "brightness(0.2) saturate(1.3)",
              }}
            />
          </AnimatePresence>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%)" }} />
        </div>

        {/* Header mobile */}
        <header style={{
          position: "relative", zIndex: 20, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "13px", fontWeight: 900, letterSpacing: "0.1em" }}>←</Link>

          {/* Arène */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><ChevronLeft size={14} /></button>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{currentArena.subtitle}</p>
              <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color }}>{currentArena.name}</p>
            </div>
            <button onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><ChevronRight size={14} /></button>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "2px", gap: "2px" }}>
              {(["real", "anime"] as ViewMode[]).map((m) => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
                  fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: viewMode === m ? currentArena.color : "transparent",
                  color: viewMode === m ? "#fff" : "rgba(255,255,255,0.35)",
                }}>{m === "real" ? "Réel" : "Anime"}</button>
              ))}
            </div>
            <button onClick={toggleSound} style={{
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px",
              padding: "5px", cursor: "pointer", color: isPlaying ? currentArena.color : "rgba(255,255,255,0.35)",
              display: "flex",
            }}>
              {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>
        </header>

        {/* Zone P1 / VS / P2 — hauteur fixe */}
        <div style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          height: "180px", display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* P1 */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              {p1 ? (
                <motion.div key={p1.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0 }}>
                  <img src={viewMode === "anime" ? p1.animeChar : p1.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} alt={p1.name} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
                    {p1.badge && (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:"3px", background:"linear-gradient(135deg,#b8860b,#ffd700)", padding:"2px 5px", borderRadius:"3px", marginBottom:"4px" }}>
                        <Trophy size={7} color="#000" />
                        <span style={{ fontSize:"7px", fontWeight:900, color:"#000", textTransform:"uppercase" }}>{p1.badge}</span>
                      </div>
                    )}
                    <p style={{ margin:0, fontSize:"8px", fontWeight:900, letterSpacing:"0.3em", color:"#f03e3e" }}>PLAYER 1</p>
                    <p style={{ margin:0, fontSize:"18px", fontWeight:900, textTransform:"uppercase", fontStyle:"italic", color:"#fff", lineHeight:1 }}>{p1.name.split(" ")[0]}</p>
                    <p style={{ margin:"2px 0 6px", fontSize:"8px", color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", textTransform:"uppercase" }}>{p1.rank}</p>
                    <StatBar label="For" value={p1.stats.force}     color="#f03e3e" isMobile />
                    <StatBar label="Vit" value={p1.stats.vitesse}   color="#fbbf24" isMobile />
                    <StatBar label="Tec" value={p1.stats.technique} color="#3b82f6" isMobile />
                  </div>
                </motion.div>
              ) : (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:"11px", fontWeight:900, color:"rgba(240,62,62,0.2)", letterSpacing:"0.3em" }}>P1</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* VS Centre */}
          <div style={{
            flexShrink: 0, width: "44px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            zIndex: 5,
          }}>
            {p1 && p2 ? (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6 }}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "20px", fontWeight: 900, fontStyle: "italic",
                  lineHeight: 1,
                }}
              >
                <div style={{ WebkitTextStroke: "1.5px #f03e3e", color: "transparent" }}>V</div>
                <div style={{ WebkitTextStroke: "1.5px #3b82f6", color: "transparent", marginTop: "-4px" }}>S.</div>
              </motion.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1.5px dashed rgba(240,62,62,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "8px", color: "rgba(240,62,62,0.3)", fontWeight: 900 }}>P1</span>
                </div>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1.5px dashed rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "8px", color: "rgba(59,130,246,0.3)", fontWeight: 900 }}>P2</span>
                </div>
              </div>
            )}
          </div>

          {/* P2 */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              {p2 ? (
                <motion.div key={p2.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0 }}>
                  <img src={viewMode === "anime" ? p2.animeChar : p2.photo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} alt={p2.name} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "10px", right: "10px", textAlign: "right" }}>
                    {p2.badge && (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:"3px", background:"linear-gradient(135deg,#b8860b,#ffd700)", padding:"2px 5px", borderRadius:"3px", marginBottom:"4px" }}>
                        <span style={{ fontSize:"7px", fontWeight:900, color:"#000", textTransform:"uppercase" }}>{p2.badge}</span>
                        <Trophy size={7} color="#000" />
                      </div>
                    )}
                    <p style={{ margin:0, fontSize:"8px", fontWeight:900, letterSpacing:"0.3em", color:"#3b82f6" }}>PLAYER 2</p>
                    <p style={{ margin:0, fontSize:"18px", fontWeight:900, textTransform:"uppercase", fontStyle:"italic", color:"#fff", lineHeight:1 }}>{p2.name.split(" ")[0]}</p>
                    <p style={{ margin:"2px 0 6px", fontSize:"8px", color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", textTransform:"uppercase" }}>{p2.rank}</p>
                    <StatBar label="For" value={p2.stats.force}     color="#f03e3e" isMobile />
                    <StatBar label="Vit" value={p2.stats.vitesse}   color="#fbbf24" isMobile />
                    <StatBar label="Tec" value={p2.stats.technique} color="#3b82f6" isMobile />
                  </div>
                </motion.div>
              ) : (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:"11px", fontWeight:900, color:"rgba(59,130,246,0.2)", letterSpacing:"0.3em" }}>P2</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Roster mobile — grille 5 colonnes, scroll */}
        <div style={{
          flex: 1, overflowY: "auto", position: "relative", zIndex: 10,
          padding: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "6px",
          alignContent: "start",
        }}>
          {members.map((m) => (
            <RosterCard
              key={m.id} member={m}
              isP1={p1?.id === m.id} isP2={p2?.id === m.id}
              isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)}
              onClick={() => handleSelect(m)}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", flexDirection: "column",
      background: "#050505", overflow: "hidden",
      fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", position: "relative",
    }}>
      <audio ref={audioRef} src={ostList[trackIdx]} onEnded={nextTrack} />

      <style>{`
        @keyframes vs-pulse { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.03)} }
        .rscroll::-webkit-scrollbar{width:3px}
        .rscroll::-webkit-scrollbar-track{background:rgba(0,0,0,0.3)}
        .rscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px}
      `}</style>

      {/* BG */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentArena.id}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${currentArena.bg})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "brightness(0.22) saturate(1.4)",
            }}
          />
        </AnimatePresence>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.8) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0) 0,rgba(0,0,0,0) 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${currentArena.color}50,transparent)` }} />
      </div>

      {/* Header desktop */}
      <header style={{
        position: "relative", zIndex: 30, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <Link href="/" style={{
          color: "rgba(255,255,255,0.6)", textDecoration: "none",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "13px", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
        }}>← GUILDE OTAKU</Link>

        {/* Arène centrée */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
          padding: "7px 18px", borderRadius: "100px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <button onClick={prevArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronLeft size={15} /></button>
          <div style={{ textAlign: "center", minWidth: "150px" }}>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{currentArena.subtitle}</p>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: currentArena.color, textShadow: `0 0 16px ${currentArena.color}70` }}>{currentArena.name}</p>
          </div>
          <button onClick={nextArena} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronRight size={15} /></button>
        </div>

        {/* Controls droite */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", borderRadius: "7px", padding: "3px", border: "1px solid rgba(255,255,255,0.07)", gap: "2px" }}>
            {(["real", "anime"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "5px 13px", borderRadius: "5px", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
                background: viewMode === m ? currentArena.color : "transparent",
                color: viewMode === m ? "#fff" : "rgba(255,255,255,0.38)",
                boxShadow: viewMode === m ? `0 2px 10px ${currentArena.color}40` : "none",
                transition: "all 0.22s ease",
              }}>
                {m === "real" ? <User size={11} /> : <Sword size={11} />}
                {m === "real" ? "Réel" : "Anime"}
              </button>
            ))}
          </div>
          <button onClick={toggleSound} style={{
            width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
            border: `1px solid ${isPlaying ? currentArena.color + "50" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "7px", cursor: "pointer",
            color: isPlaying ? currentArena.color : "rgba(255,255,255,0.38)",
            transition: "all 0.22s ease",
          }}>
            {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </header>

      {/* Layout principal */}
      <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 10, overflow: "hidden" }}>

        {/* P1 */}
        <AnimatePresence mode="wait">
          <FighterPanel key={`p1-${p1?.id ?? "x"}`} member={p1} side="left" viewMode={viewMode} isMobile={false} arenaColor={currentArena.color} />
        </AnimatePresence>

        {/* Roster — largeur réduite, cartes petites */}
        <div
          className="rscroll"
          style={{
            width: "320px", flexShrink: 0,
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(18px)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            zIndex: 30, display: "flex", flexDirection: "column", overflowY: "auto",
          }}
        >
          {/* Header roster */}
          <div style={{
            padding: "16px 14px 10px", flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h1 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "18px", fontWeight: 900, fontStyle: "italic",
                textTransform: "uppercase", margin: 0, color: "#fff",
              }}>
                <span style={{ color: currentArena.color }}>SELECT</span> FIGHTER
              </h1>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.1em" }}>
                {members.length} FIGHTERS
              </span>
            </div>
          </div>

          {/* Grille — 4 colonnes sur desktop dans 320px */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "7px", padding: "10px",
            alignContent: "start",
          }}>
            {members.map((m) => (
              <RosterCard
                key={m.id} member={m}
                isP1={p1?.id === m.id} isP2={p2?.id === m.id}
                isDimmed={!!(p1 && p2 && p1.id !== m.id && p2.id !== m.id)}
                onClick={() => handleSelect(m)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>

        {/* P2 */}
        <AnimatePresence mode="wait">
          <FighterPanel key={`p2-${p2?.id ?? "x"}`} member={p2} side="right" viewMode={viewMode} isMobile={false} arenaColor={currentArena.color} />
        </AnimatePresence>
      </div>

      {/* VS Badge desktop */}
      {p1 && p2 && (
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 40, pointerEvents: "none",
          animation: "vs-pulse 2.2s ease-in-out infinite",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "80px", fontWeight: 900, fontStyle: "italic", lineHeight: 1,
          }}>
            <span style={{ WebkitTextStroke: "2px #f03e3e", color: "transparent", filter: `drop-shadow(0 0 20px #f03e3e60)` }}>V</span>
            <span style={{ WebkitTextStroke: "2px #3b82f6", color: "transparent", filter: `drop-shadow(0 0 20px #3b82f660)` }}>.S.</span>
          </div>
        </div>
      )}
    </div>
  );
}