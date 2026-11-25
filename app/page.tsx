import { getPublicMembers } from "../lib/members-server";
import { pageMetadata } from "../lib/og/page-meta";
import HomePageClient from "./components/HomePageClient";
import { fetchFeaturedFilm } from "../lib/hebdo";
import { getAtelierTiles } from "../lib/atelier-server";
import { getAnimeSong, SONG_COUNT, todayIndex } from "../lib/anime-song";

export async function generateMetadata() {
  const m = pageMetadata("accueil", "/", "Le registre des membres", "Une bande d'amis qui débat d'animes, élit ses films et se décerne des titres depuis 2020.");
  return { ...m, title: "Guilde Otaku", openGraph: { ...m.openGraph, title: "Guilde Otaku" }, twitter: { ...m.twitter, title: "Guilde Otaku" } };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ generique?: string }> }) {
  // ?generique=N : ouvert depuis la recherche globale.
  const asked = Number((await searchParams).generique);
  const songIndex = Number.isInteger(asked) && asked >= 0 && asked < SONG_COUNT ? asked : todayIndex();
  const [members, featuredFilm, atelierTiles, song] = await Promise.all([
    getPublicMembers(), fetchFeaturedFilm(), getAtelierTiles().catch(() => []), getAnimeSong(songIndex).catch(() => null),
  ]);
  return <HomePageClient initialMembers={members} featuredFilm={featuredFilm} atelierTiles={atelierTiles} song={song} songIsToday={songIndex === todayIndex()} />;
}
