import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// On initialise avec une version typée
let supabase: SupabaseClient;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase credentials missing. Using mock client.");
  const mockFrom = (_table: string): any => ({
    select: (_columns?: string) => ({
      order: async (_field: string, _opts?: { ascending: boolean }) => ({ data: [] as any[], error: null }),
    }),
    insert: async (_values: any) => ({ data: null, error: null }),
    delete: () => ({
      eq: async (_column: string, _value: any) => ({ data: null, error: null }),
    }),
  });
  supabase = { from: mockFrom } as unknown as SupabaseClient;
}

export { supabase };

