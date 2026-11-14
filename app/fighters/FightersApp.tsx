"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Bot, Dices, Search, Swords, Undo2, Users } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { rankAccents, rankRomaji } from "../config/ranks";
import type { AiLevel } from "../../lib/fighters/ai";
import { CUSTOM_IDS } from "../../lib/fighters/characters";
import FighterPreview from "./FighterPreview";
import { useMusicDock } from "../components/MusicDock";

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
        <p className="fx-proto">Personnages en pixel art inspirés des photos de la Guilde. Combat à quatre boutons, garde haute et basse, combos et jauge de super. Les interprétations visuelles restent à valider par les membres.</p>
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
  const [kind, setKind] = useState<"anime" | "real">("anime");
  return (
    <aside className={`fxs-side fxs-side--${side}${active ? " is-active" : ""}`} style={{ "--fx-c": m ? accentOf(m) : side === 0 ? "#e8463a" : "#3a8de8" } as React.CSSProperties} aria-label={`${label} : ${m ? m.name : "aucun membre"}`}>
      <div className="fxs-art">
        {m ? <Portrait key={`${m.id}-${kind}`} m={m} kind={kind} className="fxs-art-img" /> : <span className="fxs-art-empty" aria-hidden="true">?</span>}
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
  const [orderCur, setOrderCur] = useState<[number, number]>([0, 0]);
  const [rank, setRank] = useState<string>("Tous");
  const [q, setQ] = useState("");
  const [rolling, setRolling] = useState(false);
  const [geo, setGeo] = useState({ t: 64, cols: 8 });
  const gridRef = useRef<HTMLDivElement>(null);
  /** Toucher : un premier appui montre le membre, un second le choisit. */
  const armed = useRef<number | null>(null);
  const lastPointer = useRef<string>("mouse");

  const list = useMemo(() => roster.filter((m) => (rank === "Tous" || m.rank === rank) && m.name.toLowerCase().includes(q.trim().toLowerCase())), [roster, rank, q]);
  const ranks = useMemo(() => RANK_FILTER_ORDER.filter((r) => roster.some((m) => m.rank === r)), [roster]);
  const full = (side: 0 | 1) => teams[side].length >= size;
  const picked = full(0) && full(1);
  const ordered = (side: 0 | 1) => size === 1 || orders[side].length >= size;
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
    setOrders([[], []]);
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

  // Ordre de passage tiré au sort pour l'IA.
  useEffect(() => {
    if (phase !== "order" || !isAi || ordered(1)) return;
    const idx = Array.from({ length: size }, (_, i) => i).sort(() => Math.random() - 0.5);
    setOrders((o) => [o[0], idx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isAi, size]);

  const assignOrder = (side: 0 | 1, i: number) => setOrders((o) => {
    if (o[side].includes(i) || o[side].length >= size) return o;
    const next: [number[], number[]] = [[...o[0]], [...o[1]]];
    next[side].push(i);
    if (next[side].length === size - 1) next[side].push([...Array(size).keys()].find((k) => !next[side].includes(k))!);
    return next;
  });
  const resetOrder = (side: 0 | 1) => setOrders((o) => (side === 0 ? [[], o[1]] : [o[0], []]));
  const finalTeams = (): [RosterMember[], RosterMember[]] => [0, 1].map((s) => (size === 1 ? teams[s] : orders[s].map((i) => teams[s][i]))) as [RosterMember[], RosterMember[]];

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

  const focusOf = (side: 0 | 1) => (phase === "pick" && !full(side) ? at(side) : teams[side][phase === "order" ? orderCur[side] : orders[side][0] ?? 0] ?? at(side));
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

      <BigPortrait side={0} label={labels[0]} m={focusOf(0)} team={teams[0]} size={size} order={orders[0]} active={pointerSide === 0 || phase !== "pick"} status={statusOf(0)} />

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
                        onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
                        onClick={() => {
                          if (pointerSide === null) return;
                          // Souris ou clavier : le clic choisit. Toucher : premier appui = aperçu, second = choix.
                          const touch = lastPointer.current !== "mouse";
                          if (!touch || armed.current === i) { armed.current = null; pickFor(pointerSide, m); return; }
                          armed.current = i;
                          setCursors((c) => { const n: [number, number] = [...c]; n[pointerSide] = i; return n; });
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
            <p className="fxs-legend"><span aria-hidden="true">★</span> sprite dédié · {CUSTOM_IDS.length} apparences dessinées · glisse pour parcourir le roster</p>
          </>
        )}

        {phase !== "pick" && (
          <div className="fxs-order">
            {([0, 1] as const).map((side) => (
              <div key={side} className={`fxs-order-side fxs-order-side--${side}`}>
                <p className="fxs-order-h"><span className={`fx-player fx-player--${side}`}>{labels[side]}</span>{size > 1 ? (ordered(side) ? " ordre fixé" : side === 1 && isAi ? " tirage…" : " touche tes combattants dans l'ordre") : ""}</p>
                <div className="fxs-order-cards">
                  {teams[side].map((m, i) => {
                    const pos = size === 1 ? 0 : orders[side].indexOf(i);
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
                {size > 1 && phase === "order" && !(isAi && side === 1) && orders[side].length > 0 && <button type="button" className="fx-ghost" onClick={() => resetOrder(side)}><Undo2 size={16} aria-hidden="true" /> Refaire l&apos;ordre</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      <BigPortrait side={1} label={labels[1]} m={focusOf(1)} team={teams[1]} size={size} order={orders[1]} active={pointerSide === 1 || (isAi && rolling)} status={statusOf(1)} />

      <footer className="fxs-bar">
        <p className="fxs-help" aria-live="polite">
          {phase === "pick" ? (pointerSide === null ? (rolling ? "L'IA choisit son équipe…" : "") : `${labels[pointerSide]} : touche un portrait, puis touche-le à nouveau (ou « Choisir »).`)
            : phase === "order" ? "Choisis qui combat en premier, en deuxième, puis en troisième." : "Tout est prêt. Lance le combat !"}
        </p>
        <div className="fxs-actions">
          {phase === "pick" && (
            <>
              <button type="button" className="fx-ghost fxs-icon" onClick={() => undoFor(pointerSide ?? 1)} disabled={!teams[0].length} aria-label="Annuler le dernier choix"><Undo2 size={16} aria-hidden="true" /> <span>Annuler</span></button>
              {pointerSide !== null && <button type="button" className="fx-ghost fxs-icon" onClick={() => randomFor(pointerSide)} aria-label="Compléter au hasard"><Dices size={16} aria-hidden="true" /> <span>Aléatoire</span></button>}
              {pointerSide !== null && (
                <button type="button" className={`fx-cta fx-cta--sm fxs-pick fxs-pick--${pointerSide}`} onClick={() => pickFor(pointerSide, at(pointerSide))} disabled={!at(pointerSide) || teams[pointerSide].some((x) => x.id === at(pointerSide)?.id)}>
                  Choisir {at(pointerSide)?.name ?? ""}
                </button>
              )}
            </>
          )}
          {phase !== "pick" && <button type="button" className="fx-ghost" onClick={() => { setOrders([[], []]); undoFor(isAi ? 0 : 1); }}><Undo2 size={16} aria-hidden="true" /> Modifier les équipes</button>}
          {phase === "ready" && <button type="button" className="fx-cta fx-cta--sm" onClick={() => onReady(...finalTeams())} autoFocus><Swords size={18} aria-hidden="true" /> Lancer le combat</button>}
        </div>
      </footer>
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
  const [screen, setScreen] = useState<Screen>("select");
  const [mode, setMode] = useState<Mode>("team");
  const [versus, setVersus] = useState<Versus>("ia");
  const [level, setLevel] = useState<AiLevel>("normal");
  const [teams, setTeams] = useState<[RosterMember[], RosterMember[]]>([[], []]);
  const [matchKey, setMatchKey] = useState(0);
  const reduced = useReducedMotion();
  const labels: [string, string] = ["J1", versus === "ia" ? "IA" : "J2"];
  const toFight = useCallback(() => setScreen("fight"), []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);
  const ingame = screen === "select" || screen === "vs" || screen === "fight";
  // Le lecteur de musique flottant se réduit (en pause) pendant les écrans plein jeu.
  const dock = useMusicDock();
  const dockMinimize = dock?.minimize;
  const dockActive = !!dock?.current;
  useEffect(() => { if (ingame && dockActive) dockMinimize?.(); }, [ingame, dockActive, dockMinimize]);
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
        <SelectScreen key={`${mode}-${versus}`} roster={roster} mode={mode} versus={versus} reduced={reduced} onBack={() => setScreen("title")}
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
