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

const shuffled = <T,>(list: T[]) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

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

/** Image prête à l'envoi : réduite si possible, sinon l'originale (jamais une image vide). */
async function prepare(file: File): Promise<{ blob: Blob; name: string }> {
  const big = file.size > 4 * 1024 * 1024;
  const blob = await compressImage(file, big ? 1600 : 1920, big ? 0.8 : 0.85);
  // La compression peut échouer (image trop grande pour le téléphone, format exotique) :
  // on garde alors le fichier d'origine, avec son vrai type.
  if (!blob.size || blob === file || blob.size >= file.size) return { blob: file, name: file.name };
  return { blob, name: file.name.replace(/\.(png|webp|avif)$/i, ".jpg") };
}

/**
 * Envoi d'une image : directement vers le stockage (lien signé délivré par le serveur),
 * puis vérification par le serveur. Renvoie un message d'erreur, ou null si tout va bien.
 * Repli sur l'ancien envoi (via le serveur) si le lien signé est indisponible.
 */
async function sendImage(file: File): Promise<string | null> {
  const { blob, name } = await prepare(file);
  const type = blob.type || file.type || "image/jpeg";
  const sign = await fetch("/api/atelier", { method: "POST", headers: getAdminHeaders(), body: JSON.stringify({ action: "sign", name, type, size: blob.size }) });
  const s = await sign.json().catch(() => null);
  if (sign.ok && s?.signedUrl) {
    // Même format que l'envoi des portraits (déjà en service) : formulaire avec le fichier.
    const form = new FormData();
    form.append("cacheControl", "31536000");
    form.append("", blob.type ? blob : new Blob([blob], { type }), name);
    const put = await fetch(s.signedUrl, { method: "PUT", headers: { "x-upsert": "false", ...(ANON ? { apikey: ANON } : {}) }, body: form });
    if (!put.ok) {
      const t = await put.text().catch(() => "");
      return `stockage ${put.status}${t ? ` : ${t.slice(0, 160)}` : ""}`;
    }
    const fin = await fetch("/api/atelier", { method: "POST", headers: getAdminHeaders(), body: JSON.stringify({ action: "finalize", name: s.name }) });
    const f = await fin.json().catch(() => null);
    return fin.ok && f?.success ? null : (f?.error || `erreur ${fin.status}`);
  }
  if (sign.status === 400) return s?.error || "fichier refusé";
  // Repli : envoi par le serveur du site (4,5 Mo au plus).
  if (blob.size > 4.4 * 1024 * 1024) return s?.error || "fichier trop lourd pour l'envoi de secours (4,5 Mo)";
  const fd = new FormData();
  fd.append("files", blob, name);
  const res = await fetch("/api/atelier", { method: "POST", headers: getAdminFormDataHeaders(), body: fd });
  const data = await res.json().catch(() => null);
  return res.ok && (data?.success || data?.results?.[0]?.success) ? null : (data?.results?.[0]?.error || data?.error || `erreur ${res.status}`);
}
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  const order = useRef<string[]>([]);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  async function load() {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch("/api/atelier");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      // Ordre aléatoire (comme sur le site), stable pendant la session : les nouvelles
      // images passent en tête, les autres gardent leur place après une modification.
      const list: SupabaseAtelierRow[] = data.images || [];
      if (!order.current.length) order.current = shuffled(list.map((i) => i.filename));
      const rank = new Map(order.current.map((f, k) => [f, k]));
      const fresh = list.filter((i) => !rank.has(i.filename)).map((i) => i.filename);
      order.current = [...fresh, ...order.current.filter((f) => list.some((i) => i.filename === f))];
      const pos = new Map(order.current.map((f, k) => [f, k]));
      setImages([...list].sort((a, b) => (pos.get(a.filename) ?? 0) - (pos.get(b.filename) ?? 0)));
      setDbWarning(data.db_status && data.db_status !== "connected" ? data.db_error || "Base de données indisponible" : null);
    } catch (e) {
      setLoadError(`Lecture des futilités impossible : ${e instanceof Error ? e.message : "erreur réseau"}`);
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
      try {
        const err = await sendImage(file);
        if (err) failures.push(`${file.name} (${err})`);
      } catch {
        failures.push(`${file.name} (réseau)`);
      }
    }
    setProgress(null);
    const okCount = files.length - failures.length;
    if (okCount) notify(`${okCount} image${okCount > 1 ? "s" : ""} ajoutée${okCount > 1 ? "s" : ""} aux futilités`);
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
      body: <>Le fichier <strong>{r.filename}</strong> et ses informations seront retirés des futilités et <strong>effacés définitivement</strong> du stockage.</>,
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
    <AdminShell section="atelier" title="Futilités" intro="Les images de la galerie Les futilités de la Guilde. Dépose des images puis complète leurs informations."
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
        : filtered.length === 0 ? <p className="am-empty-state">{images.length ? "Aucune image ne correspond." : "Aucune image dans les futilités."}</p>
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
