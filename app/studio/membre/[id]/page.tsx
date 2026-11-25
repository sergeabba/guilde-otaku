import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Tome, { type TomeNeighbour } from "./Tome";
import StudioNav from "../../StudioNav";
import { getPublicMembers, parseMemberId } from "../../../../lib/members-server";
import { FR_MONTHS, isoWeek, memberLinks, toStudio, type StudioMember } from "../../../../lib/studio-data";
import { chroniqueLinks } from "../../../../lib/chroniques";
import { listTeams } from "../../../../lib/teams";
import { memberPlancheUrl } from "../../../../lib/share";
import { POUVOIRS } from "../../../../data/pouvoirs";
import "./tome.css";

interface Props { params: Promise<{ id: string }> }

async function load(params: Props["params"]) {
  const id = parseMemberId((await params).id);
  if (id === null) return null;
  const raw = await getPublicMembers();
  const i = raw.findIndex((m) => m.id === id);
  if (i < 0) return null;
  return { raw, i };
}

const neighbour = (m: StudioMember): TomeNeighbour => ({ id: m.id, name: m.name, image: m.anime ?? m.real, pos: m.anime ? m.animePos : m.realPos, accent: m.accent });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await load(params);
  if (!f) notFound();
  return { title: `Prototype · Tome ${f.raw[f.i].id} : ${f.raw[f.i].name} | Guilde Otaku` };
}

// Prototype de fiche : chaque membre est le héros de son propre tome de manga.
export default async function StudioMembre({ params }: Props) {
  const f = await load(params);
  if (!f) notFound();
  const all = f.raw.map(toStudio);
  const m = all[f.i];
  const member = f.raw[f.i];
  // Équipes publiées (base de production, lecture seule ; absentes si la clé serveur manque).
  const teams = await listTeams(true).then((r) => r.teams.map((t) => ({ name: t.name, members: t.slots.map((s) => s.memberId) }))).catch(() => []);
  const works = [...(member.extras?.favoriteAnime ?? []), ...(member.extras?.favoriteManga ?? [])];
  const { week, monday } = isoWeek();
  return (
    <main className="st r-hebdo tm2" style={{ "--acc": m.accent } as React.CSSProperties}>
      <StudioNav issue={`Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`} />
      <Tome m={m} member={member} position={f.i + 1} total={all.length}
        prev={neighbour(all[(f.i - 1 + all.length) % all.length])} next={neighbour(all[(f.i + 1) % all.length])}
        links={memberLinks(m, all, teams)} chroniques={chroniqueLinks(works)} plancheUrl={memberPlancheUrl(member, POUVOIRS[member.id] ?? null)} />
    </main>
  );
}
