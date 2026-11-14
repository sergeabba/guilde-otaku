import { getPublicMembers } from "../lib/members-server";
import HomePageClient, { type FeaturedFilm } from "./components/HomePageClient";
import { supabase } from "../lib/supabase";
import { getAtelierTiles } from "../lib/atelier-server";
import { getAnimeSong, todayIndex } from "../lib/anime-song";

// Film élu de la semaine la plus récente, s'il y en a un. Aucun contenu
// n'est affiché si la table est vide ou injoignable.
async function fetchFeaturedFilm(): Promise<FeaturedFilm | null> {
  try {
    const { data } = await supabase
      .from("film_semaine")
      .select("title, synopsis, backdrop_path, poster_path, chosen, week_date")
      .order("week_date", { ascending: false })
      .limit(12);
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[0].week_date;
    const chosen = data.find((f) => f.week_date === latest && f.chosen);
    if (!chosen) return null;
    const path = chosen.backdrop_path || chosen.poster_path;
    return {
      title: chosen.title,
      synopsis: chosen.synopsis,
      image: path ? `https://image.tmdb.org/t/p/w780${path}` : null,
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [members, featuredFilm, atelierTiles, song] = await Promise.all([
    getPublicMembers(), fetchFeaturedFilm(), getAtelierTiles().catch(() => []), getAnimeSong(todayIndex()).catch(() => null),
  ]);
  return <HomePageClient initialMembers={members} featuredFilm={featuredFilm} atelierTiles={atelierTiles} song={song} />;
}
