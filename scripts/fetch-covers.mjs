// Fetch cover URLs for known AniList IDs

async function getById(id) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ($id: Int) {
          Media(id: $id) {
            id
            title { romaji english }
            coverImage { extraLarge large }
          }
        }
      `,
      variables: { id },
    }),
  });
  const json = await res.json();
  return json?.data?.Media;
}

async function searchAnime(query) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ($search: String) {
          Page(perPage: 3) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
              id
              title { romaji english }
              coverImage { extraLarge large }
              startDate { year }
            }
          }
        }
      `,
      variables: { search: query },
    }),
  });
  const json = await res.json();
  return json?.data?.Page?.media || [];
}

const entries = [
  { id: 192808, name: "Observation Log Villainess" },
  { id: 189987, name: "Klutzy Class Monitor" },
  { id: 169580, name: "Second Prettiest Girl" },
  { id: 202985, name: "Tadaima Ojamasaremasu" },
  { id: 202102, name: "Needy Girl Overdose" },
  { id: 201090, name: "Ghost Concert" },
  { id: 158036, name: "Eren the Southpaw" },
  { id: 182483, name: "Warrior Princess" },
  { id: 177508, name: "Kujima Utaeba" },
  { id: 187869, name: "Kamiina Botan" },
  { id: 185211, name: "Yowayowa Sensei" },
  { id: 194393, name: "Love Game" },
  { id: 171080, name: "Himitsu no AiPri" },
];

async function main() {
  console.log("=== FETCHING BY ID ===\n");
  
  for (const entry of entries) {
    const media = await getById(entry.id);
    if (media) {
      const cover = media.coverImage?.extraLarge || media.coverImage?.large || "NO COVER";
      console.log(`✓ ${entry.name} (ID: ${entry.id})`);
      console.log(`  Title: ${media.title.english || media.title.romaji}`);
      console.log(`  Cover: ${cover}`);
    } else {
      console.log(`✗ ${entry.name} (ID: ${entry.id}) - NOT FOUND BY ID`);
      // Try search instead
      const results = await searchAnime(entry.name);
      if (results.length > 0) {
        const m = results[0];
        const cover = m.coverImage?.extraLarge || m.coverImage?.large || "NO COVER";
        console.log(`  → Found by search: ID ${m.id} | ${m.title.english || m.title.romaji} | ${cover}`);
      }
    }
    console.log("");
    await new Promise((r) => setTimeout(r, 400));
  }

  // Also search for entries not found on AniList
  console.log("\n=== SEARCHING MISSING ENTRIES ===\n");
  
  const missing = [
    "Gals can't be kind to Otaku",
    "Agents of the Four Seasons",
    "Go For It Nakamura",
    "Always a Catch",
    "Kirio Fan Club",
    "Haibara's Teenage New Game",
    "MegaOre",
  ];

  for (const q of missing) {
    const results = await searchAnime(q);
    console.log(`"${q}":`);
    if (results.length === 0) {
      console.log("  (no results on AniList)");
    } else {
      results.forEach((m) => {
        console.log(`  ID: ${m.id} | ${m.title.romaji} | ${m.title.english || "N/A"} | ${m.startDate?.year || "?"}`);
        console.log(`  Cover: ${m.coverImage?.extraLarge || "none"}`);
      });
    }
    console.log("");
    await new Promise((r) => setTimeout(r, 400));
  }
}

main().catch(console.error);
