"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, Play, Search, Share2, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { flushSync } from "react-dom";
import { viewTransition } from "../../lib/view-transition";
import TrailerEmbed from "../components/works/TrailerEmbed";
import OptimizedImage from "../components/OptimizedImage";
import { supabase } from "../../lib/supabase";
import { DOSSIER_BASH_DATA, normalizeDossierBashKey } from "../../lib/dossier-bash";
import type { BiblioEntry, SupabaseBiblioRow, BiblioCategory, BiblioTier } from "../types";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import { normalize } from "../utils/text";
import "./biblio.css";

type Category = "Tout" | BiblioCategory;
type Tier = BiblioTier;
type SortBy = "recent" | "oldest" | "note" | "alpha";

const tierConfig: Record<Tier, { color: string; label: string }> = {
  "Chef-d'œuvre": { color: "#ffd700", label: "Chefs-d'œuvre" },
  "Pépite":       { color: "#34d399", label: "Pépites" },
  "Bof":          { color: "#94a3b8", label: "Bof" },
  "Surcoté":      { color: "#f87171", label: "Surcotés" },
  "A définir":    { color: "#a1a1aa", label: "En attente de verdict" },
};
const categoryColor: Record<string, string> = { "Anime": "#a78bfa", "Manga": "#f472b6", "Film/Série": "#60a5fa", "Jeu Vidéo": "#4ade80" };
const TIERS: Tier[] = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"];
const CATEGORIES: Category[] = ["Tout", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];
const SPOILER_KEY = "guilde-anti-spoiler";

type Chronique = (typeof DOSSIER_BASH_DATA)[number];

/** Ce que le lecteur affiche : une chronique du Bash ou une fiche de la base. */
interface Reading {
  key: string;
  kind: "chronique" | "fiche";
  title: string;
  cover: string;
  tag?: string;
  color?: string;
  date?: string;
  category?: string;
  tier?: Tier;
  note?: number;
  year?: number;
  status?: string;
  avis?: string;
  synopsis?: string;
  trailer?: string;
  favKey?: string;
}

const slug = (s: string) => normalizeDossierBashKey(s).replace(/\s+/g, "-");

function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const numericNote = (n: unknown) => { const v = Number(n); return Number.isFinite(v) && v > 0 ? v : undefined; };

export default function BibliothequePage() {
  const [oeuvres, setOeuvres] = useState<SupabaseBiblioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dossierBash, setDossierBash] = useState<Chronique[]>(DOSSIER_BASH_DATA);
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier, setActiveTier] = useState<Tier | "Tous">("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAllBriefs, setShowAllBriefs] = useState(false);
  const [reading, setReading] = useState<{ item: Reading; list: Reading[] } | null>(null);
  const [antiSpoiler, setAntiSpoiler] = useState(false);
  const { toggle, isFavorite, count: favoritesCount } = useFavorites();
  const { share, Toast } = useShare();
  const pendingLink = useRef<{ fiche?: string; chronique?: string } | null>(null);

  const fetchOeuvres = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.from("bibliotheque").select("*").order("created_at", { ascending: false });

    if (error) setLoadError(true);
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
        const hydrated = dossierRows.map((item) => {
          const match = dossierByKey.get(normalizeDossierBashKey(item.title));
          return {
            ...match,
            searchQuery: match?.searchQuery ?? item.title,
            anilistId: match?.anilistId ?? 0,
            title: item.title,
            date: item.dossier_bash_date || match?.date || "",
            tag: item.dossier_bash_tag || match?.tag || "DOSSIER BASH",
            color: item.dossier_bash_color || match?.color || "#c9a84c",
            review: item.avis_guilde || match?.review || item.synopsis || "",
            cover: item.cover_image || match?.localCover || match?.cover || "",
            localCover: match?.localCover,
            trailer_url: item.trailer_url || match?.trailer_url || undefined,
          };
        });
        hydrated.sort((a, b) => (a.date || "").localeCompare(b.date || "", "fr"));
        setDossierBash(hydrated);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    pendingLink.current = { fiche: p.get("fiche") ?? undefined, chronique: p.get("chronique") ?? undefined };
    try { setAntiSpoiler(localStorage.getItem(SPOILER_KEY) === "on"); } catch {}
    fetchOeuvres();
  }, [fetchOeuvres]);

  const entries: BiblioEntry[] = useMemo(() => oeuvres.map((d) => ({
    id: d.id,
    title: d.title,
    category: (d.type as BiblioCategory | undefined) || "Anime",
    tier: (d.tier as BiblioTier | undefined) || "A définir",
    year: d.year || new Date(d.created_at).getFullYear(),
    cover_image: d.cover_image || "",
    status: d.status || "Terminé",
    note: d.score || 0,
    synopsis: d.synopsis,
    avis_guilde: d.avis_guilde,
    trailer_url: d.trailer_url,
    created_at: d.created_at,
  })), [oeuvres]);

  const ficheToReading = useCallback((e: BiblioEntry): Reading => ({
    key: `fiche-${e.id}`,
    kind: "fiche",
    title: e.title,
    cover: e.cover_image,
    category: e.category,
    tier: e.tier,
    note: numericNote(e.note),
    year: e.year,
    status: e.status,
    avis: e.avis_guilde,
    synopsis: e.synopsis,
    trailer: e.trailer_url,
    favKey: String(e.id),
  }), []);

  // Une chronique hérite du verdict de sa fiche quand celle-ci existe en base.
  const chroniqueToReading = useCallback((c: Chronique): Reading => {
    const key = normalizeDossierBashKey(c.title);
    const search = normalizeDossierBashKey(c.searchQuery);
    const match = entries.find((e) => {
      const t = normalizeDossierBashKey(e.title);
      return t === key || (search && t.includes(search));
    });
    return {
      key: `chronique-${slug(c.title)}`,
      kind: "chronique",
      title: c.title,
      cover: c.cover,
      tag: c.tag,
      color: c.color,
      date: c.date,
      category: match?.category ?? "Anime",
      tier: match && match.tier !== "A définir" ? match.tier : undefined,
      note: match ? numericNote(match.note) : undefined,
      year: match?.year,
      status: match?.status,
      avis: c.review,
      synopsis: match?.synopsis,
      trailer: c.trailer_url || match?.trailer_url,
      favKey: match ? String(match.id) : undefined,
    };
  }, [entries]);

  const chroniques = useMemo(() => dossierBash.map(chroniqueToReading), [dossierBash, chroniqueToReading]);

  const filtered = useMemo(() => {
    const q = normalize(searchTerm.trim());
    const list = entries.filter((e) =>
      (activeCategory === "Tout" || e.category === activeCategory) &&
      (activeTier === "Tous" || e.tier === activeTier) &&
      (!q || normalize(e.title).includes(q)) &&
      (!showFavoritesOnly || isFavorite(e.id))
    );
    list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (sortBy === "note") return (Number(b.note) || 0) - (Number(a.note) || 0);
      return a.title.localeCompare(b.title, "fr");
    });
    return list;
  }, [entries, activeCategory, activeTier, searchTerm, showFavoritesOnly, isFavorite, sortBy]);

  const byTier = TIERS.map((tier) => ({ tier, items: filtered.filter((e) => e.tier === tier) })).filter((g) => g.items.length > 0);
  const filteredReadings = useMemo(() => filtered.map(ficheToReading), [filtered, ficheToReading]);

  const open = useCallback((item: Reading, list: Reading[]) => {
    setReading({ item, list });
    const url = new URL(window.location.href);
    url.searchParams.delete("fiche"); url.searchParams.delete("chronique");
    if (item.kind === "fiche") url.searchParams.set("fiche", item.key.replace("fiche-", ""));
    else url.searchParams.set("chronique", item.key.replace("chronique-", ""));
    window.history.replaceState({}, "", url);
  }, []);

  // Couverture touchée → fiche ; fermeture → retour à la couverture si elle est à l'écran.
  const openFrom = (item: Reading, list: Reading[], el: HTMLElement) => viewTransition({
    kind: "work", from: [[el.querySelector(".bb-card-cover"), "work-cover"]],
    update: () => flushSync(() => open(item, list)),
  });
  const closeVT = () => {
    const key = reading?.item.key;
    viewTransition({
      kind: "work", update: () => flushSync(() => close()),
      to: () => {
        const c = key ? document.querySelector<HTMLElement>(`[data-reading-key="${CSS.escape(key)}"] .bb-card-cover`) : null;
        const r = c?.getBoundingClientRect();
        return r && r.bottom > 0 && r.top < window.innerHeight ? [[c, "work-cover"]] : [];
      },
    });
  };
  // Filtres : fondu enchaîné bref au lieu d'un saut.
  const vtSet = (fn: () => void) => viewTransition({ kind: "list", update: () => flushSync(fn) });

  const close = useCallback(() => {
    setReading(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("fiche"); url.searchParams.delete("chronique");
    window.history.replaceState({}, "", url);
  }, []);

  // Liens profonds : /bibliotheque?fiche=12 ou ?chronique=titre-de-l-oeuvre
  useEffect(() => {
    const link = pendingLink.current;
    if (!link || loading) return;
    pendingLink.current = null;
    if (link.fiche) {
      const e = entries.find((x) => String(x.id) === link.fiche);
      if (e) open(ficheToReading(e), entries.map(ficheToReading));
    } else if (link.chronique) {
      const c = chroniques.find((x) => x.key === `chronique-${link.chronique}`);
      if (c) open(c, chroniques);
    }
  }, [loading, entries, chroniques, open, ficheToReading]);

  const toggleSpoiler = () => setAntiSpoiler((v) => {
    try { localStorage.setItem(SPOILER_KEY, v ? "off" : "on"); } catch {}
    return !v;
  });

  const [une, ...restChroniques] = chroniques;
  const duo = restChroniques.slice(0, 2);
  const briefs = restChroniques.slice(2);
  const visibleBriefs = showAllBriefs ? briefs : briefs.slice(0, 8);
  const hasFilters = activeCategory !== "Tout" || activeTier !== "Tous" || !!searchTerm || showFavoritesOnly;
  const resetFilters = () => { setActiveCategory("Tout"); setActiveTier("Tous"); setSearchTerm(""); setShowFavoritesOnly(false); };

  return (
    <div className="gk-page tone-dark bb-page">
      <GuildeHeader activePage="bibliotheque" tone="dark" />

      <main className="gk-wrap" style={{ paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <header className="bb-masthead gk-reveal">
          <div>
            <div className="gk-hero-kicker">
              <p className="gk-chapter"><b>06</b><span>LE MAGAZINE DE LA GUILDE</span></p>
              <span className="gk-jp" aria-hidden="true">Toshokan</span>
            </div>
            <h1 className="gk-display bb-title">La <span className="gk-inked">Bibliothèque</span></h1>
            <p className="gk-body" style={{ marginTop: 16 }}>
              Les verdicts définitifs de la Guilde. Animes, mangas, films, séries et jeux vidéo jugés sans pitié.
            </p>
          </div>
          <p className="bb-issue">
            Saison 2025/26
            <b>Printemps 2026</b>
            {chroniques.length} chroniques{entries.length > 0 ? `, ${entries.length} fiches` : ""}
          </p>
        </header>

        <hr className="gk-rule" />

        {/* ── LA CHRONIQUE DU BASH ───────────────────────────────────── */}
        {une && (
          <section className="bb-section" data-gk-motion="reveal" aria-labelledby="bb-bash">
            <div className="bb-head">
              <div>
                <span className="gk-hand">le dossier du printemps 2026</span>
                <h2 id="bb-bash" className="gk-display gk-h3">La Chronique du Bash</h2>
              </div>
              <span className="gk-stamp" aria-hidden="true">Tokushū</span>
            </div>

            <button type="button" className="gk-panel gk-press bb-une" onClick={() => open(une, chroniques)} style={{ "--tag": une.color } as React.CSSProperties}>
              <div className="bb-une-cover">
                {une.cover && <OptimizedImage src={une.cover} alt="" priority />}
              </div>
              <div className="bb-une-body">
                <div className="bb-kicker">
                  <span className="gk-tag gk-tag--solid">À la une</span>
                  {une.tag && <span className="bb-colortag">{une.tag}</span>}
                  {une.date && <span><Calendar size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {une.date}</span>}
                </div>
                <h3>{une.title}</h3>
                {une.avis && <p className="bb-quote">{une.avis.split("\n\n")[0]}</p>}
                <span className="bb-readmore">Lire la chronique <ArrowRight size={17} aria-hidden="true" /></span>
              </div>
            </button>

            {duo.length > 0 && (
              <div className="bb-duo">
                {duo.map((c) => (
                  <button key={c.key} type="button" className="gk-panel gk-press bb-dossier" onClick={() => open(c, chroniques)} style={{ "--tag": c.color } as React.CSSProperties}>
                    <div className="bb-dossier-cover">{c.cover && <OptimizedImage src={c.cover} alt="" />}</div>
                    <div className="bb-dossier-body">
                      <div className="bb-kicker">
                        {c.tag && <span className="bb-colortag">{c.tag}</span>}
                        {c.date && <span>{c.date}</span>}
                      </div>
                      <h3>{c.title}</h3>
                      {c.avis && <p>{c.avis.split("\n\n")[0]}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {briefs.length > 0 && (
              <>
                <ol className="bb-briefs" start={4}>
                  {visibleBriefs.map((c, i) => (
                    <li key={c.key}>
                      <button type="button" className="bb-brief" onClick={() => open(c, chroniques)} style={{ "--tag": c.color } as React.CSSProperties}>
                        <b aria-hidden="true">{String(i + 4).padStart(2, "0")}</b>
                        <span className="bb-brief-thumb">{c.cover && <OptimizedImage src={c.cover} alt="" />}</span>
                        <span style={{ minWidth: 0 }}>
                          <strong>{c.title}</strong>
                          <small>{c.tag}</small>
                          {c.avis && <em>{c.avis.split("\n\n")[0]}</em>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                {briefs.length > 8 && (
                  <div style={{ marginTop: 18 }}>
                    <button type="button" className="gk-btn gk-btn--ghost" onClick={() => setShowAllBriefs((v) => !v)} aria-expanded={showAllBriefs}>
                      {showAllBriefs ? "Replier la liste" : `Afficher les ${briefs.length - 8} autres chroniques`}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <hr className="gk-rule" />

        {/* ── LES VERDICTS ───────────────────────────────────────────── */}
        <section className="bb-section" data-gk-motion="reveal" aria-labelledby="bb-tiers">
          <div className="bb-head">
            <div>
              <span className="gk-hand">du chef-d&apos;œuvre au surcoté</span>
              <h2 id="bb-tiers" className="gk-display gk-h3">Tier list Otaku</h2>
            </div>
            <button type="button" className="gk-chip" aria-pressed={antiSpoiler} onClick={toggleSpoiler} title="Masque les avis et synopsis dans les fiches tant que tu ne les dévoiles pas">
              {antiSpoiler ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              <span>Anti-spoiler {antiSpoiler ? "activé" : "désactivé"}</span>
            </button>
          </div>

          {(loading || entries.length > 0) && (<>
          <div className="bb-tools">
            <div className="gk-field">
              <Search size={18} aria-hidden="true" />
              <input type="search" className="gk-input" placeholder="Chercher un titre" aria-label="Chercher un titre dans la bibliothèque" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <button type="button" className="gk-clear no-min" onClick={() => setSearchTerm("")} aria-label="Effacer la recherche">
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            <select className="bb-select" value={sortBy} onChange={(e) => { const v = e.target.value as SortBy; vtSet(() => setSortBy(v)); }} aria-label="Trier les fiches">
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="note">Mieux notés</option>
              <option value="alpha">De A à Z</option>
            </select>
            <span />
            <button type="button" className="gk-chip" aria-pressed={showFavoritesOnly} onClick={() => vtSet(() => setShowFavoritesOnly((v) => !v))}>
              <Heart size={15} aria-hidden="true" fill={showFavoritesOnly ? "currentColor" : "none"} />
              <span>Mes favoris <small>{favoritesCount}</small></span>
            </button>
          </div>

          <div className="bb-filters">
            <div className="gk-chips" role="group" aria-label="Filtrer par catégorie">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" className="gk-chip" aria-pressed={activeCategory === cat} onClick={() => vtSet(() => setActiveCategory(cat))}>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
            <div className="gk-chips" role="group" aria-label="Filtrer par verdict">
              <button type="button" className="gk-chip" aria-pressed={activeTier === "Tous"} onClick={() => vtSet(() => setActiveTier("Tous"))}><span>Tous les verdicts</span></button>
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="gk-chip"
                  aria-pressed={activeTier === t}
                  onClick={() => vtSet(() => setActiveTier(activeTier === t ? "Tous" : t))}
                  style={{ "--gk-accent": tierConfig[t].color } as React.CSSProperties}
                >
                  <span>{tierConfig[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          <p role="status" aria-live="polite" style={{ margin: "14px 0 0", font: "700 0.95rem var(--gk-font-ui)", color: "var(--gk-dim)" }}>
            {loading ? "Chargement des fiches..." : `${filtered.length} ${filtered.length > 1 ? "fiches" : "fiche"}`}
          </p>

          </>)}

          {loading ? (
            <div className="bb-grid" style={{ marginTop: 24 }} aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <div key={i} className="gk-skel" style={{ aspectRatio: "2 / 3.5" }} />)}
            </div>
          ) : loadError ? (
            <div className="gk-empty" style={{ marginTop: 24 }}>
              <div className="gk-empty-glyph" aria-hidden="true">Chūdan</div>
              <h3>Les rayons sont inaccessibles</h3>
              <p>Les fiches n&apos;ont pas pu être chargées. Vérifie ta connexion puis réessaie.</p>
              <button type="button" className="gk-btn" onClick={fetchOeuvres}>Réessayer</button>
            </div>
          ) : entries.length === 0 ? (
            <div className="gk-empty" style={{ marginTop: 8 }}>
              <div className="gk-empty-glyph" aria-hidden="true">Junbichū</div>
              <h3>Les verdicts arrivent</h3>
              <p>Aucune fiche n&apos;est encore publiée dans la tier list. En attendant, la Chronique du Bash est juste au-dessus.</p>
            </div>
          ) : byTier.length === 0 ? (
            <div className="gk-empty" style={{ marginTop: 24 }}>
              <div className="gk-empty-glyph" aria-hidden="true">Kara</div>
              <h3>{showFavoritesOnly && favoritesCount === 0 ? "Aucun favori pour l'instant" : "Rayon vide"}</h3>
              <p>
                {showFavoritesOnly && favoritesCount === 0
                  ? "Touche le cœur d'une fiche pour la retrouver ici. Tes favoris restent sur cet appareil."
                  : "Aucune œuvre ne correspond à ces filtres."}
              </p>
              {hasFilters && <button type="button" className="gk-btn" onClick={resetFilters}>Tout réafficher</button>}
            </div>
          ) : (
            <div key={`${activeCategory}-${activeTier}-${sortBy}-${showFavoritesOnly}`}>
              {byTier.map(({ tier, items }) => (
                <section key={tier} data-gk-motion="reveal" className="bb-tier" style={{ "--tier": tierConfig[tier].color } as React.CSSProperties} aria-label={tierConfig[tier].label}>
                  <div className="bb-tier-head">
                    <h3>{tierConfig[tier].label}</h3>
                    <span>{items.length} {items.length > 1 ? "titres" : "titre"}</span>
                  </div>
                  <div className={`bb-grid gk-stagger${tier === "Chef-d'œuvre" ? " is-top" : ""}`}>
                    {items.map((e, i) => {
                      const fav = isFavorite(e.id);
                      const note = numericNote(e.note);
                      return (
                        <article key={e.id} className="bb-card" data-reading-key={ficheToReading(e).key} style={{ "--i": i, "--cat": categoryColor[e.category] ?? "#f3eee2" } as React.CSSProperties}>
                          <button
                            type="button"
                            className="bb-fav no-min"
                            aria-pressed={fav}
                            aria-label={fav ? `Retirer ${e.title} des favoris` : `Ajouter ${e.title} aux favoris`}
                            onClick={() => toggle(e.id)}
                          >
                            <Heart size={17} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
                          </button>
                          <button type="button" className="bb-card-open" onClick={(ev) => openFrom(ficheToReading(e), filteredReadings, ev.currentTarget)} aria-label={`Ouvrir la fiche de ${e.title}`}>
                            <div className="bb-card-cover">
                              {e.cover_image ? <OptimizedImage src={e.cover_image} alt="" /> : <span className="bb-nocover" aria-hidden="true">{e.title.slice(0, 1)}</span>}
                              <span className="bb-cat">{e.category}</span>
                              {note !== undefined && <span className="bb-note">{note}<small>/10</small></span>}
                            </div>
                            <div className="bb-card-body">
                              <strong>{e.title}</strong>
                              {/* Court synopsis (masqué en mode anti-spoiler). */}
                              {e.synopsis && !antiSpoiler && <p className="bb-card-syn">{e.synopsis}</p>}
                              <small>{[e.category, e.status, e.year].filter(Boolean).join(" · ")}</small>
                            </div>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>

      {reading && (
        <Reader
          key={reading.item.key}
          item={reading.item}
          list={reading.list}
          all={entries}
          antiSpoiler={antiSpoiler}
          isFavorite={reading.item.favKey ? isFavorite(reading.item.favKey) : false}
          onToggleFavorite={reading.item.favKey ? () => toggle(reading.item.favKey!) : undefined}
          onOpen={(r) => open(r, reading.list.some((x) => x.key === r.key) ? reading.list : [r])}
          onClose={closeVT}
          onShare={() => share({
            title: `${reading.item.title} | Bibliothèque de la Guilde`,
            text: reading.item.kind === "chronique" ? `La Chronique du Bash : ${reading.item.title}` : `Le verdict de la Guilde sur ${reading.item.title}`,
          })}
          toReading={ficheToReading}
        />
      )}
      <Toast />
    </div>
  );
}

function Reader({ item, list, all, antiSpoiler, isFavorite, onToggleFavorite, onOpen, onClose, onShare, toReading }: {
  item: Reading;
  list: Reading[];
  all: BiblioEntry[];
  antiSpoiler: boolean;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  onOpen: (r: Reading) => void;
  onClose: () => void;
  onShare: () => void;
  toReading: (e: BiblioEntry) => Reading;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const tierColor = item.tier ? tierConfig[item.tier].color : item.color ?? "#c9a84c";
  const idx = list.findIndex((x) => x.key === item.key);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const video = youtubeId(item.trailer);

  // Recommandations : même catégorie, en priorité même verdict. Données réelles uniquement.
  const reco = useMemo(() => {
    const pool = all.filter((e) => e.category === item.category && normalize(e.title) !== normalize(item.title));
    const same = pool.filter((e) => item.tier && e.tier === item.tier);
    const others = pool.filter((e) => !same.includes(e)).sort((a, b) => (Number(b.note) || 0) - (Number(a.note) || 0));
    return [...same, ...others].slice(0, 4);
  }, [all, item]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && next) onOpen(next);
      else if (e.key === "ArrowLeft" && prev) onOpen(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !barRef.current) return;
    const max = el.scrollHeight - el.clientHeight;
    barRef.current.style.setProperty("--p", String(max > 0 ? Math.min(1, el.scrollTop / max) : 1));
  };
  useEffect(onScroll, []);

  const sections = [
    item.avis ? { id: "avis", label: item.kind === "chronique" ? "La chronique" : "L'avis de la Guilde" } : null,
    item.synopsis ? { id: "synopsis", label: "Synopsis" } : null,
    item.trailer ? { id: "trailer", label: "Bande-annonce" } : null,
    reco.length ? { id: "reco", label: "Dans le même rayon" } : null,
  ].filter(Boolean) as { id: string; label: string }[];

  const jump = (id: string) => scrollRef.current?.querySelector(`#bb-${id}`)?.scrollIntoView({ block: "start" });
  const masked = (id: string) => antiSpoiler && !revealed[id];

  const prose = (id: string, text: string, lead = false) => (
    <div className={`bb-spoiler${masked(id) ? " is-hidden" : ""}`}>
      <div className={`bb-prose${lead ? " is-lead" : ""}`} aria-hidden={masked(id) || undefined}>
        {text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {masked(id) && (
        <div className="bb-spoiler-btn">
          <button type="button" className="gk-btn" onClick={() => setRevealed((r) => ({ ...r, [id]: true }))}>
            <Eye size={16} aria-hidden="true" /> Dévoiler ce passage
          </button>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="bb-reader-back tone-dark" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={scrollRef}
        className="bb-reader"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onScroll={onScroll}
        style={{ "--tier": tierColor, "--gk-accent": "#c9a84c" } as React.CSSProperties}
      >
        <div className="bb-reader-bar">
          <div className="bb-reader-actions">
            <button type="button" className="gk-icon-btn" onClick={onClose} aria-label="Fermer la lecture">
              <X size={20} aria-hidden="true" />
            </button>
            <span>{item.kind === "chronique" ? "La Chronique du Bash" : "Fiche de la Bibliothèque"}</span>
            {onToggleFavorite && (
              <button type="button" className="gk-icon-btn" aria-pressed={isFavorite} onClick={onToggleFavorite} aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="gk-icon-btn" onClick={onShare} aria-label="Partager cette page">
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="bb-progress" role="progressbar" aria-label="Progression de lecture"><i ref={barRef} /></div>
        </div>

        <article className="bb-article">
          {item.cover && <div className="bb-article-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${JSON.stringify(item.cover)})` }} />}
          <div className="bb-article-top">
            <div className="bb-article-cover" style={{ viewTransitionName: "work-cover" }}>{item.cover && <OptimizedImage src={item.cover} alt={`Couverture de ${item.title}`} priority />}</div>
            <div style={{ minWidth: 0 }}>
              <div className="bb-kicker" style={{ "--tag": item.color } as React.CSSProperties}>
                {item.tag && <span className="bb-colortag">{item.tag}</span>}
                {item.category && <span className="gk-tag">{item.category}</span>}
                {item.date && <span>{item.date}</span>}
              </div>
              <h2>{item.title}</h2>
              {(item.status || item.year) && (
                <p style={{ marginTop: 10, font: "700 0.95rem var(--gk-font-ui)", color: "var(--gk-dim)" }}>
                  {[item.status, item.year].filter(Boolean).join(", ")}
                </p>
              )}
              {(item.tier || item.note !== undefined) && (
                <p className="bb-verdict">
                  {item.note !== undefined && <b>{item.note}<small>/10</small></b>}
                  {item.tier && <span>{item.tier === "A définir" ? "En attente de verdict" : item.tier}</span>}
                </p>
              )}
              {video && (
                <p style={{ marginTop: 16 }}>
                  <button type="button" className="gk-btn gk-btn--red gk-btn--sm" onClick={() => jump("trailer")}>
                    <Play size={15} aria-hidden="true" /> Bande-annonce
                  </button>
                </p>
              )}
            </div>
          </div>

          {sections.length > 1 && (
            <nav className="bb-toc" aria-label="Sommaire de la fiche">
              <span>Sommaire</span>
              {sections.map((s) => (
                <button key={s.id} type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={() => jump(s.id)}>{s.label}</button>
              ))}
            </nav>
          )}

          {item.avis && (
            <section id="bb-avis" className="bb-block">
              <h3>{item.kind === "chronique" ? "La chronique" : "L'avis de la Guilde"}</h3>
              {prose("avis", item.avis, true)}
            </section>
          )}
          {item.synopsis ? (
            <section id="bb-synopsis" className="bb-block">
              <h3>Synopsis</h3>
              {prose("synopsis", item.synopsis)}
            </section>
          ) : item.kind === "chronique" ? (
            <p className="gk-body" style={{ marginTop: 28, fontSize: "0.92rem" }}>
              Cette œuvre n&apos;a pas encore sa fiche complète dans la base de la Guilde.
            </p>
          ) : null}
          {item.trailer && (
            <section id="bb-trailer" className="bb-block">
              <h3>Bande-annonce</h3>
              {video ? (
                <TrailerEmbed youtubeId={video} title={item.title} />
              ) : (
                <a className="gk-btn gk-btn--red" href={item.trailer} target="_blank" rel="noopener noreferrer">Voir la bande-annonce</a>
              )}
            </section>
          )}
          {reco.length > 0 && (
            <section id="bb-reco" className="bb-block">
              <h3>Dans le même rayon</h3>
              <div className="bb-reco">
                {reco.map((e) => (
                  <article key={e.id} className="bb-card" style={{ "--tier": tierConfig[e.tier].color, "--cat": categoryColor[e.category] ?? "#f3eee2" } as React.CSSProperties}>
                    <button type="button" className="bb-card-open" onClick={() => onOpen(toReading(e))} aria-label={`Ouvrir la fiche de ${e.title}`}>
                      <div className="bb-card-cover">
                        {e.cover_image ? <OptimizedImage src={e.cover_image} alt="" /> : null}
                        {numericNote(e.note) !== undefined && <span className="bb-note">{numericNote(e.note)}<small>/10</small></span>}
                      </div>
                      <div className="bb-card-body">
                        <strong>{e.title}</strong>
                        <small>{e.tier === "A définir" ? "En attente" : e.tier}</small>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(prev || next) && (
            <nav className="bb-pager" aria-label="Lecture précédente et suivante">
              {prev ? (
                <button type="button" onClick={() => onOpen(prev)}>
                  <small><ChevronLeft size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Précédent</small>
                  <strong>{prev.title}</strong>
                </button>
              ) : <span />}
              {next ? (
                <button type="button" onClick={() => onOpen(next)}>
                  <small>Suivant <ChevronRight size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /></small>
                  <strong>{next.title}</strong>
                </button>
              ) : <span />}
            </nav>
          )}

          {item.kind === "fiche" && (
            <p style={{ marginTop: 28, textAlign: "right" }}>
              <Link href="/admin-biblio" style={{ font: "600 0.85rem var(--gk-font-ui)", color: "var(--gk-faint)" }}>Éditer la fiche (admin)</Link>
            </p>
          )}
        </article>
      </div>
    </div>,
    document.body
  );
}
