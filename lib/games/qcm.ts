// Jeux experts à questions (AniList) : Devine par les thèmes, Qui l'a créé ?, Le studio,
// La voix. Fonctions pures de tirage et de correction ; le corrigé voyage dans un jeton signé.
import { randomUUID } from "node:crypto";
import type { CatAnime, CatChar } from "./catalog";
import { sameTitle } from "./fuzzy";
import { LEVEL_MULT, type Level } from "./levels";
import { seal, shuffle, unseal } from "./token";

export const QCM_KINDS = ["themes", "createur", "studio", "voix"] as const;
export type QcmKind = (typeof QCM_KINDS)[number];
export const isQcmKind = (k: unknown): k is QcmKind => QCM_KINDS.includes(k as QcmKind);

export interface QcmChoice { label: string; sub?: string | null; image?: string | null }
export interface QcmRound { prompt: string; sub?: string | null; image?: string | null; tags?: string[]; choices: QcmChoice[] }
export interface QcmKey { game: "qcm"; kind: QcmKind; nonce: string; exp: number; level: Level; answers: number[]; accepted: string[][]; reveal: { label: string; sub?: string | null; image?: string | null }[] }
export interface QcmAnswer { choice: number | null; text?: string; ms: number }

/** Plages de popularité selon le niveau. */
export const ANIME_RANGE: Record<Level, [number, number]> = { facile: [1, 100], normal: [1, 300], expert: [301, 800] };
export const CHAR_RANGE: Record<Level, [number, number]> = { facile: [1, 100], normal: [1, 300], expert: [301, 600] };
export const QCM_MS: Record<Level, number> = { facile: 30_000, normal: 20_000, expert: 20_000 };
/** Thèmes : un de plus toutes les 4 secondes, 5 au plus. */
export const THEME_STEP_MS = 4_000;
/** « Titre ? » sans doubler la ponctuation quand le titre finit déjà par ? ou ! */
const ask = (t: string) => (/[?!]$/.test(t.trim()) ? t.trim() : `${t} ?`);
const nChoices = (level: Level) => (level === "expert" ? 6 : level === "normal" ? 6 : 4);

const pickOthers = <T,>(pool: T[], n: number, key: (x: T) => string, exclude: Set<string>, rnd: () => number) => {
  const out: T[] = [], seen = new Set(exclude);
  for (const x of shuffle(pool, rnd)) { const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } if (out.length >= n) break; }
  return out;
};

function seal_(kind: QcmKind, level: Level, now: number, rounds: QcmRound[], answers: number[], accepted: string[][], reveal: QcmKey["reveal"]) {
  const key: QcmKey = { game: "qcm", kind, nonce: randomUUID(), exp: now + 45 * 60_000, level, answers, accepted, reveal };
  return { token: seal(key), rounds };
}

/** Devine l'anime par ses thèmes : 6 animes, 5 thèmes sans spoiler dévoilés un à un. */
export function buildThemes(animes: CatAnime[], level: Level, now = Date.now(), rnd = Math.random) {
  const pool = animes.filter((a) => a.tags.length >= 5);
  const picked = shuffle(pool, rnd).slice(0, 6);
  const typed = level === "expert";
  const rounds: QcmRound[] = [], answers: number[] = [], accepted: string[][] = [], reveal: QcmKey["reveal"] = [];
  for (const a of picked) {
    const tags = a.tags.slice(0, 5);
    // Pièges : des animes qui partagent au moins un thème.
    const near = pool.filter((x) => x.id !== a.id && x.tags.some((t) => tags.includes(t)));
    const others = pickOthers(near.length >= 5 ? near : pool, nChoices(level) - 1, (x) => x.title, new Set([a.title]), rnd);
    const choices = typed ? [] : shuffle([a, ...others], rnd).map((x) => ({ label: x.title }));
    // Facile et Normal : l'année et le format en plus des thèmes (Expert : thèmes seuls).
    rounds.push({ prompt: "Quel anime ?", sub: typed ? null : [a.year, a.format].filter(Boolean).join(" · ") || null, tags, choices });
    answers.push(typed ? -1 : choices.findIndex((c) => c.label === a.title));
    accepted.push([a.title, a.alt].filter((x): x is string => !!x));
    reveal.push({ label: a.title, sub: a.year ? String(a.year) : null, image: a.cover });
  }
  return { ...seal_("themes", level, now, rounds, answers, accepted, reveal), titles: typed ? [...new Set(pool.map((a) => a.title))].sort((x, y) => x.localeCompare(y, "fr")) : null };
}

/** Qui l'a créé ? Le créateur de l'œuvre d'origine ; en Expert, aussi le réalisateur. */
export function buildCreateur(animes: CatAnime[], level: Level, now = Date.now(), rnd = Math.random) {
  const withCreator = animes.filter((a) => a.creator);
  const withDirector = animes.filter((a) => a.director);
  const rounds: QcmRound[] = [], answers: number[] = [], reveal: QcmKey["reveal"] = [];
  const used = new Set<number>();
  for (let i = 0; i < 8; i++) {
    const director = level === "expert" && i % 2 === 1;
    const pool = director ? withDirector : withCreator;
    const a = shuffle(pool.filter((x) => !used.has(x.id)), rnd)[0];
    if (!a) break;
    used.add(a.id);
    const who = (director ? a.director : a.creator)!;
    const others = pickOthers(pool, nChoices(level) - 1, (x) => (director ? x.director : x.creator)!, new Set([who]), rnd).map((x) => (director ? x.director : x.creator)!);
    const choices = shuffle([who, ...others], rnd).map((label) => ({ label }));
    rounds.push({ prompt: director ? `Qui a réalisé ${ask(a.title)}` : `Qui a créé ${ask(a.title)}`, sub: director ? "Réalisateur de l'anime" : `Œuvre d'origine${a.source ? ` : ${a.source.toLowerCase()}` : ""}`, image: a.cover, choices });
    answers.push(choices.findIndex((c) => c.label === who));
    reveal.push({ label: who, sub: a.title, image: a.cover });
  }
  return seal_("createur", level, now, rounds, answers, [], reveal);
}

/** Le studio : quel studio d'animation a produit cet anime ? */
export function buildStudio(animes: CatAnime[], level: Level, now = Date.now(), rnd = Math.random) {
  const pool = animes.filter((a) => a.studio);
  const studios = [...new Set(pool.map((a) => a.studio!))];
  const rounds: QcmRound[] = [], answers: number[] = [], reveal: QcmKey["reveal"] = [];
  for (const a of shuffle(pool, rnd).slice(0, 8)) {
    const others = shuffle(studios.filter((s) => s !== a.studio), rnd).slice(0, nChoices(level) - 1);
    const choices = shuffle([a.studio!, ...others], rnd).map((label) => ({ label }));
    rounds.push({ prompt: `Quel studio a produit ${ask(a.title)}`, sub: a.year ? String(a.year) : null, image: a.cover, choices });
    answers.push(choices.findIndex((c) => c.label === a.studio));
    reveal.push({ label: a.studio!, sub: a.title, image: a.cover });
  }
  return seal_("studio", level, now, rounds, answers, [], reveal);
}

/** La voix : quel personnage ce doubleur japonais interprète-t-il ? */
export function buildVoix(chars: CatChar[], level: Level, now = Date.now(), rnd = Math.random) {
  const pool = chars.filter((c) => c.voice);
  const rounds: QcmRound[] = [], answers: number[] = [], reveal: QcmKey["reveal"] = [];
  const usedVoices = new Set<string>();
  for (const c of shuffle(pool, rnd)) {
    if (rounds.length >= 8) break;
    if (usedVoices.has(c.voice!)) continue;
    usedVoices.add(c.voice!);
    // Les autres propositions ne doivent pas être doublées par la même personne.
    const others = pickOthers(pool.filter((x) => x.voice !== c.voice), nChoices(level) - 1, (x) => x.name, new Set([c.name]), rnd);
    const choices = shuffle([c, ...others], rnd).map((x) => ({ label: x.name, sub: x.anime, image: x.image }));
    rounds.push({ prompt: `Quel personnage est doublé par ${c.voice} ?`, sub: "Doublage japonais", choices });
    answers.push(choices.findIndex((x) => x.label === c.name));
    reveal.push({ label: c.name, sub: `${c.anime} · ${c.voice}`, image: c.image });
  }
  return seal_("voix", level, now, rounds, answers, [], reveal);
}

export const openQcm = (t: unknown) => unseal<QcmKey>(t, "qcm");

/** Thèmes visibles après `ms` millisecondes. */
export const themesAt = (ms: number) => Math.min(5, 1 + Math.floor(Math.max(0, ms) / THEME_STEP_MS));

/** Points d'une question : thèmes 100 → 40 selon les thèmes dévoilés ; autres jeux 100 + bonus de rapidité. */
export function qcmPoints(kind: QcmKind, ok: boolean, ms: number, level: Level): number {
  if (!ok) return 0;
  const base = kind === "themes" ? 100 - 15 * (themesAt(ms) - 1) : 100 + Math.round(50 * (1 - Math.min(Math.max(ms, 0), QCM_MS[level]) / QCM_MS[level]));
  return Math.round(base * LEVEL_MULT[level]);
}

export function scoreQcm(key: QcmKey, answers: QcmAnswer[]) {
  const n = key.answers.length;
  const correction = key.reveal.map((rv, r) => {
    const a = answers[r];
    const ok = key.answers[r] < 0 ? !!a?.text && sameTitle(a.text, key.accepted[r] ?? []) : Number.isInteger(a?.choice) && a!.choice === key.answers[r];
    const ms = Number.isFinite(a?.ms) ? a!.ms : QCM_MS[key.level];
    return { ...rv, ok, points: qcmPoints(key.kind, ok, ms, key.level) };
  });
  const per = key.kind === "themes" ? 100 : 150;
  return { score: correction.reduce((s, c) => s + c.points, 0), max: Math.round(n * per * LEVEL_MULT[key.level]), good: correction.filter((c) => c.ok).length, correction };
}
