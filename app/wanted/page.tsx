"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { members } from "../../data/members";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, User, Sword, Search, Play, Pause } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader"; // ← ajouté

type ViewMode = "real" | "anime";

function getPrime(id: number): string {
  const bases = [50, 80, 120, 150, 200, 250, 300, 400, 500, 750, 800, 999];
  const base = bases[id % bases.length];
  const mul = ((id * 7) % 9) + 1;
  const val = base * mul * 1_000_000;
  return val.toLocaleString("en-US").replace(/,/g, ",") + "-";
}

export default function WantedPage() {
  // --- ÉTATS ---
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false); // Mode diaporama
  const [imgError, setImgError] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("real");
  const [searchTerm, setSearchTerm] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FILTRAGE ET RECHERCHE ---
  const filteredMembers = useMemo(() => {
    return members.filter((m) => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.rank.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Reset l'index si la recherche change
  useEffect(() => {
    setCurrent(0);
  }, [searchTerm]);

  const member = filteredMembers[current];
  const prime = member ? getPrime(member.id) : "0";

  // --- LOGIQUE SON ET DIAPORAMA ---
  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log("Lecture bloquée :", e));
    }
    setIsPlaying(!isPlaying);
  };

  const next = useCallback(() => { setImgError(false); setCurrent((c) => (c + 1) % filteredMembers.length); }, [filteredMembers.length]);
  const prev = useCallback(() => { setImgError(false); setCurrent((c) => (c - 1 + filteredMembers.length) % filteredMembers.length); }, [filteredMembers.length]);

  // Effet Diaporama (Autoplay) — CORRIGÉ : next est dans les deps via useCallback
  useEffect(() => {
    if (!isAutoPlay || filteredMembers.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlay, filteredMembers.length, next]);

  // Navigation clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && filteredMembers.length > 0) prev();
      if (e.key === "ArrowRight" && filteredMembers.length > 0) next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredMembers.length]);

  useEffect(() => {
    setImgError(false);
  }, [viewMode, current]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center, #1a1008 0%, #0d0a04 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      paddingBottom: "140px",
      position: "relative", overflow: "hidden",
    }}>

      <audio ref={audioRef} src="/wanted.mp3" loop />

      {/* Navigation unifiée */}
      <div style={{ width: "100%", position: "relative", zIndex: 50 }}>
        <GuildeHeader activePage="wanted" accentColor="#c9a84c" bgColor="rgba(13,10,4,0.85)" textColor="#fff" />
      </div>

        {/* BARRE DE RECHERCHE CENTRALE */}
        {/* BARRE DE RECHERCHE */}
        <div style={{
          display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px",
          padding: "6px 16px", width: "min(300px, 100%)",
        }}>
          <Search size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: "8px" }} />
          <input
            type="text"
            placeholder="Rechercher une prime..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "transparent", border: "none", color: "#fff",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px",
              outline: "none", width: "100%", letterSpacing: "0.05em"
            }}
          />
        </div>

      {/* ── CONTRÔLES ── */}
      <div style={{
        width: "100%", padding: "12px 20px", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "12px", flexWrap: "wrap",
      }}>
        {/* Switch Réel/Anime */}
        <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: "100px", padding: "4px", gap: "2px" }}>
          {(["real", "anime"] as ViewMode[]).map((mode) => (
            <button
              key={mode} onClick={() => setViewMode(mode)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: "100px",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                background: viewMode === mode ? "#c9a84c" : "transparent",
                color: viewMode === mode ? "#fff" : "rgba(255,255,255,0.4)",
                boxShadow: viewMode === mode ? `0 2px 8px rgba(201,168,76,0.5)` : "none",
              }}
            >
              {mode === "real" ? <User size={13} strokeWidth={2.5} /> : <Sword size={13} strokeWidth={2.5} />}
              {mode === "real" ? "Réel" : "Anime"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {/* Autoplay */}
          <button onClick={() => setIsAutoPlay(!isAutoPlay)} style={{
            background: isAutoPlay ? "#c9a84c" : "rgba(255,255,255,0.08)", border: "none",
            borderRadius: "50%", width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: isAutoPlay ? "#fff" : "rgba(255,255,255,0.4)",
          }}>
            {isAutoPlay ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: "2px" }} />}
          </button>

          {/* Son */}
          <button onClick={toggleSound} style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: "50%", width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: isPlaying ? "#c9a84c" : "rgba(255,255,255,0.4)",
          }}>
            {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* --- AFFICHE PRINCIPALE --- */}
      {filteredMembers.length > 0 ? (
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "20px", marginTop: "20px" }}>
          <button onClick={prev} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", zIndex: 20 }}>
            <ChevronLeft size={40} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: (member.id % 4 - 2) * 1.5 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)", transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                width: "min(380px, 80vw)", aspectRatio: "2/3", position: "relative", zIndex: 10,
                background: "linear-gradient(135deg, #e8cba3 0%, #d1ae7b 50%, #bc9257 100%)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.8), inset 0 0 50px rgba(90,50,20,0.4)",
                padding: "16px", borderRadius: "2px 4px 3px 2px",
              }}
            >
              <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.15, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' /%3E%3C/svg%3E")` }} />

              <div style={{ position: "relative", zIndex: 2, border: "4px solid #36220f", height: "100%", display: "flex", flexDirection: "column", padding: "10px" }}>
                
                <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "68px", fontWeight: 900, color: "#36220f", lineHeight: 0.8, textAlign: "center", transform: "scaleY(1.4)", transformOrigin: "bottom" }}>
                  WANTED
                </h1>
                <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "14px", fontWeight: 700, color: "#36220f", letterSpacing: "0.4em", textAlign: "center", margin: "14px 0 12px", marginTop: "-2px" }}>
                  DEAD OR ALIVE
                </p>

                {/* PHOTO AVEC EFFET KEN BURNS (Zoom lent) */}
                <div style={{ flex: 1, border: "4px solid #36220f", position: "relative", overflow: "hidden", marginBottom: "16px", boxShadow: "inset 0 0 25px rgba(0,0,0,0.6)", background: "#4a331c" }}>
                  {!imgError ? (
                    <motion.img
                      key={viewMode}
                      src={viewMode === "anime" ? member.animeChar : member.photo}
                      alt={member.name}
                      onError={() => setImgError(true)}
                      // L'animation de zoom lent
                      animate={{ scale: [1, 1.15, 1], x: ["0%", "-1%", "1%", "0%"] }}
                      transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                      style={{
                        width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%",
                        filter: "sepia(0.8) contrast(1.2) brightness(0.9) grayscale(0.2)",
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#b08d5b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sword size={48} color="rgba(0,0,0,0.2)" />
                    </div>
                  )}
                </div>

                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "clamp(26px, 7vw, 36px)", fontWeight: 900, color: "#36220f", lineHeight: 0.9, letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center", transform: "scaleY(1.25)", marginBottom: "10px" }}>
                  {member.name.replace(/"/g, "·")}
                </h2>

                <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 900, color: "#36220f", letterSpacing: "0.05em", textAlign: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "24px", marginRight: "4px" }}>฿</span>{prime}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #36220f", paddingTop: "6px", marginTop: "auto" }}>
                  <p style={{ fontFamily: "monospace", fontSize: "6px", color: "#4a331c", letterSpacing: "0.05em", lineHeight: 1.2, maxWidth: "68%", textAlign: "justify" }}>
                    KONO SOSHIKI WA FICTION DETHU NODE JITSU ZAISURU...
                  </p>
                  <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "18px", fontWeight: 900, color: "#36220f", letterSpacing: "0.1em" }}>MARINE</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={next} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", zIndex: 20 }}>
            <ChevronRight size={40} />
          </button>
        </div>
      ) : (
        <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", fontStyle: "italic" }}>
          Aucune prime trouvée pour ce pirate...
        </div>
      )}

      {/* --- LISTE DES MINI-PRIMES EN BAS --- */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), transparent)",
        padding: "20px 20px 10px", zIndex: 40,
        display: "flex", overflowX: "auto", gap: "12px",
        scrollBehavior: "smooth", alignItems: "flex-end",
        // Cache la scrollbar sur Chrome/Safari
        msOverflowStyle: "none", scrollbarWidth: "none",
      }}>
        {filteredMembers.map((m, idx) => {
          const isSelected = current === idx;
          return (
            <div 
              key={m.id}
              onClick={() => { setCurrent(idx); setIsAutoPlay(false); }}
              style={{
                flexShrink: 0, cursor: "pointer",
                width: isSelected ? "80px" : "60px", 
                height: isSelected ? "110px" : "80px",
                background: "#d1ae7b", padding: "4px",
                border: isSelected ? "2px solid #c9a84c" : "1px solid #36220f",
                boxShadow: isSelected ? "0 -5px 20px rgba(201,168,76,0.4)" : "0 5px 10px rgba(0,0,0,0.5)",
                transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                opacity: isSelected ? 1 : 0.5,
                transformOrigin: "bottom",
                filter: isSelected ? "none" : "grayscale(0.5)",
              }}
            >
              <div style={{ border: "1px solid #36220f", height: "100%", overflow: "hidden", position: "relative" }}>
                <img 
                  src={viewMode === "anime" ? m.animeChar : m.photo} 
                  alt={m.name} 
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.8) contrast(1.2)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}