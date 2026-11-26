import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploData } from "../../../../../lib/explo-data";
import { parseMemberId } from "../../../../../lib/members-server";
import CharacterSheet from "../../../../components/member/CharacterSheet";
import "../../v3.css";

export const metadata: Metadata = { title: "DA v3 · Fiche de personnage | Guilde Otaku" };

export default async function Fiche({ params }: { params: Promise<{ id: string }> }) {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const m = members.find((x) => x.id === id);
  if (!m) notFound();
  return <main className="v3"><CharacterSheet m={m} /></main>;
}
