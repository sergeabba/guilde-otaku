// Blind test vidéo : réglages partagés entre le serveur et le navigateur.
import type { Level } from "./levels";

export const CLIP_ROUNDS = 8;
/** Durée d'une manche (ms). */
export const CLIP_MS = 30_000;
/** Flou de départ (px), temps pour devenir net, noir et blanc, nombre de propositions. */
export const CLIP_BLUR: Record<Level, { from: number; clearMs: number; gray: boolean; choices: number }> = {
  facile: { from: 14, clearMs: 14_000, gray: false, choices: 4 },
  normal: { from: 24, clearMs: 20_000, gray: false, choices: 4 },
  expert: { from: 34, clearMs: 26_000, gray: true, choices: 6 },
};
export interface ClipRound { key: string; start: number; choices: string[] }

/** Flou (px) au bout de `ms` millisecondes de lecture. */
export const blurAt = (level: Level, ms: number) => Math.max(0, CLIP_BLUR[level].from * (1 - Math.max(0, ms) / CLIP_BLUR[level].clearMs));
