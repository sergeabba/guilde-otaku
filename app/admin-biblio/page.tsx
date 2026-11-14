"use client";

// Administration de la Bibliothèque : retrouver une œuvre (recherche, filtres,
// aperçu), l'ajouter depuis la recherche française (TMDB / MangaDex) ou à la main,
// la modifier, resynchroniser sa couverture, la supprimer (confirmation précise).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageIcon, Layers, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { adminDb } from "../../lib/admin-db-client";
import { getAdminHeaders } from "../../lib/admin-fetch";
import { findDossierBashEntry } from "../../lib/dossier-bash";
import { hasJapanese } from "../../lib/member-extras";
import { FORMAT_LABEL, SOURCE_LABEL, type WorkCandidate } from "../../lib/works/types";
import WorkSearch from "../components/works/WorkSearch";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, EditorSheet, ListToolbar, norm, useConfirm, useToast } from "../admin-ui/ui";

const TYPES = ["Anime", "Manga", "Film/Série", "Jeu Vidéo"] as const;
const TIERS = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"] as const;
const STATUSES = ["Terminé", "En cours", "En pause", "À venir"] as const;

interface Row {
  id: number; title: string; type?: string | null; tier?: string | null; score?: number | null; status?: string | null;
  synopsis?: string | null; avis_guilde?: string | null; trailer_url?: string | null; year?: number | null; episodes?: number | null;
  genres?: string[] | null; studio?: string | null; cover_image?: string | null; banner_image?: string | null; created_at?: string;
}
interface Form {
  title: string; type: string; tier: string; score: string; status: string; year: string; episodes: string;
  genres: string; studio: string; synopsis: string; avis: string; trailer: string; cover: string;
}
const EMPTY: Form = { title: "", type: "Anime", tier: "A définir", score: "", status: "Terminé", year: "", episodes: "", genres: "", studio: "", synopsis: "", avis: "", trailer: "", cover: "" };
const toForm = (r: Row): Form => ({
  title: r.title, type: r.type ?? "Anime", tier: r.tier ?? "A définir", score: r.score != null ? String(r.score) : "", status: r.status ?? "Terminé",
  year: r.year ? String(r.year) : "", episodes: r.episodes ? String(r.episodes) : "", genres: (r.genres ?? []).join(", "), studio: r.studio ?? "",
  synopsis: r.synopsis ?? "", avis: r.avis_guilde ?? "", trailer: r.trailer_url ?? "", cover: r.cover_image ?? "",
});
const isStored = (u?: string | null) => !!u && u.includes("/storage/v1/object/public/");
const ytOk = (u: string) => !u.trim() || /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)[\w-]{11}/.test(u);

function formErrors(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.title.trim()) e.title = "Le titre est obligatoire.";
  else if (hasJapanese(f.title)) e.title = "Titre en alphabet latin (règle rōmaji du site).";
  const s = Number(f.score.replace(",", "."));
  if (f.score.trim() && (!Number.isFinite(s) || s < 0 || s > 10)) e.score = "Note de 0 à 10.";
  if (f.year.trim() && !/^(19|20)\d{2}$/.test(f.year.trim())) e.year = "Année sur 4 chiffres.";
  if (f.episodes.trim() && !/^\d{1,5}$/.test(f.episodes.trim())) e.episodes = "Nombre entier.";
  if (!ytOk(f.trailer)) e.trailer = "Lien YouTube attendu (ou laisse vide).";
  if (f.cover.trim() && !/^(https:\/\/|\/api\/works\/cover\?)\S+$/.test(f.cover.trim())) e.cover = "Adresse d'image https:// attendue.";
  if (hasJapanese(f.synopsis)) e.synopsis = "Alphabet latin uniquement.";
  if (f.synopsis.length > 2000) e.synopsis = "2000 caractères maximum.";
  return e;
}

export default function AdminBiblioPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Tous");
  const [tier, setTier] = useState("Tous");
  const [quick, setQuick] = useState<"" | "sans-synopsis" | "couverture-externe">("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const [picked, setPicked] = useState<WorkCandidate | null>(null);
  const [manual, setManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  async function load() {
    setLoading(true); setLoadError(null);
    const { data, error } = await supabase.from("bibliotheque").select("*").order("created_at", { ascending: false });
    if (error) setLoadError(`Lecture impossible : ${error.message}`);
    if (data) setRows(data as Row[]);
    setLoading(false);
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (type !== "Tous" && r.type !== type) return false;
    if (tier !== "Tous" && r.tier !== tier) return false;
    if (quick === "sans-synopsis" && r.synopsis?.trim()) return false;
    if (quick === "couverture-externe" && (isStored(r.cover_image) || !r.cover_image)) return false;
    return !query || norm(`${r.title} ${r.studio ?? ""} ${(r.genres ?? []).join(" ")}`).includes(norm(query));
  }), [rows, type, tier, quick, query]);

  const errors = formErrors(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const err = (k: keyof Form) => (touched || form[k] !== initial[k]) && errors[k];
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditing("new"); setForm(EMPTY); setInitial(EMPTY); setPicked(null); setManual(false); setTouched(false); setSaveError(null); };
  const openEdit = (r: Row) => { const f = toForm(r); setEditing(r); setForm(f); setInitial(f); setPicked(null); setManual(false); setTouched(false); setSaveError(null); };

  // Œuvre choisie dans la recherche : on pré-remplit, rien n'est enregistré.
  function pick(c: WorkCandidate) {
    setPicked(c);
    const title = c.titleFr && !c.titleFrUnverified ? c.titleFr : c.title;
    const exists = rows.find((r) => norm(r.title) === norm(title));
    if (exists) notify(`« ${exists.title} » est déjà dans la Bibliothèque : vérifie avant d'ajouter un doublon.`, "info");
    setForm((f) => ({
      ...f, title,
      type: c.kind === "MANGA" ? "Manga" : c.format === "FILM" ? "Film/Série" : "Anime",
      year: c.year ? String(c.year) : "", episodes: c.episodes ? String(c.episodes) : "",
      genres: (c.genres ?? []).join(", "), status: c.status && (STATUSES as readonly string[]).includes(c.status) ? c.status : f.status,
      synopsis: c.synopsisFr ? (c.synopsisCredit ? `${c.synopsisFr}\n\n(Synopsis : ${c.synopsisCredit.label}, ${c.synopsisCredit.url})` : c.synopsisFr) : "", trailer: c.trailer ? `https://www.youtube.com/watch?v=${c.trailer.youtubeId}` : "", cover: c.coverUrl ?? "",
    }));
  }

  async function save() {
    setTouched(true); setSaveError(null);
    if (Object.keys(errors).length) { setSaveError("Corrige les champs signalés avant d'enregistrer."); return; }
    setSaving(true);
    try {
      const values: Record<string, unknown> = {
        title: form.title.trim(), type: form.type, tier: form.tier, status: form.status,
        score: form.score.trim() ? Number(form.score.replace(",", ".")) : null,
        year: form.year.trim() ? Number(form.year) : null, episodes: form.episodes.trim() ? Number(form.episodes) : null,
        genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 8),
        studio: form.studio.trim() || null,
        // Jamais de résumé anglais publié comme synopsis : seul le champ français est enregistré.
        synopsis: form.synopsis.trim(), avis_guilde: form.avis.trim() || null, trailer_url: form.trailer.trim() || null,
      };
      // Couverture : copiée dans le stockage du site quand elle vient d'une source externe.
      if (form.cover.trim() !== (editing !== "new" && editing ? editing.cover_image ?? "" : "") || editing === "new") {
        if (form.cover.trim()) {
          const res = await fetch("/api/resolve-cover", { method: "POST", headers: getAdminHeaders(), body: JSON.stringify({ title: values.title, anilistId: picked?.anilistId, coverUrl: form.cover.trim() }) });
          const json = await res.json().catch(() => null);
          if (!res.ok) throw new Error(json?.error || "Couverture non enregistrée");
          values.cover_image = json.coverUrl ?? form.cover.trim();
        } else values.cover_image = null;
      }
      if (editing === "new") {
        const meta = findDossierBashEntry(String(values.title));
        Object.assign(values, { dossier_bash: !!meta, dossier_bash_tag: meta?.tag ?? null, dossier_bash_date: meta?.date ?? null, dossier_bash_color: meta?.color ?? null });
        const { error } = await adminDb.insert("bibliotheque", [values]);
        if (error) throw new Error(error.message);
        notify(`« ${values.title} » ajouté à la Bibliothèque`);
      } else if (editing) {
        const { error } = await adminDb.update("bibliotheque", editing.id, values);
        if (error) throw new Error(error.message);
        notify(`« ${values.title} » enregistré`);
      }
      setEditing(null);
      void load();
    } catch (e) {
      setSaveError(`Enregistrement refusé : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    } finally { setSaving(false); }
  }

  async function remove(r: Row) {
    const ok = await confirm({
      title: `Supprimer « ${r.title} » ?`,
      body: <>La fiche <strong>{r.title}</strong>{r.tier ? <> (verdict : {r.tier})</> : null}, son synopsis et l&apos;avis de la Guilde seront retirés de la Bibliothèque et <strong>effacés définitivement</strong>. Les favoris des membres ne sont pas touchés.</>,
      confirmLabel: "Supprimer cette fiche", danger: true,
    });
    if (!ok) return;
    const { error } = await adminDb.remove("bibliotheque", r.id);
    if (error) { notify(`Suppression refusée : ${error.message}`, "error"); return; }
    setRows((x) => x.filter((y) => y.id !== r.id));
    notify(`« ${r.title} » supprimé`);
  }

  async function sync(kind: "covers" | "one" | "dossier", r?: Row) {
    setBusy(kind === "one" ? `one-${r!.id}` : kind);
    try {
      const res = await fetch(kind === "dossier" ? "/api/bibliotheque-sync-dossier-bash" : "/api/bibliotheque-sync-covers", {
        method: "POST", headers: getAdminHeaders(), body: JSON.stringify(kind === "one" ? { id: r!.id, force: true } : { force: false }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      notify(kind === "one" ? `Couverture de « ${r!.title} » resynchronisée` : `${data?.updated ?? 0} ${kind === "dossier" ? "fiche(s) Chronique du Bash" : "couverture(s)"} synchronisée(s)`);
      void load();
    } catch (e) {
      notify(`Synchronisation impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`, "error");
    } finally { setBusy(null); }
  }

  const step = editing === "new" && !picked && !manual;

  return (
    <AdminShell section="bibliotheque" title="Bibliothèque" intro="Les fiches de la tier list. Le synopsis publié est toujours celui écrit en français."
      actions={<>
        <Link href="/admin-biblio/bulk" className="am-btn"><Layers size={16} aria-hidden="true" /> Import en masse</Link>
        <button type="button" className="am-btn am-btn--gold" onClick={openNew}><Plus size={16} aria-hidden="true" /> Ajouter une œuvre</button>
      </>}>
      {loadError && <p className="am-alert am-alert--error" role="alert">{loadError} <button type="button" className="am-btn am-btn--sm" onClick={load}>Réessayer</button></p>}

      <details className="am-panel am-tools">
        <summary>Outils de synchronisation</summary>
        <div className="am-row">
          <button type="button" className="am-btn" onClick={() => sync("covers")} disabled={!!busy}><RefreshCw size={15} className={busy === "covers" ? "am-spin" : ""} aria-hidden="true" /> Copier les couvertures externes dans le stockage</button>
          <button type="button" className="am-btn" onClick={() => sync("dossier")} disabled={!!busy}><RefreshCw size={15} className={busy === "dossier" ? "am-spin" : ""} aria-hidden="true" /> Synchroniser la Chronique du Bash</button>
        </div>
      </details>

      <ListToolbar query={query} onQuery={setQuery} placeholder="Rechercher une œuvre (titre, studio, genre)" count={filtered.length} total={rows.length}>
        {["Tous", ...TYPES].map((t) => <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>)}
      </ListToolbar>
      <div className="am-chips" role="group" aria-label="Filtrer par verdict et par état">
        {["Tous", ...TIERS].map((t) => <Chip key={t} active={tier === t} onClick={() => setTier(t)}>{t === "Tous" ? "Tous les verdicts" : t}</Chip>)}
        <Chip active={quick === "sans-synopsis"} onClick={() => setQuick(quick === "sans-synopsis" ? "" : "sans-synopsis")}>Sans synopsis</Chip>
        <Chip active={quick === "couverture-externe"} onClick={() => setQuick(quick === "couverture-externe" ? "" : "couverture-externe")}>Couverture externe</Chip>
      </div>

      {loading ? <p className="am-loading" role="status">Chargement…</p>
        : filtered.length === 0 ? <p className="am-empty-state">{rows.length ? "Aucune œuvre ne correspond." : "La Bibliothèque est vide."}</p>
          : (
            <ul className="am-rows">
              {filtered.map((r) => (
                <li key={r.id} className="am-row-item">
                  <span className="am-row-thumb">
                    {r.cover_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={r.cover_image} alt="" loading="lazy" />
                      : r.title.slice(0, 1)}
                  </span>
                  <div className="am-row-main">
                    <strong>{r.title}</strong>
                    <small>{[r.type, r.year, r.status, r.score != null ? `${r.score}/10` : null].filter(Boolean).join(" · ")}</small>
                    <span className="am-row-tags">
                      {r.tier && <span className="am-tag">{r.tier}</span>}
                      {!r.synopsis?.trim() && <span className="am-tag is-warn">Synopsis manquant</span>}
                      {!r.cover_image ? <span className="am-tag is-warn">Sans couverture</span> : !isStored(r.cover_image) && <span className="am-tag is-warn">Couverture externe</span>}
                      {r.trailer_url && <span className="am-tag is-ok">Bande-annonce</span>}
                    </span>
                  </div>
                  <div className="am-row-actions">
                    <button type="button" className="am-btn am-btn--sm" onClick={() => openEdit(r)}><Pencil size={14} aria-hidden="true" /> Modifier</button>
                    <button type="button" className="am-btn am-btn--sm" onClick={() => sync("one", r)} disabled={!!busy} aria-label={`Resynchroniser la couverture de ${r.title}`}>
                      <ImageIcon size={14} className={busy === `one-${r.id}` ? "am-spin" : ""} aria-hidden="true" /> Couverture
                    </button>
                    <button type="button" className="am-btn am-btn--sm am-btn--danger" onClick={() => remove(r)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

      {editing && (
        <EditorSheet kicker={editing === "new" ? "Nouvelle œuvre" : "Modifier la fiche"} title={form.title || (step ? "Rechercher une œuvre" : "Sans titre")} dirty={dirty} confirm={confirm} onClose={() => setEditing(null)}
          footer={<>
            <button type="button" className="am-btn" onClick={() => setEditing(null)}>Annuler</button>
            {!step && <button type="button" className="am-btn am-btn--gold" onClick={save} disabled={saving || (!dirty && editing !== "new")}>{saving ? "Enregistrement…" : editing === "new" ? "Ajouter à la Bibliothèque" : dirty ? "Enregistrer" : "Enregistré"}</button>}
          </>}>
          {saveError && <p className="am-alert am-alert--error" role="alert">{saveError}</p>}
          {step ? (
            <>
              <WorkSearch onPick={pick} pickLabel="Choisir cette œuvre" />
              <button type="button" className="am-btn" onClick={() => setManual(true)}>Œuvre introuvable : saisie manuelle</button>
            </>
          ) : (
            <>
              {picked && (
                <p className="am-alert am-alert--ok">
                  Pré-rempli depuis {SOURCE_LABEL[picked.source]} ({FORMAT_LABEL[picked.format]}{picked.year ? `, ${picked.year}` : ""}). Relis avant d&apos;enregistrer.
                  {editing === "new" && <> <button type="button" className="am-btn am-btn--sm" onClick={() => { setPicked(null); setForm(EMPTY); }}>Changer d&apos;œuvre</button></>}
                </p>
              )}
              <div className="am-edit-top">
                <span className="am-row-thumb am-edit-cover">
                  {form.cover && !errors.cover
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={form.cover} alt="Couverture" />
                    : (form.title || "?").slice(0, 1)}
                </span>
                <div style={{ display: "grid", gap: 12, minWidth: 0, flex: 1 }}>
                  <label className="am-field"><span>Titre <b>*</b></span>
                    <input className="am-input" value={form.title} maxLength={160} onChange={(e) => set("title", e.target.value)} aria-invalid={!!err("title")} />
                    {err("title") && <small style={{ color: "var(--am-red)" }}>{err("title")}</small>}
                  </label>
                  <label className="am-field"><span>Couverture (adresse d&apos;image)</span>
                    <input className="am-input" value={form.cover} inputMode="url" onChange={(e) => set("cover", e.target.value)} aria-invalid={!!err("cover")} placeholder="https://…" />
                    <small>{err("cover") || "Copiée dans le stockage du site à l'enregistrement."}</small>
                  </label>
                </div>
              </div>
              <fieldset className="am-fieldset"><legend>Classement</legend>
                <div className="am-grid2">
                  <label className="am-field"><span>Type</span><select className="am-input" value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
                  <label className="am-field"><span>Verdict</span><select className="am-input" value={form.tier} onChange={(e) => set("tier", e.target.value)}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></label>
                  <label className="am-field"><span>Note sur 10</span><input className="am-input" value={form.score} inputMode="decimal" onChange={(e) => set("score", e.target.value)} aria-invalid={!!err("score")} />{err("score") && <small style={{ color: "var(--am-red)" }}>{err("score")}</small>}</label>
                  <label className="am-field"><span>Statut</span><select className="am-input" value={form.status} onChange={(e) => set("status", e.target.value)}>{[...new Set([...STATUSES, form.status])].map((t) => <option key={t}>{t}</option>)}</select></label>
                </div>
              </fieldset>
              <fieldset className="am-fieldset"><legend>Textes</legend>
                <label className="am-field"><span>Synopsis en français</span>
                  <textarea className="am-input" rows={5} value={form.synopsis} onChange={(e) => set("synopsis", e.target.value)} aria-invalid={!!err("synopsis")} />
                  <small>{err("synopsis") || (picked?.synopsisFr ? `Synopsis français de ${picked.synopsisCredit ? picked.synopsisCredit.label : SOURCE_LABEL[picked.source]} : relis-le${picked.synopsisCredit?.label.startsWith("Wikipédia") ? " (garde la mention de source : licence CC BY-SA)" : ""}.` : picked ? `Pas de synopsis français chez ${SOURCE_LABEL[picked.source]} : écris-le, ou laisse vide.` : `${form.synopsis.length} / 2000`)}</small>
                </label>
                {picked?.synopsisEn && !picked.synopsisFr && (
                  <details><summary className="am-hint-summary">Résumé en anglais de la source (référence, jamais publié)</summary><p className="am-hint-text" lang="en">{picked.synopsisEn}</p></details>
                )}
                <label className="am-field"><span>Avis de la Guilde</span><textarea className="am-input" rows={4} value={form.avis} onChange={(e) => set("avis", e.target.value)} /></label>
              </fieldset>
              <fieldset className="am-fieldset"><legend>Détails</legend>
                <div className="am-grid2">
                  <label className="am-field"><span>Année</span><input className="am-input" value={form.year} inputMode="numeric" onChange={(e) => set("year", e.target.value)} aria-invalid={!!err("year")} />{err("year") && <small style={{ color: "var(--am-red)" }}>{err("year")}</small>}</label>
                  <label className="am-field"><span>Épisodes ou chapitres</span><input className="am-input" value={form.episodes} inputMode="numeric" onChange={(e) => set("episodes", e.target.value)} aria-invalid={!!err("episodes")} /></label>
                  <label className="am-field"><span>Genres (séparés par des virgules)</span><input className="am-input" value={form.genres} onChange={(e) => set("genres", e.target.value)} /></label>
                  <label className="am-field"><span>Studio</span><input className="am-input" value={form.studio} onChange={(e) => set("studio", e.target.value)} /></label>
                </div>
                <label className="am-field"><span>Bande-annonce (lien YouTube)</span>
                  <input className="am-input" value={form.trailer} inputMode="url" onChange={(e) => set("trailer", e.target.value)} aria-invalid={!!err("trailer")} placeholder="https://www.youtube.com/watch?v=…" />
                  {err("trailer") ? <small style={{ color: "var(--am-red)" }}>{err("trailer")}</small> : picked?.trailer && <small>Proposée par {SOURCE_LABEL[picked.source]} (langue : {picked.trailer.lang ?? "non précisée"}).</small>}
                </label>
              </fieldset>
            </>
          )}
        </EditorSheet>
      )}
      {confirmNode}
      {toasts}
    </AdminShell>
  );
}
