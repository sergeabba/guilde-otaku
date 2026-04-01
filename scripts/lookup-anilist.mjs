// Script to look up AniList IDs for Dossier du Bash entries

async function searchAniList(query, type = "ANIME") {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ($search: String, $type: MediaType) {
          Page(perPage: 5) {
            media(search: $search, type: $type, sort: SEARCH_MATCH) {
              id
              title { romaji english native }
              coverImage { extraLarge large }
              format
              status
              startDate { year }
            }
          }
        }
      `,
      variables: { search: query, type },
    }),
  });
  const json = await res.json();
  return json?.data?.Page?.media || [];
}

const queries = [
  "Observation Log of my Fiancée Who Calls Herself a Villainess",
  "Akuyaku Reijou to Yobareteiru",
  "The Klutzy Class Monitor and the Girl with the Short Skirt",
  "Donkusai Fuuki Iin to Skirt-take ga Mijikai Onna no Ko",
  "I Made Friends with the Second Prettiest Girl in My Class",
  "Class de 2-banme ni Kawaii Onna no Ko to Tomodachi ni Natta",
  "Tadaima, Ojamasaremasu",
  "Needy Girl Overdose",
  "NEEDY GIRL OVERDOSE",
  "Himitsu no AiPri",
  "Onegai My Melody",
  "Ghost Concert",
  "Ghost Concert Missing songs",
  "Eren the Southpaw",
  "Hidarikiki no Eren",
  "Gal ni Yasashii Otaku-kun",
  "The Warrior Princess and the Barbaric Prince",
  "Senshi no Hime to Yaban na Ouji",
  "Kujima Utaeba Ie Hororo",
  "Kamiina Botan Yoeru Sugata wa Yuri no Hana",
  "Botan Kamiina",
  "Yowayowa Sensei",
  "I Want to End This Love Game",
  "Koi wo Owari ni Shitai",
  "Touken Ranbu Kai",
  "Shiki no Agents",
  "Agents of the Four Seasons",
  "Maid-san wa Taberu dake",
  "Go For It Nakamura",
  "Ganbare Nakamura-kun",
  "Always a Catch",
  "Kirio Fan Club",
  "Haibara Teenage New Game",
  "Haibara-kun no Tsuyokute New Game",
  "MegaOre",
  "Megami no Cafe Terrace",
  "Megami Isekai",
  "Candy Caries",
  "Drops of God",
  "Kami no Shizuku",
  "Ascendance of a Bookworm",
  "Honzuki no Gekokujou",
];

async function main() {
  for (let i = 0; i < queries.length; i++) {
    const s = queries[i];
    const results = await searchAniList(s);
    console.log(`\n=== "${s}" ===`);
    if (results.length === 0) {
      console.log("  (no results)");
    } else {
      results.slice(0, 3).forEach((m) => {
        console.log(
          `  ID: ${m.id} | ${m.title.romaji} | EN: ${m.title.english || "N/A"} | ${m.format} | ${m.startDate?.year || "?"} | ${m.status}`
        );
      });
    }
    // Rate limit: wait 500ms between requests
    if (i < queries.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

main().catch(console.error);
