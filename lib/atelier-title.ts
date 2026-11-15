// Noms lisibles pour les images de l'Atelier, déduits du nom de fichier quand
// aucun titre n'a été saisi : plus de « gemini-3-pro-image-preview… » ni de
// « 45488udueyey ». Les prénoms des membres collés dans le nom sont reconnus.

const GENERATOR = /(gemini|imagen|dall-?e|midjourney|chatgpt|gpt-?image|firefly|stable[ _-]?diffusion|leonardo|ideogram|flux)/i;
const STOP = new Set(["img", "image", "images", "photo", "pic", "picture", "dsc", "pxl", "screenshot", "capture", "copie", "copy", "final", "edit", "edited", "version", "v1", "v2", "hd", "2k", "4k", "8k", "preview", "pro", "the", "and", "with", "use", "first", "un", "une", "le", "la", "les", "de", "du", "des", "et", "a", "whatsapp", "untitled", "sans", "titre", "new", "nouveau"]);
const VOWELS = /[aeiouy]/g;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Sigles d'anime courants, écrits en capitales. */
const ACRONYMS = ["jjk", "mha", "dbz", "dbs", "aot", "snk", "hxh", "op", "fma", "jojo", "csm", "bnha", "kny", "opm"];
const word = (w: string) => (ACRONYMS.includes(w) && w !== "jojo" ? w.toUpperCase() : w === "jojo" ? "JoJo" : w[0].toUpperCase() + w.slice(1));

/** Jeton illisible : chiffres mêlés aux lettres, ou suite de lettres sans voyelles suffisantes. */
function isJunk(token: string): boolean {
  if (/\d/.test(token)) return true;
  if (token.length < 2) return true;
  if (ACRONYMS.includes(token)) return false;
  const vowels = (token.match(VOWELS) ?? []).length;
  if (token.length >= 5 && vowels / token.length < 0.25) return true;
  if (/(.)\1\1/.test(token)) return true;
  return false;
}

type Seg = { kind: "person" | "word"; text: string };

/**
 * « godwintraicy1.png » → « Godwin & Traicy » ; « don-bashjjk » → « Don · Bash JJK » ;
 * « gemini-3-pro-image-preview… » → null. `members` : prénoms connus, reconnus même collés.
 */
export function titleFromFilename(filename: string, members: string[] = []): string | null {
  const base = norm(filename.replace(/\.[a-z0-9]{2,5}$/i, ""));
  if (GENERATOR.test(base)) return null; // le reste est un prompt ou un horodatage
  // Prénoms connus, avec leur graphie d'origine (« Jaïze »).
  const known = new Map<string, string>();
  for (const m of members) {
    const first = (m.split(/[\s"«»]+/).find(Boolean) ?? "").replace(/[^\p{L}-]/gu, "");
    if (first.length >= 3) known.set(norm(first), first);
  }
  const keys = [...known.keys()].sort((a, b) => b.length - a.length);
  const segs: Seg[] = [];
  const pushWord = (w: string) => {
    if (!w || STOP.has(w)) return;
    // Sigle collé en fin de mot (« bashjjk » → « bash » + « jjk »).
    const acro = ACRONYMS.find((a) => w.length > a.length + 2 && w.endsWith(a));
    if (acro) { pushWord(w.slice(0, -acro.length)); segs.push({ kind: "word", text: word(acro) }); return; }
    if (!isJunk(w)) segs.push({ kind: "word", text: word(w) });
  };
  for (const raw of base.replace(/\d{4}-\d{2}-\d{2}t?[\d.:]*/g, " ").split(/[^a-z0-9]+/)) {
    let rest = raw.replace(/\d+$/, "");
    while (rest) {
      const hit = keys.map((k) => ({ k, i: rest.indexOf(k) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i)[0];
      if (!hit) { pushWord(rest); break; }
      if (hit.i > 0) pushWord(rest.slice(0, hit.i));
      segs.push({ kind: "person", text: known.get(hit.k)! });
      rest = rest.slice(hit.i + hit.k.length);
    }
  }
  // Doublons retirés, ordre du fichier conservé : « A & B · Mot Mot ».
  const seen = new Set<string>();
  const list = segs.filter((g) => !seen.has(g.text) && seen.add(g.text));
  let out = "";
  list.forEach((g, i) => {
    const prev = list[i - 1];
    out += !prev ? g.text : prev.kind === "person" && g.kind === "person" ? ` & ${g.text}` : prev.kind !== g.kind ? ` · ${g.text}` : ` ${g.text}`;
  });
  return out.replace(/[^\p{L}]/gu, "").length >= 3 ? out : null;
}

/** Un titre enregistré qui ressemble encore à un nom de fichier (à remplacer). */
export function looksLikeFilename(title: string): boolean {
  const t = norm(title);
  return GENERATOR.test(t) || /\.(png|jpe?g|webp|gif)$/.test(t) || t.split(/[^a-z0-9]+/).filter(Boolean).some((w) => /\d/.test(w) && /[a-z]/.test(w) && w.length >= 5);
}

/**
 * Titres affichés pour une liste d'images (ordre conservé) : titre saisi s'il est
 * propre, sinon titre déduit du fichier, sinon « Création n°07 ». Les doublons
 * sont numérotés (« Godwin & Traicy II »).
 */
export function atelierTitles(items: { filename: string; title?: string | null }[], members: string[] = []): string[] {
  let n = 0;
  const raw = items.map((it) => {
    const saved = it.title?.trim();
    if (saved && !looksLikeFilename(saved) && saved !== it.filename) return saved;
    const auto = titleFromFilename(it.filename, members);
    if (auto) return auto;
    n += 1;
    return `Création n°${String(n).padStart(2, "0")}`;
  });
  const seen = new Map<string, number>();
  const ROMAN = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return raw.map((t) => {
    const c = (seen.get(t) ?? 0) + 1;
    seen.set(t, c);
    return c > 1 ? `${t} ${ROMAN[c] ?? c}` : t;
  });
}
