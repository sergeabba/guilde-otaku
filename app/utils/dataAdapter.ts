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
    stats:      row.stats ?? defaultStats,
    special:    row.special ?? defaultSpecial,
    photoVideo: row.photovideo ?? undefined,
    animeVideo: row.animevideo ?? undefined,
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

// ─── FETCH BONS PLANS ─────────────────────────────────────────────────────────

import type { SupabaseBonPlanRow } from "../types";

// ─── LOCAL FALLBACK BONS PLANS ────────────────────────────────────────────────
const localBonsPlans: SupabaseBonPlanRow[] = [
  { id: 101, title: "Anime-Sama", desc: "La référence actuelle. Excellente plateforme de streaming anime communautaire.", url: "https://anime-sama.to/", category: "Animes", logo: "https://www.google.com/s2/favicons?domain=anime-sama.to&sz=128", fallback_icon: "Tv", color: "#8b5cf6", created_at: "" },
  { id: 102, title: "SushiScan", desc: "La meilleure base pour lire vos scans mangas en VF rapidement.", url: "https://sushiscan.net/", category: "Scans", logo: "https://www.google.com/s2/favicons?domain=sushiscan.net&sz=128", fallback_icon: "BookOpen", color: "#f43f5e", created_at: "" },
  { id: 103, title: "FRAnime", desc: "Site de stream anime très fluide, très complet et sans prise de tête.", url: "https://franime.fr/", category: "Animes", logo: "https://www.google.com/s2/favicons?domain=franime.fr&sz=128", fallback_icon: "Tv", color: "#f97316", created_at: "" },
  { id: 104, title: "VoirAnime", desc: "L'un des plus connus. Streaming d'animes très souvent mis à jour.", url: "https://voiranime.tv/", category: "Animes", logo: "https://www.google.com/s2/favicons?domain=voiranime.com&sz=128", fallback_icon: "Tv", color: "#3b82f6", created_at: "" },
  { id: 106, title: "Movix", desc: "Le bon plan du Don pour le streaming de vos Séries et Films classiques.", url: "https://movix.rodeo/", category: "Films/Séries", logo: "https://www.google.com/s2/favicons?domain=movix.rodeo&sz=128", fallback_icon: "Film", color: "#eab308", created_at: "" },
  { id: 109, title: "MovieBox", desc: "Excellente alternative de stream film pour vos soirées cinéma.", url: "https://moviebox.ph/", category: "Films/Séries", logo: "https://www.google.com/s2/favicons?domain=moviebox.ph&sz=128", fallback_icon: "Film", color: "#14b8a6", created_at: "" },
  { id: 111, title: "WiTV", desc: "La solution parfaite pour regarder la telé en Stream et tout le reste.", url: "https://witv.team/", category: "Utiles", logo: "https://www.google.com/s2/favicons?domain=witv.team&sz=128", fallback_icon: "Tv", color: "#f43f5e", created_at: "" },
  { id: 112, title: "Ygg", desc: "Le tracker de référence pour retrouver tous les torrents fr.", url: "https://ygg.gratis/", category: "Utiles", logo: "https://www.google.com/s2/favicons?domain=ygg.gratis&sz=128", fallback_icon: "Globe", color: "#0ea5e9", created_at: "" },
  { id: 1, title: "Crunchyroll", desc: "Le géant du streaming. Indispensable pour les simulcasts officiels.", url: "https://www.crunchyroll.com", category: "Animes", logo: "https://cdn.simpleicons.org/crunchyroll/f97316", fallback_icon: "Tv", color: "#f97316", created_at: "" },
];

export async function fetchBonsPlans(): Promise<SupabaseBonPlanRow[]> {
  try {
    const { data, error } = await supabase
      .from("bons_plans")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    
    // Si la DB est vide, on renvoie les archives locales
    if (!data || data.length === 0) {
      return localBonsPlans;
    }
    
    return data as SupabaseBonPlanRow[];
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[dataAdapter] Impossible de fetch bons_plans, fallback local activé:", err);
    }
    return localBonsPlans;
  }
}
