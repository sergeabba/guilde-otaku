import { notFound } from "next/navigation";
import TeamsClient from "../../../teams/TeamsClient";
import type { TeamMember } from "../../../teams/TeamBoard";
import type { GuildTeam } from "../../../../lib/teams-logic";
import { FORMATIONS } from "../../../../lib/teams-logic";
import { getPublicMembers } from "../../../../lib/members-server";
import { objectPosition } from "../../../../lib/member-extras";
import { POUVOIRS } from "../../../../data/pouvoirs";
import { seriesLogoSrc } from "../../../../lib/series-logo";
import { rankLogos, type Rank } from "../../../config/ranks";

// Banc d'essai de Teams avec des équipes FICTIVES (compositions inventées pour tester la
// présentation). Uniquement en développement local : 404 en production, rien n'est publié
// ni écrit dans Supabase.
export const dynamic = "force-dynamic";

export default async function TeamsTest() {
  if (process.env.NODE_ENV !== "development") notFound();
  const all = await getPublicMembers();
  const pool = all.filter((m) => m.animeChar || m.photo);
  const foot = FORMATIONS.foot["4-3-3"], basket = FORMATIONS.basket["5 majeur"];
  const teams: GuildTeam[] = [
    { id: 9001, slug: "test-foot", name: "Équipe test (fictive)", sport: "foot", formation: "4-3-3", color: "#2563eb", motto: "Composition fictive pour essai", position: 0, published: true,
      slots: foot.map((d, i) => ({ slot: d.id, memberId: pool[i % pool.length].id, number: i + 1, captain: i === 9 })) },
    { id: 9002, slug: "test-basket", name: "Cinq test (fictif)", sport: "basket", formation: "5 majeur", color: "#ef6c00", motto: null, position: 1, published: true,
      slots: basket.map((d, i) => ({ slot: d.id, memberId: pool[(i + 11) % pool.length].id, number: [4, 7, 10, 11, 23][i], captain: i === 0 })) },
  ];
  const used = new Set(teams.flatMap((t) => t.slots.map((s) => s.memberId)));
  const members: TeamMember[] = all.filter((m) => used.has(m.id)).map((m) => ({
    id: m.id, name: m.name, rank: m.rank, anime: m.animeChar || null, real: m.photo || null,
    animePos: objectPosition(m.extras?.animeFocus, "50% 15%"), realPos: objectPosition(m.extras?.photoFocus, "50% 20%"),
    logo: seriesLogoSrc(m) ?? rankLogos[m.rank as Rank] ?? null,
    stats: m.stats && (m.stats.force || m.stats.vitesse || m.stats.technique) ? m.stats : null,
    special: m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special.name : null,
    bankai: POUVOIRS[m.id]?.bankai.nom ?? null,
  }));
  return <TeamsClient teams={teams} members={members} available />;
}
