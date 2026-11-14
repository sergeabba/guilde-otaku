// Faux Supabase (lecture seule) pour tester les pages en local sans toucher aux
// vraies données. Sert /rest/v1/fighters depuis scripts/qa/fixture.json.
//
//   node scripts/qa/fake-supabase.mjs [port=5556]
//   NEXT_PUBLIC_SUPABASE_URL=http://localhost:5556 NEXT_PUBLIC_SUPABASE_ANON_KEY=test npx next dev -p 3008
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const port = Number(process.argv[2] ?? 5556);
const rows = JSON.parse(readFileSync(new URL("./fixture.json", import.meta.url), "utf8"));
// Autres tables : scripts/qa/fixture-<table>.json (facultatif).
const table = (name) => { try { return JSON.parse(readFileSync(new URL(`./fixture-${name}.json`, import.meta.url), "utf8")); } catch { return null; } };

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  const u = new URL(req.url, "http://x");
  res.setHeader("Content-Type", "application/json");
  if (u.pathname === "/rest/v1/fighters" && req.method === "GET") {
    const m = /eq\.(\d+)/.exec(u.searchParams.get("id") ?? "");
    const list = m ? rows.filter((r) => r.id === Number(m[1])) : rows;
    if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) return res.end(list[0] ? JSON.stringify(list[0]) : "null");
    return res.end(JSON.stringify(list));
  }
  const other = /^\/rest\/v1\/([a-z_]+)$/.exec(u.pathname);
  // Comptage (select … { count: "exact", head: true }) : en-tête Content-Range seul.
  if (other && req.method === "HEAD") {
    const n = other[1] === "fighters" ? rows.length : (table(other[1]) ?? []).length;
    res.setHeader("Content-Range", `0-${Math.max(n - 1, 0)}/${n}`);
    return res.end();
  }
  if (other && req.method === "GET") { const t = table(other[1]); if (t) return res.end(JSON.stringify(t)); }
  // Toute écriture est refusée : ce serveur ne sert qu'à afficher.
  if (req.method !== "GET") { res.statusCode = 405; return res.end(JSON.stringify({ message: "lecture seule" })); }
  res.end("[]");
}).listen(port, () => console.log(`faux Supabase sur http://localhost:${port}`));
