"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { Sparkles, X, ChevronLeft, ChevronRight, ZoomIn, Cpu, Image as ImageIcon } from "lucide-react";

// ─── HOOK ─────────────────────────────────────────────────────────────────────
interface AtelierImage {
  id: string | null;
  filename: string;
  url: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  universe: string;
  accent: string;
  size: string;
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
const CATEGORIES = ["Tout", "Création", "Portrait", "Scène", "VFX"];

// ─── CSS PREMIUM ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  .atelier-page {
    min-height: 100vh;
    background: #101014; /* Deep, almost absolute black */
    color: #fff;
    font-family: 'Barlow', sans-serif;
    overflow-x: clip;
    position: relative;
  }
  
  /* Animated Mesh Background */
  .mesh-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .mesh-blob {
    position: absolute;
    filter: blur(90px);
    opacity: 0.15;
    animation: blob-float 20s infinite alternate ease-in-out;
    border-radius: 50%;
  }
  .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #8b5cf6; }
  .blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: #3b82f6; animation-delay: -5s; }
  .blob-3 { top: 40%; left: 50%; width: 40vw; height: 40vw; background: #14b8a6; animation-delay: -10s; transform: translate(-50%, -50%); }
  
  @keyframes blob-float {
    0% { transform: scale(1) translate(0, 0); }
    50% { transform: scale(1.1) translate(5%, 5%); }
    100% { transform: scale(0.9) translate(-5%, -5%); }
  }

  .atelier-noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* Typography */
  .hero-kicker { 
    font-size: 12px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; 
    color: #8b5cf6; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 8px;
    background: rgba(139, 92, 246, 0.1); padding: 8px 16px; border-radius: 100px;
    border: 1px solid rgba(139, 92, 246, 0.2);
    backdrop-filter: blur(10px);
  }
  .hero-title { 
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif; 
    font-size: clamp(60px, 12vw, 140px); 
    line-height: 0.9; 
    letter-spacing: 0.02em; 
    text-transform: uppercase; 
    color: #fff; 
  }
  .hero-title .gradient-text {
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-title .outline { 
    -webkit-text-stroke: 1px rgba(255,255,255,0.3); 
    color: transparent; 
  }

  /* Filters */
  .filters-wrap { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .filter-btn { 
    font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; 
    padding: 10px 24px; border-radius: 100px; 
    border: 1px solid rgba(255,255,255,0.08); 
    background: rgba(255,255,255,0.02); 
    color: rgba(255,255,255,0.5); 
    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    backdrop-filter: blur(10px);
  }
  .filter-btn:hover { 
    border-color: rgba(255,255,255,0.2); color: #fff; background: rgba(255,255,255,0.05); 
    transform: translateY(-2px);
  }
  .filter-btn.active { 
    background: #fff; border-color: #fff; color: #000; box-shadow: 0 4px 20px rgba(255,255,255,0.15); 
  }

  /* Bento Grid */
  .bento { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 120px; gap: 20px; }
  @media(min-width: 1024px){
    .cell-large{ grid-column: span 8; grid-row: span 5; }
    .cell-tall{ grid-column: span 4; grid-row: span 5; }
    .cell-wide{ grid-column: span 8; grid-row: span 3; }
    .cell-normal{ grid-column: span 4; grid-row: span 3; }
  }
  @media(min-width: 768px) and (max-width: 1023px) {
    .bento { grid-auto-rows: 100px; }
    .cell-large, .cell-wide { grid-column: span 12; grid-row: span 4; }
    .cell-tall, .cell-normal { grid-column: span 6; grid-row: span 3; }
  }
  @media(max-width: 767px){
    .bento{ grid-template-columns: 1fr; grid-auto-rows: auto; gap: 16px; }
    .bento-card { aspect-ratio: 4/3; }
    .cell-large, .cell-tall, .cell-wide, .cell-normal { grid-column: span 1; grid-row: auto; }
  }

  /* Cards Premium */
  .bento-card { 
    position: relative; border-radius: 24px; overflow: hidden; cursor: pointer; 
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); 
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); 
  }
  .bento-card::before {
    content: ''; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(255,255,255,0.1), transparent);
    opacity: 0; transition: opacity 0.5s ease; z-index: 1; pointer-events: none;
  }
  .bento-card:hover { 
    border-color: rgba(255,255,255,0.15); transform: translateY(-8px);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5);
  }
  .bento-card:hover::before { opacity: 1; }
  .bento-card img { 
    width: 100%; height: 100%; object-fit: cover; display: block; 
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease; 
    filter: brightness(0.85) saturate(1.1); 
  }
  .bento-card:hover img { transform: scale(1.08); filter: brightness(1) saturate(1.2); }
  
  .card-overlay { 
    position: absolute; inset: 0; 
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%); 
    opacity: 0; transition: opacity 0.4s ease; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; z-index: 2;
  }
  .bento-card:hover .card-overlay { opacity: 1; }
  @media(max-width: 767px){ .card-overlay{ opacity: 1; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); } }
  
  .card-cat { 
    display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; 
    letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; 
    margin-bottom: 12px; width: fit-content; border: 1px solid; backdrop-filter: blur(8px);
  }
  .card-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(24px, 4vw, 36px); line-height: 1; color: #fff; letter-spacing: 0.02em; }
  .card-universe { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.6); margin-top: 6px; }
  
  .card-zoom { 
    position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; 
    background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; 
    color: #fff; border: 1px solid rgba(255,255,255,0.1); opacity: 0; transition: all 0.4s ease; transform: scale(0.8); z-index: 2;
  }
  .bento-card:hover .card-zoom { opacity: 1; transform: scale(1); }
  
  /* Top accent bar */
  .card-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; opacity: 0; transition: opacity 0.4s ease; z-index: 2; }
  .bento-card:hover .card-top-bar { opacity: 1; }
  
  .card-num { 
    position: absolute; top: 20px; left: 24px; font-family: 'Bebas Neue', sans-serif; 
    font-size: 14px; letter-spacing: 0.15em; color: rgba(255,255,255,0.4); z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  /* Modal Premium Apple-style */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(30px) saturate(140%);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    perspective: 1000px;
  }
  @media(max-width: 767px){ .modal-backdrop { padding: 0; align-items: flex-end; } }

  .modal-inner {
    position: relative; width: 100%; max-width: 1200px;
    background: rgba(10, 10, 15, 0.6);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1);
    border-radius: 24px; overflow: hidden; display: flex; flex-direction: column;
  }
  @media(min-width: 800px){
    .modal-inner { flex-direction: row; height: 85vh; border-radius: 32px; }
  }
  @media(max-width: 767px){
    .modal-inner { border-radius: 24px 24px 0 0; max-height: 90vh; }
  }

  .modal-img-wrap {
    position: relative; flex: 1.5; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  @media(max-width: 767px){ .modal-img-wrap { height: 45vh; flex: none; } }
  .modal-img-wrap img { width: 100%; height: 100%; object-fit: contain; }

  .modal-info {
    flex: 1; padding: 40px; display: flex; flex-direction: column; gap: 24px;
    background: rgba(20, 20, 28, 0.4); backdrop-filter: blur(20px);
    overflow-y: auto; webkit-overflow-scrolling: touch;
    border-left: 1px solid rgba(255,255,255,0.05);
  }
  @media(max-width: 767px){ .modal-info { padding: 24px; border-left: none; border-top: 1px solid rgba(255,255,255,0.05); } }

  .modal-close {
    position: absolute; top: 20px; right: 20px; z-index: 10;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.3s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }

  .modal-nav {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
    width: 50px; height: 50px; border-radius: 50%;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.3s;
  }
  .modal-nav:hover { background: rgba(255,255,255,0.15); transform: translateY(-50%) scale(1.05); }
  .modal-nav-prev { left: 20px; }
  .modal-nav-next { right: 20px; }
  @media(max-width: 767px){ .modal-nav { display: none; } }

  .prompt-box { 
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); 
    border-radius: 16px; padding: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  }
  .prompt-label { 
    display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; 
    letter-spacing: 0.1em; text-transform: uppercase; color: #a5b4fc; margin-bottom: 12px; 
  }
  .prompt-text { font-size: 15px; font-weight: 400; color: rgba(255,255,255,0.8); line-height: 1.6; font-style: italic; }

  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .meta-item { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.04); }
  .meta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
  .meta-value { font-size: 14px; font-weight: 600; color: #fff; }

  /* Stats Premium */
  .stats-bar { 
    display: flex; align-items: center; justify-content: space-around; padding: 40px; 
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); 
    border-radius: 24px; backdrop-filter: blur(10px); flex-wrap: wrap; gap: 20px; margin-bottom: 60px;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
  }
  .stat-item { text-align: center; }
  .stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 56px; line-height: 1; color: #fff; margin-bottom: 8px; }
  .stat-label { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); }

  /* Editorial artbook treatment: ink, paper, and a clean image-first gallery. */
  .mesh-bg { display: none; }
  .atelier-page .hero-kicker {
    border-radius: 0; color: #dfb75b; border-color: #b99b56;
    background: #211d16; backdrop-filter: none; font-weight: 900;
  }
  .atelier-page .hero-title { font-family: var(--font-barlow-condensed), Impact, sans-serif; font-weight: 900; font-style: italic; letter-spacing: -.04em; }
  .atelier-page .hero-title .gradient-text { background: none; -webkit-text-fill-color: #dfb75b; color: #dfb75b; }
  .atelier-page .hero-title .outline { -webkit-text-stroke: 1px #c8bdac; }
  .atelier-page .stats-bar { border-radius: 0; backdrop-filter: none; box-shadow: 6px 6px 0 #383026; border: 2px solid #74684e; background: #18171b; }
  .atelier-page .stat-num { font-family: var(--font-barlow-condensed), Impact, sans-serif; font-weight: 900; color: #dfb75b; }
  .atelier-page .filter-btn { border-radius: 0; backdrop-filter: none; border: 2px solid #615747; background: #18171b; color: #e7ddce; font-family: var(--font-barlow-condensed), Impact, sans-serif; font-size: 1rem; text-transform: uppercase; font-weight: 900; }
  .atelier-page .filter-btn.active { background: #dfb75b; color: #141114; border-color: #dfb75b; box-shadow: 3px 3px 0 #e7ddce; }
  .atelier-page .bento-card { display: block; width: 100%; text-align: left; padding: 0; font: inherit; color: inherit; border-radius: 0; border: 2px solid #766a54; }
  .atelier-page .bento-card:hover { border-color: #dfb75b; transform: translateY(-4px); box-shadow: 6px 6px 0 #dfb75b; }
  .atelier-page .bento-card:focus-visible { outline: 3px solid #dfb75b; outline-offset: 4px; }
  .atelier-page .bento-card:focus-visible .card-overlay { opacity: 1; }
  .atelier-page .bento-card:focus-visible .card-zoom { opacity: 1; transform: none; }
  .atelier-page .bento-card:hover::before { opacity: 0; }
  .atelier-page .card-cat { border-radius: 0; backdrop-filter: none; }
  .atelier-page .card-title { font-family: var(--font-barlow-condensed), Impact, sans-serif; font-weight: 900; font-style: italic; }
  .atelier-page .modal-inner { border-radius: 0; background: #141316; border: 2px solid #8e7852; }
  .atelier-page .modal-backdrop { backdrop-filter: blur(6px); }
  .atelier-page .modal-info { backdrop-filter: none; background: #19181b; }
  .atelier-page .modal-close { top: 10px; right: 10px; border-radius: 0; width: 44px; height: 44px; background: #272127; }
  .atelier-page .prompt-box, .atelier-page .meta-item { border-radius: 0; }
  @media (hover: none) { .atelier-page .card-overlay { opacity: 1; } .atelier-page .card-zoom { opacity: 1; transform: none; } }
  @media (max-width: 767px) {
    .atelier-page .filters-wrap { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; padding-bottom: 8px; }
    .atelier-page .filter-btn { white-space: nowrap; flex: none; scroll-snap-align: start; }
    .atelier-page .stats-bar { gap: 20px 10px; padding: 20px 12px; margin-bottom: 32px; }
    .atelier-page .stat-item { flex: 1 1 36%; }
    .atelier-page .stat-num { font-size: clamp(2rem, 10vw, 3.5rem); }
    .atelier-page .modal-img-wrap { height: 40svh; }
    .atelier-page .modal-info { padding: 20px; }
  }
  @media (max-width: 380px) { .atelier-page .meta-grid { grid-template-columns: 1fr; } }
  @media(prefers-reduced-motion: reduce){ 
    .mesh-blob { animation: none; }
    .bento-card, .bento-card img, .modal-backdrop, .modal-inner { transition: none; transform: none; } 
  }
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function BentoCard({ work, index, onClick }: { work: AtelierImage; index: number; onClick: () => void }) {
  const bentoClass = `cell-${work.size === "small" ? "normal" : work.size}`;
  return (
    <motion.button
      type="button"
      className={`bento-card ${bentoClass}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="card-top-bar" style={{ background: work.accent }} />
      <span className="card-num">#{index + 1}</span>
      
      <img src={work.url} alt={work.title} loading="lazy" />
      
      <div className="card-overlay">
        <span className="card-cat" style={{ color: work.accent, background: `${work.accent}1A`, borderColor: `${work.accent}4D` }}>
          {work.category}
        </span>
        <div className="card-title">{work.title}</div>
        <div className="card-universe">{work.universe}</div>
      </div>
      <div className="card-zoom" aria-hidden="true"><ZoomIn size={18} /></div>
    </motion.button>
  );
}

function Modal({ works, currentIdx, onClose, onPrev, onNext }: {
  works: AtelierImage[];
  currentIdx: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const work = works[currentIdx];
  const touchStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = oldOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const items = Array.from(modalRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"))
          .filter((element) => getComputedStyle(element).display !== "none");
        if (items.length) {
          const first = items[0];
          const last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Œuvre ${work.title}, ${currentIdx + 1} sur ${works.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        className="modal-inner"
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.95, rotateX: -10 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: `0 40px 100px -20px ${work.accent}40` }}
      >
        <div
          className="modal-img-wrap"
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const distance = event.changedTouches[0].clientX - touchStart.current;
            touchStart.current = null;
            if (Math.abs(distance) < 55) return;
            if (distance > 0) onPrev(); else onNext();
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={work.filename}
              src={work.url}
              alt={work.title}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>
          <button type="button" className="modal-nav modal-nav-prev" onClick={onPrev} aria-label="Œuvre précédente"><ChevronLeft size={24} /></button>
          <button type="button" className="modal-nav modal-nav-next" onClick={onNext} aria-label="Œuvre suivante"><ChevronRight size={24} /></button>
        </div>

        <div className="modal-info">
          <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Fermer la visionneuse"><X size={20} /></button>
          
          <div style={{ paddingRight: '40px' }}>
            <span className="card-cat" style={{ color: work.accent, background: `${work.accent}1A`, borderColor: `${work.accent}4D` }}>
              {work.category}
            </span>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 0.9, marginTop: "12px", letterSpacing: "0.02em" }}>
              {work.title}
            </h2>
            <p style={{ color: work.accent, fontSize: "16px", fontWeight: 600, letterSpacing: "0.05em", marginTop: "8px" }}>
              {work.universe}
            </p>
          </div>

          {work.description && (
             <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: 1.6, margin: "10px 0" }}>
                {work.description}
             </p>
          )}

          <div style={{ height: "1px", background: `linear-gradient(90deg, ${work.accent}50, transparent)`, margin: "8px 0" }} />

          <div className="prompt-box">
            <div className="prompt-label" style={{ color: work.accent }}><Cpu size={14} /> Prompt Source</div>
            <p className="prompt-text">"{work.prompt}"</p>
          </div>

          <div className="meta-grid">
            {[
              { label: "Fichier", value: work.filename },
              { label: "Catégorie", value: work.category },
              { label: "Univers", value: work.universe },
            ].map(({ label, value }) => (
              <div key={label} className="meta-item">
                <div className="meta-label">{label}</div>
                <div className="meta-value">{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
              {currentIdx + 1} / {works.length}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function AtelierPage() {
  const { images, loading } = useAtelierImages();
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [modalIdx, setModalIdx] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const filtered = activeFilter === "Tout" ? images : images.filter(w => w.category === activeFilter);

  const openModal = (work: AtelierImage) => {
    const idx = filtered.findIndex(w => w.filename === work.filename);
    setModalIdx(idx);
  };

  const closeModal = () => setModalIdx(null);
  const prevModal = () => setModalIdx(i => i === null ? null : (i - 1 + filtered.length) % filtered.length);
  const nextModal = () => setModalIdx(i => i === null ? null : (i + 1) % filtered.length);

  return (
    <div className="atelier-page">
      <style>{CSS}</style>
      
      <div className="atelier-noise" aria-hidden="true" />

      <GuildeHeader activePage="atelier" accentColor="#dfb75b" bgColor="#101014" tone="dark" />

      <main style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: "clamp(80px, 15vw, 160px) clamp(20px, 5vw, 64px) clamp(40px, 8vw, 80px)", maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <span className="hero-kicker"><Sparkles size={14} /> Intelligence Artificielle</span>
              <h1 className="hero-title">
                <span className="outline">L'</span><span className="gradient-text">ATELIER</span><br />
                <span className="outline">VISUEL</span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "32px auto 0", lineHeight: 1.6 }}
              >
                Explorez la galerie expérimentale de la Guilde Otaku. Des créations générées par IA, repoussant les frontières du design cinématique.
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* ── STATS BAR ── */}
        <div data-gk-motion="reveal" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="stats-bar">
            {[
              { num: loading ? "-" : images.length, label: "Œuvres uniques" },
              { num: loading ? "-" : new Set(images.map((image) => image.universe).filter(Boolean)).size, label: "Univers" },
              { num: loading ? "-" : new Set(images.map((image) => image.category).filter(Boolean)).size, label: "Catégories" },
              { num: "Guilde", label: "Collection" },
            ].map(({ num, label }) => (
              <div className="stat-item" key={label}>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── FILTRES ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ padding: "0 clamp(20px, 5vw, 64px) 40px", maxWidth: "1400px", margin: "0 auto" }}>
          <div className="filters-wrap">
            {CATEGORIES.map(cat => (
              <button type="button" key={cat} aria-pressed={activeFilter === cat} className={`filter-btn ${activeFilter === cat ? "active" : ""}`} onClick={() => setActiveFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── GRILLE ── */}
        <div data-gk-motion="reveal" style={{ padding: "0 clamp(20px, 5vw, 64px) 120px", maxWidth: "1400px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px 0", color: "rgba(255,255,255,0.4)" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ display: "inline-block", marginBottom: "16px" }}>
                <ImageIcon size={48} color="#8b5cf6" opacity={0.5} />
              </motion.div>
              <p style={{ fontSize: "18px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Génération de la galerie en cours...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", color: "rgba(255,255,255,0.4)", fontSize: "18px" }}>
              Aucune création dans cette catégorie.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div key={activeFilter} className="bento" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {filtered.map((work, i) => (
                  <BentoCard key={work.filename} work={work} index={i} onClick={() => openModal(work)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px clamp(20px, 5vw, 64px)", maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            © {new Date().getFullYear()} Guilde Otaku. Laboratoire Visuel.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <Cpu size={16} color="#8b5cf6" /> Synthèse Artificielle
          </div>
        </div>
      </main>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {modalIdx !== null && filtered.length > 0 && (
          <Modal works={filtered} currentIdx={modalIdx} onClose={closeModal} onPrev={prevModal} onNext={nextModal} />
        )}
      </AnimatePresence>
    </div>
  );
}