import { hasJapanese } from "./member-extras";

// Teams de la Guilde : formations, postes et validation (module pur, client et serveur).
// Basket : cinq titulaires. Foot : onze, selon la formation choisie.
// Coordonnées des postes en pourcentage du terrain : x de gauche à droite, y du haut
// (attaque) vers le bas (but / panier défendu).

export type Sport = "basket" | "foot";
export interface SlotDef { id: string; code: string; label: string; x: number; y: number }
export interface TeamSlot { slot: string; memberId: number; number?: number; captain?: boolean }
export interface GuildTeam {
  id: number; slug: string; name: string; sport: Sport; formation: string;
  color: string | null; motto: string | null; slots: TeamSlot[];
  position: number; published: boolean; created_at?: string; updated_at?: string;
}

const s = (id: string, code: string, label: string, x: number, y: number): SlotDef => ({ id, code, label, x, y });

export const FORMATIONS: Record<Sport, Record<string, SlotDef[]>> = {
  basket: {
    "5 majeur": [
      s("PG", "MEN", "Meneur", 50, 78),
      s("SG", "ARR", "Arrière", 18, 56),
      s("SF", "AIL", "Ailier", 82, 56),
      s("PF", "AF", "Ailier fort", 30, 26),
      s("C", "PIV", "Pivot", 70, 26),
    ],
  },
  foot: {
    "4-3-3": [
      s("BG", "BU", "Avant-centre", 50, 10), s("AG", "AG", "Ailier gauche", 18, 18), s("AD", "AD", "Ailier droit", 82, 18),
      s("MG", "MC", "Milieu gauche", 26, 44), s("MOC", "MC", "Milieu axial", 50, 38), s("MD", "MC", "Milieu droit", 74, 44),
      s("DG", "DG", "Latéral gauche", 12, 66), s("DCG", "DC", "Défenseur central", 36, 72), s("DCD", "DC", "Défenseur central", 64, 72), s("DD", "DD", "Latéral droit", 88, 66),
      s("GB", "GB", "Gardien", 50, 90),
    ],
    "4-4-2": [
      s("BG", "BU", "Attaquant", 36, 12), s("BD", "BU", "Attaquant", 64, 12),
      s("MG", "MG", "Milieu gauche", 12, 40), s("MCG", "MC", "Milieu axial", 37, 46), s("MCD", "MC", "Milieu axial", 63, 46), s("MD", "MD", "Milieu droit", 88, 40),
      s("DG", "DG", "Latéral gauche", 12, 68), s("DCG", "DC", "Défenseur central", 36, 73), s("DCD", "DC", "Défenseur central", 64, 73), s("DD", "DD", "Latéral droit", 88, 68),
      s("GB", "GB", "Gardien", 50, 90),
    ],
    "3-5-2": [
      s("BG", "BU", "Attaquant", 36, 11), s("BD", "BU", "Attaquant", 64, 11),
      s("MOC", "MOC", "Meneur de jeu", 50, 30),
      s("PG", "PIS", "Piston gauche", 10, 42), s("MCG", "MC", "Milieu axial", 32, 50), s("MCD", "MC", "Milieu axial", 68, 50), s("PD", "PIS", "Piston droit", 90, 42),
      s("DCG", "DC", "Défenseur central", 24, 72), s("DC", "DC", "Défenseur central", 50, 75), s("DCD", "DC", "Défenseur central", 76, 72),
      s("GB", "GB", "Gardien", 50, 91),
    ],
    "4-2-3-1": [
      s("BU", "BU", "Avant-centre", 50, 9),
      s("AG", "AG", "Ailier gauche", 16, 26), s("MOC", "MOC", "Meneur de jeu", 50, 30), s("AD", "AD", "Ailier droit", 84, 26),
      s("MDG", "MDC", "Sentinelle", 36, 50), s("MDD", "MDC", "Sentinelle", 64, 50),
      s("DG", "DG", "Latéral gauche", 12, 68), s("DCG", "DC", "Défenseur central", 36, 73), s("DCD", "DC", "Défenseur central", 64, 73), s("DD", "DD", "Latéral droit", 88, 68),
      s("GB", "GB", "Gardien", 50, 90),
    ],
  },
};

export const SPORT_LABEL: Record<Sport, string> = { basket: "Basket · 5 majeur", foot: "Foot · onze de départ" };
export const defaultFormation = (sport: Sport) => Object.keys(FORMATIONS[sport])[0];
export const slotsOf = (sport: Sport, formation: string): SlotDef[] => FORMATIONS[sport][formation] ?? FORMATIONS[sport][defaultFormation(sport)];

/** Adresse lisible d'une équipe. */
export function teamSlug(name: string, suffix = ""): string {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "team";
  return suffix ? `${base}-${suffix}` : base;
}

export interface TeamInput { name?: unknown; sport?: unknown; formation?: unknown; color?: unknown; motto?: unknown; slots?: unknown; position?: unknown; published?: unknown }
export type TeamRow = Omit<GuildTeam, "id" | "slug" | "created_at" | "updated_at">;

/** Nettoie et vérifie une équipe envoyée par l'admin. `known` : identifiants des membres existants. */
export function validateTeam(input: TeamInput, known: Set<number>): { row: TeamRow } | { error: string } {
  const name = typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim() : "";
  if (!name || name.length > 60) return { error: "Donne un nom à l'équipe (60 caractères au plus)." };
  if (hasJapanese(name)) return { error: "Nom en lettres latines seulement (rōmaji)." };
  const sport = input.sport === "basket" || input.sport === "foot" ? input.sport : null;
  if (!sport) return { error: "Choisis basket ou foot." };
  const formation = typeof input.formation === "string" && FORMATIONS[sport][input.formation] ? input.formation : null;
  if (!formation) return { error: "Formation inconnue." };
  const color = typeof input.color === "string" && /^#[0-9a-f]{6}$/i.test(input.color) ? input.color.toLowerCase() : null;
  const motto = typeof input.motto === "string" && input.motto.trim() ? input.motto.replace(/\s+/g, " ").trim().slice(0, 140) : null;
  if (motto && hasJapanese(motto)) return { error: "Devise en lettres latines seulement (rōmaji)." };
  const defs = new Set(slotsOf(sport, formation).map((d) => d.id));
  const raw = Array.isArray(input.slots) ? input.slots : [];
  const slots: TeamSlot[] = [];
  const usedSlots = new Set<string>(), usedMembers = new Set<number>(), usedNumbers = new Set<number>();
  for (const r of raw as Record<string, unknown>[]) {
    const slot = typeof r?.slot === "string" ? r.slot : "";
    const memberId = Number(r?.memberId);
    if (!defs.has(slot) || !Number.isInteger(memberId) || memberId <= 0) continue; // poste vide ou d'une autre formation
    if (!known.has(memberId)) return { error: "Un des membres choisis n'existe plus." };
    if (usedSlots.has(slot)) return { error: "Deux membres sur le même poste." };
    if (usedMembers.has(memberId)) return { error: "Un membre ne peut occuper qu'un poste par équipe." };
    const n = r?.number === undefined || r?.number === null || r?.number === "" ? undefined : Number(r.number);
    if (n !== undefined && (!Number.isInteger(n) || n < 0 || n > 99)) return { error: "Numéro de maillot entre 0 et 99." };
    if (n !== undefined && usedNumbers.has(n)) return { error: `Le numéro ${n} est pris deux fois.` };
    usedSlots.add(slot); usedMembers.add(memberId); if (n !== undefined) usedNumbers.add(n);
    slots.push({ slot, memberId, ...(n !== undefined ? { number: n } : {}), ...(r?.captain === true ? { captain: true } : {}) });
  }
  if (slots.filter((x) => x.captain).length > 1) return { error: "Un seul capitaine par équipe." };
  const position = Number.isInteger(Number(input.position)) ? Math.max(0, Math.min(999, Number(input.position))) : 0;
  return { row: { name, sport, formation, color, motto, slots, position, published: input.published === true } };
}

/** Puissance de l'équipe : moyenne des stats (force, vitesse, technique) des titulaires, sur 100. */
export function teamPower(stats: ({ force?: number; vitesse?: number; technique?: number } | null | undefined)[]): number | null {
  const vals = stats.flatMap((st) => (st ? [st.force, st.vitesse, st.technique].filter((v): v is number => typeof v === "number" && v > 0) : []));
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

/** Lignes de jeu : chaque poste appartient à une ligne (foot) ou à un secteur (basket). */
export type Line = "attaque" | "milieu" | "defense" | "exterieur" | "interieur";
export const LINE_LABEL: Record<Line, string> = { attaque: "Attaque", milieu: "Milieu", defense: "Défense", exterieur: "Extérieur", interieur: "Raquette" };
const LINE_OF: Record<string, Line> = {
  BU: "attaque", AG: "attaque", AD: "attaque",
  MC: "milieu", MG: "milieu", MD: "milieu", MOC: "milieu", PIS: "milieu", MDC: "milieu",
  DG: "defense", DD: "defense", DC: "defense", GB: "defense",
  MEN: "exterieur", ARR: "exterieur", AIL: "exterieur", AF: "interieur", PIV: "interieur",
};
export const lineOf = (code: string): Line | null => LINE_OF[code] ?? null;

/** Note de chaque ligne : moyenne des stats des titulaires qui y jouent (rien d'inventé :
 *  une ligne sans titulaire noté n'a pas de note). */
export function lineRatings(sport: Sport, players: { code: string; stats: { force?: number; vitesse?: number; technique?: number } | null }[]): { line: Line; value: number | null }[] {
  const lines: Line[] = sport === "foot" ? ["attaque", "milieu", "defense"] : ["exterieur", "interieur"];
  return lines.map((line) => ({ line, value: teamPower(players.filter((p) => lineOf(p.code) === line).map((p) => p.stats)) }));
}
