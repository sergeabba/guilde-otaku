// Styles de combat (archétypes) de Guilde Fighters, déduits des statistiques réelles de la fiche
// (force, vitesse, technique). Aucun pouvoir n'est inventé : l'archétype ajuste seulement la façon
// de bouger et de frapper, dans des bornes qui gardent les règles d'équilibrage (un coup paré reste
// punissable : startup, active, recovery et blockstun ne changent pas).
// Il oriente aussi le comportement de l'IA (distance préférée, pression, projectiles, projections).
import type { CharacterDef, MoveDef, NormalId } from "./characters";

export type Archetype = "rushdown" | "zoner" | "grappler" | "shoto" | "speedster" | "contre" | "technique" | "polyvalent";

export interface Stats { force: number; vitesse: number; technique: number }

export interface ArchetypeInfo {
  label: string;
  /** Une ligne : comment il se joue. */
  pitch: string;
  /** Difficulté de prise en main, 1 (facile) à 3 (exigeant). */
  ease: 1 | 2 | 3;
  walk: number; backWalk: number; jump: number;
  /** Multiplicateur de dégâts des coups normaux (borné). */
  damage: number;
  /** Bonus de hitstun des coups légers (enchaînements plus faciles). */
  lightStun: number;
  /** Vitesse des projectiles. */
  projectile: number;
  /** Personnalité de l'IA. */
  ai: { range: number; press: number; wave: number; throwRate: number; jump: number };
}

export const ARCHETYPES: Record<Archetype, ArchetypeInfo> = {
  rushdown: { label: "Rushdown", pitch: "Avance sans relâche et enchaîne au contact.", ease: 2, walk: 1.12, backWalk: 0.95, jump: 1, damage: 1, lightStun: 2, projectile: 0.9, ai: { range: 30, press: 0.85, wave: 0.1, throwRate: 0.25, jump: 0.12 } },
  zoner: { label: "Zoner", pitch: "Tient à distance avec ses projectiles et punit l'approche.", ease: 2, walk: 0.94, backWalk: 1.05, jump: 0.96, damage: 0.96, lightStun: 0, projectile: 1.25, ai: { range: 150, press: 0.3, wave: 0.75, throwRate: 0.1, jump: 0.05 } },
  grappler: { label: "Grappler", pitch: "Lent mais lourd : chaque projection fait mal.", ease: 3, walk: 0.9, backWalk: 0.85, jump: 0.92, damage: 1.08, lightStun: 0, projectile: 0.85, ai: { range: 26, press: 0.65, wave: 0.05, throwRate: 0.6, jump: 0.08 } },
  shoto: { label: "Shoto", pitch: "Équilibré : projectile, anti-air, coups francs.", ease: 1, walk: 1, backWalk: 1, jump: 1, damage: 1, lightStun: 1, projectile: 1.05, ai: { range: 80, press: 0.55, wave: 0.35, throwRate: 0.2, jump: 0.1 } },
  speedster: { label: "Speedster", pitch: "Très rapide, frappe peu fort mais souvent.", ease: 3, walk: 1.2, backWalk: 1.12, jump: 1.06, damage: 0.92, lightStun: 2, projectile: 1, ai: { range: 40, press: 0.8, wave: 0.15, throwRate: 0.2, jump: 0.25 } },
  contre: { label: "Contre-attaquant", pitch: "Attend l'erreur et la punit sèchement.", ease: 3, walk: 0.98, backWalk: 1.08, jump: 1, damage: 1.04, lightStun: 1, projectile: 1, ai: { range: 70, press: 0.3, wave: 0.2, throwRate: 0.15, jump: 0.04 } },
  technique: { label: "Technique", pitch: "Enchaînements longs et précis, jauge qui monte vite.", ease: 3, walk: 1, backWalk: 1, jump: 1, damage: 0.98, lightStun: 2, projectile: 1.1, ai: { range: 60, press: 0.6, wave: 0.3, throwRate: 0.2, jump: 0.1 } },
  polyvalent: { label: "Polyvalent", pitch: "Sans faiblesse ni point fort marqué.", ease: 1, walk: 1, backWalk: 1, jump: 1, damage: 1, lightStun: 0, projectile: 1, ai: { range: 70, press: 0.5, wave: 0.3, throwRate: 0.2, jump: 0.1 } },
};

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Archétype d'après la fiche ; sans statistiques renseignées : polyvalent. */
export function archetypeOf(stats: Partial<Stats> | null | undefined): Archetype {
  if (!stats) return "polyvalent";
  const f = n(stats.force), v = n(stats.vitesse), t = n(stats.technique);
  if (f + v + t === 0) return "polyvalent";
  const top = Math.max(f, v, t), spread = top - Math.min(f, v, t);
  if (v >= 88 && v - f >= 8 && v - t >= 4) return "speedster";
  if (f >= 88 && v < 72) return "grappler";
  if (f >= 82 && v >= 80 && t < f) return "rushdown";
  if (t >= 86 && f < 78) return t - v >= 8 ? "zoner" : "contre";
  if (t >= top && t - Math.max(f, v) >= 5) return "technique";
  if (spread <= 8 && top >= 70) return "shoto";
  return "polyvalent";
}

const LIGHT: NormalId[] = ["s_lp", "s_lk", "c_lp", "c_lk", "j_lp", "j_lk"];

/** Personnage ajusté à son style (copie ; le personnage d'origine n'est pas modifié). */
export function applyArchetype(c: CharacterDef, a: Archetype): CharacterDef {
  const A = ARCHETYPES[a];
  if (a === "polyvalent") return c;
  const tune = (m: MoveDef, light: boolean): MoveDef => ({
    ...m,
    damage: Math.round(m.damage * A.damage),
    hitstun: m.hitstun + (light ? A.lightStun : 0),
    ...(m.projectile ? { projectile: { ...m.projectile, speed: +(m.projectile.speed * A.projectile).toFixed(2) } } : {}),
  });
  const normals = Object.fromEntries((Object.keys(c.normals) as NormalId[]).map((k) => [k, k === "throw" && a === "grappler" ? { ...c.normals[k], damage: Math.round(c.normals[k].damage * 1.25) } : tune(c.normals[k], LIGHT.includes(k))])) as Record<NormalId, MoveDef>;
  return {
    ...c,
    walk: +(c.walk * A.walk).toFixed(2), backWalk: +(c.backWalk * A.backWalk).toFixed(2), jumpV: +(c.jumpV * A.jump).toFixed(2),
    normals,
    specials: c.specials.map((sp) => ({ ...sp, move: tune(sp.move, false) })),
  };
}
