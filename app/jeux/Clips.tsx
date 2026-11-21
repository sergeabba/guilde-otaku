"use client";

// Blind test vidéo : les génériques officiels de la page Cinéma, image floutée au départ
// qui se dévoile peu à peu. Plus tu réponds tôt (image encore floue), plus tu marques.
// Le titre et les commandes du lecteur YouTube sont masqués pendant la manche.
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, Film, Hand, Play, RotateCcw, Trophy, X } from "lucide-react";
import { blurAt, CLIP_BLUR, CLIP_MS, type ClipRound } from "../../lib/games/clips-config";
import { useMusicDock } from "../components/MusicDock";
import { api, LEVEL_LABEL, multLabel, pushLocal, type Game, type Level, type PlayerApi } from "./shared";

interface Result { score: number; max: number; good: number; saved: boolean; correction: { series: string; year: number | null; kind: "OP" | "ED"; key: string; ok: boolean; points: number }[] }
const embed = (r: ClipRound) => `https://www.youtube-nocookie.com/embed/${r.key}?autoplay=1&controls=0&disablekb=1&fs=0&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1&enablejsapi=1&start=${r.start}&origin=${encodeURIComponent(location.origin)}`;

export default function Clips({ level, player, onRanking }: { level: Level; player: PlayerApi; onRanking: (g: Game) => void }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "reveal" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<ClipRound[]>([]);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [ms, setMs] = useState(0);
  // La manche démarre quand la vidéo joue vraiment (ou, à défaut, après un appui).
  const [running, setRunning] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; ms: number }[]>([]);
  const started = useRef(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const dock = useMusicDock();
  const cfg = CLIP_BLUR[level];

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    dock?.minimize?.(); // une seule source de son
    try {
      const d = await api<{ token: string; rounds: ClipRound[] }>(`/api/games/generiques?level=${level}`);
      answers.current = []; setToken(d.token); setRounds(d.rounds); setR(0); setPicked(null); setMs(0); setRunning(false); setNeedTap(false); setPhase("play");
    } catch (e) { setError(e instanceof Error ? e.message : "Partie indisponible."); setPhase("intro"); }
  }

  const begin = useCallback(() => { if (!running) { started.current = performance.now(); setRunning(true); setNeedTap(false); } }, [running]);

  // Lecteur YouTube : on écoute son état (API iframe par messages) pour lancer le chrono
  // au vrai début de la lecture. Sans réponse en 3 s (lecture bloquée), un appui la lance.
  useEffect(() => {
    if (phase !== "play" || running) return;
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.event === "onStateChange" ? d.info === 1 : d?.info?.playerState === 1) begin();
      } catch { /* message étranger */ }
    };
    window.addEventListener("message", onMsg);
    const hello = window.setInterval(() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: `clip-${r}`, channel: "widget" }), "*"), 400);
    const late = window.setTimeout(() => setNeedTap(true), 3_000);
    return () => { window.removeEventListener("message", onMsg); window.clearInterval(hello); window.clearTimeout(late); };
  }, [phase, running, r, begin]);

  const finish = useCallback(async () => {
    setPhase("sending");
    try {
      const d = await api<Result>("/api/games/generiques", { token, answers: answers.current, ...player.payload() });
      setResult(d); setPhase("done");
      pushLocal({ game: "generiques", score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} génériques · ${LEVEL_LABEL[level]}` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player, level]);

  const answer = useCallback((choice: number | null) => {
    if (phase !== "play") return;
    answers.current[r] = { choice, ms: running ? Math.round(performance.now() - started.current) : CLIP_MS };
    setPicked(choice); setPhase("reveal");
  }, [phase, r, running]);
  const next = useCallback(() => {
    if (r + 1 >= rounds.length) { void finish(); return; }
    setR(r + 1); setPicked(null); setMs(0); setRunning(false); setNeedTap(false); setPhase("play");
  }, [r, rounds.length, finish]);

  // Chrono et défloutage.
  useEffect(() => {
    if (phase !== "play" || !running) return;
    const t = window.setInterval(() => {
      const e = performance.now() - started.current;
      setMs(e);
      if (e >= CLIP_MS) { window.clearInterval(t); answer(null); }
    }, 100);
    return () => window.clearInterval(t);
  }, [phase, running, answer]);

  const round = rounds[r];
  const blur = phase === "reveal" ? 0 : running ? blurAt(level, ms) : cfg.from;
  const left = Math.max(0, Math.ceil((CLIP_MS - ms) / 1000));
  const pts = Math.round((100 + 100 * (1 - Math.min(ms, CLIP_MS) / CLIP_MS)) * (level === "facile" ? 1 : level === "normal" ? 1.5 : 2));

  return (
    <section className="jx-panel jx-clips" aria-labelledby="jx-clips-title" style={{ "--gk-accent": "#f43f5e" } as React.CSSProperties}>
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Film size={38} /></span>
          <h2 id="jx-clips-title" className="gk-display">Blind test vidéo</h2>
          <p>8 génériques officiels, image floutée au départ qui se dévoile peu à peu. Trouve l&apos;anime le plus tôt possible : plus l&apos;image est floue quand tu réponds, plus tu marques (jusqu&apos;à 200 points par manche).</p>
          <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {level === "facile" ? "flou léger, net en 14 secondes, 4 propositions." : level === "expert" ? "très flou et en noir et blanc, net en 26 secondes, 6 propositions." : "flou marqué, net en 20 secondes, 4 propositions."}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer la partie"}</button>
          <p className="jx-note">Vidéos des chaînes officielles, lues avec le lecteur YouTube. Monte le son !</p>
        </div>
      )}

      {(phase === "play" || phase === "reveal") && round && (
        <div className="jx-round" key={r}>
          <div className="jx-round-head">
            <span className="jx-round-no">Générique {r + 1} / {rounds.length}</span>
            <span className="jx-timer"><Clock size={15} aria-hidden="true" /> {phase === "reveal" ? "—" : running ? `${left} s · ${pts} pts` : "Chargement…"}</span>
          </div>
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${phase === "reveal" ? 0 : Math.max(0, 1 - ms / CLIP_MS)})` }} /></div>

          <div className={`jx-clip-screen${phase === "reveal" ? " is-revealed" : ""}${phase === "play" && needTap && !running ? " is-tap" : ""}`} style={{ "--blur": `${blur.toFixed(1)}px`, "--gray": cfg.gray && phase !== "reveal" ? 1 : 0 } as React.CSSProperties}>
            <iframe ref={frame} key={round.key} src={embed(round)} title={`Générique ${r + 1}`} allow="autoplay; encrypted-media" tabIndex={-1} />
            {/* Caches : titre de la vidéo en haut, logo et commandes en bas. */}
            {phase === "play" && <><span className="jx-clip-mask is-top" aria-hidden="true" /><span className="jx-clip-mask is-bottom" aria-hidden="true" /></>}
            {/* Couche qui bloque les appuis (le titre YouTube resterait sinon visible au survol). */}
            {phase === "play" && !needTap && <span className="jx-clip-shield" aria-hidden="true" />}
            {phase === "play" && needTap && !running && (
              <button type="button" className="jx-clip-tap" onClick={begin}><Hand size={18} aria-hidden="true" /> Touche la vidéo si elle ne démarre pas, puis ici</button>
            )}
          </div>

          <div className="jx-choices">
            {round.choices.map((c, i) => (
              <button key={c} type="button" className="jx-choice" aria-pressed={picked === i} disabled={phase !== "play" || !running} onClick={() => answer(i)}>
                <b>{"ABCDEF"[i]}</b><span>{c}</span>
              </button>
            ))}
          </div>
          {phase === "reveal" && (
            <div className="jx-timeout" role="status">
              {picked === null ? "Temps écoulé." : "Réponse enregistrée."} La correction arrive à la fin.
              <button type="button" className="gk-btn gk-btn--sm" onClick={next}>{r + 1 >= rounds.length ? "Voir mon score" : "Générique suivant"}</button>
            </div>
          )}
        </div>
      )}

      {phase === "sending" && <p className="jx-note" role="status">Correction…</p>}
      {phase === "done" && result && (
        <div className="jx-result">
          <p className="jx-score"><b>{result.score}</b><span>/ {result.max} points</span></p>
          <p className="jx-verdict">{result.good} générique{result.good > 1 ? "s" : ""} trouvé{result.good > 1 ? "s" : ""} sur {result.correction.length} · {LEVEL_LABEL[level]}</p>
          {!result.saved && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <ol className="jx-correction">
            {result.correction.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : ""}>
                {c.ok ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
                <span><strong>{c.series}</strong><small>{[c.kind === "OP" ? "Opening" : "Ending", c.year].filter(Boolean).join(" · ")}</small></span>
                <b>{c.points ? `+${c.points}` : "0"}</b>
                <a className="jx-clip-watch" href={`https://www.youtube.com/watch?v=${c.key}`} target="_blank" rel="noopener noreferrer">Revoir</a>
              </li>
            ))}
          </ol>
          <div className="jx-actions">
            <button type="button" className="gk-btn" onClick={start}><RotateCcw size={18} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking("generiques")}><Trophy size={18} aria-hidden="true" /> Classement</button>
          </div>
        </div>
      )}
    </section>
  );
}
