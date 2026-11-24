// Manettes (API Gamepad du navigateur, disposition « standard » : Xbox, PlayStation,
// Switch Pro). Module pur : une manette lue devient une entrée du moteur.
//   Croix ou stick gauche : déplacements · X / Carré : poing léger · Y / Triangle : poing fort
//   A / Croix : pied léger · B / Rond : pied fort · RB / R1 : spéciale · RT / R2 : super
//   LB / L1 : esquive · Start / Options : pause
import { NO_INPUT, type Input } from "./engine";

export interface PadLike { buttons: readonly { pressed: boolean; value?: number }[]; axes: readonly number[]; mapping?: string; connected?: boolean }

const DEAD = 0.5;
const on = (p: PadLike, i: number) => !!p.buttons[i] && (p.buttons[i].pressed || (p.buttons[i].value ?? 0) > 0.5);

export function padInput(p: PadLike): Input {
  const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
  return {
    ...NO_INPUT,
    left: on(p, 14) || ax < -DEAD, right: on(p, 15) || ax > DEAD,
    up: on(p, 12) || ay < -DEAD, down: on(p, 13) || ay > DEAD,
    lp: on(p, 2), hp: on(p, 3), lk: on(p, 0), hk: on(p, 1),
    special: on(p, 5), super: on(p, 7), dodge: on(p, 4),
  };
}
export const padPause = (p: PadLike) => on(p, 9);

/** Manettes branchées, dans l'ordre (J1 puis J2). */
export function connectedPads(): PadLike[] {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return [];
  return [...navigator.getGamepads()].filter((g): g is Gamepad => !!g && g.connected);
}

/** Fusionne deux entrées (clavier + manette) : une touche tenue d'un côté suffit. */
export function mergeInput(a: Input, b: Input): Input {
  const out = { ...a };
  for (const k of Object.keys(out) as (keyof Input)[]) out[k] = a[k] || b[k];
  return out;
}
