// Joueur sans compte : identifiant aléatoire de l'appareil + membre choisi ou pseudo.
import { hasJapanese } from "../member-extras";
import { getPublicMembers } from "../members-server";

export const DEVICE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface Player { device: string; member_id: number | null; player_name: string | null }

/** Valide le joueur envoyé par le navigateur ; renvoie un message d'erreur sinon. */
export async function parsePlayer(body: unknown): Promise<Player | string> {
  const o = (body ?? {}) as Record<string, unknown>;
  const device = typeof o.device === "string" ? o.device : "";
  if (!DEVICE.test(device)) return "Identifiant d'appareil invalide.";
  let member_id: number | null = null;
  if (o.memberId != null) {
    const id = Number(o.memberId);
    const members = await getPublicMembers().catch(() => []);
    if (!Number.isInteger(id) || !members.some((m) => m.id === id)) return "Membre inconnu.";
    member_id = id;
  }
  let player_name: string | null = null;
  if (typeof o.name === "string" && o.name.trim()) {
    const n = o.name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 40);
    if (!n || hasJapanese(n)) return "Pseudo invalide (lettres latines, 40 caractères au plus).";
    player_name = n;
  }
  return { device, member_id, player_name };
}

// Limite simple par adresse (instance serveur).
const hits = new Map<string, number[]>();
export function limited(ip: string, max = 30): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
export const ipOf = (h: Headers) => h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
