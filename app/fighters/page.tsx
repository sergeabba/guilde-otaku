import { getPublicMembers } from "../../lib/members-server";
import { memberAwards, objectPosition } from "../../lib/member-extras";
import FightersApp, { type RosterMember } from "./FightersApp";
import "./fighters-v2.css";

// Les données des membres sont lues à chaque visite (comme les fiches profils).
export const dynamic = "force-dynamic";

export default async function FightersPage() {
  const members = await getPublicMembers();
  const roster: RosterMember[] = members.map((m) => {
    const s = m.stats;
    const hasStats = !!s && [s.force, s.vitesse, s.technique].some((v) => Number(v) > 0);
    const special = m.special?.name && !["—", "Inconnu", ""].includes(m.special.name.trim()) ? m.special : null;
    return {
      id: m.id,
      name: m.name,
      rank: m.rank,
      color: m.color,
      photo: m.photo || null,
      anime: m.animeChar || null,
      photoPos: objectPosition(m.extras?.photoFocus, "50% 20%"),
      animePos: objectPosition(m.extras?.animeFocus, "50% 15%"),
      bio: m.bio ? (m.bio.length > 180 ? `${m.bio.slice(0, 177).trimEnd()}…` : m.bio) : "",
      stats: hasStats ? { force: s.force, vitesse: s.vitesse, technique: s.technique } : null,
      special: special ? { name: special.name, effect: special.effect && special.effect !== "—" ? special.effect : "" } : null,
      awards: memberAwards(m).slice(0, 3).map((a) => (a.year ? `${a.title} ${a.year}` : a.title)),
    };
  });
  return <FightersApp roster={roster} />;
}
