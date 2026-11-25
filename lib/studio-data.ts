// Données des prototypes de la Phase 1 (/studio) : tout vient des fiches réelles des
// membres (aucune donnée inventée). Module serveur.
import type { Member, Rank } from "../data/members";
import { RANK_FILTER_ORDER } from "../data/members";
import { getPublicMembers } from "./members-server";
import { objectPosition, memberAwards, featuredWorks, workTitle, sameWork, type FavoriteWork, type MemberTrack, type CardMotif } from "./member-extras";
import { POUVOIRS } from "../data/pouvoirs";
import { rankAccents, rankRomaji } from "../app/config/ranks";
import { COUNTRIES } from "../app/config/countries";
import { parseBirthday } from "../app/types";
import { portraitSeries, seriesLogoSrc } from "./series-logo";

/** Trois éditions de couverture, selon la famille du grade (voir docs/studio/phase-1). */
export type Edition = "prestige" | "shonen" | "seinen";

/** Générations : regroupement des grades existants (aucune date d'arrivée n'existe). */
export const GENERATIONS: { id: string; label: string; romaji: string; ranks: Rank[]; blurb: string }[] = [
  { id: "fondation", label: "La fondation", romaji: "Sōritsu", ranks: ["Fondateur"], blurb: "Là où tout a commencé." },
  { id: "couronne", label: "La couronne", romaji: "Ōkan", ranks: ["Monarque", "Ex Monarque", "Ordre Céleste"], blurb: "Ceux qui ont porté ou gardé le trône." },
  { id: "releve", label: "La relève", romaji: "Kōkei", ranks: ["New G dorée", "Futurs Espoirs"], blurb: "La nouvelle génération qui pousse." },
  { id: "anciens", label: "Les anciens", romaji: "Kodai", ranks: ["Vieux Briscard", "Fantôme", "Revenant"], blurb: "Les vétérans, les disparus et ceux qui reviennent." },
];

export interface StudioWork { key: string; title: string; cover: string | null; year: number | null; kind: string; note: string | null; raw: FavoriteWork }

export interface StudioMember {
  id: number; name: string; first: string; rank: Rank; romaji: string; accent: string;
  anime: string | null; real: string | null; animePos: string; realPos: string;
  animeVideo: string | null; realVideo: string | null;
  bio: string; lede: string; birthday: string | null; birthDay: number | null; birthMonth: number | null;
  country: string | null; flag: string | null;
  stats: { force: number; vitesse: number; technique: number } | null;
  special: { name: string; effect: string } | null;
  bankai: { nom: string; sens: string; effet: string } | null;
  domaine: { nom: string; sens: string; effet: string } | null;
  awards: { title: string; year?: number; description?: string }[];
  works: StudioWork[];
  music: MemberTrack[];
  alias: string | null;
  /** Identité de couverture : édition (famille du grade), motif et couleur choisis dans l'admin. */
  edition: Edition; motif: CardMotif; generation: string;
  /** Sujet du portrait anime à gauche : la couverture se compose en miroir. */
  mirror: boolean;
  series: { title: string; logo: string | null } | null;
}

/** Nom court affichable : le premier mot, ou les deux premiers s'il est trop court (« Dr », « Don »). */
export function shortName(name: string): string {
  const w = name.replace(/["“”«»()]/g, " ").trim().split(/\s+/);
  return w[0].length <= 3 && w[1] ? `${w[0]} ${w[1]}` : w[0];
}

/** Première phrase de la bio (accroche), coupée proprement. */
function ledeOf(bio: string): string {
  const s = bio.replace(/\s+/g, " ").trim();
  const m = /^(.{24,170}?[.!?])(\s|$)/.exec(s);
  if (m) return m[1];
  if (s.length <= 170) return s;
  const cut = s.lastIndexOf(" ", 168);
  return `${s.slice(0, cut > 80 ? cut : 168).replace(/[\s,;:]+$/, "")}…`;
}

export function editionOf(rank: Rank): Edition {
  if (["Fondateur", "Monarque", "Ex Monarque", "Ordre Céleste"].includes(rank)) return "prestige";
  if (["New G dorée", "Futurs Espoirs"].includes(rank)) return "shonen";
  return "seinen";
}
const DEFAULT_MOTIF: Record<Edition, CardMotif> = { prestige: "rayons", shonen: "vitesse", seinen: "trame" };

export function toStudio(m: Member): StudioMember {
  const x = m.extras ?? {};
  const st = m.stats && (m.stats.force || m.stats.vitesse || m.stats.technique) ? m.stats : null;
  const sp = m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special : null;
  const p = POUVOIRS[m.id] ?? null;
  const bd = m.birthday ? parseBirthday(m.birthday) : null;
  const c = COUNTRIES.find((k) => k.code === m.country);
  const works = [...featuredWorks(x.favoriteAnime, 6), ...featuredWorks(x.favoriteManga, 4)].slice(0, 8).map((w) => ({
    key: `${w.source}:${w.sourceId ?? workTitle(w)}`, title: workTitle(w), cover: w.coverUrl ?? null, year: w.year ?? null,
    kind: w.kind === "MANGA" ? "Manga" : "Anime", note: w.personalNote ?? null, raw: w,
  }));
  const edition = editionOf(m.rank);
  const s = portraitSeries(m);
  return {
    id: m.id, name: m.name, first: shortName(m.name), rank: m.rank,
    romaji: rankRomaji[m.rank] ?? "", accent: x.card?.color ?? rankAccents[m.rank] ?? "#c9a84c",
    anime: m.animeChar || null, real: m.photo || null,
    animePos: objectPosition(x.animeFocus, "50% 18%"), realPos: objectPosition(x.photoFocus, "50% 22%"),
    animeVideo: m.animeVideo || null, realVideo: m.photoVideo || null,
    bio: m.bio ?? "", lede: ledeOf(m.bio ?? ""), birthday: m.birthday || null,
    birthDay: bd?.day ?? null, birthMonth: bd?.month ?? null,
    country: c?.label ?? null, flag: c?.code ?? null,
    stats: st ? { force: st.force ?? 0, vitesse: st.vitesse ?? 0, technique: st.technique ?? 0 } : null,
    special: sp ? { name: sp.name, effect: sp.effect && sp.effect !== "—" ? sp.effect : "" } : null,
    bankai: p?.bankai ?? null, domaine: p?.domaine ?? null,
    awards: memberAwards(m), works, music: x.music ?? [], alias: x.displayNameRomaji ?? null,
    edition, motif: x.card?.motif ?? DEFAULT_MOTIF[edition],
    generation: GENERATIONS.find((g) => g.ranks.includes(m.rank))?.id ?? "anciens",
    mirror: !!x.animeFocus && x.animeFocus.x < 40,
    series: s ? { title: s.title, logo: seriesLogoSrc(m) } : null,
  };
}

export async function studioMembers(): Promise<StudioMember[]> {
  return (await getPublicMembers()).map(toStudio);
}

/** Numéro de la semaine (ISO) : la « une » change chaque lundi. */
export function isoWeek(d = new Date()): { week: number; year: number; monday: Date } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return { week, year: y, monday };
}

/** Membre en couverture cette semaine : tirage stable parmi ceux qui ont un portrait anime. */
export function coverStar(list: StudioMember[], week: number, year: number): StudioMember | null {
  const pool = list.filter((m) => m.anime && m.bio);
  if (!pool.length) return list[0] ?? null;
  return pool[(week * 31 + year * 7) % pool.length];
}

/** Prochains anniversaires (jours restants calculés à la date donnée). */
export function nextBirthdays(list: StudioMember[], now = new Date(), n = 3) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return list.flatMap((m) => {
    if (!m.birthDay || !m.birthMonth) return [];
    let d = new Date(now.getFullYear(), m.birthMonth - 1, m.birthDay).getTime();
    if (d < today) d = new Date(now.getFullYear() + 1, m.birthMonth - 1, m.birthDay).getTime();
    return [{ m, days: Math.round((d - today) / 86400000) }];
  }).sort((a, b) => a.days - b.days).slice(0, n);
}

/** Grades dans l'ordre de la Guilde, avec leurs membres. */
export function byRank(list: StudioMember[]) {
  return RANK_FILTER_ORDER.map((rank) => ({ rank, romaji: rankRomaji[rank] ?? "", accent: rankAccents[rank] ?? "#c9a84c", members: list.filter((m) => m.rank === rank) }))
    .filter((g) => g.members.length);
}

export const FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// ─── Liens entre membres : seulement ce que les données prouvent ─────────────

export interface MemberLink { id: number; name: string; image: string | null; pos: string; accent: string; kind: "cite" | "team" | "oeuvres" | "pays"; reason: string }

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Un membre est-il cité dans un texte ? Nom complet, nom court ou alias, en mot entier. */
export function mentions(text: string, m: Pick<StudioMember, "name" | "first" | "alias">): boolean {
  const t = ` ${fold(text).replace(/[^a-z0-9]+/g, " ")} `;
  return [m.name, m.first, m.alias].filter((n): n is string => !!n && n.replace(/\W/g, "").length >= 3)
    .some((n) => t.includes(` ${fold(n).replace(/[^a-z0-9]+/g, " ").trim()} `));
}

export function memberLinks(m: StudioMember, all: StudioMember[], teams: { name: string; members: number[] }[] = [], max = 6): MemberLink[] {
  const out = new Map<number, MemberLink>();
  const add = (o: StudioMember, kind: MemberLink["kind"], reason: string) => {
    if (o.id === m.id || out.has(o.id)) return;
    out.set(o.id, { id: o.id, name: o.name, image: o.anime ?? o.real, pos: o.anime ? o.animePos : o.realPos, accent: o.accent, kind, reason });
  };
  // 1. Cité dans une distinction (dans un sens ou dans l'autre).
  for (const a of m.awards) for (const o of all) if (mentions(`${a.title} ${a.description ?? ""}`, o)) add(o, "cite", `Cité dans « ${a.title} »`);
  for (const o of all) for (const a of o.awards) if (mentions(`${a.title} ${a.description ?? ""}`, m)) add(o, "cite", `Le cite dans « ${a.title} »`);
  // 2. Même équipe publiée.
  for (const t of teams) if (t.members.includes(m.id)) for (const id of t.members) { const o = all.find((x) => x.id === id); if (o) add(o, "team", `Coéquipier · ${t.name}`); }
  // 3. Favoris en commun (le plus de titres partagés d'abord).
  const shared = all.filter((o) => o.id !== m.id).map((o) => ({ o, w: m.works.filter((w) => o.works.some((v) => sameWork(w.raw, v.raw))) }))
    .filter((x) => x.w.length).sort((a, b) => b.w.length - a.w.length);
  for (const { o, w } of shared.slice(0, 4)) add(o, "oeuvres", w.length > 1 ? `${w.length} favoris en commun, dont ${w[0].title}` : `Fan de ${w[0].title} aussi`);
  // 4. Compatriotes (seulement pour compléter).
  // Plafonnés à trois pour ne pas noyer les liens plus parlants.
  let pays = 0;
  if (m.flag) for (const o of all) if (o.id !== m.id && o.flag === m.flag && out.size < max && pays < 3 && !out.has(o.id)) { add(o, "pays", `Compatriote · ${m.country}`); pays++; }
  return [...out.values()].slice(0, max);
}
