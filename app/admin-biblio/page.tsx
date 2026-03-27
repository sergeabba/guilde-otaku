"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search, Star, Check, X, Tv, BookOpen, Film, Gamepad2, Loader2,
  Image as ImageIcon, FileText, Youtube, MessageSquare,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MediaType = "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier      = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

interface AniListResult {
  id:           number;
  title:        { romaji: string; english: string | null; native: string };
  type:         "ANIME" | "MANGA";
  format:       string;
  status:       string;
  description:  string | null;
  startDate:    { year: number | null };
  episodes:     number | null;
  chapters:     number | null;
  averageScore: number | null;
  coverImage:   { extraLarge: string; large: string; color: string | null };
  bannerImage:  string | null;
  genres:       string[];
  studios:      { nodes: { name: string }[] };
  trailer:      { id: string; site: string } | null;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TIERS: { value: Tier; color: string; label: string }[] = [
  { value: "Chef-d'œuvre", color: "#FFD700", label: "🏆 Chef-d'œuvre" },
  { value: "Pépite",       color: "#34d399", label: "💎 Pépite"       },
  { value: "Bof",          color: "#94a3b8", label: "😐 Bof"          },
  { value: "Surcoté",      color: "#f87171", label: "📉 Surcoté"      },
  { value: "A définir",    color: "#a1a1aa", label: "🕐 A définir"    },
];

const TYPE_OPTIONS: { value: MediaType; icon: React.ReactNode; color: string }[] = [
  { value: "Anime",      icon: <Tv       size={14} />, color: "#a78bfa" },
  { value: "Manga",      icon: <BookOpen size={14} />, color: "#f472b6" },
  { value: "Film/Série", icon: <Film     size={14} />, color: "#60a5fa" },
  { value: "Jeu Vidéo",  icon: <Gamepad2 size={14} />, color: "#4ade80" },
];

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── ANILIST QUERY ────────────────────────────────────────────

// Simplification de la requête GraphQL pour éviter les erreurs de syntaxe
const ANILIST_QUERY = `
  query ($search: String, $type: MediaType) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: $type, sort: SEARCH_MATCH) {
        id
        title {
          romaji
          english
          native
        }
        type
        format
        status
        description(asHtml: false)
        startDate {
          year
        }
        episodes
        chapters
        averageScore
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        genres
        trailer {
          id
          site
        }
        studios(isMain: true) {
          nodes {
            name
          }
        }
      }
    }
  }
`;

async function searchAniList(search: string, type?: "ANIME" | "MANGA"): Promise<AniListResult[]> {
  // 1. On prépare les variables avec uniquement la recherche texte
  const variables: any = { search };
  
  // 2. On ajoute le filtre de type UNIQUEMENT si tu as cliqué sur "Anime" ou "Manga"
  if (type) {
    variables.type = type;
  }

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables }), // On envoie les variables nettoyées
  });
  
  const json = await res.json();
  
  if (json.errors) {
      console.error("Erreur GraphQL:", json.errors);
      throw new Error("Erreur lors de la requête AniList");
  }

  return json?.data?.Page?.media ?? [];
}


// ─── RESULT CARD ─────────────────────────────────────────────────────────────

function ResultCard({ anime, isSelected, onSelect }: { anime: AniListResult; isSelected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const title  = anime.title.english || anime.title.romaji;
  const score  = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";
  const studio = anime.studios?.nodes?.[0]?.name ?? null; // Sécurisation de l'accès à l'array
  const hasTrailer = anime.trailer?.site === "youtube";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        display: "flex", gap: "16px", padding: "16px", borderRadius: "14px", cursor: "pointer",
        border: `1px solid ${isSelected ? "#c9a84c" : hovered ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.07)"}`,
        background: isSelected ? "rgba(201,168,76,0.08)" : hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        transition: "all 0.25s ease", position: "relative", overflow: "hidden",
      }}
    >
      {anime.coverImage?.color && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: anime.coverImage.color, opacity: 0.7 }} />
      )}
      <div style={{ flexShrink: 0, width: "70px", height: "100px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
        <img src={anime.coverImage?.large || ""} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1.1, margin: 0 }}>{title}</h3>
          {isSelected && (
            <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={13} color="#000" />
            </div>
          )}
        </div>
        {anime.title.english && anime.title.romaji !== anime.title.english && (
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", fontStyle: "italic" }}>{anime.title.romaji}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
          <span style={tagStyle}>{anime.format?.replace("_", " ") ?? anime.type}</span>
          {anime.startDate?.year && <span style={tagStyle}>{anime.startDate.year}</span>}
          {anime.episodes && <span style={tagStyle}>{anime.episodes} ép.</span>}
          {score !== "N/A" && (
            <span style={{ ...tagStyle, color: "#ffd700", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>
              ★ {score}
            </span>
          )}
          {hasTrailer && (
            <span style={{ ...tagStyle, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              ▶ Trailer
            </span>
          )}
        </div>
        {studio && <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{studio}</p>}
      </div>
    </div>
  );
}

// ─── PAGE ADMIN ───────────────────────────────────────────────────────────────

export default function AdminBiblio() {

  // Recherche
  const [query,       setQuery]       = useState("");
  const [searchType,  setSearchType]  = useState<"ANIME" | "MANGA" | "ALL">("ALL");
  const [results,     setResults]     = useState<AniListResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Formulaire
  const [selected,       setSelected]       = useState<AniListResult | null>(null);
  const [mediaType,      setMediaType]      = useState<MediaType>("Anime");
  const [frenchSynopsis, setFrenchSynopsis] = useState("");
  const [avisGuilde,     setAvisGuilde]     = useState("");
  const [trailerUrl,     setTrailerUrl]     = useState("");
  const [tier,           setTier]           = useState<Tier>("A définir");
  const [note,           setNote]           = useState<number>(0);
  const [saving,         setSaving]         = useState(false);
  const [saveSuccess,    setSaveSuccess]    = useState(false);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setSearchError(null); setSelected(null); setSaveSuccess(false);
    try {
      const type = searchType === "ALL" ? undefined : searchType;
      const data = await searchAniList(query.trim(), type);
      setResults(data);
      if (data.length === 0) setSearchError("Aucun résultat trouvé. Essaie un autre titre.");
    } catch (error) { 
        console.error(error);
        setSearchError("Erreur de connexion à AniList."); 
    }
    setSearching(false);
  };

  const handleSelect = (anime: AniListResult) => {
    setSelected(anime);
    setFrenchSynopsis("");
    setAvisGuilde("");
    setNote(anime.averageScore ? parseFloat((anime.averageScore / 10).toFixed(1)) : 0);
    setMediaType(anime.type === "MANGA" ? "Manga" : "Anime");
    setTier("A définir");
    setSaveSuccess(false);
    // Auto-remplir le trailer si disponible
    if (anime.trailer?.site === "youtube") {
      setTrailerUrl(`https://www.youtube.com/watch?v=${anime.trailer.id}`);
    } else {
      setTrailerUrl("");
    }
    setTimeout(() => document.getElementById("edit-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const title  = selected.title.english || selected.title.romaji;
    const studio = selected.studios?.nodes?.[0]?.name ?? null;

    const { error } = await supabase.from("bibliotheque").insert({
      title,
      type:         mediaType,
      cover_image:  selected.coverImage?.extraLarge || selected.coverImage?.large,
      banner_image: selected.bannerImage ?? null,
      score:        note,
      tier,
      status:       selected.status === "FINISHED" ? "Terminé" : selected.status === "RELEASING" ? "En cours" : "À venir",
      synopsis:     frenchSynopsis.trim() || (selected.description ? stripHtml(selected.description) : ""),
      avis_guilde:  avisGuilde.trim() || null,
      trailer_url:  trailerUrl.trim() || null,
      year:         selected.startDate?.year ?? null,
      episodes:     selected.episodes ?? selected.chapters ?? null,
      genres:       selected.genres ?? [],
      studio,
    });

    setSaving(false);
    if (error) { alert("❌ Erreur : " + error.message); }
    else {
      setSaveSuccess(true);
      setSelected(null); setResults([]); setQuery("");
      setFrenchSynopsis(""); setAvisGuilde(""); setTrailerUrl("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", padding: "60px 40px" }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); font-family:'Barlow Condensed',sans-serif; }
        input:focus, textarea:focus { outline: 2px solid rgba(201,168,76,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>
            GUILDE OTAKU · ESPACE ADMIN
          </p>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, textTransform: "uppercase", marginBottom: "12px" }}>
            GÉRER LA<br /><span style={{ color: "#c9a84c" }}>BIBLIOTHÈQUE</span>
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", maxWidth: "480px", lineHeight: 1.5 }}>
            Recherche via <strong style={{ color: "#c9a84c" }}>AniList GraphQL</strong> — couvertures HD, genres, studios, trailers et métadonnées complètes.
          </p>
        </div>

        {/* SUCCÈS */}
        {saveSuccess && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 20px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "12px", marginBottom: "32px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={16} color="#000" />
            </div>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 900, color: "#34d399", margin: 0 }}>Ajouté à la Bibliothèque !</p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>L'œuvre est maintenant visible sur la page Bibliothèque.</p>
            </div>
            <button onClick={() => setSaveSuccess(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><X size={16} /></button>
          </div>
        )}

        {/* RECHERCHE */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "28px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Search size={18} /> Rechercher via AniList
          </h2>
          <form onSubmit={handleSearch}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {(["ALL", "ANIME", "MANGA"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setSearchType(t)}
                  style={{ ...filterBtnStyle, background: searchType === t ? "#c9a84c" : "rgba(255,255,255,0.04)", color: searchType === t ? "#000" : "rgba(255,255,255,0.5)", border: `1px solid ${searchType === t ? "#c9a84c" : "rgba(255,255,255,0.1)"}` }}>
                  {t === "ALL" ? "Tout" : t === "ANIME" ? "Anime" : "Manga"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: Vinland Saga, Chainsaw Man..."
                  style={{ width: "100%", padding: "13px 14px 13px 42px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", boxSizing: "border-box" as const }} />
              </div>
              <button type="submit" disabled={searching || !query.trim()}
                style={{ padding: "13px 24px", background: searching ? "rgba(201,168,76,0.4)" : "#c9a84c", border: "none", borderRadius: "12px", cursor: searching ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "15px", color: "#000", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {searching ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                {searching ? "..." : "Chercher"}
              </button>
            </div>
          </form>
        </div>

        {/* ERREUR */}
        {searchError && (
          <div style={{ padding: "16px 20px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "12px", marginBottom: "24px", color: "#f87171", fontSize: "15px" }}>
            {searchError}
          </div>
        )}

        {/* RÉSULTATS */}
        {results.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "32px" }}>
            <p style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
              {results.length} RÉSULTATS — CLIQUE POUR SÉLECTIONNER
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {results.map((anime) => (
                <ResultCard key={anime.id} anime={anime} isSelected={selected?.id === anime.id} onSelect={() => handleSelect(anime)} />
              ))}
            </div>
          </div>
        )}

        {/* FORMULAIRE */}
        {selected && (
          <div id="edit-form" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "20px", padding: "28px", marginBottom: "40px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: "56px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", flexShrink: 0 }}>
                <img src={selected.coverImage?.large || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>EN COURS D'AJOUT</p>
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
                  {selected.title.english || selected.title.romaji}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>

            {/* Bannière */}
            {selected.bannerImage && (
              <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", height: "120px", position: "relative" }}>
                <img src={selected.bannerImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,5,8,0.6), transparent)" }} />
                <div style={{ position: "absolute", top: "10px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "100px" }}>
                  <ImageIcon size={11} color="#c9a84c" />
                  <span style={{ fontSize: "10px", color: "#c9a84c", fontWeight: 700 }}>BANNIÈRE DÉTECTÉE</span>
                </div>
              </div>
            )}

            {/* Type + Note */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={labelStyle}>TYPE DE MÉDIA</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setMediaType(opt.value)}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", background: mediaType === opt.value ? `${opt.color}18` : "rgba(255,255,255,0.04)", color: mediaType === opt.value ? opt.color : "rgba(255,255,255,0.4)", border: `1px solid ${mediaType === opt.value ? opt.color + "60" : "rgba(255,255,255,0.08)"}`, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", transition: "all 0.2s" }}>
                      {opt.icon} {opt.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>NOTE DE LA GUILDE (/10)</label>
                <div style={{ position: "relative" }}>
                  <Star size={14} color="#ffd700" fill="#ffd700" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input type="number" step="0.1" min="0" max="10" value={note}
                    onChange={(e) => setNote(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                    style={{ ...inputStyle, paddingLeft: "34px" }} />
                </div>
              </div>
            </div>

            {/* Tier */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>CLASSEMENT (TIER)</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TIERS.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTier(t.value)}
                    style={{ padding: "9px 16px", borderRadius: "100px", cursor: "pointer", background: tier === t.value ? `${t.color}18` : "rgba(255,255,255,0.04)", color: tier === t.value ? t.color : "rgba(255,255,255,0.5)", border: `1px solid ${tier === t.value ? t.color + "60" : "rgba(255,255,255,0.08)"}`, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.2s", boxShadow: tier === t.value ? `0 0 12px ${t.color}30` : "none" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}><FileText size={13} style={{ display: "inline", marginRight: "6px" }} />SYNOPSIS EN FRANÇAIS</label>
              {selected.description && (
                <div style={{ marginBottom: "10px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>SYNOPSIS ORIGINAL (EN) — RÉFÉRENCE</p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontStyle: "italic" }}>
                    {stripHtml(selected.description).slice(0, 300)}{selected.description.length > 300 ? "..." : ""}
                  </p>
                </div>
              )}
              <textarea value={frenchSynopsis} onChange={(e) => setFrenchSynopsis(e.target.value)} rows={4}
                placeholder="Colle ou écris le synopsis en français ici..."
                style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }} />
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>Si vide, le synopsis original en anglais sera utilisé.</p>
            </div>

            {/* AVIS GUILDE */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}><MessageSquare size={13} style={{ display: "inline", marginRight: "6px" }} />AVIS DE LA GUILDE (optionnel)</label>
              <textarea value={avisGuilde} onChange={(e) => setAvisGuilde(e.target.value)} rows={4}
                placeholder="Ex: Frieren ne ressemble à rien de ce qu'on a vu. Dans un genre saturé de power-ups..."
                style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6, border: "1px solid rgba(201,168,76,0.2)" }} />
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>Chronique ou commentaire de la guilde sur l'œuvre.</p>
            </div>

            {/* TRAILER URL */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}><Youtube size={13} style={{ display: "inline", marginRight: "6px" }} />TRAILER YOUTUBE (optionnel)</label>
              <div style={{ position: "relative" }}>
                <Youtube size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(248,113,113,0.6)" }} />
                <input type="text" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ ...inputStyle, paddingLeft: "36px", border: "1px solid rgba(248,113,113,0.15)" }} />
              </div>
              {selected.trailer?.site === "youtube" && (
                <p style={{ fontSize: "11px", color: "#34d399", marginTop: "6px" }}>✓ Trailer YouTube détecté automatiquement depuis AniList.</p>
              )}
            </div>

            {/* Méta-données */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label: "Année",         value: selected.startDate?.year ?? "—" },
                { label: selected.type === "MANGA" ? "Chapitres" : "Épisodes", value: selected.episodes ?? selected.chapters ?? "—" },
                { label: "Studio",        value: selected.studios?.nodes?.[0]?.name ?? "—" },
                { label: "Score AniList", value: selected.averageScore ? (selected.averageScore / 10).toFixed(1) + "/10" : "—", gold: true },
                { label: "Statut",        value: selected.status },
                { label: "Genres",        value: selected.genres?.slice(0, 2).join(", ") || "—" },
              ].map(({ label, value, gold }) => (
                <div key={label}>
                  <p style={metaLabelStyle}>{label}</p>
                  <p style={{ ...metaValueStyle, color: gold ? "#ffd700" : "rgba(255,255,255,0.7)" }}>{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "16px", background: saving ? "rgba(74,222,128,0.4)" : "#4ade80", border: "none", borderRadius: "12px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "16px", color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                {saving ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Sauvegarde...</> : <><Check size={18} /> Confirmer et Sauvegarder</>}
              </button>
              <button onClick={() => setSelected(null)}
                style={{ padding: "16px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const tagStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px",
  color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)",
  padding: "2px 7px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)",
};

const filterBtnStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 16px",
  borderRadius: "100px", cursor: "pointer", transition: "all 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.35)",
  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "16px", boxSizing: "border-box" as const,
};

const metaLabelStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: 700,
  color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px",
};

const metaValueStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700,
};