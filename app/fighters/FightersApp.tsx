"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Dices, Home, RotateCcw, Search, Swords, Undo2 } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { rankAccents, rankRomaji } from "../config/ranks";
import type { AiLevel } from "../../lib/fighters/ai";
import { CUSTOM_IDS } from "../../lib/fighters/characters";
import FighterPreview from "./FighterPreview";
import { STAGES, type Stage } from "../../lib/fighters/stages";
import { MAX_HP } from "../../lib/fighters/engine";
import { celebrate } from "../../lib/fx";
import type { MatchResult } from "./FightScreen";
import { useMusicDock } from "../components/MusicDock";
import Ransom from "../components/Ransom";
import FaceToggle from "../components/FaceToggle";
import { setFace, useFace } from "../../lib/face";
import { directSrc } from "../../lib/image-loader";

const FightScreen = dynamic(() => import("./FightScreen"), { ssr: false });

export interface RosterMember {
  id: number;
  name: string;
  rank: string;
  color: string;
  photo: string | null;
  anime: string | null;
  photoPos: string;
  animePos: string;
  bio: string;
  stats: { force: number; vitesse: number; technique: number } | null;
  special: { name: string; effect: string } | null;
  awards: string[];
  /** Détourage du portrait anime (lib/cutouts.json), si fiable. */
  cut?: { src: string; box: [number, number, number, number] } | null;
}

export type Mode = "team" | "duel";
export type Versus = "ia" | "local";

const teamSize = (m: Mode) => (m === "team" ? 3 : 1);
const accentOf = (r: RosterMember) => rankAccents[r.rank as Rank] ?? r.color ?? "#c9a84c";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set(); mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return reduced;
}

/** Portrait d'un membre : version anime ou réelle, avec repli lisible si l'image manque. */
function Portrait({ m, kind: asked, className = "" }: { m: RosterMember; kind?: "anime" | "real"; className?: string }) {
  // Sans choix explicite, le portrait suit la préférence Anime / Réel du site.
  const pref = useFace();
  const kind = asked ?? pref;
  const [broken, setBroken] = useState<string | null>(null);
  const src = kind === "real" ? (m.photo ?? m.anime) : (m.anime ?? m.photo);
  const pos = src === m.photo ? m.photoPos : m.animePos;
  if (!src || broken === src) {
    return <span className={`fx-noimg ${className}`} aria-hidden="true">{m.name.slice(0, 2).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt="" loading="lazy" decoding="async" style={{ objectPosition: pos }} onError={() => setBroken(src)} />;
}

// ─── Écran titre (façon MUGEN) ───────────────────────────────────────────────
// « Appuie sur Entrée », puis menu vertical des modes : flèches + Entrée au clavier,
// ou toucher. Le mode surligné est décrit en bas, comme dans les jeux de combat.
export type GameMode = "arcade" | "versus" | "equipes" | "survie" | "entrainement" | "spectateur";
export const MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: "arcade", label: "Arcade", desc: "Un combattant contre six adversaires de la Guilde, l'un après l'autre. Perds, et tu peux continuer." },
  { id: "versus", label: "Versus", desc: "Duel en deux manches gagnantes, contre l'IA ou à deux sur le même clavier." },
  { id: "equipes", label: "Équipes 3 contre 3", desc: "Élimination : le vainqueur reste en piste, avec la vie qu'il lui reste." },
  { id: "survie", label: "Survie", desc: "Une manche par adversaire, la vie se garde d'un combat à l'autre. Jusqu'où iras-tu ?" },
  { id: "entrainement", label: "Entraînement", desc: "Sans chrono ni K.-O., jauges pleines : répète tes coups spéciaux et tes combos." },
  { id: "spectateur", label: "Spectateur", desc: "Deux IA s'affrontent : choisis ton champion et regarde." },
];
const LEVELS: AiLevel[] = ["facile", "normal", "difficile"];

function TitleScreen({ roster, game, setGame, versus, setVersus, level, setLevel, onStart }: {
  roster: RosterMember[]; game: GameMode; setGame: (m: GameMode) => void; versus: Versus; setVersus: (v: Versus) => void;
  level: AiLevel; setLevel: (l: AiLevel) => void; onStart: () => void;
}) {
  const hosts = useMemo(() => modeHosts(roster), [roster]);
  const [stage, setStage] = useState<"press" | "menu" | "who">("press");
  const items = [...MODES.map((m) => m.id), "options"] as const;
  const [cur, setCur] = useState(Math.max(0, items.indexOf(game)));
  const [whoCur, setWhoCur] = useState(versus === "local" ? 1 : 0);
  const choose = useCallback((i: number) => {
    const id = items[i];
    if (id === "options") { setLevel(LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length]); return; }
    setGame(id);
    if (id === "versus" || id === "equipes") { setStage("who"); return; }
    setVersus("ia"); onStart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, onStart, setGame, setLevel, setVersus]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === "press") { if (["Enter", "Space", "NumpadEnter", "KeyJ", "KeyU"].includes(e.code)) { e.preventDefault(); setStage("menu"); } return; }
      if (stage === "who") {
        if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "KeyW" || e.code === "KeyS") { e.preventDefault(); setWhoCur((c) => 1 - c); }
        else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") { e.preventDefault(); setVersus(whoCur ? "local" : "ia"); onStart(); }
        else if (e.code === "Escape" || e.code === "KeyK") setStage("menu");
        return;
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); setCur((c) => (c + 1) % items.length); }
      else if (e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); setCur((c) => (c + items.length - 1) % items.length); }
      else if ((e.code === "ArrowLeft" || e.code === "ArrowRight") && items[cur] === "options") { e.preventDefault(); const d = e.code === "ArrowLeft" ? -1 : 1; setLevel(LEVELS[(LEVELS.indexOf(level) + d + LEVELS.length) % LEVELS.length]); }
      else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") { e.preventDefault(); choose(cur); }
      else if (e.code === "Escape") setStage("press");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, cur, whoCur, level, choose, onStart, setLevel, setVersus]);

  const desc = items[cur] === "options" ? `Niveau de l'IA : ${level}. Flèches gauche et droite (ou toucher) pour changer.` : MODES.find((m) => m.id === items[cur])?.desc;
  const hostOf = (id: string) => hosts[id] ?? hosts.arcade;
  const shown = stage === "who" ? hostOf(game) : stage === "press" ? hostOf("arcade") : hostOf(items[cur]);
  const acc = shown ? accentOf(shown.m) : "#f5e400";
  const whoItems = ["Contre l'IA", "2 joueurs"];
  return (
    <section className={`fp is-${stage}`} aria-labelledby="fx-title-h" style={{ "--fp-acc": acc } as React.CSSProperties}
      onClick={() => stage === "press" && setStage("menu")}>
      <div className="fp-bg" aria-hidden="true"><span className="fp-star" /><span className="fp-star is-2" /><span className="fp-stripes" /></div>

      {shown && (
        <div className="fp-stage" key={`${stage}-${shown.m.id}`} aria-hidden="true">
          <FpHost m={shown.m} />
        </div>
      )}

      <header className="fp-head">
        <p className="fp-kicker">Chapitre IV · L&apos;arène</p>
        <h1 id="fx-title-h" className="fp-logo"><span>Guilde</span><span>Fighters</span></h1>
      </header>
      <div className="fp-face" onClick={(e) => e.stopPropagation()}><FaceToggle /></div>

      {stage === "press" && (
        <button type="button" className="fp-press" onClick={(e) => { e.stopPropagation(); setStage("menu"); }}>
          <span className="fp-press-key">Appuie sur Entrée</span><span className="fp-press-touch">Touche pour jouer</span>
        </button>
      )}

      {stage !== "press" && (
        <nav className="fp-menu" aria-label={stage === "who" ? "Adversaire" : "Modes de jeu"}>
          {stage === "who" && <p className="fp-sub"><b>{MODES.find((m) => m.id === game)?.label}</b><span>Contre qui ?</span></p>}
          <ul role="listbox" aria-label={stage === "who" ? "Adversaire" : "Mode de jeu"} aria-activedescendant={stage === "menu" ? `fx-mode-${items[cur]}` : `fx-who-${whoCur}`}>
            {(stage === "menu" ? items.map((id) => id as string) : whoItems).map((id, i) => {
              const on = stage === "menu" ? cur === i : whoCur === i;
              const label = stage === "who" ? id : id === "options" ? "Options" : MODES.find((m) => m.id === id)!.label;
              return (
                <li key={id} id={stage === "menu" ? `fx-mode-${id}` : `fx-who-${i}`} role="option" aria-selected={on} className={on ? "is-on" : ""} style={{ "--k": i } as React.CSSProperties}>
                  <button type="button"
                    onMouseEnter={() => (stage === "menu" ? setCur(i) : setWhoCur(i))} onFocus={() => (stage === "menu" ? setCur(i) : setWhoCur(i))}
                    onClick={() => { if (stage === "menu") { setCur(i); choose(i); } else { setVersus(i ? "local" : "ia"); onStart(); } }}>
                    {/* Les deux libellés restent dans la page (le CSS montre le bon) : remplacer le nœud
                        sous le doigt entre l'appui et le relâchement annulerait le clic. */}
                    <span className="fp-bar" aria-hidden="true" />
                    <span className="fp-cursor" aria-hidden="true" />
                    <Ransom text={label} className="fp-item is-ransom" />
                    <span className="fp-item is-plain">{label}</span>
                    {id === "options" && <em className="fp-level">IA : {level}</em>}
                  </button>
                </li>
              );
            })}
            {stage === "who" && <li className="fp-back-li"><button type="button" className="fp-back" onClick={() => setStage("menu")}>‹ Retour</button></li>}
          </ul>
          <div className="fp-info" aria-live="polite">
            <p className="fp-desc">{stage === "who" ? (whoCur ? "J1 à gauche (ZQSD + UIJK), J2 à droite (flèches + pavé numérique)." : `L'ordinateur, niveau ${level}.`) : desc}</p>
            {shown && <p className="fp-why"><span>{shown.why}</span><b>{shown.m.name}</b>{shown.value && <i>{shown.value}</i>}</p>}
          </div>
        </nav>
      )}

      <p className="fp-keys" aria-hidden="true">{stage === "press" ? "Entrée Commencer" : stage === "who" ? "↑ ↓ Choisir · Entrée Valider · Échap Retour" : "↑ ↓ Choisir · Entrée Valider · Échap Titre"}</p>
    </section>
  );
}

/** Hôte d'un mode : personnage détouré doublé de deux silhouettes, ou photo réelle dans un cadre incliné. */
function FpHost({ m }: { m: RosterMember }) {
  const face = useFace();
  const real = face === "real" && m.photo;
  if (!real && m.cut) {
    const mask = { WebkitMaskImage: `url(${m.cut.src})`, maskImage: `url(${m.cut.src})` } as React.CSSProperties;
    return (
      <div className="fp-host">
        <span className="fp-sil is-paper" style={mask} />
        <span className="fp-sil is-ink" style={mask} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.cut.src} alt="" decoding="async" fetchPriority="high" />
      </div>
    );
  }
  const src = real ? m.photo! : (m.anime ?? m.photo);
  if (!src) return null;
  return (
    <div className="fp-host is-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={directSrc(src, 960)} alt="" decoding="async" style={{ objectPosition: real ? m.photoPos : m.animePos }} />
    </div>
  );
}

/** Un hôte par mode, choisi d'après les fiches (sans doublon) : le plus complet pour l'arcade, etc. */
function modeHosts(roster: RosterMember[]) {
  const pool = roster.filter((m) => m.cut || m.anime || m.photo);
  const withCut = pool.filter((m) => m.cut);
  const used = new Set<number>();
  const best = (score: (m: RosterMember) => number) => {
    for (const list of [withCut, pool]) {
      const pick = list.filter((m) => !used.has(m.id) && score(m) > 0).sort((a, b) => score(b) - score(a))[0];
      if (pick) { used.add(pick.id); return pick; }
    }
    return null;
  };
  const st = (k: "force" | "vitesse" | "technique") => (m: RosterMember) => Number(m.stats?.[k] ?? 0);
  const total = (m: RosterMember) => (m.stats ? Number(m.stats.force) + Number(m.stats.vitesse) + Number(m.stats.technique) : 0);
  const out: Record<string, { m: RosterMember; why: string; value?: string } | null> = {};
  const set = (id: string, m: RosterMember | null, why: string, value?: string) => { out[id] = m ? { m, why, value } : null; };
  let m = best(total); set("arcade", m, "Le plus complet", m ? `${total(m)} pts` : undefined);
  m = best(st("force")); set("survie", m, "La plus grande force", m ? `Force ${m.stats!.force}` : undefined);
  m = best(st("vitesse")); set("entrainement", m, "Le plus rapide", m ? `Vitesse ${m.stats!.vitesse}` : undefined);
  m = best(st("technique")); set("versus", m, "La meilleure technique", m ? `Technique ${m.stats!.technique}` : undefined);
  m = best((x) => x.awards.length); set("equipes", m, "Le plus titré", m ? `${m.awards.length} titre${m.awards.length > 1 ? "s" : ""}` : undefined);
  m = best((x) => (x.special ? 1 : 0)); set("spectateur", m, "Coup spécial", m?.special?.name);
  set("options", out.arcade?.m ?? null, "Champion de l'arcade", out.arcade?.value);
  return out;
}

// ─── Choix de l'arène ────────────────────────────────────────────────────────
function StageThumb({ stage }: { stage: Stage }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current?.getContext("2d"); if (c) stage.paint(c); }, [stage]);
  return <canvas ref={ref} width={384} height={216} className="fx-stage-thumb" aria-hidden="true" />;
}

function StageScreen({ onPick, onBack }: { onPick: (s: Stage) => void; onBack: () => void }) {
  const [cur, setCur] = useState(0);
  const all = STAGES.length + 1; // + « Au hasard »
  const pick = useCallback((i: number) => onPick(i >= STAGES.length ? STAGES[Math.floor(Math.random() * STAGES.length)] : STAGES[i]), [onPick]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "KeyD", "ArrowDown", "KeyS"].includes(e.code)) { e.preventDefault(); setCur((c) => (c + 1) % all); }
      else if (["ArrowLeft", "KeyA", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); setCur((c) => (c + all - 1) % all); }
      else if (["Enter", "Space", "KeyJ", "NumpadEnter"].includes(e.code)) { e.preventDefault(); pick(cur); }
      else if (e.code === "Escape" || e.code === "KeyK") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, all, pick, onBack]);
  const shown = cur < STAGES.length ? STAGES[cur] : null;
  return (
    <section className="fx-stagesel" aria-labelledby="fx-stage-h">
      <header className="fxs-top">
        <button type="button" className="fx-ghost fxs-back" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Combattants</button>
        <h1 id="fx-stage-h" className="fxs-title">Choisis l&apos;arène</h1>
      </header>
      <div className="fx-stage-big">
        {shown ? <StageThumb key={shown.id} stage={shown} /> : <span className="fx-stage-random" aria-hidden="true">?</span>}
        <p className="fx-stage-name"><b>{shown ? shown.name : "Au hasard"}</b><small>{shown ? shown.romaji : "Une arène tirée au sort"}</small></p>
      </div>
      <ul className="fx-stage-list" role="listbox" aria-label="Arènes">
        {[...STAGES, null].map((st, i) => (
          <li key={st?.id ?? "random"} role="option" aria-selected={cur === i}>
            <button type="button" className={cur === i ? "is-cur" : ""} onMouseEnter={() => setCur(i)} onFocus={() => setCur(i)} onClick={() => (cur === i ? pick(i) : setCur(i))}>
              {st ? <StageThumb stage={st} /> : <span className="fx-stage-random is-small" aria-hidden="true">?</span>}
              <span>{st ? st.name : "Au hasard"}</span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="fxs-bar">
        <p className="fxs-help">Touche une arène, puis touche-la à nouveau (ou Entrée) pour la choisir.</p>
        <div className="fxs-actions"><button type="button" className="fx-cta fx-cta--sm" onClick={() => pick(cur)}><Swords size={18} aria-hidden="true" /> Combattre ici</button></div>
      </footer>
    </section>
  );
}

// ─── Victoire, continuer, fin de partie ──────────────────────────────────────
/** Citation de victoire : la première phrase de la bio du membre (donnée réelle, jamais inventée). */
const quoteOf = (m: RosterMember) => {
  const first = m.bio.split(/(?<=[.!?…])\s/)[0]?.trim();
  return first && first.length > 8 ? first : m.special?.effect || null;
};

function WinScreen({ winner, loser, line, next, onNext }: { winner: RosterMember; loser: RosterMember | null; line: string; next: string; onNext: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onNext, 7000);
    const onKey = (e: KeyboardEvent) => { if (["Enter", "Space", "KeyJ", "NumpadEnter"].includes(e.code)) { e.preventDefault(); onNext(); } };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onNext]);
  const quote = quoteOf(winner);
  return (
    <section className="fx-win" aria-labelledby="fx-win-h" style={{ "--fx-c": accentOf(winner) } as React.CSSProperties}>
      <div className="fx-win-art"><Portrait m={winner} /></div>
      <div className="fx-win-text">
        <p className="fx-kicker">Victoire</p>
        <h1 id="fx-win-h" className="fx-win-name">{winner.name}</h1>
        {quote && <blockquote className="fx-win-quote">« {quote} »</blockquote>}
        <p className="fx-muted">{line}{loser ? ` · ${loser.name} est vaincu` : ""}</p>
        <button type="button" className="fx-cta fx-cta--sm" onClick={onNext} autoFocus>{next}</button>
      </div>
    </section>
  );
}

function ContinueScreen({ player, onYes, onNo }: { player: RosterMember; onYes: () => void; onNo: () => void }) {
  const [n, setN] = useState(9);
  useEffect(() => {
    if (n < 0) { onNo(); return; }
    const t = window.setTimeout(() => setN((x) => x - 1), 1000);
    return () => window.clearTimeout(t);
  }, [n, onNo]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", "Space", "KeyJ", "NumpadEnter"].includes(e.code)) { e.preventDefault(); onYes(); }
      else if (e.code === "Escape" || e.code === "KeyK") onNo();
      else setN((x) => Math.max(0, x - 1)); // une autre touche accélère le décompte
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onYes, onNo]);
  return (
    <section className="fx-continue" aria-labelledby="fx-cont-h">
      <div className="fx-continue-art"><Portrait m={player} /></div>
      <h1 id="fx-cont-h" className="fx-continue-title">Continuer ?</h1>
      <p className="fx-continue-count" aria-live="assertive">{Math.max(0, n)}</p>
      <div className="fx-overlay-actions">
        <button type="button" className="fx-cta fx-cta--sm" onClick={onYes} autoFocus><RotateCcw size={16} aria-hidden="true" /> Continuer</button>
        <button type="button" className="fx-ghost" onClick={onNo}>Abandonner</button>
      </div>
    </section>
  );
}

function OverScreen({ title, line, player, best, onAgain, onMenu }: { title: string; line: string; player: RosterMember | null; best?: string; onAgain: () => void; onMenu: () => void }) {
  return (
    <section className="fx-over" aria-labelledby="fx-over-h">
      {player && <div className="fx-continue-art"><Portrait m={player} /></div>}
      <h1 id="fx-over-h" className="fx-continue-title">{title}</h1>
      <p className="fx-over-line">{line}</p>
      {best && <p className="fx-muted">{best}</p>}
      <div className="fx-overlay-actions">
        <button type="button" className="fx-cta fx-cta--sm" onClick={onAgain} autoFocus><RotateCcw size={16} aria-hidden="true" /> Rejouer</button>
        <button type="button" className="fx-ghost" onClick={onMenu}><Home size={16} aria-hidden="true" /> Menu principal</button>
      </div>
    </section>
  );
}

// ─── Écran de sélection arcade ───────────────────────────────────────────────
// Grands portraits en miroir (J1 à gauche, J2/IA à droite), roster en nid d'abeille
// au centre, curseurs J1 rouge et J2 bleu simultanés, emplacements d'équipe, choix
// de l'ordre de passage, confirmation. Décor et typographie originaux.

type Phase = "pick" | "order" | "ready";
const hasSprite = (m: RosterMember) => CUSTOM_IDS.includes(m.id);

function BigPortrait({ side, label, m, team, size, order, active, status }: {
  side: 0 | 1; label: string; m: RosterMember | null; team: RosterMember[]; size: number; order: number[]; active: boolean; status: string;
}) {
  const kind = useFace();
  const setKind = setFace;
  return (
    <aside className={`fxs-side fxs-side--${side}${active ? " is-active" : ""}`} style={{ "--fx-c": m ? accentOf(m) : side === 0 ? "#e8463a" : "#3a8de8" } as React.CSSProperties} aria-label={`${label} : ${m ? m.name : "aucun membre"}`}>
      <div className="fxs-art">
        {/* Détourage du portrait anime quand il est fiable (le personnage sort du cadre), sinon le portrait entier. */}
        {m ? (kind === "anime" && m.cut
          // eslint-disable-next-line @next/next/no-img-element
          ? <img key={`${m.id}-cut`} className="fxs-art-cut" src={m.cut.src} alt="" decoding="async" />
          : <Portrait key={`${m.id}-${kind}`} m={m} kind={kind} className="fxs-art-img" />) : <span className="fxs-art-empty" aria-hidden="true">?</span>}
        <span className="fxs-art-shade" aria-hidden="true" />
        <span className={`fx-player fx-player--${side} fxs-tag`}>{label}</span>
        {m?.photo && m.anime && (
          <div className="fx-kind fxs-kind" role="group" aria-label="Portrait affiché">
            <button type="button" aria-pressed={kind === "anime"} onClick={() => setKind("anime")}>Anime</button>
            <button type="button" aria-pressed={kind === "real"} onClick={() => setKind("real")}>Réel</button>
          </div>
        )}
      </div>
      {m && <FighterPreview memberId={m.id} side={side} />}
      <div className="fxs-plate">
        <p className="fxs-status" aria-live="polite">{status}</p>
        <h2 className="fxs-name">{m ? m.name : "—"}</h2>
        {m && (
          <p className="fxs-rank">
            <span>{m.rank}</span>{rankRomaji[m.rank as Rank] && <em>{rankRomaji[m.rank as Rank]}</em>}
            <b className={hasSprite(m) ? "fxs-sprite is-custom" : "fxs-sprite"}>{hasSprite(m) ? "Sprite dédié" : "Sprite provisoire"}</b>
          </p>
        )}
        {m && (m.stats ? (
          <dl className="fxs-stats">
            {(["force", "vitesse", "technique"] as const).map((k) => (
              <div key={k}><dt>{k}</dt><dd><span style={{ width: `${Math.min(100, m.stats![k])}%` }} /></dd></div>
            ))}
          </dl>
        ) : <p className="fxs-note">Statistiques non renseignées : valeurs neutres.</p>)}
        {m?.special && <p className="fxs-special">{m.special.name}</p>}
        <ol className="fxs-slots" aria-label={`Équipe ${label}`}>
          {Array.from({ length: size }, (_, i) => team[i]).map((t, i) => {
            const pos = t ? order.indexOf(i) : -1;
            return (
              <li key={i} className={t ? "is-filled" : ""} style={t ? ({ "--fx-c": accentOf(t) } as React.CSSProperties) : undefined}>
                <span className="fxs-slot-hex">{t ? <Portrait m={t} /> : null}</span>
                <span className="fxs-slot-n">{pos >= 0 ? pos + 1 : t ? "·" : i + 1}</span>
                <span className="fx-sr">{t ? `${t.name}${pos >= 0 ? `, passe en ${pos + 1}` : ""}` : "emplacement libre"}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

function SelectScreen({ roster, mode, versus, reduced, onBack, onReady }: {
  roster: RosterMember[]; mode: Mode; versus: Versus; reduced: boolean; onBack: () => void; onReady: (t1: RosterMember[], t2: RosterMember[]) => void;
}) {
  const size = teamSize(mode);
  const isAi = versus === "ia";
  const labels: [string, string] = ["J1", isAi ? "IA" : "J2"];
  const [teams, setTeams] = useState<[RosterMember[], RosterMember[]]>([[], []]);
  const [cursors, setCursors] = useState<[number, number]>([0, Math.max(0, roster.length - 1)]);
  const [orders, setOrders] = useState<[number[], number[]]>([[], []]);
  // Ordre de passage : celui des choix, sauf si le joueur demande à le changer.
  const [customOrder, setCustomOrder] = useState<[boolean, boolean]>([false, false]);
  const [orderCur, setOrderCur] = useState<[number, number]>([0, 0]);
  const [rank, setRank] = useState<string>("Tous");
  const [q, setQ] = useState("");
  const [rolling, setRolling] = useState(false);
  const [geo, setGeo] = useState({ t: 64, cols: 8 });
  const gridRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => roster.filter((m) => (rank === "Tous" || m.rank === rank) && m.name.toLowerCase().includes(q.trim().toLowerCase())), [roster, rank, q]);
  const ranks = useMemo(() => RANK_FILTER_ORDER.filter((r) => roster.some((m) => m.rank === r)), [roster]);
  const full = (side: 0 | 1) => teams[side].length >= size;
  const picked = full(0) && full(1);
  const ordered = (side: 0 | 1) => size === 1 || !customOrder[side] || orders[side].length >= size;
  const ord = (side: 0 | 1) => (customOrder[side] ? orders[side] : teams[side].map((_, i) => i));
  const phase: Phase = !picked || rolling ? "pick" : ordered(0) && ordered(1) ? "ready" : "order";
  /** Camp qui répond à la souris et au toucher : J1, puis J2 en local. */
  const pointerSide: 0 | 1 | null = !full(0) ? 0 : !isAi && !full(1) ? 1 : null;
  const at = (side: 0 | 1) => list[Math.min(cursors[side], list.length - 1)] ?? null;

  // Nid d'abeille : nombre de colonnes selon la largeur disponible.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const t = w >= 560 ? 68 : Math.max(52, Math.min(66, Math.floor((w - 8) / 5.6)));
      setGeo({ t, cols: Math.max(4, Math.floor((w - t / 2 - 4) / t)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const rows = useMemo(() => {
    const out: { m: RosterMember; i: number }[][] = [];
    list.forEach((m, i) => { const r = Math.floor(i / geo.cols); (out[r] ??= []).push({ m, i }); });
    return out;
  }, [list, geo.cols]);

  const pickFor = useCallback((side: 0 | 1, m: RosterMember | null) => {
    if (!m) return;
    setTeams((t) => {
      if (t[side].length >= size || t[side].some((x) => x.id === m.id)) return t;
      const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
      next[side].push(m);
      return next;
    });
  }, [size]);

  const undoFor = useCallback((side: 0 | 1) => {
    setOrders([[], []]); setCustomOrder([false, false]);
    setTeams((t) => {
      const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
      if (isAi) { next[1] = []; next[0].pop(); }
      else next[side].pop();
      return next;
    });
  }, [isAi]);

  const randomFor = useCallback((side: 0 | 1) => {
    setTeams((t) => {
      const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
      const pool = roster.filter((m) => !next[side].some((x) => x.id === m.id));
      while (next[side].length < size && pool.length) next[side].push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      return next;
    });
  }, [roster, size]);

  // L'IA choisit après J1 : son curseur « roule » sur le roster, puis s'arrête (tirage réel parmi les membres).
  useEffect(() => {
    if (!isAi || !full(0) || full(1)) return;
    const pool = roster.filter((m) => !teams[1].some((x) => x.id === m.id));
    if (!pool.length) return;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    const target = Math.max(0, list.findIndex((m) => m.id === choice.id));
    let n = reduced ? 0 : 6;
    setRolling(true);
    const id = setInterval(() => {
      if (n-- > 0) { setCursors((c) => [c[0], Math.floor(Math.random() * Math.max(1, list.length))]); return; }
      clearInterval(id);
      setCursors((c) => [c[0], target]);
      setTeams((t) => (t[1].length >= size || t[1].some((x) => x.id === choice.id) ? t : [t[0], [...t[1], choice]]));
      setRolling(false);
    }, 60);
    return () => { clearInterval(id); setRolling(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAi, teams, size]);

  const assignOrder = (side: 0 | 1, i: number) => setOrders((o) => {
    if (o[side].includes(i) || o[side].length >= size) return o;
    const next: [number[], number[]] = [[...o[0]], [...o[1]]];
    next[side].push(i);
    if (next[side].length === size - 1) next[side].push([...Array(size).keys()].find((k) => !next[side].includes(k))!);
    return next;
  });
  const resetOrder = (side: 0 | 1) => {
    setOrders((o) => (side === 0 ? [[], o[1]] : [o[0], []]));
    setCustomOrder((c) => (side === 0 ? [true, c[1]] : [c[0], true]));
  };
  const finalTeams = (): [RosterMember[], RosterMember[]] => ([0, 1] as const).map((s) => (size === 1 ? teams[s] : ord(s).map((i) => teams[s][i]))) as [RosterMember[], RosterMember[]];

  // Clavier : J1 ZQSD/WASD + U ou J (choisir) + K (annuler) ; J2 flèches + Entrée / pavé 4 (choisir) + pavé 1 (annuler).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const map: Record<string, [0 | 1, string]> = {
        KeyW: [0, "u"], KeyS: [0, "d"], KeyA: [0, "l"], KeyD: [0, "r"], KeyU: [0, "ok"], KeyJ: [0, "ok"], Space: [0, "ok"], KeyK: [0, "back"],
        ArrowUp: [1, "u"], ArrowDown: [1, "d"], ArrowLeft: [1, "l"], ArrowRight: [1, "r"], Enter: [1, "ok"], NumpadEnter: [1, "ok"], Numpad4: [1, "ok"], Numpad1: [1, "back"], Backspace: [1, "back"],
      };
      if (e.code === "Escape") { onBack(); return; }
      const hit = map[e.code];
      if (!hit) return;
      const act = hit[1];
      let side = hit[0];
      // Contre l'IA, les deux jeux de touches pilotent J1.
      if (isAi) side = 0;
      e.preventDefault();
      if (phase === "ready") { if (act === "ok") onReady(...finalTeams()); else if (act === "back") resetOrder(side); return; }
      if (phase === "order") {
        if (isAi && side === 1) return;
        if (act === "l" || act === "r") setOrderCur((c) => { const n: [number, number] = [...c]; n[side] = (n[side] + (act === "r" ? 1 : size - 1)) % size; return n; });
        else if (act === "ok") assignOrder(side, orderCur[side]);
        else if (act === "back") resetOrder(side);
        return;
      }
      if (full(side) || (rolling && side === 1)) { if (act === "back") undoFor(side); return; }
      const step = { u: -geo.cols, d: geo.cols, l: -1, r: 1 }[act as "u"];
      if (step) setCursors((c) => { const n: [number, number] = [...c]; n[side] = Math.min(list.length - 1, Math.max(0, n[side] + step)); return n; });
      else if (act === "ok") pickFor(side, at(side));
      else if (act === "back") undoFor(side);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    for (const side of [0, 1] as const) gridRef.current?.querySelector<HTMLElement>(`[data-i="${cursors[side]}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [cursors]);

  const focusOf = (side: 0 | 1) => (phase === "pick" && !full(side) ? at(side) : teams[side][phase === "order" ? orderCur[side] : ord(side)[0] ?? 0] ?? at(side));
  const statusOf = (side: 0 | 1) => {
    if (phase === "pick") return full(side) ? "Équipe prête" : side === 1 && isAi ? (full(0) ? "L'IA choisit…" : "Attend J1") : `Choix ${teams[side].length + 1} sur ${size}`;
    if (phase === "order") return ordered(side) ? "Ordre fixé" : "Ordre de passage";
    return "Prêt";
  };
  const chosenBy = (m: RosterMember) => ([0, 1] as const).filter((s) => teams[s].some((x) => x.id === m.id));

  return (
    <section className={`fxs fxs--${phase}`} aria-labelledby="fxs-h">
      <div className="fxs-decor" aria-hidden="true"><span className="fxs-decor-word">GUILDE</span></div>
      <header className="fxs-top">
        <button type="button" className="fx-ghost fxs-back" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Modes de jeu</button>
        <h1 id="fxs-h" className="fxs-title">{phase === "order" ? "Ordre de passage" : phase === "ready" ? "Prêts au combat" : "Choisis ton combattant"}</h1>
        <p className="fxs-mode">{mode === "team" ? "Équipes 3 contre 3" : "Duel 1 contre 1"} · {isAi ? "contre l'IA" : "2 joueurs"}</p>
      </header>

      <BigPortrait side={0} label={labels[0]} m={focusOf(0)} team={teams[0]} size={size} order={ord(0)} active={pointerSide === 0 || phase !== "pick"} status={statusOf(0)} />

      <div className="fxs-center">
        {phase === "pick" && (
          <>
            <div className="fxs-filters">
              <label className="fx-search fxs-search"><Search size={16} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setCursors([0, 0]); }} placeholder="Rechercher" aria-label="Rechercher un membre" /></label>
              <div className="fxs-chips" role="group" aria-label="Filtrer par rang">
                {["Tous", ...ranks].map((r) => <button key={r} type="button" aria-pressed={rank === r} onClick={() => { setRank(r); setCursors([0, 0]); }}>{r}</button>)}
              </div>
            </div>
            <div ref={gridRef} className="fxs-grid" role="listbox" aria-label="Roster des membres" style={{ "--t": `${geo.t}px` } as React.CSSProperties}>
              {rows.map((row, r) => (
                <div key={r} className={`fxs-row${r % 2 ? " is-odd" : ""}`}>
                  {row.map(({ m, i }) => {
                    const on = ([0, 1] as const).filter((s) => cursors[s] === i && (!full(s) || (s === 1 && rolling)) && !(s === 1 && isAi && !full(0)));
                    const by = chosenBy(m);
                    return (
                      <button
                        key={m.id} type="button" role="option" data-i={i} aria-selected={on.length > 0}
                        className={`fxs-hx${on.map((s) => ` is-cur${s}`).join("")}${by.length ? " is-chosen" : ""}`}
                        style={{ "--fx-c": accentOf(m) } as React.CSSProperties}
                        aria-label={`${m.name}, ${m.rank}${hasSprite(m) ? ", sprite personnalisé" : ""}${by.length ? `, choisi par ${by.map((b) => labels[b]).join(" et ")}` : ""}`}
                        onPointerEnter={(e) => { if (e.pointerType === "mouse" && pointerSide !== null) setCursors((c) => { const n: [number, number] = [...c]; n[pointerSide] = i; return n; }); }}
                        // Au toucher : un premier appui place le curseur (portrait et nom suivent),
                        // un second appui ou « Confirmer » valide. À la souris, le survol sert de curseur
                        // et le clic valide directement. « Annuler » retire le dernier choix.
                        onPointerDown={(e) => { e.currentTarget.dataset.touch = e.pointerType === "mouse" ? "" : "1"; e.currentTarget.dataset.was = pointerSide !== null && cursors[pointerSide] === i ? "1" : ""; }}
                        onClick={(e) => {
                          if (pointerSide === null) return;
                          const touch = e.currentTarget.dataset.touch === "1", was = e.currentTarget.dataset.was === "1";
                          setCursors((c) => { const n: [number, number] = [...c]; n[pointerSide] = i; return n; });
                          if (!touch || was) pickFor(pointerSide, m);
                        }}
                      >
                        <span className="fxs-hx-frame"><span className="fxs-hx-img"><Portrait m={m} /></span></span>
                        {hasSprite(m) && <span className="fxs-hx-star" aria-hidden="true">★</span>}
                        {on.map((s) => <span key={s} className={`fxs-hx-tag fxs-hx-tag--${s}`} aria-hidden="true">{s === 0 ? "1P" : isAi ? "IA" : "2P"}</span>)}
                        {by.map((s) => <span key={`b${s}`} className={`fxs-hx-dot fxs-hx-dot--${s}`} aria-hidden="true" />)}
                      </button>
                    );
                  })}
                </div>
              ))}
              {list.length === 0 && <p className="fx-muted">Aucun membre ne correspond.</p>}
            </div>
            <p className="fxs-legend"><span aria-hidden="true">★</span> sprite dédié · {CUSTOM_IDS.length} apparences dessinées · au toucher, un appui vise, un second confirme</p>
          </>
        )}

        {phase !== "pick" && (
          <div className="fxs-order">
            {([0, 1] as const).map((side) => (
              <div key={side} className={`fxs-order-side fxs-order-side--${side}`}>
                <p className="fxs-order-h"><span className={`fx-player fx-player--${side}`}>{labels[side]}</span>{size > 1 ? (ordered(side) ? " ordre de passage" : " touche tes combattants dans l'ordre") : ""}</p>
                <div className="fxs-order-cards">
                  {teams[side].map((m, i) => {
                    const pos = size === 1 ? 0 : ord(side).indexOf(i);
                    const can = phase === "order" && !(isAi && side === 1) && pos < 0;
                    return (
                      <button key={m.id} type="button" className={`fxs-card${pos >= 0 ? " is-set" : ""}${phase === "order" && orderCur[side] === i ? " is-cur" : ""}`} disabled={!can}
                        style={{ "--fx-c": accentOf(m) } as React.CSSProperties} onClick={() => { setOrderCur((c) => { const n: [number, number] = [...c]; n[side] = i; return n; }); assignOrder(side, i); }}
                        aria-label={`${m.name}${pos >= 0 ? `, passe en ${pos + 1}` : ", choisir comme suivant"}`}>
                        <Portrait m={m} />
                        <b>{m.name}</b>
                        {pos >= 0 && <span className="fxs-card-n">{pos + 1}</span>}
                      </button>
                    );
                  })}
                </div>
                {size > 1 && !(isAi && side === 1) && (phase === "ready" || orders[side].length > 0) && <button type="button" className="fx-ghost" onClick={() => resetOrder(side)}><Undo2 size={16} aria-hidden="true" /> {phase === "ready" ? "Changer l'ordre" : "Refaire l'ordre"}</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="fxs-vs" aria-hidden="true">VS</span>

      <BigPortrait side={1} label={labels[1]} m={focusOf(1)} team={teams[1]} size={size} order={ord(1)} active={pointerSide === 1 || (isAi && rolling)} status={statusOf(1)} />

      <footer className="fxs-bar">
        <p className="fxs-help" aria-live="polite">
          {phase === "pick" ? (pointerSide === null ? (rolling ? "L'IA choisit son équipe…" : "") : `${labels[pointerSide]} : touche ${size > 1 ? `tes ${size} combattants, dans l'ordre de passage` : "ton combattant"}.`)
            : phase === "order" ? "Choisis qui combat en premier, en deuxième, puis en troisième." : "Tout est prêt. Lance le combat !"}
        </p>
        <div className="fxs-actions">
          <button type="button" className="fx-ghost fxs-icon fxs-back-thumb" onClick={onBack} aria-label="Retour aux modes de jeu"><ArrowLeft size={16} aria-hidden="true" /> <span>Retour</span></button>
          {phase === "pick" && (
            <>
              <button type="button" className="fx-ghost fxs-icon" onClick={() => undoFor(pointerSide ?? 1)} disabled={!teams[0].length} aria-label="Annuler le dernier choix"><Undo2 size={16} aria-hidden="true" /> <span>Annuler</span></button>
              {pointerSide !== null && <button type="button" className="fx-ghost fxs-icon" onClick={() => randomFor(pointerSide)} aria-label="Compléter au hasard"><Dices size={16} aria-hidden="true" /> <span>Aléatoire</span></button>}
              {pointerSide !== null && (
                <button type="button" className={`fx-cta fx-cta--sm fxs-pick fxs-pick--${pointerSide}`} onClick={() => pickFor(pointerSide, at(pointerSide))} disabled={!at(pointerSide) || teams[pointerSide].some((x) => x.id === at(pointerSide)?.id)}>
                  Confirmer {at(pointerSide)?.name ?? ""}
                </button>
              )}
            </>
          )}
          {phase !== "pick" && <button type="button" className="fx-ghost" onClick={() => undoFor(isAi ? 0 : 1)}><Undo2 size={16} aria-hidden="true" /> Modifier les équipes</button>}
          {phase === "ready" && <button type="button" className="fx-cta fx-cta--sm" onClick={() => onReady(...finalTeams())} autoFocus><Swords size={18} aria-hidden="true" /> Lancer le combat</button>}
        </div>
      </footer>
    </section>
  );
}

// ─── Écran VS ─────────────────────────────────────────────────────────────────
function VsScreen({ teams, labels, onDone, reduced }: { teams: [RosterMember[], RosterMember[]]; labels: [string, string]; onDone: () => void; reduced: boolean }) {
  const face = useFace();
  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 1800 : 2800);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") onDone(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onDone, reduced]);
  return (
    <section className="fx-vs" aria-label="Présentation du combat" onClick={onDone}>
      {[0, 1].map((side) => (
        <div key={side} className={`fx-vs-side fx-vs-side--${side}`}>
          <span className={`fx-player fx-player--${side}`}>{labels[side]}</span>
          <div className="fx-vs-team">
            {teams[side].map((m, i) => (
              <figure key={m.id} className={`fx-vs-card${i === 0 ? " is-lead" : ""}${i === 0 && face === "anime" && m.cut ? " has-cut" : ""}`} style={{ "--fx-c": accentOf(m), "--i": i } as React.CSSProperties}>
                {/* Chef d'équipe détouré (préférence Anime) : il sort de sa carte au moment de l'impact. */}
                {i === 0 && face === "anime" && m.cut
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img className="fx-vs-cut" src={m.cut.src} alt="" decoding="async" />
                  : <Portrait m={m} kind={face} />}
                <figcaption><b>{m.name}</b><span>{m.rank}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
      <p className="fx-vs-mark" aria-hidden="true">VS</p>
      <button type="button" className="fx-ghost fx-vs-skip" onClick={(e) => { e.stopPropagation(); onDone(); }}>Passer</button>
    </section>
  );
}

// ─── Application ──────────────────────────────────────────────────────────────
type Flow = "title" | "select" | "stage" | "vs" | "fight" | "result" | "continue" | "over";
const ARCADE_LENGTH = 6;
const SURVIE_KEY = "guilde-fighters-survie-record";
const shuffled = <T,>(a: T[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

export default function FightersApp({ roster }: { roster: RosterMember[] }) {
  const [screen, setScreen] = useState<Flow>("title");
  const [game, setGame] = useState<GameMode>("arcade");
  const [versus, setVersus] = useState<Versus>("ia");
  const [level, setLevel] = useState<AiLevel>("normal");
  const [teams, setTeams] = useState<[RosterMember[], RosterMember[]]>([[], []]);
  const [stage, setStage] = useState<Stage>(STAGES[0]);
  const [matchKey, setMatchKey] = useState(0);
  // Échelle d'adversaires (Arcade, Survie) et état de la partie en cours.
  const [ladder, setLadder] = useState<RosterMember[]>([]);
  const [step, setStep] = useState(0);
  const [p1Hp, setP1Hp] = useState(MAX_HP);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);
  const [over, setOver] = useState<{ title: string; line: string; best?: string } | null>(null);
  const reduced = useReducedMotion();
  const mode: Mode = game === "equipes" ? "team" : "duel";
  const human2 = (game === "versus" || game === "equipes") && versus === "local";
  const labels: [string, string] = game === "spectateur" ? ["IA 1", "IA 2"] : ["J1", human2 ? "J2" : "IA"];
  const toFight = useCallback(() => setScreen("fight"), []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);
  const ingame = screen !== "title";
  // Le lecteur de musique flottant se réduit (en pause) pendant les écrans plein jeu.
  const dock = useMusicDock();
  const dockMinimize = dock?.minimize;
  const dockActive = !!dock?.current;
  useEffect(() => { if (ingame && dockActive) dockMinimize?.(); }, [ingame, dockActive, dockMinimize]);
  useEffect(() => {
    document.body.classList.toggle("fx-ingame", ingame);
    return () => document.body.classList.remove("fx-ingame");
  }, [ingame]);

  const ladderGame = game === "arcade" || game === "survie";
  const opponent = ladderGame ? ladder[step] : null;
  const fightTeams: [RosterMember[], RosterMember[]] = opponent ? [teams[0], [opponent]] : teams;

  const onReady = useCallback((t1: RosterMember[], t2: RosterMember[]) => {
    setTeams([t1, t2]);
    if (game === "arcade" || game === "survie") {
      const others = shuffled(roster.filter((m) => m.id !== t1[0].id && m.id !== t2[0].id));
      setLadder(game === "arcade" ? [t2[0], ...others].slice(0, ARCADE_LENGTH) : [t2[0], ...others]);
      setStep(0); setP1Hp(MAX_HP);
    }
    setScreen("stage");
  }, [game, roster]);

  const finish = useCallback((r: MatchResult) => {
    setLastResult(r);
    if (game === "arcade") {
      if (r.winner === 0) {
        if (step + 1 >= ladder.length) {
          celebrate({ title: "Arcade terminée", sub: `${teams[0][0].name} a vaincu la Guilde`, big: true });
          setOver({ title: "Arcade terminée !", line: `${teams[0][0].name} a battu ${ladder.length} adversaires de la Guilde.` });
          setScreen("over");
        } else setScreen("result");
      } else setScreen("continue");
    } else if (game === "survie") {
      if (r.winner === 0) {
        // La vie se garde, avec un petit regain entre deux combats.
        setP1Hp(Math.min(MAX_HP, Math.max(1, r.hp[0]) + 150));
        setScreen("result");
      } else {
        const wins = step;
        let record = wins;
        try { record = Math.max(wins, Number(localStorage.getItem(SURVIE_KEY)) || 0); localStorage.setItem(SURVIE_KEY, String(record)); } catch { /* stockage indisponible */ }
        setOver({ title: "Fin de la survie", line: `${teams[0][0].name} : ${wins} victoire${wins > 1 ? "s" : ""} d'affilée.`, best: `Record sur cet appareil : ${record} victoire${record > 1 ? "s" : ""}.` });
        setScreen("over");
      }
    }
  }, [game, step, ladder.length, teams]);

  const nextFight = useCallback(() => {
    setStep((x) => x + 1);
    // Arène suivante de la liste, pour varier les décors.
    setStage((st) => STAGES[(STAGES.indexOf(st) + 1) % STAGES.length]);
    setMatchKey((k) => k + 1);
    setScreen("vs");
  }, []);

  if (roster.length < 2) {
    return (
      <div className="fx-root">
        <GuildeHeader activePage="fighters" accentColor="#ffd700" tone="dark" />
        <p className="fx-muted" style={{ padding: 32 }}>Il faut au moins deux membres publics pour combattre.</p>
      </div>
    );
  }

  const caption = game === "arcade" ? `Arcade ${step + 1} / ${ladder.length}` : game === "survie" ? `Survie · ${step} victoire${step > 1 ? "s" : ""}` : game === "entrainement" ? "Entraînement" : game === "spectateur" ? "Spectateur" : undefined;

  return (
    <div className={`fx-root${ingame ? " is-ingame" : ""}`}>
      {!ingame && <GuildeHeader activePage="fighters" accentColor="#ffd700" tone="dark" />}
      {screen === "title" && (
        <TitleScreen roster={roster} game={game} setGame={setGame} versus={versus} setVersus={setVersus} level={level} setLevel={setLevel} onStart={() => setScreen("select")} />
      )}
      {screen === "select" && (
        <SelectScreen key={`${game}-${versus}`} roster={roster} mode={mode} versus={human2 ? "local" : "ia"} reduced={reduced} onBack={() => setScreen("title")} onReady={onReady} />
      )}
      {screen === "stage" && <StageScreen onBack={() => setScreen("select")} onPick={(st) => { setStage(st); setMatchKey((k) => k + 1); setScreen("vs"); }} />}
      {screen === "vs" && <VsScreen teams={fightTeams} labels={labels} onDone={toFight} reduced={reduced} />}
      {screen === "fight" && (
        <FightScreen key={matchKey} teams={fightTeams} mode={mode} versus={human2 ? "local" : "ia"} level={level} labels={labels} reduced={reduced}
          stage={stage} cpuP1={game === "spectateur"} caption={caption}
          opts={game === "entrainement" ? { training: true } : game === "survie" ? { firstTo: 1, startHp: [p1Hp, MAX_HP] } : {}}
          onFinish={ladderGame ? finish : undefined}
          onRematch={() => setMatchKey((k) => k + 1)} onRoster={() => setScreen("select")} onHome={() => setScreen("title")} />
      )}
      {screen === "result" && opponent && (
        <WinScreen winner={teams[0][0]} loser={opponent} next={game === "arcade" ? `Adversaire suivant (${step + 2} / ${ladder.length})` : "Adversaire suivant"}
          line={[lastResult ? `Combo max : ${lastResult.bestCombo[0]} coups` : null, game === "survie" ? `Vie : ${Math.round((Math.min(MAX_HP, p1Hp) / MAX_HP) * 100)} %` : null].filter(Boolean).join(" · ")}
          onNext={nextFight} />
      )}
      {screen === "continue" && teams[0][0] && (
        <ContinueScreen player={teams[0][0]} onYes={() => { setMatchKey((k) => k + 1); setScreen("vs"); }}
          onNo={() => { setOver({ title: "Fin de partie", line: `${teams[0][0].name} s'arrête au combat ${step + 1} sur ${ladder.length}.` }); setScreen("over"); }} />
      )}
      {screen === "over" && over && (
        <OverScreen title={over.title} line={over.line} best={over.best} player={teams[0][0] ?? null} onAgain={() => setScreen("select")} onMenu={() => setScreen("title")} />
      )}
    </div>
  );
}
