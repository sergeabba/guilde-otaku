import type { Metadata } from "next";
import Collection, { type CollectionMember } from "./Collection";
import StudioNav from "../StudioNav";
import { byRank, FR_MONTHS, isoWeek, studioMembers } from "../../../lib/studio-data";
import "./annuaire.css";

export const metadata: Metadata = { title: "Prototype · La collection | Guilde Otaku" };

// Prototype d'annuaire : la Guilde comme une collection de personnages à découvrir.
export default async function StudioAnnuaire() {
  const all = await studioMembers();
  const { week, monday } = isoWeek();
  const members: CollectionMember[] = all.map((m) => ({
    id: m.id, name: m.name, first: m.first, rank: m.rank, romaji: m.romaji, accent: m.accent,
    anime: m.anime, real: m.real, animePos: m.animePos, realPos: m.realPos, lede: m.lede,
    country: m.country, birthday: m.birthday, stats: m.stats, bankai: m.bankai?.nom ?? null, alias: m.alias,
  }));
  const ranks = byRank(all).map((g) => ({ rank: g.rank, romaji: g.romaji, accent: g.accent, count: g.members.length }));
  return (
    <main className="st r-hebdo co">
      <StudioNav issue={`Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`} dark />
      <Collection members={members} ranks={ranks} />
    </main>
  );
}
