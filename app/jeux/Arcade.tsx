"use client";

// Nouveaux jeux : Défi du jour, L'Affiche en morceaux, Plus ou moins, Tier list.
// Les corrigés restent côté serveur (jetons signés) ; ici, seulement l'affichage.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CalendarCheck, Check, Clock, Flame, Grid3x3, ListOrdered, Play, RotateCcw, Share2, Trophy, Volume2, X } from "lucide-react";
import { optimizedSrc } from "../../lib/img";
import { useShare } from "../hooks/useShare";
import { api, LEVEL_LABEL, multLabel, pushLocal, type Game, type Level, type Play as PlayRow, type PlayerApi } from "./shared";

type OnRanking = (g: Game) => void;

const TILE_MS = 2_000, DAILY_MS = 30_000;
const tilesAt = (ms: number, tileMs = TILE_MS) => Math.min(9, 1 + Math.floor(Math.max(0, ms) / tileMs));

/** Affiche cachée par 9 cases qui tombent une à une, dans un ordre tiré par le serveur. */
function Poster({ image, order, tiles, label, gray }: { image: string; order: number[]; tiles: number; label?: string; gray?: boolean }) {
  return (
    <div className={`jx-poster${gray ? " is-gray" : ""}`} role="img" aria-label={label ?? `Affiche partiellement cachée : ${tiles} case${tiles > 1 ? "s" : ""} sur 9 visibles`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedSrc(image, 640)} alt="" draggable={false} />
      <div className="jx-poster-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, cell) => <i key={cell} className={order.indexOf(cell) < tiles ? "is-open" : ""} style={{ "--k": cell } as React.CSSProperties} />)}
      </div>
    </div>
  );
}

/** Chronomètre d'une manche : temps écoulé, mis à jour 4 fois par seconde. */
function useElapsed(running: boolean, started: React.RefObject<number>) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setMs(performance.now() - started.current), 250);
    return () => window.clearInterval(t);
  }, [running, started]);
  return ms;
}

function Choices({ choices, picked, disabled, onPick, correct }: { choices: string[]; picked: number | null; disabled: boolean; onPick: (i: number) => void; correct?: number | null }) {
  return (
    <div className="jx-choices">
      {choices.map((c, i) => (
        <button key={i} type="button" className={`jx-choice${correct != null && i === correct ? " is-right" : ""}${correct != null && picked === i && i !== correct ? " is-wrong" : ""}`} aria-pressed={picked === i} disabled={disabled} onClick={() => onPick(i)}>
          <b>{"ABCD"[i]}</b><span>{c}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══ DÉFI DU JOUR ═══════════════════════════════════════════════════════ */
interface Daily { kind: "generique" | "affiche" | "membre"; prompt: string; preview?: string; image?: string; order?: number[]; choices: string[]; token: string }
interface DailyState { date: string; challenge: Daily; played: { score: number; ok: boolean; reveal: string; chosen: number | null } | null; streak: number; board: { available: boolean; best: PlayRow[] } }

export function DefiJour({ player, names, onRanking }: { player: PlayerApi; names: Map<number, string>; onRanking: OnRanking }) {
  const [data, setData] = useState<DailyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"ready" | "play" | "sending" | "done">("ready");
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<{ ok: boolean; score: number; answer: number; reveal: string } | null>(null);
  const started = useRef(0);
  const audio = useRef<HTMLAudioElement>(null);
  const ms = useElapsed(phase === "play", started);
  const { share, Toast } = useShare();

  const load = useCallback(() => {
    if (!player.device) return;
    api<DailyState>(`/api/games/defi-jour?device=${player.device}${player.me ? `&member=${player.me}` : ""}`).then((d) => { setData(d); setError(null); }).catch((e: Error) => setError(e.message));
  }, [player.device, player.me]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => () => { const a = audio.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } }, []);

  const begin = () => {
    if (!data) return;
    setPhase("play"); setPicked(null); started.current = performance.now();
    const a = audio.current;
    if (a && data.challenge.preview) { a.src = data.challenge.preview; void a.play().catch(() => {}); }
  };
  const answer = async (choice: number | null) => {
    if (!data || phase !== "play") return;
    setPicked(choice); setPhase("sending"); audio.current?.pause();
    try {
      const r = await api<{ ok: boolean; score: number; answer: number; reveal: string }>("/api/games/defi-jour", { token: data.challenge.token, choice, ms: Math.round(performance.now() - started.current), ...player.payload() });
      setRes(r); setPhase("done");
      pushLocal({ game: "defi-jour", score: r.score, max: 150, at: new Date().toISOString(), label: `${data.date} · ${r.ok ? "réussi" : "raté"}` });
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Réponse non enregistrée."); setPhase("done"); load(); }
  };
  // Temps écoulé : réponse vide.
  useEffect(() => { if (phase === "play" && ms >= DAILY_MS) void Promise.resolve().then(() => answer(null)); });

  if (error && !data) return <section className="jx-panel"><p className="jx-error" role="alert">{error}</p></section>;
  if (!data) return <section className="jx-panel"><p className="jx-note" role="status">Préparation du défi…</p></section>;
  const ch = data.challenge, done = data.played ?? (res ? { ...res, chosen: picked } : null);
  const correct = res?.answer ?? null;
  const dateFr = new Date(`${data.date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const who = (p: PlayRow) => (p.member_id && names.get(p.member_id)) || p.player_name || "Invité";
  const left = Math.max(0, Math.ceil((DAILY_MS - ms) / 1000));

  return (
    <section className="jx-panel jx-daily" aria-labelledby="jx-daily-title" style={{ "--gk-accent": "#f5a524" } as React.CSSProperties}>
      <audio ref={audio} preload="none" />
      <div className="jx-daily-head">
        <div>
          <p className="jx-daily-date"><CalendarCheck size={16} aria-hidden="true" /> {dateFr}</p>
          <h2 id="jx-daily-title" className="gk-display">Défi du jour</h2>
        </div>
        <p className={`jx-streak${data.streak ? " is-on" : ""}`} aria-label={`Série : ${data.streak} jour${data.streak > 1 ? "s" : ""} réussi${data.streak > 1 ? "s" : ""} d'affilée`}>
          <Flame size={22} aria-hidden="true" /><b>{data.streak}</b><small>jour{data.streak > 1 ? "s" : ""} d&apos;affilée</small>
        </p>
      </div>
      <p className="jx-ask">{ch.prompt}</p>

      {ch.kind === "affiche" && ch.image && ch.order && (phase !== "ready" || done) && <Poster image={ch.image} order={ch.order} tiles={done ? 9 : tilesAt(ms)} />}
      {ch.kind === "generique" && phase === "play" && <div className="jx-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--k": i } as React.CSSProperties} />)}</div>}

      {!done && phase === "ready" && (
        <div className="jx-intro">
          <p>Une seule question pour toute la Guilde aujourd&apos;hui, et une seule tentative. 30 secondes ; plus tu réponds vite, plus tu marques. Reviens chaque jour pour allonger ta série.</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={begin}>{ch.kind === "generique" ? <><Volume2 size={18} aria-hidden="true" /> Écouter et jouer</> : <><Play size={18} aria-hidden="true" /> Je joue</>}</button>
        </div>
      )}
      {!done && phase !== "ready" && (
        <>
          <div className="jx-round-head"><span className="jx-round-no">Une seule chance</span><span className="jx-timer"><Clock size={15} aria-hidden="true" /> {left} s</span></div>
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, 1 - ms / DAILY_MS)})` }} /></div>
          <Choices choices={ch.choices} picked={picked} disabled={phase !== "play"} onPick={(i) => void answer(i)} />
        </>
      )}
      {done && (
        <div className="jx-result">
          {res && <Choices choices={ch.choices} picked={picked} disabled correct={correct} onPick={() => {}} />}
          <p className={`jx-daily-verdict${done.ok ? " is-ok" : ""}`}>{done.ok ? <Check size={22} aria-hidden="true" /> : <X size={22} aria-hidden="true" />} {done.ok ? `Bravo ! +${done.score} points` : "Raté pour aujourd'hui"}</p>
          {done.reveal && <p className="jx-note">La réponse : <strong>{done.reveal}</strong></p>}
          <p className="jx-note">Nouveau défi demain à minuit (heure de Paris).</p>
          <div className="jx-actions">
          <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking("defi-jour")}><Trophy size={16} aria-hidden="true" /> Classement général</button>
          <button type="button" className="gk-btn gk-btn--ghost" onClick={() => share({ title: "Défi du jour · Guilde Otaku", text: `Défi du jour de la Guilde : ${done.ok ? `réussi (${done.score} pts)` : "raté"} · série de ${data.streak} jour${data.streak > 1 ? "s" : ""}. À ton tour !`, url: "/jeux" })}><Share2 size={16} aria-hidden="true" /> Partager</button>
          </div>
        </div>
      )}

      <h3 className="jx-h3">Classement du jour</h3>
      {!data.board.available ? <p className="jx-note">Le classement commun arrive bientôt.</p> : (
        <ol className="jx-board">
          {data.board.best.map((p, i) => (
            <li key={p.id ?? i} className={player.me && p.member_id === player.me ? "is-me" : ""}><b className="jx-rank">{i + 1}</b><span>{who(p)}</span><strong>{p.score ? `${p.score} pts` : "Raté"}</strong></li>
          ))}
          {!data.board.best.length && <li className="jx-empty">Personne n&apos;a encore joué aujourd&apos;hui. Sois le premier.</li>}
        </ol>
      )}
      <Toast />
    </section>
  );
}

/* ═══ L'AFFICHE EN MORCEAUX ══════════════════════════════════════════════ */
interface AfficheRound { image: string; choices: string[]; order: number[]; tileMs?: number; gray?: boolean }
interface AfficheResult { score: number; max: number; good: number; saved: boolean; correction: { title: string; cover: string | null; ok: boolean; tiles: number; points: number }[] }

export function Affiche({ player, onRanking, level }: { player: PlayerApi; onRanking: OnRanking; level: Level }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "reveal" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<AfficheRound[]>([]);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<AfficheResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; ms: number }[]>([]);
  const started = useRef(0);
  const ms = useElapsed(phase === "play", started);

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    try {
      const d = await api<{ token: string; rounds: AfficheRound[] }>(`/api/games/affiche?level=${level}`);
      d.rounds.forEach((x) => { const im = new Image(); im.src = optimizedSrc(x.image, 640)!; });
      answers.current = []; setToken(d.token); setRounds(d.rounds); setR(0); setPicked(null);
      started.current = performance.now(); setPhase("play");
    } catch (e) { setError(e instanceof Error ? e.message : "Partie indisponible."); setPhase("intro"); }
  }
  const finish = useCallback(async () => {
    setPhase("sending");
    try {
      const d = await api<AfficheResult>("/api/games/affiche", { token, answers: answers.current, ...player.payload() });
      setResult(d); setPhase("done");
      pushLocal({ game: "affiche", score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} affiches` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player]);
  const answer = useCallback((choice: number | null) => {
    if (phase !== "play") return;
    answers.current[r] = { choice, ms: Math.round(performance.now() - started.current) };
    setPicked(choice); setPhase("reveal");
    // L'affiche entière s'affiche un instant, puis manche suivante.
    window.setTimeout(() => {
      if (r + 1 >= rounds.length) { void finish(); return; }
      setR(r + 1); setPicked(null); started.current = performance.now(); setPhase("play");
    }, 1100);
  }, [phase, r, rounds.length, finish]);
  const round = rounds[r];
  const tileMs = round?.tileMs ?? TILE_MS;
  useEffect(() => { if (phase === "play" && ms >= 9 * tileMs + 4_000) void Promise.resolve().then(() => answer(null)); });
  const tiles = phase === "reveal" ? 9 : tilesAt(ms, tileMs);
  return (
    <section className="jx-panel" aria-labelledby="jx-affiche-title" style={{ "--gk-accent": "#3fa7d6" } as React.CSSProperties}>
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Grid3x3 size={38} /></span>
          <h2 id="jx-affiche-title" className="gk-display">L&apos;Affiche en morceaux</h2>
          <p>8 affiches d&apos;animes, cachées sous 9 cases. Une case tombe à intervalle régulier : trouve le titre le plus tôt possible. 100 points avec une seule case visible, 10 de moins par case en plus.</p>
          <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {level === "facile" ? "des animes très connus, une case toutes les 2 secondes." : level === "expert" ? "des animes moins connus, affiche en noir et blanc, une case toutes les 3 secondes." : "des animes connus, une case toutes les 2 secondes."}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer la partie"}</button>
          <p className="jx-note">Affiches et titres : AniList.</p>
        </div>
      )}
      {(phase === "play" || phase === "reveal") && round && (
        <div className="jx-round jx-affiche" key={r}>
          <div className="jx-round-head"><span className="jx-round-no">Affiche {r + 1} / {rounds.length}</span><span className="jx-timer"><Grid3x3 size={15} aria-hidden="true" /> {tiles} / 9 · {Math.max(0, 100 - (tiles - 1) * 10)} pts</span></div>
          <Poster image={round.image} order={round.order} tiles={tiles} gray={round.gray && phase !== "reveal"} />
          <Choices choices={round.choices} picked={picked} disabled={phase !== "play"} onPick={answer} />
        </div>
      )}
      {phase === "sending" && <p className="jx-note" role="status">Correction…</p>}
      {phase === "done" && result && (
        <div className="jx-result">
          <p className="jx-score"><b>{result.score}</b><span>/ {result.max} points</span></p>
          <p className="jx-verdict">{result.good} affiche{result.good > 1 ? "s" : ""} sur {result.correction.length} · {result.score >= 600 ? "Œil de lynx" : result.good >= 6 ? "Bien vu" : result.good >= 3 ? "Pas mal" : "Il va falloir regarder plus d'animes"}</p>
          {!result.saved && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <ol className="jx-correction">
            {result.correction.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : "is-ko"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.cover ? <img src={optimizedSrc(c.cover, 128)} alt="" width={56} height={56} loading="lazy" /> : <span className="jx-cover-empty" aria-hidden="true">?</span>}
                <span><strong>{c.title}</strong><small>{c.ok ? `Trouvé avec ${c.tiles} case${c.tiles > 1 ? "s" : ""}` : "Raté"}</small></span>
                <b>{c.ok ? `+${c.points}` : "0"}</b>
              </li>
            ))}
          </ol>
          <div className="jx-actions">
            <button type="button" className="gk-btn" onClick={start}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking("affiche")}><Trophy size={17} aria-hidden="true" /> Voir le classement</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══ PLUS OU MOINS ══════════════════════════════════════════════════════ */
interface PmCard { title: string; cover: string; year: number | null }
type PmMetric = "note" | "popularite";
const fmtMetric = (v: number, m: PmMetric) => (m === "popularite" ? new Intl.NumberFormat("fr-FR").format(v) : String(v));

export function PlusMoins({ player, onRanking, level }: { player: PlayerApi; onRanking: OnRanking; level: Level }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "wait" | "shown" | "over">("intro");
  const [cards, setCards] = useState<PmCard[]>([]);
  const [metrics, setMetrics] = useState<PmMetric[] | null>(null);
  const [cur, setCur] = useState(0);           // valeur de la carte de gauche (mesure de la question en cours)
  const [revealB, setRevealB] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastOk, setLastOk] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { share, Toast } = useShare();
  const metric: PmMetric = metrics?.[pos] ?? "note";

  async function start() {
    setPhase("loading"); setError(null);
    try {
      const d = await api<{ token: string; cards: PmCard[]; first: number; metrics: PmMetric[] | null }>(`/api/games/plus-moins?level=${level}`);
      setCards(d.cards); setMetrics(d.metrics); setCur(d.first); setRevealB(null); setPos(0); setToken(d.token); setStreak(0); setPoints(0); setLastOk(null); setSaved(false); setPhase("play");
    } catch (e) { setError(e instanceof Error ? e.message : "Partie indisponible."); setPhase("intro"); }
  }
  useEffect(() => { // précharge les deux affiches suivantes
    [pos + 1, pos + 2].forEach((i) => { const c = cards[i]; if (c) { const im = new Image(); im.src = optimizedSrc(c.cover, 384)!; } });
  }, [pos, cards]);

  async function guess(g: "plus" | "moins") {
    if (phase !== "play" || !token) return;
    setPhase("wait");
    try {
      const d = await api<{ ok: boolean; score: number; base: number; streak: number; points: number; over: boolean; token: string | null; saved: boolean }>("/api/games/plus-moins", { token, guess: g, ...player.payload() });
      setRevealB(d.score); setStreak(d.streak); setPoints(d.points); setLastOk(d.ok); setToken(d.token); setPhase("shown");
      window.setTimeout(() => {
        if (d.over) {
          setSaved(d.saved); setPhase("over");
          pushLocal({ game: "plus-moins", score: d.points, max: 0, at: new Date().toISOString(), label: `Série de ${d.streak} (${LEVEL_LABEL[level]})` });
        } else { setPos((p) => p + 1); setCur(d.base); setRevealB(null); setLastOk(null); setPhase("play"); }
      }, 1300);
    } catch (e) { setError(e instanceof Error ? e.message : "Réponse non prise en compte."); setPhase("over"); }
  }

  const A = cards[pos], B = cards[pos + 1];
  const card = (c: PmCard, value: number | null, side: "a" | "b") => (
    <figure className={`jx-pm-card is-${side}${side === "b" && lastOk != null ? (lastOk ? " is-ok" : " is-ko") : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedSrc(c.cover, 384)} alt="" />
      <figcaption>
        <strong>{c.title}</strong>
        {c.year && <small>{c.year}</small>}
        <span className="jx-pm-score" aria-live="polite">{value != null ? <><b>{fmtMetric(value, metric)}</b>{metric === "note" ? "/100" : " spect."}</> : <b>?</b>}</span>
      </figcaption>
    </figure>
  );
  return (
    <section className="jx-panel" aria-labelledby="jx-pm-title" style={{ "--gk-accent": "#22c55e" } as React.CSSProperties}>
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><ArrowUp size={30} /><ArrowDown size={30} /></span>
          <h2 id="jx-pm-title" className="gk-display">Plus ou moins</h2>
          <p>Deux animes. Le second a-t-il une meilleure ou une moins bonne note que le premier ? Notes moyennes réelles des spectateurs d&apos;AniList, sur 100. Enchaîne le plus de bonnes réponses : la première erreur arrête la série. 10 points par bonne réponse.</p>
          <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {level === "facile" ? "des animes très connus, notes bien différentes (8 points d'écart au moins)." : level === "expert" ? "des animes moins connus, notes très proches (5 points au plus), et parfois la popularité (nombre de spectateurs) à la place de la note." : "des animes connus."}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer la partie"}</button>
        </div>
      )}
      {(phase === "play" || phase === "wait" || phase === "shown") && A && B && (
        <div className="jx-pm" key={pos}>
          <p className="jx-round-head"><span className="jx-round-no">Série : {streak}</span><span className={`jx-timer${metric === "popularite" ? " jx-pm-pop" : ""}`}>{metric === "popularite" ? "Popularité (spectateurs)" : "Note AniList"}</span></p>
          <div className="jx-pm-duo">
            {card(A, cur, "a")}
            <div className="jx-pm-mid">
              <button type="button" className="jx-pm-btn is-up" onClick={() => guess("plus")} disabled={phase !== "play"}><ArrowUp size={22} aria-hidden="true" /> Plus</button>
              <span className="jx-vs" aria-hidden="true">VS</span>
              <button type="button" className="jx-pm-btn is-down" onClick={() => guess("moins")} disabled={phase !== "play"}><ArrowDown size={22} aria-hidden="true" /> Moins</button>
            </div>
            {card(B, revealB, "b")}
          </div>
          <p className="jx-ask jx-pm-ask">{B.title} : {metric === "popularite" ? "plus ou moins de spectateurs ?" : "mieux ou moins bien noté ?"}</p>
        </div>
      )}
      {phase === "over" && (
        <div className="jx-result">
          <p className="jx-score"><b>{streak}</b><span>bonne{streak > 1 ? "s" : ""} réponse{streak > 1 ? "s" : ""} d&apos;affilée · {points} pts</span></p>
          <p className="jx-verdict">{streak >= 15 ? "Flair infaillible" : streak >= 8 ? "Très fort" : streak >= 4 ? "Pas mal" : "Les notes d'AniList sont traîtres"}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          {!saved && !error && <p className="jx-note">Série gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <div className="jx-actions">
            <button type="button" className="gk-btn" onClick={start}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => share({ title: "Plus ou moins · Guilde Otaku", text: `Série de ${streak} à Plus ou moins, niveau ${LEVEL_LABEL[level]} (notes AniList). Tu fais mieux ?`, url: "/jeux?jeu=plus-moins" })}><Share2 size={16} aria-hidden="true" /> Partager</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking("plus-moins")}><Trophy size={17} aria-hidden="true" /> Voir le classement</button>
          </div>
        </div>
      )}
      <Toast />
    </section>
  );
}

/* ═══ TIER LIST ══════════════════════════════════════════════════════════ */
const TIERS = ["S", "A", "B", "C", "D"] as const;
type Tier = (typeof TIERS)[number];
const TIER_COLOR: Record<Tier, string> = { S: "#ff5f5f", A: "#ffa64d", B: "#ffd84d", C: "#7ddc7d", D: "#6fb4ff" };
interface TierItem { id: number; title: string; cover: string | null; followers?: string[] }
interface TierData { week: string; available: boolean; items: TierItem[]; mine: { id: number; tier: Tier }[] | null; voters: number; results: (TierItem & { avg: number; votes: number; tier: Tier })[]; twins: { a: string; b: string; pct: number; shared: number }[] }

export function TierList({ player }: { player: PlayerApi }) {
  const [data, setData] = useState<TierData | null>(null);
  const [ranks, setRanks] = useState<Record<number, Tier>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => {
    if (!player.device) return;
    api<TierData>(`/api/games/tier?device=${player.device}`).then((d) => {
      setData(d);
      if (d.mine) setRanks(Object.fromEntries(d.mine.map((e) => [e.id, e.tier])));
    }).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, [player.device]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api("/api/games/tier", { ranks: Object.entries(ranks).map(([id, tier]) => ({ id: Number(id), tier })), ...player.payload() });
      setMsg({ ok: true, text: "Classement enregistré. Tu peux le modifier jusqu'à dimanche soir." });
      load();
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Classement non enregistré." }); } finally { setBusy(false); }
  }

  if (!data) return <section className="jx-panel"><p className="jx-note" role="status">{msg?.text ?? "Chargement de la tier list…"}</p></section>;
  const count = Object.keys(ranks).length;
  return (
    <section className="jx-panel jx-tier" aria-labelledby="jx-tier-title" style={{ "--gk-accent": "#a78bfa" } as React.CSSProperties}>
      <div className="jx-intro is-left">
        <h2 id="jx-tier-title" className="gk-display">Tier list de la semaine</h2>
        <p>Classe les animes qui sortent cette semaine (calendrier Crunchyroll), de S (incontournable) à D (à éviter). Ensuite, découvre la moyenne de la Guilde et qui pense comme qui. Nouvelle tier list chaque lundi.</p>
      </div>
      {!data.items.length ? <p className="jx-note">Liste des animes indisponible pour le moment (AniList ne répond pas).</p> : (
        <ul className="jx-tier-pick">
          {data.items.map((it) => (
            <li key={it.id} className={ranks[it.id] ? "is-set" : ""} style={ranks[it.id] ? { "--t": TIER_COLOR[ranks[it.id]] } as React.CSSProperties : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.cover ? <img src={optimizedSrc(it.cover, 128)} alt="" width={48} height={68} loading="lazy" /> : <span className="jx-cover-empty" aria-hidden="true">?</span>}
              <span className="jx-tier-name"><strong>{it.title}</strong>{!!it.followers?.length && <small>Suivi par {it.followers.slice(0, 3).join(", ")}{it.followers.length > 3 ? ` et ${it.followers.length - 3} autre${it.followers.length > 4 ? "s" : ""}` : ""}</small>}</span>
              <span className="jx-tier-btns" role="group" aria-label={`Classer ${it.title}`}>
                {TIERS.map((t) => (
                  <button key={t} type="button" aria-pressed={ranks[it.id] === t} style={{ "--t": TIER_COLOR[t] } as React.CSSProperties}
                    onClick={() => setRanks((r) => { const n = { ...r }; if (n[it.id] === t) delete n[it.id]; else n[it.id] = t; return n; })}>{t}</button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="jx-actions is-left">
        <button type="button" className="gk-btn" onClick={save} disabled={busy || count < 3}><ListOrdered size={17} aria-hidden="true" /> {busy ? "Envoi…" : data.mine ? "Mettre à jour mon classement" : "Enregistrer mon classement"}</button>
        <span className="jx-note">{count} / {data.items.length} classés{count < 3 ? " (3 au moins)" : ""}</span>
      </div>
      {msg && <p className={msg.ok ? "jx-ok" : "jx-error"} role="status">{msg.text}</p>}

      <h3 className="jx-h3">La moyenne de la Guilde</h3>
      {!data.available ? <p className="jx-note">La tier list commune arrive bientôt.</p> : !data.results.length ? <p className="jx-note">Personne n&apos;a encore classé cette semaine. Lance-toi !</p> : (
        <>
          <p className="jx-note">{data.voters} classement{data.voters > 1 ? "s" : ""} cette semaine.</p>
          <div className="jx-tier-board">
            {TIERS.map((t) => {
              const row = data.results.filter((x) => x.tier === t);
              return (
                <div key={t} className="jx-tier-row">
                  <b style={{ background: TIER_COLOR[t] }}>{t}</b>
                  <span>
                    {row.map((x) => (
                      <span key={x.id} className="jx-tier-chip" title={`${x.title} · moyenne ${x.avg.toFixed(1)} sur 4 · ${x.votes} vote${x.votes > 1 ? "s" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {x.cover ? <img src={optimizedSrc(x.cover, 128)} alt={x.title} width={44} height={62} loading="lazy" /> : <i>{x.title}</i>}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
          {data.twins.length > 0 && (
            <>
              <h3 className="jx-h3">Ils pensent pareil</h3>
              <ul className="jx-twins">
                {data.twins.map((t, i) => <li key={i}><strong>{t.a} × {t.b}</strong><b>{t.pct} %</b><small>{t.shared} animes en commun</small></li>)}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
