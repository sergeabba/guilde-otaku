const TMDB_KEY     = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  // Delete wrong Bubble entry (id=3)
  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/film_semaine?id=eq.3`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  console.log("Deleted wrong Bubble:", delRes.ok);

  // Fetch correct Bubble (2022 anime, TMDB id 912598)
  const details = await fetch(
    `https://api.themoviedb.org/3/movie/912598?api_key=${TMDB_KEY}&language=fr-FR&append_to_response=videos,credits`
  ).then(r => r.json());

  const trailer = details.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube") ?? details.videos?.results?.[0];
  const director = details.credits?.crew?.find(c => c.job === "Director");

  const body = {
    title: "Bubble",
    tmdb_id: details.id,
    week_label: "Semaine du 20 avril 2026",
    week_date: "2026-04-20",
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    synopsis: details.overview,
    trailer_key: trailer?.key ?? null,
    vote_average: details.vote_average,
    genres: details.genres?.map(g => g.name).join(", ") ?? "",
    year: 2022,
    runtime: details.runtime,
    director: director?.name ?? null,
    watched: false,
  };

  console.log("Correct Bubble:", JSON.stringify(body, null, 2));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/film_semaine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const result = await insertRes.json();
  console.log("Inserted:", result[0]?.id, result[0]?.title);
}

run().catch(console.error);
