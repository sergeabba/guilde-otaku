// Sons d'interface de Fighters, synthétisés (aucun fichier) : curseur, validation, retour,
// impact du VS. Respecte le réglage « effets sonores » du jeu (audioPrefs). Le contexte audio
// n'est créé qu'après une première interaction (règle des navigateurs).
import { audioPrefs } from "./audio";

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined" || !audioPrefs().sfx) return null;
  try { ctx ??= new AudioContext(); if (ctx.state === "suspended") void ctx.resume(); return ctx; } catch { return null; }
}

function blip(freqs: number[], dur = 0.06, type: OscillatorType = "square", vol = 0.06, gap = 0.05) {
  const c = ac(); if (!c) return;
  freqs.forEach((f, i) => {
    const t = c.currentTime + i * gap, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  });
}

export const uiSound = {
  move: () => blip([880], 0.035, "square", 0.035),
  confirm: () => blip([660, 990], 0.08, "square", 0.06, 0.06),
  back: () => blip([520, 330], 0.07, "triangle", 0.06, 0.05),
  cpu: () => blip([1320], 0.025, "square", 0.02),
  impact: () => {
    const c = ac(); if (!c) return;
    const n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
    const g = c.createGain(); g.gain.value = 0.25; n.buffer = b; n.connect(g).connect(c.destination); n.start();
    blip([110, 70], 0.25, "sawtooth", 0.12, 0.02);
  },
};
