"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { supabase } from "../../lib/supabase";
import { 
  Star, BookOpen, Tv, Gamepad2, Film, Quote, Flame, Gem, Meh, TrendingDown, Search, X, Clock, Calendar
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Category = "Tout" | "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

// ─── TEXTES DU DOSSIER BASH ──
const DOSSIER_BASH_DATA = [
  {
    searchQuery: "Snowball Earth", 
    title: "Snowball Earth",
    date: "03 Avril 2026",
    tag: "COUP DE CŒUR ABSOLU ",
    color: "#4ade80",
    review: "J'ai juste pas d'autres mots pour décrire ce que j'ai ressenti devant ce bail : c'est juste ÉPIQUE. On suit Tetsuo, un garçon timide, et son robot géant Yukio qui combattent des monstres spatiaux. Après la bataille finale, Tetsuo retourne sur Terre et la trouve recouverte de glace.\n\nCe sera une histoire touchante sur l'amitié, la survie, la résilience et le dépassement de soi. L'œuvre est recommandée par ONE et Hideo Kojima. L'animation donne terriblement envie. Mention spéciale pour l'opening de TUKI et l'ending de Ai Higuchi qui seront dans mon top de la saison !",
    cover: "" 
  },
  {
    searchQuery: "Reincarnation no Kaben", 
    title: "Petals of Reincarnation",
    date: "02 Avril 2026",
    tag: "L'ANIME À SUIVRE ",
    color: "#f472b6",
    review: "On suivra TOUYA Senji, un lycéen qui ne recherche qu'une seule chose : son talent. Il se fait secourir par Haito qui lui explique qu'il peut retrouver le talent d'une de ses anciennes vies : la réincarnation.\n\nPourquoi j'en parle depuis longtemps ? La D.A est sublime et épurée. L'histoire est super intéressante car il va affronter des figures historiques (Newton, Hitler, Nostradamus...). Si l'animation suit, on tient là un anime super prometteur qui fera du bruit.",
    cover: ""
  },
  {
    searchQuery: "Killed in Action Detective", 
    title: "Killed Again, Mr. Detective",
    date: "02 Avril 2026",
    tag: "INTRIGUANT ",
    color: "#60a5fa",
    review: "Killed Again, Mr Detective va ouvrir le bal. Le concept est particulier : on suit un jeune lycéen doté d'une capacité exceptionnelle : il peut revenir à la vie après avoir été tué. Il se retrouvera impliqué dans des affaires louches et mourra plein de fois.\n\nLe plot de départ est suffisamment consistant pour 13 épisodes. La bande-son est sympa, avec des morceaux de jazz et une ambiance film policier à l'ancienne.",
    cover: ""
  },
  {
    searchQuery: "Monster Eater",
    title: "Monster EATER",
    date: "02 Avril 2026",
    tag: "LE PLUS SINGULIER ",
    color: "#ffd700",
    review: "L'anime le plus singulier de la saison. L'animation est étrange, on a l'impression de voir des planches bouger... Mais le scénario est cool : Rudd, un aventurier faible, se fait trahir et se retrouve forcé de manger des monstres, ce qui le rend surpuissant !\n\nTrope basique d'un isekai sur un gars qui devient cheaté, c'est toujours intéressant. Le webtoon d'origine semble assez prometteur, donc pourquoi pas !",
    cover: ""
  }
];

// ─── CONFIG TIERS & CATEGORIES ───────────────────────────────────────────────
const tierConfig: Record<Tier, { color: string; bg: string; icon: React.ReactNode; label: string; glow: string }> = {
  "Chef-d'œuvre": { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   icon: <Flame size={16} />,       label: "CHEFS-D'ŒUVRE", glow: "0 0 30px rgba(255,215,0,0.3)" },
  "Pépite":       { color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: <Gem size={16} />,          label: "PÉPITES",       glow: "0 0 30px rgba(52,211,153,0.3)" },
  "Bof":          { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: <Meh size={16} />,          label: "BOF",           glow: "0 0 30px rgba(148,163,184,0.2)" },
  "Surcoté":      { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: <TrendingDown size={16} />, label: "SURCOTÉS",      glow: "0 0 30px rgba(248,113,113,0.3)" },
  "A définir":    { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", icon: <Clock size={16} />,        label: "EN ATTENTE",    glow: "0 0 10px rgba(161,161,170,0.2)" },
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
        {entry.status} {entry.year ? `· ${entry.year}` : ""}
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
  const [oeuvres, setOeuvres] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [dossierBash, setDossierBash] = useState(DOSSIER_BASH_DATA);
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier, setActiveTier] = useState<Tier | "Tous">("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    
    fetchOeuvres();
    fetchDossierCovers(); 

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

  const fetchDossierCovers = async () => {
    const updatedDossier = await Promise.all(
      DOSSIER_BASH_DATA.map(async (item) => {
        try {
          const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query($search: String) { Media(search: $search, sort: SEARCH_MATCH) { coverImage { extraLarge } } }`,
              variables: { search: item.searchQuery }
            })
          });
          const json = await res.json();
          const fetchedCover = json?.data?.Media?.coverImage?.extraLarge;
          const fallbackImage = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop";
          return { ...item, cover: fetchedCover || fallbackImage };
        } catch (e) {
          return item;
        }
      })
    );
    setDossierBash(updatedDossier);
  };

  const mappedEntries = oeuvres.map((dbEntry) => ({
    id: dbEntry.id,
    title: dbEntry.title,
    category: dbEntry.type || "Anime",
    tier: dbEntry.tier || "A définir",
    year: dbEntry.year || new Date(dbEntry.created_at).getFullYear(),
    cover: <img src={dbEntry.cover_image} alt={dbEntry.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />,
    status: dbEntry.status || "Terminé",
    note: dbEntry.score || 0,
    synopsis: dbEntry.synopsis,
    avis_guilde: dbEntry.avis_guilde,
    trailer_url: dbEntry.trailer_url
  }));

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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
      `}</style>

      {/* ── BACKGROUND MESH ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

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

        {/* ── DOSSIER SPÉCIAL DU BASH ── */}
        <section style={{ padding: isMobile ? "0 20px 60px" : "0 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={{ width: "32px", height: "3px", background: "#c9a84c", borderRadius: "2px" }} />
              <span style={{ fontSize: "14px", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase" }}>LE DOSSIER DU BASH · PRINTEMPS 2026</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {dossierBash.map((anime, index) => (
                <motion.div 
                  key={index} 
                  whileHover={{ scale: 1.015, borderColor: anime.color }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    // Magie noire : On vérifie si l'anime est déjà dans ta base de données Supabase !
                    const dbMatch = mappedEntries.find(e => 
                      e.title.toLowerCase().includes(anime.searchQuery.toLowerCase()) || 
                      e.title.toLowerCase() === anime.title.toLowerCase()
                    );

                    if (dbMatch) {
                      // Si oui, on affiche la vraie fiche !
                      setSelectedEntry(dbMatch);
                    } else {
                      // Si non, on génère une fiche d'attente stylée avec la note "HYPE"
                      setSelectedEntry({
                        title: anime.title,
                        category: "Anime",
                        tier: index === 0 ? "Chef-d'œuvre" : "A définir",
                        year: 2026,
                        cover: <img src={anime.cover} alt={anime.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />,
                        status: "Saison Printemps",
                        note: "✨", // Petite fantaisie pour les animes non notés
                        avis_guilde: anime.review,
                        synopsis: "Cette œuvre n'a pas encore sa fiche complète dans la base de données de la Guilde. Fais confiance à l'avis du Bash en attendant !"
                      });
                    }
                  }}
                  style={{
                    position: "relative", overflow: "hidden", cursor: "pointer",
                    background: index === 0 ? "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(74,222,128,0.05) 100%)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${index === 0 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "24px",
                    padding: isMobile ? "28px 24px" : "40px",
                    backdropFilter: "blur(20px)",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "32px"
                  }}
                >
                  
                  {/* L'Affiche de l'Anime */}
                  <div style={{ flexShrink: 0, width: isMobile ? "100%" : "200px", height: isMobile ? "300px" : "280px", borderRadius: "16px", overflow: "hidden", border: `1px solid ${anime.color}40`, boxShadow: `0 10px 30px ${anime.color}20`, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {anime.cover ? (
                      <img src={anime.cover} alt={anime.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic", fontSize: "12px" }}>Chargement...</span>
                    )}
                  </div>

                  {/* Le Texte de la Chronique */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: anime.color, letterSpacing: "0.15em", textTransform: "uppercase", background: `${anime.color}15`, border: `1px solid ${anime.color}30`, padding: "4px 12px", borderRadius: "100px" }}>
                        {anime.tag}
                      </span>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.1em" }}>
                        <Calendar size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle", marginTop: "-2px" }}/> 
                        {anime.date}
                      </span>
                    </div>

                    <h2 style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 900, lineHeight: 1, textTransform: "uppercase", fontStyle: "italic", marginBottom: "20px", color: "#fff" }}>
                      {anime.title}
                    </h2>

                    <div style={{ position: "relative", paddingLeft: "24px", borderLeft: `3px solid ${anime.color}50` }}>
                      <Quote size={20} color={`${anime.color}40`} style={{ position: "absolute", top: 0, left: "-11px", background: index === 0 ? "none" : "#050508", padding: "2px" }} />
                      
                      {anime.review.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} style={{ fontSize: "15px", fontWeight: 500, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: pIndex === anime.review.split('\n\n').length - 1 ? 0 : "16px" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: "24px", fontSize: "12px", color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontWeight: "bold" }}>
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
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input type="text" placeholder="Rechercher un titre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", outline: "none", letterSpacing: "0.05em" }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px", borderRadius: "100px", cursor: "pointer", background: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.04)", color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.5)", border: `1px solid ${activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, transition: "all 0.2s" }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(["Tous", ...TIERS] as const).map((t) => {
                const cfg = t !== "Tous" ? tierConfig[t as Tier] : null;
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

          {/* RÉSULTATS SUPABASE */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeTier}-${searchTerm}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#c9a84c", fontSize: "20px", fontStyle: "italic", fontWeight: "bold" }}>
                  Chargement de la Bibliothèque...
                </div>
              ) : entriesByTier.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: "20px", fontStyle: "italic" }}>
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
                          <h2 style={{ fontSize: "30px", fontWeight: 900, color: cfg.color, textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic", lineHeight: 1 }}>{cfg.label}</h2>
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
      </div>

      {/* ── MODAL ENTRY ── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEntry(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}
              style={{ background: "#0d0d14", border: `1px solid ${tierConfig[selectedEntry.tier as Tier].color}40`, borderRadius: "24px", padding: isMobile ? "28px 24px" : "40px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: tierConfig[selectedEntry.tier as Tier].glow, position: "relative" }}
            >
              <button onClick={() => setSelectedEntry(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <X size={16} />
              </button>

              <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "3px", background: `linear-gradient(90deg, transparent, ${tierConfig[selectedEntry.tier as Tier].color}, transparent)`, borderRadius: "0 0 4px 4px" }} />

              <div style={{ marginBottom: "16px", color: "rgba(255,255,255,0.9)", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "180px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${tierConfig[selectedEntry.tier as Tier].color}40`, boxShadow: `0 10px 30px ${tierConfig[selectedEntry.tier as Tier].color}20` }}>
                  {selectedEntry.cover}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 800, color: tierConfig[selectedEntry.tier as Tier].color, background: tierConfig[selectedEntry.tier as Tier].bg, border: `1px solid ${tierConfig[selectedEntry.tier as Tier].color}30`, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {selectedEntry.tier}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {selectedEntry.category} {selectedEntry.year ? `· ${selectedEntry.year}` : ""}
                </span>
              </div>

              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? "28px" : "36px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "8px", textAlign: "center" }}>
                {selectedEntry.title}
              </h2>

              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "20px", letterSpacing: "0.05em", textAlign: "center" }}>
                Statut : {selectedEntry.status}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                <Star size={18} fill={tierConfig[selectedEntry.tier as Tier].color} color={tierConfig[selectedEntry.tier as Tier].color} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "40px", fontWeight: 900, color: tierConfig[selectedEntry.tier as Tier].color, lineHeight: 1 }}>
                  {selectedEntry.note}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>/10</span>
              </div>

              {selectedEntry.avis_guilde && (
                <div style={{ marginBottom: "24px", padding: "20px", background: "rgba(201,168,76,0.08)", borderLeft: "4px solid #c9a84c", borderRadius: "0 12px 12px 0" }}>
                  <p style={{ fontSize: "11px", color: "#c9a84c", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>L'Avis de la Guilde</p>
                  <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", lineHeight: 1.6, fontStyle: "italic" }}>"{selectedEntry.avis_guilde}"</p>
                </div>
              )}

              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "28px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                {selectedEntry.synopsis || "Aucun synopsis disponible pour cette œuvre."}
              </p>

              <button onClick={() => setSelectedEntry(null)} style={{ width: "100%", padding: "14px", background: tierConfig[selectedEntry.tier as Tier].color, border: "none", borderRadius: "12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}