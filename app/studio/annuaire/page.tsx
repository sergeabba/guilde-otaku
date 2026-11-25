import type { Metadata } from "next";
import Collection, { type CollectionMember } from "./Collection";
import StudioNav from "../StudioNav";
import { byRank, FR_MONTHS, GENERATIONS, isoWeek, studioMembers } from "../../../lib/studio-data";
import "./annuaire.css";

export const metadata: Metadata = { title: "Prototype · La collection | Guilde Otaku" };

// Prototype d'annuaire : la Guilde comme une collection de personnages à découvrir,
// avec trois autres façons de la parcourir (liste, générations, bibliothèque de tomes).
export default async function StudioAnnuaire() {
  const all = await studioMembers();
  const { week, monday } = isoWeek();
  const members: CollectionMember[] = all.map((m) => ({
    id: m.id, name: m.name, first: m.first, rank: m.rank, romaji: m.romaji, accent: m.accent,
    anime: m.anime, real: m.real, animePos: m.animePos, realPos: m.realPos, lede: m.lede,
    country: m.country, flag: m.flag, birthday: m.birthday, birthDay: m.birthDay, birthMonth: m.birthMonth,
    stats: m.stats, bankai: m.bankai?.nom ?? null, alias: m.alias, generation: m.generation, edition: m.edition,
  }));
  const ranks = byRank(all).map((g) => ({ rank: g.rank, romaji: g.romaji, accent: g.accent, count: g.members.length }));
  const countries = [...new Map(all.filter((m) => m.flag).map((m) => [m.flag!, { code: m.flag!, label: m.country!, count: all.filter((x) => x.flag === m.flag).length }])).values()]
    .sort((a, b) => b.count - a.count);
  return (
    <main className="st r-hebdo co">
      <StudioNav issue={`Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`} dark />
      <Collection members={members} ranks={ranks} countries={countries} generations={GENERATIONS.map(({ id, label, romaji, blurb }) => ({ id, label, romaji, blurb }))} />
    </main>
  );
}
