import { NextRequest, NextResponse } from "next/server";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const tmdbId = req.nextUrl.searchParams.get("tmdb_id");

  if (!TMDB_KEY) {
    return NextResponse.json({ error: "Clé TMDB manquante" }, { status: 500 });
  }

  if (tmdbId) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&language=fr-FR&append_to_response=videos,credits`
    );
    const data = await res.json();
    const trailer = data.videos?.results?.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    ) ?? data.videos?.results?.[0];
    const director = data.credits?.crew?.find((c: any) => c.job === "Director");

    return NextResponse.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      genres: data.genres?.map((g: any) => g.name).join(", ") ?? "",
      trailer_key: trailer?.key ?? null,
      director: director?.name ?? null,
    });
  }

  if (!q) {
    return NextResponse.json({ error: "Paramètre q requis" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${TMDB_KEY}&language=fr-FR`
  );
  const data = await res.json();

  const results = (data.results ?? []).slice(0, 10).map((m: any) => ({
    id: m.id,
    title: m.title,
    overview: m.overview,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date,
    vote_average: m.vote_average,
  }));

  return NextResponse.json({ results });
}
