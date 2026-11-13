// Définition d'un personnage en sprites : palette, proportions, dessin des pièces
// (vêtements, tête en pixels) et animations. Chaque personnage a son propre fichier.
import { Mask, add, dir, paint, type Body, type Canvas, type HandShape, type Joints, type Pose, type Vec } from "./sprite-kit.ts";

export const CELL_W = 128;
export const CELL_H = 112;
/** Point d'ancrage (pieds, centre du corps) dans chaque cellule. */
export const ANCHOR: Vec = [52, 106];

export type Phase = "s" | "a" | "r";
export interface Anim {
  poses: Pose[];
  /** Durée de chaque image (en images de jeu) pour les animations libres. */
  dur?: number[];
  loop?: boolean;
  /** Pour les coups : phase de chaque image (démarrage, actif, récupération). */
  phases?: Phase[];
}

export type Colors = Record<string, number>;

export interface SpriteChar {
  key: string;
  name: string;
  /** Sources visuelles (description, pas de copie). */
  reference: string;
  palette: Record<string, string>;
  body: Body;
  draw(cv: Canvas, j: Joints, pose: Pose, C: Colors): void;
  anims: Record<string, Anim>;
}

/** Animations exigées pour qu'un personnage soit complet (contrôle automatique). */
export const REQUIRED_ANIMS = [
  "idle", "walk", "walkback", "crouch", "guard", "cguard", "jump", "jumpfwd",
  "s_lp", "s_hp", "s_lk", "s_hk", "c_lp", "c_hp", "c_lk", "c_hk", "j_lp", "j_hp", "j_lk", "j_hk",
  "throw", "special", "super", "hit", "chit", "block", "cblock", "fall", "down", "getup", "dizzy", "dodge", "ko", "win", "intro",
];

/** Main : poing, main ouverte, index pointé, saisie, tranchant. */
export function hand(cv: Canvas, w: number, h: number, elbow: Vec, at: Vec, shape: HandShape | undefined, skin: { base: number; shadow?: number; light?: number }, ink: number) {
  if (shape === "pocket") return;
  const d: Vec = [at[0] - elbow[0], at[1] - elbow[1]];
  const l = Math.hypot(d[0], d[1]) || 1, u: Vec = [d[0] / l, d[1] / l];
  const m = new Mask(w, h);
  switch (shape) {
    case "open": case "chop": m.limb(at, add(at, u, 3), 3.6, 2.6); break;
    case "point": m.disc(at, 2.1); m.limb(add(at, u, 1), add(at, u, 4.5), 1.3, 1.3); break;
    case "grab": m.disc(add(at, u, 1), 2.6); break;
    default: m.disc(add(at, u, 0.5), 2.4);
  }
  paint(cv, m, skin, ink);
}

/** Chaussure : semelle à plat au sol si le pied est bas, sinon suit la jambe. */
export function shoe(cv: Canvas, w: number, h: number, knee: Vec, foot: Vec, len: number, color: { base: number; light?: number }, ink: number, flat: boolean) {
  const m = new Mask(w, h);
  const d: Vec = [foot[0] - knee[0], foot[1] - knee[1]];
  const l = Math.hypot(d[0], d[1]) || 1;
  // Direction du pied : perpendiculaire au tibia, vers l'avant.
  let f: Vec = [-d[1] / l, d[0] / l];
  if (f[0] < 0) f = [-f[0], -f[1]];
  if (flat) f = [1, 0];
  const heel = add(foot, f, -1.5), toe = add(foot, f, len - 1.5);
  m.limb(heel, toe, 3.4, 3);
  paint(cv, m, color, ink);
}

export const angleOf = (a: Vec, b: Vec) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
export { dir };
