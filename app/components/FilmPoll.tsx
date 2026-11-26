"use client";

// Vote du film : affiches, pourcentages en direct, compte à rebours, partage.
// Un vote par appareil, modifiable jusqu'à la fin. Utilisé sur l'accueil (« compact »)
// et sur la page partageable /vote/<slug>.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Clock, Crown, Play, Share2, Users } from "lucide-react";
import { optimizedSrc } from "../../lib/img";
import { isOpen, timeLeft, type FilmPoll as Poll, type PollTally } from "../../lib/film-poll-logic";
import { useShare } from "../hooks/useShare";
import { playOk } from "../../lib/fx";
import "./film-poll.css";

interface State { poll: Poll | null; open?: boolean; now?: number; tally?: PollTally; mine?: number | null }
const KEY_VOTER = "guilde-bash-voter", KEY_ME = "guilde-bash-me";
const poster = (p: string | null, w = 342) => (p ? optimizedSrc(`https://image.tmdb.org/t/p/w500${p}`, w) : undefined);

function voterId(): string {
  try {
    let id = localStorage.getItem(KEY_VOTER);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = crypto.randomUUID(); localStorage.setItem(KEY_VOTER, id); }
    return id;
  } catch { return crypto.randomUUID(); }
}
const memberId = () => { try { const n = Number(localStorage.getItem(KEY_ME)); return Number.isInteger(n) && n > 0 ? n : undefined; } catch { return undefined; } };
const runtime = (m: number | null) => (m ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : null);

/** `frame` : classe d'un cadre autour du vote, rendu seulement s'il y a un vote à montrer. */
export default function FilmPoll({ slug, compact = false, initial, frame }: { slug?: string; compact?: boolean; initial?: State; frame?: string }) {
  const [s, setS] = useState<State | null>(initial ?? null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { share, Toast } = useShare();
  const skew = useRef(0); // écart entre l'horloge du serveur et celle de l'appareil

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/film-polls?${new URLSearchParams({ ...(slug ? { slug } : {}), voter: voterId() })}`, { cache: "no-store" });
      const d = (await r.json()) as State;
      if (r.ok) { if (d.now) skew.current = d.now - Date.now(); setS(d); }
    } catch { /* réseau coupé : on garde l'affichage */ }
  }, [slug]);

  // Résultats en direct : toutes les 5 s pendant le vote, quand la page est visible.
  useEffect(() => {
    void Promise.resolve().then(load);
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5_000);
    const c = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => { window.clearInterval(t); window.clearInterval(c); };
  }, [load]);

  const vote = useCallback(async (tmdb: number) => {
    if (!s?.poll) return;
    setBusy(tmdb); setError(null);
    // Même film touché à nouveau : le vote est retiré.
    const choice = s.mine === tmdb ? null : tmdb;
    try {
      const r = await fetch("/api/film-polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: s.poll.slug, voter: voterId(), choice, memberId: memberId() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Vote non enregistré.");
      if (choice !== null) playOk();
      setS(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Vote non enregistré."); } finally { setBusy(null); }
  }, [s]);

  // Sans slug (accueil, page du film), le dernier vote s'affiche s'il existe ; sinon rien.
  if (!s) return compact || !slug ? null : <p className="fp-note" role="status">Chargement du vote…</p>;
  if (!s.poll) return compact || !slug ? null : <p className="fp-note">Ce vote n&apos;existe pas ou n&apos;est plus disponible.</p>;
  const { poll } = s;
  const t = s.tally ?? { counts: {}, pct: {}, total: 0, leaders: [] };
  const clock = now + skew.current;
  const open = isOpen(poll, clock);
  const started = clock >= Date.parse(poll.starts_at);
  const ended = !open && started;
  const url = `/vote/${poll.slug}`;
  const shareIt = () => share({ title: `${poll.title} · Guilde Otaku`, text: `Vote pour le film : ${poll.films.map((f) => f.title).join(", ")}. ${open ? `Fin dans ${timeLeft(Date.parse(poll.ends_at) - clock)}.` : ""}`, url });
  const winners = ended && t.total ? t.leaders : [];

  const body = (
    <section className={`fp${compact ? " is-compact" : ""}`} aria-labelledby={`fp-${poll.id}`}>
      <header className="fp-head">
        <div>
          <p className="fp-kicker">{ended ? "Vote terminé" : started ? "Vote en cours" : "Bientôt"}</p>
          <h2 id={`fp-${poll.id}`} className="gk-display fp-title">{poll.title}</h2>
        </div>
        <div className="fp-stats">
          <span className={`fp-clock${open ? " is-live" : ""}`}><Clock size={15} aria-hidden="true" /> {open ? `Fin dans ${timeLeft(Date.parse(poll.ends_at) - clock)}` : ended ? "Terminé" : `Début dans ${timeLeft(Date.parse(poll.starts_at) - clock)}`}</span>
          <span className="fp-total" aria-live="polite"><Users size={15} aria-hidden="true" /> {t.total} vote{t.total > 1 ? "s" : ""}</span>
        </div>
      </header>

      {ended && winners.length > 0 && (
        <p className="fp-winner"><Crown size={18} aria-hidden="true" /> {winners.length > 1 ? "Égalité" : "Le film choisi"} : <b>{winners.map((id) => poll.films.find((f) => f.tmdb === id)?.title).join(" et ")}</b></p>
      )}

      <ol className="fp-films">
        {poll.films.map((f) => {
          const pct = t.pct[f.tmdb] ?? 0, n = t.counts[f.tmdb] ?? 0, mine = s.mine === f.tmdb, win = winners.includes(f.tmdb);
          return (
            <li key={f.tmdb} className={`${mine ? "is-mine" : ""}${win ? " is-win" : ""}`} style={{ "--pct": `${pct}%` } as React.CSSProperties}>
              <div className="fp-poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.poster ? <img src={poster(f.poster, compact ? 256 : 384)} alt="" loading="lazy" /> : <span aria-hidden="true">{f.title.slice(0, 1)}</span>}
                {win && <span className="fp-crown"><Crown size={16} aria-hidden="true" /> Gagnant</span>}
              </div>
              <div className="fp-body">
                <h3 className="fp-film">{f.title}</h3>
                <p className="fp-meta">{[f.year, runtime(f.runtime), f.director ? `de ${f.director}` : null].filter(Boolean).join(" · ")}</p>
                {!compact && f.genres && <p className="fp-genres">{f.genres}</p>}
                {!compact && f.overview && <p className="fp-syn">{f.overview.length > 260 ? `${f.overview.slice(0, f.overview.lastIndexOf(" ", 258))}…` : f.overview}</p>}
                <div className="fp-bar" role="img" aria-label={`${pct} % des voix, ${n} vote${n > 1 ? "s" : ""}`}><span /><b>{pct} %</b></div>
                <div className="fp-actions">
                  {open && (
                    <button type="button" className={`fp-vote${mine ? " is-on" : ""}`} aria-pressed={mine} disabled={busy !== null} onClick={() => void vote(f.tmdb)}>
                      {mine ? <><Check size={17} aria-hidden="true" /> Mon choix</> : busy === f.tmdb ? "Vote…" : "Je vote"}
                    </button>
                  )}
                  {!compact && f.trailer && <a className="fp-link" href={`https://www.youtube.com/watch?v=${f.trailer}`} target="_blank" rel="noopener noreferrer"><Play size={15} aria-hidden="true" /> Bande-annonce</a>}
                  <small className="fp-count">{n} vote{n > 1 ? "s" : ""}</small>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {error && <p className="fp-error" role="alert">{error}</p>}
      <div className="fp-foot">
        <p className="fp-note">{open ? (s.mine ? "Tu peux changer d'avis jusqu'à la fin. Touche ton choix pour retirer ton vote." : "Un vote par appareil. Les pourcentages bougent en direct.") : ended ? "Merci à tous les votants." : "Le vote ouvrira bientôt."}</p>
        <div className="fp-foot-actions">
          <button type="button" className="gk-btn gk-btn--sm" onClick={shareIt}><Share2 size={16} aria-hidden="true" /> Partager le vote</button>
          {compact && <Link className="gk-btn gk-btn--sm gk-btn--ghost" href={url}>Tous les détails <ArrowRight size={16} aria-hidden="true" /></Link>}
        </div>
      </div>
      <Toast />
    </section>
  );
  return frame ? <div className={frame}>{body}</div> : body;
}
