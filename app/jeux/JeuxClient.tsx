"use client";

// Page Jeux : quiz des génériques, duel de goûts, badges automatiques, classement.
// Sans compte : identifiant aléatoire de l'appareil (le même que pour le sondage du
// Bash) + « qui es-tu ? » (membre) ou un pseudo. Les scores sont calculés par le serveur ;
// l'historique est aussi gardé sur l'appareil (utile tant que la table n'existe pas).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Award, Check, Clock, Headphones, Heart, Play, RotateCcw, Share2, Swords, Trophy, User } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { fetchMembers } from "../utils/dataAdapter";
import { useShare } from "../hooks/useShare";
import type { Member } from "../../data/members";
import type { Badge } from "../../lib/games/badges";
import type { DuelResult } from "../../lib/games/duel";
import type { QuizCorrection, QuizRound } from "../../lib/games/quiz";
import "./jeux.css";

type Tab = "quiz" | "duel" | "badges" | "classement";
type Game = "quiz-generique" | "duel";
interface Play { id?: number; game: Game; member_id: number | null; player_name: string | null; score: number; max_score: number; detail: Record<string, unknown>; created_at: string }
interface LocalPlay { game: Game; score: number; max: number; at: string; label: string }

const ROUND_MS = 20_000;
const KEY_DEVICE = "guilde-bash-voter", KEY_ME = "guilde-bash-me", KEY_NAME = "guilde-player-name", KEY_LOCAL = "guilde-games-history";
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* navigation privée */ } };
function deviceId(): string {
  let id = read(KEY_DEVICE);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = crypto.randomUUID(); write(KEY_DEVICE, id); }
  return id;
}
const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Qui joue : membre choisi, sinon pseudo, sinon anonyme. */
function usePlayer() {
  const [me, setMe] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [device, setDevice] = useState("");
  useEffect(() => {
    void Promise.resolve().then(() => {
      setDevice(deviceId());
      const m = Number(read(KEY_ME));
      setMe(Number.isInteger(m) && m > 0 ? m : null);
      setName(read(KEY_NAME) ?? "");
    });
  }, []);
  const chooseMember = (id: number | null) => { setMe(id); write(KEY_ME, id ? String(id) : null); };
  const chooseName = (n: string) => { setName(n); write(KEY_NAME, n.trim() ? n.trim().slice(0, 40) : null); };
  const payload = useCallback(() => ({ device, memberId: me ?? undefined, name: !me && name.trim() ? name.trim() : undefined }), [device, me, name]);
  return { me, name, device, chooseMember, chooseName, payload };
}

function localHistory(): LocalPlay[] { try { return JSON.parse(read(KEY_LOCAL) ?? "[]"); } catch { return []; } }
function pushLocal(p: LocalPlay) { write(KEY_LOCAL, JSON.stringify([p, ...localHistory()].slice(0, 40))); }

export default function JeuxClient() {
  const [tab, setTab] = useState<Tab>("quiz");
  const [members, setMembers] = useState<Member[]>([]);
  const player = usePlayer();
  useEffect(() => { fetchMembers().then(setMembers).catch(() => {}); }, []);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const meMember = player.me ? byId.get(player.me) : undefined;

  return (
    <div className="gk-page tone-dark jx-page">
      <GuildeHeader activePage="jeux" tone="dark" accentColor="#e8412c" bgColor="#0f0e13" />
      <main className="gk-wrap jx-main">
        <header className="gk-hero gk-reveal jx-hero">
          <div className="gk-hero-kicker"><p className="gk-chapter"><b>✦</b><span>ASOBI · LA SALLE DE JEUX</span></p></div>
          <h1 className="gk-display jx-title">Jeux <span className="gk-inked">de la Guilde</span></h1>
          <p className="gk-body gk-hero-lede">Devine les génériques, mesure ta compatibilité avec les autres membres, débloque des badges. Pas de compte : dis juste qui tu es.</p>
        </header>

        {/* Qui joue ? */}
        <section className="jx-who" aria-label="Qui joue ?">
          <span className="jx-who-face">
            {meMember?.animeChar || meMember?.photo
              ? <Image src={(meMember.animeChar || meMember.photo)!} alt="" width={52} height={52} sizes="52px" />
              : <User size={24} aria-hidden="true" />}
          </span>
          <label className="jx-field">
            <span>Je suis</span>
            <select className="gk-input" value={player.me ?? ""} onChange={(e) => player.chooseMember(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Un invité</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          {!player.me && (
            <label className="jx-field">
              <span>Pseudo (facultatif)</span>
              <input className="gk-input" value={player.name} maxLength={40} placeholder="Ton pseudo" onChange={(e) => player.chooseName(e.target.value)} />
            </label>
          )}
          <p className="jx-who-note">Ton historique reste lié à cet appareil{player.me ? " et à ta fiche" : ""}.</p>
        </section>

        <div className="gk-switch jx-tabs" role="group" aria-label="Jeux">
          {([["quiz", "Quiz génériques", Headphones], ["duel", "Duel de goûts", Swords], ["badges", "Badges", Award], ["classement", "Classement", Trophy]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" aria-pressed={tab === k} className="gk-chip" onClick={() => setTab(k)}>
              <Icon size={16} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </div>

        {tab === "quiz" && <Quiz player={player} />}
        {tab === "duel" && <Duel members={members} player={player} />}
        {tab === "badges" && <Badges me={player.me} />}
        {tab === "classement" && <Board byId={byId} device={player.device} me={player.me} />}
      </main>
    </div>
  );
}

type PlayerApi = ReturnType<typeof usePlayer>;

/* ═══ QUIZ DES GÉNÉRIQUES ═══════════════════════════════════════════════ */
function Quiz({ player }: { player: PlayerApi }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "timeout" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<QuizRound[]>([]);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(ROUND_MS);
  const [result, setResult] = useState<{ score: number; max: number; good: number; correction: QuizCorrection[]; saved: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; ms: number }[]>([]);
  const started = useRef(0);
  const audio = useRef<HTMLAudioElement>(null);

  // Une seule source à la fois, libérée entre les manches (stabilité sur iPhone).
  const playRound = useCallback((list: QuizRound[], i: number) => {
    const a = audio.current;
    setR(i); setPicked(null); setLeft(ROUND_MS); started.current = performance.now();
    if (!a) return;
    a.pause(); a.src = list[i].preview; a.currentTime = 0;
    void a.play().catch(() => {});
  }, []);

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    try {
      const res = await fetch("/api/games/quiz", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Quiz indisponible.");
      answers.current = [];
      setToken(d.token); setRounds(d.rounds); setPhase("play");
      playRound(d.rounds, 0);
    } catch (e) { setError(e instanceof Error ? e.message : "Quiz indisponible."); setPhase("intro"); }
  }

  const finish = useCallback(async () => {
    audio.current?.pause();
    setPhase("sending");
    try {
      const res = await fetch("/api/games/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, answers: answers.current, ...player.payload() }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Correction impossible.");
      setResult(d); setPhase("done");
      pushLocal({ game: "quiz-generique", score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} génériques` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player]);

  const next = useCallback(() => {
    if (r + 1 >= rounds.length) { void finish(); return; }
    setPhase("play"); playRound(rounds, r + 1);
  }, [r, rounds, finish, playRound]);

  function answer(choice: number) {
    if (picked !== null || phase !== "play") return;
    setPicked(choice);
    answers.current[r] = { choice, ms: Math.round(performance.now() - started.current) };
    // L'appui sert aussi à lancer l'extrait suivant (lecture autorisée sur iPhone).
    window.setTimeout(() => next(), 450);
  }

  // Compte à rebours ; à zéro, la manche est perdue et on attend un appui pour continuer.
  useEffect(() => {
    if (phase !== "play" || picked !== null) return;
    const t = window.setInterval(() => {
      const l = ROUND_MS - (performance.now() - started.current);
      if (l <= 0) { window.clearInterval(t); answers.current[r] = { choice: null, ms: ROUND_MS }; audio.current?.pause(); setLeft(0); setPhase("timeout"); }
      else setLeft(l);
    }, 200);
    return () => window.clearInterval(t);
  }, [phase, picked, r]);

  useEffect(() => () => { const a = audio.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } }, []);

  return (
    <section className="jx-panel jx-quiz" aria-labelledby="jx-quiz-title">
      <audio ref={audio} preload="auto" />
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Headphones size={40} /></span>
          <h2 id="jx-quiz-title" className="gk-display">Quiz des génériques</h2>
          <p>10 extraits d&apos;openings et d&apos;endings. Pour chacun, trouve l&apos;anime parmi 4. 100 points par bonne réponse, jusqu&apos;à 50 de bonus si tu es rapide. 20 secondes par manche.</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer le quiz"}</button>
          <p className="jx-note">Monte le son. Les extraits viennent d&apos;Apple Music (30 s).</p>
        </div>
      )}
      {(phase === "play" || phase === "timeout") && rounds[r] && (
        <div className="jx-round" key={r}>
          <div className="jx-round-head">
            <span className="jx-round-no">Manche {r + 1} / {rounds.length}</span>
            <span className="jx-timer" aria-label={`${Math.ceil(left / 1000)} secondes restantes`}><Clock size={15} aria-hidden="true" /> {Math.ceil(left / 1000)} s</span>
          </div>
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${left / ROUND_MS})` }} /></div>
          <div className="jx-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--k": i } as React.CSSProperties} />)}</div>
          <p className="jx-ask">Quel anime ?</p>
          <div className="jx-choices">
            {rounds[r].choices.map((c, i) => (
              <button key={i} type="button" className="jx-choice" aria-pressed={picked === i} disabled={picked !== null || phase === "timeout"} onClick={() => answer(i)}>
                <b>{"ABCD"[i]}</b><span>{c}</span>
              </button>
            ))}
          </div>
          {phase === "timeout" && (
            <div className="jx-timeout" role="status">Temps écoulé ! <button type="button" className="gk-btn gk-btn--sm" onClick={next}>{r + 1 >= rounds.length ? "Voir mon score" : "Manche suivante"}</button></div>
          )}
        </div>
      )}
      {phase === "sending" && <p className="jx-note" role="status">Correction…</p>}
      {phase === "done" && result && (
        <div className="jx-result">
          <p className="jx-score"><b>{result.score}</b><span>/ {result.max} points</span></p>
          <p className="jx-verdict">{result.good} générique{result.good > 1 ? "s" : ""} sur {result.correction.length} · {result.good >= 9 ? "Oreille d'or" : result.good >= 6 ? "Bien joué" : result.good >= 3 ? "Peut mieux faire" : "Il va falloir réviser"}</p>
          {!result.saved && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <ol className="jx-correction">
            {result.correction.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : "is-ko"}>
                {c.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.cover} alt="" width={56} height={56} loading="lazy" />
                  : <span className="jx-cover-empty" aria-hidden="true">♪</span>}
                <span><strong>{c.anime}</strong><small>{c.kind === "OP" ? "Opening" : "Ending"} · {c.title} · {c.artist}</small></span>
                <b>{c.ok ? `+${c.points}` : "0"}</b>
              </li>
            ))}
          </ol>
          <button type="button" className="gk-btn" onClick={start}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
        </div>
      )}
    </section>
  );
}

/* ═══ DUEL DE GOÛTS ══════════════════════════════════════════════════════ */
function Duel({ members, player }: { members: Member[]; player: PlayerApi }) {
  const withFavs = members.filter((m) => (m.extras?.favoriteAnime?.length ?? 0) + (m.extras?.favoriteManga?.length ?? 0) > 0);
  const [a, setA] = useState<number | "">("");
  const [b, setB] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ result: DuelResult; a: { id: number; name: string }; b: { id: number; name: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { share, Toast } = useShare();
  const byId = new Map(members.map((m) => [m.id, m]));
  const A = a ? byId.get(a) : undefined, B = b ? byId.get(b) : undefined;
  const effA = a || player.me || "";

  async function go() {
    const x = a || player.me, y = b;
    if (!x || !y) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/games/duel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: x, b: y, ...player.payload() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Duel impossible.");
      setRes(d);
      pushLocal({ game: "duel", score: d.result.score, max: 100, at: new Date().toISOString(), label: `${d.a.name} × ${d.b.name}` });
    } catch (e) { setError(e instanceof Error ? e.message : "Duel impossible."); } finally { setBusy(false); }
  }

  const face = (m?: Member) => m && (m.animeChar || m.photo)
    ? <Image src={(m.animeChar || m.photo)!} alt="" fill sizes="(max-width: 700px) 40vw, 220px" />
    : <span className="jx-face-empty" aria-hidden="true">?</span>;

  return (
    <section className="jx-panel" aria-labelledby="jx-duel-title">
      <div className="jx-intro is-left">
        <h2 id="jx-duel-title" className="gk-display">Duel de goûts</h2>
        <p>Choisis deux membres : le site compare leurs vrais favoris (œuvres en commun, genres, musique) et donne leur compatibilité.</p>
      </div>
      <div className="jx-duel-pick">
        <label className="jx-field"><span>Premier membre</span>
          <select className="gk-input" value={effA} onChange={(e) => { setA(e.target.value ? Number(e.target.value) : ""); setRes(null); }}>
            <option value="">Choisir…</option>
            {withFavs.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <span className="jx-vs" aria-hidden="true">VS</span>
        <label className="jx-field"><span>Second membre</span>
          <select className="gk-input" value={b} onChange={(e) => { setB(e.target.value ? Number(e.target.value) : ""); setRes(null); }}>
            <option value="">Choisir…</option>
            {withFavs.filter((m) => m.id !== effA).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <button type="button" className="gk-btn" onClick={go} disabled={busy || !effA || !b}><Heart size={17} aria-hidden="true" /> {busy ? "Calcul…" : "Lancer le duel"}</button>
      </div>
      {withFavs.length < 2 && <p className="jx-note">Il faut au moins deux membres avec des favoris pour lancer un duel.</p>}
      {error && <p className="jx-error" role="alert">{error}</p>}
      {res && (
        <div className="jx-duel" style={{ "--pct": res.result.score } as React.CSSProperties}>
          <div className="jx-duel-faces">
            <span className="jx-duel-face">{face(byId.get(res.a.id) ?? A)}<b>{res.a.name}</b></span>
            <span className="jx-ring" aria-label={`${res.result.score} % de compatibilité`}><b>{res.result.score}</b><small>%</small></span>
            <span className="jx-duel-face">{face(byId.get(res.b.id) ?? B)}<b>{res.b.name}</b></span>
          </div>
          <p className="jx-verdict-big">{res.result.verdict}</p>
          <dl className="jx-duel-facts">
            <div><dt>En commun</dt><dd>{res.result.common.length ? res.result.common.join(", ") : "Aucune œuvre en commun"}</dd></div>
            <div><dt>Genres partagés</dt><dd>{res.result.genres.length ? res.result.genres.join(", ") : "Aucun"}</dd></div>
            {res.result.artists.length > 0 && <div><dt>Même musique</dt><dd>{res.result.artists.join(", ")}</dd></div>}
            <div><dt>Favoris comparés</dt><dd>{res.result.counts[0]} et {res.result.counts[1]}</dd></div>
          </dl>
          <button type="button" className="gk-btn gk-btn--ghost" onClick={() => share({ title: "Duel de goûts · Guilde Otaku", text: `${res.a.name} × ${res.b.name} : ${res.result.score} % de compatibilité (${res.result.verdict}).`, url: "/jeux" })}><Share2 size={16} aria-hidden="true" /> Partager le résultat</button>
        </div>
      )}
      <Toast />
    </section>
  );
}

/* ═══ BADGES ══════════════════════════════════════════════════════════════ */
function Badges({ me }: { me: number | null }) {
  const [data, setData] = useState<{ rules: Omit<Badge, never>[]; members: { id: number; name: string; image: string | null; badges: Badge[] }[] } | null>(null);
  useEffect(() => { fetch("/api/games/badges").then((r) => r.json()).then(setData).catch(() => setData({ rules: [], members: [] })); }, []);
  if (!data) return <section className="jx-panel"><p className="jx-note" role="status">Chargement des badges…</p></section>;
  const ranked = [...data.members].sort((a, b) => (b.id === me ? 1 : 0) - (a.id === me ? 1 : 0) || b.badges.length - a.badges.length);
  return (
    <section className="jx-panel" aria-labelledby="jx-badges-title">
      <div className="jx-intro is-left">
        <h2 id="jx-badges-title" className="gk-display">Badges</h2>
        <p>Gagnés automatiquement, à partir des fiches, des parties jouées et des votes du Bash. Distincts du palmarès officiel.</p>
      </div>
      <ul className="jx-rules">
        {data.rules.map((b) => (
          <li key={b.id} className={`jx-badge is-${b.tier}`}><span className="jx-badge-medal" aria-hidden="true"><Award size={18} /></span><span><strong>{b.label}</strong><small>{b.romaji} · {b.desc}</small></span></li>
        ))}
      </ul>
      <h3 className="jx-h3">Qui a quoi</h3>
      <ul className="jx-holders">
        {ranked.map((m) => (
          <li key={m.id} className={m.id === me ? "is-me" : ""}>
            <span className="jx-holder-face">{m.image ? <Image src={m.image} alt="" width={44} height={44} sizes="44px" /> : <User size={20} aria-hidden="true" />}</span>
            <strong>{m.name}{m.id === me ? " (toi)" : ""}</strong>
            <span className="jx-holder-badges">
              {m.badges.length ? m.badges.map((b) => <span key={b.id} className={`jx-pill is-${b.tier}`} title={b.desc}>{b.label}</span>) : <small>Pas encore de badge</small>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ═══ CLASSEMENT ET HISTORIQUE ════════════════════════════════════════════ */
function Board({ byId, device, me }: { byId: Map<number, Member>; device: string; me: number | null }) {
  const [game, setGame] = useState<Game>("quiz-generique");
  const [data, setData] = useState<{ available: boolean; best: Play[]; recent: Play[]; history: Play[] } | null>(null);
  const [local] = useState<LocalPlay[]>(() => (typeof window === "undefined" ? [] : localHistory()));
  useEffect(() => {
    if (!device) return;
    let alive = true;
    fetch(`/api/games/board?game=${game}&device=${device}${me ? `&member=${me}` : ""}`, { cache: "no-store" }).then((r) => r.json()).then((d) => { if (alive) setData(d); }).catch(() => { if (alive) setData({ available: false, best: [], recent: [], history: [] }); });
    return () => { alive = false; };
  }, [game, device, me]);
  const who = (p: Play) => (p.member_id && byId.get(p.member_id)?.name) || p.player_name || "Invité";
  const mine = data?.available ? data.history : null;
  return (
    <section className="jx-panel" aria-labelledby="jx-board-title">
      <div className="jx-intro is-left">
        <h2 id="jx-board-title" className="gk-display">Classement</h2>
        <div className="gk-chips" role="group" aria-label="Jeu">
          <button type="button" className="gk-chip" aria-pressed={game === "quiz-generique"} onClick={() => setGame("quiz-generique")}><span>Quiz génériques</span></button>
          <button type="button" className="gk-chip" aria-pressed={game === "duel"} onClick={() => setGame("duel")}><span>Duels</span></button>
        </div>
      </div>
      {!data ? <p className="jx-note" role="status">Chargement…</p> : !data.available ? (
        <p className="jx-note">Le classement commun arrive bientôt. En attendant, ton historique est gardé sur cet appareil.</p>
      ) : (
        <ol className="jx-board">
          {data.best.map((p, i) => (
            <li key={p.id ?? i} className={(me && p.member_id === me) ? "is-me" : ""}>
              <b className="jx-rank">{i + 1}</b><span>{who(p)}</span>
              <strong>{game === "duel" ? `${p.score} %` : `${p.score} pts`}</strong>
              {game === "duel" && <small>{byId.get(Number(p.detail.a))?.name} × {byId.get(Number(p.detail.b))?.name}</small>}
            </li>
          ))}
          {!data.best.length && <li className="jx-empty">Personne n&apos;a encore joué. À toi l&apos;honneur.</li>}
        </ol>
      )}
      <h3 className="jx-h3">Mon historique</h3>
      <ul className="jx-history">
        {(mine ?? []).filter((p) => p.game === game).map((p, i) => (
          <li key={`s${i}`}><span>{DAY.format(new Date(p.created_at))}</span><strong>{game === "duel" ? `${p.score} %` : `${p.score} / ${p.max_score}`}</strong><small>{game === "duel" ? `${byId.get(Number(p.detail.a))?.name ?? "?"} × ${byId.get(Number(p.detail.b))?.name ?? "?"}` : `${p.detail.good ?? "?"} bonnes réponses`}</small></li>
        ))}
        {!mine && local.filter((p) => p.game === game).map((p, i) => (
          <li key={`l${i}`}><span>{DAY.format(new Date(p.at))}</span><strong>{game === "duel" ? `${p.score} %` : `${p.score} / ${p.max}`}</strong><small>{p.label}</small></li>
        ))}
        {((mine && !mine.some((p) => p.game === game)) || (!mine && !local.some((p) => p.game === game))) && <li className="jx-empty"><Check size={15} aria-hidden="true" /> Aucune partie pour l&apos;instant.</li>}
      </ul>
    </section>
  );
}
