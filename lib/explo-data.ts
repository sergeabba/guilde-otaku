// Données des trois explorations artistiques (/explo/a, /b, /c). Module serveur.
// Tout vient des fiches réelles ; s'y ajoute le détourage du portrait anime quand il existe
// (scripts/make-cutouts.py, lib/cutouts.json). Sans détourage, chaque direction retombe
// sur le portrait entier.
import { cutoutFor, type Cutout } from "./cutout";
import { studioMembers, isoWeek, coverStar, type StudioMember } from "./studio-data";

export type { Cutout };
export interface ExploMember {
  id: number; name: string; first: string; rank: string; romaji: string; accent: string; alias: string | null;
  anime: string | null; real: string | null; animePos: string; realPos: string; cut: Cutout | null;
  bio: string; lede: string; country: string | null; flag: string | null; birthday: string | null;
  stats: { force: number; vitesse: number; technique: number } | null;
  special: { name: string; effect: string } | null;
  bankai: { nom: string; sens: string; effet: string } | null;
  domaine: { nom: string; sens: string; effet: string } | null;
  awards: { title: string; year?: number }[];
  works: { title: string; cover: string | null }[];
  edition: string; generation: string; series: string | null;
  powerScenes?: import("./member-extras").PowerScenes;
}


export function toExplo(m: StudioMember): ExploMember {
  return {
    id: m.id, name: m.name, first: m.first, rank: m.rank, romaji: m.romaji, accent: m.accent, alias: m.alias,
    anime: m.anime, real: m.real, animePos: m.animePos, realPos: m.realPos, cut: cutoutFor(m.anime),
    bio: m.bio, lede: m.lede, country: m.country, flag: m.flag, birthday: m.birthday,
    stats: m.stats, special: m.special, bankai: m.bankai, domaine: m.domaine, powerScenes: m.powerScenes,
    awards: m.awards.map((a) => ({ title: a.title, year: a.year })),
    works: m.works.slice(0, 6).map((w) => ({ title: w.title, cover: w.cover })),
    edition: m.edition, generation: m.generation, series: m.series?.title ?? null,
  };
}

export async function exploData() {
  const all = await studioMembers();
  const { week, year } = isoWeek();
  const star = coverStar(all, week, year);
  return { members: all.map(toExplo), starId: star?.id ?? all[0]?.id ?? 0, week, year };
}
