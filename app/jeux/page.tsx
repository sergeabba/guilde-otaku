import { pageMetadata } from "../../lib/og/page-meta";
import { getPlay } from "../../lib/games/store";
import { getPublicMembers } from "../../lib/members-server";
import JeuxClient from "./JeuxClient";

// Aperçu WhatsApp : un lien de défi (?defi=123) annonce qui lance le défi et son score.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ defi?: string }> }) {
  const { defi } = await searchParams;
  const id = Number(defi);
  if (Number.isInteger(id) && id > 0) {
    const play = await getPlay(id).catch(() => null);
    if (play && play.game.startsWith("quiz-")) {
      const members = play.member_id ? await getPublicMembers().catch(() => []) : [];
      const who = members.find((m) => m.id === play.member_id)?.name ?? play.player_name ?? "Un membre de la Guilde";
      const what = play.game === "quiz-nostalgie" ? "blind test Nostalgie" : "quiz des génériques";
      return pageMetadata("jeux", `/jeux?defi=${id}`, `${who} te défie`, `${who} a fait ${play.score} points au ${what}. Mêmes extraits pour toi : fais mieux !`);
    }
  }
  return pageMetadata("jeux", "/jeux", "Jeux de la Guilde", "Défi du jour, quiz des génériques, blind test Nostalgie, affiches en morceaux, plus ou moins, tier list et duels de goûts.");
}

export default function JeuxPage() {
  return <JeuxClient />;
}
