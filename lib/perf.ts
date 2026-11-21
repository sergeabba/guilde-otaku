// Appareil lent : on allège les effets (fond vivant, reflets holographiques, particules).
// Signaux : peu de cœurs ou de mémoire, « économie de données », ou fluidité mesurée
// au démarrage (images par seconde trop basses). Le résultat est posé sur <html data-perf>.
// Module navigateur.

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };

/** Signaux immédiats (sans mesure). */
export function hardwareLite(n: Nav = navigator as Nav): boolean {
  const cores = n.hardwareConcurrency ?? 8, mem = n.deviceMemory ?? 8;
  return !!n.connection?.saveData || /(^|-)2g$/.test(n.connection?.effectiveType ?? "") || cores <= 2 || mem <= 2 || (cores <= 4 && mem <= 3);
}

/** Verdict d'après les durées d'images mesurées (ms) : lent si la médiane dépasse ~28 ms (< 36 i/s). */
export function framesLite(durations: number[]): boolean {
  if (durations.length < 20) return false;
  const s = [...durations].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] > 28;
}

export const isLite = () => typeof document !== "undefined" && document.documentElement.dataset.perf === "lite";

/** Pose le verdict, puis mesure ~1,5 s de fluidité ; prévient par l'événement « gk:perf ». */
export function detectPerf() {
  const root = document.documentElement;
  const set = (lite: boolean) => { if (lite && root.dataset.perf !== "lite") { root.dataset.perf = "lite"; window.dispatchEvent(new Event("gk:perf")); } };
  if (hardwareLite()) { set(true); return; }
  if (root.dataset.perf !== "lite") root.dataset.perf = "full";
  const times: number[] = [];
  let last = 0, start = 0;
  const tick = (t: number) => {
    if (document.hidden) return; // onglet caché : mesure faussée, on abandonne
    if (last) times.push(t - last);
    last = t; start ||= t;
    if (t - start < 1500) requestAnimationFrame(tick);
    else if (framesLite(times)) set(true); // pour cette visite seulement : une mesure ratée ne colle pas
  };
  // On mesure après le chargement, quand la page a fini de s'installer.
  window.setTimeout(() => requestAnimationFrame(tick), 1200);
}
