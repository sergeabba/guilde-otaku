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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  const u = new URL(req.url, "http://x");
  res.setHeader("Content-Type", "application/json");
  // Stockage en mémoire (recette de l'envoi direct de l'Atelier) : rien n'est écrit sur disque.
  const st = /^\/storage\/v1\/object\/(?:(upload\/sign)\/)?([a-z_-]+)\/?(.*)$/.exec(u.pathname);
  if (st) {
    globalThis.__files ??= new Map();
    const [, sign, bucket, rawName] = st, name = decodeURIComponent(rawName), key = `${bucket}/${name}`;
    if (sign && req.method === "POST") return res.end(JSON.stringify({ url: `/object/upload/sign/${key}?token=fake-${Date.now()}` }));
    if (sign && req.method === "PUT") {
      if (!u.searchParams.get("token")?.startsWith("fake-")) { res.statusCode = 400; return res.end(JSON.stringify({ message: "jeton invalide" })); }
      const chunks = []; req.on("data", (d) => chunks.push(d)); req.on("end", () => {
        let body = Buffer.concat(chunks), type = req.headers["content-type"];
        // Formulaire multipart : on garde la partie fichier.
        const bnd = /boundary=(.+)$/.exec(type ?? "")?.[1];
        if (bnd) {
          const parts = body.toString("latin1").split(`--${bnd}`);
          const file = parts.find((p) => /filename=/.test(p));
          if (file) { const i = file.indexOf("\r\n\r\n"); body = Buffer.from(file.slice(i + 4, file.length - 2), "latin1"); type = /Content-Type: (\S+)/i.exec(file)?.[1]; }
        }
        globalThis.__files.set(key, { body, type }); res.end(JSON.stringify({ Key: key }));
      });
      return;
    }
    if (!sign && req.method === "GET" && globalThis.__files.has(key)) { const f = globalThis.__files.get(key); res.setHeader("Content-Type", f.type || "application/octet-stream"); return res.end(f.body); }
    if (!sign && req.method === "DELETE") { let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => { for (const pfx of JSON.parse(body || "{}").prefixes ?? []) globalThis.__files.delete(`${bucket}/${pfx}`); res.end("[]"); }); return; }
    res.statusCode = 404; return res.end(JSON.stringify({ message: "Object not found" }));
  }
  if (u.pathname === "/rest/v1/fighters" && req.method === "GET") {
    const m = /eq\.(\d+)/.exec(u.searchParams.get("id") ?? "");
    const list = m ? rows.filter((r) => r.id === Number(m[1])) : rows;
    if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) return res.end(list[0] ? JSON.stringify(list[0]) : "null");
    return res.end(JSON.stringify(list));
  }
  // Actualités : tables gardées en mémoire (recette uniquement, rien n'est écrit sur disque).
  const memTable = /^\/rest\/v1\/(news_items|news_runs|game_plays|tier_lists|atelier|emoji_puzzles|film_polls|film_poll_votes)$/.exec(u.pathname)?.[1];
  if (memTable) {
    globalThis.__mem ??= { news_items: [], news_runs: [], game_plays: [], tier_lists: [], atelier: [], emoji_puzzles: [], film_polls: [], film_poll_votes: [], seq: 0 };
    const M = globalThis.__mem;
    const eqs = [...u.searchParams].filter(([k, v]) => v.startsWith("eq.") && k !== "select").map(([k, v]) => [k, v.slice(3)]);
    const match = (r) => eqs.every(([k, v]) => String(r[k]) === v);
    const list = () => {
      let rows = M[memTable].filter(match);
      const order = u.searchParams.get("order");
      if (order) { const [col, dir] = order.split("."); rows = [...rows].sort((a, b) => String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * (dir === "desc" ? -1 : 1)); }
      return rows.slice(0, Number(u.searchParams.get("limit") ?? 1000));
    };
    if (req.method === "HEAD") { const n = M[memTable].filter(match).length; res.setHeader("Content-Range", `0-${Math.max(n - 1, 0)}/${n}`); return res.end(); }
    if (req.method === "GET") return res.end(JSON.stringify(list()));
    let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => {
      const data = JSON.parse(body || "null");
      if (req.method === "POST") {
        const added = [];
        for (const row of [].concat(data)) {
          if (memTable === "news_items" && M.news_items.some((x) => x.source_url === row.source_url)) continue;
          // Upsert de la tier list : une ligne par (semaine, appareil).
          if (memTable === "tier_lists") { const old = M.tier_lists.find((x) => x.week === row.week && x.device === row.device); if (old) { Object.assign(old, row); added.push(old); continue; } }
          // Votes de films : un vote par (sondage, appareil) ; adresse de sondage unique.
          if (memTable === "film_poll_votes") { const old = M.film_poll_votes.find((x) => String(x.poll_id) === String(row.poll_id) && x.voter === row.voter); if (old) { Object.assign(old, row); added.push(old); continue; } }
          if (memTable === "film_polls" && M.film_polls.some((x) => x.slug === row.slug)) { res.statusCode = 409; return res.end(JSON.stringify({ message: "duplicate key value violates unique constraint" })); }
          if (memTable === "film_polls") { const full = { ...row, id: ++M.seq, created_at: new Date().toISOString() }; M.film_polls.push(full); added.push(full); continue; }
          if (memTable === "game_plays" && row.nonce && M.game_plays.some((x) => x.nonce === row.nonce)) { res.statusCode = 409; return res.end(JSON.stringify({ message: "duplicate key value violates unique constraint" })); }
          const full = memTable === "emoji_puzzles" ? { status: "pending", ...row, id: ++M.seq, created_at: new Date().toISOString() } : memTable === "game_plays" ? { ...row, id: ++M.seq, created_at: new Date().toISOString() } : memTable === "news_items" ? { status: "pending", edited_title: null, edited_excerpt: null, reviewed_at: null, created_at: new Date().toISOString(), ...row, id: ++M.seq } : { ...row, id: ++M.seq };
          M[memTable].push(full); added.push(full);
        }
        res.statusCode = 201; return res.end(JSON.stringify(added));
      }
      if (req.method === "PATCH") {
        const hit = M[memTable].filter(match); hit.forEach((r) => Object.assign(r, data));
        const one = (req.headers.accept ?? "").includes("vnd.pgrst.object");
        return res.end(JSON.stringify(one ? hit[0] ?? null : hit));
      }
      if (req.method === "DELETE") { const before = M[memTable].length; M[memTable] = M[memTable].filter((r) => !match(r)); res.statusCode = 204; return res.end(before === M[memTable].length ? "" : ""); }
      res.statusCode = 405; res.end("{}");
    });
    return;
  }
  const other = /^\/rest\/v1\/([a-z_]+)$/.exec(u.pathname);
  // Comptage (select … { count: "exact", head: true }) : en-tête Content-Range seul.
  if (other && req.method === "HEAD") {
    const n = other[1] === "fighters" ? rows.length : (table(other[1]) ?? []).length;
    res.setHeader("Content-Range", `0-${Math.max(n - 1, 0)}/${n}`);
    return res.end();
  }
  if (other && req.method === "GET") { const t = table(other[1]); if (t) return res.end(JSON.stringify(t)); }
  // Sondage du Bash : votes gardés en mémoire (recette uniquement, rien n'est écrit sur disque).
  if (u.pathname === "/rest/v1/bash_votes") {
    globalThis.__votes ??= [];
    const V = globalThis.__votes;
    if (req.method === "GET") return res.end(JSON.stringify(V));
    if (req.method === "DELETE") {
      const c = (u.searchParams.get("chronique") ?? "").replace(/^eq\./, ""), v = (u.searchParams.get("voter") ?? "").replace(/^eq\./, "");
      globalThis.__votes = V.filter((x) => !(x.chronique === c && x.voter === v));
      res.statusCode = 204; return res.end();
    }
    if (req.method === "POST") {
      let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => {
        for (const row of [].concat(JSON.parse(body || "[]"))) {
          const i = V.findIndex((x) => x.chronique === row.chronique && x.voter === row.voter);
          if (i >= 0) V[i] = { ...V[i], ...row }; else V.push(row);
        }
        res.statusCode = 201; res.end("[]");
      });
      return;
    }
  }
  // Toute écriture est refusée : ce serveur ne sert qu'à afficher.
  if (req.method !== "GET") { res.statusCode = 405; return res.end(JSON.stringify({ message: "lecture seule" })); }
  res.end("[]");
}).listen(port, () => console.log(`faux Supabase sur http://localhost:${port}`));
