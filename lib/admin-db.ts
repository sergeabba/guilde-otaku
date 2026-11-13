// Écritures d'administration en base, exécutées côté serveur uniquement.
// Les écrans admin n'écrivent plus directement dans Supabase avec la clé publique :
// ils passent par /api/admin/db, protégé par la session admin, qui n'accepte
// que les tables et colonnes listées ici.
import { parseMemberExtras } from "./member-extras";
import { RANK_FILTER_ORDER } from "../data/members";

export const ADMIN_TABLES = {
  fighters: [
    "name", "rank", "birthday", "bio", "photo", "animechar", "color", "badge", "rankjp",
    "stats", "special", "photovideo", "animevideo", "hidden", "country", "position",
    // Nécessite la migration 2026-11-13_fighters_extras.sql (sinon Supabase refuse la colonne).
    "extras",
  ],
  bibliotheque: [
    "title", "type", "cover_image", "banner_image", "score", "tier", "status", "synopsis",
    "avis_guilde", "trailer_url", "year", "episodes", "genres", "studio",
    "dossier_bash", "dossier_bash_tag", "dossier_bash_date", "dossier_bash_color",
  ],
  bons_plans: ["title", "desc", "url", "category", "color", "logo", "fallback_icon"],
} as const;

export type AdminTable = keyof typeof ADMIN_TABLES;
export type AdminOp = "insert" | "update" | "delete";
export type RowId = number | string;

export const MAX_INSERT_ROWS = 50;

export type AdminDbRequest =
  | { table: AdminTable; op: "insert"; rows: Record<string, unknown>[] }
  | { table: AdminTable; op: "update"; id: RowId; values: Record<string, unknown> }
  | { table: AdminTable; op: "delete"; id: RowId };

const isTable = (t: unknown): t is AdminTable => typeof t === "string" && Object.hasOwn(ADMIN_TABLES, t);

function parseId(v: unknown): RowId | null {
  if (typeof v === "number" && Number.isSafeInteger(v) && v > 0) return v;
  if (typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v)) return v;
  return null;
}

function parseValues(table: AdminTable, v: unknown): Record<string, unknown> | string {
  if (!v || typeof v !== "object" || Array.isArray(v)) return "valeurs invalides";
  const allowed: readonly string[] = ADMIN_TABLES[table];
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0) return "aucune valeur à enregistrer";
  const unknown = entries.map(([k]) => k).filter((k) => !allowed.includes(k));
  if (unknown.length) return `colonne non autorisée : ${unknown.join(", ")}`;
  const clean = Object.fromEntries(entries.filter(([, val]) => val !== undefined));
  if (table === "fighters") {
    const issue = fighterIssue(clean);
    if (issue) return issue;
    // Profil enrichi : toujours repassé par le validateur (URLs, YouTube, écriture japonaise).
    if ("extras" in clean) clean.extras = parseMemberExtras(clean.extras) ?? {};
  }
  return clean;
}

const MEDIA_FIELDS = ["photo", "animechar", "photovideo", "animevideo"] as const;

/** Règles métier d'un membre : seules les colonnes présentes sont contrôlées. */
function fighterIssue(v: Record<string, unknown>): string | null {
  if ("name" in v && (typeof v.name !== "string" || !v.name.trim() || v.name.length > 80)) return "nom obligatoire (80 caractères max)";
  if ("rank" in v && !(RANK_FILTER_ORDER as readonly unknown[]).includes(v.rank)) return "grade inconnu";
  if ("color" in v && (typeof v.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(v.color))) return "couleur invalide (format #RRGGBB)";
  if ("bio" in v && v.bio !== null && (typeof v.bio !== "string" || v.bio.length > 1200)) return "présentation trop longue (1200 caractères max)";
  for (const f of ["birthday", "badge", "country"] as const) {
    if (f in v && v[f] !== null && (typeof v[f] !== "string" || (v[f] as string).length > 80)) return `${f} invalide`;
  }
  for (const f of MEDIA_FIELDS) {
    if (!(f in v) || v[f] === null || v[f] === "") continue;
    const u = v[f];
    if (typeof u !== "string" || u.length > 600) return `${f} invalide`;
    const storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/` : null;
    const ok = u.startsWith("/") || /^https:\/\/[^\s]+$/.test(u) || (storage !== null && u.startsWith(storage) && !/\s/.test(u));
    if (!ok) return `${f} : adresse https ou chemin local attendu`;
  }
  return null;
}

/** Valide la requête du navigateur. Renvoie la requête normalisée ou un message d'erreur. */
export function parseAdminDbRequest(body: unknown): AdminDbRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "requête invalide" };
  const b = body as Record<string, unknown>;
  if (!isTable(b.table)) return { error: "table non autorisée" };
  const table = b.table;

  if (b.op === "insert") {
    const list = Array.isArray(b.rows) ? b.rows : [];
    if (list.length === 0 || list.length > MAX_INSERT_ROWS) return { error: `entre 1 et ${MAX_INSERT_ROWS} lignes` };
    const rows: Record<string, unknown>[] = [];
    for (const r of list) {
      const parsed = parseValues(table, r);
      if (typeof parsed === "string") return { error: parsed };
      rows.push(parsed);
    }
    return { table, op: "insert", rows };
  }

  if (b.op === "update" || b.op === "delete") {
    const id = parseId(b.id);
    if (id === null) return { error: "identifiant invalide" };
    if (b.op === "delete") return { table, op: "delete", id };
    const values = parseValues(table, b.values);
    if (typeof values === "string") return { error: values };
    return { table, op: "update", id, values };
  }

  return { error: "opération non autorisée" };
}
