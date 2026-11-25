import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploData } from "../../../../../lib/explo-data";
import { parseMemberId } from "../../../../../lib/members-server";
import { directSrc } from "../../../../../lib/image-loader";
import FilmMember from "./FilmMember";
import "../../c.css";
import "./mc.css";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const m = members.find((x) => x.id === id);
  if (!m) notFound();
  return { title: `Exploration C · ${m.name} | Guilde Otaku` };
}

export default async function FilmPage({ params }: Props) {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const i = members.findIndex((x) => x.id === id);
  if (i < 0) notFound();
  const m = members[i];
  const prev = members[(i - 1 + members.length) % members.length], next = members[(i + 1) % members.length];
  const images = [m.anime ?? m.real, m.anime && m.real ? m.real : null].filter((x): x is string => !!x).map((s) => directSrc(s, 1280));
  const lines = (m.bio.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [m.bio]).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return <FilmMember m={m} images={images} prev={{ id: prev.id, name: prev.name }} next={{ id: next.id, name: next.name }} lines={lines} />;
}
