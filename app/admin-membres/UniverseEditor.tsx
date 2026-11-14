"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowDown, ArrowUp, Plus, Search, Star, Trash2 } from "lucide-react";
import { hasJapanese, sameWork, workKey, workTitle, type FavoriteWork, type MemberTrack } from "../../lib/member-extras";
import WorkSearch from "../components/works/WorkSearch";
import { candidateToFavorite, trailerLangLabel } from "../../lib/works/favorite";
import { FORMAT_LABEL, type WorkCandidate } from "../../lib/works/types";
import { parseMusicLink, openUrl, PROVIDER_LABEL, youtubeSearchUrl } from "../../lib/music";

type Kind = "ANIME" | "MANGA";
const SOURCE_NAME: Record<FavoriteWork["source"], string> = { tmdb: "TMDB", mangadex: "MangaDex", anilist: "AniList (ancien favori)", manual: "Saisie manuelle" };

const MAX_FEATURED = 3;

type LibraryIndex = Map<string, string>;
const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Synopsis des fiches de la Bibliothèque du site, indexés par titre (lecture publique). */
function useLibraryIndex(): LibraryIndex {
  const [index, setIndex] = useState<LibraryIndex>(new Map());
  useEffect(() => {
    let alive = true;
    supabase.from("bibliotheque").select("title, synopsis").then(({ data }) => {
      if (!alive || !data) return;
      setIndex(new Map((data as { title?: string; synopsis?: string }[]).filter((r) => r.title && r.synopsis).map((r) => [norm(r.title!), r.synopsis!])));
    });
    return () => { alive = false; };
  }, []);
  return index;
}

function SynopsisField({ work, reference, library, onChange }: { work: FavoriteWork; reference?: string; library: LibraryIndex; onChange: (s: string | undefined) => void }) {
  const fromLibrary = [work.titleRomaji, work.titleLocalized].map((t) => t && library.get(norm(t))).find(Boolean);
  const bad = !!work.synopsis && hasJapanese(work.synopsis);
  return (
    <details style={{ marginTop: 6 }}>
      <summary style={{ cursor: "pointer", font: "700 0.85rem var(--am-font)", textTransform: "uppercase", color: work.synopsis ? "var(--am-green)" : "var(--am-faint)" }}>
        Synopsis {work.synopsis ? (work.synopsisSource === "source" ? "(français de la source)" : "(écrit à la main)") : "(à écrire, facultatif)"}
      </summary>
      <textarea className="am-input" value={work.synopsis ?? ""} maxLength={700} rows={4} placeholder="Deux ou trois phrases en français, sans dévoiler la fin."
        aria-label={`Synopsis en français de ${workTitle(work)}`} aria-invalid={bad} onChange={(e) => onChange(e.target.value || undefined)} style={{ marginTop: 6 }} />
      <div className="am-row" style={{ marginTop: 6 }}>
        <small style={{ font: "500 0.8rem var(--am-body)", color: bad ? "var(--am-red)" : "var(--am-faint)" }}>{bad ? "Alphabet latin uniquement." : `${(work.synopsis ?? "").length} / 700`}</small>
        {fromLibrary && fromLibrary !== work.synopsis && (
          <button type="button" className="am-btn am-btn--sm" onClick={() => onChange(fromLibrary.slice(0, 700))}>Reprendre celui de la Bibliothèque</button>
        )}
      </div>
      {fromLibrary && <small style={{ display: "block", font: "500 0.78rem var(--am-body)", color: "var(--am-faint)" }}>Une fiche Bibliothèque existe pour ce titre : vérifie que son synopsis est bien en français.</small>}
      {reference && (
        <details style={{ marginTop: 6 }}>
          <summary style={{ cursor: "pointer", font: "600 0.8rem var(--am-body)", color: "var(--am-faint)" }}>Résumé en anglais de la source (référence pour écrire, jamais publié)</summary>
          <p style={{ font: "500 0.85rem/1.45 var(--am-body)", color: "var(--am-dim)", marginTop: 4 }}>{reference}</p>
        </details>
      )}
    </details>
  );
}

function FavoriteList({ kind, label, works, onChange, library }: { kind: Kind; label: string; works: FavoriteWork[]; onChange: (w: FavoriteWork[]) => void; library: LibraryIndex }) {
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [mRomaji, setMRomaji] = useState("");
  const [mLocal, setMLocal] = useState("");
  const featuredCount = works.filter((w) => w.featured).length;

  const renumber = (list: FavoriteWork[]) => list.map((w, i) => ({ ...w, rank: i + 1 }));
  // Références non enregistrées : résumé anglais et titre français à confirmer.
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [frSuggest, setFrSuggest] = useState<Record<string, string>>({});
  const add = (w: FavoriteWork) => {
    if (works.some((x) => sameWork(x, w))) { setError("Cette œuvre est déjà dans la liste."); return; }
    setError(null);
    onChange(renumber([...works, { ...w, kind }]));
  };
  const addCandidate = (c: WorkCandidate) => {
    const fav = candidateToFavorite(c);
    const k = workKey({ ...fav, kind });
    if (c.synopsisEn && !c.synopsisFr) setRefs((r) => ({ ...r, [k]: c.synopsisEn! }));
    if (c.titleFr && c.titleFrUnverified) setFrSuggest((r) => ({ ...r, [k]: c.titleFr! }));
    add(fav);
  };
  const move = (i: number, d: -1 | 1) => { const l = [...works]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; onChange(renumber(l)); };
  const patch = (i: number, p: Partial<FavoriteWork>) => onChange(works.map((w, k) => (k === i ? { ...w, ...p } : w)));

  function addManual() {
    const r = mRomaji.trim(), l = mLocal.trim();
    if (!r && !l) { setError("Indique au moins un titre."); return; }
    if (hasJapanese(r) || hasJapanese(l)) { setError("Écris le titre en alphabet latin (rōmaji, français ou anglais)."); return; }
    add({ source: "manual", kind, titleRomaji: r || undefined, titleLocalized: l || undefined });
    setMRomaji(""); setMLocal(""); setManual(false); setError(null);
  }

  return (
    <div className="am-section">
      <h3>{label}</h3>
      {works.length === 0 ? <p className="am-empty">Aucun titre. La fiche affiche « Ses coups de cœur arrivent bientôt ».</p> : (
        <ol className="am-list" aria-label={`${label}, dans l'ordre`}>
          {works.map((w, i) => {
            const noteBad = !!w.personalNote && hasJapanese(w.personalNote);
            return (
              <li key={workKey(w)} className="am-item">
                {w.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={w.coverUrl} alt="" loading="lazy" />
                  : <span className="am-thumb" aria-hidden="true" />}
                <div style={{ minWidth: 0 }}>
                  <strong>{i + 1}. {workTitle(w)}</strong>
                  {w.titleLocalized && w.titleRomaji && w.titleLocalized !== w.titleRomaji && <small>{w.titleLocalized}</small>}
                  <small>{[w.format && FORMAT_LABEL[w.format], w.year, SOURCE_NAME[w.source], w.trailer && `bande-annonce ${trailerLangLabel(w.trailer.lang)}`, w.featured && "coup de cœur"].filter(Boolean).join(" · ")}</small>
                  {frSuggest[workKey(w)] && (
                    <div className="am-row">
                      <small style={{ color: "var(--am-gold)" }}>Titre français proposé par la source : « {frSuggest[workKey(w)]} » (à vérifier)</small>
                      <button type="button" className="am-btn am-btn--sm" onClick={() => { const t = frSuggest[workKey(w)]; patch(i, { titleLocalized: t, titleRomaji: w.titleRomaji ?? (w.titleLocalized !== t ? w.titleLocalized : undefined) }); setFrSuggest((r) => { const n = { ...r }; delete n[workKey(w)]; return n; }); }}>Utiliser ce titre</button>
                    </div>
                  )}
                  <input className="am-input" value={w.personalNote ?? ""} maxLength={280} placeholder="Pourquoi j'aime (facultatif)"
                    aria-label={`Note personnelle pour ${workTitle(w)}`} aria-invalid={noteBad}
                    onChange={(e) => patch(i, { personalNote: e.target.value || undefined })} />
                  {noteBad && <small style={{ color: "var(--am-red)" }}>Pas de caractères japonais : cette note ne serait pas enregistrée.</small>}
                  <SynopsisField work={w} reference={refs[workKey(w)]} library={library} onChange={(synopsis) => patch(i, { synopsis, synopsisSource: synopsis ? "manual" : undefined })} />
                </div>
                <div className="am-item-actions">
                  <button type="button" className="am-icon am-star" aria-pressed={!!w.featured} disabled={!w.featured && featuredCount >= MAX_FEATURED}
                    aria-label={w.featured ? "Retirer des coups de cœur" : `Mettre en coup de cœur (${MAX_FEATURED} max)`}
                    onClick={() => patch(i, { featured: !w.featured })}><Star size={16} aria-hidden="true" /></button>
                  <button type="button" className="am-icon" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
                  <button type="button" className="am-icon" aria-label="Descendre" disabled={i === works.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
                  <button type="button" className="am-icon" aria-label={`Retirer ${workTitle(w)}`} onClick={() => onChange(renumber(works.filter((_, k) => k !== i)))}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <WorkSearch kind={kind} pickLabel="Ajouter" onPick={addCandidate} isAdded={(c) => works.some((x) => sameWork(x, { ...candidateToFavorite(c), kind }))} />
      {error && <p className="am-alert am-alert--error" role="alert">{error}</p>}
      {!manual ? (
        <button type="button" className="am-btn am-btn--sm" style={{ justifySelf: "start" }} onClick={() => setManual(true)}>Œuvre introuvable : saisie manuelle</button>
      ) : (
        <div className="am-grid2">
          <label className="am-field"><span>Titre rōmaji</span><input className="am-input" value={mRomaji} onChange={(e) => setMRomaji(e.target.value)} /></label>
          <label className="am-field"><span>Titre français ou anglais</span><input className="am-input" value={mLocal} onChange={(e) => setMLocal(e.target.value)} /></label>
          <div className="am-row"><button type="button" className="am-btn am-btn--sm" onClick={addManual}>Ajouter ce titre</button><button type="button" className="am-btn am-btn--sm" onClick={() => setManual(false)}>Annuler</button></div>
        </div>
      )}
    </div>
  );
}

type TrackCandidate = MemberTrack & { previewUrl?: string; source?: string };

function MusicList({ tracks, onChange }: { tracks: MemberTrack[]; onChange: (t: MemberTrack[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TrackCandidate[]>([]);
  const [links, setLinks] = useState<{ spotify: string; youtube: string; apple: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState<{ url: string; title: string; artist: string; album?: string; cover?: string }>({ url: "", title: "", artist: "" });
  const [error, setError] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) { setError("Tape un titre, un artiste, ou colle un lien."); return; }
    setSearching(true); setError(null); setResults([]);
    try {
      const res = await fetch("/api/admin/music-search", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) });
      const json = await res.json().catch(() => null);
      setLinks(json?.links ?? null);
      if (!res.ok) throw new Error(res.status === 401 ? "Session expirée : reconnecte-toi" : json?.error || `Erreur ${res.status}`);
      setResults(json.results ?? []);
      if (json.notice) setError(json.notice);
      else if (!json.results?.length) setError("Aucun résultat. Essaie « artiste titre », ou colle le lien du morceau.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible");
    } finally { setSearching(false); }
  }

  function choose(c: TrackCandidate) {
    // Résultat Apple (catalogue iTunes) : on reprend titre, artiste et pochette ;
    // le lien à coller est celui du morceau sur YouTube (lecture complète pour tous).
    const keepLink = c.provider !== "apple";
    setDraft({ url: keepLink ? openUrl(c) : "", title: c.title ?? "", artist: c.artist ?? "", album: c.album, cover: c.cover });
    setError(keepLink ? null : "Infos reprises. Ouvre « Chercher sur YouTube », copie le lien de la vidéo, puis colle-le dans « Lien du morceau ».");
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const ref = parseMusicLink(draft.url);
    if (!ref) { setError("Lien non reconnu. Colle le lien YouTube du morceau (ou Spotify)."); return; }
    if (ref.provider === "apple") { setError("Apple Music n'est plus lu sur le site : colle le lien YouTube du même morceau."); return; }
    if (tracks.some((t) => t.provider === ref.provider && t.id === ref.id)) { setError("Ce morceau est déjà dans la liste."); return; }
    if (hasJapanese(draft.title) || hasJapanese(draft.artist)) { setError("Titre et artiste en alphabet latin (rōmaji si besoin)."); return; }
    if (tracks.length >= 10) { setError("10 morceaux maximum."); return; }
    // Pochette Apple reprise d'une recherche : gardée ; sinon miniature YouTube par défaut côté site.
    onChange([...tracks, { ...ref, title: draft.title.trim() || undefined, artist: draft.artist.trim() || undefined, album: draft.album, cover: draft.cover }]);
    setDraft({ url: "", title: "", artist: "" }); setResults([]); setQ(""); setError(null);
  }
  const patch = (i: number, p: Partial<MemberTrack>) => onChange(tracks.map((t, k) => (k === i ? { ...t, ...p } : t)));

  return (
    <div className="am-section">
      <h3>Musique (Ongaku)</h3>
      <p>Choisie par le membre. Le premier morceau est sa <b>musique favorite</b> : il apparaît sur la carte et l&apos;aperçu de partage. Sur la fiche, rien ne démarre tout seul.</p>
      {tracks.length === 0 ? <p className="am-empty">Aucun morceau.</p> : (
        <ol className="am-list">
          {tracks.map((t, i) => (
            <li key={`${t.provider}:${t.id}`} className="am-item">
              {t.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.cover} alt="" loading="lazy" style={{ height: 46, objectFit: "cover" }} />
                : <span className="am-thumb" style={{ height: 46 }} aria-hidden="true" />}
              <div style={{ minWidth: 0 }}>
                <small>{i === 0 ? "Favorite · " : ""}{PROVIDER_LABEL[t.provider]}{t.album ? ` · ${t.album}` : ""}</small>
                <input className="am-input" value={t.title ?? ""} maxLength={160} placeholder="Titre du morceau" aria-label="Titre du morceau"
                  aria-invalid={hasJapanese(t.title ?? "")} onChange={(e) => patch(i, { title: e.target.value || undefined })} />
                <input className="am-input" value={t.artist ?? ""} maxLength={120} placeholder="Artiste" aria-label="Artiste"
                  aria-invalid={hasJapanese(t.artist ?? "")} onChange={(e) => patch(i, { artist: e.target.value || undefined })} />
                <a href={openUrl(t)} target="_blank" rel="noopener noreferrer" style={{ font: "500 0.8rem var(--am-body)", color: "var(--am-gold)" }}>Vérifier le lien ↗</a>
                {t.provider === "apple" && <p className="am-alert am-alert--error" style={{ marginTop: 6 }}>Apple Music n&apos;est plus lu sur le site : ajoute le lien YouTube de ce morceau puis retire celui-ci.</p>}
              </div>
              <div className="am-item-actions">
                <button type="button" className="am-icon" aria-label="Monter" disabled={i === 0} onClick={() => { const l = [...tracks]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; onChange(l); }}><ArrowUp size={16} aria-hidden="true" /></button>
                <button type="button" className="am-icon" aria-label={`Retirer ${t.title || "ce morceau"}`} onClick={() => onChange(tracks.filter((_, k) => k !== i))}><Trash2 size={16} aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form className="am-search" onSubmit={search} role="search">
        <input className="am-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, artiste… ou lien YouTube / Spotify" aria-label="Rechercher un morceau" />
        <button className="am-btn" disabled={searching} aria-label="Lancer la recherche musicale"><Search size={16} aria-hidden="true" />{searching ? "…" : ""}</button>
      </form>
      {error && <p className="am-alert am-alert--error" role="alert">{error}</p>}
      {results.length > 0 && (
        <div className="am-results" aria-label="Résultats de recherche musicale">
          {results.map((c) => (
            <div key={`${c.provider}:${c.id}`} className="am-result">
              {c.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.cover} alt="" loading="lazy" style={{ height: 46, objectFit: "cover" }} />
                : <span className="am-thumb" style={{ height: 46 }} aria-hidden="true" />}
              <div style={{ minWidth: 0 }}>
                <strong>{c.title || "Titre inconnu"}</strong>
                <small>{[c.artist, c.album, PROVIDER_LABEL[c.provider]].filter(Boolean).join(" · ")}</small>
                {c.previewUrl && <audio controls preload="none" src={c.previewUrl} style={{ width: "100%", height: 32, marginTop: 4 }} aria-label={`Extrait de ${c.title ?? "ce morceau"}`} />}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <button type="button" className="am-btn am-btn--sm" onClick={() => choose(c)}>{c.provider === "apple" ? "Reprendre les infos" : "Choisir"}</button>
                {c.provider === "apple" && youtubeSearchUrl(c) && (
                  <a className="am-btn am-btn--sm" href={youtubeSearchUrl(c)!} target="_blank" rel="noopener noreferrer">Chercher sur YouTube ↗</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {links && (
        <p className="am-empty" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          Trouver le même titre :
          <a href={links.spotify} target="_blank" rel="noopener noreferrer" style={{ color: "var(--am-gold)" }}>sur Spotify ↗</a>
          <a href={links.youtube} target="_blank" rel="noopener noreferrer" style={{ color: "var(--am-gold)" }}>sur YouTube ↗</a>
          <span>puis colle son lien ci-dessus.</span>
        </p>
      )}

      <form className="am-grid2" onSubmit={add}>
        <label className="am-field" style={{ gridColumn: "1 / -1" }}><span>Lien du morceau</span>
          <input className="am-input" inputMode="url" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value, cover: undefined, album: undefined }))} placeholder="https://www.youtube.com/watch?v=…" /></label>
        <label className="am-field"><span>Titre</span><input className="am-input" value={draft.title} maxLength={160} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /></label>
        <label className="am-field"><span>Artiste</span><input className="am-input" value={draft.artist} maxLength={120} onChange={(e) => setDraft((d) => ({ ...d, artist: e.target.value }))} /></label>
        <div className="am-row" style={{ gridColumn: "1 / -1" }}>
          {draft.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.cover} alt="Pochette choisie" width={56} height={56} style={{ borderRadius: 6, objectFit: "cover" }} />
          )}
          <button className="am-btn am-btn--sm"><Plus size={14} aria-hidden="true" /> Ajouter le morceau</button>
        </div>
      </form>
      <small style={{ font: "500 0.82rem/1.4 var(--am-body)", color: "var(--am-faint)" }}>Sur la fiche, la musique se lit dans le lecteur flottant du site. <b>YouTube</b> joue le morceau complet pour tout le monde, sans compte : c&apos;est le format conseillé. Spotify ne joue qu&apos;un extrait de 30 s aux visiteurs non connectés. Apple Music n&apos;est plus lu. La recherche par titre sert à reprendre titre, artiste et pochette ; un lien YouTube ou Spotify collé est complété automatiquement.</small>
    </div>
  );
}

export default function UniverseEditor({ anime, manga, music, alias, onChange }: {
  anime: FavoriteWork[]; manga: FavoriteWork[]; music: MemberTrack[]; alias: string;
  onChange: (p: { favoriteAnime?: FavoriteWork[]; favoriteManga?: FavoriteWork[]; music?: MemberTrack[]; displayNameRomaji?: string }) => void;
}) {
  const library = useLibraryIndex();
  return (
    <>
      <label className="am-field">
        <span>Surnom en rōmaji (facultatif)</span>
        <input className="am-input" value={alias} maxLength={80} aria-invalid={hasJapanese(alias)} onChange={(e) => onChange({ displayNameRomaji: e.target.value })} />
        <small>{hasJapanese(alias) ? "Alphabet latin uniquement." : "Affiché sous le nom sur la fiche. Ne pas inventer : seulement si le membre l'utilise."}</small>
      </label>
      <FavoriteList kind="ANIME" label="Suki na anime : anime préférés" works={anime} onChange={(w) => onChange({ favoriteAnime: w })} library={library} />
      <FavoriteList kind="MANGA" label="Suki na manga : mangas préférés" works={manga} onChange={(w) => onChange({ favoriteManga: w })} library={library} />
      <MusicList tracks={music} onChange={(t) => onChange({ music: t })} />
    </>
  );
}
