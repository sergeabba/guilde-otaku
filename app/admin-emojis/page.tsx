"use client";

// Énigmes du Quiz des émojis : propositions des membres à valider, énigmes ajoutées par
// l'admin. Les 50 énigmes de base vivent dans le code (data/emoji-quiz.json).
import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { getAdminHeaders } from "../../lib/admin-fetch";
import type { EmojiRow } from "../../lib/games/store";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, useConfirm, useToast } from "../admin-ui/ui";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

function Row({ row, onDone, confirm }: { row: EmojiRow; onDone: (msg: string) => void; confirm: ReturnType<typeof useConfirm>[0] }) {
  const [emojis, setEmojis] = useState(row.emojis);
  const [answer, setAnswer] = useState(row.answer);
  const [hint, setHint] = useState(row.hint ?? "");
  const [err, setErr] = useState<string | null>(null);
  async function call(method: "PATCH" | "DELETE") {
    setErr(null);
    if (method === "DELETE" && !(await confirm({ title: "Supprimer cette énigme ?", body: `${row.emojis} · ${row.answer} : elle sort du jeu, définitivement.`, confirmLabel: "Supprimer", danger: true }))) return;
    const r = await fetch("/api/admin/emoji", { method, headers: getAdminHeaders(), body: JSON.stringify(method === "DELETE" ? { id: row.id } : { id: row.id, emojis, answer, hint }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || `Erreur ${r.status}`); return; }
    onDone(method === "DELETE" ? "Énigme supprimée." : row.status === "pending" ? "Énigme validée : elle entre dans le jeu." : "Énigme enregistrée.");
  }
  return (
    <li className="am-row-item">
      <div className="am-row-main" style={{ display: "grid", gap: 8, width: "100%" }}>
        <span className="am-row-tags"><span className="am-tag">{row.status === "pending" ? "En attente" : "Validée"}</span><span className="am-tag">{row.player_name ?? (row.member_id ? `Membre n°${row.member_id}` : "Admin")} · {DATE.format(new Date(row.created_at))}</span></span>
        <label className="am-field"><span>Émojis</span><input className="am-input" style={{ fontSize: "1.5rem" }} value={emojis} onChange={(e) => setEmojis(e.target.value)} /></label>
        <label className="am-field"><span>Titre de l&apos;anime</span><input className="am-input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
        <label className="am-field"><span>Indice</span><input className="am-input" value={hint} onChange={(e) => setHint(e.target.value)} /></label>
        {err && <p className="am-alert am-alert--error" role="alert">{err}</p>}
      </div>
      <div className="am-row-actions">
        <button type="button" className="am-btn am-btn--gold" onClick={() => void call("PATCH")}><Check size={16} aria-hidden="true" /> {row.status === "pending" ? "Valider" : "Enregistrer"}</button>
        <button type="button" className="am-btn" onClick={() => void call("DELETE")}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
      </div>
    </li>
  );
}

export default function AdminEmojisPage() {
  const [rows, setRows] = useState<EmojiRow[] | null>(null);
  const [available, setAvailable] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [form, setForm] = useState({ emojis: "", answer: "", hint: "" });
  const [formErr, setFormErr] = useState<string | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/emoji", { cache: "no-store" });
    const d = await r.json().catch(() => ({ available: false, rows: [] }));
    setAvailable(r.ok && d.available); setRows(d.rows ?? []);
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    const r = await fetch("/api/admin/emoji", { method: "POST", headers: getAdminHeaders(), body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setFormErr(d.error || `Erreur ${r.status}`); return; }
    setForm({ emojis: "", answer: "", hint: "" }); notify("Énigme ajoutée au jeu."); void load();
  }

  const list = (rows ?? []).filter((r) => r.status === tab);
  const count = (s: EmojiRow["status"]) => (rows ?? []).filter((r) => r.status === s).length;
  return (
    <AdminShell section="emojis" title="Énigmes émojis" intro="Le Quiz des émojis tire ses énigmes parmi les 50 de base et celles validées ici. Les membres peuvent en proposer depuis la page Jeux : elles attendent ta validation avant d'entrer dans le jeu.">
      {!available && rows && <div className="am-alert am-alert--info" role="alert">La table des énigmes n&apos;existe pas encore : lance la migration scripts/migrations/2026-11-18_jeux_v3.sql dans Supabase (SQL Editor), puis recharge cette page.</div>}
      <form className="am-panel" onSubmit={add} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <h2>Ajouter une énigme</h2>
        <label className="am-field"><span>Émojis (2 à 8) <b>*</b></span><input className="am-input" style={{ fontSize: "1.5rem" }} value={form.emojis} onChange={(e) => setForm({ ...form, emojis: e.target.value })} required /></label>
        <label className="am-field"><span>Titre de l&apos;anime <b>*</b></span><input className="am-input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required /></label>
        <label className="am-field"><span>Indice</span><input className="am-input" value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} /></label>
        {formErr && <p className="am-alert am-alert--error" role="alert">{formErr}</p>}
        <div><button type="submit" className="am-btn am-btn--gold" disabled={!available}><Plus size={16} aria-hidden="true" /> Ajouter</button></div>
      </form>
      <div className="am-row" role="group" aria-label="Statut">
        <Chip active={tab === "pending"} onClick={() => setTab("pending")}>À valider ({count("pending")})</Chip>
        <Chip active={tab === "approved"} onClick={() => setTab("approved")}>Validées ({count("approved")})</Chip>
      </div>
      {!rows ? <p className="am-loading">Chargement…</p> : !list.length
        ? <p className="am-empty-state">{tab === "pending" ? "Aucune proposition en attente." : "Aucune énigme ajoutée pour l'instant (les 50 de base sont toujours dans le jeu)."}</p>
        : <ul className="am-rows">{list.map((r) => <Row key={`${r.id}-${r.status}`} row={r} confirm={confirm} onDone={(m) => { notify(m); void load(); }} />)}</ul>}
      {confirmNode}{toasts}
    </AdminShell>
  );
}
