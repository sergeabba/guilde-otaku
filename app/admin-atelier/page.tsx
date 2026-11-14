"use client";

// Administration de l'Atelier (images IA) : déposer des images, les retrouver
// (recherche, catégorie), modifier leurs informations, les supprimer (confirmation précise).
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { getAdminHeaders, getAdminFormDataHeaders } from "../../lib/admin-fetch";
import type { SupabaseAtelierRow } from "../types";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, EditorSheet, ListToolbar, norm, useConfirm, useToast } from "../admin-ui/ui";

const CATEGORIES = ["Portrait", "Scène", "Création", "VFX"];
const SIZES: [string, string][] = [["small", "Petite"], ["medium", "Moyenne"], ["wide", "Large (2 colonnes)"], ["tall", "Haute (2 lignes)"]];
interface Form { title: string; category: string; size: string; description: string; prompt: string; universe: string; accent: string }
const toForm = (r: SupabaseAtelierRow): Form => ({
  title: r.title ?? "", category: r.category ?? "Création", size: r.size ?? "small", description: r.description ?? "",
  prompt: r.prompt ?? "", universe: r.universe ?? "Guilde Otaku", accent: r.accent ?? "#8b5cf6",
});

// Réduit les grandes images avant l'envoi (1920 px max, JPEG pour les PNG).
function compressImage(file: File, maxSize = 1920, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) { const r = Math.min(maxSize / w, maxSize / h); w = Math.round(w * r); h = Math.round(h * r); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(src);
      canvas.toBlob((b) => resolve(b || file), file.type === "image/png" ? "image/jpeg" : file.type, quality);
    };
    img.onerror = () => { URL.revokeObjectURL(src); resolve(file); };
    img.src = src;
  });
}

export default function AdminAtelierPage() {
  const [images, setImages] = useState<SupabaseAtelierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editing, setEditing] = useState<SupabaseAtelierRow | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [initial, setInitial] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  async function load() {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch("/api/atelier");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setImages(data.images || []);
      setDbWarning(data.db_status && data.db_status !== "connected" ? data.db_error || "Base de données indisponible" : null);
    } catch (e) {
      setLoadError(`Lecture de l'Atelier impossible : ${e instanceof Error ? e.message : "erreur réseau"}`);
    }
    setLoading(false);
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const filtered = useMemo(() => images.filter((i) =>
    (cat === "Toutes" || i.category === cat) && (!query || norm(`${i.title} ${i.description ?? ""} ${i.filename}`).includes(norm(query)))), [images, cat, query]);

  async function upload(files: File[]) {
    const failures: string[] = [];
    for (const [i, file] of files.entries()) {
      setProgress({ current: i + 1, total: files.length, name: file.name });
      const fd = new FormData();
      fd.append("files", await compressImage(file), file.name.replace(/\.png$/i, ".jpg"));
      try {
        const res = await fetch("/api/atelier", { method: "POST", headers: getAdminFormDataHeaders(), body: fd });
        const data = await res.json().catch(() => null);
        const ok = res.ok && (data?.success || data?.results?.[0]?.success);
        if (!ok) failures.push(`${file.name} (${data?.results?.[0]?.error || data?.error || `erreur ${res.status}`})`);
      } catch {
        failures.push(`${file.name} (réseau)`);
      }
    }
    setProgress(null);
    const okCount = files.length - failures.length;
    if (okCount) notify(`${okCount} image${okCount > 1 ? "s" : ""} ajoutée${okCount > 1 ? "s" : ""} à l'Atelier`);
    if (failures.length) notify(`Échec de l'envoi : ${failures.join(", ")}`, "error");
    void load();
  }

  const open = (r: SupabaseAtelierRow) => { const f = toForm(r); setEditing(r); setForm(f); setInitial(f); setSaveError(null); };
  const dirty = !!form && JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function save() {
    if (!editing || !form) return;
    if (!form.title.trim()) { setSaveError("Le titre est obligatoire."); return; }
    if (!/^#[0-9a-fA-F]{6}$/.test(form.accent)) { setSaveError("Couleur au format #RRGGBB."); return; }
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/atelier", { method: "PATCH", headers: getAdminHeaders(), body: JSON.stringify({ filename: editing.filename, ...form, title: form.title.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `erreur ${res.status}`);
      notify(`« ${form.title.trim()} » enregistré`);
      setEditing(null);
      void load();
    } catch (e) {
      setSaveError(`Enregistrement refusé : ${e instanceof Error ? e.message : "erreur réseau"}. Si la table atelier n'existe pas encore, l'information ne peut pas être gardée.`);
    } finally { setSaving(false); }
  }

  async function remove(r: SupabaseAtelierRow) {
    const ok = await confirm({
      title: `Supprimer « ${r.title} » ?`,
      body: <>Le fichier <strong>{r.filename}</strong> et ses informations seront retirés de l&apos;Atelier et <strong>effacés définitivement</strong> du stockage.</>,
      confirmLabel: "Supprimer cette image", danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/atelier", { method: "DELETE", headers: getAdminHeaders(), body: JSON.stringify({ filename: r.filename }) });
      if (!res.ok) throw new Error(`erreur ${res.status}`);
      setImages((x) => x.filter((y) => y.filename !== r.filename));
      notify(`« ${r.title} » supprimé`);
    } catch (e) {
      notify(`Suppression refusée : ${e instanceof Error ? e.message : "erreur réseau"}`, "error");
    }
  }

  return (
    <AdminShell section="atelier" title="Atelier" intro="Les images de la galerie Atelier. Dépose des images puis complète leurs informations."
      actions={<button type="button" className="am-btn am-btn--gold" onClick={() => input.current?.click()} disabled={!!progress}><Upload size={16} aria-hidden="true" /> Ajouter des images</button>}>
      {loadError && <p className="am-alert am-alert--error" role="alert">{loadError} <button type="button" className="am-btn am-btn--sm" onClick={load}>Réessayer</button></p>}
      {dbWarning && <p className="am-alert am-alert--info">Les images s&apos;affichent, mais leurs informations ne peuvent pas être enregistrées : {dbWarning}. La table <code>atelier</code> doit exister dans Supabase.</p>}

      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" hidden
        onChange={(e) => { if (e.target.files?.length) { void upload([...e.target.files]); e.target.value = ""; } }} />
      <button type="button" className={`am-drop${dragActive ? " is-active" : ""}`} disabled={!!progress}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.length) void upload([...e.dataTransfer.files]); }}>
        <Upload size={28} aria-hidden="true" className={progress ? "am-spin" : ""} />
        {progress
          ? <span role="status">Envoi {progress.current} sur {progress.total} : {progress.name}</span>
          : <span><strong>Touche ou dépose des images ici</strong><small>Plusieurs fichiers possibles · PNG, JPG ou WebP, 10 Mo maximum</small></span>}
      </button>

      <ListToolbar query={query} onQuery={setQuery} placeholder="Rechercher une image (titre, description, fichier)" count={filtered.length} total={images.length}>
        {["Toutes", ...CATEGORIES].map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </ListToolbar>

      {loading ? <p className="am-loading" role="status">Chargement…</p>
        : filtered.length === 0 ? <p className="am-empty-state">{images.length ? "Aucune image ne correspond." : "Aucune image dans l'Atelier."}</p>
          : (
            <ul className="am-gallery">
              {filtered.map((r) => (
                <li key={r.filename} className="am-gallery-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt="" loading="lazy" />
                  <div className="am-gallery-info">
                    <strong>{r.title}</strong>
                    <span className="am-row-tags">
                      {r.category && <span className="am-tag" style={{ color: r.accent }}>{r.category}</span>}
                      {!r.has_db_record && <span className="am-tag is-warn">Infos à compléter</span>}
                    </span>
                    <div className="am-row-actions">
                      <button type="button" className="am-btn am-btn--sm" onClick={() => open(r)}><Pencil size={14} aria-hidden="true" /> Modifier</button>
                      <button type="button" className="am-btn am-btn--sm am-btn--danger" onClick={() => remove(r)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

      {editing && form && (
        <EditorSheet kicker="Modifier l'image" title={form.title || "Sans titre"} dirty={dirty} confirm={confirm} onClose={() => setEditing(null)}
          footer={<>
            <button type="button" className="am-btn" onClick={() => setEditing(null)}>Annuler</button>
            <button type="button" className="am-btn am-btn--gold" onClick={save} disabled={saving || !dirty}>{saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}</button>
          </>}>
          {saveError && <p className="am-alert am-alert--error" role="alert">{saveError}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={editing.url} alt="" className="am-gallery-preview" />
          <p className="am-intro">Fichier : {editing.filename}</p>
          <label className="am-field"><span>Titre <b>*</b></span><input className="am-input" value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></label>
          <div className="am-grid2">
            <label className="am-field"><span>Catégorie</span><select className="am-input" value={form.category} onChange={(e) => set("category", e.target.value)}>{[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="am-field"><span>Taille dans la galerie</span><select className="am-input" value={form.size} onChange={(e) => set("size", e.target.value)}>{SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="am-field"><span>Univers</span><input className="am-input" value={form.universe} maxLength={80} onChange={(e) => set("universe", e.target.value)} /></label>
            <label className="am-field"><span>Couleur d&apos;accent</span>
              <span className="am-color"><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.accent) ? form.accent : "#8b5cf6"} onChange={(e) => set("accent", e.target.value)} aria-label="Choisir la couleur" /><input className="am-input" value={form.accent} onChange={(e) => set("accent", e.target.value)} aria-label="Code couleur" /></span>
            </label>
          </div>
          <label className="am-field"><span>Description</span><textarea className="am-input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></label>
          <label className="am-field"><span>Prompt d&apos;origine</span><textarea className="am-input" rows={3} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }} /></label>
        </EditorSheet>
      )}
      {confirmNode}
      {toasts}
    </AdminShell>
  );
}
