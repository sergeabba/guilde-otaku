// Génériques (openings et endings) des grandes séries, pour la page Cinéma.
// Source : vidéos officielles listées par TMDB (type « Opening Credits », YouTube),
// chacune vérifiée par l'oEmbed de YouTube (existe et peut être intégrée).
// Usage : NODE_USE_ENV_PROXY=1 TMDB_READ_TOKEN=... node scripts/build-openings.mjs
import { writeFileSync } from "node:fs";

const SERIES = [
  // Années 80
  "Dragon Ball|1986", "Saint Seiya", "Hokuto no Ken|1984", "City Hunter|1987", "Captain Tsubasa", "Kimagure Orange Road", "Mobile Suit Zeta Gundam",
  // Années 90
  "Dragon Ball Z", "Sailor Moon", "Slam Dunk", "Yu Yu Hakusho", "Neon Genesis Evangelion", "Cowboy Bebop", "Rurouni Kenshin", "Great Teacher Onizuka",
  "Cardcaptor Sakura", "Trigun", "Pokémon", "Berserk", "Hunter x Hunter", "Detective Conan", "Ranma ½", "Initial D", "Serial Experiments Lain",
  // Années 2000
  "One Piece", "Naruto", "Naruto Shippuden", "Bleach", "Death Note", "Fullmetal Alchemist: Brotherhood", "Code Geass", "Gurren Lagann", "Samurai Champloo",
  "Fruits Basket", "Gintama", "Hajime no Ippo", "Monster", "Ouran High School Host Club", "Clannad", "Toradora!", "Durarara!!", "Haruhi Suzumiya", "Eureka Seven",
  // Années 2010
  "Attack on Titan", "Steins;Gate", "Hunter x Hunter (2011)", "Sword Art Online", "Fairy Tail", "Kill la Kill", "JoJo's Bizarre Adventure", "Tokyo Ghoul",
  "Psycho-Pass", "One-Punch Man", "My Hero Academia", "Mob Psycho 100", "Haikyu!!", "Your Lie in April", "Parasyte -the maxim-", "The Promised Neverland",
  "Demon Slayer: Kimetsu no Yaiba", "Assassination Classroom", "Black Clover", "Dr. Stone", "Vinland Saga", "Dororo", "Kaguya-sama: Love Is War", "Made in Abyss",
  // Années 2020
  "Jujutsu Kaisen", "Chainsaw Man", "SPY x FAMILY", "Frieren: Beyond Journey's End", "Solo Leveling", "Dandadan", "Oshi no Ko", "Cyberpunk: Edgerunners",
  "Blue Lock", "Tokyo Revengers", "Hell's Paradise", "Kaiju No. 8", "Bocchi the Rock!", "Lycoris Recoil", "Mashle", "Fire Force", "The Apothecary Diaries",
  "Mushoku Tensei", "Re:Zero", "Sakamoto Days", "Wind Breaker", "Undead Unluck", "Delicious in Dungeon", "Zom 100", "Ranking of Kings", "Odd Taxi",
];

const TOKEN = process.env.TMDB_READ_TOKEN;
const tmdb = async (path) => {
  const r = await fetch(`https://api.themoviedb.org/3${path}`, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
  if (!r.ok) throw new Error(`TMDB ${r.status} ${path}`);
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const JA = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const isEd = (n) => /\bED\b|ending|エンディング/i.test(n);
const isOpLike = (v) => v.site === "YouTube" && (v.type === "Opening Credits" || /opening|ending|creditless|\bOP\b|\bED\b|ノンクレ|オープニング|エンディング/i.test(v.name));
// Compilations, versions longues, clips de chanson, bandes-annonces : écartés.
const SKIP = /all .*(openings|endings)|compilation|full ver|full version|mv\b|music video|trailer|pv\b|teaser|\bspot\b|lyric/i;

async function embeddable(key) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${key}`)}`);
  if (!r.ok) return null;
  const j = await r.json();
  return { author: j.author_name ?? null };
}

const out = [];
for (const title of SERIES) {
  try {
    // « Titre|année » : année de première diffusion, pour lever les homonymes.
    const [query, yr] = title.split("|");
    const s = await tmdb(`/search/tv?${new URLSearchParams({ query, language: "fr-FR", ...(yr ? { first_air_date_year: yr } : {}) })}`);
    const hit = (s.results ?? []).filter((x) => (x.origin_country ?? []).includes("JP") && (x.genre_ids ?? []).includes(16))[0];
    if (!hit) { console.log("PAS TROUVÉ", title); continue; }
    const v = await tmdb(`/tv/${hit.id}/videos?include_video_language=ja,en,fr,null`);
    let all = v.results ?? [];
    // Peu de génériques au niveau de la série : on regarde aussi ses premières saisons.
    if (all.filter(isOpLike).length < 2) {
      const d = await tmdb(`/tv/${hit.id}`);
      for (const se of (d.seasons ?? []).filter((x) => x.season_number > 0).slice(0, 6)) {
        const sv = await tmdb(`/tv/${hit.id}/season/${se.season_number}/videos?include_video_language=ja,en,fr,null`).catch(() => ({ results: [] }));
        all = all.concat(sv.results ?? []);
        await sleep(120);
      }
    }
    // Vidéos officielles seulement (chaînes des ayants droit), sans doublon.
    const seenKey = new Set();
    const vids = all.filter(isOpLike).filter((x) => x.official !== false && !SKIP.test(x.name) && !seenKey.has(x.key) && seenKey.add(x.key));
    let n = 0;
    for (const x of vids) {
      const ok = await embeddable(x.key);
      if (!ok) { console.log("  non intégrable", x.key, x.name.slice(0, 50)); continue; }
      const latin = !JA.test(x.name);
      out.push({ series: hit.name, tmdb: hit.id, year: hit.first_air_date ? Number(hit.first_air_date.slice(0, 4)) : null, poster: hit.poster_path ?? null,
        kind: isEd(x.name) ? "ED" : "OP", label: latin ? x.name.trim() : null, channel: ok.author, key: x.key, lang: x.iso_639_1 });
      n++;
      await sleep(120);
    }
    console.log(`${hit.name} (${hit.first_air_date?.slice(0, 4)}) [${title}] : ${n}`);
  } catch (e) { console.log("ERREUR", title, e.message); }
  await sleep(250);
}
writeFileSync(new URL("../data/anime-openings.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log("total", out.length, "OP", out.filter((x) => x.kind === "OP").length, "ED", out.filter((x) => x.kind === "ED").length, "séries", new Set(out.map((x) => x.tmdb)).size);
