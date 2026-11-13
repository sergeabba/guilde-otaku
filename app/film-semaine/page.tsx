"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, Clock, Eye, Play, Search, Share2, Star, Trophy, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { useShare } from "../hooks/useShare";
import { normalize } from "../utils/text";
import "./film.css";

interface FilmEntry {
  id: number;
  title: string;
  tmdb_id: number | null;
  week_label: string;
  week_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  synopsis: string | null;
  trailer_key: string | null;
  vote_average: number | null;
  genres: string | null;
  year: number | null;
  runtime: number | null;
  director: string | null;
  watched: boolean;
  chosen?: boolean;
  created_at: string;
}

const tmdb = (path: string | null, size: string) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

function formatRuntime(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

function Meta({ film }: { film: FilmEntry }) {
  return (
    <div className="fs-meta">
      {film.year && <span><Calendar size={15} aria-hidden="true" /> {film.year}</span>}
      {film.runtime ? <span><Clock size={15} aria-hidden="true" /> {formatRuntime(film.runtime)}</span> : null}
      {film.vote_average ? (
        <span className="fs-note" title="Note moyenne TMDB">
          <Star size={15} fill="currentColor" aria-hidden="true" /> {film.vote_average.toFixed(1)}
          <span className="gk-sr"> sur 10, note TMDB</span>
        </span>
      ) : null}
      {film.director && <span>de {film.director}</span>}
    </div>
  );
}

function FilmCard({ film, onClick }: { film: FilmEntry; onClick: () => void }) {
  const poster = tmdb(film.poster_path, "w342");
  return (
    <button type="button" className="fs-card" onClick={onClick} aria-label={`Ouvrir la fiche de ${film.title}`}>
      <div className="fs-card-media">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="fs-poster-empty" aria-hidden="true">映</div>
        )}
        <div className="fs-card-flags">
          {film.chosen && <span>Élu</span>}
          {film.watched && <span className="is-seen">Vu</span>}
        </div>
        {film.vote_average ? (
          <span className="fs-card-note" aria-hidden="true"><Star size={11} fill="currentColor" /> {film.vote_average.toFixed(1)}</span>
        ) : null}
      </div>
      <div className="fs-card-body">
        <strong>{film.title}</strong>
        <small>{[film.year, formatRuntime(film.runtime), film.genres?.split(", ")[0]].filter(Boolean).join(", ")}</small>
      </div>
    </button>
  );
}

/** Calque modal générique : Échap, clic extérieur, verrou du défilement, focus. */
function Overlay({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, a, iframe")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      className="fs-overlay tone-dark fs-page"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(5,4,3,0.9)" }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function FilmSemainePage() {
  const [films, setFilms] = useState<FilmEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<FilmEntry | null>(null);
  const [trailer, setTrailer] = useState<FilmEntry | null>(null);
  const [query, setQuery] = useState("");
  const [electedOnly, setElectedOnly] = useState(false);
  const { share, Toast } = useShare();

  const load = () => {
    setError(null);
    setFilms(null);
    fetch("/api/film-semaine")
      .then(async (r) => {
        const data = await r.json().catch(() => ({ error: "Réponse serveur illisible." }));
        if (!r.ok || data.error) throw new Error(data.needsSetup ? "SETUP" : data.error || "Erreur serveur");
        setFilms(data.films ?? []);
      })
      .catch((e: Error) => { setError(e.message); setFilms([]); });
  };
  useEffect(load, []);

  const weeks = useMemo(() => {
    const map = new Map<string, FilmEntry[]>();
    for (const f of films ?? []) {
      if (!map.has(f.week_label)) map.set(f.week_label, []);
      map.get(f.week_label)!.push(f);
    }
    return [...map.entries()].sort(([, a], [, b]) => new Date(b[0].week_date).getTime() - new Date(a[0].week_date).getTime());
  }, [films]);

  const current = weeks[0];
  const chosen = current?.[1].find((f) => f.chosen);
  const candidates = current?.[1].filter((f) => !f.chosen) ?? [];

  const archives = useMemo(() => {
    const q = normalize(query.trim());
    return weeks.slice(1)
      .map(([label, list], i) => ({ label, list, no: weeks.length - 1 - i }))
      .filter(({ label, list }) => {
        if (electedOnly && !list.some((f) => f.chosen)) return false;
        if (!q) return true;
        return normalize(label).includes(q) || list.some((f) => normalize(`${f.title} ${f.genres ?? ""} ${f.director ?? ""}`).includes(q));
      });
  }, [weeks, query, electedOnly]);

  const loading = films === null;
  const backdrop = chosen ? tmdb(chosen.backdrop_path, "w1280") : null;
  const poster = chosen ? tmdb(chosen.poster_path, "w500") : null;

  return (
    <div className="gk-page tone-dark fs-page">
      <GuildeHeader activePage="film-semaine" accentColor="#f0a030" bgColor="#0a0806" tone="dark" />

      <main>
        {loading ? (
          <div className="gk-wrap" style={{ paddingBlock: 32 }} role="status" aria-label="Chargement de la programmation">
            <div className="gk-skel" style={{ height: "clamp(220px, 40vw, 440px)" }} />
            <div className="gk-skel" style={{ height: 70, width: "70%", marginTop: 20 }} />
            <div className="fs-grid" style={{ marginTop: 28 }}>
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="gk-skel" style={{ aspectRatio: "2 / 3.4" }} />)}
            </div>
          </div>
        ) : error ? (
          <div className="gk-wrap" style={{ paddingBlock: "clamp(40px, 8vw, 96px)" }}>
            <div className="gk-empty">
              <div className="gk-empty-glyph" aria-hidden="true">幕</div>
              <h3>Le rideau reste fermé</h3>
              <p>
                {error === "SETUP"
                  ? "La programmation n'est pas encore installée côté base de données. Préviens un admin de la Guilde."
                  : "La programmation n'a pas pu être chargée. Vérifie ta connexion puis réessaie."}
              </p>
              <button type="button" className="gk-btn" onClick={load}>Réessayer</button>
            </div>
          </div>
        ) : weeks.length === 0 ? (
          <div className="gk-wrap" style={{ paddingBlock: "clamp(40px, 8vw, 96px)" }}>
            <div className="gk-empty">
              <div className="gk-empty-glyph" aria-hidden="true">休</div>
              <h3>Relâche cette semaine</h3>
              <p>Aucun film n&apos;est programmé pour le moment. La prochaine sélection apparaîtra ici.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── À L'AFFICHE ─────────────────────────────────────────── */}
            {chosen ? (
              <section aria-labelledby="fs-title">
                <div className="fs-backdrop" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {backdrop && <img src={backdrop} alt="" fetchPriority="high" />}
                </div>
                <div className="gk-wrap fs-lead">
                  <div className="fs-poster">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt={`Affiche de ${chosen.title}`} />
                    ) : (
                      <div className="fs-poster-empty" aria-hidden="true">映</div>
                    )}
                  </div>
                  <div className="gk-reveal" style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      <p className="gk-chapter"><b>05</b><span>FILM DE LA SEMAINE</span></p>
                      <p className="fs-ticket">
                        <span><Trophy size={14} aria-hidden="true" /> Film élu</span>
                        <span>{current[0]}</span>
                      </p>
                    </div>
                    <h1 id="fs-title" className="gk-display fs-title">{chosen.title}</h1>
                    <Meta film={chosen} />
                    {chosen.genres && (
                      <div className="fs-genres">
                        {chosen.genres.split(", ").map((g) => <span key={g} className="gk-tag">{g}</span>)}
                      </div>
                    )}
                    {chosen.synopsis && <p className="gk-body fs-synopsis">{chosen.synopsis}</p>}
                    <div className="fs-actions">
                      {chosen.trailer_key && (
                        <button type="button" className="gk-btn gk-btn--red" onClick={() => setTrailer(chosen)}>
                          <Play size={17} fill="currentColor" aria-hidden="true" /> Voir la bande-annonce
                        </button>
                      )}
                      <button
                        type="button"
                        className="gk-btn gk-btn--ghost"
                        onClick={() => share({ title: `${chosen.title}, film de la semaine`, text: `La Guilde regarde ${chosen.title} (${current[0]}).`, url: "/film-semaine" })}
                      >
                        <Share2 size={16} aria-hidden="true" /> Partager
                      </button>
                      {chosen.watched && <span className="fs-seen"><Eye size={15} aria-hidden="true" /> Vu en soirée</span>}
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="gk-wrap gk-hero gk-reveal">
                <div className="gk-hero-kicker">
                  <p className="gk-chapter"><b>05</b><span>SOIRÉES CINÉ DE LA GUILDE</span></p>
                  <p className="fs-ticket"><span>En lice</span><span>{current[0]}</span></p>
                </div>
                <h1 className="gk-display gk-h1" style={{ fontSize: "clamp(2.4rem, 10vw, 6.4rem)" }}>Film de la semaine</h1>
                <p className="gk-body gk-hero-lede">Le film de cette séance n&apos;est pas encore désigné. Voici les candidats.</p>
              </section>
            )}

            {candidates.length > 0 && (
              <section className="gk-wrap fs-section" aria-labelledby="fs-cand">
                <div className="fs-section-head">
                  <h2 id="fs-cand" className="gk-display gk-h3">{chosen ? "Les autres candidats" : "Les candidats"}</h2>
                  <span className="gk-tag">{candidates.length} {candidates.length > 1 ? "films" : "film"}</span>
                </div>
                <div className="fs-grid gk-stagger">
                  {candidates.map((f, i) => (
                    <div key={f.id} style={{ "--i": i, display: "flex" } as React.CSSProperties}>
                      <FilmCard film={f} onClick={() => setSelectedFilm(f)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── ARCHIVES ────────────────────────────────────────────── */}
            {weeks.length > 1 && (
              <section className="gk-wrap fs-section" aria-labelledby="fs-arch" style={{ paddingBottom: "clamp(56px, 9vw, 110px)" }}>
                <hr className="gk-rule" style={{ marginBottom: "clamp(24px, 4vw, 44px)" }} />
                <div className="fs-section-head">
                  <div>
                    <span className="gk-hand">déjà projetés</span>
                    <h2 id="fs-arch" className="gk-display gk-h3">Les séances précédentes</h2>
                  </div>
                  <span className="gk-tag">{weeks.length - 1} {weeks.length - 1 > 1 ? "séances" : "séance"}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div className="gk-field" style={{ flex: "1 1 260px", maxWidth: 420 }}>
                    <Search size={18} aria-hidden="true" />
                    <input
                      type="search"
                      className="gk-input"
                      placeholder="Un titre, un genre, une semaine"
                      aria-label="Chercher dans les séances précédentes"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button type="button" className="gk-clear no-min" onClick={() => setQuery("")} aria-label="Effacer la recherche">
                        <X size={17} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <button type="button" className="gk-chip" aria-pressed={electedOnly} onClick={() => setElectedOnly((v) => !v)}>
                    <span>Séances avec un film élu</span>
                  </button>
                </div>

                {archives.length === 0 ? (
                  <div className="gk-empty">
                    <div className="gk-empty-glyph" aria-hidden="true">無</div>
                    <h3>Aucune séance trouvée</h3>
                    <p>Rien ne correspond à cette recherche dans les archives.</p>
                    <button type="button" className="gk-btn" onClick={() => { setQuery(""); setElectedOnly(false); }}>Revoir toutes les séances</button>
                  </div>
                ) : (
                  archives.map(({ label, list, no }) => {
                    const winner = list.find((f) => f.chosen);
                    const thumb = tmdb((winner ?? list[0]).poster_path, "w154");
                    return (
                      <details key={label} className="fs-week" open={!!query}>
                        <summary>
                          <span className="fs-week-no" aria-hidden="true">{String(no).padStart(2, "0")}</span>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="fs-week-thumb" src={thumb} alt="" loading="lazy" />
                          ) : <span className="fs-week-thumb" />}
                          <span className="fs-week-main">
                            <strong>{winner ? winner.title : "Pas de film élu"}</strong>
                            <small>
                              {label}, {list.length} {list.length > 1 ? "candidats" : "candidat"}
                              {winner?.watched ? ", vu en soirée" : ""}
                            </small>
                          </span>
                          <ChevronDown className="fs-week-chev" size={20} aria-hidden="true" />
                        </summary>
                        <div className="fs-week-body">
                          <div className="fs-grid">
                            {[...(winner ? [winner] : []), ...list.filter((f) => !f.chosen)].map((f) => (
                              <FilmCard key={f.id} film={f} onClick={() => setSelectedFilm(f)} />
                            ))}
                          </div>
                        </div>
                      </details>
                    );
                  })
                )}
              </section>
            )}
          </>
        )}
      </main>

      {selectedFilm && (
        <Overlay label={`Fiche de ${selectedFilm.title}`} onClose={() => setSelectedFilm(null)}>
          <div className="fs-sheet">
            <button type="button" className="gk-icon-btn fs-sheet-close" onClick={() => setSelectedFilm(null)} aria-label="Fermer la fiche">
              <X size={20} aria-hidden="true" />
            </button>
            {tmdb(selectedFilm.backdrop_path, "w780") && (
              <div className="fs-sheet-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tmdb(selectedFilm.backdrop_path, "w780")!} alt="" />
              </div>
            )}
            <div className="fs-sheet-body">
              {tmdb(selectedFilm.poster_path, "w342") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tmdb(selectedFilm.poster_path, "w342")!}
                  alt={`Affiche de ${selectedFilm.title}`}
                  style={{ width: "100%", maxWidth: 150, border: "var(--gk-stroke) solid var(--gk-border)", display: "block" }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="gk-tag">{selectedFilm.week_label}</span>
                  {selectedFilm.chosen && <span className="gk-tag gk-tag--solid">Film élu</span>}
                  {selectedFilm.watched && <span className="gk-tag" style={{ color: "#4ade80" }}>Vu en soirée</span>}
                </div>
                <h2 className="gk-ui-title" style={{ fontSize: "clamp(1.7rem, 6vw, 2.6rem)", marginTop: 10, overflowWrap: "anywhere" }}>{selectedFilm.title}</h2>
                <Meta film={selectedFilm} />
                {selectedFilm.genres && (
                  <div className="fs-genres">
                    {selectedFilm.genres.split(", ").map((g) => <span key={g} className="gk-tag">{g}</span>)}
                  </div>
                )}
              </div>
              {selectedFilm.synopsis && <p className="gk-body" style={{ gridColumn: "1 / -1", color: "var(--gk-text)", opacity: 0.86 }}>{selectedFilm.synopsis}</p>}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10 }}>
                {selectedFilm.trailer_key && (
                  <button type="button" className="gk-btn gk-btn--red" onClick={() => { setTrailer(selectedFilm); setSelectedFilm(null); }}>
                    <Play size={16} fill="currentColor" aria-hidden="true" /> Voir la bande-annonce
                  </button>
                )}
                <button type="button" className="gk-btn gk-btn--ghost" onClick={() => setSelectedFilm(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {trailer?.trailer_key && (
        <Overlay label={`Bande-annonce de ${trailer.title}`} onClose={() => setTrailer(null)}>
          <button type="button" className="gk-icon-btn fs-sheet-close" onClick={() => setTrailer(null)} aria-label="Fermer la bande-annonce" style={{ position: "fixed" }}>
            <X size={20} aria-hidden="true" />
          </button>
          <div className="fs-trailer">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.trailer_key)}?autoplay=1&rel=0`}
              title={`Bande-annonce de ${trailer.title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Overlay>
      )}
      <Toast />
    </div>
  );
}
