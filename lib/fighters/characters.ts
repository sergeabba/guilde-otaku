// Données de combat par personnage, à la manière des fichiers MUGEN (états, coups,
// commandes, zones de collision), mais en TypeScript et sans aucun fichier repris.
// Les coups « communs » sont partagés ; un personnage peut les surcharger et ajoute
// ses spéciales. Seules les spéciales décrites dans les fiches des membres sont
// personnalisées : le reste est commun et signalé « provisoire ».

export type Guard = "mid" | "low" | "high" | "throw";
export interface Box { x: number; y: number; w: number; h: number } // x vers l'avant depuis le centre, y au-dessus des pieds

export interface ProjectileDef { speed: number; damage: number; hitstun: number; blockstun: number; ttl: number; sprite: "orb" | "quiz"; effect?: "dizzy"; h: number }

export interface MoveDef {
  id: string;
  anim: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  guard: Guard;
  hit: Box;
  hitstun: number;
  blockstun: number;
  push: number;
  knockdown?: boolean;
  launch?: number;
  /** Annulations possibles quand le coup touche (chaîne de coups légers, spéciales). */
  cancel?: ("chain" | "special")[];
  /** Élan donné au personnage au démarrage. */
  lunge?: number;
  projectile?: ProjectileDef;
  effect?: "dizzy";
  /** Invulnérabilité (images) pendant le coup, ex. super. */
  invuln?: [number, number];
}

export type NormalId = "s_lp" | "s_hp" | "s_lk" | "s_hk" | "c_lp" | "c_hp" | "c_lk" | "c_hk" | "j_lp" | "j_hp" | "j_lk" | "j_hk" | "throw";
export type Motion = "qcf" | "qcb" | "dp" | "qcf2";

export interface SpecialDef {
  id: string;
  /** Nom issu de la fiche du membre, ou nom commun provisoire. */
  name: string;
  motion: Motion;
  button: "p" | "k";
  move: MoveDef;
  provisional: boolean;
  /** Description d'origine (fiche du membre) quand elle existe. */
  source?: string;
}

export interface CharacterDef {
  key: string;
  memberId: number | null;
  /** Personnage encore provisoire (silhouette commune) ou sprites personnalisés. */
  custom: boolean;
  walk: number;
  backWalk: number;
  jumpV: number;
  size: { w: number; h: number; crouchH: number };
  normals: Record<NormalId, MoveDef>;
  specials: SpecialDef[];
  superMove: SpecialDef;
  passive?: { kind: "revive"; hpPct: number; name: string; source: string };
}

const N = (m: Omit<MoveDef, "anim"> & { anim?: string }): MoveDef => ({ anim: m.id, ...m });

// ─── Coups communs (portées, timings et effets distincts) ───────────────────
export const COMMON_NORMALS: Record<NormalId, MoveDef> = {
  s_lp: N({ id: "s_lp", startup: 3, active: 3, recovery: 7, damage: 30, guard: "mid", hit: { x: 10, y: 40, w: 22, h: 10 }, hitstun: 13, blockstun: 8, push: 2, cancel: ["chain", "special"] }),
  s_hp: N({ id: "s_hp", startup: 6, active: 4, recovery: 14, damage: 70, guard: "mid", hit: { x: 10, y: 38, w: 30, h: 14 }, hitstun: 20, blockstun: 12, push: 3.5, cancel: ["special"] }),
  s_lk: N({ id: "s_lk", startup: 4, active: 3, recovery: 9, damage: 35, guard: "mid", hit: { x: 10, y: 24, w: 28, h: 10 }, hitstun: 14, blockstun: 9, push: 2.4, cancel: ["chain"] }),
  s_hk: N({ id: "s_hk", startup: 8, active: 4, recovery: 16, damage: 80, guard: "mid", hit: { x: 10, y: 30, w: 38, h: 16 }, hitstun: 22, blockstun: 13, push: 4.5, lunge: 1.2 }),
  c_lp: N({ id: "c_lp", startup: 3, active: 3, recovery: 7, damage: 25, guard: "mid", hit: { x: 10, y: 22, w: 22, h: 10 }, hitstun: 12, blockstun: 8, push: 2, cancel: ["chain", "special"] }),
  c_hp: N({ id: "c_hp", startup: 6, active: 5, recovery: 15, damage: 65, guard: "mid", hit: { x: 6, y: 34, w: 22, h: 30 }, hitstun: 20, blockstun: 12, push: 2.5, launch: 5.5, cancel: ["special"] }),
  c_lk: N({ id: "c_lk", startup: 4, active: 3, recovery: 8, damage: 25, guard: "low", hit: { x: 10, y: 2, w: 30, h: 10 }, hitstun: 13, blockstun: 8, push: 2.2, cancel: ["chain", "special"] }),
  c_hk: N({ id: "c_hk", startup: 7, active: 5, recovery: 20, damage: 70, guard: "low", hit: { x: 10, y: 0, w: 40, h: 10 }, hitstun: 24, blockstun: 12, push: 3, knockdown: true }),
  j_lp: N({ id: "j_lp", startup: 3, active: 8, recovery: 3, damage: 30, guard: "high", hit: { x: 6, y: 34, w: 22, h: 14 }, hitstun: 14, blockstun: 8, push: 2 }),
  j_hp: N({ id: "j_hp", startup: 6, active: 6, recovery: 4, damage: 65, guard: "high", hit: { x: 6, y: 26, w: 28, h: 20 }, hitstun: 18, blockstun: 11, push: 3 }),
  j_lk: N({ id: "j_lk", startup: 4, active: 9, recovery: 3, damage: 35, guard: "high", hit: { x: 2, y: -4, w: 26, h: 18 }, hitstun: 15, blockstun: 9, push: 2.4 }),
  j_hk: N({ id: "j_hk", startup: 7, active: 8, recovery: 4, damage: 70, guard: "high", hit: { x: 4, y: -8, w: 34, h: 24 }, hitstun: 19, blockstun: 12, push: 3.4 }),
  // Projection : imparable, très courte portée, au sol seulement.
  throw: N({ id: "throw", startup: 2, active: 2, recovery: 26, damage: 100, guard: "throw", hit: { x: 6, y: 20, w: 18, h: 30 }, hitstun: 0, blockstun: 0, push: 6, knockdown: true }),
};

/** Spéciale commune provisoire (personnages sans données détaillées). */
const commonWave = (name: string, source?: string): SpecialDef => ({
  id: "wave", name, motion: "qcf", button: "p", provisional: true, source,
  move: N({ id: "wave", anim: "special", startup: 12, active: 1, recovery: 18, damage: 0, guard: "mid", hit: { x: 0, y: 0, w: 0, h: 0 }, hitstun: 0, blockstun: 0, push: 0,
    projectile: { speed: 4.2, damage: 85, hitstun: 22, blockstun: 14, ttl: 120, sprite: "orb", h: 34 } }),
});

const commonSuper = (): SpecialDef => ({
  id: "super", name: "Furie de la Guilde", motion: "qcf2", button: "p", provisional: true,
  move: N({ id: "super", startup: 10, active: 10, recovery: 26, damage: 240, guard: "mid", hit: { x: 6, y: 20, w: 48, h: 34 }, hitstun: 30, blockstun: 18, push: 5, knockdown: true, lunge: 5, invuln: [1, 12] }),
});

const base = (key: string, memberId: number | null, specialName: string, source?: string): CharacterDef => ({
  key, memberId, custom: false, walk: 1.8, backWalk: 1.35, jumpV: -7.1, size: { w: 22, h: 56, crouchH: 36 },
  normals: COMMON_NORMALS, specials: [commonWave(specialName, source)], superMove: commonSuper(),
});

// ─── Personnages personnalisés ───────────────────────────────────────────────

/**
 * Craig Ryan (Fondateur). Fiche : « Quiz Omniscient — Stun l'adversaire avec une
 * question impossible. » Spéciale fidèle : une bulle-question qui étourdit.
 */
export const CRAIG: CharacterDef = {
  ...base("craig", 1, "Quiz Omniscient"),
  custom: true,
  walk: 1.75,
  size: { w: 22, h: 60, crouchH: 38 },
  specials: [{
    id: "quiz", name: "Quiz Omniscient", motion: "qcf", button: "p", provisional: false,
    source: "Stun l'adversaire avec une question impossible.",
    move: N({ id: "quiz", anim: "special", startup: 14, active: 1, recovery: 20, damage: 0, guard: "mid", hit: { x: 0, y: 0, w: 0, h: 0 }, hitstun: 0, blockstun: 0, push: 0,
      projectile: { speed: 3.1, damage: 40, hitstun: 20, blockstun: 12, ttl: 140, sprite: "quiz", effect: "dizzy", h: 40 } }),
  }],
};

/**
 * Emmanuel Melrick (Revenant). Fiche : « Régénération de Cell — Revient d'un K.O.
 * avec 20 % de sa santé si tué. » Talent passif fidèle, une fois par match.
 * Sa spéciale active n'est pas décrite : il garde la spéciale commune provisoire.
 */
export const MELRICK: CharacterDef = {
  ...base("melrick", 56, "Onde de la Guilde"),
  custom: true,
  walk: 1.9, backWalk: 1.45,
  size: { w: 20, h: 62, crouchH: 38 },
  passive: { kind: "revive", hpPct: 0.2, name: "Régénération de Cell", source: "Revient d'un K.O. avec 20% de sa santé si tué." },
};

const CUSTOM: Record<number, CharacterDef> = { 1: CRAIG, 56: MELRICK };

/** Personnage d'un membre : personnalisé s'il existe, sinon provisoire (silhouette commune). */
export function characterFor(memberId: number, specialName?: string): CharacterDef {
  return CUSTOM[memberId] ?? { ...base(`m${memberId}`, memberId, specialName || "Onde de la Guilde"), key: `m${memberId}` };
}

export const CUSTOM_IDS = Object.keys(CUSTOM).map(Number);
