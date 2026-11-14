"use client";

// Import en masse dans la Bibliothèque : une liste de titres, recherche française
// (TMDB pour les anime, MangaDex pour les manga), choix de la bonne œuvre pour chaque
// ligne (type, année et source visibles), puis ajout. Le synopsis enregistré est
// toujours français (ou vide) : jamais le résumé anglais de la source.
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { findDossierBashEntry } from "../../../lib/dossier-bash";
import { getAdminHeaders } from "../../../lib/admin-fetch";
import { adminDb } from "../../../lib/admin-db-client";
import { FORMAT_LABEL, SOURCE_LABEL, type WorkCandidate, type WorkKind } from "../../../lib/works/types";
import AdminShell from "../../admin-ui/AdminShell";
import { Chip, useToast } from "../../admin-ui/ui";

const TIERS = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"] as const;
interface Line { query: string; options: WorkCandidate[]; choice: number; detail?: WorkCandidate; selected: boolean; tier: string; error?: string }

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: getAdminHeaders(), body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `erreur ${res.status}`);
  return data as T;
}
const detailOf = (c: WorkCandidate) => post<{ work: WorkCandidate }>("/api/works/detail", { source: c.source, id: c.sourceId }).then((d) => d.work);
const label = (c: WorkCandidate) => `${c.titleFr && !c.titleFrUnverified ? c.titleFr : c.title} · ${FORMAT_LABEL[c.format]}${c.year ? ` · ${c.year}` : ""} · ${SOURCE_LABEL[c.source]}`;

export default function BulkImportPage() {
  const [raw, setRaw] = useState("");
  const [kind, setKind] = useState<WorkKind>("ANIME");
  const [lines, setLines] = useState<Line[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [notify, toasts] = useToast();

  const update = (i: number, patch: Partial<Line>) => setLines((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function search() {
    const titles = [...new Set(raw.split("\n").map((t) => t.trim()).filter(Boolean))].slice(0, 30);
    if (!titles.length) return;
    const out: Line[] = [];
    for (const [i, q] of titles.entries()) {
      setProgress(`Recherche ${i + 1} sur ${titles.length} : ${q}`);
      try {
        const { results } = await post<{ results: WorkCandidate[] }>("/api/works/search", { q, kind });
        const options = results.slice(0, 6);
        out.push({ query: q, options, choice: 0, detail: options[0] ? await detailOf(options[0]).catch(() => options[0]) : undefined, selected: options.length > 0, tier: "A définir" });
      } catch (e) {
        out.push({ query: q, options: [], choice: 0, selected: false, tier: "A définir", error: e instanceof Error ? e.message : "erreur réseau" });
      }
      setLines([...out]);
    }
    setProgress(null);
  }

  async function choose(i: number, choice: number) {
    const c = lines[i].options[choice];
    update(i, { choice, detail: c });
    try { update(i, { detail: await detailOf(c) }); } catch { /* le résultat de recherche suffit */ }
  }

  async function save() {
    const todo = lines.map((l, i) => [l, i] as const).filter(([l]) => l.selected && l.detail);
    const failed: string[] = [];
    let ok = 0;
    for (const [n, [l]] of todo.entries()) {
      const c = l.detail!;
      const title = c.titleFr && !c.titleFrUnverified ? c.titleFr : c.title;
      setProgress(`Ajout ${n + 1} sur ${todo.length} : ${title}`);
      try {
        const cover = c.coverUrl ? await post<{ coverUrl?: string | null }>("/api/resolve-cover", { title, coverUrl: c.coverUrl }) : null;
        const meta = findDossierBashEntry(title);
        const { error } = await adminDb.insert("bibliotheque", [{
          title, type: kind === "MANGA" ? "Manga" : c.format === "FILM" ? "Film/Série" : "Anime", tier: l.tier,
          cover_image: cover?.coverUrl ?? c.coverUrl ?? null, status: c.status ?? null, year: c.year ?? null, episodes: c.episodes ?? null,
          genres: (c.genres ?? []).slice(0, 8), synopsis: c.synopsisFr ? (c.synopsisCredit ? `${c.synopsisFr}\n\n(Synopsis : ${c.synopsisCredit.label}, ${c.synopsisCredit.url})` : c.synopsisFr) : "",
          trailer_url: c.trailer ? `https://www.youtube.com/watch?v=${c.trailer.youtubeId}` : null,
          dossier_bash: !!meta, dossier_bash_tag: meta?.tag ?? null, dossier_bash_date: meta?.date ?? null, dossier_bash_color: meta?.color ?? null,
        }]);
        if (error) throw new Error(error.message);
        ok++;
        setLines((p) => p.filter((x) => x !== l));
      } catch (e) {
        failed.push(`${title} (${e instanceof Error ? e.message : "erreur"})`);
      }
    }
    setProgress(null);
    if (ok) notify(`${ok} œuvre${ok > 1 ? "s" : ""} ajoutée${ok > 1 ? "s" : ""} à la Bibliothèque`);
    if (failed.length) notify(`Non ajoutées : ${failed.join(", ")}`, "error");
  }

  const count = lines.filter((l) => l.selected && l.detail).length;

  return (
    <AdminShell section="bibliotheque" title="Import en masse" intro="Colle une liste de titres, un par ligne (30 maximum). Vérifie l'œuvre trouvée pour chaque ligne avant d'ajouter.">
      <section className="am-panel" style={{ display: "grid", gap: 12 }}>
        <div className="am-chips" role="group" aria-label="Type d'œuvre">
          <Chip active={kind === "ANIME"} onClick={() => setKind("ANIME")}>Anime et films (TMDB)</Chip>
          <Chip active={kind === "MANGA"} onClick={() => setKind("MANGA")}>Manga (MangaDex)</Chip>
        </div>
        <label className="am-field"><span>Titres (un par ligne)</span>
          <textarea className="am-input" rows={6} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={"Frieren\nVinland Saga\nMob Psycho 100"} />
        </label>
        <div className="am-row">
          <button type="button" className="am-btn am-btn--gold" onClick={search} disabled={!!progress || !raw.trim()}><Search size={16} aria-hidden="true" /> Rechercher</button>
          {progress && <p className="am-status is-saving" role="status">{progress}</p>}
        </div>
      </section>

      {lines.length > 0 && (
        <ul className="am-rows">
          {lines.map((l, i) => {
            const c = l.detail;
            return (
              <li key={`${l.query}-${i}`} className="am-row-item">
                <span className="am-row-thumb">
                  {c?.coverUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.coverUrl} alt="" loading="lazy" />
                    : l.query.slice(0, 1)}
                </span>
                <div className="am-row-main">
                  <small>Ligne : « {l.query} »</small>
                  {l.error ? <span className="am-tag is-warn">Recherche impossible : {l.error}</span>
                    : !l.options.length ? <span className="am-tag is-warn">Aucune œuvre trouvée : ajoute-la à la main depuis la Bibliothèque</span>
                      : (
                        <>
                          <select className="am-input" value={l.choice} onChange={(e) => void choose(i, Number(e.target.value))} aria-label={`Œuvre pour ${l.query}`}>
                            {l.options.map((o, j) => <option key={o.sourceId} value={j}>{label(o)}</option>)}
                          </select>
                          <span className="am-row-tags">
                            {c?.synopsisFr ? <span className="am-tag is-ok">Synopsis français</span> : <span className="am-tag is-warn">Pas de synopsis français (champ laissé vide)</span>}
                            {c?.titleFrUnverified && <span className="am-tag is-warn">Titre FR à vérifier</span>}
                          </span>
                          <select className="am-input" value={l.tier} onChange={(e) => update(i, { tier: e.target.value })} aria-label={`Verdict pour ${l.query}`}>
                            {TIERS.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </>
                      )}
                </div>
                <div className="am-row-actions">
                  {l.options.length > 0 && (
                    <button type="button" className="am-btn am-btn--sm" aria-pressed={l.selected} onClick={() => update(i, { selected: !l.selected })}>
                      {l.selected ? <><Check size={14} aria-hidden="true" /> Retenue</> : "Ignorée"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {lines.length > 0 && (
        <div className="am-row" style={{ marginTop: 16 }}>
          <button type="button" className="am-btn am-btn--gold" onClick={save} disabled={!!progress || !count}>Ajouter {count} œuvre{count > 1 ? "s" : ""}</button>
          <button type="button" className="am-btn" onClick={() => setLines([])} disabled={!!progress}>Vider la liste</button>
        </div>
      )}
      {toasts}
    </AdminShell>
  );
}
