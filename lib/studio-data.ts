// Données des prototypes de la Phase 1 (/studio) : tout vient des fiches réelles des
// membres (aucune donnée inventée). Module serveur.
import type { Member, Rank } from "../data/members";
import { RANK_FILTER_ORDER } from "../data/members";
import { getPublicMembers } from "./members-server";
import { objectPosition, memberAwards, featuredWorks, workTitle } from "./member-extras";
import { POUVOIRS } from "../data/pouvoirs";
import { rankAccents, rankRomaji } from "../app/config/ranks";
import { COUNTRIES } from "../app/config/countries";
import { parseBirthday } from "../app/types";

export interface StudioMember {
  id: number; name: string; first: string; rank: Rank; romaji: string; accent: string;
  anime: string | null; real: string | null; animePos: string; realPos: string;
  bio: string; lede: string; birthday: string | null; birthDay: number | null; birthMonth: number | null;
  country: string | null; flag: string | null;
  stats: { force: number; vitesse: number; technique: number } | null;
  special: { name: string; effect: string } | null;
  bankai: { nom: string; sens: string; effet: string } | null;
  domaine: { nom: string; sens: string; effet: string } | null;
  awards: { title: string; year?: number; description?: string }[];
  works: { title: string; cover: string | null; year: number | null; kind: string; note: string | null }[];
  alias: string | null;
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

export function toStudio(m: Member): StudioMember {
  const x = m.extras ?? {};
  const st = m.stats && (m.stats.force || m.stats.vitesse || m.stats.technique) ? m.stats : null;
  const sp = m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special : null;
  const p = POUVOIRS[m.id] ?? null;
  const bd = m.birthday ? parseBirthday(m.birthday) : null;
  const c = COUNTRIES.find((k) => k.code === m.country);
  const works = [...featuredWorks(x.favoriteAnime, 4), ...featuredWorks(x.favoriteManga, 2)].slice(0, 6).map((w) => ({
    title: workTitle(w), cover: w.coverUrl ?? null, year: w.year ?? null, kind: w.kind === "MANGA" ? "Manga" : "Anime", note: w.personalNote ?? null,
  }));
  return {
    id: m.id, name: m.name, first: shortName(m.name), rank: m.rank,
    romaji: rankRomaji[m.rank] ?? "", accent: rankAccents[m.rank] ?? "#c9a84c",
    anime: m.animeChar || null, real: m.photo || null,
    animePos: objectPosition(x.animeFocus, "50% 18%"), realPos: objectPosition(x.photoFocus, "50% 22%"),
    bio: m.bio ?? "", lede: ledeOf(m.bio ?? ""), birthday: m.birthday || null,
    birthDay: bd?.day ?? null, birthMonth: bd?.month ?? null,
    country: c?.label ?? null, flag: c?.code ?? null,
    stats: st ? { force: st.force ?? 0, vitesse: st.vitesse ?? 0, technique: st.technique ?? 0 } : null,
    special: sp ? { name: sp.name, effect: sp.effect && sp.effect !== "—" ? sp.effect : "" } : null,
    bankai: p?.bankai ?? null, domaine: p?.domaine ?? null,
    awards: memberAwards(m), works, alias: x.displayNameRomaji ?? null,
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
