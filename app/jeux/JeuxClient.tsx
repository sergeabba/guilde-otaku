"use client";

// Page Jeux : quiz des génériques, duel de goûts, badges automatiques, classement.
// Sans compte : identifiant aléatoire de l'appareil (le même que pour le sondage du
// Bash) + « qui es-tu ? » (membre) ou un pseudo. Les scores sont calculés par le serveur ;
// l'historique est aussi gardé sur l'appareil (utile tant que la table n'existe pas).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "../components/GImage";
import { ArrowUpDown, Award, Building2, CalendarCheck, Check, Clock, Film, Grid3x3, Headphones, Heart, ListOrdered, Mic, PenTool, Play, Radio, RotateCcw, ScanSearch, Share2, Smile, Swords, Tags, Trophy, User, UserSearch, Users } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { fetchMembers } from "../utils/dataAdapter";
import { useShare } from "../hooks/useShare";
import type { Member } from "../../data/members";
import type { Badge } from "../../lib/games/badges";
import type { DuelResult } from "../../lib/games/duel";
import type { QuizCorrection, QuizRound } from "../../lib/games/quiz";
import { DAY, GAME_INFO, LEVEL_LABEL, localHistory, multLabel, pushLocal, useLevel, usePlayer, type Level, type Game, type LocalPlay, type Play as PlayRow, type PlayerApi } from "./shared";
import { Affiche, DefiJour, PlusMoins, TierList } from "./Arcade";
import Live from "./Live";
import { DevineAnime, DevinePerso, EmojiQuiz } from "./Dle";
import Qcm from "./Qcm";
import Clips from "./Clips";
import "./jeux.css";

type Tab = "defi-jour" | "devine-anime" | "devine-perso" | "emoji" | "themes" | "createur" | "studio" | "voix" | "generiques" | "direct" | "quiz" | "nostalgie" | "affiche" | "plus-moins" | "tier" | "duel" | "badges" | "classement";

const MENU: { id: Tab; label: string; sub: string; Icon: typeof Award; color: string }[] = [
  { id: "defi-jour", label: "Défi du jour", sub: "Une question, une seule chance", Icon: CalendarCheck, color: "#f5a524" },
  { id: "devine-anime", label: "Devine l'anime", sub: "6 essais, un anime par jour", Icon: ScanSearch, color: "#f472b6" },
  { id: "devine-perso", label: "Devine le perso", sub: "Indices et portrait flouté", Icon: UserSearch, color: "#fb923c" },
  { id: "emoji", label: "Quiz des émojis", sub: "Un anime en émojis", Icon: Smile, color: "#facc15" },
  { id: "themes", label: "Devine par les thèmes", sub: "Pour experts : 5 thèmes", Icon: Tags, color: "#38bdf8" },
  { id: "createur", label: "Qui l'a créé ?", sub: "Mangakas et réalisateurs", Icon: PenTool, color: "#c084fc" },
  { id: "studio", label: "Le studio", sub: "MAPPA, ufotable, KyoAni…", Icon: Building2, color: "#fb7185" },
  { id: "voix", label: "La voix", sub: "Doubleurs japonais", Icon: Mic, color: "#34d399" },
  { id: "direct", label: "Quiz en direct", sub: "À plusieurs, en temps réel", Icon: Users, color: "#2dd4bf" },
  { id: "quiz", label: "Quiz génériques", sub: "10 extraits à reconnaître", Icon: Headphones, color: "#e8412c" },
  { id: "nostalgie", label: "Blind test Nostalgie", sub: "Club Dorothée, Récré A2", Icon: Radio, color: "#ff6b9a" },
  { id: "generiques", label: "Blind test vidéo", sub: "Génériques floutés", Icon: Film, color: "#f43f5e" },
  { id: "affiche", label: "L'Affiche en morceaux", sub: "Case par case", Icon: Grid3x3, color: "#3fa7d6" },
  { id: "plus-moins", label: "Plus ou moins", sub: "Quelle note AniList ?", Icon: ArrowUpDown, color: "#22c55e" },
  { id: "tier", label: "Tier list", sub: "Les sorties de la semaine", Icon: ListOrdered, color: "#a78bfa" },
  { id: "duel", label: "Duel de goûts", sub: "Compatibilité entre membres", Icon: Swords, color: "#ff8a3d" },
  { id: "badges", label: "Badges", sub: "Gagnés en jouant", Icon: Award, color: "#c9a84c" },
  { id: "classement", label: "Classement", sub: "Scores et historique", Icon: Trophy, color: "#f6f0e6" },
];
const isTab = (t: string | null): t is Tab => MENU.some((m) => m.id === t);

export default function JeuxClient() {
  const [tab, setTabState] = useState<Tab>("defi-jour");
  const [defi, setDefi] = useState<number | null>(null);
  const [boardGame, setBoardGame] = useState<Game>("quiz-generique");
  const [salle, setSalle] = useState<string | null>(null);
  // Lien direct : /jeux?jeu=affiche, ou /jeux?defi=123 (défi lancé par un ami).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const d = Number(sp.get("defi")), j = sp.get("jeu");
    void Promise.resolve().then(() => {
      const room = sp.get("salle");
      if (room) { setSalle(room.toUpperCase().slice(0, 5)); setTabState("direct"); }
      else if (Number.isInteger(d) && d > 0) { setDefi(d); setTabState("quiz"); }
      else if (isTab(j)) setTabState(j);
    });
  }, []);
  const showRanking = (g: Game) => { setBoardGame(g); setTab("classement"); };
  const setTab = (t: Tab) => {
    setTabState(t); setDefi(null);
    try { window.history.replaceState(null, "", t === "defi-jour" ? "/jeux" : `/jeux?jeu=${t}`); } catch { /* ignoré */ }
    document.getElementById("jx-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [members, setMembers] = useState<Member[]>([]);
  const player = usePlayer();
  const [level, setLevel] = useLevel();
  useEffect(() => { fetchMembers().then(setMembers).catch(() => {}); }, []);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const meMember = player.me ? byId.get(player.me) : undefined;
  const names = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

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

        <section className="jx-levels" aria-label="Niveau de difficulté">
          <span className="jx-levels-label">Niveau</span>
          <div className="jx-levels-row" role="radiogroup" aria-label="Niveau">
            {(["facile", "normal", "expert"] as Level[]).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={level === l} className={`jx-level is-${l}`} onClick={() => setLevel(l)}>
                <strong>{LEVEL_LABEL[l]}</strong><small>{multLabel(l)} points</small>
              </button>
            ))}
          </div>
          <p className="jx-note">{level === "facile" ? "Animes très connus, plus de temps, indices offerts." : level === "expert" ? "Animes et persos pointus, extraits courts, pièges et réponses à taper." : "Le juste milieu : les grands classiques et un peu plus."} S&apos;applique à tous les jeux, sauf le Défi du jour, la Tier list et les Duels.</p>
        </section>

        <nav className="jx-menu" aria-label="Jeux">
          {MENU.map(({ id, label, sub, Icon, color }) => (
            <button key={id} type="button" aria-pressed={tab === id} className="jx-tile" style={{ "--c": color } as React.CSSProperties} onClick={() => setTab(id)}>
              <span className="jx-tile-icon" aria-hidden="true"><Icon size={20} /></span>
              <strong>{label}</strong>
              <small>{sub}</small>
            </button>
          ))}
        </nav>

        <div id="jx-stage" className="jx-stage" />
        {tab === "defi-jour" && <DefiJour player={player} names={names} onRanking={showRanking} />}
        {tab === "devine-anime" && <DevineAnime key={level} level={level} player={player} onRanking={showRanking} />}
        {tab === "devine-perso" && <DevinePerso key={level} level={level} player={player} onRanking={showRanking} />}
        {tab === "emoji" && <EmojiQuiz key={level} level={level} player={player} onRanking={showRanking} />}
        {tab === "generiques" && <Clips key={`clips-${level}`} level={level} player={player} onRanking={showRanking} />}
        {(tab === "themes" || tab === "createur" || tab === "studio" || tab === "voix") && <Qcm key={`${tab}-${level}`} kind={tab} level={level} player={player} onRanking={showRanking} />}
        {tab === "direct" && <Live player={player} members={members} initialCode={salle} level={level} />}
        {tab === "quiz" && <Quiz key={`q${defi ?? ""}-${level}`} level={level} player={player} mode="generique" defi={defi} onRanking={showRanking} />}
        {tab === "nostalgie" && <Quiz key={`n-${level}`} level={level} player={player} mode="nostalgie" defi={null} onRanking={showRanking} />}
        {tab === "affiche" && <Affiche key={level} level={level} player={player} onRanking={showRanking} />}
        {tab === "plus-moins" && <PlusMoins key={level} level={level} player={player} onRanking={showRanking} />}
        {tab === "tier" && <TierList player={player} />}
        {tab === "duel" && <Duel members={members} player={player} />}
        {tab === "badges" && <Badges me={player.me} />}
        {tab === "classement" && <Board key={boardGame} byId={byId} device={player.device} me={player.me} initial={boardGame} initialLevel={level} />}
      </main>
    </div>
  );
}


/* ═══ QUIZ DES GÉNÉRIQUES ═══════════════════════════════════════════════ */
interface Versus { id: number; name: string; score: number; max: number; good: number }
/** Durée d'une manche selon le niveau (mêmes valeurs que le serveur). */
const QUIZ_MS: Record<Level, number> = { facile: 30_000, normal: 20_000, expert: 20_000 };

/** Extrait d'Expert : joué de `start` à `start + clip` secondes, puis arrêté. */
function playClip(a: HTMLAudioElement, round: QuizRound) {
  a.pause(); a.src = round.preview; a.currentTime = round.start ?? 0;
  a.ontimeupdate = round.clip ? () => { if (a.currentTime >= (round.start ?? 0) + round.clip!) a.pause(); } : null;
  const go = () => { if (round.start) a.currentTime = round.start; void a.play().catch(() => {}); };
  if (round.start && a.readyState < 1) a.addEventListener("loadedmetadata", go, { once: true }); else go();
}

function Quiz({ player, mode, defi, level: chosen, onRanking }: { player: PlayerApi; mode: "generique" | "nostalgie"; defi: number | null; level: Level; onRanking: (g: Game) => void }) {
  const nosta = mode === "nostalgie";
  // Défi d'un ami : son niveau à lui (connu au lancement).
  const [level, setLevel] = useState<Level>(chosen);
  const ROUND_MS = QUIZ_MS[level];
  const [rival, setRival] = useState<Versus | null>(null);
  const { share, Toast } = useShare();
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "timeout" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<QuizRound[]>([]);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(ROUND_MS);
  const [result, setResult] = useState<{ score: number; max: number; good: number; correction: QuizCorrection[]; saved: boolean; id: number | null; versus: Versus | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; ms: number }[]>([]);
  const started = useRef(0);
  const audio = useRef<HTMLAudioElement>(null);

  // Une seule source à la fois, libérée entre les manches (stabilité sur iPhone).
  const playRound = useCallback((list: QuizRound[], i: number) => {
    const a = audio.current;
    setR(i); setPicked(null); setLeft(ROUND_MS); started.current = performance.now();
    if (!a) return;
    playClip(a, list[i]);
  }, [ROUND_MS]);

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    try {
      const recentKey = `gk-quiz-recent-${nosta ? "fr" : "jp"}`;
      let recent: string[] = [];
      try { recent = JSON.parse(localStorage.getItem(recentKey) || "[]"); } catch { /* stockage indisponible */ }
      if (!Array.isArray(recent)) recent = [];
      const res = await fetch(defi ? `/api/games/quiz?defi=${defi}` : `/api/games/quiz?level=${chosen}${nosta ? "&mode=nostalgie" : ""}${recent.length ? `&recent=${recent.join(",")}` : ""}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Quiz indisponible.");
      if (d.defi) setRival(d.defi);
      if (d.level) setLevel(d.level === "facile" || d.level === "expert" ? d.level : "normal");
      answers.current = [];
      // Les titres entendus passent en fin de file aux prochaines parties.
      const ids = (d.rounds as QuizRound[]).map((x) => x.id).filter((x): x is string => typeof x === "string");
      if (ids.length) try { localStorage.setItem(recentKey, JSON.stringify([...ids, ...recent.filter((x) => !ids.includes(x))].slice(0, nosta ? 30 : 60))); } catch { /* stockage indisponible */ }
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
      pushLocal({ game: nosta ? "quiz-nostalgie" : "quiz-generique", score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} génériques${d.versus ? ` · défi de ${d.versus.name}` : ""}` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player, nosta]);

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
  }, [phase, picked, r, ROUND_MS]);

  useEffect(() => () => { const a = audio.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } }, []);

  const challenge = () => {
    if (!result?.id) return;
    const what = nosta ? "au blind test Nostalgie" : "au quiz des génériques";
    share({ title: "Défi · Guilde Otaku", text: `J'ai fait ${result.score} points (${result.good}/${result.correction.length}) ${what} de la Guilde. Mêmes extraits pour toi : fais mieux !`, url: `/jeux?defi=${result.id}` });
  };

  return (
    <section className="jx-panel jx-quiz" aria-labelledby="jx-quiz-title" style={nosta ? { "--gk-accent": "#ff6b9a" } as React.CSSProperties : undefined}>
      <audio ref={audio} preload="auto" />
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Headphones size={40} /></span>
          <h2 id="jx-quiz-title" className="gk-display">{defi ? "Défi lancé par un ami" : nosta ? "Blind test Nostalgie" : "Quiz des génériques"}</h2>
          {!defi && <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {level === "facile" ? "openings seulement, 4 choix, 30 secondes par manche." : level === "expert" ? "5 secondes d'extrait prises au hasard, 6 choix pièges de la même époque, endings compris." : "openings et endings, 4 choix, 20 secondes par manche."}</p>}
          {defi
            ? <p>Mêmes extraits, mêmes propositions que la partie de ton ami. Fais mieux que lui ! 20 secondes par manche, bonus si tu es rapide.</p>
            : nosta
              ? <p>Les génériques français de notre enfance : Club Dorothée, Récré A2, M6 Kid. Trouve le dessin animé parmi 4. 100 points par bonne réponse, jusqu&apos;à 50 de bonus si tu es rapide.</p>
              : <p>10 extraits d&apos;openings et d&apos;endings. Pour chacun, trouve l&apos;anime parmi 4. 100 points par bonne réponse, jusqu&apos;à 50 de bonus si tu es rapide. 20 secondes par manche.</p>}
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer le quiz"}</button>
          <p className="jx-note">Monte le son. Les extraits viennent d&apos;Apple Music (30 s).</p>
        </div>
      )}
      {(phase === "play" || phase === "timeout") && rounds[r] && (
        <div className="jx-round" key={r}>
          <div className="jx-round-head">
            <span className="jx-round-no">Manche {r + 1} / {rounds.length}{rival ? ` · à battre : ${rival.score} pts (${rival.name})` : ""}</span>
            <span className="jx-timer" aria-label={`${Math.ceil(left / 1000)} secondes restantes`}><Clock size={15} aria-hidden="true" /> {Math.ceil(left / 1000)} s</span>
          </div>
          {rounds[r].clip && phase === "play" && <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost jx-replay" onClick={() => audio.current && playClip(audio.current, rounds[r])}><RotateCcw size={15} aria-hidden="true" /> Réécouter les {rounds[r].clip} secondes</button>}
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${left / ROUND_MS})` }} /></div>
          <div className="jx-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--k": i } as React.CSSProperties} />)}</div>
          <p className="jx-ask">Quel anime ?</p>
          <div className="jx-choices">
            {rounds[r].choices.map((c, i) => (
              <button key={i} type="button" className="jx-choice" aria-pressed={picked === i} disabled={picked !== null || phase === "timeout"} onClick={() => answer(i)}>
                <b>{"ABCDEF"[i]}</b><span>{c}</span>
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
          {result.versus && (
            <div className="jx-versus" role="status">
              <span><b>{result.score}</b><small>Toi</small></span>
              <i aria-hidden="true">VS</i>
              <span><b>{result.versus.score}</b><small>{result.versus.name}</small></span>
              <p>{result.score > result.versus.score ? `Tu bats ${result.versus.name} !` : result.score === result.versus.score ? "Égalité parfaite." : `${result.versus.name} garde l'avantage.`}</p>
            </div>
          )}
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
          <div className="jx-actions">
            {result.id && <button type="button" className="gk-btn" onClick={challenge}><Share2 size={17} aria-hidden="true" /> Défier un ami</button>}
            <button type="button" className={result.id ? "gk-btn gk-btn--ghost" : "gk-btn"} onClick={() => { setRival(null); start(); }}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking(nosta ? "quiz-nostalgie" : "quiz-generique")}><Trophy size={17} aria-hidden="true" /> Voir le classement</button>
          </div>
          {result.id && <p className="jx-note">Le lien envoie les mêmes extraits : à ton ami de faire mieux.</p>}
        </div>
      )}
      <Toast />
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
interface PlaySummary { score: number; max: number; at: string; good?: number; rounds?: number; date?: string; ok?: boolean; a?: number; b?: number; tries?: number; level?: string; streak?: number }
interface PlayerRank { key: string; member_id: number | null; name: string | null; image?: string | null; plays: number; best: number; bestMax: number; avg: number; total: number; wins: number; last: string; history: PlaySummary[] }
interface BoardData { available: boolean; leveled?: boolean; level?: Level | null; levels?: Record<Level, number>; players: PlayerRank[]; feed: (PlaySummary & { key: string })[]; history: PlayRow[]; meKeys: string[] }

const DAILY: Game[] = ["defi-jour", "devine-anime", "devine-perso"];

/** « il y a 5 min », « hier », « 12 nov. » */
function ago(iso: string): string {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86_400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172_800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const BOARD_LEVELS: Level[] = ["facile", "normal", "expert"];
const playLevel = (l: unknown): Level => (l === "facile" || l === "expert" ? l : "normal");

function Board({ byId, device, me, initial, initialLevel }: { byId: Map<number, Member>; device: string; me: number | null; initial: Game; initialLevel: Level }) {
  const [game, setGame] = useState<Game>(initial);
  // Un classement par niveau : on ne compare que des parties jouées au même niveau.
  const [level, setLevel] = useState<Level>(initialLevel);
  const [data, setData] = useState<BoardData | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [local] = useState<LocalPlay[]>(() => (typeof window === "undefined" ? [] : localHistory()));
  useEffect(() => {
    if (!device) return;
    let alive = true;
    fetch(`/api/games/board?game=${game}&level=${level}&device=${device}${me ? `&member=${me}` : ""}`, { cache: "no-store" }).then((r) => r.json()).then((d) => { if (alive) { setData(d); setOpen(null); } }).catch(() => { if (alive) setData({ available: false, players: [], feed: [], history: [], meKeys: [] }); });
    return () => { alive = false; };
  }, [game, device, me, level]);
  const leveled = game !== "duel";
  const sameLevel = (l: unknown) => !leveled || playLevel(l) === level;

  const unit = (score: number, max: number) => GAME_INFO[game].unit({ score, max });
  const member = (r: { member_id: number | null }) => (r.member_id ? byId.get(r.member_id) : undefined);
  const nameOf = (r: PlayerRank) => r.name ?? member(r)?.name ?? "Invité";
  const byKey = new Map((data?.players ?? []).map((r) => [r.key, r]));
  const isMe = (key: string) => !!data?.meKeys.includes(key);
  const myIndex = (data?.players ?? []).findIndex((r) => isMe(r.key));
  const detail = (p: PlaySummary) => {
    const base = detailBase(p);
    return p.level && p.level in LEVEL_LABEL ? `${base}${base ? " · " : ""}${LEVEL_LABEL[p.level as Level]}` : base;
  };
  const detailBase = (p: PlaySummary) => game === "duel" ? `${byId.get(p.a ?? 0)?.name ?? "?"} × ${byId.get(p.b ?? 0)?.name ?? "?"}`
    : game === "plus-moins" ? `série de ${p.streak ?? "?"}`
    : game === "defi-jour" ? `${p.date ?? ""} · ${p.ok ? "réussi" : "raté"}`
    : game === "devine-anime" || game === "devine-perso" ? `${p.date ?? ""} · ${p.ok ? `trouvé en ${p.tries ?? "?"} essai${(p.tries ?? 0) > 1 ? "s" : ""}` : "raté"}`
    : p.good != null ? `${p.good} / ${p.rounds ?? "?"} bonnes réponses` : "";
  const face = (r: PlayerRank) => {
    const m = member(r), src = r.image ?? (m?.animeChar || m?.photo);
    return <span className="jx-face-sm">{src ? <Image src={src} alt="" width={40} height={40} sizes="40px" /> : <b>{nameOf(r).slice(0, 1).toUpperCase()}</b>}</span>;
  };
  const mine = data?.available ? data.history : null;

  return (
    <section className="jx-panel" aria-labelledby="jx-board-title">
      <div className="jx-intro is-left">
        <h2 id="jx-board-title" className="gk-display">Classement</h2>
        <div className="gk-chips jx-board-games" role="group" aria-label="Jeu">
          {(Object.keys(GAME_INFO) as Game[]).map((g) => (
            <button key={g} type="button" className="gk-chip" aria-pressed={game === g} onClick={() => setGame(g)}><span>{GAME_INFO[g].label}</span></button>
          ))}
        </div>
      </div>

      {leveled && (
        <div className="jx-levels-row jx-board-levels" role="group" aria-label="Niveau du classement">
          {BOARD_LEVELS.map((l) => (
            <button key={l} type="button" className={`jx-level is-${l}`} aria-pressed={level === l} onClick={() => setLevel(l)}>
              <strong>{LEVEL_LABEL[l]}</strong>
              <small>{data?.levels ? `${data.levels[l]} partie${data.levels[l] > 1 ? "s" : ""}` : multLabel(l)}</small>
            </button>
          ))}
        </div>
      )}

      {!data ? <p className="jx-note" role="status">Chargement…</p> : !data.available ? (
        <p className="jx-note">Le classement commun arrive bientôt. En attendant, ton historique est gardé sur cet appareil.</p>
      ) : (
        <>
          <div className="jx-board-stats">
            <p><b>{data.players.length}</b><small>joueur{data.players.length > 1 ? "s" : ""}</small></p>
            <p><b>{data.players.reduce((n, r) => n + r.plays, 0)}</b><small>partie{data.players.reduce((n, r) => n + r.plays, 0) > 1 ? "s" : ""}</small></p>
            <p className="is-me"><b>{myIndex >= 0 ? `${myIndex + 1}e` : "–"}</b><small>{myIndex >= 0 ? "ta place" : "pas encore classé"}</small></p>
          </div>
          <p className="jx-note">{game === "defi-jour" || game === "devine-anime" || game === "devine-perso" ? "Classés par total de points, tous jours confondus." : game === "duel" ? "Classés par meilleure compatibilité trouvée." : "Classés par meilleur score."}{leveled ? ` Classement du niveau ${LEVEL_LABEL[level]} uniquement.` : ""} Touche un joueur pour voir toutes ses parties.</p>

          <ol className="jx-ranking">
            {data.players.map((r, i) => {
              const expanded = open === r.key;
              return (
                <li key={r.key} className={`${isMe(r.key) ? "is-me" : ""}${expanded ? " is-open" : ""}`}>
                  <button type="button" className="jx-ranking-row" aria-expanded={expanded} aria-controls={`jx-p-${r.key}`} onClick={() => setOpen(expanded ? null : r.key)}>
                    <b className="jx-rank">{i + 1}</b>
                    {face(r)}
                    <span className="jx-ranking-who">
                      <strong>{nameOf(r)}{isMe(r.key) ? " (toi)" : ""}</strong>
                      <small>{r.plays} partie{r.plays > 1 ? "s" : ""}{game !== "duel" && game !== "plus-moins" ? ` · moy. ${unit(r.avg, r.bestMax).split(" / ")[0]}` : ""} · {ago(r.last)}</small>
                    </span>
                    <span className="jx-ranking-score">
                      <strong>{DAILY.includes(game) ? `${r.total} pts` : unit(r.best, r.bestMax)}</strong>
                      <small>{DAILY.includes(game) ? `${r.wins} réussi${r.wins > 1 ? "s" : ""}` : "record"}</small>
                    </span>
                  </button>
                  {expanded && (
                    <ul id={`jx-p-${r.key}`} className="jx-history jx-ranking-plays">
                      {r.history.map((p, k) => (
                        <li key={k}><span>{DAY.format(new Date(p.at))}</span><strong>{unit(p.score, p.max)}</strong><small>{detail(p)}</small></li>
                      ))}
                      {r.plays > r.history.length && <li className="jx-empty">Et {r.plays - r.history.length} partie{r.plays - r.history.length > 1 ? "s" : ""} plus ancienne{r.plays - r.history.length > 1 ? "s" : ""}.</li>}
                    </ul>
                  )}
                </li>
              );
            })}
            {!data.players.length && <li className="jx-empty">{leveled ? `Personne n'a encore joué en ${LEVEL_LABEL[level]}. À toi l'honneur.` : "Personne n'a encore joué. À toi l'honneur."}</li>}
          </ol>

          {data.feed.length > 0 && (
            <>
              <h3 className="jx-h3">Dernières parties</h3>
              <ul className="jx-feed">
                {data.feed.map((p, i) => {
                  const r = byKey.get(p.key);
                  return <li key={i} className={isMe(p.key) ? "is-me" : ""}><strong>{r ? nameOf(r) : "Invité"}</strong><b>{unit(p.score, p.max)}</b><small>{detail(p)}{detail(p) ? " · " : ""}{ago(p.at)}</small></li>;
                })}
              </ul>
            </>
          )}
        </>
      )}

      <h3 className="jx-h3">Mon historique{leveled ? ` · ${LEVEL_LABEL[level]}` : ""}</h3>
      <ul className="jx-history">
        {(mine ?? []).filter((p) => p.game === game && sameLevel(p.detail.level)).map((p, i) => (
          <li key={`s${i}`}><span>{DAY.format(new Date(p.created_at))}</span><strong>{unit(p.score, p.max_score)}</strong><small>{detail({ score: p.score, max: p.max_score, at: p.created_at, good: p.detail.good as number | undefined, rounds: p.detail.rounds as number | undefined, date: p.detail.date as string | undefined, ok: p.detail.ok as boolean | undefined, a: Number(p.detail.a), b: Number(p.detail.b), tries: p.detail.tries as number | undefined, level: p.detail.level as string | undefined, streak: p.detail.streak as number | undefined })}</small></li>
        ))}
        {!mine && local.filter((p) => p.game === game).map((p, i) => (
          <li key={`l${i}`}><span>{DAY.format(new Date(p.at))}</span><strong>{GAME_INFO[game].unit(p)}</strong><small>{p.label}</small></li>
        ))}
        {((mine && !mine.some((p) => p.game === game && sameLevel(p.detail.level))) || (!mine && !local.some((p) => p.game === game))) && <li className="jx-empty"><Check size={15} aria-hidden="true" /> Aucune partie pour l&apos;instant.</li>}
      </ul>
    </section>
  );
}
