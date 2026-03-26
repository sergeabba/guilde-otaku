"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { supabase } from "../../lib/supabase";
import {
  Star, BookOpen, Tv, Gamepad2, Film, Quote,
  Flame, Gem, Meh, TrendingDown, Search, X, Clock,
  Calendar, Hash, Play, ChevronRight,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Category = "Tout" | "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier     = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

interface OeuvreDB {
  id:            string;
  title:         string;
  type:          Category;
  tier:          Tier;
  cover_image:   string;
  banner_image:  string | null;
  score:         number;
  status:        string;
  synopsis:      string;
  year:          number;
  episodes:      number | null;
  genres:        string[] | null;
  studio:        string | null;
  created_at:    string;
}

interface OeuvreUI {
  id:           string;
  title:        string;
  category:     Category;
  tier:         Tier;
  year:         number;
  coverUrl:     string;
  bannerUrl:    string | null;
  status:       string;
  note:         number;
  synopsis:     string;
  episodes:     number | null;
  genres:       string[];
  studio:       string | null;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const BASH_CHRONIQUE = {
  title:   "Frieren : Beyond Journey's End",
  note:    9.8,
  excerpt: "Frieren ne ressemble à rien de ce qu'on a vu. Dans un genre saturé de power-ups et de tournois, Madhouse ose la lenteur, la mélancolie, la poésie pure. Chaque épisode est une gifle silencieuse qui te rappelle que la vie passe, que les gens qu'on aime disparaissent, et que le temps n'attend personne. La direction artistique est somptueuse, les silences parlent plus que les dialogues, et Frieren elle-même est l'un des personnages les plus singuliers de la décennie. Un chef-d'œuvre absolu. Le Bash l'a dit.",
  date:    "Chronique de Mars 2026",
};

const tierConfig: Record<Tier, { color: string; bg: string; icon: React.ReactNode; label: string; glow: string }> = {
  "Chef-d'œuvre": { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   icon: <Flame        size={16} />, label: "CHEFS-D'ŒUVRE", glow: "0 0 30px rgba(255,215,0,0.3)"       },
  "Pépite":       { color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: <Gem          size={16} />, label: "PÉPITES",       glow: "0 0 30px rgba(52,211,153,0.3)"      },
  "Bof":          { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: <Meh          size={16} />, label: "BOF",           glow: "0 0 30px rgba(148,163,184,0.2)"     },
  "Surcoté":      { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: <TrendingDown size={16} />, label: "SURCOTÉS",      glow: "0 0 30px rgba(248,113,113,0.3)"     },
  "A définir":    { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", icon: <Clock        size={16} />, label: "EN ATTENTE",    glow: "0 0 10px rgba(161,161,170,0.2)"     },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Anime":      { icon: <Tv        size={12} />, color: "#a78bfa" },
  "Manga":      { icon: <BookOpen  size={12} />, color: "#f472b6" },
  "Film/Série": { icon: <Film      size={12} />, color: "#60a5fa" },
  "Jeu Vidéo":  { icon: <Gamepad2  size={12} />, color: "#4ade80" },
};

const TIERS:      Tier[]     = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"];
const CATEGORIES: Category[] = ["Tout", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];

// ─── ENTRY CARD ──────────────────────────────────────────────────────────────

function EntryCard({ entry, index, onSelect }: { entry: OeuvreUI; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const tier = tierConfig[entry.tier] ?? tierConfig["A définir"];
  const cat  = categoryConfig[entry.category] ?? categoryConfig["Anime"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hovered ? tier.color + "70" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? tier.glow : "none",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        background: "#0d0d14",
      }}
    >
      {/* Ligne accent top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`, opacity: hovered ? 1 : 0.3, transition: "opacity 0.3s", zIndex: 3 }} />

      {/* Cover avec overlay gradient */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
        <img
          src={entry.coverUrl}
          alt={entry.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d14 0%, rgba(13,13,20,0.6) 50%, transparent 100%)" }} />

        {/* Badge catégorie */}
        <div style={{ position: "absolute", top: "10px", left: "10px", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: `1px solid ${cat.color}50`, borderRadius: "100px", padding: "3px 8px", zIndex: 2 }}>
          <span style={{ color: cat.color }}>{cat.icon}</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 700, color: cat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.category}</span>
        </div>

        {/* Note flottante */}
        <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", borderRadius: "100px", padding: "4px 8px", border: `1px solid ${tier.color}40`, zIndex: 2 }}>
          <Star size={10} fill={tier.color} color={tier.color} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, color: tier.color }}>{entry.note}</span>
        </div>
      </div>

      {/* Infos */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "6px" }}>
          {entry.title}
        </h3>

        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", marginBottom: "8px" }}>
          {entry.status}
          {entry.episodes ? ` · ${entry.episodes} ép.` : ""}
          {entry.year ? ` · ${entry.year}` : ""}
        </p>

        {/* Genres */}
        {entry.genres.length > 0 && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
            {entry.genres.slice(0, 3).map((g) => (
              <span key={g} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "100px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Tier badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {entry.tier}
          </span>
          <ChevronRight size={14} color={hovered ? tier.color : "rgba(255,255,255,0.2)"} style={{ transition: "color 0.3s" }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── MODAL ENTRY ─────────────────────────────────────────────────────────────

function EntryModal({ entry, onClose, isMobile }: { entry: OeuvreUI; onClose: () => void; isMobile: boolean }) {
  const tier = tierConfig[entry.tier] ?? tierConfig["A définir"];
  const cat  = categoryConfig[entry.category] ?? categoryConfig["Anime"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1,    y: 0   }}
        exit={{ scale: 0.92, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#0d0d14", border: `1px solid ${tier.color}40`, borderRadius: "24px", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: `${tier.glow}, 0 40px 80px rgba(0,0,0,0.8)` }}
      >
        {/* Banner / Cover hero */}
        <div style={{ position: "relative", height: "220px", overflow: "hidden", borderRadius: "24px 24px 0 0" }}>
          <img
            src={entry.bannerUrl || entry.coverUrl}
            alt={entry.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0d0d14 0%, rgba(13,13,20,0.3) 60%, transparent 100%)" }} />

          {/* Accent top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} />

          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
          >
            <X size={16} />
          </button>

          {/* Cover miniature superposée */}
          {entry.bannerUrl && (
            <div style={{ position: "absolute", bottom: "-30px", left: "24px", width: "80px", height: "110px", borderRadius: "10px", overflow: "hidden", border: `2px solid ${tier.color}60`, boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
              <img src={entry.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: entry.bannerUrl ? "44px 28px 28px" : "28px", paddingTop: entry.bannerUrl ? "44px" : "28px" }}>

          {/* Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30`, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {entry.tier}
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${cat.color}15`, border: `1px solid ${cat.color}40`, borderRadius: "100px", padding: "3px 8px" }}>
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 700, color: cat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.category}</span>
            </div>
          </div>

          {/* Titre */}
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "26px" : "34px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "6px" }}>
            {entry.title}
          </h2>

          {/* Méta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
            {entry.studio && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Play size={11} /> {entry.studio}
              </span>
            )}
            {entry.year > 0 && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={11} /> {entry.year}
              </span>
            )}
            {entry.episodes && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Hash size={11} /> {entry.episodes} épisodes
              </span>
            )}
          </div>

          {/* Note */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "14px", background: `${tier.color}08`, border: `1px solid ${tier.color}20`, borderRadius: "12px" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(entry.note / 2) ? tier.color : "transparent"} color={tier.color} />
              ))}
            </div>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, color: tier.color, lineHeight: 1 }}>{entry.note}</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>/10</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>Statut : {entry.status}</span>
          </div>

          {/* Genres */}
          {entry.genres.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
              {entry.genres.map((g) => (
                <span key={g} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", fontWeight: 500, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {entry.synopsis || "Aucun synopsis disponible."}
          </p>

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "14px", background: tier.color, border: "none", borderRadius: "12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}
          >
            FERMER
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function BibliothequePage() {
  const [oeuvres,      setOeuvres]      = useState<OeuvreDB[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier,     setActiveTier]     = useState<Tier | "Tous">("Tous");
  const [searchTerm,     setSearchTerm]     = useState("");
  const [isMobile,       setIsMobile]       = useState(false);
  const [selectedEntry,  setSelectedEntry]  = useState<OeuvreUI | null>(null);

  // Scroll parallax global (pas de target pour éviter le warning)
  const { scrollYProgress } = useScroll();
  const heroY       = useTransform(scrollYProgress, [0, 0.3],  ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    (async () => {
      const { data, error } = await supabase
        .from("bibliotheque")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setFetchError("Impossible de charger la bibliothèque. Réessaie plus tard.");
      } else if (data) {
        setOeuvres(data as OeuvreDB[]);
      }
      setLoading(false);
    })();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mapping BDD → UI propre, sans JSX dans le state
  const mappedEntries: OeuvreUI[] = oeuvres.map((db) => ({
    id:        db.id,
    title:     db.title,
    category:  db.type        ?? "Anime",
    tier:      db.tier        ?? "A définir",
    year:      db.year        ?? new Date(db.created_at).getFullYear(),
    coverUrl:  db.cover_image,
    bannerUrl: db.banner_image ?? null,
    status:    db.status      ?? "Terminé",
    note:      db.score       ?? 0,
    synopsis:  db.synopsis    ?? "",
    episodes:  db.episodes    ?? null,
    genres:    db.genres      ?? [],
    studio:    db.studio      ?? null,
  }));

  const filtered = mappedEntries.filter((e) => {
    const matchCat    = activeCategory === "Tout" || e.category === activeCategory;
    const matchTier   = activeTier     === "Tous" || e.tier     === activeTier;
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchTier && matchSearch;
  });

  const entriesByTier = TIERS.map((tier) => ({
    tier,
    items: filtered.filter((e) => e.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", overflowX: "hidden", position: "relative" }}>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .bash-shimmer {
          background: linear-gradient(90deg, #c9a84c 0%, #ffd700 30%, #fff 50%, #ffd700 70%, #c9a84c 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
        input::placeholder        { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* ── BACKGROUND MESH ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "40vw", background: "radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* ── HEADER ── */}
      <GuildeHeader activePage="bibliotheque" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section style={{ y: heroY, opacity: heroOpacity, position: "relative" }}>
          <div style={{ padding: isMobile ? "60px 20px 40px" : "90px 48px 60px", maxWidth: "1100px", margin: "0 auto" }}>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "16px" }}>
              Guilde Otaku · Saison 2025/26
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: isMobile ? "clamp(40px, 12vw, 64px)" : "clamp(72px, 9vw, 120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px" }}>
              LA <span style={{ color: "#c9a84c" }}>BIBLIOTHÈQUE</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontSize: "16px", fontWeight: 500, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", maxWidth: "480px", lineHeight: 1.5 }}>
              Les verdicts définitifs de la Guilde. Animes, mangas, films, séries et jeux vidéo jugés sans pitié.
            </motion.p>
          </div>
        </motion.section>

        {/* ── CHRONIQUE DU BASH ── */}
        <section style={{ padding: isMobile ? "0 20px 60px" : "0 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "32px", height: "3px", background: "#c9a84c", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase" }}>LES CHRONIQUES DU BASH</span>
            </div>
            <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(201,168,76,0.05) 100%)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "24px", padding: isMobile ? "28px 24px" : "48px 56px", backdropFilter: "blur(20px)" }}>
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #ffd700, #c9a84c, transparent)" }} />
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "40px", alignItems: isMobile ? "flex-start" : "center", position: "relative", zIndex: 2 }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  style={{ flexShrink: 0, width: isMobile ? "80px" : "120px", height: isMobile ? "80px" : "120px", borderRadius: "20px", overflow: "hidden", border: "2px solid rgba(201,168,76,0.4)", boxShadow: "0 20px 40px rgba(201,168,76,0.2)" }}>
                  <img src="/photos/bvsh.JPG" alt="BVSH" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                </motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", padding: "3px 10px", borderRadius: "100px" }}>✦ COUP DE CŒUR DU BASH</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.1em" }}>{BASH_CHRONIQUE.date}</span>
                  </div>
                  <h2 style={{ fontSize: isMobile ? "28px" : "44px", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", fontStyle: "italic", marginBottom: "6px" }}>
                    <span className="bash-shimmer">{BASH_CHRONIQUE.title}</span>
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px" }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#ffd700" color="#ffd700" />)}
                    <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffd700", marginLeft: "4px" }}>{BASH_CHRONIQUE.note}</span>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>/10</span>
                  </div>
                  <div style={{ position: "relative", paddingLeft: "20px", borderLeft: "3px solid rgba(201,168,76,0.4)" }}>
                    <Quote size={20} color="rgba(201,168,76,0.3)" style={{ position: "absolute", top: 0, left: "-10px", background: "#050508" }} />
                    <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 500, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, fontStyle: "italic" }}>{BASH_CHRONIQUE.excerpt}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── TIER LIST ── */}
        <section style={{ padding: isMobile ? "0 20px 80px" : "0 48px 100px", maxWidth: "1100px", margin: "0 auto" }}>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={{ width: "32px", height: "3px", background: "#c9a84c", borderRadius: "2px" }} />
            <span style={{ fontSize: "12px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase" }}>TIER LIST OTAKU</span>
          </motion.div>

          {/* Filtres */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>

            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input type="text" placeholder="Rechercher un titre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 36px 10px 38px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", outline: "none", letterSpacing: "0.05em", boxSizing: "border-box" }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filtre catégorie */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px", borderRadius: "100px", cursor: "pointer", background: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.04)", color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.5)", border: `1px solid ${activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, transition: "all 0.2s" }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtre tier */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(["Tous", ...TIERS] as const).map((t) => {
                const cfg      = t !== "Tous" ? tierConfig[t as Tier] : null;
                const isActive = activeTier === t;
                return (
                  <button key={t} onClick={() => setActiveTier(t as Tier | "Tous")}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px", borderRadius: "100px", cursor: "pointer", background: isActive ? (cfg ? cfg.color : "#c9a84c") : "rgba(255,255,255,0.04)", color: isActive ? "#000" : (cfg ? cfg.color : "rgba(255,255,255,0.5)"), border: `1px solid ${isActive ? (cfg ? cfg.color : "#c9a84c") : (cfg ? cfg.color + "30" : "rgba(255,255,255,0.08)")}`, transition: "all 0.2s" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Résultats */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeTier}-${searchTerm}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {loading && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ width: "40px", height: "40px", border: "3px solid rgba(201,168,76,0.2)", borderTop: "3px solid #c9a84c", borderRadius: "50%", margin: "0 auto 16px" }} />
                  <p style={{ color: "#c9a84c", fontSize: "16px", fontStyle: "italic", fontWeight: 600 }}>Chargement de la Bibliothèque...</p>
                </div>
              )}

              {!loading && fetchError && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#f87171", fontSize: "18px", fontStyle: "italic" }}>{fetchError}</div>
              )}

              {!loading && !fetchError && entriesByTier.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.2)", fontSize: "20px", fontStyle: "italic" }}>
                  Aucune œuvre trouvée dans ces filtres...
                </div>
              )}

              {!loading && !fetchError && entriesByTier.map(({ tier, items }) => {
                const cfg = tierConfig[tier as Tier];
                return (
                  <motion.div key={tier} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} style={{ marginBottom: "56px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "14px", borderBottom: `1px solid ${cfg.color}20` }}>
                      <div style={{ width: "6px", height: "32px", background: cfg.color, borderRadius: "3px", boxShadow: cfg.glow }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: cfg.color }}>
                        {cfg.icon}
                        <h2 style={{ fontSize: "30px", fontWeight: 900, color: cfg.color, textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic", lineHeight: 1 }}>{cfg.label}</h2>
                      </div>
                      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{items.length} titre{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(210px, 1fr))", gap: isMobile ? "10px" : "16px" }}>
                      <AnimatePresence>
                        {items.map((entry, i) => (
                          <EntryCard key={entry.id} entry={entry} index={i} onSelect={() => setSelectedEntry(entry)} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 48px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.25em", textTransform: "uppercase" }}>Guilde Otaku · Bibliothèque · Depuis 2020</p>
        </footer>
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} isMobile={isMobile} />
        )}
      </AnimatePresence>
    </div>
  );
}
