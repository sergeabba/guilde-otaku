import type { Metadata } from "next";
import TeamsClient from "./TeamsClient";
import type { TeamMember } from "./TeamBoard";
import { listTeams } from "../../lib/teams";
import { getPublicMembers } from "../../lib/members-server";
import { objectPosition } from "../../lib/member-extras";
import { POUVOIRS } from "../../data/pouvoirs";
import { seriesLogoSrc } from "../../lib/series-logo";
import { rankLogos, type Rank } from "../config/ranks";

export const metadata: Metadata = {
  title: "Teams | Guilde Otaku",
  description: "Les équipes de la Guilde Otaku : les cinq de basket et les onze de foot, poste par poste.",
  alternates: { canonical: "/teams" },
};

// Équipes publiées dans l'admin ; les membres masqués n'apparaissent jamais.
export default async function TeamsPage() {
  const [{ available, teams }, all] = await Promise.all([
    listTeams(true).catch(() => ({ available: false, teams: [] })),
    getPublicMembers(),
  ]);
  const used = new Set(teams.flatMap((t) => t.slots.map((s) => s.memberId)));
  const members: TeamMember[] = all.filter((m) => used.has(m.id)).map((m) => ({
    id: m.id, name: m.name, rank: m.rank,
    anime: m.animeChar || null, real: m.photo || null,
    animePos: objectPosition(m.extras?.animeFocus, "50% 15%"), realPos: objectPosition(m.extras?.photoFocus, "50% 20%"),
    logo: seriesLogoSrc(m) ?? rankLogos[m.rank as Rank] ?? null,
    logoFallback: rankLogos[m.rank as Rank] ?? null,
    stats: m.stats && (m.stats.force || m.stats.vitesse || m.stats.technique) ? m.stats : null,
    special: m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special.name : null,
    bankai: POUVOIRS[m.id]?.bankai.nom ?? null,
  }));
  return <TeamsClient teams={teams} members={members} available={available} />;
}
