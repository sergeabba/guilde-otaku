"use client";

// Votes de films : l'admin tape les titres, le site récupère les fiches sur TMDB
// (affiche, synopsis, durée, réalisateur, bande-annonce), choisit la durée du vote,
// puis partage le lien /vote/<slug>. Le vote en cours s'affiche aussi sur l'accueil.
import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Plus, Search, Square, Timer, Trash2, X } from "lucide-react";
import { getAdminHeaders } from "../../lib/admin-fetch";
import { DURATIONS, isOpen, timeLeft, type FilmPoll, type PollTally } from "../../lib/film-poll-logic";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, useConfirm, useToast } from "../admin-ui/ui";

interface Hit { tmdb: number; title: string; original: string | null; year: number | null; poster: string | null; overview: string | null }
type Row = FilmPoll & { tally: PollTally };
const img = (p: string | null) => (p ? `https://image.tmdb.org/t/p/w154${p}` : null);
const WHEN = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function call<T>(method: string, body?: unknown, q = ""): Promise<T> {
  const r = await fetch(`/api/admin/film-polls${q}`, { method, cache: "no-store", ...(body ? { headers: getAdminHeaders(), body: JSON.stringify(body) } : {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
  return d as T;
}

export default function AdminVotesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [title, setTitle] = useState("Le film de la semaine");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<Hit[]>([]);
  const [hours, setHours] = useState<number>(48);
  const [start, setStart] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const d = await call<{ available: boolean; polls: Row[]; error?: string }>("GET");
      setRows(d.polls); setMissing(d.available ? null : d.error ?? "Table absente.");
      return true;
    } catch (e) {
      // Pas encore connecté : on réessaie après la connexion (la coque admin gère le mot de passe).
      if (e instanceof Error && e.message === "Unauthorized") return false;
      setRows([]); setMissing(e instanceof Error ? e.message : "Erreur");
      return true;
    }
  }, []);
  useEffect(() => {
    let stop = false, t = 0;
    const run = async () => { if (!stop && !(await load())) t = window.setTimeout(run, 1500); };
    void run();
    return () => { stop = true; window.clearTimeout(t); };
  }, [load]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true); setErr(null);
    try { setHits((await call<{ results: Hit[] }>("GET", undefined, `?q=${encodeURIComponent(q.trim())}`)).results); }
    catch (e2) { setErr(e2 instanceof Error ? e2.message : "Recherche impossible."); }
    finally { setSearching(false); }
  }
  const add = (h: Hit) => setPicked((p) => (p.some((x) => x.tmdb === h.tmdb) || p.length >= 8 ? p : [...p, h]));

  async function create() {
    setBusy(true); setErr(null);
    try {
      const { poll } = await call<{ poll: FilmPoll }>("POST", { title, films: picked.map((p) => p.tmdb), hours, ...(start ? { startsAt: new Date(start).toISOString() } : {}) });
      await copy(poll.slug, "Vote créé, lien copié : il est en ligne sur l'accueil.");
      setPicked([]); setHits(null); setQ(""); setStart(""); void load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Création impossible."); }
    finally { setBusy(false); }
  }
  async function copy(slug: string, msg = "Lien du vote copié.") {
    const url = `${location.origin}/vote/${slug}`;
    try { await navigator.clipboard.writeText(url); notify(msg); } catch { notify(url); }
  }
  async function act(row: Row, body: Record<string, unknown>, msg: string, ask?: { title: string; body: string; danger?: boolean }) {
    if (ask && !(await confirm({ ...ask, confirmLabel: "Confirmer" }))) return;
    try { await call(body.action ? "PATCH" : "DELETE", { id: row.id, ...body }); notify(msg); void load(); }
    catch (e) { notify(e instanceof Error ? e.message : "Erreur", "error"); }
  }

  return (
    <AdminShell section="votes" title="Votes de films" intro="Tape les titres des films : la fiche (affiche, synopsis, durée, réalisateur, bande-annonce) vient de TMDB. Le vote en cours apparaît sur l'accueil, avec les pourcentages en direct, et son lien se partage partout.">
      {missing && <div className="am-alert am-alert--info" role="alert">{missing}</div>}

      <section className="am-panel" style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        <h2>Nouveau vote</h2>
        <label className="am-field"><span>Titre du vote <b>*</b></span><input className="am-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>

        <form onSubmit={search} className="am-field" role="search">
          <span>Ajouter un film (2 à 8)</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="am-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. : Suzume, Your Name, Dune…" aria-label="Titre du film" />
            <button type="submit" className="am-btn" disabled={searching}><Search size={16} aria-hidden="true" /> {searching ? "…" : "Chercher"}</button>
          </div>
        </form>
        {hits && (
          <ul className="am-rows" aria-label="Résultats TMDB">
            {hits.length === 0 && <li className="am-empty-state">Aucun film trouvé.</li>}
            {hits.map((h) => (
              <li key={h.tmdb} className="am-row-item" style={{ alignItems: "center" }}>
                <div className="am-row-main" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img(h.poster) ? <img src={img(h.poster)!} alt="" width={46} height={69} style={{ objectFit: "cover", flexShrink: 0 }} /> : <span style={{ width: 46 }} />}
                  <span><b>{h.title}</b>{h.year ? ` (${h.year})` : ""}{h.original && h.original !== h.title ? <small style={{ display: "block", opacity: .7 }}>{h.original}</small> : null}</span>
                </div>
                <div className="am-row-actions">
                  <button type="button" className="am-btn am-btn--gold" disabled={picked.some((p) => p.tmdb === h.tmdb) || picked.length >= 8} onClick={() => add(h)}><Plus size={16} aria-hidden="true" /> {picked.some((p) => p.tmdb === h.tmdb) ? "Ajouté" : "Ajouter"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="am-field">
          <span>Films en lice ({picked.length}/8)</span>
          {picked.length === 0 ? <p className="am-empty-state">Aucun film pour l&apos;instant.</p> : (
            <ol style={{ display: "flex", flexWrap: "wrap", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              {picked.map((p) => (
                <li key={p.tmdb} style={{ display: "grid", gap: 4, width: 104 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img(p.poster) ? <img src={img(p.poster)!} alt="" width={104} height={156} style={{ objectFit: "cover" }} /> : <span style={{ height: 156, background: "#222" }} />}
                  <small style={{ fontWeight: 700 }}>{p.title}</small>
                  <button type="button" className="am-btn" onClick={() => setPicked((x) => x.filter((y) => y.tmdb !== p.tmdb))} aria-label={`Retirer ${p.title}`}><X size={14} aria-hidden="true" /> Retirer</button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="am-field">
          <span>Durée du vote</span>
          <div className="am-row" role="group" aria-label="Durée">
            {DURATIONS.map((d) => <Chip key={d.hours} active={hours === d.hours} onClick={() => setHours(d.hours)}>{d.label}</Chip>)}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <span>ou en heures :</span>
            <input className="am-input" type="number" min={1} max={336} value={hours} onChange={(e) => setHours(Math.max(1, Math.min(336, Number(e.target.value) || 1)))} style={{ width: 100 }} />
          </label>
        </div>
        <label className="am-field"><span>Début (vide : tout de suite)</span><input className="am-input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></label>

        {err && <p className="am-alert am-alert--error" role="alert">{err}</p>}
        <div><button type="button" className="am-btn am-btn--gold" disabled={busy || !!missing || picked.length < 2 || !title.trim()} onClick={() => void create()}><Plus size={16} aria-hidden="true" /> {busy ? "Création…" : "Lancer le vote"}</button></div>
      </section>

      <h2 style={{ margin: "8px 0 10px" }}>Votes</h2>
      {!rows ? <p className="am-loading">Chargement…</p> : rows.length === 0 ? <p className="am-empty-state">Aucun vote pour l&apos;instant.</p> : (
        <ul className="am-rows">
          {rows.map((r) => {
            const open = isOpen(r), now = Date.now(), soon = now < Date.parse(r.starts_at);
            return (
              <li key={r.id} className="am-row-item">
                <div className="am-row-main" style={{ display: "grid", gap: 6, width: "100%" }}>
                  <span className="am-row-tags">
                    <span className="am-tag">{open ? `En cours · fin dans ${timeLeft(Date.parse(r.ends_at) - now)}` : soon ? `Début ${WHEN.format(new Date(r.starts_at))}` : `Terminé ${WHEN.format(new Date(r.ends_at))}`}</span>
                    <span className="am-tag">{r.tally.total} vote{r.tally.total > 1 ? "s" : ""}</span>
                  </span>
                  <b>{r.title}</b>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 2 }}>
                    {r.films.map((f) => <li key={f.tmdb}>{r.tally.leaders.includes(f.tmdb) && r.tally.total ? "▶ " : ""}{f.title} : <b>{r.tally.pct[f.tmdb] ?? 0} %</b> ({r.tally.counts[f.tmdb] ?? 0})</li>)}
                  </ul>
                </div>
                <div className="am-row-actions">
                  <button type="button" className="am-btn" onClick={() => void copy(r.slug)}><Copy size={16} aria-hidden="true" /> Lien</button>
                  <a className="am-btn" href={`/vote/${r.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Voir</a>
                  {(open || soon) && <button type="button" className="am-btn" onClick={() => void act(r, { action: "extend", hours: 24 }, "Vote prolongé de 24 heures.")}><Timer size={16} aria-hidden="true" /> +24 h</button>}
                  {open && <button type="button" className="am-btn" onClick={() => void act(r, { action: "close" }, "Vote terminé.", { title: "Terminer ce vote maintenant ?", body: "Les résultats actuels deviennent définitifs." })}><Square size={16} aria-hidden="true" /> Terminer</button>}
                  <button type="button" className="am-btn" onClick={() => void act(r, {}, "Vote supprimé.", { title: "Supprimer ce vote ?", body: `${r.title} et ses ${r.tally.total} votes seront effacés définitivement.`, danger: true })}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {confirmNode}{toasts}
    </AdminShell>
  );
}
