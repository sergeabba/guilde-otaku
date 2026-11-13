// Écritures d'administration en base, exécutées côté serveur uniquement.
// Les écrans admin n'écrivent plus directement dans Supabase avec la clé publique :
// ils passent par /api/admin/db, protégé par la session admin, qui n'accepte
// que les tables et colonnes listées ici.

export const ADMIN_TABLES = {
  fighters: [
    "name", "rank", "birthday", "bio", "photo", "animechar", "color", "badge", "rankjp",
    "stats", "special", "photovideo", "animevideo", "hidden", "country", "position",
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
  return Object.fromEntries(entries.filter(([, val]) => val !== undefined));
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
