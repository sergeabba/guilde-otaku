"use client";

// Quiz des génériques en direct : plusieurs joueurs, chacun sur son téléphone, mêmes
// extraits au même moment, scores en direct. L'hôte mène la partie (il tient le jeton
// signé et demande le corrigé de chaque manche au serveur, une fois la manche finie).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock, Copy, Crown, LogOut, Play, Radio, RotateCcw, Share2, Users, Volume2 } from "lucide-react";
import type { Member } from "../../data/members";
import type { QuizRound } from "../../lib/games/quiz";
import { useShare } from "../hooks/useShare";
import { applyRound, isRoomCode, LIVE_REVEAL_MS, LIVE_ROUND_MS, liveRanking, roomCode, type LiveAnswer, type LivePeer } from "./live-logic";
import { openRoom, type LiveTransport } from "./live-transport";
import type { PlayerApi } from "./shared";

type Mode = "generique" | "nostalgie";
interface Reveal { correct: number; anime: string; title: string; artist: string; cover: string | null; gains: Record<string, number> }
interface Snap { phase: "lobby" | "question" | "reveal" | "end"; mode: Mode; round: number; total: number; rounds: QuizRound[] | null; scores: Record<string, number>; answered: string[]; reveal: Reveal | null; seq: number }

const LOBBY = (mode: Mode): Snap => ({ phase: "lobby", mode, round: 0, total: 0, rounds: null, scores: {}, answered: [], reveal: null, seq: 0 });
// Son vide : un appui sur « Créer » ou « Rejoindre » autorise ensuite la lecture sur iPhone.
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export default function Live({ player, members, initialCode }: { player: PlayerApi; members: Member[]; initialCode: string | null }) {
  const local = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("live") === "local";
  const [code, setCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState(initialCode ?? "");
  const [host, setHost] = useState(false);
  const [mode, setMode] = useState<Mode>("generique");
  const [peers, setPeers] = useState<LivePeer[]>([]);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snap>(LOBBY("generique"));
  const [mine, setMine] = useState<{ round: number; choice: number } | null>(null);
  const [left, setLeft] = useState(LIVE_ROUND_MS);
  const [needTap, setNeedTap] = useState(false);
  const [hostGone, setHostGone] = useState(false);
  const { share, Toast } = useShare();

  const audio = useRef<HTMLAudioElement>(null);
  const tx = useRef<LiveTransport | null>(null);
  const snapRef = useRef(snap); snapRef.current = snap;
  const peersRef = useRef(peers); peersRef.current = peers;
  const token = useRef("");
  const answers = useRef<Record<number, Record<string, LiveAnswer>>>({});
  const started = useRef(0);
  const timers = useRef<number[]>([]);
  const ending = useRef(-1);

  // Essais locaux : plusieurs onglets du même navigateur partagent l'appareil, d'où un suffixe par onglet.
  const [tabId] = useState(() => Math.random().toString(36).slice(2, 6));
  const me = useMemo<LivePeer>(() => {
    const m = player.me ? members.find((x) => x.id === player.me) : undefined;
    const name = m?.name ?? (player.name.trim() || `Invité ${player.device.slice(-3).toUpperCase()}`);
    return { pid: local ? `${player.device}-${tabId}` : player.device, name: local && !m && !player.name.trim() ? `Invité ${tabId.toUpperCase()}` : name, image: m ? m.animeChar || m.photo || null : null, host };
  }, [player.me, player.name, player.device, members, host, local, tabId]);

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  /* ── Hôte : diffuse l'état, mène les manches ─────────────────────────── */
  const publish = useCallback((next: Snap) => {
    const s = { ...next, seq: snapRef.current.seq + 1 };
    snapRef.current = s; setSnap(s);
    tx.current?.send("state", s);
  }, []);

  const endRound = useCallback(async (round: number) => {
    if (ending.current === round) return;
    ending.current = round;
    const s = snapRef.current;
    try {
      const res = await fetch("/api/games/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current, round }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Corrigé indisponible.");
      const { scores, gains } = applyRound(s.scores, answers.current[round] ?? {}, r.correct);
      publish({ ...s, phase: "reveal", scores, reveal: { correct: r.correct, anime: r.anime, title: r.title, artist: r.artist, cover: r.cover, gains } });
      later(() => {
        const cur = snapRef.current;
        if (round + 1 >= cur.total) publish({ ...cur, phase: "end" });
        else startRound(round + 1);
      }, LIVE_REVEAL_MS);
    } catch (e) { setError(e instanceof Error ? e.message : "Corrigé indisponible."); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publish]);

  const startRound = useCallback((round: number) => {
    clearTimers();
    publish({ ...snapRef.current, phase: "question", round, answered: [], reveal: null });
    later(() => void endRound(round), LIVE_ROUND_MS + 800);
  }, [publish, endRound]);

  const onAnswer = useCallback((pid: string, a: { round: number; choice: number; ms: number }) => {
    const s = snapRef.current;
    if (s.phase !== "question" || a.round !== s.round || !Number.isInteger(a.choice)) return;
    const box = (answers.current[s.round] ??= {});
    if (box[pid]) return;
    box[pid] = { choice: a.choice, ms: Math.max(0, Math.min(Number(a.ms) || LIVE_ROUND_MS, LIVE_ROUND_MS)) };
    const answered = Object.keys(box);
    publish({ ...s, answered });
    // Tout le monde a répondu : corrigé tout de suite.
    if (peersRef.current.every((p) => answered.includes(p.pid))) later(() => void endRound(s.round), 500);
  }, [publish, endRound]);

  async function launch() {
    setError(null);
    try {
      const res = await fetch(snap.mode === "nostalgie" ? "/api/games/quiz?mode=nostalgie" : "/api/games/quiz", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Quiz indisponible.");
      token.current = d.token; answers.current = {}; ending.current = -1;
      snapRef.current = { ...snapRef.current, rounds: d.rounds, total: d.rounds.length, scores: {} };
      startRound(0);
    } catch (e) { setError(e instanceof Error ? e.message : "Quiz indisponible."); }
  }

  /* ── Connexion à une salle ────────────────────────────────────────────── */
  const connect = useCallback((c: string, asHost: boolean, m: Mode) => {
    tx.current?.close(); tx.current = null; clearTimers();
    setCode(c); setHost(asHost); setPeers([]); setOnline(false); setError(null); setHostGone(false); setMine(null);
    const first = LOBBY(m); snapRef.current = first; setSnap(first);
    try { window.history.replaceState(null, "", `/jeux?jeu=direct&salle=${c}${local ? "&live=local" : ""}`); } catch { /* ignoré */ }
  }, [local]);

  // Ouvre le canal quand la salle (ou l'identité) change.
  useEffect(() => {
    if (!code || !player.device) return;
    const t = openRoom(code, me, {
      onStatus: (ok, err) => { setOnline(ok); if (err) setError(err); },
      onPeers: (list) => setPeers(list),
      onMessage: (type, data, from) => {
        if (type === "state" && !host) { const s = data as Snap; if (s.seq >= snapRef.current.seq || s.phase === "lobby") { snapRef.current = s; setSnap(s); } }
        if (type === "answer" && host) onAnswer(from, data as { round: number; choice: number; ms: number });
        if (type === "moved" && !host) connect(String(data), false, snapRef.current.mode);
        if (type === "hello" && host) tx.current?.send("state", snapRef.current);
      },
    }, local);
    tx.current = t;
    if (!host) later(() => t.send("hello", null), 400);
    return () => t.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, host, me.pid, me.name, me.image, local]);

  // L'hôte renvoie l'état quand quelqu'un arrive (et régulièrement, en cas de message perdu).
  useEffect(() => { if (host && online) tx.current?.send("state", snapRef.current); }, [peers, host, online]);
  useEffect(() => {
    if (!host || !online) return;
    const t = window.setInterval(() => tx.current?.send("state", snapRef.current), 3000);
    return () => window.clearInterval(t);
  }, [host, online]);

  // Joueur : l'hôte a disparu depuis 8 s.
  useEffect(() => {
    if (host || !online || !code) return;
    if (peers.some((p) => p.host)) { const id = window.setTimeout(() => setHostGone(false), 0); return () => window.clearTimeout(id); }
    const t = window.setTimeout(() => setHostGone(true), 8000);
    return () => window.clearTimeout(t);
  }, [peers, host, online, code]);

  useEffect(() => () => { tx.current?.close(); clearTimers(); const a = audio.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } }, []);

  /* ── Manche en cours : extrait et chronomètre locaux ──────────────────── */
  const qKey = snap.phase === "question" ? snap.round : -1;
  useEffect(() => {
    if (qKey < 0 || !snapRef.current.rounds) return;
    started.current = performance.now();
    // Début de partie : la question remonte en haut de l'écran.
    if (qKey === 0) document.querySelector(".jx-live")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const a = audio.current, src = snapRef.current.rounds[qKey]?.preview;
    if (a && src) { a.pause(); a.src = src; a.currentTime = 0; a.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true)); }
    const t = window.setInterval(() => setLeft(Math.max(0, LIVE_ROUND_MS - (performance.now() - started.current))), 200);
    return () => { window.clearInterval(t); a?.pause(); };
  }, [qKey]);

  function answer(choice: number) {
    if (snap.phase !== "question" || mine?.round === snap.round) return;
    const ms = Math.round(performance.now() - started.current);
    setMine({ round: snap.round, choice });
    if (host) onAnswer(me.pid, { round: snap.round, choice, ms });
    else tx.current?.send("answer", { round: snap.round, choice, ms });
  }

  const unlock = () => { const a = audio.current; if (!a) return; a.src = SILENCE; void a.play().catch(() => {}); };
  const create = () => { unlock(); connect(roomCode(), true, mode); };
  const join = () => { const c = joinInput.trim().toUpperCase(); if (!isRoomCode(c)) { setError("Code de salle invalide (5 caractères)."); return; } unlock(); connect(c, false, "generique"); };
  const leave = () => { tx.current?.close(); tx.current = null; clearTimers(); setCode(null); setHost(false); setPeers([]); try { window.history.replaceState(null, "", "/jeux?jeu=direct"); } catch { /* ignoré */ } };
  // Revanche : on prévient la salle, puis l'hôte change de salle un instant après (le message part d'abord).
  const rematch = () => { const c = roomCode(); tx.current?.send("moved", c); window.setTimeout(() => connect(c, true, snapRef.current.mode), 400); };
  const link = code ? `/jeux?jeu=direct&salle=${code}` : "";
  const invite = () => share({ title: "Quiz en direct · Guilde Otaku", text: `Rejoins ma salle pour un quiz des génériques en direct ! Code : ${code}`, url: link });

  const board = liveRanking(snap.scores, peers);
  const face = (p: { name: string; image: string | null }, size = 40) => (
    <span className="jx-face-sm" style={{ width: size, height: size }}>{p.image ? <Image src={p.image} alt="" width={size} height={size} sizes={`${size}px`} /> : <b>{p.name.slice(0, 1).toUpperCase()}</b>}</span>
  );
  const round = snap.rounds?.[snap.round];

  return (
    <section className="jx-panel jx-live" aria-labelledby="jx-live-title" style={{ "--gk-accent": "#2dd4bf" } as React.CSSProperties}>
      <audio ref={audio} preload="auto" />
      {!code && (
        <>
          <div className="jx-intro">
            <span className="jx-big-icon" aria-hidden="true"><Radio size={38} /></span>
            <h2 id="jx-live-title" className="gk-display">Quiz en direct</h2>
            <p>Jouez ensemble, chacun sur son téléphone : mêmes extraits au même moment, 20 secondes pour répondre, classement après chaque manche. Une personne crée la salle, les autres la rejoignent avec le code ou le lien.</p>
          </div>
          <div className="jx-live-start">
            <div className="jx-live-box">
              <h3>Créer une salle</h3>
              <div className="gk-chips" role="group" aria-label="Génériques">
                <button type="button" className="gk-chip" aria-pressed={mode === "generique"} onClick={() => setMode("generique")}><span>Animes</span></button>
                <button type="button" className="gk-chip" aria-pressed={mode === "nostalgie"} onClick={() => setMode("nostalgie")}><span>Nostalgie</span></button>
              </div>
              <button type="button" className="gk-btn" onClick={create} disabled={!player.device}><Crown size={18} aria-hidden="true" /> Créer et inviter</button>
            </div>
            <div className="jx-live-box">
              <h3>Rejoindre</h3>
              <label className="jx-field"><span>Code de la salle</span>
                <input className="gk-input jx-live-code-input" value={joinInput} maxLength={5} autoCapitalize="characters" autoComplete="off" placeholder="EX. K7QPM" onChange={(e) => setJoinInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") join(); }} />
              </label>
              <button type="button" className="gk-btn" onClick={join} disabled={!player.device || joinInput.trim().length !== 5}><Users size={18} aria-hidden="true" /> Rejoindre</button>
            </div>
          </div>
          {error && <p className="jx-error" role="alert">{error}</p>}
        </>
      )}

      {code && (
        <>
          <div className="jx-live-head">
            <div>
              <p className="jx-daily-date"><Radio size={15} aria-hidden="true" /> {online ? "En direct" : "Connexion…"}{host ? " · tu es l'hôte" : ""}</p>
              <h2 id="jx-live-title" className="jx-live-code" aria-label={`Salle ${code.split("").join(" ")}`}>{code}</h2>
            </div>
            <div className="jx-actions">
              <button type="button" className="gk-btn gk-btn--sm" onClick={invite}><Share2 size={16} aria-hidden="true" /> Inviter</button>
              <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={() => { void navigator.clipboard?.writeText(code).catch(() => {}); }}><Copy size={16} aria-hidden="true" /> Code</button>
              <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={leave}><LogOut size={16} aria-hidden="true" /> Quitter</button>
            </div>
          </div>
          {error && <p className="jx-error" role="alert">{error}</p>}
          {hostGone && <p className="jx-error" role="alert">L&apos;hôte a quitté la salle. Crée une nouvelle salle pour rejouer.</p>}

          {snap.phase === "lobby" && (
            <div className="jx-live-lobby">
              <p className="jx-ask">{peers.length} joueur{peers.length > 1 ? "s" : ""} dans la salle</p>
              <ul className="jx-live-peers">
                {peers.map((p) => <li key={p.pid}>{face(p, 52)}<strong>{p.name}{p.pid === me.pid ? " (toi)" : ""}</strong>{p.host && <small><Crown size={12} aria-hidden="true" /> hôte</small>}</li>)}
              </ul>
              {host
                ? <><button type="button" className="gk-btn" onClick={launch} disabled={!online}><Play size={18} aria-hidden="true" /> Lancer la partie ({snap.mode === "nostalgie" ? "Nostalgie" : "Animes"})</button><p className="jx-note">Attends que tout le monde soit là, puis lance. 10 extraits, 20 secondes chacun.</p></>
                : <p className="jx-note" role="status">En attente de l&apos;hôte… Monte le son.</p>}
            </div>
          )}

          {(snap.phase === "question" || snap.phase === "reveal") && round && (
            <div className="jx-round" key={snap.round}>
              <div className="jx-round-head">
                <span className="jx-round-no">Manche {snap.round + 1} / {snap.total}</span>
                {snap.phase === "question"
                  ? <span className="jx-timer"><Clock size={15} aria-hidden="true" /> {Math.ceil(left / 1000)} s · {snap.answered.length}/{peers.length} ont répondu</span>
                  : <span className="jx-timer">Corrigé</span>}
              </div>
              {snap.phase === "question" && <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${left / LIVE_ROUND_MS})` }} /></div>}
              {snap.phase === "question" && (needTap
                ? <button type="button" className="gk-btn jx-live-tap" onClick={() => { void audio.current?.play().then(() => setNeedTap(false)).catch(() => {}); }}><Volume2 size={18} aria-hidden="true" /> Activer le son</button>
                : <div className="jx-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--k": i } as React.CSSProperties} />)}</div>)}
              {snap.phase === "reveal" && snap.reveal && (
                <div className="jx-live-reveal" role="status">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {snap.reveal.cover ? <img src={snap.reveal.cover} alt="" width={72} height={72} /> : <span className="jx-cover-empty" aria-hidden="true">♪</span>}
                  <span><strong>{snap.reveal.anime}</strong><small>{snap.reveal.title}{snap.reveal.artist ? ` · ${snap.reveal.artist}` : ""}</small></span>
                  <b className={(snap.reveal.gains[me.pid] ?? 0) > 0 ? "is-ok" : ""}>{(snap.reveal.gains[me.pid] ?? 0) > 0 ? `+${snap.reveal.gains[me.pid]}` : mine?.round === snap.round ? "Raté" : "Pas de réponse"}</b>
                </div>
              )}
              <div className="jx-choices">
                {round.choices.map((c, i) => {
                  const picked = mine?.round === snap.round && mine.choice === i;
                  const right = snap.phase === "reveal" && snap.reveal?.correct === i;
                  return (
                    <button key={i} type="button" className={`jx-choice${right ? " is-right" : ""}${snap.phase === "reveal" && picked && !right ? " is-wrong" : ""}`} aria-pressed={picked} disabled={snap.phase !== "question" || mine?.round === snap.round} onClick={() => answer(i)}>
                      <b>{"ABCD"[i]}</b><span>{c}</span>
                    </button>
                  );
                })}
              </div>
              {snap.phase === "question" && mine?.round === snap.round && <p className="jx-note jx-live-wait" role="status"><Check size={15} aria-hidden="true" /> Réponse envoyée, on attend les autres…</p>}
            </div>
          )}

          {snap.phase === "end" && (
            <div className="jx-result">
              <p className="jx-verdict">Partie terminée</p>
              <ol className="jx-podium">
                {board.slice(0, 3).map((p, i) => (
                  <li key={p.pid} className={`is-${i + 1}`}>{face(p, i === 0 ? 72 : 56)}<strong>{p.name}</strong><b>{p.score}</b><span aria-hidden="true">{i + 1}</span></li>
                ))}
              </ol>
            </div>
          )}

          {snap.phase !== "lobby" && (
            <>
              <h3 className="jx-h3">{snap.phase === "end" ? "Classement final" : "Scores"}</h3>
              <ol className="jx-live-board">
                {board.map((p, i) => (
                  <li key={p.pid} className={`${p.pid === me.pid ? "is-me" : ""}${p.gone ? " is-gone" : ""}`}>
                    <b className="jx-rank">{i + 1}</b>{face(p, 36)}<span>{p.name}{p.pid === me.pid ? " (toi)" : ""}</span>
                    {snap.phase === "question" && <small>{snap.answered.includes(p.pid) ? "a répondu" : "réfléchit…"}</small>}
                    {snap.phase === "reveal" && snap.reveal && <small className={(snap.reveal.gains[p.pid] ?? 0) > 0 ? "is-ok" : ""}>{(snap.reveal.gains[p.pid] ?? 0) > 0 ? `+${snap.reveal.gains[p.pid]}` : "0"}</small>}
                    <strong>{p.score}</strong>
                  </li>
                ))}
              </ol>
            </>
          )}
          {snap.phase === "end" && host && <div className="jx-actions"><button type="button" className="gk-btn" onClick={rematch}><RotateCcw size={17} aria-hidden="true" /> Revanche (tout le monde suit)</button></div>}
          {snap.phase === "end" && !host && <p className="jx-note">L&apos;hôte peut lancer une revanche : tu seras emmené automatiquement dans la nouvelle salle.</p>}
        </>
      )}
      <Toast />
    </section>
  );
}
