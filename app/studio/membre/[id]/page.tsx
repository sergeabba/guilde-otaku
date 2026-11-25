import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Tome from "./Tome";
import StudioNav from "../../StudioNav";
import { parseMemberId } from "../../../../lib/members-server";
import { FR_MONTHS, isoWeek, studioMembers } from "../../../../lib/studio-data";
import "./tome.css";

interface Props { params: Promise<{ id: string }> }

async function load(params: Props["params"]) {
  const id = parseMemberId((await params).id);
  if (id === null) return null;
  const all = await studioMembers();
  const i = all.findIndex((m) => m.id === id);
  if (i < 0) return null;
  return { m: all[i], prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await load(params);
  if (!f) notFound();
  return { title: `Prototype · Tome ${f.m.id} : ${f.m.name} | Guilde Otaku` };
}

// Prototype de fiche : chaque membre est le héros de son propre tome de manga.
export default async function StudioMembre({ params }: Props) {
  const f = await load(params);
  if (!f) notFound();
  const { week, monday } = isoWeek();
  return (
    <main className="st r-hebdo tm2" style={{ "--acc": f.m.accent } as React.CSSProperties}>
      <StudioNav issue={`Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`} />
      <Tome m={f.m} prev={{ id: f.prev.id, name: f.prev.name }} next={{ id: f.next.id, name: f.next.name }} />
    </main>
  );
}
