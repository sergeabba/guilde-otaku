"use client";

// Sondage du Bash : « Je regarde » / « Je passe » sous une chronique. Un vote par
// appareil (identifiant aléatoire gardé dans le navigateur), modifiable ; le membre
// peut dire qui il est pour que son visage apparaisse. Masqué tant que la table
// des votes n'existe pas.
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "./GImage";
import { Eye, EyeOff } from "lucide-react";
import { fetchMembers } from "../utils/dataAdapter";
import type { Member } from "../../data/members";

type Poll = { watch: number; skip: number; watchers: number[]; skippers: number[] };
type State = { available: boolean; polls: Record<string, Poll> };

// Une seule lecture pour toute la page, partagée entre les sondages.
let state: State | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load() {
  loading ??= fetch("/api/bash-votes").then((r) => r.json()).then((d: State) => { state = { available: !!d.available, polls: d.polls ?? {} }; emit(); }).catch(() => { state = { available: false, polls: {} }; emit(); });
  return loading;
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

const KEY_VOTER = "guilde-bash-voter", KEY_ME = "guilde-bash-me", KEY_VOTES = "guilde-bash-votes";
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* navigation privée */ } };
function voterId(): string {
  let id = read(KEY_VOTER);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = crypto.randomUUID(); write(KEY_VOTER, id); }
  return id;
}

export default function BashPoll({ slug, title }: { slug: string; title: string }) {
  const s = useSyncExternalStore(subscribe, () => state, () => null);
  const [members, setMembers] = useState<Member[]>([]);
  const [mine, setMine] = useState<"watch" | "skip" | null>(null);
  const [me, setMe] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    void Promise.resolve().then(() => {
      const votes = JSON.parse(read(KEY_VOTES) ?? "{}") as Record<string, "watch" | "skip">;
      setMine(votes[slug] ?? null);
      const m = Number(read(KEY_ME));
      setMe(Number.isInteger(m) && m > 0 ? m : null);
    });
    fetchMembers().then(setMembers).catch(() => {});
  }, [slug]);

  if (!s?.available) return null;
  const p = s.polls[slug] ?? { watch: 0, skip: 0, watchers: [], skippers: [] };
  const total = p.watch + p.skip;
  const pct = total ? Math.round((p.watch / total) * 100) : 0;
  const byId = new Map(members.map((m) => [m.id, m]));
  const faces = p.watchers.map((id) => byId.get(id)).filter(Boolean) as Member[];

  async function vote(choice: "watch" | "skip" | null, memberId = me) {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/bash-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chronique: slug, voter: voterId(), choice, memberId }) });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error || "Vote non enregistré.");
      state = { available: true, polls: d.polls ?? {} }; emit();
      const votes = JSON.parse(read(KEY_VOTES) ?? "{}") as Record<string, string>;
      if (choice) votes[slug] = choice; else delete votes[slug];
      write(KEY_VOTES, JSON.stringify(votes));
      setMine(choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote non enregistré.");
    } finally { setBusy(false); }
  }

  return (
    <section className="bb-block bash-poll" aria-labelledby={`poll-${slug}`}>
      <h3 id={`poll-${slug}`}>Sondage du Bash</h3>
      <p className="bash-q">Tu regardes <strong>{title}</strong> ?</p>
      <div className="bash-choices" role="group" aria-label="Ton vote">
        <button type="button" className="bash-btn is-watch" aria-pressed={mine === "watch"} disabled={busy} onClick={() => vote(mine === "watch" ? null : "watch")}>
          <Eye size={18} aria-hidden="true" /> Je regarde <b>{p.watch}</b>
        </button>
        <button type="button" className="bash-btn is-skip" aria-pressed={mine === "skip"} disabled={busy} onClick={() => vote(mine === "skip" ? null : "skip")}>
          <EyeOff size={18} aria-hidden="true" /> Je passe <b>{p.skip}</b>
        </button>
      </div>
      <div className="bash-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      <p className="bash-sum">{total ? `${pct} % de la Guilde regarde (${total} vote${total > 1 ? "s" : ""})` : "Sois le premier à voter."}{mine ? " · Touche à nouveau ton choix pour retirer ton vote." : ""}</p>
      {faces.length > 0 && (
        <div className="bash-faces" aria-label="Membres qui regardent">
          {faces.slice(0, 12).map((m) => (
            // Vignette redimensionnée (les portraits d'origine font jusqu'à 1920 × 2560).
            <Image key={m.id} src={m.animeChar || m.photo} alt={m.name} title={m.name} width={36} height={36} sizes="36px" />
          ))}
          {faces.length > 12 && <span>+{faces.length - 12}</span>}
        </div>
      )}
      {members.length > 0 && (
        <label className="bash-me">
          <span>Je suis</span>
          <select value={me ?? ""} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setMe(v); write(KEY_ME, v ? String(v) : null); if (mine) void vote(mine, v); }}>
            <option value="">Anonyme</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      )}
      {error && <p className="bash-err" role="alert">{error}</p>}
    </section>
  );
}
