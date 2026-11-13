// Client navigateur des écritures admin : même forme de réponse que Supabase
// ({ data, error }) pour remplacer les appels directs sans changer les écrans.
import type { AdminTable, RowId } from "./admin-db";

type Result = { data: { id: RowId }[] | null; error: { message: string } | null };

async function call(body: Record<string, unknown>): Promise<Result> {
  try {
    const res = await fetch("/api/admin/db", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = res.status === 401 ? "Session expirée : reconnecte-toi" : json?.error || `Erreur ${res.status}`;
      return { data: null, error: { message } };
    }
    return { data: json?.data ?? [], error: null };
  } catch {
    return { data: null, error: { message: "Serveur injoignable" } };
  }
}

export const adminDb = {
  insert: (table: AdminTable, rows: Record<string, unknown> | Record<string, unknown>[]) =>
    call({ table, op: "insert", rows: Array.isArray(rows) ? rows : [rows] }),
  update: (table: AdminTable, id: RowId, values: Record<string, unknown>) =>
    call({ table, op: "update", id, values }),
  remove: (table: AdminTable, id: RowId) => call({ table, op: "delete", id }),
};
