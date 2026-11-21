// Blind test vidéo : les génériques officiels de la page Cinéma, image floutée au départ
// puis de plus en plus nette. Quel anime ? Le corrigé voyage dans un jeton signé.
import { randomUUID } from "node:crypto";
import { GENERIQUES, type Generique } from "../generiques";
import { LEVEL_MULT, type Level } from "./levels";
import { seal, shuffle, unseal } from "./token";
import { CLIP_BLUR, CLIP_MS, CLIP_ROUNDS, type ClipRound } from "./clips-config";

export { CLIP_BLUR, CLIP_MS, CLIP_ROUNDS, blurAt, type ClipRound } from "./clips-config";
export interface ClipKey { game: "generiques"; nonce: string; exp: number; level: Level; answers: number[]; reveal: { series: string; year: number | null; kind: "OP" | "ED"; label: string | null; key: string }[] }
export interface ClipAnswer { choice: number | null; ms: number }

/** 100 points si juste, + jusqu'à 100 selon la rapidité (l'image est encore floue), × niveau. */
export function clipPoints(ok: boolean, ms: number, level: Level): number {
  if (!ok) return 0;
  const t = Math.min(Math.max(ms, 0), CLIP_MS);
  return Math.round((100 + 100 * (1 - t / CLIP_MS)) * LEVEL_MULT[level]);
}

/**
 * 8 manches, 8 séries différentes. Les mauvaises réponses sont d'autres séries :
 * jamais la bonne réponse d'une autre manche, et sans répétition tant que possible.
 */
export function buildClips(level: Level, now = Date.now(), rnd = Math.random, list: Generique[] = GENERIQUES) {
  const bySeries = new Map<number, Generique[]>();
  for (const g of list) bySeries.set(g.tmdb, [...(bySeries.get(g.tmdb) ?? []), g]);
  const series = shuffle([...bySeries.keys()], rnd).slice(0, CLIP_ROUNDS);
  const picked = series.map((id) => shuffle(bySeries.get(id)!, rnd)[0]);
  const names = [...new Set(list.map((g) => g.series))];
  const answersSet = new Set(picked.map((g) => g.series));
  const used = new Set<string>();
  const n = CLIP_BLUR[level].choices;
  const rounds: ClipRound[] = [], answers: number[] = [];
  for (const g of picked) {
    const free = names.filter((x) => !answersSet.has(x));
    const fresh = shuffle(free.filter((x) => !used.has(x)), rnd);
    const decoys = [...fresh, ...shuffle(free.filter((x) => !fresh.includes(x)), rnd)].slice(0, n - 1);
    decoys.forEach((d) => used.add(d));
    const choices = shuffle([g.series, ...decoys], rnd);
    // Départ entre la 6e et la 30e seconde : on entre dans le générique, sans le carton-titre du début.
    rounds.push({ key: g.key, start: 6 + Math.floor(rnd() * 25), choices });
    answers.push(choices.indexOf(g.series));
  }
  const key: ClipKey = { game: "generiques", nonce: randomUUID(), exp: now + 45 * 60_000, level, answers, reveal: picked.map((g) => ({ series: g.series, year: g.year, kind: g.kind, label: g.label, key: g.key })) };
  return { token: seal(key), rounds };
}

export const openClips = (t: unknown) => unseal<ClipKey>(t, "generiques");

export function scoreClips(key: ClipKey, answers: ClipAnswer[]) {
  const correction = key.reveal.map((rv, r) => {
    const a = answers[r];
    const ok = !!a && Number.isInteger(a.choice) && a.choice === key.answers[r];
    const ms = Number.isFinite(a?.ms) ? a!.ms : CLIP_MS;
    return { ...rv, ok, points: clipPoints(ok, ms, key.level) };
  });
  return { score: correction.reduce((s, c) => s + c.points, 0), max: Math.round(key.reveal.length * 200 * LEVEL_MULT[key.level]), good: correction.filter((c) => c.ok).length, correction };
}
