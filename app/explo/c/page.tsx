import type { Metadata } from "next";
import { exploData } from "../../../lib/explo-data";
import { GENERATIONS } from "../../../lib/studio-data";
import { directSrc } from "../../../lib/image-loader";
import FilmHome, { type Scene } from "./FilmHome";
import "./c.css";

export const metadata: Metadata = { title: "Exploration C · Butai | Guilde Otaku" };

const focus = (pos: string) => { const y = Number(pos.split(" ")[1]?.replace("%", "")); return Number.isFinite(y) ? y / 100 : .2; };

// DIRECTION C · « Butai » (la scène) : expérience cinéma. Un seul canevas WebGL (portraits
// en trame, fondu à l'encre entre les scènes, lumière au pointeur, grain), traversé au
// défilement : ouverture, puis les quatre générations, puis l'index.
export default async function ExploC() {
  const { members, starId } = await exploData();
  const cast = members.filter((m) => m.cut && m.anime);
  const star = cast.find((m) => m.id === starId) ?? cast[0];
  const scenes: Scene[] = [
    { k: 0, kicker: "La Guilde présente", title: "Ouverture", text: `${members.length} nakama, une seule scène. Cette semaine : ${star.name}.`, image: directSrc(star.anime!, 1280), tint: star.accent, focusY: focus(star.animePos), cast: [], lead: { id: star.id, name: star.first }, tc: "00:00" },
    ...GENERATIONS.map((g, k) => {
      const ms = cast.filter((m) => m.generation === g.id);
      const lead = ms[0] ?? star;
      return {
        k: k + 1, kicker: `${g.romaji} · ${ms.length || members.filter((m) => m.generation === g.id).length} nakama`, title: g.label, text: g.blurb,
        image: directSrc(lead.anime!, 1280), tint: lead.accent, focusY: focus(lead.animePos),
        cast: ms.slice(1, 4).map((m) => ({ id: m.id, name: m.first, src: m.cut!.src, h: m.cut!.h })), lead: { id: lead.id, name: lead.first }, tc: `0${k + 1}:${String((k + 1) * 17 % 60).padStart(2, "0")}`,
      };
    }),
  ];
  const index = members.map((m) => ({ id: m.id, name: m.name, rank: m.rank, cut: m.cut?.src ?? null }));
  return <FilmHome scenes={scenes} index={index} />;
}
