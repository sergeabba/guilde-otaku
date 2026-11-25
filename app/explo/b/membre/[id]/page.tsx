import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploData } from "../../../../../lib/explo-data";
import { parseMemberId } from "../../../../../lib/members-server";
import StatusB from "./StatusB";
import "../../b.css";
import "./mb.css";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const m = members.find((x) => x.id === id);
  if (!m) notFound();
  return { title: `Exploration B · Statut de ${m.name} | Guilde Otaku` };
}

export default async function StatusPage({ params }: Props) {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const i = members.findIndex((x) => x.id === id);
  if (i < 0) notFound();
  const prev = members[(i - 1 + members.length) % members.length], next = members[(i + 1) % members.length];
  return <StatusB m={members[i]} prev={{ id: prev.id, name: prev.first }} next={{ id: next.id, name: next.first }} />;
}
