"use client";

// Teams : l'admin crée les équipes de la Guilde (cinq de basket ou onze de foot),
// choisit la formation, place un membre à chaque poste avec son numéro et son
// capitaine, puis publie. Aperçu en direct, identique à la page /teams.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { getAdminHeaders } from "../../lib/admin-fetch";
import { defaultFormation, FORMATIONS, slotsOf, SPORT_LABEL, type GuildTeam, type Sport, type TeamSlot } from "../../lib/teams-logic";
import { objectPosition } from "../../lib/member-extras";
import { fetchMembers } from "../utils/dataAdapter";
import type { Member } from "../../data/members";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, useConfirm, useToast } from "../admin-ui/ui";
import TeamBoard, { type TeamMember } from "../teams/TeamBoard";
import "../teams/teams.css";

interface Draft { id?: number; name: string; sport: Sport; formation: string; color: string; motto: string; slots: Record<string, TeamSlot>; position: number; published: boolean }
const EMPTY = (sport: Sport = "basket"): Draft => ({ name: "", sport, formation: defaultFormation(sport), color: sport === "basket" ? "#f97316" : "#2563eb", motto: "", slots: {}, position: 0, published: false });

async function call<T>(method: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/admin/teams", { method, cache: "no-store", ...(body ? { headers: getAdminHeaders(), body: JSON.stringify(body) } : {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
  return d as T;
}
const toDraft = (t: GuildTeam): Draft => ({ id: t.id, name: t.name, sport: t.sport, formation: t.formation, color: t.color ?? EMPTY(t.sport).color, motto: t.motto ?? "", slots: Object.fromEntries(t.slots.map((s) => [s.slot, s])), position: t.position, published: t.published });
const toBody = (d: Draft) => ({ ...(d.id ? { id: d.id } : {}), name: d.name, sport: d.sport, formation: d.formation, color: d.color, motto: d.motto, position: d.position, published: d.published, slots: Object.values(d.slots).filter((s) => s.memberId > 0) });
const toTeamMember = (m: Member): TeamMember => ({
  id: m.id, name: m.name, rank: m.rank, image: m.animeChar || m.photo,
  pos: objectPosition(m.animeChar ? m.extras?.animeFocus : m.extras?.photoFocus, "50% 18%"),
  stats: m.stats ?? null, special: m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special.name : null, bankai: null,
});

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<GuildTeam[] | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, confirmNode] = useConfirm();
  const [notify, toasts] = useToast();

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const d = await call<{ available: boolean; teams: GuildTeam[]; error?: string }>("GET");
      setTeams(d.teams); setMissing(d.available ? null : d.error ?? "Table absente.");
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === "Unauthorized") return false; // connexion en cours
      setTeams([]); setMissing(e instanceof Error ? e.message : "Erreur");
      return true;
    }
  }, []);
  useEffect(() => {
    let stop = false, t = 0;
    const run = async () => { if (!stop && !(await load())) t = window.setTimeout(run, 1500); };
    void run();
    void fetchMembers().then((list) => { if (!stop) setMembers([...list].sort((a, b) => a.name.localeCompare(b.name, "fr"))); });
    return () => { stop = true; window.clearTimeout(t); };
  }, [load]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, toTeamMember(m)])), [members]);
  const nameOf = (id: number) => members.find((m) => m.id === id)?.name ?? `Membre ${id}`;
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setSlot = (slot: string, patch: Partial<TeamSlot>) => setDraft((d) => {
    if (!d) return d;
    const cur = d.slots[slot] ?? { slot, memberId: 0 };
    const next = { ...cur, ...patch };
    const slots = { ...d.slots, [slot]: next };
    // Un seul capitaine.
    if (patch.captain) for (const k of Object.keys(slots)) if (k !== slot && slots[k].captain) slots[k] = { ...slots[k], captain: false };
    return { ...d, slots };
  });
  const usedElsewhere = (slot: string) => new Set(Object.values(draft?.slots ?? {}).filter((s) => s.slot !== slot && s.memberId > 0).map((s) => s.memberId));

  async function save() {
    if (!draft) return;
    setBusy(true); setErr(null);
    try {
      await call(draft.id ? "PATCH" : "POST", toBody(draft));
      notify(draft.published ? "Équipe enregistrée : elle est en ligne sur /teams." : "Équipe enregistrée (non publiée).");
      setDraft(null); void load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }
  async function remove(t: GuildTeam) {
    if (!(await confirm({ title: "Supprimer cette équipe ?", body: `${t.name} sera effacée définitivement.`, danger: true, confirmLabel: "Supprimer" }))) return;
    try { await call("DELETE", { id: t.id }); notify("Équipe supprimée."); void load(); } catch (e) { notify(e instanceof Error ? e.message : "Erreur", "error"); }
  }
  async function togglePublish(t: GuildTeam) {
    try { await call("PATCH", toBody({ ...toDraft(t), published: !t.published })); notify(t.published ? "Équipe retirée du site." : "Équipe publiée."); void load(); }
    catch (e) { notify(e instanceof Error ? e.message : "Erreur", "error"); }
  }

  const preview: GuildTeam | null = draft ? { id: draft.id ?? 0, slug: "apercu", name: draft.name || "Nom de l'équipe", sport: draft.sport, formation: draft.formation, color: draft.color, motto: draft.motto || null, slots: Object.values(draft.slots).filter((s) => s.memberId > 0), position: 0, published: draft.published } : null;

  return (
    <AdminShell section="teams" title="Teams" intro="Les équipes de la Guilde : un cinq de basket ou un onze de foot. Place un membre à chaque poste, donne-lui un numéro, choisis le capitaine, puis publie : l'équipe apparaît sur la page Teams."
      actions={!draft ? <button type="button" className="am-btn am-btn--gold" disabled={!!missing} onClick={() => { setErr(null); setDraft(EMPTY()); }}><Plus size={16} aria-hidden="true" /> Nouvelle équipe</button> : undefined}>
      {missing && <div className="am-alert am-alert--info" role="alert">{missing}</div>}

      {draft && (
        <section className="am-panel" style={{ display: "grid", gap: 14, marginBottom: 18 }}>
          <h2>{draft.id ? "Modifier l'équipe" : "Nouvelle équipe"}</h2>
          <label className="am-field"><span>Nom de l&apos;équipe <b>*</b></span><input className="am-input" value={draft.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. : Les Monarques" /></label>
          <div className="am-field">
            <span>Sport</span>
            <div className="am-row" role="group" aria-label="Sport">
              {(["basket", "foot"] as Sport[]).map((sp) => <Chip key={sp} active={draft.sport === sp} onClick={() => set({ sport: sp, formation: defaultFormation(sp), slots: {}, color: draft.color === EMPTY(draft.sport).color ? EMPTY(sp).color : draft.color })}>{SPORT_LABEL[sp]}</Chip>)}
            </div>
          </div>
          {draft.sport === "foot" && (
            <div className="am-field">
              <span>Formation</span>
              <div className="am-row" role="group" aria-label="Formation">
                {Object.keys(FORMATIONS.foot).map((f) => <Chip key={f} active={draft.formation === f} onClick={() => set({ formation: f })}>{f}</Chip>)}
              </div>
              <small>Changer de formation garde les joueurs dont le poste existe encore.</small>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <label className="am-field"><span>Couleur</span><input type="color" className="am-color" value={draft.color} onChange={(e) => set({ color: e.target.value })} /></label>
            <label className="am-field"><span>Ordre d&apos;affichage</span><input className="am-input" type="number" min={0} max={999} value={draft.position} onChange={(e) => set({ position: Number(e.target.value) || 0 })} style={{ width: 110 }} /></label>
          </div>
          <label className="am-field"><span>Devise (facultatif)</span><input className="am-input" value={draft.motto} maxLength={140} onChange={(e) => set({ motto: e.target.value })} placeholder="Ex. : Jusqu'au dernier buzzer." /></label>

          <fieldset className="am-fieldset" style={{ display: "grid", gap: 8 }}>
            <legend>Postes ({Object.values(draft.slots).filter((s) => s.memberId > 0).length}/{slotsOf(draft.sport, draft.formation).length})</legend>
            {slotsOf(draft.sport, draft.formation).map((def) => {
              const cur = draft.slots[def.id];
              const taken = usedElsewhere(def.id);
              return (
                <div key={def.id} className="tm-admin-slot">
                  <b>{def.label} <small style={{ opacity: .6 }}>({def.id})</small></b>
                  <select className="am-input" aria-label={`Joueur au poste ${def.label}`} value={cur?.memberId ?? 0} onChange={(e) => setSlot(def.id, { memberId: Number(e.target.value) })}>
                    <option value={0}>Poste vide</option>
                    {members.map((m) => <option key={m.id} value={m.id} disabled={taken.has(m.id)}>{m.name}{taken.has(m.id) ? " (déjà placé)" : ""}</option>)}
                  </select>
                  <input className="am-input" type="number" min={0} max={99} aria-label={`Numéro au poste ${def.label}`} placeholder="N°" value={cur?.number ?? ""} onChange={(e) => setSlot(def.id, { number: e.target.value === "" ? undefined : Math.max(0, Math.min(99, Number(e.target.value))) })} />
                  <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: ".85rem" }}><input type="radio" name="captain" checked={!!cur?.captain} disabled={!cur?.memberId} onChange={() => setSlot(def.id, { captain: true })} /> Cap.</label>
                </div>
              );
            })}
          </fieldset>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={draft.published} onChange={(e) => set({ published: e.target.checked })} /> Publier sur la page Teams</label>
          {err && <p className="am-alert am-alert--error" role="alert">{err}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="am-btn am-btn--gold" disabled={busy || !draft.name.trim()} onClick={() => void save()}><Save size={16} aria-hidden="true" /> {busy ? "Enregistrement…" : "Enregistrer"}</button>
            <button type="button" className="am-btn" onClick={() => setDraft(null)}><X size={16} aria-hidden="true" /> Annuler</button>
          </div>

          {preview && (
            <div className="tm-page" style={{ padding: 14, marginTop: 6 }}>
              <p className="am-kicker" style={{ color: "#fff" }}>Aperçu</p>
              <TeamBoard team={preview} members={byId} preview />
            </div>
          )}
        </section>
      )}

      <h2 style={{ margin: "8px 0 10px" }}>Équipes</h2>
      {!teams ? <p className="am-loading">Chargement…</p> : teams.length === 0 ? <p className="am-empty-state">Aucune équipe pour l&apos;instant.</p> : (
        <ul className="am-rows">
          {teams.map((t) => (
            <li key={t.id} className="am-row-item">
              <div className="am-row-main" style={{ display: "grid", gap: 6 }}>
                <span className="am-row-tags">
                  <span className="am-tag" style={{ background: t.color ?? undefined, color: "#fff" }}>{SPORT_LABEL[t.sport]}{t.sport === "foot" ? ` · ${t.formation}` : ""}</span>
                  <span className="am-tag">{t.published ? "En ligne" : "Brouillon"}</span>
                  <span className="am-tag">{t.slots.length}/{slotsOf(t.sport, t.formation).length} joueurs</span>
                </span>
                <b>{t.name}</b>
                <small>{t.slots.map((s) => `${nameOf(s.memberId)}${s.captain ? " (C)" : ""}`).join(", ") || "Aucun joueur"}</small>
              </div>
              <div className="am-row-actions">
                <button type="button" className="am-btn" onClick={() => { setErr(null); setDraft(toDraft(t)); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={16} aria-hidden="true" /> Modifier</button>
                <button type="button" className="am-btn" onClick={() => void togglePublish(t)}>{t.published ? <><EyeOff size={16} aria-hidden="true" /> Retirer</> : <><Eye size={16} aria-hidden="true" /> Publier</>}</button>
                <button type="button" className="am-btn" onClick={() => void remove(t)}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirmNode}{toasts}
    </AdminShell>
  );
}
