"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Users, Home, Keyboard } from "lucide-react";
import { connectedPads, mergeInput, padInput, padPause } from "../../lib/fighters/gamepad";
import { createMatch, step, NO_INPUT, MAX_HP, MAX_METER, FPS, STAGE_W, STAGE_H, type Input, type MatchOptions, type MatchState, type MatchEvent } from "../../lib/fighters/engine";
import { STAGES, type Stage } from "../../lib/fighters/stages";
import { FightAudio, audioPrefs, saveAudioPrefs, type AudioPrefs } from "../../lib/fighters/audio";
import { aiInput, makeRng, newAiMemory, type AiLevel } from "../../lib/fighters/ai";
import { ArenaRenderer, lookFor, type Look } from "../../lib/fighters/render";
import type { Mode, RosterMember, Versus } from "./FightersApp";
import Ransom from "../components/Ransom";
import { rankAccents, type Rank } from "../config/ranks";
const accentOf = (m: RosterMember) => rankAccents[m.rank as Rank] ?? m.color ?? "#e8b931";

// Touches physiques (e.code) : elles restent au même endroit en AZERTY comme en QWERTY.
const KEYS: [Record<string, keyof Input>, Record<string, keyof Input>] = [
  { KeyA: "left", KeyD: "right", KeyW: "up", KeyS: "down", KeyU: "lp", KeyI: "hp", KeyJ: "lk", KeyK: "hk", KeyO: "special", KeyL: "super", KeyH: "dodge" },
  { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    Numpad4: "lp", Numpad5: "hp", Numpad1: "lk", Numpad2: "hk", Numpad6: "special", Numpad3: "super", Numpad0: "dodge",
    Digit7: "lp", Digit8: "hp", Digit9: "lk", Digit0: "hk", Minus: "special", Equal: "super", Period: "dodge" },
];

/** Fin de match transmise à l'application (Arcade, Survie : échelle d'adversaires). */
export interface MatchResult { winner: 0 | 1 | null; hp: [number, number]; bestCombo: [number, number] }

interface Hud {
  hp: [number, number]; names: [string, string]; ids: [number, number]; timer: number; round: number;
  wins: [number, number]; active: [number, number]; meter: [number, number]; phase: MatchState["phase"]; winner: 0 | 1 | null;
}

const snapshot = (s: MatchState): Hud => ({
  hp: [s.fighters[0].hp, s.fighters[1].hp],
  names: [s.fighters[0].profile.name, s.fighters[1].profile.name],
  ids: [s.fighters[0].profile.id, s.fighters[1].profile.id],
  timer: Math.ceil(s.timer / FPS), round: s.round, wins: [...s.wins], active: [...s.active],
  meter: [s.fighters[0].meter / MAX_METER, s.fighters[1].meter / MAX_METER],
  phase: s.phase, winner: s.winner,
});

/** Libellés des touches selon la disposition réelle du clavier (si le navigateur la donne). */
function useKeyLabels() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const kb = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard;
    kb?.getLayoutMap?.().then((m) => setMap(Object.fromEntries([...m.entries()].map(([k, v]) => [k, v.toUpperCase()])))).catch(() => {});
  }, []);
  return (code: string, fallback: string) => map[code] ?? fallback;
}

function TouchButton({ label, children, onChange, className = "" }: { label: string; children: React.ReactNode; onChange: (down: boolean) => void; className?: string }) {
  return (
    <button
      type="button" className={`fx-pad ${className}`} aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* capture facultative */ }
        onChange(true);
      }}
      onPointerUp={() => onChange(false)} onPointerCancel={() => onChange(false)} onLostPointerCapture={() => onChange(false)}
      onContextMenu={(e) => e.preventDefault()}
    >{children}</button>
  );
}

/**
 * Manette tactile à 8 directions : on glisse le pouce depuis le centre. Permet les
 * quarts de cercle (bas, bas-avant, avant) comme sur un stick d'arcade.
 */
function TouchStick({ onDir }: { onDir: (d: { left: boolean; right: boolean; up: boolean; down: boolean }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const active = useRef<number | null>(null);
  const update = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy), max = r.width / 2 - 14;
    const k = len > max ? max / len : 1;
    setKnob([dx * k, dy * k]);
    const dead = r.width * 0.16;
    if (len < dead) { onDir({ left: false, right: false, up: false, down: false }); return; }
    const a = Math.atan2(-dy, dx); // 0 = droite, π/2 = haut
    const sector = Math.round(a / (Math.PI / 4)); // -4..4
    onDir({ right: [-1, 0, 1].includes(sector), left: [3, 4, -3, -4].includes(sector), up: [1, 2, 3].includes(sector), down: [-1, -2, -3].includes(sector) });
  };
  const end = () => { active.current = null; setKnob([0, 0]); onDir({ left: false, right: false, up: false, down: false }); };
  return (
    <div
      ref={ref} className="fx-stick" role="group" aria-label="Manette : glisser pour se déplacer, sauter, s'accroupir"
      onPointerDown={(e) => { e.preventDefault(); active.current = e.pointerId; try { ref.current!.setPointerCapture(e.pointerId); } catch { /* facultatif */ } update(e); }}
      onPointerMove={(e) => { if (active.current === e.pointerId) update(e); }}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onContextMenu={(e) => e.preventDefault()}
    >
      <span className="fx-stick-ring" aria-hidden="true" />
      <span className="fx-stick-knob" aria-hidden="true" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
    </div>
  );
}

export default function FightScreen({ teams, mode, versus, level, labels, reduced, onRematch, onRoster, onHome, stage = STAGES[0], opts = {}, cpuP1 = false, onFinish, caption }: {
  teams: [RosterMember[], RosterMember[]]; mode: Mode; versus: Versus; level: AiLevel; labels: [string, string]; reduced: boolean;
  onRematch: () => void; onRoster: () => void; onHome: () => void;
  /** Arène choisie, variantes de match, IA aux deux commandes (Spectateur). */
  stage?: Stage; opts?: MatchOptions; cpuP1?: boolean;
  /** Si présent, la fin du match revient à l'application (pas d'écran de fin ici). */
  onFinish?: (r: MatchResult) => void;
  /** Mention sous le chrono (« Arcade 3/6 », « Survie : 4 victoires »…). */
  caption?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MatchState | null>(null);
  const inputs = useRef<[Input, Input]>([{ ...NO_INPUT }, { ...NO_INPUT }]);
  const touch = useRef<Input>({ ...NO_INPUT });
  const pausedRef = useRef(false);
  const viewRef = useRef(STAGE_W);
  const [viewW, setViewW] = useState(STAGE_W);
  const [paused, setPaused] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null);
  const [banner, setBanner] = useState<{ text: string; sub?: string; id: number; kind?: "round" | "fight" | "ko" } | null>(null);
  // Incrustation cinématique d'une super : regard du personnage en bande, nom découpé.
  const [cutin, setCutin] = useState<{ m: RosterMember; name: string; side: 0 | 1; id: number } | null>(null);
  const [combo, setCombo] = useState<{ side: 0 | 1; n: number; dmg: number; id: number } | null>(null);
  const [first, setFirst] = useState<{ side: 0 | 1; id: number } | null>(null);
  const keyLabel = useKeyLabels();
  const byId = useRef(new Map([...teams[0], ...teams[1]].map((m) => [m.id, m])));
  const looks = useRef<[Look, Look]>([lookFor(teams[0][0].id, teams[0][0].color), lookFor(teams[1][0].id, teams[1][0].color)]);

  // Son : bruitages, annonceur et musique de l'arène (réglables dans la pause).
  const audio = useRef<FightAudio | null>(null);
  const [sound, setSound] = useState<AudioPrefs>(() => (typeof window === "undefined" ? { sfx: true, music: true, voice: true } : audioPrefs()));
  const toggleSound = (k: keyof AudioPrefs) => setSound((p) => {
    const n = { ...p, [k]: !p[k] };
    saveAudioPrefs(n);
    if (audio.current) { audio.current.prefs = n; if (k === "music") { if (n.music) audio.current.startMusic(stage.id); else audio.current.stopMusic(); } }
    return n;
  });
  const setPause = useCallback((p: boolean) => { pausedRef.current = p; setPaused(p); audio.current?.duck(p); }, []);

  // Annonces façon MUGEN : manche, « Combat ! », K.-O., double K.-O., parfait, premier coup.
  const firstHit = useRef(false);
  const comboDmg = useRef(0);
  const announce = useCallback((events: MatchEvent[], s: MatchState) => {
    const kos = events.filter((e) => e.type === "ko").length;
    for (const e of events) {
      const id = s.frame;
      if (e.type === "roundStart") { firstHit.current = false; setBanner({ text: s.opts.training ? "Entraînement" : mode === "team" ? `Combat ${e.round}` : `Manche ${e.round}`, sub: `${s.fighters[0].profile.name} contre ${s.fighters[1].profile.name}`, id, kind: "round" }); }
      if (e.type === "fight") setBanner({ text: "Combat !", id, kind: "fight" });
      if (e.type === "ko") {
        const other = s.fighters[e.side === 0 ? 1 : 0];
        if (kos >= 2) setBanner({ text: "Double K.-O.", id, kind: "ko" });
        else setBanner({ text: other.hp >= MAX_HP ? "Parfait !" : "K.-O. !", sub: `${s.fighters[e.side].profile.name} est à terre`, id, kind: "ko" });
      }
      if (e.type === "timeOver") setBanner({ text: "Temps écoulé", id });
      if (e.type === "special") {
        if (e.super && !reduced) {
          const f = s.fighters[e.side];
          const m = teams[e.side].find((x) => x.id === f.profile.id);
          if (m) setCutin({ m, name: e.name, side: e.side, id });
          else setBanner({ text: e.name, sub: "Super", id });
        } else setBanner({ text: e.name, sub: e.super ? "Super" : "Attaque spéciale", id });
      }
      if (e.type === "revive") setBanner({ text: e.name, sub: `${s.fighters[e.side].profile.name} se relève`, id });
      if (e.type === "dizzy") setBanner({ text: "Étourdi !", sub: s.fighters[e.side].profile.name, id });
      if (e.type === "throw") setBanner({ text: "Projection", id });
      if (e.type === "hit" && !e.blocked) {
        comboDmg.current = e.combo >= 2 ? comboDmg.current + e.dmg : e.dmg;
        if (e.combo >= 2) setCombo({ side: e.side === 0 ? 1 : 0, n: e.combo, dmg: Math.round((comboDmg.current / MAX_HP) * 100), id });
        if (!firstHit.current && s.phase === "fight" && !s.opts.training) { firstHit.current = true; setFirst({ side: e.side === 0 ? 1 : 0, id }); }
      }
      if (e.type === "matchEnd") setBanner(null);
    }
  }, [mode]);

  // Boucle de jeu : pas fixe de 1/60 s, rendu à chaque image.
  useEffect(() => {
    const toProfile = (m: RosterMember) => ({ id: m.id, name: m.name, stats: m.stats ?? { force: 50, vitesse: 50, technique: 50 }, specialName: m.special?.name ?? "Onde de la Guilde" });
    const s = createMatch(mode, teams[0].map(toProfile), teams[1].map(toProfile), opts);
    stateRef.current = s;
    // Accès de test en développement uniquement (vérifications automatisées).
    if (process.env.NODE_ENV === "development") (window as unknown as { __fxState?: MatchState }).__fxState = s;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const renderer = new ArenaRenderer(ctx, () => looks.current, reduced, stage);
    const sfx = new FightAudio(audioPrefs());
    audio.current = sfx;
    sfx.startMusic(stage.id);
    sfx.onEvents(s.events, s);
    const rng = makeRng(Date.now() & 0xffff);
    const mem = newAiMemory(), mem0 = newAiMemory();
    let finished = false;
    announce(s.events, s);
    setHud(snapshot(s));

    // Cadrage : en portrait étroit, on montre une portion de l'arène qui suit l'action.
    const fit = () => {
      const narrow = window.innerWidth < 700 && window.innerHeight > window.innerWidth;
      const w = narrow ? 240 : STAGE_W;
      viewRef.current = w; setViewW(w);
    };
    fit(); window.addEventListener("resize", fit);
    let raf = 0, last = performance.now(), acc = 0, hudTick = 0, startHeld = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(100, now - last); last = now;
      // Start / Options : pause et reprise (sur l'appui, pas tant que le bouton est tenu).
      const start = connectedPads().some(padPause);
      if (start && !startHeld && s.phase !== "matchEnd") setPause(!pausedRef.current);
      startHeld = start;
      if (pausedRef.current || document.hidden) { renderer.draw(s, viewRef.current); return; }
      acc += dt;
      let steps = 0;
      while (acc >= 1000 / FPS && steps < 5) {
        // Manettes : la première joue J1, la deuxième J2 (à deux sur le même écran).
        const pads = connectedPads();
        let p1: Input = mergeInput(inputs.current[0], touch.current);
        if (pads[0]) p1 = mergeInput(p1, padInput(pads[0]));
        if (cpuP1) p1 = aiInput(s, 0, mem0, rng, level);
        const p2 = versus === "ia" ? aiInput(s, 1, mem, rng, level) : pads[1] ? mergeInput(inputs.current[1], padInput(pads[1])) : inputs.current[1];
        step(s, p1, p2);
        if (s.events.length) {
          renderer.onEvents(s.events, s);
          sfx.onEvents(s.events, s);
          announce(s.events, s);
          if (s.events.some((e) => e.type === "next" || e.type === "roundStart")) {
            looks.current = [lookFor(s.fighters[0].profile.id, byId.current.get(s.fighters[0].profile.id)?.color ?? "#c9a84c"),
              lookFor(s.fighters[1].profile.id, byId.current.get(s.fighters[1].profile.id)?.color ?? "#c9a84c")];
          }
        }
        acc -= 1000 / FPS; steps++;
      }
      renderer.draw(s, viewRef.current);
      if (++hudTick % 3 === 0 || s.phase === "matchEnd") setHud(snapshot(s));
      // Échelle d'adversaires : on laisse la pose de victoire 1,6 s, puis l'application enchaîne.
      if (onFinish && !finished && s.phase === "matchEnd" && s.phaseT > 96) {
        finished = true;
        onFinish({ winner: s.winner, hp: [s.fighters[0].hp, s.fighters[1].hp], bestCombo: [s.fighters[0].bestCombo, s.fighters[1].bestCombo] });
      }
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => { if (document.hidden && s.phase === "fight") setPause(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("resize", fit); sfx.close(); audio.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, teams, versus, level, reduced, announce, setPause]);

  // Clavier.
  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "Escape" || e.code === "KeyP") { if (down && stateRef.current?.phase !== "matchEnd") setPause(!pausedRef.current); return; }
      for (const side of [0, 1] as const) {
        if (side === 1 && versus === "ia") continue;
        const k = KEYS[side][e.code];
        if (k) { e.preventDefault(); inputs.current[side] = { ...inputs.current[side], [k]: down }; }
      }
    };
    const down = (e: KeyboardEvent) => set(e, true), up = (e: KeyboardEvent) => set(e, false);
    const blur = () => { inputs.current = [{ ...NO_INPUT }, { ...NO_INPUT }]; touch.current = { ...NO_INPUT }; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [versus, setPause]);

  const press = (k: keyof Input) => (d: boolean) => { touch.current = { ...touch.current, [k]: d }; };
  const stick = useCallback((d: { left: boolean; right: boolean; up: boolean; down: boolean }) => { touch.current = { ...touch.current, ...d }; }, []);
  const ended = hud?.phase === "matchEnd" && !onFinish;
  const winnerLabel = hud && hud.winner !== null ? labels[hud.winner] : null;

  const Bar = ({ side }: { side: 0 | 1 }) => {
    if (!hud) return null;
    const m = byId.current.get(hud.ids[side]);
    const pct = Math.max(0, hud.hp[side] / MAX_HP);
    const team = teams[side];
    return (
      <div className={`fx-hud-side fx-hud-side--${side}`}>
        <div className="fx-hud-id">
          <span className="fx-hud-face">{m && (m.anime || m.photo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(m.anime || m.photo)!} alt="" style={{ objectPosition: m.anime ? m.animePos : m.photoPos }} />
          ) : null}</span>
          <span className="fx-hud-name">{hud.names[side]}</span>
          <span className={`fx-player fx-player--${side}`}>{labels[side]}</span>
        </div>
        <div className="fx-hp" role="meter" aria-label={`Vie de ${hud.names[side]}`} aria-valuemin={0} aria-valuemax={MAX_HP} aria-valuenow={hud.hp[side]}>
          {/* Barre rouge qui s'écoule après le coup (dégâts reçus), puis la vie réelle. */}
          <span className="fx-hp-lag" style={{ transform: `scaleX(${pct})` }} />
          <span style={{ transform: `scaleX(${pct})` }} className={pct < 0.25 ? "is-low" : ""} />
        </div>
        <div className="fx-hud-sub">
          <span className="fx-power" role="meter" aria-label={`Jauge de super de ${hud.names[side]}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.meter[side] * 100)}>
            <span style={{ transform: `scaleX(${hud.meter[side]})` }} className={hud.meter[side] >= 1 ? "is-max" : ""} />
            <b>{hud.meter[side] >= 1 ? "MAX" : "POW"}</b>
          </span>
          {mode === "team"
            ? <span className="fx-stock" aria-label={`${team.length - hud.active[side]} combattant(s) restant(s)`}>{team.map((t, i) => <i key={t.id} className={i < hud.active[side] ? "is-out" : i === hud.active[side] ? "is-on" : ""} />)}</span>
            : <span className="fx-stock" aria-label={`${hud.wins[side]} manche(s) gagnée(s)`}>{[0, 1].map((i) => <i key={i} className={i < hud.wins[side] ? "is-on" : ""} />)}</span>}
        </div>
      </div>
    );
  };

  return (
    <section className="fx-fight" aria-label="Combat">
      <div className="fx-hud">
        <Bar side={0} />
        <div className="fx-timer-box">
          <div className="fx-timer" aria-label={opts.training ? "Sans limite de temps" : `Temps restant : ${hud?.timer ?? 60} secondes`}>{opts.training ? "∞" : hud?.timer ?? 60}</div>
          {caption && <small className="fx-caption">{caption}</small>}
        </div>
        <Bar side={1} />
      </div>

      <div className="fx-stage" style={{ aspectRatio: `${viewW} / ${STAGE_H}` }}>
        <canvas ref={canvasRef} width={viewW} height={STAGE_H} className="fx-canvas" aria-label="Arène de combat en pixel art" role="img" />
        {combo && !ended && <div key={`c${combo.id}`} className={`fx-combo fx-combo--${combo.side}`} aria-live="polite"><b>{combo.n}</b><span>coups</span><small>{combo.dmg} % de dégâts</small></div>}
        {first && !ended && <div key={`f${first.id}`} className={`fx-first fx-first--${first.side}`} aria-hidden="true">Premier coup</div>}
        {cutin && !ended && (
          <div key={cutin.id} className={`fx-cutin is-side-${cutin.side}`} aria-live="assertive" onAnimationEnd={(ev) => { if (ev.target === ev.currentTarget) setCutin(null); }}
            style={{ "--fx-c": accentOf(cutin.m), "--cut-src": `url(${JSON.stringify(cutin.m.cut?.src ?? cutin.m.anime ?? cutin.m.photo ?? "")})`, "--cut-y": `${cutin.m.cut ? cutin.m.cut.box[1] + (cutin.m.cut.box[3] - cutin.m.cut.box[1]) * 0.16 : 22}%` } as React.CSSProperties}>
            <span className="fx-cutin-band" aria-hidden="true" />
            <Ransom text={cutin.name} as="p" className="fx-cutin-name" />
            <span className="fx-cutin-kicker">Super · {cutin.m.name}</span>
          </div>
        )}
        {banner && !ended && <div key={banner.id} className={`fx-banner${banner.kind ? ` is-${banner.kind}` : ""}`} aria-live="assertive"><b>{banner.text}</b>{banner.sub && <span>{banner.sub}</span>}</div>}
        <button type="button" className="fx-pausebtn" onClick={() => setPause(true)} aria-label="Pause" disabled={ended}><Pause size={18} aria-hidden="true" /></button>

        {(paused || ended) && (
          <div className="fx-overlay" role="dialog" aria-modal="true" aria-label={ended ? "Fin du combat" : "Pause"}>
            <div className="fx-overlay-box">
              {ended ? (
                <>
                  <p className="fx-kicker">Fin du combat</p>
                  <h2 className="fx-result">{winnerLabel ? `Victoire ${winnerLabel === "IA" ? "de l'IA" : `de ${winnerLabel}`}` : "Égalité"}</h2>
                  {hud && hud.winner !== null && <p className="fx-muted">{teams[hud.winner].map((m) => m.name).join(", ")}</p>}
                </>
              ) : <h2 className="fx-result">Pause</h2>}
              <div className="fx-overlay-actions">
                {!ended && <button type="button" className="fx-cta fx-cta--sm" onClick={() => setPause(false)} autoFocus><Play size={16} aria-hidden="true" /> Reprendre</button>}
                <button type="button" className={ended ? "fx-cta fx-cta--sm" : "fx-ghost"} onClick={onRematch} autoFocus={ended}><RotateCcw size={16} aria-hidden="true" /> {ended ? "Revanche" : "Recommencer"}</button>
                <button type="button" className="fx-ghost" onClick={onRoster}><Users size={16} aria-hidden="true" /> Retour au roster</button>
                <button type="button" className="fx-ghost" onClick={onHome}><Home size={16} aria-hidden="true" /> Accueil Fighters</button>
                <button type="button" className="fx-ghost" onClick={() => setShowKeys((v) => !v)} aria-expanded={showKeys}><Keyboard size={16} aria-hidden="true" /> Commandes</button>
              </div>
              <div className="fx-sound" role="group" aria-label="Son">
                <button type="button" className="fx-ghost" aria-pressed={sound.music} onClick={() => toggleSound("music")}>Musique : {sound.music ? "oui" : "non"}</button>
                <button type="button" className="fx-ghost" aria-pressed={sound.sfx} onClick={() => toggleSound("sfx")}>Bruitages : {sound.sfx ? "oui" : "non"}</button>
                <button type="button" className="fx-ghost" aria-pressed={sound.voice} onClick={() => toggleSound("voice")}>Annonceur : {sound.voice ? "oui" : "non"}</button>
              </div>
              {showKeys && (
                <dl className="fx-keys">
                  <div><dt>J1</dt><dd>{keyLabel("KeyA", "Q")} {keyLabel("KeyD", "D")} déplacer · {keyLabel("KeyW", "Z")} sauter · {keyLabel("KeyS", "S")} s&apos;accroupir · {keyLabel("KeyU", "U")} poing léger · {keyLabel("KeyI", "I")} poing fort · {keyLabel("KeyJ", "J")} pied léger · {keyLabel("KeyK", "K")} pied fort</dd></div>
                  <div><dt>Garde</dt><dd>reculer = garde haute · reculer accroupi = garde basse</dd></div>
                  <div><dt>Spéciale</dt><dd>bas, bas-avant, avant + poing (ou {keyLabel("KeyO", "O")})</dd></div>
                  <div><dt>Uppercut</dt><dd>avant, bas, bas-avant + poing · ou bas + Spé</dd></div>
                  <div><dt>Pied de rupture</dt><dd>bas, bas-arrière, arrière + pied · ou arrière + Spé</dd></div>
                  <div><dt>Super</dt><dd>deux quarts de cercle + poing, jauge pleine (ou {keyLabel("KeyL", "L")})</dd></div>
                  <div><dt>Autres</dt><dd>avant + poing fort au contact = projection · {keyLabel("KeyH", "H")} ou poing léger + pied léger = esquive · enchaîner poing léger puis coup fort</dd></div>
                  {versus === "local" && <div><dt>J2</dt><dd>Flèches · pavé 4 5 1 2 (ou 7 8 9 0) coups · 6 (ou -) spéciale · 3 (ou =) super · 0 (ou .) esquive</dd></div>}
                  <div><dt>Pause</dt><dd>Échap ou {keyLabel("KeyP", "P")}</dd></div>
                  <div><dt>Manette</dt><dd>croix ou stick : bouger · X / Carré poing léger · Y / Triangle poing fort · A / Croix pied léger · B / Rond pied fort · RB / R1 spéciale · RT / R2 super · LB / L1 esquive · Start pause{versus === "local" ? " · 2e manette : J2" : ""}</dd></div>
                </dl>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fx-controls" aria-label="Commandes tactiles">
        <TouchStick onDir={stick} />
        <div className="fx-buttons">
          <TouchButton label="Poing léger" onChange={press("lp")} className="fx-pad--lp">PL</TouchButton>
          <TouchButton label="Poing fort" onChange={press("hp")} className="fx-pad--hp">PF</TouchButton>
          <TouchButton label="Pied léger" onChange={press("lk")} className="fx-pad--lk">KL</TouchButton>
          <TouchButton label="Pied fort" onChange={press("hk")} className="fx-pad--hk">KF</TouchButton>
          <TouchButton label="Attaque spéciale" onChange={press("special")} className="fx-pad--sp">Spé</TouchButton>
          <TouchButton label="Super, jauge pleine" onChange={press("super")} className={`fx-pad--su${hud && hud.meter[0] >= 1 ? " is-ready" : ""}`}>Super</TouchButton>
          <TouchButton label="Esquive" onChange={press("dodge")} className="fx-pad--dg">Esq.</TouchButton>
        </div>
      </div>
      <p className="fx-keyline">
        Clavier : {keyLabel("KeyA", "Q")} {keyLabel("KeyS", "S")} {keyLabel("KeyD", "D")} {keyLabel("KeyW", "Z")} bouger · {keyLabel("KeyU", "U")} {keyLabel("KeyI", "I")} poings · {keyLabel("KeyJ", "J")} {keyLabel("KeyK", "K")} pieds · ↓↘→ + poing spéciale ({keyLabel("KeyO", "O")}) · {keyLabel("KeyL", "L")} super · {keyLabel("KeyH", "H")} esquive · Échap pause
        {versus === "ia" ? " · Adversaire : IA (ordinateur)" : " · J2 : flèches et pavé numérique"}
      </p>
    </section>
  );
}
