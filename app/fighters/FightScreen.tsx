"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, Pause, Play, RotateCcw, Users, Home, Keyboard } from "lucide-react";
import { createMatch, step, NO_INPUT, MAX_HP, FPS, tuning, STAGE_W, STAGE_H, type Input, type MatchState, type MatchEvent } from "../../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory, type AiLevel } from "../../lib/fighters/ai";
import { ArenaRenderer, lookFor, type Look } from "../../lib/fighters/render";
import type { Mode, RosterMember, Versus } from "./FightersApp";

// Touches physiques (e.code) : elles restent au même endroit en AZERTY comme en QWERTY.
const KEYS: [Record<string, keyof Input>, Record<string, keyof Input>] = [
  { KeyA: "left", KeyD: "right", KeyW: "up", KeyS: "down", KeyJ: "punch", KeyK: "kick", KeyL: "special" },
  { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Numpad1: "punch", Numpad2: "kick", Numpad3: "special", Comma: "punch", Period: "kick", Slash: "special" },
];

interface Hud {
  hp: [number, number]; names: [string, string]; ids: [number, number]; timer: number; round: number;
  wins: [number, number]; active: [number, number]; cd: [number, number]; phase: MatchState["phase"]; winner: 0 | 1 | null;
}

const snapshot = (s: MatchState): Hud => ({
  hp: [s.fighters[0].hp, s.fighters[1].hp],
  names: [s.fighters[0].profile.name, s.fighters[1].profile.name],
  ids: [s.fighters[0].profile.id, s.fighters[1].profile.id],
  timer: Math.ceil(s.timer / FPS), round: s.round, wins: [...s.wins], active: [...s.active],
  cd: s.fighters.map((f) => (f.specialCd <= 0 ? 1 : 1 - f.specialCd / tuning(f.profile).specialCooldown)) as [number, number],
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

export default function FightScreen({ teams, mode, versus, level, labels, reduced, onRematch, onRoster, onHome }: {
  teams: [RosterMember[], RosterMember[]]; mode: Mode; versus: Versus; level: AiLevel; labels: [string, string]; reduced: boolean;
  onRematch: () => void; onRoster: () => void; onHome: () => void;
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
  const [banner, setBanner] = useState<{ text: string; sub?: string; id: number } | null>(null);
  const keyLabel = useKeyLabels();
  const byId = useRef(new Map([...teams[0], ...teams[1]].map((m) => [m.id, m])));
  const looks = useRef<[Look, Look]>([lookFor(teams[0][0].id, teams[0][0].color), lookFor(teams[1][0].id, teams[1][0].color)]);

  const setPause = useCallback((p: boolean) => { pausedRef.current = p; setPaused(p); }, []);

  const announce = useCallback((events: MatchEvent[], s: MatchState) => {
    for (const e of events) {
      const id = s.frame;
      if (e.type === "roundStart") setBanner({ text: mode === "team" ? `Combat ${e.round}` : `Manche ${e.round}`, sub: `${s.fighters[0].profile.name} contre ${s.fighters[1].profile.name}`, id });
      if (e.type === "fight") setBanner({ text: "Combat !", id });
      if (e.type === "ko") setBanner({ text: "K.-O. !", sub: `${s.fighters[e.side].profile.name} est à terre`, id });
      if (e.type === "timeOver") setBanner({ text: "Temps écoulé", id });
      if (e.type === "special") setBanner({ text: e.name, sub: "Attaque spéciale", id });
      if (e.type === "matchEnd") setBanner(null);
    }
  }, [mode]);

  // Boucle de jeu : pas fixe de 1/60 s, rendu à chaque image.
  useEffect(() => {
    const toProfile = (m: RosterMember) => ({ id: m.id, name: m.name, stats: m.stats ?? { force: 50, vitesse: 50, technique: 50 }, specialName: m.special?.name ?? "Onde de la Guilde" });
    const s = createMatch(mode, teams[0].map(toProfile), teams[1].map(toProfile));
    stateRef.current = s;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const renderer = new ArenaRenderer(ctx, () => looks.current, reduced);
    const rng = makeRng(Date.now() & 0xffff);
    const mem = newAiMemory();
    announce(s.events, s);
    setHud(snapshot(s));

    // Cadrage : en portrait étroit, on montre une portion de l'arène qui suit l'action.
    const fit = () => {
      const narrow = window.innerWidth < 700 && window.innerHeight > window.innerWidth;
      const w = narrow ? 240 : STAGE_W;
      viewRef.current = w; setViewW(w);
    };
    fit(); window.addEventListener("resize", fit);
    let raf = 0, last = performance.now(), acc = 0, hudTick = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(100, now - last); last = now;
      if (pausedRef.current || document.hidden) { renderer.draw(s, viewRef.current); return; }
      acc += dt;
      let steps = 0;
      while (acc >= 1000 / FPS && steps < 5) {
        const p1: Input = { ...inputs.current[0] };
        for (const k of Object.keys(p1) as (keyof Input)[]) p1[k] = p1[k] || touch.current[k];
        const p2 = versus === "ia" ? aiInput(s, 1, mem, rng, level) : inputs.current[1];
        step(s, p1, p2);
        if (s.events.length) {
          renderer.onEvents(s.events, s);
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
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => { if (document.hidden && s.phase === "fight") setPause(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("resize", fit); };
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
  const ended = hud?.phase === "matchEnd";
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
          <span style={{ transform: `scaleX(${pct})` }} className={pct < 0.25 ? "is-low" : ""} />
        </div>
        <div className="fx-hud-sub">
          <span className="fx-cd" title="Recharge de l'attaque spéciale"><span style={{ transform: `scaleX(${hud.cd[side]})` }} className={hud.cd[side] >= 1 ? "is-ready" : ""} /></span>
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
        <div className="fx-timer" aria-label={`Temps restant : ${hud?.timer ?? 60} secondes`}>{hud?.timer ?? 60}</div>
        <Bar side={1} />
      </div>

      <div className="fx-stage" style={{ aspectRatio: `${viewW} / ${STAGE_H}` }}>
        <canvas ref={canvasRef} width={viewW} height={STAGE_H} className="fx-canvas" aria-label="Arène de combat en pixel art" role="img" />
        {banner && !ended && <div key={banner.id} className="fx-banner" aria-live="assertive"><b>{banner.text}</b>{banner.sub && <span>{banner.sub}</span>}</div>}
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
              {showKeys && (
                <dl className="fx-keys">
                  <div><dt>J1</dt><dd>{keyLabel("KeyA", "Q (A)")} {keyLabel("KeyD", "D")} déplacer · {keyLabel("KeyW", "Z (W)")} sauter · reculer = garde · {keyLabel("KeyJ", "J")} poing · {keyLabel("KeyK", "K")} pied · {keyLabel("KeyL", "L")} spéciale</dd></div>
                  {versus === "local" && <div><dt>J2</dt><dd>Flèches · {keyLabel("Comma", ",")} / 1 poing · {keyLabel("Period", ".")} / 2 pied · {keyLabel("Slash", "/")} / 3 spéciale</dd></div>}
                  <div><dt>Pause</dt><dd>Échap ou {keyLabel("KeyP", "P")}</dd></div>
                </dl>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fx-controls" aria-label="Commandes tactiles">
        <div className="fx-dpad">
          <TouchButton label="Gauche" onChange={press("left")}><ChevronLeft size={26} aria-hidden="true" /></TouchButton>
          <TouchButton label="Sauter" onChange={press("up")} className="fx-pad--up"><ChevronUp size={26} aria-hidden="true" /></TouchButton>
          <TouchButton label="Droite" onChange={press("right")}><ChevronRight size={26} aria-hidden="true" /></TouchButton>
        </div>
        <p className="fx-controls-hint">Reculer = garde</p>
        <div className="fx-buttons">
          <TouchButton label="Poing" onChange={press("punch")} className="fx-pad--a">Poing</TouchButton>
          <TouchButton label="Pied" onChange={press("kick")} className="fx-pad--b">Pied</TouchButton>
          <TouchButton label="Spéciale" onChange={press("special")} className="fx-pad--c">Spé.</TouchButton>
        </div>
      </div>
      <p className="fx-keyline">
        Clavier : {keyLabel("KeyA", "Q (A)")}/{keyLabel("KeyD", "D")} déplacer · {keyLabel("KeyW", "Z (W)")} sauter · {keyLabel("KeyJ", "J")} poing · {keyLabel("KeyK", "K")} pied · {keyLabel("KeyL", "L")} spéciale · Échap pause
        {versus === "ia" ? " · Adversaire : IA (ordinateur)" : " · J2 : flèches et , . /"}
      </p>
    </section>
  );
}
