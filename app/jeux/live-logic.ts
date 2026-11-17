// Règles du quiz en direct (fonctions pures, partagées par l'hôte et les tests).
export const LIVE_ROUND_MS = 20_000;
export const LIVE_REVEAL_MS = 6_000;

export interface LiveAnswer { choice: number; ms: number }
export interface LivePeer { pid: string; name: string; image: string | null; host?: boolean }

/** 100 points par bonne réponse, plus jusqu'à 50 selon la rapidité (comme le quiz solo). */
export function livePoints(ok: boolean, ms: number): number {
  if (!ok) return 0;
  const t = Math.min(Math.max(ms, 0), LIVE_ROUND_MS);
  return 100 + Math.round(50 * (1 - t / LIVE_ROUND_MS));
}

/** Ajoute les points d'une manche ; renvoie les nouveaux totaux et le gain de chacun. */
export function applyRound(scores: Record<string, number>, answers: Record<string, LiveAnswer>, correct: number) {
  const next = { ...scores }, gains: Record<string, number> = {};
  for (const [pid, a] of Object.entries(answers)) {
    const pts = livePoints(a.choice === correct, a.ms);
    gains[pid] = pts;
    next[pid] = (next[pid] ?? 0) + pts;
  }
  return { scores: next, gains };
}

/** Classement : points décroissants. */
export function liveRanking(scores: Record<string, number>, peers: LivePeer[]) {
  const known = new Map(peers.map((p) => [p.pid, p]));
  const ids = [...new Set([...peers.map((p) => p.pid), ...Object.keys(scores)])];
  // Égalité : départagée par l'identifiant, pour que tous les téléphones affichent le même ordre.
  return ids.map((pid) => ({ pid, name: known.get(pid)?.name ?? "Joueur parti", image: known.get(pid)?.image ?? null, score: scores[pid] ?? 0, gone: !known.has(pid) }))
    .sort((a, b) => b.score - a.score || (a.pid < b.pid ? -1 : a.pid > b.pid ? 1 : 0));
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Code de salle à 5 caractères, sans lettres ambiguës (I, O, 0, 1). */
export function roomCode(rnd = Math.random): string {
  return Array.from({ length: 5 }, () => ALPHA[Math.floor(rnd() * ALPHA.length)]).join("");
}
export const isRoomCode = (s: string) => new RegExp(`^[${ALPHA}]{5}$`).test(s);
