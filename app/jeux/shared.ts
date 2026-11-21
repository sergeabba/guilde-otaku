"use client";

// Outils communs de la page Jeux : joueur sans compte, historique local, métadonnées des jeux.
import { useCallback, useEffect, useState } from "react";
import { LEVEL_LABEL, LEVEL_MULT, parseLevel, type Level } from "../../lib/games/levels";
import { celebrate, playOk } from "../../lib/fx";

export type Game = "quiz-generique" | "quiz-nostalgie" | "affiche" | "plus-moins" | "defi-jour" | "devine-anime" | "devine-perso" | "emoji-quiz" | "themes" | "createur" | "studio" | "voix" | "generiques" | "duel";
export interface Play { id?: number; game: Game; member_id: number | null; player_name: string | null; score: number; max_score: number; detail: Record<string, unknown>; created_at: string }
export interface LocalPlay { game: Game; score: number; max: number; at: string; label: string }

/** Nom affiché et unité du score de chaque jeu (classement, historique). */
export const GAME_INFO: Record<Game, { label: string; unit: (p: { score: number; max: number }) => string }> = {
  "defi-jour": { label: "Défi du jour", unit: (p) => `${p.score} pts` },
  "devine-anime": { label: "Devine l'anime", unit: (p) => `${p.score} pts` },
  "devine-perso": { label: "Devine le perso", unit: (p) => `${p.score} pts` },
  "emoji-quiz": { label: "Émojis", unit: (p) => `${p.score} / ${p.max}` },
  themes: { label: "Thèmes", unit: (p) => `${p.score} / ${p.max}` },
  createur: { label: "Créateurs", unit: (p) => `${p.score} / ${p.max}` },
  studio: { label: "Studios", unit: (p) => `${p.score} / ${p.max}` },
  voix: { label: "Voix", unit: (p) => `${p.score} / ${p.max}` },
  generiques: { label: "Génériques vidéo", unit: (p) => `${p.score} / ${p.max}` },
  "quiz-generique": { label: "Quiz génériques", unit: (p) => `${p.score} / ${p.max}` },
  "quiz-nostalgie": { label: "Nostalgie", unit: (p) => `${p.score} / ${p.max}` },
  affiche: { label: "Affiche", unit: (p) => `${p.score} / ${p.max}` },
  "plus-moins": { label: "Plus ou moins", unit: (p) => `${p.score} pts` },
  duel: { label: "Duels", unit: (p) => `${p.score} %` },
};

export const ROUND_MS = 20_000;
const KEY_DEVICE = "guilde-bash-voter", KEY_ME = "guilde-bash-me", KEY_NAME = "guilde-player-name", KEY_LOCAL = "guilde-games-history";
export const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const write = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* navigation privée */ } };
function deviceId(): string {
  let id = read(KEY_DEVICE);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = crypto.randomUUID(); write(KEY_DEVICE, id); }
  return id;
}
export const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Qui joue : membre choisi, sinon pseudo, sinon anonyme. */
export function usePlayer() {
  const [me, setMe] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [device, setDevice] = useState("");
  useEffect(() => {
    void Promise.resolve().then(() => {
      setDevice(deviceId());
      const m = Number(read(KEY_ME));
      setMe(Number.isInteger(m) && m > 0 ? m : null);
      setName(read(KEY_NAME) ?? "");
    });
  }, []);
  const chooseMember = (id: number | null) => { setMe(id); write(KEY_ME, id ? String(id) : null); };
  const chooseName = (n: string) => { setName(n); write(KEY_NAME, n.trim() ? n.trim().slice(0, 40) : null); };
  const payload = useCallback(() => ({ device: device || deviceId(), memberId: me ?? undefined, name: !me && name.trim() ? name.trim() : undefined }), [device, me, name]);
  return { me, name, device, chooseMember, chooseName, payload };
}
export type PlayerApi = ReturnType<typeof usePlayer>;

export function localHistory(): LocalPlay[] { try { return JSON.parse(read(KEY_LOCAL) ?? "[]"); } catch { return []; } }
export function pushLocal(p: LocalPlay) {
  write(KEY_LOCAL, JSON.stringify([p, ...localHistory()].slice(0, 40)));
  // Fin de partie : tampon « Victoire » et pétales à partir de 60 % des points, sinon un simple son.
  const ratio = p.max > 0 ? p.score / p.max : 0;
  if (ratio >= 0.6) celebrate({ title: ratio >= 0.9 ? "Parfait" : "Victoire", sub: `${p.score} points`, big: ratio >= 0.9 });
  else if (p.score > 0) playOk();
}

/** Requête JSON des jeux : renvoie les données ou lève le message d'erreur du serveur. */
export async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "Service indisponible, réessaie plus tard.");
  return d as T;
}

/* ── Niveau de difficulté choisi (gardé sur l'appareil) ─────────────── */
export { LEVEL_LABEL, LEVEL_MULT, type Level };
const KEY_LEVEL = "guilde-level";
export function useLevel(): [Level, (l: Level) => void] {
  const [level, setLevel] = useState<Level>("normal");
  useEffect(() => { void Promise.resolve().then(() => setLevel(parseLevel(read(KEY_LEVEL)))); }, []);
  return [level, (l: Level) => { setLevel(l); write(KEY_LEVEL, l); }];
}
/** Multiplicateur affiché : « ×1,5 ». */
export const multLabel = (l: Level) => `×${String(LEVEL_MULT[l]).replace(".", ",")}`;
