// Module serveur uniquement (lit le système de fichiers) : ne pas importer côté client.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchMembers } from "../app/utils/dataAdapter";
import type { Member } from "../data/members";
import { parseMemberExtras, type MemberExtras } from "./member-extras";
export { shareVersion, memberCardUrl, memberOgUrl } from "./share";

export const SITE_URL = "https://guilde-otaku.vercel.app";

/** Identifiant de membre accepté dans une URL : entier positif raisonnable. */
export function parseMemberId(raw: string | null | undefined): number | null {
  if (!raw || !/^\d{1,6}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
}

/**
 * Données de démonstration pour la recette locale uniquement.
 * `GUILDE_EXTRAS_FIXTURE=chemin/vers/fichier.json` (format : { "<id>": MemberExtras }).
 * Ignoré en production : aucun favori fictif ne peut atteindre le site public.
 */
async function devFixture(): Promise<Record<string, MemberExtras> | null> {
  const path = process.env.GUILDE_EXTRAS_FIXTURE;
  if (process.env.NODE_ENV === "production" || !path) return null;
  try {
    const raw = JSON.parse(await readFile(join(process.cwd(), path), "utf8")) as Record<string, unknown>;
    const out: Record<string, MemberExtras> = {};
    for (const [id, value] of Object.entries(raw)) {
      const parsed = parseMemberExtras(value);
      if (parsed) out[id] = parsed;
    }
    return out;
  } catch {
    return null;
  }
}

/** Membres publics (non masqués), dans l'ordre de l'annuaire. */
export async function getPublicMembers(): Promise<Member[]> {
  const [members, fixture] = await Promise.all([fetchMembers(), devFixture()]);
  if (!fixture) return members;
  return members.map((m) => (fixture[m.id] ? { ...m, extras: { ...m.extras, ...fixture[m.id] } } : m));
}

export async function getPublicMember(id: number): Promise<{ member: Member; prev: Member | null; next: Member | null } | null> {
  const all = await getPublicMembers();
  const i = all.findIndex((m) => m.id === id);
  if (i < 0) return null;
  return {
    member: all[i],
    prev: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  };
}

/** URL absolue d'une image du membre (chemin local de /public ou URL Supabase). */
export function absoluteAsset(src: string | undefined, origin: string): string | null {
  if (!src) return null;
  if (/^https:\/\//.test(src)) return src;
  if (src.startsWith("/")) return origin + src;
  return null;
}
