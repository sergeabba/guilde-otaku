import { members as localMembers } from "../../data/members";
import type { Member } from "../../data/members";
import { supabase } from "../../lib/supabase";

/**
 * Fetch members from Supabase, with a local data fallback for development
 * without a configured backend.
 */
export async function fetchMembers(): Promise<Member[]> {
  try {
    const client: any = supabase;
    const { data } = await client.from("fighters").select("*").order("id", { ascending: true });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((m: any) => ({
        id: m.id,
        name: m.name,
        rank: (m.rank ?? m.rank as any) as any,
        birthday: m.birthday,
        bio: m.bio,
        photo: m.photo,
        animeChar: m.animechar ?? m.animeChar ?? "",
        color: m.color,
        badge: m.badge,
        rankJP: m.rankjp ?? m.rankJP,
        stats: m.stats ?? { force: 0, vitesse: 0, technique: 0 },
        special: m.special ?? { name: "", effect: "" },
      }));
    }
    // Fallback sur les données locales
    return localMembers.map((mm) => ({ ...mm }));
  } catch (e) {
    // En cas d'erreur réseau ou autre, fallback local
    return localMembers.map((mm) => ({ ...mm }));
  }
}
