"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { Sparkles, X, ChevronLeft, ChevronRight, ZoomIn, Cpu } from "lucide-react";

// ─── DONNÉES ──────────────────────────────────────────────────────────────────

const ATELIER_DATA = [
  {
    id: 1,
    title: "Bash & Grazy",
    category: "Crossover",
    universe: "Jujutsu Kaisen",
    prompt: "Bash et Grazy en mode Jujutsu Kaisen, c'est mignon.",
    image: "/atelier/bash-grazy.png",
    accent: "#7c3aed",
    size: "large",
  },
  {
    id: 2,
    title: "Godwin & Traicy",
    category: "Crossover",
    universe: "Soul Eater",
    prompt: "Godwin et Traicy réimaginés dans l'univers de Soul Eater.",
    image: "/atelier/godwintraicy1.png",
    accent: "#dc2626",
    size: "tall",
  },
  {
    id: 3,
    title: "Le Don & Bash",
    category: "Crossover",
    universe: "Jujutsu Kaisen",
    prompt: "Bash et le Don plongés dans l'univers de Jujutsu Kaisen.",
    image: "/atelier/don-bashjjk.png",
    accent: "#0891b2",
    size: "wide",
  },
  {
    id: 4,
    title: "Godwin & Divine",
    category: "Crossover",
    universe: "Demon Slayer",
    prompt: "Godwin et Divine en mode Kimetsu no Yaiba.",
    image: "/atelier/godwin-divine.png",
    accent: "#059669",
    size: "normal",
  },
  {
    id: 5,
    title: "Floriane",
    category: "Personnage",
    universe: "Fullmetal Alchemist",
    prompt: "Floriane en Fullmetal Alchemist, net net.",
    image: "/atelier/florianemha.png",
    accent: "#d97706",
    size: "tall",
  },
  {
    id: 6,
    title: "Les Trix Otaku",
    category: "Groupe",
    universe: "Original",
    prompt: "La version Otaku des Trix.",
    image: "/atelier/trix.png",
    accent: "#c9a84c",
    size: "normal",
  },
  {
    id: 7,
    title: "Food Wars Otaku",
    category: "Concept",
    universe: "Shokugeki no Soma",
    prompt: "L'ambiance Food Wars au sein de la Guilde.",
    image: "/atelier/food.jpg",
    accent: "#e11d48",
    size: "large",
  },
  {
    id: 8,
    title: "Jise Ben",
    category: "Personnage",
    universe: "Solo Leveling",
    prompt: "Jise Ben qui farme l'aura façon Sung Jin-Woo.",
    image: "/atelier/jise-ben.png",
    accent: "#6d28d9",
    size: "normal",
  },
  {
    id: 9,
    title: "Godwin (Nagi)",
    category: "Personnage",
    universe: "Blue Lock",
    prompt: "Godwin avec le style et l'aura de Nagi.",
    image: "/atelier/godwin-nagi.png",
    accent: "#0284c7",
    size: "normal",
  },
  {
    id: 10,
    title: "Duel Food Wars",
    category: "Concept",
    universe: "Shokugeki no Soma",
    prompt: "Le grand duel de Grazy et Traicy sous Food Wars.",
    image: "/atelier/duel-food.png",
    accent: "#c9a84c",
    size: "wide",
  },
  {
    id: 11,
    title: "Godwin & Traicy JJK",
    category: "Crossover",
    universe: "Jujutsu Kaisen",
    prompt: "Godwin & Traicy dans Jujutsu Kaisen, ils ont l'air heureux.",
    image: "/atelier/godwintraicy2.png",
    accent: "#16a34a",
    size: "wide",
  },
];

const CATEGORIES = ["Tout", "Personnage", "Crossover", "Groupe", "Concept"];

// ─── STYLES CSS GLOBAUX ────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  .atelier-page {
    min-height: 100vh;
    background: #04040a;
    color: #fff;
    font-family: 'Barlow Condensed', sans-serif;
    overflow-x: hidden;
  }

  /* ── Bruit de fond ── */
  .atelier-noise {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  /* ── Orbes de fond animées ── */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    animation: orbFloat 18s ease-in-out infinite;
  }
  .orb-1 {
    width: 600px; height: 600px;
    top: -200px; left: -200px;
    background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
    animation-delay: 0s;
  }
  .orb-2 {
    width: 500px; height: 500px;
    bottom: -150px; right: -100px;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    animation-delay: -6s;
  }
  .orb-3 {
    width: 400px; height: 400px;
    top: 40%; left: 50%;
    background: radial-gradient(circle, rgba(8,145,178,0.10) 0%, transparent 70%);
    animation-delay: -12s;
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(40px, -30px) scale(1.05); }
    66%       { transform: translate(-20px, 20px) scale(0.97); }
  }

  /* ── Hero ── */
  .hero-kicker {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hero-kicker::before,
  .hero-kicker::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4));
  }
  .hero-kicker::after {
    background: linear-gradient(90deg, rgba(201,168,76,0.4), transparent);
  }

  .hero-title {
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: clamp(72px, 16vw, 180px);
    line-height: 0.85;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: #fff;
  }
  .hero-title .outline {
    -webkit-text-stroke: 2px rgba(255,255,255,0.25);
    color: transparent;
  }
  .hero-title .gold {
    color: #c9a84c;
  }

  /* ── Filtres ── */
  .filters-wrap {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .filter-btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 20px;
    border-radius: 100px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .filter-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.06);
  }
  .filter-btn.active {
    background: #c9a84c;
    border-color: #c9a84c;
    color: #000;
    box-shadow: 0 0 20px rgba(201,168,76,0.35);
  }

  /* ── Bento Grid ── */
  .bento {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 100px;
    gap: 14px;
  }

  /* Tailles desktop */
  @media (min-width: 768px) {
    .cell-large  { grid-column: span 8;  grid-row: span 5; }
    .cell-tall   { grid-column: span 4;  grid-row: span 5; }
    .cell-wide   { grid-column: span 8;  grid-row: span 3; }
    .cell-normal { grid-column: span 4;  grid-row: span 3; }
  }

  /* Mobile : tout en pleine largeur */
  @media (max-width: 767px) {
    .bento {
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 200px;
      gap: 10px;
    }
    .cell-large, .cell-wide {
      grid-column: span 2;
      grid-row: span 1;
    }
    .cell-tall, .cell-normal {
      grid-column: span 1;
      grid-row: span 1;
    }
  }

  /* ── Card ── */
  .bento-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.35s ease, box-shadow 0.35s ease;
  }
  .bento-card:hover {
    border-color: rgba(255,255,255,0.18);
  }
  .bento-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.7s cubic-bezier(0.4,0,0.2,1), filter 0.4s ease;
    filter: brightness(0.9) saturate(1.1);
  }
  .bento-card:hover img {
    transform: scale(1.06);
    filter: brightness(1) saturate(1.25);
  }

  /* Overlay gradient */
  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.4)  40%,
      transparent      70%
    );
    opacity: 0;
    transition: opacity 0.35s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
  }
  .bento-card:hover .card-overlay {
    opacity: 1;
  }

  /* Toujours visible sur mobile */
  @media (max-width: 767px) {
    .card-overlay {
      opacity: 1;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.85) 0%,
        rgba(0,0,0,0.2)  50%,
        transparent      80%
      );
    }
  }

  .card-cat {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
    margin-bottom: 8px;
    width: fit-content;
    border: 1px solid;
  }
  .card-title {
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: clamp(18px, 4vw, 28px);
    line-height: 1;
    color: #fff;
    letter-spacing: 0.02em;
  }
  .card-universe {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.1em;
    margin-top: 3px;
  }

  /* Icône zoom coin haut droit */
  .card-zoom {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.15);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .bento-card:hover .card-zoom {
    opacity: 1;
  }

  /* Barre couleur haut */
  .card-top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .bento-card:hover .card-top-bar {
    opacity: 1;
  }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.92);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-inner {
    position: relative;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    border-radius: 28px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 340px;
    background: #0a0a12;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 40px 80px rgba(0,0,0,0.8);
  }
  @media (max-width: 700px) {
    .modal-inner {
      grid-template-columns: 1fr;
      grid-template-rows: 55vw 1fr;
      max-height: 88vh;
      border-radius: 20px;
    }
    .modal-info {
      overflow-y: auto;
    }
  }

  .modal-img-wrap {
    position: relative;
    overflow: hidden;
  }
  .modal-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0.92) saturate(1.15);
  }
  .modal-img-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%);
    pointer-events: none;
  }

  .modal-info {
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: #0a0a12;
    overflow-y: auto;
  }
  @media (max-width: 700px) {
    .modal-info {
      padding: 20px;
      gap: 14px;
    }
  }

  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .modal-close:hover {
    background: rgba(255,255,255,0.15);
  }

  /* Flèches de navigation modal */
  .modal-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .modal-nav:hover { background: rgba(255,255,255,0.15); }
  .modal-nav-prev { left: 14px; }
  .modal-nav-next { right: 14px; }
  @media (max-width: 700px) {
    .modal-nav { display: none; }
  }

  /* Prompt box */
  .prompt-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 14px 16px;
  }
  .prompt-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 8px;
  }
  .prompt-text {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.75);
    line-height: 1.6;
    font-style: italic;
  }

  /* Compteur */
  .modal-counter {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.1em;
    text-align: center;
    margin-top: auto;
  }

  /* ── Stats bar en bas de page ── */
  .stats-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 28px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    gap: 16px 32px;
  }
  .stat-item {
    text-align: center;
  }
  .stat-num {
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: 40px;
    line-height: 1;
    color: #c9a84c;
    letter-spacing: 0.02em;
  }
  .stat-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }

  /* ── Scroll fade-in ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;
  }

  /* Numéro décoratif sur les cards */
  .card-num {
    position: absolute;
    top: 10px;
    left: 14px;
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.25);
    z-index: 2;
  }

  /* Indicateur de progression dans la modal */
  .progress-dots {
    display: flex;
    gap: 5px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 8px;
  }
  .progress-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    cursor: pointer;
    transition: all 0.25s ease;
    border: none;
    padding: 0;
  }
  .progress-dot.active {
    background: #c9a84c;
    box-shadow: 0 0 8px rgba(201,168,76,0.6);
    width: 18px;
    border-radius: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .orb { animation: none; }
    .bento-card img { transition: none; }
  }
`;

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────

function CategoryBadge({ cat, accent }: { cat: string; accent: string }) {
  return (
    <span
      className="card-cat"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}50`,
      }}
    >
      {cat}
    </span>
  );
}

function BentoCard({
  work,
  index,
  onClick,
}: {
  work: (typeof ATELIER_DATA)[0];
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      className={`bento-card cell-${work.size}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, delay: index * 0.045 }}
      whileHover={{ y: -3 }}
      style={{ boxShadow: `0 0 0 0px ${work.accent}` }}
    >
      {/* Barre couleur haut */}
      <div
        className="card-top-bar"
        style={{ background: `linear-gradient(90deg, ${work.accent}, ${work.accent}80)` }}
      />

      {/* Numéro */}
      <span className="card-num">#{String(work.id).padStart(2, "0")}</span>

      {/* Image */}
      <img src={work.image} alt={work.title} loading="lazy" />

      {/* Overlay */}
      <div className="card-overlay">
        <CategoryBadge cat={work.category} accent={work.accent} />
        <div className="card-title">{work.title}</div>
        <div className="card-universe">{work.universe}</div>
      </div>

      {/* Zoom icon */}
      <div className="card-zoom">
        <ZoomIn size={15} />
      </div>
    </motion.div>
  );
}

function Modal({
  works,
  currentIdx,
  onClose,
  onPrev,
  onNext,
  onGoto,
}: {
  works: (typeof ATELIER_DATA);
  currentIdx: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (i: number) => void;
}) {
  const work = works[currentIdx];

  // Fermer avec Escape, naviguer avec les flèches
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
      {/* Orbe de couleur derrière la modal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 50%, ${work.accent}15 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <motion.div
        className="modal-inner"
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 10, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: `${work.accent}30` }}
      >
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

          {/* Flèches nav */}
          <button className="modal-nav modal-nav-prev" onClick={onPrev} aria-label="Précédent">
            <ChevronLeft size={18} />
          </button>
          <button className="modal-nav modal-nav-next" onClick={onNext} aria-label="Suivant">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── INFOS ── */}
        <div className="modal-info">
          {/* Fermer */}
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>

          {/* Header */}
          <div>
            <CategoryBadge cat={work.category} accent={work.accent} />
            <div
              style={{
                fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
                fontSize: "clamp(28px, 6vw, 42px)",
                lineHeight: 0.95,
                color: "#fff",
                marginTop: "10px",
                letterSpacing: "0.02em",
              }}
            >
              {work.title}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: work.accent,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: "6px",
              }}
            >
              {work.universe}
            </div>
          </div>

          {/* Séparateur */}
          <div
            style={{
              height: "1px",
              background: `linear-gradient(90deg, ${work.accent}50, transparent)`,
            }}
          />

          {/* Prompt */}
          <div className="prompt-box">
            <div className="prompt-label">
              <Cpu size={12} />
              Prompt IA
            </div>
            <p className="prompt-text">"{work.prompt}"</p>
          </div>

          {/* Méta */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {[
              { label: "Univers", value: work.universe },
              { label: "Catégorie", value: work.category },
              { label: "Création", value: "Guilde Otaku" },
              { label: "ID", value: `#${String(work.id).padStart(2, "0")}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.04em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Points de navigation */}
          <div className="progress-dots">
            {works.map((_, i) => (
              <button
                key={i}
                className={`progress-dot ${i === currentIdx ? "active" : ""}`}
                onClick={() => onGoto(i)}
                aria-label={`Image ${i + 1}`}
                style={i === currentIdx ? { background: work.accent, boxShadow: `0 0 8px ${work.accent}60` } : {}}
              />
            ))}
          </div>

          <div className="modal-counter">
            {currentIdx + 1} / {works.length}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function AtelierPage() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [modalIdx, setModalIdx] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const filtered = ATELIER_DATA.filter(
    (w) => activeFilter === "Tout" || w.category === activeFilter
  );

  // Ouvrir la modal avec l'index dans le tableau filtered
  const openModal = (work: (typeof ATELIER_DATA)[0]) => {
    const idx = filtered.findIndex((w) => w.id === work.id);
    setModalIdx(idx);
  };

  const closeModal = () => setModalIdx(null);
  const prevModal = () =>
    setModalIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
  const nextModal = () =>
    setModalIdx((i) => (i === null ? null : (i + 1) % filtered.length));

  // Compter par catégorie
  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "Tout" ? ATELIER_DATA.length : ATELIER_DATA.filter((w) => w.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const universes = new Set(ATELIER_DATA.map((w) => w.universe)).size;

  return (
    <div className="atelier-page">
      <style>{CSS}</style>

      {/* ── FOND ── */}
      <div className="atelier-noise" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <GuildeHeader activePage="atelier" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <motion.section
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div
            style={{
              padding: "clamp(60px, 12vw, 120px) clamp(20px, 5vw, 64px) clamp(40px, 8vw, 80px)",
              maxWidth: "1200px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Kicker */}
              <p className="hero-kicker">
                <Sparkles size={13} />
                Galerie IA · Créations Originales
              </p>

              {/* Grand titre */}
              <h1 className="hero-title">
                <span className="outline">L'</span>
                <span className="gold">ATELIER</span>
                <br />
                <span className="outline">DE LA GUILDE</span>
              </h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  fontSize: "clamp(14px, 2.5vw, 18px)",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.45)",
                  maxWidth: "560px",
                  margin: "24px auto 0",
                  lineHeight: 1.6,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                L'espace où l'imagination Otaku prend vie.
                Chaque création est générée par Intelligence Artificielle
                à partir d'un prompt imaginé par la Guilde.
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* ══ STATS BAR ════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 clamp(20px, 5vw, 64px)",
          }}
        >
          <div className="stats-bar">
            {[
              { num: ATELIER_DATA.length, label: "Créations" },
              { num: universes, label: "Univers" },
              { num: CATEGORIES.length - 1, label: "Catégories" },
              { num: "100%", label: "IA Génératif" },
            ].map(({ num, label }) => (
              <div className="stat-item" key={label}>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ══ FILTRES ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: "40px clamp(20px, 5vw, 64px) 32px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div className="filters-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${activeFilter === cat ? "active" : ""}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
                {counts[cat] > 0 && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "10px",
                      opacity: 0.6,
                      fontWeight: 700,
                    }}
                  >
                    {counts[cat]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ══ BENTO GRID ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "0 clamp(20px, 5vw, 64px) 80px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
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
                <BentoCard
                  key={work.id}
                  work={work}
                  index={i}
                  onClick={() => openModal(work)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "20px",
                fontStyle: "italic",
              }}
            >
              Aucune création dans cette catégorie...
            </div>
          )}
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "32px clamp(20px, 5vw, 64px)",
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Guilde Otaku · Créations Originales 2025
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            <Cpu size={13} style={{ color: "#c9a84c" }} />
            Généré par IA
          </div>
        </div>
      </div>

      {/* ══ MODAL ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalIdx !== null && (
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