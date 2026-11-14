"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { DOSSIER_BASH_DATA, findDossierBashEntry, normalizeDossierBashKey } from "../../lib/dossier-bash";
import Link from "next/link";
import {
  Search, Star, Check, X, Tv, BookOpen, Film, Gamepad2,
  Loader2, Image as ImageIcon, FileText, Youtube, MessageSquare, Lock, Trash2, List, ChevronLeft, AlertTriangle,
} from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { getAdminHeaders } from "../../lib/admin-fetch";
import { adminDb } from "../../lib/admin-db-client";
import { FORMAT_LABEL, SOURCE_LABEL, frenchLevel, type WorkCandidate } from "../../lib/works/types";

// ─── TOKENS (inline pour éviter l'import fragile depuis outputs/styles) ──────────
const font = "'Barlow Condensed', sans-serif";
const colors = {
  bg:            "#050508",
  gold:          "#c9a84c",
  goldBorder:    "rgba(201,168,76,0.3)",
  goldLight:     "rgba(201,168,76,0.04)",
  goldGlow:      "rgba(201,168,76,0.4)",
  border:        "rgba(255,255,255,0.07)",
  bgCard:        "rgba(255,255,255,0.03)",
  bgHover:       "rgba(255,255,255,0.06)",
  textPrimary:   "#fff",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted:     "rgba(255,255,255,0.3)",
  danger:        "#f87171",
  youtube:       "#f87171",
};
const typography = {
  overline: { fontFamily: font, fontSize: "11px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: colors.gold },
  label:    { display: "block" as const, fontFamily: font, fontSize: "11px", fontWeight: 800, color: colors.textMuted, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: "12px" },
  body:     { fontFamily: font, fontSize: "15px", fontWeight: 500, color: colors.textSecondary, lineHeight: 1.6 },
  meta:     { fontFamily: font, fontSize: "12px", fontWeight: 500, color: colors.textMuted },
};
const components = {
  card:      { background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "20px" },
  tag:       { fontFamily: font, fontSize: "11px", fontWeight: 700, color: colors.textMuted, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "100px", padding: "3px 10px" } as React.CSSProperties,
  input:     { width: "100%", padding: "12px 14px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "10px", color: colors.textPrimary, fontFamily: font, fontSize: "15px", outline: "none", boxSizing: "border-box" as const },
  btnPrimary:   { display: "flex" as const, alignItems: "center" as const, gap: "8px", padding: "12px 20px", background: colors.gold, border: "none", borderRadius: "10px", color: "#000", fontFamily: font, fontSize: "14px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.08em", cursor: "pointer" },
  btnSecondary: { display: "flex" as const, alignItems: "center" as const, gap: "8px", padding: "12px 16px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "10px", color: colors.textSecondary, fontFamily: font, fontSize: "14px", fontWeight: 700, cursor: "pointer" },
};
const filterPillStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: font, fontSize: "13px", fontWeight: active ? 800 : 600,
  letterSpacing: "0.1em", textTransform: "uppercase",
  padding: "8px 18px", borderRadius: "100px", border: "none", cursor: "pointer",
  background: active ? colors.gold : colors.bgCard,
  color: active ? "#000" : colors.textSecondary,
  transition: "all 0.2s",
});

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
  /** Synopsis français de la source (TMDB / MangaDex), s'il existe. */
  frDescription?: string | null;
  /** Source et identifiant stable, pour charger le détail (bande-annonce, genres). */
  sourceRef?: { source: "tmdb" | "mangadex"; sourceId: string };
  sourceLabel?: string;
  formatLabel?: string;
  frLevel?: "complet" | "partiel" | "aucun";
  /** Identifiant AniList quand la source le connaît. */
  anilistRef?: number;
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

// ─── RECHERCHE (serveur commun : TMDB en français pour l'anime, MangaDex pour les mangas) ───
// Même recherche que les favoris des membres (lib/works). Le synopsis anglais reste une
// référence : il n'est jamais enregistré comme synopsis français.

let seqId = 0;
function toResult(c: WorkCandidate): AniListResult {
  const tmdbNum = c.source === "tmdb" ? Number(c.sourceId.split(":")[1]) : NaN;
  const title = c.titleFr && !c.titleFrUnverified ? c.titleFr : c.title;
  return {
    id: Number.isFinite(tmdbNum) ? tmdbNum : 1_000_000 + ++seqId,
    title: { romaji: c.titleRomaji ?? c.titleEn ?? title, english: title, native: "" },
    type: c.kind,
    format: FORMAT_LABEL[c.format],
    status: "FINISHED",
    description: c.synopsisEn ?? null,
    frDescription: c.synopsisFr ?? null,
    startDate: { year: c.year ?? null },
    episodes: c.episodes ?? null,
    chapters: null,
    averageScore: null,
    coverImage: { extraLarge: c.coverUrl ?? "", large: c.coverUrl ?? "", color: null },
    bannerImage: null,
    genres: c.genres ?? [],
    studios: { nodes: [] },
    trailer: c.trailer ? { id: c.trailer.youtubeId, site: "youtube" } : null,
    sourceRef: { source: c.source, sourceId: c.sourceId },
    sourceLabel: SOURCE_LABEL[c.source],
    formatLabel: FORMAT_LABEL[c.format],
    frLevel: frenchLevel(c),
    anilistRef: c.anilistId,
  };
}

async function worksApi<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(res.status === 401 ? "Session expirée : reconnecte-toi." : json?.error || `Erreur ${res.status}`);
  return json as T;
}

async function searchHybrid(search: string, type?: "ANIME" | "MANGA"): Promise<AniListResult[]> {
  const kinds: ("ANIME" | "MANGA")[] = type ? [type] : ["ANIME", "MANGA"];
  const settled = await Promise.allSettled(kinds.map((kind) => worksApi<{ results: WorkCandidate[] }>("/api/works/search", { q: search, kind })));
  const ok = settled.filter((r): r is PromiseFulfilledResult<{ results: WorkCandidate[] }> => r.status === "fulfilled");
  if (!ok.length) throw new Error((settled[0] as PromiseRejectedResult).reason?.message ?? "Recherche impossible.");
  return ok.flatMap((r) => r.value.results).map(toResult);
}

async function loadDetail(r: AniListResult): Promise<AniListResult> {
  if (!r.sourceRef) return r;
  const { work } = await worksApi<{ work: WorkCandidate }>("/api/works/detail", { source: r.sourceRef.source, id: r.sourceRef.sourceId });
  return { ...toResult(work), id: r.id };
}

// ─── RESULT CARD ─────────────────────────────────────────────────────────────
function ResultCard({ anime, isSelected, onSelect }: { anime: AniListResult; isSelected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const title  = anime.title.english || anime.title.romaji;
  const score  = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";
  const studio = anime.studios?.nodes?.[0]?.name ?? null;
  const hasTrailer = anime.trailer?.site === "youtube";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        display: "flex", gap: "16px", padding: "16px", borderRadius: "14px", cursor: "pointer",
        border: `1px solid ${isSelected ? colors.gold : hovered ? colors.goldBorder : colors.border}`,
        background: isSelected ? colors.goldLight : hovered ? colors.bgHover : colors.bgCard,
        transition: "all 0.25s ease", position: "relative", overflow: "hidden",
      }}
    >
      {anime.coverImage?.color && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: anime.coverImage.color, opacity: 0.7 }} />
      )}
      <div style={{ flexShrink: 0, width: "70px", height: "100px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
        <img src={anime.coverImage?.large || ""} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
          <h3 style={{ fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", lineHeight: 1.1, margin: 0 }}>{title}</h3>
          {isSelected && (
            <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: colors.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={13} color="#000" />
            </div>
          )}
        </div>
        {anime.title.english && anime.title.romaji !== anime.title.english && (
          <p style={{ ...typography.meta, marginBottom: "6px", fontStyle: "italic" }}>{anime.title.romaji}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
          <span style={components.tag}>{anime.formatLabel ?? anime.format?.replace("_", " ") ?? anime.type}</span>
          {anime.sourceLabel && <span style={components.tag}>{anime.sourceLabel}</span>}
          {anime.frLevel && (
            <span style={{ ...components.tag, color: anime.frLevel === "complet" ? "#6ee7b7" : anime.frLevel === "partiel" ? "#fcd34d" : colors.textSecondary }}>
              {anime.frLevel === "complet" ? "Français complet" : anime.frLevel === "partiel" ? "Français partiel" : "Pas de français"}
            </span>
          )}
          {anime.startDate?.year && <span style={components.tag}>{anime.startDate.year}</span>}
          {anime.episodes && <span style={components.tag}>{anime.episodes} ép.</span>}
          {score !== "N/A" && (
            <span style={{ ...components.tag, color: "#ffd700", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>★ {score}</span>
          )}
          {hasTrailer && (
            <span style={{ ...components.tag, color: colors.youtube, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>▶ Trailer</span>
          )}
        </div>
        {studio && <p style={{ ...typography.meta }}>{studio}</p>}
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function AdminBiblio() {
  const isMobile = useIsMobile();
  const { authed, checking, password: pwInput, setPassword: setPwInput, error: pwError, login } = useAdminAuth();

  const [currentView, setCurrentView] = useState<"ADD" | "MANAGE">("ADD");
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchLibrary = async () => {
    const { data } = await supabase.from("bibliotheque").select("*").order("created_at", { ascending: false });
    if (data) setLibraryItems(data);
  };

  const dossierBashKeys = new Set(
    DOSSIER_BASH_DATA.flatMap((entry) => [
      normalizeDossierBashKey(entry.title),
      normalizeDossierBashKey(entry.searchQuery),
    ])
  );

  useEffect(() => {
    if (authed) fetchLibrary();
  }, [authed]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const title = deleteTarget.title;
    const { error } = await adminDb.remove("bibliotheque", deleteTarget.id);
    setDeleting(false);
    if (error) { showToast(`Erreur : ${error.message}`); return; }
    setDeleteTarget(null);
    fetchLibrary();
    showToast(`${title} supprimé`);
  };

  const handleSyncCovers = async () => {
    setSyncingCovers(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/bibliotheque-sync-covers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de synchronisation");
      }

      setSyncMessage(`${data.updated} cover${data.updated > 1 ? "s" : ""} synchronisée${data.updated > 1 ? "s" : ""}.`);
      fetchLibrary();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSyncingCovers(false);
    }
  };

  const handleSyncOneCover = async (id: string, title: string) => {
    setSyncingItemId(id);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/bibliotheque-sync-covers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id, force: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Erreur de synchronisation pour ${title}`);
      }

      setSyncMessage(`Cover resynchronisée pour ${title}.`);
      fetchLibrary();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleSyncDossierBash = async () => {
    setSyncingDossierBash(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/bibliotheque-sync-dossier-bash", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de synchronisation Dossier Bash");
      }

      setSyncMessage(`${data.updated} entrée${data.updated > 1 ? "s" : ""} Dossier Bash synchronisée${data.updated > 1 ? "s" : ""}.`);
      fetchLibrary();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSyncingDossierBash(false);
    }
  };

  const [query,       setQuery]       = useState("");
  const [searchType,  setSearchType]  = useState<"ANIME" | "MANGA" | "ALL">("ALL");
  const [results,     setResults]     = useState<AniListResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected,       setSelected]       = useState<AniListResult | null>(null);
  const [mediaType,      setMediaType]      = useState<MediaType>("Anime");
  const [frenchSynopsis, setFrenchSynopsis] = useState("");
  const [avisGuilde,     setAvisGuilde]     = useState("");
  const [trailerUrl,     setTrailerUrl]     = useState("");
  const [tier,           setTier]           = useState<Tier>("A définir");
  const [note,           setNote]           = useState<number>(0);
  const [saving,         setSaving]         = useState(false);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [syncingCovers,  setSyncingCovers]  = useState(false);
  const [syncingDossierBash, setSyncingDossierBash] = useState(false);
  const [syncMessage,    setSyncMessage]    = useState<string | null>(null);
  const [syncingItemId,  setSyncingItemId]  = useState<string | null>(null);

  // ─── GARDE MOT DE PASSE ──────────────────────────────────────────────────────
  if (checking) return (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(201,168,76,0.2)", borderTopColor: "#c9a84c", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "20px", padding: "48px 40px", width: "min(400px, 90vw)", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: `1px solid ${colors.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={24} color={colors.gold} />
          </div>
          <p style={{ ...typography.overline, marginBottom: "8px" }}>ESPACE ADMIN</p>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "32px" }}>ACCÈS RESTREINT</h1>
        <input
        type="password"
        value={pwInput}
        onChange={e => setPwInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") login(); }}
        placeholder="Mot de passe..."
        style={{ width: "100%", padding: "14px 16px", background: colors.bgCard, border: `1px solid ${pwError ? colors.danger : colors.border}`, borderRadius: "10px", color: colors.textPrimary, fontFamily: font, fontSize: "18px", textAlign: "center", letterSpacing: "0.3em", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
        />
        {pwError && <p style={{ color: colors.danger, fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Mot de passe incorrect</p>}
        <button
        onClick={() => login()}
        style={{ ...components.btnPrimary, width: "100%", padding: "14px", justifyContent: "center", fontSize: "16px" }}
        >
            ENTRER
          </button>
        </div>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setSearchError(null); setSelected(null); setSaveSuccess(false);
    try {
      const type = searchType === "ALL" ? undefined : searchType;
      const data = await searchHybrid(query.trim(), type);
      setResults(data);
      if (data.length === 0) setSearchError("Aucun résultat trouvé. Essaie un autre titre.");
    } catch {
      setSearchError("Erreur de connexion à la base de données distante.");
    }
    setSearching(false);
  };

  const handleSelect = (anime: AniListResult) => {
    setSelected(anime);
    // Synopsis pré-rempli seulement s'il est réellement en français.
    setFrenchSynopsis(anime.frDescription ?? ""); setAvisGuilde("");
    // Détail (bande-annonce, genres, synopsis complet) chargé en arrière-plan.
    loadDetail(anime).then((full) => {
      setSelected((cur) => (cur && cur.id === anime.id ? { ...full } : cur));
      setFrenchSynopsis((cur) => cur || full.frDescription || "");
      if (full.trailer?.site === "youtube") setTrailerUrl((cur) => cur || `https://www.youtube.com/watch?v=${full.trailer!.id}`);
    }).catch(() => { /* le résultat de recherche suffit */ });
    setNote(anime.averageScore ? parseFloat((anime.averageScore / 10).toFixed(1)) : 0);
    setMediaType(anime.type === "MANGA" ? "Manga" : "Anime");
    setTier("A définir"); setSaveSuccess(false);
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

    try {
      const title  = selected.title.english || selected.title.romaji;
      const studio = selected.studios?.nodes?.[0]?.name ?? null;

      const resolveResponse = await fetch("/api/resolve-cover", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          title,
          anilistId: selected.anilistRef,
          coverUrl: selected.coverImage?.extraLarge || selected.coverImage?.large || null,
          bannerUrl: selected.bannerImage ?? null,
        }),
      });

      const resolved = await resolveResponse.json();
      if (!resolveResponse.ok) {
        throw new Error(resolved.error || "Impossible de préparer les assets");
      }

      const dossierMeta = findDossierBashEntry(title);

      const { error } = await adminDb.insert("bibliotheque", {
        title,
        type:         mediaType,
        cover_image:  resolved.coverUrl,
        banner_image: resolved.bannerUrl,
        score:        note,
        tier,
        status:       selected.status === "FINISHED" ? "Terminé" : selected.status === "RELEASING" ? "En cours" : "À venir",
        // Jamais de résumé anglais publié comme synopsis français.
        synopsis:     frenchSynopsis.trim(),
        avis_guilde:  avisGuilde.trim() || null,
        trailer_url:  trailerUrl.trim() || null,
        year:         selected.startDate?.year ?? null,
        episodes:     selected.episodes ?? selected.chapters ?? null,
        genres:       selected.genres ?? [],
        studio,
        dossier_bash: !!dossierMeta,
        dossier_bash_tag: dossierMeta?.tag ?? null,
        dossier_bash_date: dossierMeta?.date ?? null,
        dossier_bash_color: dossierMeta?.color ?? null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSaveSuccess(true);
      showToast("Ajouté à la bibliothèque !");
      setSelected(null); setResults([]); setQuery("");
      setFrenchSynopsis(""); setAvisGuilde(""); setTrailerUrl("");
      fetchLibrary();
    } catch (error) {
      alert("❌ Erreur : " + (error instanceof Error ? error.message : "Erreur inconnue"));
    } finally {
      setSaving(false);
    }
  };

  // ─── STYLES DÉRIVÉS DES TOKENS ──────────────────────────────────────────
  const sectionCard: React.CSSProperties = { ...components.card, padding: "28px", marginBottom: "32px" };
  const labelStyle  = typography.label;

  const getCoverStatus = (coverUrl?: string | null) => {
    if (!coverUrl) {
      return { label: "Aucune cover", color: colors.danger, bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" };
    }

    if (coverUrl.includes("/storage/v1/object/public/bibliotheque-assets/")) {
      return { label: "Supabase Storage", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" };
    }

    if (/^https?:\/\//.test(coverUrl)) {
      return { label: "Source externe", color: colors.gold, bg: colors.goldLight, border: colors.goldBorder };
    }

    return { label: "Locale / legacy", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)" };
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: ${colors.textMuted}; font-family: ${font}; }
        input:focus, textarea:focus { outline: 2px solid ${colors.goldGlow} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── STICKY TOP BAR ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.95)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "14px 16px" : "16px 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", flexShrink: 0, textDecoration: "none" }}>
            <ChevronLeft size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: colors.gold, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>ADMIN · GUILDE OTAKU</p>
            <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1 }}>
              BIBLIO<span style={{ color: colors.gold }}>THÈQUE</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
            {([
              { id: "ADD" as const, icon: <Search size={13} />, label: "AJOUTER" },
              { id: "MANAGE" as const, icon: <List size={13} />, label: "GÉRER" },
            ]).map(t => (
              <button key={t.id} onClick={() => setCurrentView(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: currentView === t.id ? `1px solid ${colors.goldBorder}` : "1px solid transparent", cursor: "pointer", fontFamily: font, fontWeight: 800, fontSize: 12, letterSpacing: "0.1em", background: currentView === t.id ? "rgba(201,168,76,0.15)" : "transparent", color: currentView === t.id ? colors.gold : "rgba(255,255,255,0.4)" }}>
                {t.icon} {!isMobile && t.label}
              </button>
            ))}
          </div>
          {currentView === "MANAGE" && <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{libraryItems.length} œuvre{libraryItems.length !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "32px 28px 80px" }}>


        {currentView === "MANAGE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: font, fontSize: "20px", fontWeight: 900, color: colors.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Œuvres Enregistrées ({libraryItems.length})</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={handleSyncDossierBash} disabled={syncingDossierBash} style={{ ...components.btnSecondary, opacity: syncingDossierBash ? 0.6 : 1, cursor: syncingDossierBash ? "not-allowed" : "pointer" }}>
                  {syncingDossierBash ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <List size={16} />}
                  {syncingDossierBash ? "Sync Bash..." : "Synchroniser Dossier Bash"}
                </button>
                <button onClick={handleSyncCovers} disabled={syncingCovers} style={{ ...components.btnSecondary, opacity: syncingCovers ? 0.6 : 1, cursor: syncingCovers ? "not-allowed" : "pointer" }}>
                  {syncingCovers ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={16} />}
                  {syncingCovers ? "Synchronisation..." : "Synchroniser les covers"}
                </button>
              </div>
            </div>
            {syncMessage && <p style={{ ...typography.meta, color: syncMessage.includes("Erreur") ? colors.danger : "#34d399" }}>{syncMessage}</p>}
            {libraryItems.length === 0 ? (
              <p style={{ color: colors.textSecondary, fontFamily: font }}>La bibliothèque est vide.</p>
            ) : (
              libraryItems.map(item => {
                const coverStatus = getCoverStatus(item.cover_image);
                const isDossierBash = item.dossier_bash === true || dossierBashKeys.has(normalizeDossierBashKey(item.title));

                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: colors.bgCard, borderRadius: "12px", border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "40px", height: "56px", borderRadius: "6px", overflow: "hidden", border: `1px solid ${colors.border}`, flexShrink: 0 }}>
                        <img src={item.cover_image || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontFamily: font, fontSize: "18px", fontWeight: 800 }}>{item.title}</h3>
                        <p style={{ margin: 0, ...typography.meta }}>{item.type} • {item.tier}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          {isDossierBash && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "rgba(201,168,76,0.08)", border: `1px solid ${colors.goldBorder}` }}>
                              <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: colors.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dossier Bash</span>
                            </div>
                          )}
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: coverStatus.bg, border: `1px solid ${coverStatus.border}` }}>
                            <ImageIcon size={12} color={coverStatus.color} />
                            <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: coverStatus.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{coverStatus.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleSyncOneCover(item.id, item.title)}
                        disabled={syncingItemId === item.id}
                        title={syncingItemId === item.id ? `Synchronisation de ${item.title}` : `Resynchroniser la cover de ${item.title}`}
                        aria-label={syncingItemId === item.id ? `Synchronisation de ${item.title}` : `Resynchroniser la cover de ${item.title}`}
                        style={{ background: "rgba(52,211,153,0.1)", border: "none", borderRadius: "8px", padding: isMobile ? "10px" : "10px 12px", color: "#34d399", cursor: syncingItemId === item.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: isMobile ? "0" : "6px", opacity: syncingItemId === item.id ? 0.6 : 1, fontFamily: font, fontSize: "12px", fontWeight: 800 }}
                      >
                        {syncingItemId === item.id ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={16} />}
                        {!isMobile && <span>{syncingItemId === item.id ? "Sync..." : "Resync"}</span>}
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                        title={`Supprimer ${item.title}`}
                        aria-label={`Supprimer ${item.title}`}
                        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: isMobile ? "10px" : "10px 12px", color: colors.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: isMobile ? "0" : "6px", fontFamily: font, fontSize: "12px", fontWeight: 800 }}
                      >
                        <Trash2 size={16} />
                        {!isMobile && <span>Supprimer</span>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {currentView === "ADD" && (
          <>
        {/* SUCCÈS */}
        {saveSuccess && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 20px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "12px", marginBottom: "32px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={16} color="#000" />
            </div>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 900, color: "#34d399", margin: 0 }}>Ajouté à la Bibliothèque !</p>
              <p style={{ ...typography.meta, margin: 0 }}>L'œuvre est maintenant visible sur la page Bibliothèque.</p>
            </div>
            <button onClick={() => setSaveSuccess(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: colors.textMuted, cursor: "pointer", minHeight: "unset", minWidth: "unset" }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* RECHERCHE */}
        <div style={sectionCard}>
          <h2 style={{ fontFamily: font, fontSize: "20px", fontWeight: 900, color: colors.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Search size={18} /> Rechercher via AniList
          </h2>
          <form onSubmit={handleSearch}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {(["ALL", "ANIME", "MANGA"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setSearchType(t)}
                  style={{ ...filterPillStyle(searchType === t), padding: "7px 16px" }}>
                  {t === "ALL" ? "Tout" : t === "ANIME" ? "Anime" : "Manga"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: Vinland Saga, Chainsaw Man..."
                  style={{ ...components.input, paddingLeft: "42px" }} />
              </div>
              <button type="submit" disabled={searching || !query.trim()}
                style={{ ...components.btnPrimary, opacity: searching ? 0.5 : 1, cursor: searching ? "not-allowed" : "pointer" }}>
                {searching ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                {searching ? "..." : "Chercher"}
              </button>
            </div>
          </form>
        </div>

        {/* ERREUR */}
        {searchError && (
          <div style={{ padding: "16px 20px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "12px", marginBottom: "24px", color: colors.danger, fontSize: "15px" }}>
            {searchError}
          </div>
        )}

        {/* RÉSULTATS */}
        {results.length > 0 && (
          <div style={{ ...sectionCard }}>
            <p style={{ ...typography.label, marginBottom: "16px" }}>
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
          <div id="edit-form" style={{ background: colors.goldLight, border: `1px solid ${colors.goldBorder}`, borderRadius: "20px", padding: "28px", marginBottom: "40px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ width: "56px", height: "80px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${colors.goldBorder}`, flexShrink: 0 }}>
                <img src={selected.coverImage?.large || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <p style={{ ...typography.overline, marginBottom: "4px" }}>EN COURS D'AJOUT</p>
                <h3 style={{ fontFamily: font, fontSize: "22px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
                  {selected.title.english || selected.title.romaji}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", background: colors.bgHover, border: `1px solid ${colors.border}`, borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.textSecondary, flexShrink: 0, minHeight: "unset", minWidth: "unset" }}>
                <X size={15} />
              </button>
            </div>

            {/* Bannière */}
            {selected.bannerImage && (
              <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", height: "120px", position: "relative" }}>
                <img src={selected.bannerImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,5,8,0.6), transparent)" }} />
                <div style={{ position: "absolute", top: "10px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "100px" }}>
                  <ImageIcon size={11} color={colors.gold} />
                  <span style={{ fontFamily: font, fontSize: "10px", color: colors.gold, fontWeight: 700 }}>BANNIÈRE DÉTECTÉE</span>
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
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", background: mediaType === opt.value ? `${opt.color}18` : colors.bgCard, color: mediaType === opt.value ? opt.color : colors.textMuted, border: `1px solid ${mediaType === opt.value ? opt.color + "60" : colors.border}`, fontFamily: font, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", transition: "all 0.2s" }}>
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
                    style={{ ...components.input, paddingLeft: "34px" }} />
                </div>
              </div>
            </div>

            {/* Tier */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>CLASSEMENT (TIER)</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TIERS.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTier(t.value)}
                    style={{ padding: "9px 16px", borderRadius: "100px", cursor: "pointer", background: tier === t.value ? `${t.color}18` : colors.bgCard, color: tier === t.value ? t.color : colors.textSecondary, border: `1px solid ${tier === t.value ? t.color + "60" : colors.border}`, fontFamily: font, fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.2s", boxShadow: tier === t.value ? `0 0 12px ${t.color}30` : "none" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}><FileText size={13} style={{ display: "inline", marginRight: "6px" }} />SYNOPSIS EN FRANÇAIS</label>
              {selected.description && (
                <div style={{ marginBottom: "10px", padding: "12px 14px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "10px" }}>
                  <p style={{ ...typography.label, marginBottom: "6px" }}>Résumé en anglais (référence, jamais publié)</p>
                  <p style={{ ...typography.body, fontSize: "13px", fontStyle: "italic" }}>
                    {stripHtml(selected.description).slice(0, 300)}{selected.description.length > 300 ? "..." : ""}
                  </p>
                </div>
              )}
              <textarea value={frenchSynopsis} onChange={(e) => setFrenchSynopsis(e.target.value)} rows={4}
                placeholder="Colle ou écris le synopsis en français ici..."
                style={{ ...components.input, resize: "vertical", lineHeight: 1.6 }} />
              <p style={{ ...typography.meta, marginTop: "6px" }}>{selected.frDescription ? "Pré-rempli avec le synopsis français de " + (selected.sourceLabel ?? "la source") + " : relis-le." : "Pas de synopsis français à la source : écris-le ou laisse vide (le résumé anglais n'est jamais publié)."}</p>
            </div>

            {/* Avis Guilde */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}><MessageSquare size={13} style={{ display: "inline", marginRight: "6px" }} />AVIS DE LA GUILDE (optionnel)</label>
              <textarea value={avisGuilde} onChange={(e) => setAvisGuilde(e.target.value)} rows={4}
                placeholder="Ex: Frieren ne ressemble à rien de ce qu'on a vu..."
                style={{ ...components.input, resize: "vertical", lineHeight: 1.6, border: `1px solid ${colors.goldBorder}` }} />
              <p style={{ ...typography.meta, marginTop: "6px" }}>Chronique ou commentaire de la guilde sur l'œuvre.</p>
            </div>

            {/* Trailer */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}><Youtube size={13} style={{ display: "inline", marginRight: "6px" }} />TRAILER YOUTUBE (optionnel)</label>
              <div style={{ position: "relative" }}>
                <Youtube size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(248,113,113,0.6)" }} />
                <input type="text" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ ...components.input, paddingLeft: "36px", border: "1px solid rgba(248,113,113,0.15)" }} />
              </div>
              {selected.trailer?.site === "youtube" && (
                <p style={{ fontFamily: font, fontSize: "11px", color: "#34d399", marginTop: "6px" }}>✓ Trailer YouTube détecté automatiquement depuis AniList.</p>
              )}
            </div>

            {/* Méta */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "24px", padding: "16px", background: colors.bgCard, borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              {[
                { label: "Année",         value: selected.startDate?.year ?? "—" },
                { label: selected.type === "MANGA" ? "Chapitres" : "Épisodes", value: selected.episodes ?? selected.chapters ?? "—" },
                { label: "Studio",        value: selected.studios?.nodes?.[0]?.name ?? "—" },
                { label: "Score AniList", value: selected.averageScore ? (selected.averageScore / 10).toFixed(1) + "/10" : "—", gold: true },
                { label: "Statut",        value: selected.status },
                { label: "Genres",        value: selected.genres?.slice(0, 2).join(", ") || "—" },
              ].map(({ label, value, gold }: any) => (
                <div key={label}>
                  <p style={{ ...typography.label, marginBottom: "3px" }}>{label}</p>
                  <p style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: gold ? "#ffd700" : "rgba(255,255,255,0.7)" }}>{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, ...components.btnPrimary, padding: "16px", background: saving ? "rgba(74,222,128,0.4)" : "#4ade80", justifyContent: "center", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Sauvegarde...</> : <><Check size={18} /> Confirmer et Sauvegarder</>}
              </button>
              <button onClick={() => setSelected(null)}
                style={{ ...components.btnSecondary, padding: "16px 20px" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

          </>
        )}

      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 200 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "min(420px,92vw)", background: "#0d0d18", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 20, padding: "32px 28px", textAlign: "center", boxShadow: "0 0 60px rgba(248,113,113,0.12), 0 24px 60px rgba(0,0,0,0.7)", fontFamily: font }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={22} color="#f87171" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#f87171", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>SUPPRESSION DÉFINITIVE</p>
              <h3 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", marginBottom: 8, color: "#fff" }}>{deleteTarget.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.5 }}>Cette œuvre sera retirée définitivement de la bibliothèque.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: font, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>ANNULER</button>
                <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, padding: 12, background: deleting ? "rgba(248,113,113,0.3)" : "#ef4444", border: "none", borderRadius: 12, cursor: deleting ? "not-allowed" : "pointer", color: "#fff", fontFamily: font, fontSize: 14, fontWeight: 900, textTransform: "uppercase" }}>
                  {deleting ? "Suppression…" : "SUPPRIMER"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#0d0d18", border: `1px solid ${colors.goldBorder}`, borderRadius: 14, padding: "12px 22px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: font, pointerEvents: "none", whiteSpace: "nowrap" }}
          >
            <Check size={16} color={colors.gold} />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.03em" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}