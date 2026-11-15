// members:validate et media:audit (cahier des charges V4.2, § 7B) — LECTURE SEULE.
// Lit la table `fighters` avec la clé publique et affiche un rapport ; n'écrit rien.
//
//   npm run members:validate                 rapport des fiches
//   npm run members:validate -- --links      + vérifie que chaque image répond
//   npm run members:validate -- --json       sortie JSON (pour un autre outil)
//
// Variables lues dans .env.local : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// (et SITE_ORIGIN pour les images locales, par défaut https://guilde-otaku.vercel.app).
// Code de sortie 1 s'il reste des erreurs (utile en intégration continue).
import { config } from "dotenv";
import { auditMedia, mediaRefs, validateMembers } from "../lib/services/member-quality.ts";

config({ path: ".env.local", quiet: true });
const args = new Set(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const origin = process.env.SITE_ORIGIN || "https://guilde-otaku.vercel.app";
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis (fichier .env.local).");
  process.exit(2);
}

const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/fighters?select=*&order=id`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error(`Lecture de la table fighters impossible : HTTP ${res.status}`); process.exit(2); }
const rows = await res.json();
const report = validateMembers(rows);
const media = args.has("--links") ? await auditMedia(mediaRefs(rows), origin) : null;

if (args.has("--json")) {
  console.log(JSON.stringify({ ...report, media }, null, 2));
} else {
  const icon = { error: "ERREUR ", warn: "ATTENTION", info: "info   " };
  console.log(`Contrôle de ${report.members} fiche(s) (${report.hidden} masquée(s)) : ${report.counts.error} erreur(s), ${report.counts.warn} avertissement(s), ${report.counts.info} info(s).\n`);
  for (const i of report.issues) console.log(`${icon[i.level]}  n°${String(i.memberId).padStart(3)}  ${i.member.padEnd(22).slice(0, 22)}  ${i.message}`);
  if (media) {
    console.log(`\nImages vérifiées : ${media.checked}, liens cassés : ${media.problems.length}`);
    for (const p of media.problems) console.log(`CASSÉ    n°${String(p.memberId).padStart(3)}  ${p.member.padEnd(22).slice(0, 22)}  ${p.label} (${p.status}) ${p.url}`);
  }
}
process.exit(report.counts.error || media?.problems.length ? 1 : 0);
