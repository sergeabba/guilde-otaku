"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Star, Trash2 } from "lucide-react";
import { hasJapanese, workKey, workTitle, type FavoriteWork, type MemberTrack } from "../../lib/member-extras";
import { youtubeId } from "../../lib/youtube";

type Kind = "ANIME" | "MANGA";
type Candidate = FavoriteWork & { year?: number; format?: string };

const MAX_FEATURED = 3;

function FavoriteList({ kind, label, works, onChange }: { kind: Kind; label: string; works: FavoriteWork[]; onChange: (w: FavoriteWork[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [mRomaji, setMRomaji] = useState("");
  const [mLocal, setMLocal] = useState("");
  const keys = new Set(works.map(workKey));
  const featuredCount = works.filter((w) => w.featured).length;

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) { setError("Tape au moins deux lettres."); return; }
    setSearching(true); setError(null);
    try {
      const res = await fetch("/api/admin/anilist-search", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ search: q, type: kind }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(res.status === 401 ? "Session expirée : reconnecte-toi" : json?.error || `Erreur ${res.status}`);
      setResults(json.results);
      if (!json.results.length) setError("Aucun résultat. Essaie le titre anglais ou rōmaji, ou la saisie manuelle.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible");
    } finally { setSearching(false); }
  }

  const renumber = (list: FavoriteWork[]) => list.map((w, i) => ({ ...w, rank: i + 1 }));
  const add = (w: FavoriteWork) => { if (!keys.has(workKey(w))) onChange(renumber([...works, { ...w, kind }])); };
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
                  <small>{w.source === "anilist" ? "AniList" : "Saisie manuelle"}{w.featured ? " · coup de cœur" : ""}</small>
                  <input className="am-input" value={w.personalNote ?? ""} maxLength={280} placeholder="Pourquoi j'aime (facultatif)"
                    aria-label={`Note personnelle pour ${workTitle(w)}`} aria-invalid={noteBad}
                    onChange={(e) => patch(i, { personalNote: e.target.value || undefined })} />
                  {noteBad && <small style={{ color: "var(--am-red)" }}>Pas de caractères japonais : cette note ne serait pas enregistrée.</small>}
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

      <form className="am-search" onSubmit={search} role="search">
        <input className="am-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={kind === "ANIME" ? "Chercher un anime…" : "Chercher un manga…"} aria-label={`Chercher ${kind === "ANIME" ? "un anime" : "un manga"} sur AniList`} />
        <button className="am-btn" disabled={searching} aria-label="Rechercher"><Search size={16} aria-hidden="true" />{searching ? "…" : ""}</button>
      </form>
      {error && <p className="am-alert am-alert--error" role="alert">{error}</p>}
      {results.length > 0 && (
        <div className="am-results" aria-label="Résultats AniList">
          {results.map((r) => {
            const already = keys.has(workKey(r));
            return (
              <div key={r.sourceId} className="am-result">
                {r.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.coverUrl} alt="" loading="lazy" />
                  : <span className="am-thumb" aria-hidden="true" />}
                <div style={{ minWidth: 0 }}>
                  <strong>{workTitle(r)}</strong>
                  <small>{[r.titleLocalized !== r.titleRomaji ? r.titleLocalized : null, r.format, r.year].filter(Boolean).join(" · ")}</small>
                </div>
                <button type="button" className="am-btn am-btn--sm" disabled={already} onClick={() => add(r)}>{already ? "Ajouté" : <><Plus size={14} aria-hidden="true" /> Ajouter</>}</button>
              </div>
            );
          })}
        </div>
      )}
      {!manual ? (
        <button type="button" className="am-btn am-btn--sm" style={{ justifySelf: "start" }} onClick={() => setManual(true)}>Titre absent d&apos;AniList : saisie manuelle</button>
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

function MusicList({ tracks, onChange }: { tracks: MemberTrack[]; onChange: (t: MemberTrack[]) => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const id = youtubeId(url);
    if (!id) { setError("Lien YouTube non reconnu. Colle l'adresse de la vidéo (youtube.com/watch?v=… ou youtu.be/…)."); return; }
    if (tracks.some((t) => t.id === id)) { setError("Ce morceau est déjà dans la liste."); return; }
    if (hasJapanese(title)) { setError("Écris le titre en alphabet latin."); return; }
    if (tracks.length >= 10) { setError("10 morceaux maximum."); return; }
    onChange([...tracks, { provider: "youtube", id, title: title.trim() || undefined }]);
    setUrl(""); setTitle(""); setError(null);
  }

  return (
    <div className="am-section">
      <h3>Musique (Ongaku)</h3>
      <p>À choisir avec l&apos;accord du membre. Sur la fiche, rien ne se lance tout seul : le visiteur appuie sur « Écouter ».</p>
      {tracks.length === 0 ? <p className="am-empty">Aucun morceau.</p> : (
        <ol className="am-list">
          {tracks.map((t, i) => (
            <li key={t.id} className="am-item" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <div style={{ minWidth: 0 }}>
                <strong>{t.title || "Sans titre"}</strong>
                <small>youtube.com/watch?v={t.id}</small>
              </div>
              <div className="am-item-actions">
                <button type="button" className="am-icon" aria-label="Monter" disabled={i === 0} onClick={() => { const l = [...tracks]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; onChange(l); }}><ArrowUp size={16} aria-hidden="true" /></button>
                <button type="button" className="am-icon" aria-label={`Retirer ${t.title || t.id}`} onClick={() => onChange(tracks.filter((_, k) => k !== i))}><Trash2 size={16} aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <form className="am-grid2" onSubmit={add}>
        <label className="am-field"><span>Lien YouTube</span><input className="am-input" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" /></label>
        <label className="am-field"><span>Titre affiché (facultatif)</span><input className="am-input" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} /></label>
        <button className="am-btn am-btn--sm" style={{ justifySelf: "start" }}><Plus size={14} aria-hidden="true" /> Ajouter le morceau</button>
      </form>
      {error && <p className="am-alert am-alert--error" role="alert">{error}</p>}
    </div>
  );
}

export default function UniverseEditor({ anime, manga, music, alias, onChange }: {
  anime: FavoriteWork[]; manga: FavoriteWork[]; music: MemberTrack[]; alias: string;
  onChange: (p: { favoriteAnime?: FavoriteWork[]; favoriteManga?: FavoriteWork[]; music?: MemberTrack[]; displayNameRomaji?: string }) => void;
}) {
  return (
    <>
      <label className="am-field">
        <span>Surnom en rōmaji (facultatif)</span>
        <input className="am-input" value={alias} maxLength={80} aria-invalid={hasJapanese(alias)} onChange={(e) => onChange({ displayNameRomaji: e.target.value })} />
        <small>{hasJapanese(alias) ? "Alphabet latin uniquement." : "Affiché sous le nom sur la fiche. Ne pas inventer : seulement si le membre l'utilise."}</small>
      </label>
      <FavoriteList kind="ANIME" label="Suki na anime : anime préférés" works={anime} onChange={(w) => onChange({ favoriteAnime: w })} />
      <FavoriteList kind="MANGA" label="Suki na manga : mangas préférés" works={manga} onChange={(w) => onChange({ favoriteManga: w })} />
      <MusicList tracks={music} onChange={(t) => onChange({ music: t })} />
    </>
  );
}
