import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── MOCK QUERY BUILDER ───────────────────────────────────────────────────────
// Simule l'API Supabase pour le développement sans backend configuré.
// Retourne toujours { data: [], error: null } pour toutes les opérations.
class MockQueryBuilder {
  private _result: { data: any[]; error: null } = { data: [], error: null };

  eq(_col: string, _val: unknown): this { return this; }
  neq(_col: string, _val: unknown): this { return this; }
  gt(_col: string, _val: unknown): this { return this; }
  gte(_col: string, _val: unknown): this { return this; }
  lt(_col: string, _val: unknown): this { return this; }
  lte(_col: string, _val: unknown): this { return this; }
  like(_col: string, _val: string): this { return this; }
  ilike(_col: string, _val: string): this { return this; }
  in(_col: string, _vals: unknown[]): this { return this; }
  is(_col: string, _val: unknown): this { return this; }
  order(_col: string, _opts?: { ascending?: boolean }): this { return this; }
  limit(_count: number): this { return this; }
  range(_from: number, _to: number): this { return this; }
  single(): Promise<{ data: null; error: null }> {
    return Promise.resolve({ data: null, error: null });
  }
  then<T>(resolve: (v: { data: any[]; error: null }) => T): Promise<T> {
    return Promise.resolve(this._result).then(resolve);
  }
}

function createMockClient(): SupabaseClient {
  const mockFrom = (_table: string) => {
    const q = new MockQueryBuilder();
    return {
      select: (_columns?: string) => q,
      insert: (_values: unknown) => q,
      update: (_values: unknown) => q,
      upsert: (_values: unknown, _opts?: unknown) => q,
      delete: () => q,
    };
  };
  return { from: mockFrom } as unknown as SupabaseClient;
}

// ─── INITIALISATION ───────────────────────────────────────────────────────────
function initSupabase(): SupabaseClient {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }

  if (typeof window !== "undefined") {
    console.warn(
      "[Guilde Otaku] Variables Supabase manquantes — mode démo activé.\n" +
      "→ Créez .env.local avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createMockClient();
}

export const supabase: SupabaseClient = initSupabase();

