// Son de Guilde Fighters : bruitages synthétisés (aucun fichier audio), voix de l'annonceur
// (synthèse vocale du navigateur, en français) et une musique originale par arène,
// jouée par un petit séquenceur en ondes carrées, triangle et bruit (façon console 16 bits).
import type { MatchEvent, MatchState } from "./engine";

const KEY = "guilde-fighters-audio";
export interface AudioPrefs { sfx: boolean; music: boolean; voice: boolean }
export function audioPrefs(): AudioPrefs {
  try { const p = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (p && typeof p === "object") return { sfx: p.sfx !== false, music: p.music !== false, voice: p.voice !== false }; } catch { /* stockage indisponible */ }
  return { sfx: true, music: true, voice: true };
}
export function saveAudioPrefs(p: AudioPrefs) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* stockage indisponible */ } }

// ─── Musiques : une boucle de 4 mesures par arène (notes MIDI, 0 = silence) ───
interface Track { bpm: number; lead: number[]; bass: number[]; drums: string; wave: OscillatorType }
const TRACKS: Record<string, Track> = {
  dojo: { bpm: 132, wave: "square",
    lead: [69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 69, 72, 0, 0, 0, 69, 0, 72, 74, 76, 79, 76, 74, 72, 0, 74, 72, 69, 0, 0, 0],
    bass: [45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 43, 43, 55, 43, 45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 40, 40, 52, 40],
    drums: "k.h.s.h.k.k.s.h.k.h.s.h.k.k.s.sh" },
  toits: { bpm: 148, wave: "sawtooth",
    lead: [64, 0, 67, 0, 71, 69, 67, 64, 62, 0, 64, 0, 67, 0, 0, 0, 64, 0, 67, 0, 71, 74, 71, 69, 67, 0, 69, 71, 72, 71, 69, 67],
    bass: [40, 40, 52, 40, 40, 40, 52, 40, 38, 38, 50, 38, 38, 38, 50, 38, 36, 36, 48, 36, 36, 36, 48, 36, 38, 38, 50, 38, 43, 43, 55, 43],
    drums: "k.hsk.hsk.hsk.hsk.hsk.hsk.hsk.ss" },
  temple: { bpm: 104, wave: "triangle",
    lead: [74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0, 64, 0, 67, 69, 72, 0, 69, 0, 67, 0, 64, 0, 62, 0, 0, 0, 0, 0, 0, 0],
    bass: [50, 0, 57, 0, 50, 0, 57, 0, 48, 0, 55, 0, 48, 0, 55, 0, 46, 0, 53, 0, 46, 0, 53, 0, 45, 0, 52, 0, 45, 0, 52, 0],
    drums: "k...h...s...h...k...h...s...h.h." },
  plage: { bpm: 140, wave: "square",
    lead: [72, 74, 76, 0, 79, 0, 76, 74, 72, 0, 74, 0, 76, 0, 0, 0, 77, 76, 74, 0, 72, 0, 74, 76, 79, 0, 81, 0, 79, 0, 0, 0],
    bass: [48, 0, 55, 48, 53, 0, 60, 53, 55, 0, 62, 55, 48, 0, 55, 48, 53, 0, 60, 53, 48, 0, 55, 48, 55, 0, 62, 55, 55, 0, 59, 55],
    drums: "k.hsk.hsk.hsk.hsk.hsk.hsk.hsks.s" },
  stade: { bpm: 156, wave: "square",
    lead: [76, 0, 76, 79, 0, 81, 79, 76, 74, 0, 74, 76, 0, 79, 76, 74, 72, 0, 72, 74, 0, 76, 74, 72, 71, 0, 72, 74, 76, 79, 81, 83],
    bass: [40, 52, 40, 52, 40, 52, 40, 52, 38, 50, 38, 50, 38, 50, 38, 50, 36, 48, 36, 48, 36, 48, 36, 48, 35, 47, 35, 47, 38, 50, 43, 55],
    drums: "kkhsk.hskkhsk.hskkhsk.hskkhsssss" },
};
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class FightAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private nextAt = 0;
  private stepNo = 0;
  private track: Track | null = null;
  prefs: AudioPrefs;

  constructor(prefs: AudioPrefs = audioPrefs()) { this.prefs = prefs; }

  private ensure(): AudioContext | null {
    if (this.ctx) { if (this.ctx.state === "suspended") void this.ctx.resume(); return this.ctx; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const c = new AC();
      this.ctx = c;
      this.master = c.createGain(); this.master.gain.value = 0.55; this.master.connect(c.destination);
      this.musicBus = c.createGain(); this.musicBus.gain.value = 0.22; this.musicBus.connect(this.master);
      const len = Math.floor(c.sampleRate * 0.5);
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return c;
    } catch { return null; }
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, at = 0, bus?: GainNode | null) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus ?? this.master!); o.start(t); o.stop(t + dur + 0.02);
  }
  private burst(dur: number, vol: number, freq: number, at = 0, bus?: GainNode | null) {
    const c = this.ctx; if (!c || !this.noise) return;
    const t = c.currentTime + at;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.9;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus ?? this.master!); src.start(t); src.stop(t + dur + 0.02);
  }

  // ── Bruitages ─────────────────────────────────────────────────────────────
  hit(heavy: boolean) { if (!this.prefs.sfx || !this.ensure()) return; this.burst(heavy ? 0.18 : 0.09, heavy ? 0.9 : 0.6, heavy ? 900 : 1800); this.tone("square", heavy ? 160 : 260, 60, heavy ? 0.16 : 0.08, heavy ? 0.35 : 0.2); }
  block() { if (!this.prefs.sfx || !this.ensure()) return; this.tone("square", 1400, 900, 0.05, 0.15); this.burst(0.05, 0.3, 4000); }
  whoosh() { if (!this.prefs.sfx || !this.ensure()) return; this.burst(0.12, 0.25, 2600); }
  special() { if (!this.prefs.sfx || !this.ensure()) return; this.tone("sawtooth", 220, 880, 0.3, 0.2); this.burst(0.3, 0.3, 1200, 0.05); }
  superFx() { if (!this.prefs.sfx || !this.ensure()) return; [0, 0.08, 0.16].forEach((d, i) => this.tone("square", 330 * (i + 1), 660 * (i + 1), 0.22, 0.18, d)); this.burst(0.5, 0.4, 600, 0.1); }
  ko() { if (!this.prefs.sfx || !this.ensure()) return; this.tone("sawtooth", 300, 40, 0.9, 0.35); this.burst(0.6, 0.7, 300); }
  throwFx() { if (!this.prefs.sfx || !this.ensure()) return; this.burst(0.25, 0.7, 400); this.tone("triangle", 120, 50, 0.3, 0.4); }

  // ── Annonceur : voix française du navigateur, si elle existe ──────────────
  say(text: string) {
    if (!this.prefs.voice || typeof speechSynthesis === "undefined") return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith("fr"));
      if (v) u.voice = v;
      u.lang = "fr-FR"; u.rate = 1.05; u.pitch = 0.7; u.volume = 1;
      speechSynthesis.speak(u);
    } catch { /* synthèse vocale indisponible */ }
  }

  // ── Musique ───────────────────────────────────────────────────────────────
  startMusic(stageId: string) {
    this.stopMusic();
    if (!this.prefs.music) return;
    const c = this.ensure(); if (!c) return;
    this.track = TRACKS[stageId] ?? TRACKS.dojo;
    this.stepNo = 0; this.nextAt = c.currentTime + 0.1;
    const tick = () => {
      const tr = this.track; if (!tr || !this.ctx) return;
      const step = 60 / tr.bpm / 2; // croches
      while (this.nextAt < this.ctx.currentTime + 0.25) {
        const i = this.stepNo % tr.lead.length, at = this.nextAt - this.ctx.currentTime;
        if (tr.lead[i]) this.tone(tr.wave, hz(tr.lead[i]), hz(tr.lead[i]) * 0.998, step * 0.9, 0.35, at, this.musicBus);
        if (tr.bass[i % tr.bass.length]) this.tone("triangle", hz(tr.bass[i % tr.bass.length]), hz(tr.bass[i % tr.bass.length]), step * 0.95, 0.6, at, this.musicBus);
        const dr = tr.drums[i % tr.drums.length];
        if (dr === "k") this.tone("sine", 140, 40, 0.14, 0.9, at, this.musicBus);
        if (dr === "s") this.burst(0.12, 0.5, 1800, at, this.musicBus);
        if (dr === "h") this.burst(0.03, 0.25, 7000, at, this.musicBus);
        this.nextAt += step; this.stepNo++;
      }
      this.timer = window.setTimeout(tick, 60);
    };
    tick();
  }
  duck(on: boolean) { if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.06 : 0.22, this.ctx.currentTime, 0.1); }
  stopMusic() { window.clearTimeout(this.timer); this.track = null; }
  close() { this.stopMusic(); try { speechSynthesis?.cancel(); } catch { /* rien */ } void this.ctx?.close(); this.ctx = null; }

  /** Réagit aux événements du combat (sons et annonces). */
  onEvents(events: MatchEvent[], s: MatchState) {
    const kos = events.filter((e) => e.type === "ko").length;
    for (const e of events) {
      if (e.type === "hit") { if (e.blocked) this.block(); else this.hit(e.heavy); }
      else if (e.type === "special") { if (e.super) this.superFx(); else this.special(); this.say(e.name); }
      else if (e.type === "throw") this.throwFx();
      else if (e.type === "roundStart") this.say(s.opts.training ? "Entraînement" : s.mode === "team" ? `Combat ${e.round}` : `Manche ${e.round}`);
      else if (e.type === "fight") this.say("Combat !");
      else if (e.type === "ko") {
        this.ko();
        if (kos >= 2) this.say("Double K.O. !");
        else this.say(s.fighters[e.side === 0 ? 1 : 0].hp >= 1000 ? "Parfait !" : "K.O. !");
      }
      else if (e.type === "timeOver") this.say("Temps écoulé");
      else if (e.type === "matchEnd" && e.winner !== null) this.say(`${s.fighters[e.winner].profile.name} gagne !`);
    }
  }
}
