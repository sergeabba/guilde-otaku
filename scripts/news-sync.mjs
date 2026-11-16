// news:sync (cahier des charges V4.2, § 7B) : lit les flux RSS des médias suivis.
// Par défaut LECTURE SEULE (--dry-run implicite) : affiche ce qui serait mis en attente.
// Pour écrire réellement, utiliser le bouton « Récupérer maintenant » de l'admin
// (Actualités) ou la tâche planifiée : jamais de publication automatique.
//
//   npm run news:sync            aperçu des articles lus dans chaque flux
//   npm run news:sync -- --json  sortie JSON
import { NEWS_FEEDS, fetchFeed } from "../lib/news.ts";

const json = process.argv.includes("--json");
const out = [];
for (const feed of NEWS_FEEDS) {
  try {
    const items = await fetchFeed(feed);
    out.push({ source: feed.name, items });
    if (!json) {
      console.log(`\n${feed.name} : ${items.length} article(s) lus (rien n'est écrit)`);
      for (const it of items.slice(0, 8)) console.log(`  ${(it.published_at ?? "").slice(0, 10)}  ${it.title}`);
    }
  } catch (e) {
    out.push({ source: feed.name, error: e.message });
    if (!json) console.log(`\n${feed.name} : ÉCHEC (${e.message})`);
  }
}
if (json) console.log(JSON.stringify(out, null, 2));
