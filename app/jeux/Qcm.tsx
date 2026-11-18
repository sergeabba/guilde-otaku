"use client";

// Jeux experts à questions : Devine par les thèmes, Qui l'a créé ?, Le studio, La voix.
// Un seul composant ; le serveur fournit les questions et garde le corrigé.
import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, Clock, Mic, PenTool, Play, RotateCcw, Tags, Trophy } from "lucide-react";
import { optimizedSrc } from "../../lib/img";
import type { QcmKind, QcmRound } from "../../lib/games/qcm";
import { TypedAnswer } from "./Dle";
import { api, LEVEL_LABEL, multLabel, pushLocal, type Game, type Level, type PlayerApi } from "./shared";

const MS: Record<Level, number> = { facile: 30_000, normal: 20_000, expert: 20_000 };
const THEME_STEP_MS = 4_000;

export const QCM_INFO: Record<QcmKind, { title: string; intro: string; levels: Record<Level, string>; color: string; Icon: typeof Tags; unit: string }> = {
  themes: {
    title: "Devine par les thèmes", color: "#38bdf8", Icon: Tags, unit: "animes",
    intro: "6 animes à reconnaître à partir de leurs thèmes (jamais de spoiler). Un thème de plus toutes les 4 secondes : 100 points avec un seul thème, 15 de moins par thème en plus.",
    levels: { facile: "des animes très connus, 4 titres proposés.", normal: "des animes connus, 6 titres proposés, pièges aux thèmes proches.", expert: "des animes moins connus, titre à taper (les petites fautes passent)." },
  },
  createur: {
    title: "Qui l'a créé ?", color: "#c084fc", Icon: PenTool, unit: "réponses",
    intro: "8 animes : retrouve l'auteur de l'œuvre d'origine (mangaka, romancier…). 100 points par bonne réponse, jusqu'à 50 de bonus si tu es rapide.",
    levels: { facile: "des animes très connus, 4 noms proposés, 30 secondes.", normal: "des animes connus, 6 noms proposés.", expert: "des animes moins connus, et une question sur deux porte sur le réalisateur." },
  },
  studio: {
    title: "Le studio", color: "#fb7185", Icon: Building2, unit: "studios",
    intro: "8 animes : quel studio d'animation les a produits ? MAPPA, ufotable, Kyoto Animation, Madhouse… 100 points par bonne réponse, jusqu'à 50 de bonus si tu es rapide.",
    levels: { facile: "des animes très connus, 4 studios proposés, 30 secondes.", normal: "des animes connus, 6 studios proposés.", expert: "des animes moins connus, 6 studios proposés." },
  },
  voix: {
    title: "La voix", color: "#34d399", Icon: Mic, unit: "voix",
    intro: "8 doubleurs japonais (seiyū) : quel personnage interprètent-ils ? 100 points par bonne réponse, jusqu'à 50 de bonus si tu es rapide.",
    levels: { facile: "des persos très connus, 4 propositions, 30 secondes.", normal: "des persos connus, 6 propositions.", expert: "des persos moins connus, 6 propositions." },
  },
};

interface Result { score: number; max: number; good: number; saved: boolean; correction: { label: string; sub?: string | null; image?: string | null; ok: boolean; points: number }[] }

export default function Qcm({ kind, level, player, onRanking }: { kind: QcmKind; level: Level; player: PlayerApi; onRanking: (g: Game) => void }) {
  const info = QCM_INFO[kind];
  const roundMs = kind === "themes" ? THEME_STEP_MS * 5 + 6_000 : MS[level];
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "reveal" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<QcmRound[]>([]);
  const [titles, setTitles] = useState<string[] | null>(null);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; text?: string; ms: number }[]>([]);
  const started = useRef(0);

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    try {
      const d = await api<{ token: string; rounds: QcmRound[]; titles?: string[] | null }>(`/api/games/qcm?kind=${kind}&level=${level}`);
      d.rounds.forEach((x) => { if (x.image) { const im = new Image(); im.src = optimizedSrc(x.image, 384)!; } });
      answers.current = []; setToken(d.token); setRounds(d.rounds); setTitles(d.titles ?? null); setR(0); setPicked(null); setTyped(null);
      started.current = performance.now(); setMs(0); setPhase("play");
    } catch (e) { setError(e instanceof Error ? e.message : "Partie indisponible."); setPhase("intro"); }
  }
  const finish = useCallback(async () => {
    setPhase("sending");
    try {
      const d = await api<Result>("/api/games/qcm", { token, answers: answers.current, ...player.payload() });
      setResult(d); setPhase("done");
      pushLocal({ game: kind, score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} ${info.unit} · ${LEVEL_LABEL[level]}` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player, kind, info.unit, level]);
  const answer = useCallback((choice: number | null, text?: string) => {
    if (phase !== "play") return;
    answers.current[r] = { choice, ms: Math.round(performance.now() - started.current), ...(text ? { text } : {}) };
    setPicked(choice); setTyped(text ?? null); setPhase("reveal");
    window.setTimeout(() => {
      if (r + 1 >= rounds.length) { void finish(); return; }
      setR(r + 1); setPicked(null); setTyped(null); started.current = performance.now(); setMs(0); setPhase("play");
    }, 700);
  }, [phase, r, rounds.length, finish]);
  useEffect(() => {
    if (phase !== "play") return;
    const t = window.setInterval(() => {
      const e = performance.now() - started.current;
      setMs(e);
      if (e >= roundMs) { window.clearInterval(t); answer(null); }
    }, 200);
    return () => window.clearInterval(t);
  }, [phase, answer, roundMs]);

  const round = rounds[r];
  const shown = kind === "themes" ? Math.min(5, 1 + Math.floor(ms / THEME_STEP_MS)) : 0;
  const Icon = info.Icon;
  return (
    <section className="jx-panel jx-qcm" aria-labelledby={`jx-${kind}-title`} style={{ "--gk-accent": info.color } as React.CSSProperties}>
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Icon size={38} /></span>
          <h2 id={`jx-${kind}-title`} className="gk-display">{info.title}</h2>
          <p>{info.intro}</p>
          <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {info.levels[level]}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer la partie"}</button>
          <p className="jx-note">Données : AniList.</p>
        </div>
      )}
      {(phase === "play" || phase === "reveal") && round && (
        <div className="jx-round" key={r}>
          <div className="jx-round-head">
            <span className="jx-round-no">Question {r + 1} / {rounds.length}</span>
            <span className="jx-timer"><Clock size={15} aria-hidden="true" /> {kind === "themes" ? `${shown}/5 thèmes · ${100 - 15 * (shown - 1)} pts` : `${Math.max(0, Math.ceil((roundMs - ms) / 1000))} s`}</span>
          </div>
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, 1 - ms / roundMs)})` }} /></div>
          <div className={`jx-qcm-q${round.image ? " has-img" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {round.image && <img src={optimizedSrc(round.image, 384)} alt="" width={110} height={156} />}
            <div>
              <p className="jx-qcm-prompt">{round.prompt}</p>
              {round.sub && <p className="jx-note">{round.sub}</p>}
              {round.tags && (
                <ul className="jx-qcm-tags" aria-label="Thèmes de l'anime">
                  {round.tags.map((t, i) => <li key={t} className={i < shown || phase === "reveal" ? "is-on" : ""}>{i < shown || phase === "reveal" ? t : "?"}</li>)}
                </ul>
              )}
            </div>
          </div>
          {round.choices.length === 0 && titles
            ? (phase === "reveal" && typed ? <p className="jx-note" role="status">Réponse envoyée : {typed}</p> : <TypedAnswer titles={titles} disabled={phase !== "play"} onSubmit={(t) => answer(null, t)} />)
            : (
              <div className={`jx-choices${round.choices.some((c) => c.image) ? " jx-qcm-faces" : ""}`}>
                {round.choices.map((c, i) => (
                  <button key={i} type="button" className="jx-choice" aria-pressed={picked === i} disabled={phase !== "play"} onClick={() => answer(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.image ? <img src={optimizedSrc(c.image, 128)} alt="" width={44} height={60} /> : <b>{"ABCDEF"[i]}</b>}
                    <span>{c.label}{c.sub && <small>{c.sub}</small>}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
      {phase === "sending" && <p className="jx-note" role="status">Correction…</p>}
      {phase === "done" && result && (
        <div className="jx-result">
          <p className="jx-score"><b>{result.score}</b><span>/ {result.max} points</span></p>
          <p className="jx-verdict">{result.good} {info.unit} sur {result.correction.length} · {LEVEL_LABEL[level]}</p>
          {!result.saved && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <ol className="jx-correction">
            {result.correction.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : "is-ko"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image ? <img src={optimizedSrc(c.image, 128)} alt="" width={56} height={56} loading="lazy" /> : <span className="jx-cover-empty" aria-hidden="true">?</span>}
                <span><strong>{c.label}</strong><small>{c.sub}</small></span>
                <b>{c.ok ? `+${c.points}` : "0"}</b>
              </li>
            ))}
          </ol>
          <div className="jx-actions">
            <button type="button" className="gk-btn" onClick={start}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking(kind)}><Trophy size={17} aria-hidden="true" /> Voir le classement</button>
          </div>
        </div>
      )}
    </section>
  );
}
