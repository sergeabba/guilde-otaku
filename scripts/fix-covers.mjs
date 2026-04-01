// Script to look up correct AniList covers for problematic entries

const QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      title { romaji english native }
      coverImage { extraLarge large }
    }
  }
`;

const SEARCH_QUERY = `
  query ($search: String!) {
    Page(perPage: 5) {
      media(search: $search, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
      }
    }
  }
`;

async function fetchById(id) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { id } }),
  });
  const json = await res.json();
  return json?.data?.Media;
}

async function searchByTitle(title) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: title } }),
  });
  const json = await res.json();
  return json?.data?.Page?.media || [];
}

async function main() {
  console.log("=== Looking up problematic entries ===\n");

  // 1. Agents of the Four Season (ID: 190143)
  console.log("--- Agents of the Four Season ---");
  const agents = await fetchById(190143);
  if (agents) {
    console.log("ID 190143:", agents.title.romaji, "/", agents.title.english);
    console.log("Cover:", agents.coverImage?.extraLarge || agents.coverImage?.large);
  } else {
    console.log("ID 190143 NOT FOUND");
  }

  // Also search by different names
  console.log("\nSearching 'Shiki no Agents'...");
  const agentsSearch = await searchByTitle("Shiki no Agents");
  for (const m of agentsSearch.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  console.log("\nSearching 'Agents of the Four Seasons'...");
  const agentsSearch2 = await searchByTitle("Agents of the Four Seasons");
  for (const m of agentsSearch2.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  console.log("\nSearching 'Shunkashuutou Daikousha'...");
  const agentsSearch3 = await searchByTitle("Shunkashuutou Daikousha");
  for (const m of agentsSearch3.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 2. Go For It, Nakamura-kun! (ID: 180228)
  console.log("\n--- Go For It, Nakamura-kun! ---");
  const nakamura = await fetchById(180228);
  if (nakamura) {
    console.log("ID 180228:", nakamura.title.romaji, "/", nakamura.title.english);
    console.log("Cover:", nakamura.coverImage?.extraLarge || nakamura.coverImage?.large);
  } else {
    console.log("ID 180228 NOT FOUND");
  }

  console.log("\nSearching 'Ganbare Nakamura-kun'...");
  const nakamuraSearch = await searchByTitle("Ganbare Nakamura-kun");
  for (const m of nakamuraSearch.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 3. MegaOre - search various names
  console.log("\n--- MegaOre ---");
  console.log("Searching 'MegaOre'...");
  const megaore1 = await searchByTitle("MegaOre");
  for (const m of megaore1.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  console.log("\nSearching 'Megami Isekai Tensei'...");
  const megaore2 = await searchByTitle("Megami Isekai Tensei");
  for (const m of megaore2.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }

  console.log("\nSearching 'Yuusha no Rokkotsu'...");
  const megaore3 = await searchByTitle("Yuusha no Rokkotsu");
  for (const m of megaore3.slice(0, 3)) {
    console.log(`  ${m.id}: ${m.title.romaji} / ${m.title.english} => ${m.coverImage?.extraLarge}`);
  }
}

main().catch(console.error);
