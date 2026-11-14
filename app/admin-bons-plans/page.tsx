"use client";

// Administration des bons plans : rechercher, filtrer par catégorie, ajouter,
// modifier, supprimer (confirmation précise). Écritures vérifiées côté serveur.
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { adminDb } from "../../lib/admin-db-client";
import type { SupabaseBonPlanRow } from "../types";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, EditorSheet, ListToolbar, norm, useConfirm, useToast } from "../admin-ui/ui";

const CATEGORIES = ["Animes", "Scans", "Films/Séries", "Utiles"];
interface Form { title: string; desc: string; url: string; category: string; color: string; logo: string }
const EMPTY: Form = { title: "", desc: "", url: "", category: "Animes", color: "#8b5cf6", logo: "" };
const host = (u: string) => { try { return new URL(u).hostname; } catch { return u.slice(0, 40); } };
const toForm = (l: SupabaseBonPlanRow): Form => ({ title: l.title, desc: l.desc ?? "", url: l.url, category: l.category, color: l.color || "#8b5cf6", logo: l.logo ?? "" });

function formErrors(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.title.trim()) e.title = "Le nom est obligatoire.";
  if (!/^https:\/\/\S+$/.test(f.url.trim())) e.url = "Adresse complète commençant par https:// attendue.";
  if (f.logo.trim() && !/^https:\/\/\S+$/.test(f.logo.trim())) e.logo = "Adresse d'image https:// attendue (ou laisse vide).";
  if (!/^#[0-9a-fA-F]{6}$/.test(f.color)) e.color = "Couleur au format #RRGGBB.";
  if (f.desc.length > 300) e.desc = "300 caractères maximum.";
  return e;
}

export default function AdminBonsPlansPage() {
  const [links, setLinks] = useState<SupabaseBonPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [editing, setEditing] = useState<SupabaseBonPlanRow | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  async function load() {
    setLoading(true); setLoadError(null);
    const { data, error } = await supabase.from("bons_plans").select("*").order("id", { ascending: false });
    if (error) setLoadError(`Lecture impossible : ${error.message}`);
    if (data) setLinks(data);
    setLoading(false);
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const filtered = useMemo(() => links.filter((l) =>
    (cat === "Toutes" || l.category === cat) && (!query || norm(`${l.title} ${l.desc} ${l.url}`).includes(norm(query)))), [links, cat, query]);

  const open = (l: SupabaseBonPlanRow | "new") => {
    const f = l === "new" ? EMPTY : toForm(l);
    setForm(f); setInitial(f); setEditing(l); setTouched(false); setSaveError(null);
  };
  const errors = formErrors(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const err = (k: keyof Form) => (touched || form[k] !== initial[k]) && errors[k];

  async function save() {
    setTouched(true); setSaveError(null);
    if (Object.keys(errors).length) { setSaveError("Corrige les champs signalés avant d'enregistrer."); return; }
    setSaving(true);
    const payload = { title: form.title.trim(), desc: form.desc.trim(), url: form.url.trim(), category: form.category, color: form.color, logo: form.logo.trim() || null };
    const { error } = editing === "new" ? await adminDb.insert("bons_plans", [payload]) : await adminDb.update("bons_plans", (editing as SupabaseBonPlanRow).id, payload);
    setSaving(false);
    if (error) { setSaveError(`Enregistrement refusé : ${error.message}`); return; }
    notify(editing === "new" ? `« ${payload.title} » ajouté` : `« ${payload.title} » enregistré`);
    setEditing(null);
    void load();
  }

  async function remove(l: SupabaseBonPlanRow) {
    const ok = await confirm({
      title: `Supprimer « ${l.title} » ?`,
      body: <>Le lien vers <strong>{l.url}</strong> (catégorie {l.category}) sera retiré de la page Bons plans et effacé définitivement.</>,
      confirmLabel: "Supprimer ce lien", danger: true,
    });
    if (!ok) return;
    const { error } = await adminDb.remove("bons_plans", l.id);
    if (error) { notify(`Suppression refusée : ${error.message}`, "error"); return; }
    setLinks((x) => x.filter((y) => y.id !== l.id));
    if (editing && editing !== "new" && editing.id === l.id) setEditing(null);
    notify(`« ${l.title} » supprimé`);
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AdminShell section="bons-plans" title="Bons plans" intro="Les liens affichés sur la page Bons plans."
      actions={<button type="button" className="am-btn am-btn--gold" onClick={() => open("new")}><Plus size={16} aria-hidden="true" /> Ajouter un lien</button>}>
      {loadError && <p className="am-alert am-alert--error" role="alert">{loadError} <button type="button" className="am-btn am-btn--sm" onClick={load}>Réessayer</button></p>}
      <ListToolbar query={query} onQuery={setQuery} placeholder="Rechercher un lien (nom, description, adresse)" count={filtered.length} total={links.length}>
        {["Toutes", ...CATEGORIES].map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </ListToolbar>
      {loading ? <p className="am-loading" role="status">Chargement…</p>
        : filtered.length === 0 ? <p className="am-empty-state">{links.length ? "Aucun lien ne correspond." : "Aucun lien pour l'instant."}</p>
          : (
            <ul className="am-rows">
              {filtered.map((l) => (
                <li key={l.id} className="am-row-item">
                  <span className="am-row-thumb is-square" style={{ background: l.color }}>
                    {l.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={l.logo} alt="" loading="lazy" style={{ objectFit: "contain", background: "#fff" }} />
                      : l.title.slice(0, 1)}
                  </span>
                  <div className="am-row-main">
                    <strong>{l.title}</strong>
                    <small>{l.desc}</small>
                    <span className="am-row-tags"><span className="am-tag">{l.category}</span><a className="am-tag" href={l.url} target="_blank" rel="noopener noreferrer">{host(l.url)} <ExternalLink size={10} aria-hidden="true" /></a></span>
                  </div>
                  <div className="am-row-actions">
                    <button type="button" className="am-btn am-btn--sm" onClick={() => open(l)}><Pencil size={14} aria-hidden="true" /> Modifier</button>
                    <button type="button" className="am-btn am-btn--sm am-btn--danger" onClick={() => remove(l)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

      {editing && (
        <EditorSheet kicker={editing === "new" ? "Nouveau lien" : "Modifier le lien"} title={form.title || "Sans nom"} dirty={dirty} confirm={confirm} onClose={() => setEditing(null)}
          footer={<>
            <button type="button" className="am-btn" onClick={() => setEditing(null)}>Annuler</button>
            <button type="button" className="am-btn am-btn--gold" onClick={save} disabled={saving || (!dirty && editing !== "new")}>{saving ? "Enregistrement…" : editing === "new" ? "Ajouter" : dirty ? "Enregistrer" : "Enregistré"}</button>
          </>}>
          {saveError && <p className="am-alert am-alert--error" role="alert">{saveError}</p>}
          <label className="am-field"><span>Nom <b>*</b></span>
            <input className="am-input" value={form.title} maxLength={80} onChange={(e) => set("title", e.target.value)} aria-invalid={!!err("title")} />
            {err("title") && <small style={{ color: "var(--am-red)" }}>{err("title")}</small>}
          </label>
          <label className="am-field"><span>Adresse <b>*</b></span>
            <input className="am-input" value={form.url} inputMode="url" placeholder="https://…" onChange={(e) => set("url", e.target.value)} aria-invalid={!!err("url")} />
            {err("url") && <small style={{ color: "var(--am-red)" }}>{err("url")}</small>}
          </label>
          <label className="am-field"><span>Description</span>
            <textarea className="am-input" value={form.desc} maxLength={300} rows={3} onChange={(e) => set("desc", e.target.value)} />
            <small>{err("desc") || `${form.desc.length} / 300`}</small>
          </label>
          <div className="am-grid2">
            <label className="am-field"><span>Catégorie</span>
              <select className="am-input" value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="am-field"><span>Couleur</span>
              <span className="am-color"><input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} aria-label="Choisir la couleur" /><input className="am-input" value={form.color} onChange={(e) => set("color", e.target.value)} aria-label="Code couleur" aria-invalid={!!err("color")} /></span>
            </label>
          </div>
          <label className="am-field"><span>Logo (adresse d&apos;image, facultatif)</span>
            <input className="am-input" value={form.logo} inputMode="url" placeholder="https://…" onChange={(e) => set("logo", e.target.value)} aria-invalid={!!err("logo")} />
            {err("logo") && <small style={{ color: "var(--am-red)" }}>{err("logo")}</small>}
          </label>
        </EditorSheet>
      )}
      {confirmNode}
      {toasts}
    </AdminShell>
  );
}
