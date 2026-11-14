"use client";

// Recherche d'œuvres commune à l'administration (favoris des membres, Bibliothèque).
// Anime et films : TMDB en français. Mangas : MangaDex. Avant de choisir, on voit le
// type exact, l'année, la source et ce qui existe vraiment en français.
import { useId, useRef, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { FORMAT_LABEL, SOURCE_LABEL, frenchLevel, type WorkCandidate, type WorkKind } from "../../../lib/works/types";
import "../../styles/works.css";

const FR_BADGE = {
  complet: { label: "Français : titre et synopsis", cls: "is-ok" },
  partiel: { label: "Français partiel", cls: "is-part" },
  aucun: { label: "Pas de français", cls: "is-none" },
} as const;

export interface WorkSearchProps {
  /** Type imposé (favoris) ; sans valeur, l'admin choisit anime ou manga. */
  kind?: WorkKind;
  /** Reçoit l'œuvre détaillée (synopsis, genres, bande-annonce) au moment du choix. */
  onPick: (work: WorkCandidate) => void;
  /** Vrai si l'œuvre est déjà dans la liste (bouton « Ajouté »). */
  isAdded?: (work: WorkCandidate) => boolean;
  pickLabel?: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(res.status === 401 ? "Session expirée : reconnecte-toi." : json?.error || `Erreur ${res.status}`);
  return json as T;
}

export default function WorkSearch({ kind: fixedKind, onPick, isAdded, pickLabel = "Choisir" }: WorkSearchProps) {
  const [kind, setKind] = useState<WorkKind>(fixedKind ?? "ANIME");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<WorkCandidate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, WorkCandidate>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const seq = useRef(0);
  const ids = useId();

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) { setError("Tape au moins deux caractères."); return; }
    const n = ++seq.current;
    setBusy(true); setError(null); setOpen(null);
    try {
      const { results } = await post<{ results: WorkCandidate[] }>("/api/works/search", { q, kind });
      if (n !== seq.current) return;
      setResults(results);
      if (!results.length) setError(kind === "ANIME" ? "Aucun anime trouvé. Essaie le titre français, anglais ou original, ou la saisie manuelle." : "Aucun manga trouvé. Essaie le titre anglais ou rōmaji, ou la saisie manuelle.");
    } catch (err) {
      if (n === seq.current) setError(err instanceof Error ? err.message : "Recherche impossible.");
    } finally { if (n === seq.current) setBusy(false); }
  }

  async function detail(c: WorkCandidate): Promise<WorkCandidate> {
    const key = `${c.source}:${c.sourceId}`;
    if (details[key]) return details[key];
    setLoadingId(key);
    try {
      const { work } = await post<{ work: WorkCandidate }>("/api/works/detail", { source: c.source, id: c.sourceId });
      setDetails((d) => ({ ...d, [key]: work }));
      return work;
    } finally { setLoadingId(null); }
  }

  async function toggle(c: WorkCandidate) {
    const key = `${c.source}:${c.sourceId}`;
    if (open === key) { setOpen(null); return; }
    setOpen(key);
    try { await detail(c); } catch (err) { setError(err instanceof Error ? err.message : "Détail indisponible."); }
  }

  async function pick(c: WorkCandidate) {
    try { onPick(await detail(c)); } catch {
      // Détail indisponible : on garde le résultat de recherche (déjà suffisant).
      onPick(c);
    }
  }

  return (
    <div className="wks">
      <form className="wks-form" onSubmit={search} role="search" aria-label="Rechercher une œuvre">
        {!fixedKind && (
          <div className="wks-kind" role="group" aria-label="Type d'œuvre">
            {(["ANIME", "MANGA"] as WorkKind[]).map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setResults(null); setError(null); }}>
                {k === "ANIME" ? "Anime et films" : "Mangas"}
              </button>
            ))}
          </div>
        )}
        <input
          className="wks-input" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" autoComplete="off" spellCheck={false}
          placeholder={kind === "ANIME" ? "Titre de l'anime ou du film…" : "Titre du manga…"}
          aria-label={kind === "ANIME" ? "Titre de l'anime ou du film" : "Titre du manga"}
        />
        <button className="wks-go" disabled={busy} aria-label="Lancer la recherche">
          {busy ? <Loader2 size={18} className="wks-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
        </button>
      </form>
      <p className="wks-hint">
        {kind === "ANIME" ? "Source : TMDB, en français (séries et films séparés)." : "Source : MangaDex (français quand il existe, sinon signalé)."}
      </p>
      {error && <p className="wks-error" role="alert">{error}</p>}

      {results && results.length > 0 && (
        <ul className="wks-list" aria-label="Résultats">
          {results.map((c) => {
            const key = `${c.source}:${c.sourceId}`;
            const d = details[key] ?? c;
            const level = frenchLevel(d);
            const added = isAdded?.(c) ?? false;
            const isOpen = open === key;
            const panelId = `${ids}-${key.replace(/\W/g, "")}`;
            return (
              <li key={key} className={`wks-item${isOpen ? " is-open" : ""}`}>
                <div className="wks-cover">
                  {c.coverUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.coverUrl} alt="" width={96} height={144} loading="lazy" decoding="async" />
                    : <span aria-hidden="true">{c.title.slice(0, 1)}</span>}
                </div>
                <div className="wks-body">
                  <p className="wks-meta">
                    <b>{FORMAT_LABEL[c.format]}</b>
                    {c.year && <span>{c.year}</span>}
                    <span>{SOURCE_LABEL[c.source]}</span>
                  </p>
                  <strong className="wks-title">{d.titleFr && !d.titleFrUnverified ? d.titleFr : c.title}</strong>
                  {[d.titleRomaji, d.titleEn].filter((t) => t && t !== (d.titleFr && !d.titleFrUnverified ? d.titleFr : c.title)).slice(0, 1).map((t) => <small key={t} className="wks-alt">{t}</small>)}
                  {d.titleFr && d.titleFrUnverified && <small className="wks-warn">Titre français proposé par la source, à vérifier : « {d.titleFr} »</small>}
                  <span className={`wks-fr ${FR_BADGE[level].cls}`}>{FR_BADGE[level].label}</span>
                  <div className="wks-actions">
                    <button type="button" className="wks-btn" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(c)}>
                      {loadingId === key ? "Chargement…" : isOpen ? "Masquer le détail" : "Voir le détail"}
                    </button>
                    <button type="button" className="wks-btn wks-btn--pick" disabled={added || loadingId === key} onClick={() => pick(c)}>
                      {added ? "Déjà ajouté" : pickLabel}
                    </button>
                  </div>
                  {isOpen && (
                    <div id={panelId} className="wks-detail">
                      {d.synopsisFr
                        ? <p><span className="wks-tag">Synopsis français ({d.synopsisCredit ? d.synopsisCredit.label : SOURCE_LABEL[c.source]})</span>{d.synopsisFr}</p>
                        : <p className="wks-none">Pas de synopsis français chez {SOURCE_LABEL[c.source]}. Tu pourras l&apos;écrire après l&apos;ajout.</p>}
                      {d.synopsisEn && !d.synopsisFr && (
                        <details>
                          <summary>Résumé en anglais (référence, jamais publié tel quel)</summary>
                          <p lang="en">{d.synopsisEn}</p>
                        </details>
                      )}
                      <p className="wks-facts">
                        {[d.genres?.join(", "), d.seasons ? `${d.seasons} saison${d.seasons > 1 ? "s" : ""}` : null, d.episodes ? `${d.episodes} épisodes` : null, d.status, d.trailer ? "Bande-annonce disponible" : null].filter(Boolean).join(" · ") || "Pas d'autre information."}
                      </p>
                      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Voir sur {SOURCE_LABEL[c.source]} <ExternalLink size={13} aria-hidden="true" /><span className="wks-sr"> (nouvel onglet)</span></a>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {results && <p className="wks-credit">Données et affiches : {kind === "ANIME" ? "TMDB (The Movie Database). Ce site utilise l'API TMDB sans être approuvé ni certifié par TMDB." : "MangaDex."}</p>}
    </div>
  );
}
