import { members as localMembers, Rank } from "../../data/members";
import type { Member } from "../../data/members";
import { supabase } from "../../lib/supabase";
import type { SupabaseMemberRow, FighterStats, SpecialAttack } from "../types";

// ─── CACHE MÉMOIRE ────────────────────────────────────────────────────────────
// Évite les refetch inutiles lors des navigations rapides entre pages.
// TTL de 5 minutes — suffisant pour une session normale.
const CACHE_TTL_MS = 5 * 60 * 1000;

let membersCache: Member[] | null = null;
let membersCacheTime = 0;

function isCacheValid(): boolean {
  return membersCache !== null && Date.now() - membersCacheTime < CACHE_TTL_MS;
}

export function invalidateMembersCache(): void {
  membersCache = null;
  membersCacheTime = 0;
}

// ─── MAPPER SUPABASE → MEMBER ─────────────────────────────────────────────────
function mapRowToMember(row: SupabaseMemberRow): Member {
  const defaultStats: FighterStats = { force: 0, vitesse: 0, technique: 0 };
  const defaultSpecial: SpecialAttack = { name: "—", effect: "—" };

  return {
    id:        row.id,
    name:      row.name,
    rank:      row.rank as Rank,
    birthday:  row.birthday,
    bio:       row.bio ?? "",
    photo:     row.photo ?? "",
    animeChar: row.animechar ?? "",
    color:     row.color ?? "#c9a84c",
    badge:     row.badge ?? undefined,
    rankJP:    row.rankjp ?? undefined,
    stats:     row.stats ?? defaultStats,
    special:   row.special ?? defaultSpecial,
  };
}

// ─── FETCH AVEC RETRY ─────────────────────────────────────────────────────────
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return fetchWithRetry(fn, retries - 1, delayMs * 2);
  }
}

// ─── FETCH MEMBERS ────────────────────────────────────────────────────────────
/**
 * Récupère les membres depuis Supabase avec :
 * - Cache mémoire (TTL 5 min)
 * - Retry automatique (2 tentatives avec backoff exponentiel)
 * - Fallback sur les données locales en cas d'échec
 */
export async function fetchMembers(): Promise<Member[]> {
  // Retourner le cache si valide
  if (isCacheValid()) {
    return membersCache!;
  }

  try {
    const result = await fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return data as SupabaseMemberRow[] | null;
    });

    if (Array.isArray(result) && result.length > 0) {
      const mapped = result.map(mapRowToMember);
      // Mettre en cache
      membersCache = mapped;
      membersCacheTime = Date.now();
      return mapped;
    }

    // Supabase a répondu mais sans données → fallback local
    return localMembers.map((m) => ({ ...m }));
  } catch (err) {
    // Erreur réseau ou Supabase → fallback local silencieux
    if (process.env.NODE_ENV === "development") {
      console.warn("[dataAdapter] Supabase indisponible, fallback local activé.", err);
    }
    return localMembers.map((m) => ({ ...m }));
  }
}

// ─── FETCH MEMBER BY ID ───────────────────────────────────────────────────────
/**
 * Récupère un membre spécifique par son ID.
 * Utilise le cache si disponible, sinon fetch individuel.
 */
export async function fetchMemberById(id: number): Promise<Member | null> {
  // Chercher dans le cache d'abord
  if (isCacheValid()) {
    return membersCache!.find((m) => m.id === id) ?? null;
  }

  // Sinon charger tous les membres (remplit le cache)
  const all = await fetchMembers();
  return all.find((m) => m.id === id) ?? null;
}
