"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import GuildeHeader from "../components/GuildeHeader";
import { supabase } from "../../lib/supabase"; // 🔗 Connexion à ta base de données
import { 
  Star, BookOpen, Tv, Gamepad2, Film, Quote, Flame, Gem, Meh, TrendingDown, Search, X, Clock
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Category = "Tout" | "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

// ─── DATA CHRONIQUE DU BASH ──────────────────────────────────────────────────
const BASH_CHRONIQUE = {
  title: "Frieren : Beyond Journey's End",
  category: "Anime",
  note: 9.8,
  excerpt:
    "Frieren ne ressemble à rien de ce qu'on a vu. Dans un genre saturé de power-ups et de tournois, Madhouse ose la lenteur, la mélancolie, la poésie pure. Chaque épisode est une gifle silencieuse qui te rappelle que la vie passe, que les gens qu'on aime disparaissent, et que le temps n'attend personne. La direction artistique est somptueuse, les silences parlent plus que les dialogues, et Frieren elle-même est l'un des personnages les plus singuliers de la décennie. Un chef-d'œuvre absolu. Le Bash l'a dit.",
  date: "Chronique de Mars 2026",
};

// ─── CONFIG TIERS & CATEGORIES ───────────────────────────────────────────────
const tierConfig: Record<Tier, { color: string; bg: string; icon: React.ReactNode; label: string; glow: string }> = {
  "Chef-d'œuvre": { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   icon: <Flame size={16} />,       label: "CHEFS-D'ŒUVRE", glow: "0 0 30px rgba(255,215,0,0.3)" },
  "Pépite":       { color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: <Gem size={16} />,          label: "PÉPITES",       glow: "0 0 30px rgba(52,211,153,0.3)" },
  "Bof":          { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: <Meh size={16} />,          label: "BOF",           glow: "0 0 30px rgba(148,163,184,0.2)" },
  "Surcoté":      { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: <TrendingDown size={16} />, label: "SURCOTÉS",      glow: "0 0 30px rgba(248,113,113,0.3)" },
  "A définir":    { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", icon: <Clock size={16} />,        label: "EN ATTENTE",    glow: "0 0 10px rgba(161,161,170,0.2)" }, // Nouveau tier pour les ajouts récents
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Anime":      { icon: <Tv size={12} />,        color: "#a78bfa" },
  "Manga":      { icon: <BookOpen size={12} />,  color: "#f472b6" },
  "Film/Série": { icon: <Film size={12} />,       color: "#60a5fa" },
  "Jeu Vidéo":  { icon: <Gamepad2 size={12} />,  color: "#4ade80" },
};

const TIERS: Tier[] = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"];
const CATEGORIES: Category[] = ["Tout", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];

// ─── ENTRY CARD ──────────────────────────────────────────────────────────────
function EntryCard({ entry, index, onSelect }: { entry: any; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const tier = tierConfig[entry.tier as Tier] || tierConfig["A définir"];
  const cat = categoryConfig[entry.category] || categoryConfig["Anime"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        position: "relative",
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? tier.color + "60" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "16px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: hovered ? tier.glow : "none",
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-4px)" : "translateY(0px)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "2px", background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`, borderRadius: "0 0 4px 4px", opacity: hovered ? 1 : 0.4, transition: "opacity 0.3s" }} />

      {/* Rendu de l'image Supabase */}
      <div style={{ marginBottom: "12px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center" }}>
        {entry.cover}
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${cat.color}18`, border: `1px solid ${cat.color}40`, borderRadius: "100px", padding: "3px 8px", marginBottom: "10px" }}>
        <span style={{ color: cat.color }}>{cat.icon}</span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 700, color: cat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.category}</span>
      </div>

      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, color: "#fff", lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "6px" }}>
        {entry.title}
      </h3>

      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: "14px" }}>
        {entry.status} · {entry.year}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Star size={13} fill={tier.color} color={tier.color} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: tier.color, lineHeight: 1 }}>{entry.note}</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>/10</span>
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 800, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30`, padding: "3px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {entry.tier}
        </span>
      </div>
    </motion.div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function BibliothequePage() {
  const [oeuvres, setOeuvres] = useState<any[]>([]); // Données brutes de Supabase
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier, setActiveTier] = useState<Tier | "Tous">("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // 1. Récupérer les données au chargement
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    
    fetchOeuvres();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchOeuvres = async () => {
    const { data, error } = await supabase
      .from("bibliotheque")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOeuvres(data);
    }
    setLoading(false);
  };

  // 2. Transformer les données DB pour l'interface UI
  const mappedEntries = oeuvres.map((dbEntry) => ({
    id: dbEntry.id,
    title: dbEntry.title,
    category: dbEntry.type || "Anime",
    tier: dbEntry.tier || "A définir",
    year: new Date(dbEntry.created_at).getFullYear(),
    cover: <img src={dbEntry.cover_image} alt={dbEntry.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />,
    status: dbEntry.status || "Terminé",
    note: dbEntry.score || 0,
    synopsis: dbEntry.synopsis
  }));

  // 3. Appliquer les filtres
  const filtered = mappedEntries.filter((e) => {
    const matchCat = activeCategory === "Tout" || e.category === activeCategory;
    const matchTier = activeTier === "Tous" || e.tier === activeTier;
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
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bash-shimmer {
          background: linear-gradient(90deg, #c9a84c 0%, #ffd700 30%, #fff 50%, #ffd700 70%, #c9a84c 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
      `}</style>

      {/* ── BACKGROUND MESH ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "40vw", background: "radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' /%3E%3C/svg%3E\")" }} />
      </div>

      {/* ── HEADER ── */}
      <GuildeHeader activePage="bibliotheque" />
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: isMobile ? "60px 20px 40px" : "90px 48px 60px", maxWidth: "1100px", margin: "0 auto" }}>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "16px" }}
            >
              Guilde Otaku · Saison 2025/26
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: isMobile ? "clamp(40px, 12vw, 64px)" : "clamp(72px, 9vw, 120px)",
                fontWeight: 900, fontStyle: "italic", lineHeight: 0.9,
                textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px",
              }}
            >
              LA <span style={{ color: "#c9a84c" }}>BIBLIOTHÈQUE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ fontSize: "16px", fontWeight: 500, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", maxWidth: "480px", lineHeight: 1.5 }}
            >
              Les verdicts définitifs de la Guilde. Animes, mangas, films, séries et jeux vidéo jugés sans pitié.
            </motion.p>
          </div>
        </motion.section>

        {/* ── CHRONIQUE DU BASH ── */}
        <section style={{ padding: isMobile ? "0 20px 60px" : "0 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "32px", height: "3px", background: "#c9a84c", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase" }}>LES CHRONIQUES DU BASH</span>
            </div>

            <div style={{
              position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(201,168,76,0.05) 100%)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "24px",
              padding: isMobile ? "28px 24px" : "48px 56px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #ffd700, #c9a84c, transparent)" }} />

              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "40px", alignItems: isMobile ? "flex-start" : "center", position: "relative", zIndex: 2 }}>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    flexShrink: 0,
                    width: isMobile ? "80px" : "120px",
                    height: isMobile ? "80px" : "120px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "2px solid rgba(201,168,76,0.4)",
                    boxShadow: "0 20px 40px rgba(201,168,76,0.2)",
                  }}
                >
                  <img src="/photos/bvsh.JPG" alt="BVSH" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                </motion.div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", padding: "3px 10px", borderRadius: "100px" }}>
                      ✦ COUP DE CŒUR DU BASH
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.1em" }}>{BASH_CHRONIQUE.date}</span>
                  </div>

                  <h2 style={{ fontSize: isMobile ? "28px" : "44px", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", fontStyle: "italic", marginBottom: "6px" }}>
                    <span className="bash-shimmer">{BASH_CHRONIQUE.title}</span>
                  </h2>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#ffd700" color="#ffd700" />
                    ))}
                    <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffd700", marginLeft: "4px" }}>{BASH_CHRONIQUE.note}</span>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>/10</span>
                  </div>

                  <div style={{ position: "relative", paddingLeft: "20px", borderLeft: "3px solid rgba(201,168,76,0.4)" }}>
                    <Quote size={20} color="rgba(201,168,76,0.3)" style={{ position: "absolute", top: 0, left: "-10px", background: "#050508" }} />
                    <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 500, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, fontStyle: "italic" }}>
                      {BASH_CHRONIQUE.excerpt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── TIER LIST ── */}
        <section style={{ padding: isMobile ? "0 20px 80px" : "0 48px 100px", maxWidth: "1100px", margin: "0 auto" }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}
          >
            <div style={{ width: "32px", height: "3px", background: "#c9a84c", borderRadius: "2px" }} />
            <span style={{ fontSize: "12px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase" }}>TIER LIST OTAKU</span>
          </motion.div>

          {/* FILTERS */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                placeholder="Rechercher un titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px 10px 38px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "100px", color: "#fff",
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px",
                  outline: "none", letterSpacing: "0.05em",
                }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "8px 14px", borderRadius: "100px", cursor: "pointer",
                    background: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.04)",
                    color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tier filter */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(["Tous", ...TIERS] as const).map((t) => {
                const cfg = t !== "Tous" ? tierConfig[t as Tier] : null;
                const isActive = activeTier === t;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTier(t as Tier | "Tous")}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "8px 14px", borderRadius: "100px", cursor: "pointer",
                      background: isActive ? (cfg ? cfg.color : "#c9a84c") : "rgba(255,255,255,0.04)",
                      color: isActive ? "#000" : (cfg ? cfg.color : "rgba(255,255,255,0.5)"),
                      border: `1px solid ${isActive ? (cfg ? cfg.color : "#c9a84c") : (cfg ? cfg.color + "30" : "rgba(255,255,255,0.08)")}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* AFFICHAGE DES RÉSULTATS SUPABASE */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeTier}-${searchTerm}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#c9a84c", fontSize: "20px", fontStyle: "italic", fontWeight: "bold" }}>
                  Chargement de la Bibliothèque depuis Supabase...
                </div>
              ) : entriesByTier.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: "20px", fontStyle: "italic" }}>
                  Aucune œuvre trouvée dans ces filtres...
                </div>
              ) : (
                entriesByTier.map(({ tier, items }) => {
                  const cfg = tierConfig[tier as Tier];
                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.5 }}
                      style={{ marginBottom: "56px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "14px", borderBottom: `1px solid ${cfg.color}20` }}>
                        <div style={{ width: "6px", height: "32px", background: cfg.color, borderRadius: "3px", boxShadow: cfg.glow }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: cfg.color }}>
                          {cfg.icon}
                          <h2 style={{ fontSize: "30px", fontWeight: 900, color: cfg.color, textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic", lineHeight: 1 }}>
                            {cfg.label}
                          </h2>
                        </div>
                        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{items.length} titre{items.length > 1 ? "s" : ""}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(220px, 1fr))", gap: isMobile ? "10px" : "16px" }}>
                        <AnimatePresence>
                          {items.map((entry, i) => (
                            <EntryCard key={entry.id} entry={entry} index={i} onSelect={() => setSelectedEntry(entry)} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 48px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
            Guilde Otaku · Bibliothèque · Depuis 2020
          </p>
        </footer>
      </div>

      {/* ── MODAL ENTRY ── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0d0d14",
                border: `1px solid ${tierConfig[selectedEntry.tier as Tier].color}40`,
                borderRadius: "24px", padding: isMobile ? "28px 24px" : "40px",
                maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto",
                boxShadow: tierConfig[selectedEntry.tier as Tier].glow,
                position: "relative",
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
              >
                <X size={16} />
              </button>

              {/* Top accent */}
              <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "3px", background: `linear-gradient(90deg, transparent, ${tierConfig[selectedEntry.tier as Tier].color}, transparent)`, borderRadius: "0 0 4px 4px" }} />

              {/* Rendu de l'image */}
              <div style={{ marginBottom: "16px", color: "rgba(255,255,255,0.9)", display: "flex" }}>
                {selectedEntry.cover}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: tierConfig[selectedEntry.tier as Tier].color, background: tierConfig[selectedEntry.tier as Tier].bg, border: `1px solid ${tierConfig[selectedEntry.tier as Tier].color}30`, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {selectedEntry.tier}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {selectedEntry.category} · {selectedEntry.year}
                </span>
              </div>

              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "28px" : "36px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "8px" }}>
                {selectedEntry.title}
              </h2>

              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "20px", letterSpacing: "0.05em" }}>
                Statut : {selectedEntry.status}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                <Star size={18} fill={tierConfig[selectedEntry.tier as Tier].color} color={tierConfig[selectedEntry.tier as Tier].color} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "40px", fontWeight: 900, color: tierConfig[selectedEntry.tier as Tier].color, lineHeight: 1 }}>
                  {selectedEntry.note}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>/10</span>
              </div>

              {/* Affichage du Synopsis récupéré de l'API */}
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "28px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                {selectedEntry.synopsis || "Aucun synopsis disponible pour cette œuvre."}
              </p>

              <button
                onClick={() => setSelectedEntry(null)}
                style={{ width: "100%", padding: "14px", background: tierConfig[selectedEntry.tier as Tier].color, border: "none", borderRadius: "12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}
              >
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}