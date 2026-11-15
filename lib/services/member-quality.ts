// Contrôle qualité des fiches membres (cahier des charges V4.2, § 7B « members:validate »
// et « media:audit »). LECTURE SEULE : rien n'est corrigé ni effacé automatiquement,
// on produit un rapport lisible. La même logique sert au script CLI
// (scripts/members-validate.mjs) et au panneau « Contrôles » de l'administration.
//
import { hasJapanese, parseMemberExtras, sameWork, type FavoriteWork } from "../member-extras";

export type Level = "error" | "warn" | "info";

export interface QualityIssue {
  memberId: number;
  member: string;
  level: Level;
  code: string;
  message: string;
}

export interface QualityReport {
  checkedAt: string;
  members: number;
  hidden: number;
  issues: QualityIssue[];
  counts: Record<Level, number>;
}

/** Ligne brute de la table `fighters` (seuls les champs contrôlés). */
export interface RawMemberRow {
  id: number;
  name?: string | null;
  birthday?: string | null;
  bio?: string | null;
  badge?: string | null;
  rankjp?: string | null;
  photo?: string | null;
  animechar?: string | null;
  hidden?: boolean | null;
  extras?: unknown;
}

const MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Date d'anniversaire lisible par le site (« 21 juin », « 01 Août »). */
export function birthdayOk(b: string | null | undefined): boolean {
  const m = /^(\d{1,2})\s+([a-zà-ÿ]+)$/i.exec((b ?? "").trim());
  if (!m) return false;
  const day = Number(m[1]);
  return day >= 1 && day <= 31 && MONTHS.includes(fold(m[2]));
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const rawExtras = (v: unknown): Record<string, unknown> | null => {
  let x = v;
  if (typeof x === "string") { try { x = JSON.parse(x); } catch { return {}; } }
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
};
const pathOk = (s: string) => /^https:\/\//.test(s) || /^\/[\w./%-]+$/.test(s);

/** Rapport de qualité pour toutes les fiches (y compris masquées, signalées comme telles). */
export function validateMembers(rows: RawMemberRow[], now = new Date()): QualityReport {
  const issues: QualityIssue[] = [];
  const names = new Map<string, number[]>();
  const photos = new Map<string, number[]>();

  for (const r of rows) {
    const who = (r.name ?? "").trim() || `Membre n°${r.id}`;
    const add = (level: Level, code: string, message: string) => issues.push({ memberId: r.id, member: who, level, code, message });

    if (r.hidden) add("info", "hidden", "Fiche masquée : invisible sur le site public.");

    // Identité
    const name = (r.name ?? "").trim();
    if (!name) add("error", "name-missing", "Nom manquant.");
    else (names.get(fold(name)) ?? names.set(fold(name), []).get(fold(name))!).push(r.id);
    if (!birthdayOk(r.birthday)) add("warn", "birthday", `Anniversaire illisible par le site${r.birthday ? ` (« ${r.birthday} »)` : ""} : format attendu « 21 juin ».`);
    if (!(r.bio ?? "").trim()) add("info", "bio-empty", "Pas de présentation.");

    // Rōmaji uniquement (§ 0B) : aucun caractère japonais affiché.
    for (const [field, label] of [["name", "le nom"], ["bio", "la présentation"], ["badge", "la distinction"], ["rankjp", "le libellé de grade"]] as const) {
      const v = r[field];
      if (typeof v === "string" && hasJapanese(v)) add("error", "japanese", `Caractères japonais dans ${label} : à écrire en rōmaji.`);
    }

    // Portraits
    for (const [field, label] of [["photo", "Photo réelle"], ["animechar", "Version anime"]] as const) {
      const v = (r[field] ?? "").trim();
      if (!v) add("error", `${field}-missing`, `${label} manquante.`);
      else if (!pathOk(v)) add("warn", `${field}-url`, `${label} : adresse inhabituelle (${v.slice(0, 60)}).`);
      else if (field === "photo") (photos.get(v) ?? photos.set(v, []).get(v)!).push(r.id);
    }

    // Profil enrichi (`extras`) : ce qui a été écarté à la lecture est signalé.
    const raw = rawExtras(r.extras);
    if (r.extras != null && r.extras !== "" && raw && !Object.keys(raw).length && typeof r.extras === "string") {
      add("error", "extras-json", "Profil enrichi illisible (JSON invalide) : favoris, musique et palmarès ignorés.");
    }
    const ex = parseMemberExtras(r.extras);
    if (raw) {
      for (const [key, label] of [["favoriteAnime", "anime favori"], ["favoriteManga", "manga favori"], ["music", "musique"], ["awards", "distinction"]] as const) {
        const items = arr(raw[key]);
        const after = (ex?.[key] as unknown[] | undefined)?.length ?? 0;
        // Valide seul mais absent de la liste lue : doublon écarté par la lecture.
        const valid = items.filter((it) => ((parseMemberExtras({ [key]: [it] })?.[key] as unknown[] | undefined)?.length ?? 0) > 0).length;
        const invalid = items.length - valid, dup = Math.max(0, valid - after);
        const plural = (n: number) => (n > 1 ? "s" : "");
        if (invalid) add("warn", `${key}-dropped`, `${invalid} ${label}${plural(invalid)} ignoré${plural(invalid)} (données invalides ou lien non reconnu).`);
        if (dup && key !== "music" && key !== "awards") add("warn", "favorite-duplicate", `${dup} ${label}${plural(dup)} en double, affiché${plural(dup)} une seule fois.`);
        else if (dup) add("warn", `${key}-duplicate`, `${dup} ${label}${plural(dup)} en double.`);
      }
    }
    const works: [FavoriteWork[], string][] = [[ex?.favoriteAnime ?? [], "anime"], [ex?.favoriteManga ?? [], "manga"]];
    for (const [list, kind] of works) {
      list.forEach((w, i) => {
        const title = w.titleLocalized || w.titleRomaji || "sans titre";
        if (!w.coverUrl) add("warn", "cover-missing", `Favori ${kind} « ${title} » sans jaquette.`);
        if (!w.titleLocalized && !w.titleRomaji) add("warn", "title-missing", `Favori ${kind} n°${i + 1} sans titre lisible.`);
        if (list.slice(0, i).some((o) => sameWork(o, w))) add("warn", "favorite-duplicate", `Favori ${kind} « ${title} » présent deux fois.`);
      });
    }
    if (!ex?.favoriteAnime?.length && !ex?.favoriteManga?.length) add("info", "no-favorites", "Aucun anime ni manga favori.");
    if (!ex?.music?.length) add("info", "no-music", "Aucune musique.");
  }

  const byId = new Map(rows.map((r) => [r.id, (r.name ?? "").trim() || `Membre n°${r.id}`]));
  for (const ids of names.values()) if (ids.length > 1) {
    for (const id of ids) issues.push({ memberId: id, member: byId.get(id)!, level: "warn", code: "name-duplicate", message: `Même nom que ${ids.filter((x) => x !== id).map((x) => `n°${x}`).join(", ")} : doublon possible.` });
  }
  for (const ids of photos.values()) if (ids.length > 1) {
    for (const id of ids) issues.push({ memberId: id, member: byId.get(id)!, level: "warn", code: "photo-duplicate", message: `Même photo que ${ids.filter((x) => x !== id).map((x) => `n°${x}`).join(", ")}.` });
  }

  const order: Record<Level, number> = { error: 0, warn: 1, info: 2 };
  issues.sort((a, b) => order[a.level] - order[b.level] || a.memberId - b.memberId);
  const counts = { error: 0, warn: 0, info: 0 } as Record<Level, number>;
  for (const i of issues) counts[i.level]++;
  return { checkedAt: now.toISOString(), members: rows.length, hidden: rows.filter((r) => r.hidden).length, issues, counts };
}

// ── media:audit ─────────────────────────────────────────────────────────────

export interface MediaRef { memberId: number; member: string; label: string; url: string }
export interface MediaProblem extends MediaRef { status: number | "timeout" | "error" }

/** Images à vérifier : portraits, jaquettes des favoris, pochettes des musiques. */
export function mediaRefs(rows: RawMemberRow[]): MediaRef[] {
  const out: MediaRef[] = [];
  for (const r of rows) {
    const member = (r.name ?? "").trim() || `Membre n°${r.id}`;
    if (r.photo) out.push({ memberId: r.id, member, label: "Photo réelle", url: r.photo });
    if (r.animechar) out.push({ memberId: r.id, member, label: "Version anime", url: r.animechar });
    const ex = parseMemberExtras(r.extras);
    for (const w of [...(ex?.favoriteAnime ?? []), ...(ex?.favoriteManga ?? [])]) {
      if (w.coverUrl) out.push({ memberId: r.id, member, label: `Jaquette « ${w.titleLocalized || w.titleRomaji || "?"} »`, url: w.coverUrl });
    }
    for (const t of ex?.music ?? []) if (t.cover) out.push({ memberId: r.id, member, label: `Pochette « ${t.title ?? t.id} »`, url: t.cover });
  }
  return out;
}

/**
 * Vérifie que chaque image répond (HEAD, puis GET si HEAD est refusé). Aucune
 * suppression : seulement la liste des liens cassés. Concurrence et délai bornés.
 */
export async function auditMedia(refs: MediaRef[], origin: string, { concurrency = 6, timeoutMs = 6000, fetchImpl = fetch } = {}): Promise<{ checked: number; problems: MediaProblem[] }> {
  const problems: MediaProblem[] = [];
  const seen = new Map<string, Promise<number | "timeout" | "error">>();
  const probe = async (url: string): Promise<number | "timeout" | "error"> => {
    const abs = url.startsWith("/") ? new URL(url, origin).toString() : url;
    for (const method of ["HEAD", "GET"]) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetchImpl(abs, { method, signal: ctrl.signal, redirect: "follow", headers: method === "GET" ? { Range: "bytes=0-0" } : {} });
        if (res.ok || res.status === 206) return res.status;
        if (method === "GET" || ![403, 405, 501].includes(res.status)) return res.status;
      } catch (e) {
        if (method === "GET") return (e as Error).name === "AbortError" ? "timeout" : "error";
      } finally { clearTimeout(t); }
    }
    return "error";
  };
  let i = 0;
  const worker = async () => {
    while (i < refs.length) {
      const ref = refs[i++];
      if (!seen.has(ref.url)) seen.set(ref.url, probe(ref.url));
      const status = await seen.get(ref.url)!;
      if (typeof status !== "number" || status >= 400) problems.push({ ...ref, status });
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, refs.length) }, worker));
  problems.sort((a, b) => a.memberId - b.memberId);
  return { checked: seen.size, problems };
}
