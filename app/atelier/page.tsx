"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { Sparkles, X, ChevronLeft, ChevronRight, ZoomIn, Cpu } from "lucide-react";

// ─── HOOK ─────────────────────────────────────────────────────────────────────
interface AtelierImage {
  filename: string;
  url: string;
  title: string;
}

function useAtelierImages() {
  const [images, setImages] = useState<AtelierImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atelier")
      .then(r => r.json())
      .then(data => { setImages(data.images ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { images, loading };
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ACCENT_POOL = [
  "#7c3aed","#dc2626","#0891b2","#059669",
  "#d97706","#c9a84c","#e11d48","#db2777",
];
const SIZE_POOL = ["large","tall","wide","normal","normal","normal","tall","wide"] as const;

// Seules 2 catégories utiles : "Tout" et "Création" (toutes les images sont "Création")
const CATEGORIES = ["Tout", "Création"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  .atelier-page {
    min-height: 100vh;
    background: #04040a;
    color: #fff;
    font-family: 'Barlow Condensed', sans-serif;
    overflow-x: hidden;
  }
  .atelier-noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }
  .orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; animation: orbFloat 18s ease-in-out infinite; }
  .orb-1 { width:600px;height:600px;top:-200px;left:-200px;background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%);animation-delay:0s; }
  .orb-2 { width:500px;height:500px;bottom:-150px;right:-100px;background:radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%);animation-delay:-6s; }
  .orb-3 { width:400px;height:400px;top:40%;left:50%;background:radial-gradient(circle,rgba(8,145,178,0.10) 0%,transparent 70%);animation-delay:-12s; }
  @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.05)}66%{transform:translate(-20px,20px) scale(0.97)} }

  .hero-kicker { font-size:11px;font-weight:900;letter-spacing:0.45em;text-transform:uppercase;color:#c9a84c;margin-bottom:16px;display:flex;align-items:center;gap:10px; }
  .hero-kicker::before,.hero-kicker::after { content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4)); }
  .hero-kicker::after { background:linear-gradient(90deg,rgba(201,168,76,0.4),transparent); }
  .hero-title { font-family:'Bebas Neue','Barlow Condensed',sans-serif;font-size:clamp(72px,16vw,180px);line-height:0.85;letter-spacing:-0.01em;text-transform:uppercase;color:#fff; }
  .hero-title .outline { -webkit-text-stroke:2px rgba(255,255,255,0.25);color:transparent; }
  .hero-title .gold { color:#c9a84c; }

  .filters-wrap { display:flex;gap:8px;flex-wrap:wrap;justify-content:center; }
  .filter-btn { font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:8px 20px;border-radius:100px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.45);cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1); }
  .filter-btn:hover { border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.06); }
  .filter-btn.active { background:#c9a84c;border-color:#c9a84c;color:#000;box-shadow:0 0 20px rgba(201,168,76,0.35); }

  /* ── BENTO GRID ── */
  .bento { display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:100px;gap:14px; }
  @media(min-width:768px){
    .cell-large{grid-column:span 8;grid-row:span 5}
    .cell-tall{grid-column:span 4;grid-row:span 5}
    .cell-wide{grid-column:span 8;grid-row:span 3}
    .cell-normal{grid-column:span 4;grid-row:span 3}
  }
  @media(max-width:767px){
    .bento{grid-template-columns:repeat(2,1fr);grid-auto-rows:200px;gap:10px}
    .cell-large,.cell-wide{grid-column:span 2;grid-row:span 1}
    .cell-tall,.cell-normal{grid-column:span 1;grid-row:span 1}
  }

  /* ── CARDS ── */
  .bento-card { position:relative;border-radius:20px;overflow:hidden;cursor:pointer;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);transition:border-color 0.35s ease,box-shadow 0.35s ease; }
  .bento-card:hover { border-color:rgba(255,255,255,0.18); }
  .bento-card img { width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.7s cubic-bezier(0.4,0,0.2,1),filter 0.4s ease;filter:brightness(0.9) saturate(1.1); }
  .bento-card:hover img { transform:scale(1.06);filter:brightness(1) saturate(1.25); }
  .card-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.4) 40%,transparent 70%);opacity:0;transition:opacity 0.35s ease;display:flex;flex-direction:column;justify-content:flex-end;padding:20px; }
  .bento-card:hover .card-overlay { opacity:1; }
  @media(max-width:767px){ .card-overlay{opacity:1;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 50%,transparent 80%)} }
  .card-cat { display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;padding:3px 10px;border-radius:100px;margin-bottom:8px;width:fit-content;border:1px solid; }
  .card-title { font-family:'Bebas Neue','Barlow Condensed',sans-serif;font-size:clamp(18px,4vw,28px);line-height:1;color:#fff;letter-spacing:0.02em; }
  .card-universe { font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:0.1em;margin-top:3px; }
  .card-zoom { position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.15);opacity:0;transition:opacity 0.3s ease; }
  .bento-card:hover .card-zoom { opacity:1; }
  .card-top-bar { position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity 0.35s ease; }
  .bento-card:hover .card-top-bar { opacity:1; }
  .card-num { position:absolute;top:10px;left:14px;font-family:'Bebas Neue','Barlow Condensed',sans-serif;font-size:11px;font-weight:900;letter-spacing:0.15em;color:rgba(255,255,255,0.25);z-index:2; }

  /* ── MODAL : bottom-sheet sur mobile, centré sur desktop ── */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.92);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: flex-end;   /* bottom-sheet mobile */
    justify-content: center;
    padding: 0;
  }
  @media(min-width:701px){
    .modal-backdrop { align-items: center; padding: 20px; }
  }

  .modal-inner {
    position: relative;
    width: 100%;
    max-width: 900px;
    background: #0a0a12;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 -20px 60px rgba(0,0,0,0.8);
    /* Mobile : bottom sheet avec coins arrondis en haut */
    border-radius: 24px 24px 0 0;
    max-height: 92dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  @media(min-width:701px){
    .modal-inner {
      border-radius: 28px;
      max-height: 88vh;
      display: grid;
      grid-template-columns: 1fr 340px;
      flex-direction: unset;
      box-shadow: 0 40px 80px rgba(0,0,0,0.8);
    }
  }

  /* Handle drag visible uniquement sur mobile */
  .modal-handle {
    width: 40px; height: 4px;
    background: rgba(255,255,255,0.18);
    border-radius: 2px;
    margin: 10px auto 0;
    flex-shrink: 0;
  }
  @media(min-width:701px){ .modal-handle { display: none; } }

  /* Image : hauteur fixe sur mobile, pleine hauteur sur desktop */
  .modal-img-wrap {
    position: relative; overflow: hidden;
    height: 55vw;
    min-height: 200px;
    max-height: 320px;
    flex-shrink: 0;
  }
  @media(min-width:701px){
    .modal-img-wrap { height: auto; max-height: none; min-height: unset; }
  }
  .modal-img-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    filter: brightness(0.92) saturate(1.15);
  }
  .modal-img-gradient {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,10,18,0.6) 0%, transparent 50%);
    pointer-events: none;
  }

  /* Infos : scrollables sur mobile */
  .modal-info {
    padding: 16px 20px 20px;
    display: flex; flex-direction: column; gap: 12px;
    background: #0a0a12;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    -webkit-overflow-scrolling: touch;
  }
  @media(min-width:701px){
    .modal-info { padding: 32px 28px; gap: 20px; overflow-y: auto; }
  }

  /* Bouton fermer : dans modal-info sur mobile, absolu sur desktop */
  .modal-close {
    position: absolute;
    top: 12px; right: 12px;
    z-index: 10;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.15); }

  /* Flèches nav (cachées mobile) */
  .modal-nav {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .modal-nav:hover { background: rgba(255,255,255,0.2); }
  .modal-nav-prev { left: 12px; }
  .modal-nav-next { right: 12px; }
  @media(max-width:700px){ .modal-nav { display: none; } }

  /* Navigation mobile : flèches en bas dans modal-info */
  .modal-nav-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 4px;
  }
  @media(min-width:701px){ .modal-nav-mobile { display: none; } }

  .modal-nav-mobile button {
    flex: 1;
    padding: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em;
    transition: all 0.2s;
  }
  .modal-nav-mobile button:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .prompt-box { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px; }
  .prompt-label { display:flex;align-items:center;gap:6px;font-size:10px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;margin-bottom:6px; }
  .prompt-text { font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);line-height:1.6;font-style:italic; }
  .modal-counter { font-size:11px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:0.1em;text-align:center; }

  .progress-dots { display:flex;gap:5px;justify-content:center;flex-wrap:wrap; }
  .progress-dot { width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15);cursor:pointer;transition:all 0.25s ease;border:none;padding:0; }
  .progress-dot.active { background:#c9a84c;box-shadow:0 0 8px rgba(201,168,76,0.6);width:18px;border-radius:3px; }

  .stats-bar { display:flex;align-items:center;justify-content:center;padding:28px 0;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;gap:16px 32px; }
  .stat-item { text-align:center; }
  .stat-num { font-family:'Bebas Neue','Barlow Condensed',sans-serif;font-size:40px;line-height:1;color:#c9a84c;letter-spacing:0.02em; }
  .stat-label { font-size:10px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:2px; }

  @media(prefers-reduced-motion:reduce){ .orb{animation:none} .bento-card img{transition:none} }
`;

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────
function CategoryBadge({ cat, accent }: { cat: string; accent: string }) {
  return (
    <span className="card-cat" style={{ color: accent, background: `${accent}18`, borderColor: `${accent}50` }}>
      {cat}
    </span>
  );
}

function BentoCard({ work, index, onClick }: { work: ReturnType<typeof buildWork>; index: number; onClick: () => void }) {
  return (
    <motion.div
      className={`bento-card cell-${work.size}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, delay: index * 0.045 }}
      whileHover={{ y: -3 }}
    >
      <div className="card-top-bar" style={{ background: `linear-gradient(90deg, ${work.accent}, ${work.accent}80)` }} />
      <span className="card-num">#{String(work.id).padStart(2, "0")}</span>
      <img src={work.image} alt={work.title} loading="lazy" />
      <div className="card-overlay">
        <CategoryBadge cat={work.category} accent={work.accent} />
        <div className="card-title">{work.title}</div>
        <div className="card-universe">{work.universe}</div>
      </div>
      <div className="card-zoom"><ZoomIn size={15} /></div>
    </motion.div>
  );
}

function Modal({ works, currentIdx, onClose, onPrev, onNext, onGoto }: {
  works: ReturnType<typeof buildWork>[];
  currentIdx: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (i: number) => void;
}) {
  const work = works[currentIdx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      {/* Orbe de couleur derrière */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 50%, ${work.accent}12 0%, transparent 60%)`, pointerEvents: "none" }} />

      <motion.div
        className="modal-inner"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: `${work.accent}30` }}
      >
        {/* Handle mobile */}
        <div className="modal-handle" />

        {/* ── IMAGE ── */}
        <div className="modal-img-wrap">
          <AnimatePresence mode="wait">
            <motion.img
              key={work.id}
              src={work.image}
              alt={work.title}
              initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>
          <div className="modal-img-gradient" />
          {/* Flèches desktop uniquement */}
          <button className="modal-nav modal-nav-prev" onClick={onPrev}><ChevronLeft size={18} /></button>
          <button className="modal-nav modal-nav-next" onClick={onNext}><ChevronRight size={18} /></button>
          {/* Bouton fermer sur l'image (desktop) */}
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── INFOS ── */}
        <div className="modal-info">

          {/* Header titre */}
          <div>
            <CategoryBadge cat={work.category} accent={work.accent} />
            <div style={{
              fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif",
              fontSize: "clamp(24px,6vw,40px)",
              lineHeight: 0.95, color: "#fff", marginTop: "8px", letterSpacing: "0.02em"
            }}>
              {work.title}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: work.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px" }}>
              {work.universe}
            </div>
          </div>

          {/* Séparateur coloré */}
          <div style={{ height: "1px", background: `linear-gradient(90deg, ${work.accent}50, transparent)`, flexShrink: 0 }} />

          {/* Prompt */}
          <div className="prompt-box">
            <div className="prompt-label"><Cpu size={12} />Prompt IA</div>
            <p className="prompt-text">"{work.prompt}"</p>
          </div>

          {/* Méta-données (2×2) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { label: "Univers", value: work.universe },
              { label: "Catégorie", value: work.category },
              { label: "Par", value: "Guilde Otaku" },
              { label: "ID", value: `#${String(work.id).padStart(2, "0")}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "3px" }}>{label}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Points de navigation + compteur */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
            <div className="progress-dots">
              {works.map((_, i) => (
                <button
                  key={i}
                  className={`progress-dot ${i === currentIdx ? "active" : ""}`}
                  onClick={() => onGoto(i)}
                  style={i === currentIdx ? { background: work.accent, boxShadow: `0 0 8px ${work.accent}60` } : {}}
                />
              ))}
            </div>
            <div className="modal-counter">{currentIdx + 1} / {works.length}</div>
          </div>

          {/* ── NAVIGATION MOBILE : flèches en bas ── */}
          <div className="modal-nav-mobile">
            <button onClick={onPrev}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <button onClick={onClose} style={{ flex: "none", padding: "10px 16px", background: `${work.accent}18`, borderColor: `${work.accent}40`, color: work.accent }}>
              Fermer
            </button>
            <button onClick={onNext}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function buildWork(img: AtelierImage, index: number) {
  return {
    id: index + 1,
    title: img.title,
    category: "Création",
    universe: "Guilde Otaku",
    prompt: `Génération IA : ${img.title}`,
    image: img.url,
    accent: ACCENT_POOL[index % ACCENT_POOL.length],
    size: SIZE_POOL[index % SIZE_POOL.length],
  };
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function AtelierPage() {
  const { images, loading } = useAtelierImages();
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [modalIdx, setModalIdx] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const allWorks = images.map((img, i) => buildWork(img, i));

  const filtered = activeFilter === "Tout"
    ? allWorks
    : allWorks.filter(w => w.category === activeFilter);

  const openModal = (work: ReturnType<typeof buildWork>) => {
    const idx = filtered.findIndex(w => w.id === work.id);
    setModalIdx(idx);
  };

  const closeModal = () => setModalIdx(null);
  const prevModal = () => setModalIdx(i => i === null ? null : (i - 1 + filtered.length) % filtered.length);
  const nextModal = () => setModalIdx(i => i === null ? null : (i + 1) % filtered.length);

  return (
    <div className="atelier-page">
      <style>{CSS}</style>
      <div className="atelier-noise" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <GuildeHeader activePage="atelier" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: "clamp(60px,12vw,120px) clamp(20px,5vw,64px) clamp(40px,8vw,80px)", maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}>
              <p className="hero-kicker"><Sparkles size={13} />Galerie IA · Créations Originales</p>
              <h1 className="hero-title">
                <span className="outline">L'</span>
                <span className="gold">ATELIER</span><br />
                <span className="outline">DE LA GUILDE</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 500, color: "rgba(255,255,255,0.45)", maxWidth: "560px", margin: "24px auto 0", lineHeight: 1.6, fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                L'espace où l'imagination de la guilde Otaku prend vie.
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* ── STATS BAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px,5vw,64px)" }}>
          <div className="stats-bar">
            {[
              { num: loading ? "..." : allWorks.length, label: "Créations" },
              { num: "IA", label: "Génération" },
              { num: "100%", label: "Original" },
              { num: "2025", label: "Saison" },
            ].map(({ num, label }) => (
              <div className="stat-item" key={label}>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FILTRES ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ padding: "40px clamp(20px,5vw,64px) 32px", maxWidth: "1200px", margin: "0 auto" }}>
          <div className="filters-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${activeFilter === cat ? "active" : ""}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── GRILLE ── */}
        <div style={{ padding: "0 clamp(20px,5vw,64px) 80px", maxWidth: "1200px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.25)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontStyle: "italic" }}>
              Chargement des créations...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.25)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontStyle: "italic" }}>
              Aucune création trouvée...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                className="bento"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filtered.map((work, i) => (
                  <BentoCard key={work.id} work={work} index={i} onClick={() => openModal(work)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px clamp(20px,5vw,64px)", maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
            Guilde Otaku Créations Originales 2025-26
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <Cpu size={13} style={{ color: "#c9a84c" }} /> Généré par IA
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {modalIdx !== null && filtered.length > 0 && (
          <Modal
            works={filtered}
            currentIdx={modalIdx}
            onClose={closeModal}
            onPrev={prevModal}
            onNext={nextModal}
            onGoto={setModalIdx}
          />
        )}
      </AnimatePresence>
    </div>
  );
}