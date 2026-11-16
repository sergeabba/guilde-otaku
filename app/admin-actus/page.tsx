"use client";

// Actualités : file de relecture. Les articles récupérés dans les flux des médias
// arrivent « en attente » ; l'admin corrige au besoin le titre et l'extrait, puis
// publie ou écarte. Rien n'apparaît sur le site sans cette étape.
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, RefreshCw, RotateCcw, X } from "lucide-react";
import { getAdminHeaders } from "../../lib/admin-fetch";
import type { NewsFeed, NewsRow, NewsStatus } from "../../lib/news";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, useToast } from "../admin-ui/ui";

interface Run { id: number; source: string; started_at: string; read_count: number; added_count: number; error: string | null }
interface Payload { status: NewsStatus; items: NewsRow[]; runs: Run[]; feeds: NewsFeed[]; counts: Record<NewsStatus, number> }

const LABEL: Record<NewsStatus, string> = { pending: "En attente", published: "Publiés", rejected: "Écartés" };
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmt = (d: string | null) => (d ? DATE.format(new Date(d)) : "date inconnue");

function NewsCard({ item, onSaved }: { item: NewsRow; onSaved: (msg: string) => void }) {
  const [title, setTitle] = useState(item.edited_title ?? item.title);
  const [excerpt, setExcerpt] = useState(item.edited_excerpt ?? item.excerpt ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(status?: NewsStatus) {
    setBusy(true); setErr(null);
    // On ne garde un texte « revu » que s'il diffère de celui du média.
    const edited_title = title.trim() && title.trim() !== item.title ? title.trim() : null;
    const edited_excerpt = excerpt.trim() !== (item.excerpt ?? "") ? excerpt.trim() : null;
    try {
      const r = await fetch("/api/admin/news", { method: "PATCH", headers: { ...getAdminHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status, edited_title, edited_excerpt }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      onSaved(status === "published" ? "Article publié dans la Bibliothèque." : status === "rejected" ? "Article écarté." : status === "pending" ? "Article remis en attente." : "Modifications enregistrées.");
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur réseau"); } finally { setBusy(false); }
  }

  return (
    <li className="am-news">
      <p className="am-news-meta">
        <b>{item.source}</b> · {fmt(item.published_at)}{item.author ? ` · ${item.author}` : ""}
        {item.categories.length > 0 && <> · {item.categories.join(", ")}</>}
      </p>
      <label className="am-field"><span>Titre affiché</span>
        <input className="am-input" value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="am-field"><span>Extrait affiché (court, celui du média par défaut)</span>
        <textarea className="am-input" rows={3} value={excerpt} maxLength={400} onChange={(e) => setExcerpt(e.target.value)} />
      </label>
      {err && <p className="am-alert am-alert--error" role="alert">{err}</p>}
      <div className="am-row">
        <a className="am-btn" href={item.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Lire l&apos;article</a>
        {item.status === "pending" && <>
          <button type="button" className="am-btn am-btn--gold" disabled={busy} onClick={() => save("published")}><Check size={16} aria-hidden="true" /> Publier</button>
          <button type="button" className="am-btn" disabled={busy} onClick={() => save("rejected")}><X size={16} aria-hidden="true" /> Écarter</button>
        </>}
        {item.status === "published" && <>
          <button type="button" className="am-btn am-btn--gold" disabled={busy} onClick={() => save()}><Check size={16} aria-hidden="true" /> Enregistrer le texte</button>
          <button type="button" className="am-btn" disabled={busy} onClick={() => save("pending")}><RotateCcw size={16} aria-hidden="true" /> Retirer du site</button>
        </>}
        {item.status === "rejected" && <button type="button" className="am-btn" disabled={busy} onClick={() => save("pending")}><RotateCcw size={16} aria-hidden="true" /> Remettre en attente</button>}
      </div>
    </li>
  );
}

export default function AdminActusPage() {
  const [status, setStatus] = useState<NewsStatus>("pending");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<{ msg: string; missing?: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [notify, toasts] = useToast();

  const load = useCallback(async (s: NewsStatus) => {
    try {
      const r = await fetch(`/api/admin/news?status=${s}`, { headers: getAdminHeaders() });
      const d = await r.json();
      if (!r.ok) { setError({ msg: d.error || `HTTP ${r.status}`, missing: d.missingTable }); setData(null); return; }
      setError(null); setData(d);
    } catch { setError({ msg: "Lecture impossible : erreur réseau." }); }
  }, []);
  useEffect(() => { void Promise.resolve().then(() => load("pending")); }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const r = await fetch("/api/admin/news", { method: "POST", headers: getAdminHeaders() });
      const d = await r.json();
      if (!r.ok) { setError({ msg: d.error || `HTTP ${r.status}`, missing: d.missingTable }); return; }
      const added = (d.reports as { added: number }[]).reduce((n, x) => n + x.added, 0);
      const failed = (d.reports as { source: string; error: string | null }[]).filter((x) => x.error);
      notify(failed.length ? `${added} nouvel(s) article(s). Échec : ${failed.map((f) => `${f.source} (${f.error})`).join(", ")}` : `${added} nouvel(s) article(s) en attente.`, failed.length ? "error" : "ok");
      setStatus("pending"); await load("pending");
    } finally { setSyncing(false); }
  }

  const pick = (s: NewsStatus) => { setStatus(s); void load(s); };

  return (
    <AdminShell
      section="actus"
      title="Actualités"
      intro="Articles récupérés chaque jour dans les flux des médias. Relis, corrige si besoin, puis publie : seuls les articles publiés apparaissent dans la Bibliothèque, avec le nom du média et le lien vers l'article."
      actions={<button type="button" className="am-btn am-btn--gold" onClick={sync} disabled={syncing}><RefreshCw size={16} className={syncing ? "am-spin" : ""} aria-hidden="true" /> {syncing ? "Récupération…" : "Récupérer maintenant"}</button>}
    >
      {error && (
        <div className={`am-alert ${error.missing ? "am-alert--info" : "am-alert--error"}`} role="alert">
          {error.msg}
          {error.missing && <> Ouvre Supabase → SQL Editor, colle le contenu du fichier, exécute, puis recharge cette page.</>}
        </div>
      )}
      {data && (
        <>
          <div className="am-row" role="group" aria-label="Statut">
            {(Object.keys(LABEL) as NewsStatus[]).map((s) => <Chip key={s} active={status === s} onClick={() => pick(s)}>{LABEL[s]} ({data.counts[s]})</Chip>)}
          </div>
          {data.items.length === 0
            ? <p className="am-empty-state">{status === "pending" ? "Rien à relire. « Récupérer maintenant » va chercher les derniers articles." : `Aucun article ${LABEL[status].toLowerCase()}.`}</p>
            : <ul className="am-news-list">{data.items.map((it) => <NewsCard key={`${it.id}-${it.status}`} item={it} onSaved={(m) => { notify(m); void load(status); }} />)}</ul>}

          <section className="am-panel" aria-labelledby="am-runs" style={{ marginTop: 22 }}>
            <h2 id="am-runs">Dernières récupérations</h2>
            <p className="am-intro" style={{ margin: 0 }}>Médias suivis : {data.feeds.map((f) => f.name).join(", ")}. Récupération automatique chaque matin.</p>
            {data.runs.length === 0 ? <p>Aucune pour l&apos;instant.</p> : (
              <ul className="am-quality">
                {data.runs.map((r) => (
                  <li key={r.id} data-level={r.error ? "error" : "info"}><b>{fmt(r.started_at)}</b><span>{r.source} : {r.read_count} lu(s), {r.added_count} nouveau(x){r.error ? ` · erreur : ${r.error}` : ""}</span></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {toasts}
    </AdminShell>
  );
}
