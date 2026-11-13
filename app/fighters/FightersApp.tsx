"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Bot, Dices, Search, Swords, Undo2, Users, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { rankAccents, rankRomaji } from "../config/ranks";
import type { AiLevel } from "../../lib/fighters/ai";

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
}

export type Mode = "team" | "duel";
export type Versus = "ia" | "local";
type Screen = "title" | "select" | "vs" | "fight";

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
function Portrait({ m, kind = "anime", className = "" }: { m: RosterMember; kind?: "anime" | "real"; className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const src = kind === "real" ? (m.photo ?? m.anime) : (m.anime ?? m.photo);
  const pos = src === m.photo ? m.photoPos : m.animePos;
  if (!src || broken === src) {
    return <span className={`fx-noimg ${className}`} aria-hidden="true">{m.name.slice(0, 2).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt="" loading="lazy" decoding="async" style={{ objectPosition: pos }} onError={() => setBroken(src)} />;
}

// ─── Écran titre ──────────────────────────────────────────────────────────────
function TitleScreen({ roster, mode, setMode, versus, setVersus, level, setLevel, onStart }: {
  roster: RosterMember[]; mode: Mode; setMode: (m: Mode) => void; versus: Versus; setVersus: (v: Versus) => void;
  level: AiLevel; setLevel: (l: AiLevel) => void; onStart: () => void;
}) {
  const strip = useMemo(() => roster.filter((m) => m.anime || m.photo).slice(0, 18), [roster]);
  return (
    <section className="fx-title" aria-labelledby="fx-title-h">
      <div className="fx-title-strips" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className={`fx-strip fx-strip--${row}`}>
            {strip.filter((_, i) => i % 3 === row).concat(strip.filter((_, i) => i % 3 === row)).map((m, i) => (
              <span key={`${m.id}-${i}`} className="fx-strip-cell" style={{ "--fx-c": accentOf(m) } as React.CSSProperties}><Portrait m={m} /></span>
            ))}
          </div>
        ))}
      </div>
      <div className="fx-title-shade" aria-hidden="true" />
      <div className="fx-title-inner">
        <p className="fx-kicker">Chapitre IV · L&apos;arène</p>
        <h1 id="fx-title-h" className="fx-logo"><span>GUILDE</span><span>FIGHTERS</span></h1>
        <p className="fx-tagline">Compose ton équipe de nakama, puis affronte la Guilde dans un vrai combat 2D.</p>

        <div className="fx-setup">
          <fieldset className="fx-choice">
            <legend>Format</legend>
            <button type="button" aria-pressed={mode === "team"} onClick={() => setMode("team")}><Users size={18} aria-hidden="true" /> Équipes 3 contre 3<small>Élimination : le vainqueur reste</small></button>
            <button type="button" aria-pressed={mode === "duel"} onClick={() => setMode("duel")}><Swords size={18} aria-hidden="true" /> Duel 1 contre 1<small>Deux manches gagnantes</small></button>
          </fieldset>
          <fieldset className="fx-choice">
            <legend>Adversaire</legend>
            <button type="button" aria-pressed={versus === "ia"} onClick={() => setVersus("ia")}><Bot size={18} aria-hidden="true" /> Contre l&apos;IA<small>Ordinateur, niveau réglable</small></button>
            <button type="button" aria-pressed={versus === "local"} onClick={() => setVersus("local")}><Users size={18} aria-hidden="true" /> 2 joueurs<small>Même clavier, sur ordinateur</small></button>
          </fieldset>
          {versus === "ia" && (
            <fieldset className="fx-choice fx-choice--small">
              <legend>Niveau de l&apos;IA</legend>
              {(["facile", "normal", "difficile"] as AiLevel[]).map((l) => (
                <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>{l[0].toUpperCase() + l.slice(1)}</button>
              ))}
            </fieldset>
          )}
        </div>
        <button type="button" className="fx-cta" onClick={onStart}>Choisir les combattants</button>
        <p className="fx-proto">Prototype jouable : tous les membres combattent avec deux silhouettes pixel art communes, teintées à leurs couleurs. Leurs portraits, rangs, statistiques et attaques spéciales sont les vrais.</p>
      </div>
    </section>
  );
}

// ─── Panneau d'un camp (gauche ou droite, en miroir) ──────────────────────────
function SidePanel({ side, label, focus, team, size, active, onRemove, idle }: {
  side: 0 | 1; label: string; focus: RosterMember | null; team: RosterMember[]; size: number; active: boolean; onRemove: (i: number) => void; idle?: string;
}) {
  const [kind, setKind] = useState<"anime" | "real">("anime");
  const accent = focus ? accentOf(focus) : side === 0 ? "#e8463a" : "#3a8de8";
  return (
    <aside className={`fx-side fx-side--${side}${active ? " is-active" : ""}`} style={{ "--fx-c": accent } as React.CSSProperties} aria-label={`${label}${active ? " (à toi de choisir)" : ""}`}>
      <div className="fx-side-head">
        <span className={`fx-player fx-player--${side}`}>{label}</span>
        {active && <span className="fx-turn">À toi de choisir</span>}
      </div>
      {focus ? (
        <div className="fx-hero">
          <div className="fx-hero-art">
            <Portrait m={focus} kind={kind} className="fx-hero-img" />
            {focus.photo && focus.anime && (
              <div className="fx-kind" role="group" aria-label="Portrait affiché">
                <button type="button" aria-pressed={kind === "anime"} onClick={() => setKind("anime")}>Anime</button>
                <button type="button" aria-pressed={kind === "real"} onClick={() => setKind("real")}>Réel</button>
              </div>
            )}
          </div>
          <div className="fx-hero-info">
            <h2 className="fx-hero-name">{focus.name}</h2>
            <p className="fx-hero-rank"><span>{focus.rank}</span>{rankRomaji[focus.rank as Rank] && <em>{rankRomaji[focus.rank as Rank]}</em>}</p>
            {focus.awards.length > 0 && <ul className="fx-awards">{focus.awards.map((a) => <li key={a}>{a}</li>)}</ul>}
            {focus.stats ? (
              <dl className="fx-stats">
                {(["force", "vitesse", "technique"] as const).map((k) => (
                  <div key={k}><dt>{k}</dt><dd><span style={{ width: `${Math.min(100, focus.stats![k])}%` }} /></dd><b>{focus.stats![k]}</b></div>
                ))}
              </dl>
            ) : <p className="fx-muted">Statistiques non renseignées : valeurs neutres en combat.</p>}
            {focus.special && <p className="fx-special"><b>Spéciale :</b> {focus.special.name}</p>}
            {focus.bio && <p className="fx-bio">{focus.bio}</p>}
          </div>
        </div>
      ) : <p className="fx-muted fx-hero-empty">{idle ?? "Survole ou touche un portrait."}</p>}
      <ol className="fx-team" aria-label={`Équipe ${label}`}>
        {Array.from({ length: size }, (_, i) => team[i]).map((m, i) => (
          <li key={i} className={m ? "is-filled" : ""} style={m ? ({ "--fx-c": accentOf(m) } as React.CSSProperties) : undefined}>
            {m ? (
              <>
                <Portrait m={m} />
                <span>{i + 1}. {m.name}</span>
                <button type="button" onClick={() => onRemove(i)} aria-label={`Retirer ${m.name}`}><X size={14} aria-hidden="true" /></button>
              </>
            ) : <span>{i + 1}. —</span>}
          </li>
        ))}
      </ol>
    </aside>
  );
}

// ─── Écran de sélection ───────────────────────────────────────────────────────
function SelectScreen({ roster, mode, versus, onBack, onReady }: {
  roster: RosterMember[]; mode: Mode; versus: Versus; onBack: () => void; onReady: (t1: RosterMember[], t2: RosterMember[]) => void;
}) {
  const size = teamSize(mode);
  const [teams, setTeams] = useState<[RosterMember[], RosterMember[]]>([[], []]);
  const picker: 0 | 1 = teams[0].length < size ? 0 : 1;
  const done = teams[0].length >= size && teams[1].length >= size;
  const [cursor, setCursor] = useState(0);
  const [rank, setRank] = useState<string>("Tous");
  const [q, setQ] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(0);
  const wasCursor = useRef<boolean | null>(null);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  const list = useMemo(() => roster.filter((m) => (rank === "Tous" || m.rank === rank) && m.name.toLowerCase().includes(q.trim().toLowerCase())), [roster, rank, q]);
  const focus = list[Math.min(cursor, Math.max(0, list.length - 1))] ?? null;
  const isAi = versus === "ia";
  const ranks = useMemo(() => RANK_FILTER_ORDER.filter((r) => roster.some((m) => m.rank === r)), [roster]);

  // Tirage parmi les vrais membres (sans doublon dans une même équipe), affiché ensuite.
  const fillRandom = useCallback((next: [RosterMember[], RosterMember[]], side: 0 | 1) => {
    const pool = roster.filter((m) => !next[side].some((x) => x.id === m.id));
    while (next[side].length < size && pool.length) next[side].push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }, [roster, size]);

  const pick = useCallback((m: RosterMember) => {
    setTeams((t) => {
      const side = t[0].length < size ? 0 : 1;
      if (t[side].length >= size || t[side].some((x) => x.id === m.id)) return t;
      const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
      next[side].push(m);
      // L'IA compose son équipe dès que J1 a terminé.
      if (side === 0 && isAi && next[0].length >= size) fillRandom(next, 1);
      return next;
    });
  }, [size, isAi, fillRandom]);

  const randomFill = useCallback((side: 0 | 1) => {
    setTeams((t) => {
      const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
      fillRandom(next, side);
      if (side === 0 && isAi) fillRandom(next, 1);
      return next;
    });
  }, [fillRandom, isAi]);

  const remove = (side: 0 | 1, i: number) => setTeams((t) => {
    const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
    next[side].splice(i, 1);
    if (side === 0 && isAi) next[1] = [];
    return next;
  });
  const undo = () => setTeams((t) => {
    const next: [RosterMember[], RosterMember[]] = [[...t[0]], [...t[1]]];
    if (next[1].length && !isAi) next[1].pop(); else { next[0].pop(); if (isAi) next[1] = []; }
    return next;
  });

  // Clavier : flèches pour déplacer le curseur, Entrée pour choisir, Retour arrière pour annuler.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const cols = Math.max(1, Math.round((gridRef.current?.clientWidth ?? 600) / ((gridRef.current?.firstElementChild as HTMLElement)?.offsetWidth || 80)));
      const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, KeyD: 1, KeyA: -1, KeyS: cols, KeyW: -cols };
      if (e.code in moves) { e.preventDefault(); setCursor((c) => Math.min(list.length - 1, Math.max(0, c + moves[e.code]))); }
      else if ((e.key === "Enter" || e.code === "KeyJ") && focus && !done) { e.preventDefault(); pick(focus); }
      else if (e.key === "Backspace") { e.preventDefault(); undo(); }
      else if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-i="${cursor}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [cursor]);

  const labels: [string, string] = ["J1", isAi ? "IA" : "J2"];
  const chosenBy = (m: RosterMember) => [teams[0].some((x) => x.id === m.id) ? 0 : -1, teams[1].some((x) => x.id === m.id) ? 1 : -1].filter((x) => x >= 0);

  return (
    <section className="fx-select" aria-labelledby="fx-select-h">
      <div className="fx-select-top">
        <button type="button" className="fx-ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Accueil</button>
        <h1 id="fx-select-h" className="fx-select-title">{mode === "team" ? "Choisis ton équipe de 3" : "Choisis ton combattant"}</h1>
        <span className="fx-select-count">{roster.length} nakama</span>
      </div>

      <div className="fx-select-body">
        <SidePanel side={0} label={labels[0]} focus={picker === 0 || done ? (picker === 0 ? focus : teams[0][0] ?? null) : teams[0][0] ?? null} team={teams[0]} size={size} active={picker === 0 && !done} onRemove={(i) => remove(0, i)} />

        <div className="fx-roster-zone">
          <div className="fx-filters">
            <label className="fx-search"><Search size={16} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setCursor(0); }} placeholder="Rechercher un membre" aria-label="Rechercher un membre" /></label>
            <div className="fx-chips" role="group" aria-label="Filtrer par rang">
              {["Tous", ...ranks].map((r) => (
                <button key={r} type="button" aria-pressed={rank === r} onClick={() => { setRank(r); setCursor(0); }}>{r}</button>
              ))}
            </div>
          </div>
          <div ref={gridRef} className="fx-roster" role="listbox" aria-label="Roster des membres" aria-activedescendant={focus ? `fx-m-${focus.id}` : undefined}>
            {list.map((m, i) => {
              const by = chosenBy(m);
              const isCursor = i === cursor;
              return (
                <button
                  key={m.id} id={`fx-m-${m.id}`} data-i={i} type="button" role="option" aria-selected={isCursor}
                  className={`fx-tile${isCursor ? ` is-cursor is-cursor-${picker}` : ""}${by.length ? " is-chosen" : ""}`}
                  style={{ "--fx-c": accentOf(m) } as React.CSSProperties}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") setCursor(i); }}
                  onPointerDown={() => { wasCursor.current = cursorRef.current === i; }}
                  onFocus={() => { if (wasCursor.current === null) setCursor(i); }}
                  onClick={() => {
                    // Toucher affiche d'abord le membre ; un second appui (ou « Choisir ») le sélectionne.
                    if ((wasCursor.current ?? isCursor) && !done) pick(m); else setCursor(i);
                    wasCursor.current = null;
                  }}
                  onDoubleClick={() => !done && pick(m)}
                  aria-label={`${m.name}, ${m.rank}${by.length ? `, déjà choisi par ${by.map((b) => labels[b]).join(" et ")}` : ""}`}
                >
                  <span className="fx-tile-art"><Portrait m={m} /></span>
                  <span className="fx-tile-name">{m.name}</span>
                  {isCursor && !done && <span className={`fx-cursor fx-cursor--${picker}`} aria-hidden="true">{labels[picker]}</span>}
                  {by.map((b) => <span key={b} className={`fx-mark fx-mark--${b}`} aria-hidden="true">{labels[b]}</span>)}
                </button>
              );
            })}
            {list.length === 0 && <p className="fx-muted">Aucun membre ne correspond.</p>}
          </div>
        </div>

        <SidePanel side={1} label={labels[1]} focus={picker === 1 && !done ? focus : teams[1][0] ?? null} team={teams[1]} size={size} active={picker === 1 && !done && !isAi} onRemove={(i) => remove(1, i)}
          idle={isAi ? `L'IA tirera au sort ${size > 1 ? "son équipe" : "son combattant"} parmi les membres dès que ton choix sera fait.` : "J2 choisit après J1."} />
      </div>

      <div className="fx-select-bar">
        <p className="fx-help" aria-live="polite">
          {done ? "Équipes complètes. Lance le combat !" : picker === 0 ? `J1 : touche un portrait puis « Choisir » (${teams[0].length}/${size}).` : `J2 : à toi (${teams[1].length}/${size}).`}
        </p>
        <div className="fx-actions">
          <button type="button" className="fx-ghost" onClick={undo} disabled={!teams[0].length}><Undo2 size={16} aria-hidden="true" /> Annuler</button>
          {!done && <button type="button" className="fx-ghost" onClick={() => randomFill(picker)}><Dices size={16} aria-hidden="true" /> Aléatoire</button>}
          {!done ? (
            <button type="button" className="fx-cta fx-cta--sm" onClick={() => focus && pick(focus)} disabled={!focus || teams[picker].some((x) => x.id === focus.id)}>
              Choisir {focus ? focus.name : ""}
            </button>
          ) : (
            <button type="button" className="fx-cta fx-cta--sm" onClick={() => onReady(teams[0], teams[1])}>Combattre</button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Écran VS ─────────────────────────────────────────────────────────────────
function VsScreen({ teams, labels, onDone, reduced }: { teams: [RosterMember[], RosterMember[]]; labels: [string, string]; onDone: () => void; reduced: boolean }) {
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
              <figure key={m.id} className={`fx-vs-card${i === 0 ? " is-lead" : ""}`} style={{ "--fx-c": accentOf(m), "--i": i } as React.CSSProperties}>
                <Portrait m={m} />
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
export default function FightersApp({ roster }: { roster: RosterMember[] }) {
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<Mode>("team");
  const [versus, setVersus] = useState<Versus>("ia");
  const [level, setLevel] = useState<AiLevel>("normal");
  const [teams, setTeams] = useState<[RosterMember[], RosterMember[]]>([[], []]);
  const [matchKey, setMatchKey] = useState(0);
  const reduced = useReducedMotion();
  const labels: [string, string] = ["J1", versus === "ia" ? "IA" : "J2"];
  const toFight = useCallback(() => setScreen("fight"), []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);
  const ingame = screen === "vs" || screen === "fight";
  useEffect(() => {
    document.body.classList.toggle("fx-ingame", ingame);
    return () => document.body.classList.remove("fx-ingame");
  }, [ingame]);

  if (roster.length < 2) {
    return (
      <div className="fx-root">
        <GuildeHeader activePage="fighters" accentColor="#ffd700" tone="dark" />
        <p className="fx-muted" style={{ padding: 32 }}>Il faut au moins deux membres publics pour combattre.</p>
      </div>
    );
  }

  return (
    <div className={`fx-root${ingame ? " is-ingame" : ""}`}>
      {!ingame && <GuildeHeader activePage="fighters" accentColor="#ffd700" tone="dark" />}
      {screen === "title" && (
        <TitleScreen roster={roster} mode={mode} setMode={setMode} versus={versus} setVersus={setVersus} level={level} setLevel={setLevel} onStart={() => setScreen("select")} />
      )}
      {screen === "select" && (
        <SelectScreen key={`${mode}-${versus}`} roster={roster} mode={mode} versus={versus} onBack={() => setScreen("title")}
          onReady={(t1, t2) => { setTeams([t1, t2]); setScreen("vs"); }} />
      )}
      {screen === "vs" && <VsScreen teams={teams} labels={labels} onDone={toFight} reduced={reduced} />}
      {screen === "fight" && (
        <FightScreen key={matchKey} teams={teams} mode={mode} versus={versus} level={level} labels={labels} reduced={reduced}
          onRematch={() => setMatchKey((k) => k + 1)} onRoster={() => setScreen("select")} onHome={() => setScreen("title")} />
      )}
    </div>
  );
}
