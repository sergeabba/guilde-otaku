const TMDB_KEY     = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const WEEK_DATE = "2026-04-20";

function formatWeekLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const opts = { day: "numeric", month: "long", year: "numeric" };
  return `Semaine du ${d.toLocaleDateString("fr-FR", opts)}`;
}

async function tmdbFetch(path) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_KEY}&language=fr-FR`);
  return res.json();
}

async function searchMovie(title) {
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}`);
  if (!data.results || data.results.length === 0) {
    console.log(`  ❌ Non trouvé sur TMDB: ${title}`);
    return null;
  }
  return data.results[0];
}

async function getMovieDetails(id) {
  const data = await tmdbFetch(`/movie/${id}?append_to_response=videos,credits`);
  const trailer = data.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube") ?? data.videos?.results?.[0];
  const director = data.credits?.crew?.find(c => c.job === "Director");
  return {
    id: data.id,
    title: data.title,
    overview: data.overview,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    release_date: data.release_date,
    runtime: data.runtime,
    vote_average: data.vote_average,
    genres: data.genres?.map(g => g.name).join(", ") ?? "",
    trailer_key: trailer?.key ?? null,
    director: director?.name ?? null,
  };
}

async function insertFilm(details) {
  const body = {
    title: details.title,
    tmdb_id: details.id,
    week_label: formatWeekLabel(WEEK_DATE),
    week_date: WEEK_DATE,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    synopsis: details.overview,
    trailer_key: details.trailer_key,
    vote_average: details.vote_average,
    genres: details.genres,
    year: details.release_date ? parseInt(details.release_date.split("-")[0]) : null,
    runtime: details.runtime,
    director: details.director,
    watched: false,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/film_semaine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.log(`  ❌ Erreur Supabase: ${err}`);
    return null;
  }
  return res.json();
}

const FILMS = [
  { q: "Penguin Highway",   label: "Les Murs vagabonds" },
  { q: "Pokémon Secrets of the Jungle", label: "Pokémon : Les Secrets de la Jungle" },
  { q: "Bubble",            label: "Bubble" },
  { q: "Spy x Family Code White", label: "Spy x Family Code: White" },
  { q: "Words Bubble Up Like Soda Pop", label: "Nos mots comme des bulles" },
  { q: "April and the Extraordinary World", label: "Avril et le Monde truqué" },
  { q: "Alita Battle Angel", label: "Alita : Battle Angel" },
  { q: "Ride Your Wave",    label: "Ride Your Wave" },
];

(async () => {
  console.log("🎬 Ajout des films de la semaine...\n");
  for (const entry of FILMS) {
    console.log(`🔍 Recherche: ${entry.q}`);
    const match = await searchMovie(entry.q);
    if (!match) continue;
    console.log(`  → Trouvé: ${match.title} (${match.release_date?.split("-")[0]}) [TMDB ${match.id}]`);
    
    const details = await getMovieDetails(match.id);
    details.title = entry.label;
    console.log(`  → Synopsis: ${details.overview?.substring(0, 60)}...`);
    console.log(`  → Réalisateur: ${details.director ?? "N/A"}`);
    console.log(`  → Trailer: ${details.trailer_key ?? "N/A"}`);
    console.log(`  → Genres: ${details.genres}`);
    
    const result = await insertFilm(details);
    if (result) console.log(`  ✅ Ajouté ! (id: ${result[0]?.id})`);
    console.log();
  }
  console.log("✨ Terminé !");
})();
