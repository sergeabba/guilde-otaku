// Effets d'interface : sons courts synthétisés (aucun fichier audio) et célébrations.
// Les sons se coupent dans le pied de page (préférence gardée sur l'appareil) et ne
// jouent jamais sans un geste du visiteur. Module navigateur.

const KEY = "gk-sounds";
let ctx: AudioContext | null = null;

export function soundsOn(): boolean {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setSounds(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent("gk:sounds", { detail: on }));
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !soundsOn()) return null;
  // Pas de son par-dessus une vidéo ou une musique en cours.
  if ([...document.querySelectorAll("audio, video")].some((m) => !(m as HTMLMediaElement).paused)) return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

/** Une note brève (onde, fréquence de départ et d'arrivée, durée, volume, décalage). */
function tone(a: AudioContext, type: OscillatorType, f0: number, f1: number, dur: number, vol: number, at = 0) {
  const t = a.currentTime + at;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

/** « Clic » de bouton : un petit pop sec. */
export function playClick() {
  const a = audio(); if (!a) return;
  tone(a, "triangle", 880, 420, 0.07, 0.05);
}
/** Choix validé (vote, bonne réponse) : deux notes qui montent. */
export function playOk() {
  const a = audio(); if (!a) return;
  tone(a, "square", 660, 660, 0.09, 0.035);
  tone(a, "square", 990, 990, 0.14, 0.035, 0.08);
}
/** Petite fanfare de victoire : arpège majeur puis accord tenu. */
export function playWin() {
  const a = audio(); if (!a) return;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(a, "square", f, f, 0.12, 0.04, i * 0.09));
  [1046.5, 783.99, 659.25].forEach((f) => tone(a, "triangle", f, f, 0.55, 0.035, 0.3));
}

export interface Celebration { title?: string; sub?: string; big?: boolean }
/** Pluie de pétales et tampon « Victoire » (voir Celebrate.tsx). */
export function celebrate(c: Celebration = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Celebration>("gk:celebrate", { detail: c }));
}
