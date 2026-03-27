"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { 
  Sparkles, Maximize2, X, Image as ImageIcon, Video, Palette, Code, Play
} from "lucide-react";

// ─── DONNÉES DE LA GALERIE (Créations de la Guilde) ──────────────────────────
const ATELIER_DATA = [
  {
    id: 1,
    title: "Bash & Grazy",
    category: "Crossover",
    type: "Image",
    prompt: "Bash et Grazy en mode Jujutsu Kaisen, c'est mignon.",
    image: "/atelier/bash-grazy.png",
    size: "large", // Prend plus de place sur la grille
    color: "#60a5fa"
  },
  {
    id: 2,
    title: "Godwin & Traicy",
    category: "Crossover",
    type: "Image",
    prompt: "Godwin et Traicy réimaginés dans l'univers de Soul Eater.",
    image: "/atelier/godwintraicy1.png",
    size: "tall", // Format portrait
    color: "#f87171"
  },
  {
    id: 3,
    title: "Le Don & Bash",
    category: "Crossover",
    type: "Image",
    prompt: "Bash et le Don plongés dans l'univers de Jujutsu Kaisen.",
    image: "/atelier/don-bashjjk.png",
    size: "wide", // Format paysage
    color: "#a78bfa"
  },
  {
    id: 4,
    title: "Godwin & Divine",
    category: "Crossover",
    type: "Image",
    prompt: "Godwin et Divine en mode Kimetsu no Yaiba (Demon Slayer).",
    image: "/atelier/godwin-divine.png",
    size: "normal",
    color: "#34d399"
  },
  {
    id: 5,
    title: "Floriane",
    category: "Personnage",
    type: "Image",
    prompt: "Floriane en Fullmetal Alchemist, net net.",
    image: "/atelier/florianemha.png", 
    size: "tall",
    color: "#c9a84c"
  },
  {
    id: 6,
    title: "Les Trix Otaku",
    category: "Groupe",
    type: "Image",
    prompt: "La version Otaku des Trix.",
    image: "/atelier/trix.png",
    size: "normal",
    color: "#FFD700"
  },
{
    id: 7,
    title: "Food Wars Otaku",
    category: "Concept",
    type: "Image",
    prompt: "L'ambiance Food Wars au sein de la Guilde.",
    image: "/atelier/food.jpg", // Le nom est propre maintenant !
    size: "large",
    color: "#f87171"
  },
  {
    id: 8,
    title: "Jise Ben (Sung Jin-Woo)",
    category: "Personnage",
    type: "Image",
    prompt: "Jise Ben qui farme l'aura façon Sung Jin-Woo (Solo Leveling).",
    image: "/atelier/jise-ben.png", // Plus d'espaces ni de parenthèses !
    size: "normal",
    color: "#a78bfa"
  },
  {
    id: 9,
    title: "Godwin (Nagi)",
    category: "Personnage",
    type: "Image",
    prompt: "Godwin avec le style et l'aura de Nagi (Blue Lock).",
    image: "/atelier/godwin-nagi.png", 
    size: "normal",
    color: "#60a5fa"
  },
  {
    id: 10,
    title: "Duel Food Wars",
    category: "Concept",
    type: "Image",
    prompt: "Le grand duel de Grazy et Traicy sous Food Wars.",
    image: "/atelier/duel-food.png", 
    size: "wide",
    color: "#c9a84c"
  }
  ,
  {
    id: 11,
    title: "godwin & traicy dans jujutsu kaisen",
    category: "Concept",
    type: "Image",
    prompt: "godwin & traicy dans jujutsu kaisen  , ils ont l'air heureux hein.",
    image: "/atelier/godwintraicy2.png", 
    size: "wide",
    color: "#4ade80"
  }
];

const FILTERS = ["Tout", "Personnage", "Paysage", "Concept", "Vidéo"];

// ─── COMPOSANT IMAGE BRUT (Fini les écrans noirs !) ──────────────────────────
function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img 
      src={src} 
      alt={alt} 
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "cover",
        // On enlève toutes les histoires d'opacité, l'image s'affiche direct !
      }} 
    />
  );
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────
export default function AtelierPage() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredWorks = ATELIER_DATA.filter(work => activeFilter === "Tout" || work.category === activeFilter || (activeFilter === "Vidéo" && work.type === "Vidéo"));

  return (
    <div style={{ minHeight: "100vh", background: "#030305", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", overflowX: "hidden", position: "relative" }}>
      
      <style>{`
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
        /* La magie du Bento Grid */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          grid-auto-rows: 280px;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .size-large { grid-column: span 2; grid-row: span 2; }
          .size-wide { grid-column: span 2; grid-row: span 1; }
          .size-tall { grid-column: span 1; grid-row: span 2; }
          .size-normal { grid-column: span 1; grid-row: span 1; }
        }
        @media (max-width: 767px) {
          .size-large, .size-wide, .size-tall, .size-normal { grid-column: span 1; grid-row: span 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030305; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
        
        .work-card:hover .overlay {
          opacity: 1 !important;
        }
      `}</style>

      {/* ── AMBIANCE VISUELLE (Fond) ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 60%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 60%)", filter: "blur(100px)" }} />
      </div>

      <GuildeHeader activePage="atelier" />

      <div style={{ position: "relative", zIndex: 10 }}>
        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ position: "relative", y: heroY, opacity: heroOpacity, padding: isMobile ? "80px 20px 40px" : "120px 48px 60px", maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "100px", marginBottom: "24px" }}>
              <Sparkles size={14} color="#c9a84c" />
              <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.2em", color: "#c9a84c", textTransform: "uppercase" }}>Galerie d'Art IA</span>
            </div>
            
            <h1 style={{ fontSize: isMobile ? "clamp(48px, 12vw, 80px)" : "clamp(80px, 10vw, 140px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.85, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "24px" }}>
              L'AT<span style={{ color: "transparent", WebkitTextStroke: "2px #c9a84c" }}>ELIER</span>
            </h1>
            
            <p style={{ fontSize: "18px", fontWeight: 500, color: "rgba(255,255,255,0.5)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
              L'espace créatif de la Guilde. Où l'imagination Otaku prend vie à travers la puissance de la génération par Intelligence Artificielle.
            </p>
          </motion.div>
        </motion.section>

        {/* ── GALERIE ── */}
        <section style={{ padding: isMobile ? "0 20px 100px" : "0 48px 120px", maxWidth: "1400px", margin: "0 auto" }}>
          
          {/* Filtres */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
            {FILTERS.map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "10px 24px", borderRadius: "100px", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: activeFilter === filter ? "#fff" : "rgba(255,255,255,0.03)",
                  color: activeFilter === filter ? "#000" : "rgba(255,255,255,0.5)",
                  border: `1px solid ${activeFilter === filter ? "#fff" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Bento Grid */}
          <div className="bento-grid">
            <AnimatePresence>
              {filteredWorks.map((work) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className={`size-${work.size} work-card`}
                  onClick={() => setSelectedWork(work)}
                  style={{ position: "relative", borderRadius: "24px", overflow: "hidden", cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  whileHover={{ y: -5, boxShadow: `0 20px 40px ${work.color}20`, borderColor: `${work.color}50` }}
                >
                  <GalleryImage src={work.image} alt={work.title} />
                  
                  {/* Overlay au survol */}
                  <div 
                    className="overlay"
                    style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px", opacity: 0, transition: "opacity 0.3s ease" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                          <span style={{ background: `${work.color}30`, color: work.color, padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${work.color}50` }}>
                            {work.category}
                          </span>
                          {work.type === "Vidéo" && <span style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 8px", borderRadius: "100px", backdropFilter: "blur(4px)" }}><Video size={12} /></span>}
                        </div>
                        <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, margin: 0 }}>
                          {work.title}
                        </h3>
                      </div>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                        {work.type === "Vidéo" ? <Play size={18} fill="#fff" /> : <Maximize2 size={18} />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* ── MODAL CINÉMATOGRAPHIQUE ── */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedWork(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}
          >
            {/* Bouton Fermer */}
            <button onClick={() => setSelectedWork(null)} style={{ position: "absolute", top: "24px", right: "24px", zIndex: 100, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", transition: "all 0.2s" }}>
              <X size={24} />
            </button>

            {/* Zone Image / Vidéo */}
            <div style={{ flex: isMobile ? "none" : 7, height: isMobile ? "50vh" : "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#000" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${selectedWork.image})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(100px)", opacity: 0.3 }} />
              
              <motion.img 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}
                src={selectedWork.image} alt={selectedWork.title} 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px", position: "relative", zIndex: 2, boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }} 
              />
              {selectedWork.type === "Vidéo" && (
                <div style={{ position: "absolute", zIndex: 3, width: "80px", height: "80px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer" }}>
                  <Play size={32} fill="#fff" color="#fff" style={{ marginLeft: "4px" }} />
                </div>
              )}
            </div>

            {/* Zone Informations */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: isMobile ? 1 : 3, background: "#0a0a0f", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: isMobile ? "32px 24px" : "60px 40px", display: "flex", flexDirection: "column", overflowY: "auto" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ background: `${selectedWork.color}20`, color: selectedWork.color, padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${selectedWork.color}40` }}>
                  {selectedWork.category}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {selectedWork.type === "Vidéo" ? <Video size={14}/> : <ImageIcon size={14}/>} {selectedWork.type}
                </span>
              </div>

              <h2 style={{ fontSize: "48px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 0.9, marginBottom: "40px" }}>
                {selectedWork.title}
              </h2>

              <div style={{ marginBottom: "40px" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#c9a84c", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                  <Code size={16} /> Prompt d'Intelligence Artificielle
                </h4>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                    "{selectedWork.prompt}"
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Palette size={14} /> Création Originale de la Guilde
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}