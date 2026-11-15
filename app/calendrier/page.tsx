import { pageMetadata } from "../../lib/og/page-meta";
import { getAiringWeek } from "../../lib/airing";
import CalendarClient from "./CalendarClient";

export async function generateMetadata() {
  return pageMetadata("calendrier", "/calendrier", "Les sorties Crunchyroll", "Les épisodes de la semaine sur Crunchyroll, jour par jour, avec synopsis et fans de la Guilde.");
}

export default async function CalendrierPage() {
  const episodes = await getAiringWeek().catch(() => null);
  return <CalendarClient episodes={episodes} />;
}
