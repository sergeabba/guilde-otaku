#!/usr/bin/env node
// romaji:lint — repère l'écriture japonaise (kana, kanji) susceptible d'être affichée.
// Lecture seule. Par défaut : le code source (app/, lib/, data/).
// --db : contrôle aussi les champs texte des membres en base (anon, lecture seule).
// Sortie non nulle si quelque chose est trouvé, pour bloquer une CI.
//
// Exclusions : lib/member-extras.ts (définit l'expression de détection) et les champs
// `titleNative`, conservés en interne pour l'enrichissement mais jamais affichés.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const JAPANESE = /[　-〿぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;
const ROOTS = ["app", "lib", "data"];
const EXT = /\.(tsx?|jsx?|mjs|css)$/;
const ALLOW = new Set([join("lib", "member-extras.ts")]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

const findings = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(".", file);
    if (ALLOW.has(rel.split(sep).join(sep))) continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (JAPANESE.test(line) && !/titleNative/.test(line)) findings.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`);
    });
  }
}

if (process.argv.includes("--db")) {
  try {
    const { config } = await import("dotenv");
    config({ path: ".env.local", quiet: true });
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await sb.from("fighters").select("id, name, rank, bio, badge, rankjp, special, hidden");
    if (error) throw error;
    for (const m of data) {
      for (const [field, value] of Object.entries({ name: m.name, rank: m.rank, bio: m.bio, badge: m.badge, rankjp: m.rankjp, special: JSON.stringify(m.special ?? "") })) {
        if (typeof value === "string" && JAPANESE.test(value)) {
          // rankjp n'est plus affiché nulle part : signalé pour information seulement.
          findings.push(`base fighters#${m.id}.${field}${field === "rankjp" ? " (non affiché)" : ""}${m.hidden ? " (membre masqué)" : ""}  ${value.slice(0, 80)}`);
        }
      }
    }
  } catch (err) {
    console.error("Contrôle de la base impossible :", err?.message ?? err);
    process.exitCode = 2;
  }
}

if (findings.length) {
  console.log(`${findings.length} occurrence(s) d'écriture japonaise :\n` + findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Aucune écriture japonaise trouvée.");
}
