import type { Metadata } from "next";
import { getAiringWeek } from "../../lib/airing";
import CalendarClient from "./CalendarClient";

export const metadata: Metadata = {
  title: "Calendrier des sorties | Guilde Otaku",
  description: "Les épisodes d'anime diffusés cette semaine, jour par jour, et les membres de la Guilde qui les suivent.",
};

export default async function CalendrierPage() {
  const episodes = await getAiringWeek().catch(() => null);
  return <CalendarClient episodes={episodes} />;
}
