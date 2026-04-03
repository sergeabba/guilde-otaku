"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import GuildeHeader from "../components/GuildeHeader";
import OptimizedImage, { SkeletonCard } from "../components/OptimizedImage";
import { supabase } from "../../lib/supabase";
import { DOSSIER_BASH_DATA, normalizeDossierBashKey } from "../../lib/dossier-bash";
import { colors, typography, components, font, filterPillStyle, cardHoverStyle } from "../../outputs/styles/tokens";
import type { BiblioEntry, SupabaseBiblioRow, BiblioCategory, BiblioTier } from "../types";
import {
  Star, BookOpen, Tv, Gamepad2, Film, Quote, Flame, Gem, Meh,
  TrendingDown, Search, X, Clock, Calendar, Youtube, ArrowUpDown, Pencil
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Category = "Tout" | "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

// ─── CONFIG TIERS & CATÉGORIES ───────────────────────────────────────────────
const tierConfig: Record<Tier, { color: string; bg: string; icon: React.ReactNode; label: string; glow: string }> = {
  "Chef-d'œuvre": { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   icon: <Flame size={16} />,       label: "CHEFS-D'ŒUVRE", glow: "0 0 30px rgba(255,215,0,0.3)"   },
  "Pépite":       { color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: <Gem size={16} />,          label: "PÉPITES",       glow: "0 0 30px rgba(52,211,153,0.3)"  },
  "Bof":          { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: <Meh size={16} />,          label: "BOF",           glow: "0 0 30px rgba(148,163,184,0.2)" },
  "Surcoté":      { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: <TrendingDown size={16} />, label: "SURCOTÉS",      glow: "0 0 30px rgba(248,113,113,0.3)" },
  "A définir":    { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", icon: <Clock size={16} />,        label: "EN ATTENTE",    glow: "0 0 10px rgba(161,161,170,0.2)" },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Anime":      { icon: <Tv size={12} />,       color: "#a78bfa" },
  "Manga":      { icon: <BookOpen size={12} />, color: "#f472b6" },
  "Film/Série": { icon: <Film size={12} />,      color: "#60a5fa" },
  "Jeu Vidéo":  { icon: <Gamepad2 size={12} />, color: "#4ade80" },
};

const TIERS: Tier[] = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"];
const CATEGORIES: Category[] = ["Tout", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];

// ─── ENTRY CARD ──────────────────────────────────────────────────────────────
function EntryCard({ entry, index, onSelect }: { entry: any; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const tier = tierConfig[entry.tier as Tier] || tierConfig["A définir"];
  const cat  = categoryConfig[entry.category] || categoryConfig["Anime"];

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
       ...cardHoverStyle(hovered, (tier.color + "60") as any),
        cursor: "pointer",
        boxShadow: hovered ? tier.glow : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: "20px", right: "20px", height: "2px",
        background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
        borderRadius: "0 0 4px 4px",
        opacity: hovered ? 1 : 0.4, transition: "opacity 0.3s",
      }} />

      <div style={{ height: "200px", marginBottom: "12px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
        <OptimizedImage src={entry.cover_image} alt={entry.title} />
      </div>

      {/* Badge catégorie */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${cat.color}18`, border: `1px solid ${cat.color}40`, borderRadius: "100px", padding: "3px 8px", marginBottom: "10px" }}>
        <span style={{ color: cat.color }}>{cat.icon}</span>
        <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: cat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.category}</span>
      </div>

      <h3 style={{ fontFamily: font, fontSize: "18px", fontWeight: 900, color: colors.textPrimary, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "6px" }}>
        {entry.title}
      </h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
        <span style={{ ...typography.meta }}>
          {entry.status}{entry.year ? ` · ${entry.year}` : ""}
        </span>
        {entry.trailer_url && (
          <span style={{ ...components.tag, color: colors.youtube, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            ▶ Trailer
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Star size={13} fill={tier.color} color={tier.color} />
          <span style={{ fontFamily: font, fontSize: "22px", fontWeight: 900, color: tier.color, lineHeight: 1 }}>{entry.note}</span>
          <span style={{ ...typography.meta }}>/10</span>
        </div>
        <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 800, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30`, padding: "3px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {entry.tier}
        </span>
      </div>
    </motion.div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function BibliothequePage() {
  const [oeuvres, setOeuvres]           = useState<SupabaseBiblioRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [dossierBash, setDossierBash]   = useState(DOSSIER_BASH_DATA);
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier, setActiveTier]     = useState<Tier | "Tous">("Tous");
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortBy, setSortBy]             = useState("recent");
  const [isMobile, setIsMobile]         = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BiblioEntry | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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

      const dossierRows = data.filter((item) => item.dossier_bash === true);
      if (dossierRows.length > 0) {
        const dossierByKey = new Map(
          DOSSIER_BASH_DATA.flatMap((entry) => [
            [normalizeDossierBashKey(entry.title), entry],
            [normalizeDossierBashKey(entry.searchQuery), entry],
          ])
        );

        const hydratedDossier = dossierRows.map((item) => {
          const match = dossierByKey.get(normalizeDossierBashKey(item.title));
          return {
            ...match,
            searchQuery: match?.searchQuery ?? item.title,
            anilistId: match?.anilistId ?? 0,
            title: item.title,
            date: item.dossier_bash_date || match?.date || "",
            tag: item.dossier_bash_tag || match?.tag || "DOSSIER BASH",
            color: item.dossier_bash_color || match?.color || colors.gold,
            review: item.avis_guilde || match?.review || item.synopsis || "",
            cover: item.cover_image || match?.localCover || match?.cover || "",
            localCover: match?.localCover,
            trailer_url: item.trailer_url || match?.trailer_url || undefined,
          };
        });

        hydratedDossier.sort((a, b) => (a.date || "").localeCompare(b.date || "", "fr"));
        setDossierBash(hydratedDossier);
      }
    }

    setLoading(false);
  };


  const mappedEntries: BiblioEntry[] = oeuvres.map((d) => ({
    id:          d.id,
    title:       d.title,
    category:    (d.type as BiblioCategory | undefined) || "Anime",
    tier:        (d.tier as BiblioTier | undefined) || "A définir",
    year:        d.year || new Date(d.created_at).getFullYear(),
    cover_image: d.cover_image || "",
    status:      d.status || "Terminé",
    note:        d.score || 0,
    synopsis:    d.synopsis,
    avis_guilde: d.avis_guilde,
    trailer_url: d.trailer_url,
    created_at:  d.created_at,
  }));

  let filtered = mappedEntries.filter((e) => {
    const matchCat    = activeCategory === "Tout" || e.category === activeCategory;
    const matchTier   = activeTier === "Tous" || e.tier === activeTier;
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchTier && matchSearch;
  });

  filtered.sort((a, b) => {
    if (sortBy === "recent")  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === "oldest")  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortBy === "note")    return (Number(b.note) || 0) - (Number(a.note) || 0);
    if (sortBy === "alpha")   return a.title.localeCompare(b.title);
    return 0;
  });

  const entriesByTier = TIERS.map((tier) => ({
    tier,
    items: filtered.filter((e) => e.tier === tier),
  })).filter((g) => g.items.length > 0);

  // ─── STYLES LOCAUX (tokens) ──────────────────────────────────────────────
  const sectionAccentBar: React.CSSProperties = { width: "32px", height: "3px", background: colors.gold, borderRadius: "2px" };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font, overflowX: "hidden", position: "relative" }}>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.goldBorder}; border-radius: 2px; }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: `radial-gradient(circle, ${colors.goldLight} 0%, transparent 65%)`, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      <GuildeHeader activePage="bibliotheque" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ position: "relative", y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: isMobile ? "60px 20px 40px" : "90px 48px 60px", maxWidth: "1100px", margin: "0 auto" }}>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ ...typography.overline, marginBottom: "16px" }}>
              Guilde Otaku · Saison 2025/26
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: isMobile ? "clamp(40px,12vw,64px)" : "clamp(72px,9vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px" }}>
              LA <span style={{ color: colors.gold }}>BIBLIOTHÈQUE</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ ...typography.body, letterSpacing: "0.08em", maxWidth: "480px" }}>
              Les verdicts définitifs de la Guilde. Animes, mangas, films, séries et jeux vidéo jugés sans pitié.
            </motion.p>
          </div>
        </motion.section>

        {/* ── DOSSIER DU BASH ── */}
        <section style={{ padding: isMobile ? "0 20px 60px" : "0 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={sectionAccentBar} />
              <span style={{ ...typography.sectionLabel }}>LE DOSSIER DU BASH · PRINTEMPS 2026</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {dossierBash.map((anime, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.015, borderColor: anime.color }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    const dbMatch = mappedEntries.find(e => {
                      const normalizedTitle = normalizeDossierBashKey(e.title);
                      return normalizedTitle.includes(normalizeDossierBashKey(anime.searchQuery)) || normalizedTitle === normalizeDossierBashKey(anime.title);
                    });
                    setSelectedEntry({
                      id: -1,
                      title:       anime.title,
                      category:    "Anime" as BiblioCategory,
                      tier:        index === 0 ? "Chef-d'œuvre" : ("A définir" as BiblioTier),
                      year:        2026,
                      cover_image: anime.cover,
                      status:      "Saison Printemps",
                      note:        "✨",
                      avis_guilde: anime.review,
                      trailer_url: anime.trailer_url,
                      synopsis:    "Cette œuvre n'a pas encore sa fiche complète dans la base de données de la Guilde.",
                    });
                  }}
                  style={{
                    position: "relative", overflow: "hidden", cursor: "pointer",
                    background: index === 0
                      ? "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(74,222,128,0.05) 100%)"
                      : colors.bgCard,
                    border: `1px solid ${index === 0 ? "rgba(74,222,128,0.3)" : colors.border}`,
                    borderRadius: "24px",
                    padding: isMobile ? "28px 24px" : "40px",
                    backdropFilter: "blur(20px)",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "32px",
                    alignItems: isMobile ? "flex-start" : "center",
                  }}
                >
                  {/* Affiche */}
                  <div style={{ flexShrink: 0, width: isMobile ? "100%" : "320px", height: isMobile ? "auto" : "480px", aspectRatio: isMobile ? "2/3" : "auto", borderRadius: "16px", overflow: "hidden", border: `1px solid ${anime.color}40`, boxShadow: `0 20px 40px ${anime.color}30`, background: colors.bgCard, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {anime.cover
                      ? <OptimizedImage src={anime.cover} alt={anime.title} />
                      : <span style={{ ...typography.meta, fontStyle: "italic" }}>Chargement...</span>
                    }
                  </div>

                  {/* Texte */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 800, color: anime.color, letterSpacing: "0.15em", textTransform: "uppercase", background: `${anime.color}15`, border: `1px solid ${anime.color}30`, padding: "6px 14px", borderRadius: "100px" }}>
                        {anime.tag}
                      </span>
                      <span style={{ ...typography.meta, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                        {anime.date}
                      </span>
                    </div>

                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "32px" : "48px", fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", fontStyle: "italic", marginBottom: "24px", color: colors.textPrimary, letterSpacing: "-0.02em" }}>
                      {anime.title}
                    </h2>

                    <div style={{ position: "relative", paddingLeft: "28px", borderLeft: `4px solid ${anime.color}50`, marginBottom: "24px" }}>
                      <Quote size={24} color={`${anime.color}60`} style={{ position: "absolute", top: -4, left: "-14px", background: index === 0 ? "none" : colors.bg, padding: "2px" }} />
                      {anime.review.split("\n\n").map((para, pi) => (
                        <p key={pi} style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 500, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", marginBottom: pi === anime.review.split("\n\n").length - 1 ? 0 : "20px" }}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {anime.trailer_url && (
                      <a href={anime.trailer_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "rgba(248,113,113,0.1)", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: "10px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: colors.youtube, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none" }}>
                        <Youtube size={18} /> Voir le Trailer
                      </a>
                    )}

                    <div style={{ marginTop: "24px", ...typography.meta, fontStyle: "italic", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderTop: `1px solid ${colors.border}`, paddingTop: "12px" }}>
                      → Cliquer pour voir la fiche détaillée
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── TIER LIST ── */}
        <section style={{ padding: isMobile ? "0 20px 80px" : "0 48px 100px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={sectionAccentBar} />
            <span style={{ ...typography.sectionLabel }}>TIER LIST OTAKU</span>
          </motion.div>

          {/* FILTERS & SORT */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "40px", flexWrap: "wrap", alignItems: isMobile ? "stretch" : "center" }}>

            {/* Recherche */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
              <input type="text" placeholder="Rechercher un titre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...components.input, padding: "10px 14px 10px 38px", borderRadius: "100px" }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: colors.textMuted, cursor: "pointer", minHeight: "unset", minWidth: "unset" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Tri */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: colors.bgCard, border: `1px solid ${colors.border}`, padding: "8px 14px", borderRadius: "100px" }}>
              <ArrowUpDown size={14} color={colors.textSecondary} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ background: "transparent", border: "none", color: colors.textPrimary, fontFamily: font, fontSize: "14px", outline: "none", cursor: "pointer", textTransform: "uppercase", fontWeight: 700 }}>
                <option value="recent"  style={{ background: colors.bg }}>Plus récents</option>
                <option value="oldest"  style={{ background: colors.bg }}>Plus anciens</option>
                <option value="note"    style={{ background: colors.bg }}>Mieux notés</option>
                <option value="alpha"   style={{ background: colors.bg }}>De A à Z</option>
              </select>
            </div>

            {/* Catégories */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={filterPillStyle(activeCategory === cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RÉSULTATS */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeTier}-${searchTerm}-${sortBy}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(220px,1fr))", gap: isMobile ? "10px" : "16px" }}>
                  {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : entriesByTier.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", ...typography.body, fontSize: "20px", fontStyle: "italic" }}>
                  Aucune œuvre trouvée dans ces filtres...
                </div>
              ) : (
                entriesByTier.map(({ tier, items }) => {
                  const cfg = tierConfig[tier as Tier];
                  return (
                    <motion.div key={tier} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} style={{ marginBottom: "56px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "14px", borderBottom: `1px solid ${cfg.color}20` }}>
                        <div style={{ width: "6px", height: "32px", background: cfg.color, borderRadius: "3px", boxShadow: cfg.glow }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: cfg.color }}>
                          {cfg.icon}
                          <h2 style={{ fontFamily: font, fontSize: "30px", fontWeight: 900, color: cfg.color, textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic", lineHeight: 1 }}>{cfg.label}</h2>
                        </div>
                        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
                        <span style={{ ...typography.meta }}>{items.length} titre{items.length > 1 ? "s" : ""}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(220px,1fr))", gap: isMobile ? "10px" : "16px" }}>
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
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#0d0d14", border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}40`, borderRadius: "24px", padding: isMobile ? "28px 24px" : "40px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: tierConfig[selectedEntry.tier as Tier]?.glow, position: "relative" }}
            >
              <button onClick={() => setSelectedEntry(null)} style={{ position: "absolute", top: "16px", right: "16px", background: colors.bgHover, border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.textPrimary, minHeight: "unset", minWidth: "unset" }}>
                <X size={16} />
              </button>

              <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "3px", background: `linear-gradient(90deg, transparent, ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}, transparent)`, borderRadius: "0 0 4px 4px" }} />

              {/* Cover */}
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "180px", height: "250px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}40` }}>
                  <OptimizedImage src={selectedEntry.cover_image} alt={selectedEntry.title} />
                </div>
              </div>

              {/* Tier + catégorie */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, background: tierConfig[selectedEntry.tier as Tier]?.bg, border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}30`, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {selectedEntry.tier}
                </span>
                <span style={{ ...typography.meta }}>
                  {selectedEntry.category}{selectedEntry.year ? ` · ${selectedEntry.year}` : ""}
                </span>
              </div>

              <h2 style={{ fontFamily: font, fontSize: isMobile ? "28px" : "36px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "8px", textAlign: "center" }}>
                {selectedEntry.title}
              </h2>

              <p style={{ ...typography.meta, marginBottom: "20px", textAlign: "center" }}>
                Statut : {selectedEntry.status}
              </p>

              {/* Note */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                <Star size={18} fill={tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold} color={tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold} />
                <span style={{ fontFamily: font, fontSize: "40px", fontWeight: 900, color: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, lineHeight: 1 }}>
                  {selectedEntry.note}
                </span>
                <span style={{ ...typography.meta, fontSize: "16px" }}>/10</span>
              </div>

              {/* Avis guilde */}
              {selectedEntry.avis_guilde && (
                <div style={{ marginBottom: "24px", padding: "20px", background: colors.goldLight, borderLeft: `4px solid ${colors.gold}`, borderRadius: "0 12px 12px 0" }}>
                  <p style={{ fontFamily: font, fontSize: "14px", color: colors.gold, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>L'Avis de la Guilde</p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 500, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", fontStyle: "italic" }}>"{selectedEntry.avis_guilde}"</p>
                </div>
              )}

              {/* Synopsis */}
              <div style={{ marginBottom: "28px", padding: "20px", background: colors.bgCard, borderRadius: "12px", border: `1px solid ${colors.border}` }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "15px" : "16px", fontWeight: 400, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
                  {selectedEntry.synopsis || "Aucun synopsis disponible pour cette œuvre."}
                </p>
              </div>

              {/* Trailer */}
              {selectedEntry.trailer_url && (
                <a href={selectedEntry.trailer_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.youtube, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginBottom: "12px" }}>
                  <Youtube size={18} /> Voir le Trailer
                </a>
              )}

              {/* Éditer */}
              <Link href="/admin-biblio"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", background: colors.goldLight, border: `1px solid ${colors.goldBorder}`, borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.gold, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginBottom: "12px" }}>
                <Pencil size={18} /> Éditer la Fiche
              </Link>

              {/* Fermer */}
              <button onClick={() => setSelectedEntry(null)}
                style={{ width: "100%", padding: "14px", background: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, border: "none", borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}