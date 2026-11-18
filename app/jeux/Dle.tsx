"use client";

// Jeux du jour à indices : Devine l'anime (6 essais), Devine le perso (indices progressifs),
// et le Quiz des émojis. Les secrets restent sur le serveur ; ici, seulement l'affichage.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Clock, Lightbulb, Play, RotateCcw, ScanSearch, SendHorizontal, Share2, Smile, Trophy, UserSearch, X } from "lucide-react";
import { optimizedSrc } from "../../lib/img";
import type { AnimeFeedback, CharHint, CharVerdict, Dir } from "../../lib/games/dle-logic";
import { useShare } from "../hooks/useShare";
import { api, LEVEL_LABEL, multLabel, pushLocal, read, write, type Game, type Level, type PlayerApi } from "./shared";

type OnRanking = (g: Game) => void;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const frDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Champ de recherche avec suggestions (tolérant aux accents et à la ponctuation). */
function Picker({ items, used, onPick, placeholder, disabled, also }: { items: { id: number; label: string; sub?: string; alt?: string[] }[]; used: Set<number>; onPick: (id: number) => void; placeholder: string; disabled?: boolean; also?: (it: { sub?: string }) => string | undefined }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = norm(q);
    if (n.length < 2) return [];
    // `also` : recherche aussi par l'anime du perso (taper « Naruto » liste ses personnages).
    const byName = (it: (typeof items)[number]) => [it.label, ...(it.alt ?? [])].some((t) => norm(t).includes(n));
    const byAlso = (it: (typeof items)[number]) => !!also && norm(also(it) ?? "").includes(n);
    return items.filter((it) => !used.has(it.id) && (byName(it) || byAlso(it)))
      .sort((a, b) => Number(!byName(a)) - Number(!byName(b)) || Number(!norm(a.label).startsWith(n)) - Number(!norm(b.label).startsWith(n)))
      .slice(0, also ? 12 : 7);
  }, [q, items, used, also]);
  const pick = (id: number) => { setQ(""); onPick(id); };
  return (
    <div className="jx-picker">
      <input className="gk-input" value={q} disabled={disabled} placeholder={placeholder} autoComplete="off" aria-label={placeholder} aria-autocomplete="list" aria-controls="jx-picker-list"
        onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { e.preventDefault(); pick(list[0].id); } }} />
      {list.length > 0 && (
        <ul id="jx-picker-list" className="jx-picker-list" role="listbox">
          {list.map((it) => <li key={it.id} role="option" aria-selected="false"><button type="button" onClick={() => pick(it.id)}><strong>{it.label}</strong>{it.sub && <small>{it.sub}</small>}</button></li>)}
        </ul>
      )}
      {norm(q).length >= 2 && !list.length && <p className="jx-note">Aucun résultat dans la liste.</p>}
    </div>
  );
}

/** Réponse à taper (niveau Expert) : suggestions parmi tous les titres possibles, ou saisie libre. */
export function TypedAnswer({ titles, onSubmit, disabled, placeholder = "Tape le titre…" }: { titles: string[]; onSubmit: (text: string) => void; disabled?: boolean; placeholder?: string }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = norm(q);
    if (n.length < 2) return [];
    return titles.filter((t) => norm(t).includes(n)).sort((a, b) => Number(!norm(a).startsWith(n)) - Number(!norm(b).startsWith(n))).slice(0, 6);
  }, [q, titles]);
  const send = (t: string) => { if (!t.trim()) return; setQ(""); onSubmit(t.trim()); };
  return (
    <form className="jx-picker jx-typed" onSubmit={(e) => { e.preventDefault(); send(q); }}>
      <div className="jx-typed-row">
        <input className="gk-input" value={q} disabled={disabled} placeholder={placeholder} autoComplete="off" aria-label={placeholder} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="gk-btn gk-btn--sm" disabled={disabled || !q.trim()}><SendHorizontal size={16} aria-hidden="true" /> Valider</button>
      </div>
      {list.length > 0 && (
        <ul className="jx-picker-list" role="listbox">
          {list.map((t) => <li key={t} role="option" aria-selected="false"><button type="button" onClick={() => send(t)}><strong>{t}</strong></button></li>)}
        </ul>
      )}
    </form>
  );
}

/** Mémoire locale des essais du jour (pour reprendre une partie après rechargement). */
function useDayGuesses(key: string | null) {
  const get = useCallback((): number[] => { if (!key) return []; try { return JSON.parse(read(key) ?? "[]"); } catch { return []; } }, [key]);
  const set = useCallback((ids: number[]) => { if (key) write(key, JSON.stringify(ids)); }, [key]);
  return { get, set };
}

const arrow = (d: Dir | null, label: string) => d === "up" ? <ArrowUp size={14} aria-label={`Plus ${label}`} /> : d === "down" ? <ArrowDown size={14} aria-label={`Moins ${label}`} /> : null;

/* ═══ DEVINE L'ANIME ═════════════════════════════════════════════════════ */
interface AnimeAnswer { id: number; title: string; cover: string; year: number; studio: string | null }
interface AnimeState { date: string; tries: number; names: { id: number; title: string; alt: string | null; year: number }[]; played: { ok: boolean; score: number; feedback: AnimeFeedback[]; answer: AnimeAnswer } | null }

/** Écran d'accueil d'un jeu du jour : comment jouer, puis « Commencer ». */
function DleIntro({ title, Icon, date, steps, note, onStart }: { title: string; Icon: typeof ScanSearch; date: string; steps: React.ReactNode[]; note: string; onStart: () => void }) {
  return (
    <div className="jx-dle-intro">
      <div className="jx-daily-head">
        <div>
          <p className="jx-daily-date"><Icon size={16} aria-hidden="true" /> {frDate(date)}</p>
          <h2 className="gk-display">{title}</h2>
        </div>
      </div>
      <p className="jx-level-note">{note}</p>
      <ol className="jx-howto">{steps.map((st, i) => <li key={i}><b aria-hidden="true">{i + 1}</b><span>{st}</span></li>)}</ol>
      <button type="button" className="gk-btn jx-start" onClick={onStart}><Play size={18} aria-hidden="true" /> Commencer</button>
    </div>
  );
}

export function DevineAnime({ player, onRanking, level }: { player: PlayerApi; onRanking: OnRanking; level: Level }) {
  const [hints, setHints] = useState<{ label: string; value: string }[]>([]);
  const [started, setStarted] = useState(false);
  const [data, setData] = useState<AnimeState | null>(null);
  const [feedback, setFeedback] = useState<AnimeFeedback[]>([]);
  const [end, setEnd] = useState<{ ok: boolean; score: number; answer: AnimeAnswer; saved?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memory = useDayGuesses(data ? `guilde-dle-anime-${level === "normal" ? "" : `${level}-`}${data.date}` : null);
  const { share, Toast } = useShare();

  const send = useCallback(async (ids: number[]) => {
    setBusy(true); setError(null);
    try {
      const r = await api<{ feedback: AnimeFeedback[]; over: boolean; ok: boolean; score: number; saved: boolean; hints?: { label: string; value: string }[]; answer: AnimeAnswer | null }>("/api/games/devine-anime", { guesses: ids, level, ...player.payload() });
      setFeedback(r.feedback); setHints(r.hints ?? []); memory.set(ids);
      if (r.over && r.answer) {
        setEnd({ ok: r.ok, score: r.score, answer: r.answer, saved: r.saved });
        pushLocal({ game: "devine-anime", score: r.score, max: 100, at: new Date().toISOString(), label: r.ok ? `Trouvé en ${ids.length} essai${ids.length > 1 ? "s" : ""}` : "Raté" });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Essai non pris en compte."); } finally { setBusy(false); }
  }, [player, memory, level]);

  useEffect(() => {
    if (!player.device) return;
    let alive = true;
    api<AnimeState>(`/api/games/devine-anime?level=${level}&device=${player.device}${player.me ? `&member=${player.me}` : ""}`).then((d) => {
      if (!alive) return;
      setData(d);
      if (d.played) { setFeedback(d.played.feedback); setEnd({ ok: d.played.ok, score: d.played.score, answer: d.played.answer }); }
    }).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [player.device, player.me, level]);
  // Partie commencée sur cet appareil : on reprend les essais déjà faits.
  const resumed = useRef(false);
  useEffect(() => {
    if (!data || data.played || resumed.current) return;
    resumed.current = true;
    const saved = memory.get();
    if (saved.length) void Promise.resolve().then(() => { setStarted(true); return send(saved); });
  }, [data, memory, send]);

  if (!data) return <section className="jx-panel"><p className={error ? "jx-error" : "jx-note"} role="status">{error ?? "Préparation de l'anime mystère…"}</p></section>;
  if (!started && !end && !feedback.length) return (
    <section className="jx-panel jx-dle" aria-label="Devine l'anime" style={{ "--gk-accent": "#f472b6" } as React.CSSProperties}>
      <DleIntro title="Devine l'anime" Icon={ScanSearch} date={data.date} onStart={() => setStarted(true)}
        note={`Niveau ${LEVEL_LABEL[level]} (${multLabel(level)}) : ${level === "facile" ? "un anime très connu, indices dès le 2e essai." : level === "expert" ? "un anime moins connu, en 5 essais, indices tardifs." : "un anime connu, en 6 essais."} Un anime mystère par jour et par niveau, le même pour tout le monde.`}
        steps={[
          <>Tape le titre de <b>n&apos;importe quel anime</b> et choisis-le dans la liste. C&apos;est ton premier essai, même au hasard.</>,
          <>Chaque essai se compare à l&apos;anime mystère : <b className="jx-key is-ok">vert</b> identique, <b className="jx-key is-near">orange</b> proche, une flèche dit si l&apos;année, la note ou le nombre d&apos;épisodes est plus haut ou plus bas.</>,
          <>Après quelques ratés, des indices arrivent : ses thèmes, puis l&apos;initiale de son titre.</>,
          <>Trouve-le en {data.tries} essais au plus : moins tu en utilises, plus tu marques.</>,
        ]} />
      {error && <p className="jx-error" role="alert">{error}</p>}
    </section>
  );
  const ids = feedback.map((f) => f.id);
  const used = new Set(ids);
  const left = data.tries - feedback.length;
  const cell = (ok: boolean, near = false) => ok ? "is-ok" : near ? "is-near" : "";
  const shareText = () => {
    const rows = feedback.map((f) => [f.year.dir === "eq", f.format.ok, f.studio.ok, f.source.ok, f.genres.all, f.score.dir === "eq"].map((x) => (x ? "🟩" : "⬛")).join("")).join("\n");
    return `Devine l'anime · Guilde Otaku · ${data.date}\n${end?.ok ? `Trouvé en ${feedback.length}/${data.tries}` : `Raté (${data.tries}/${data.tries})`}\n${rows}`;
  };

  return (
    <section className="jx-panel jx-dle" aria-labelledby="jx-dle-title" style={{ "--gk-accent": "#f472b6" } as React.CSSProperties}>
      <div className="jx-daily-head">
        <div>
          <p className="jx-daily-date"><ScanSearch size={16} aria-hidden="true" /> {frDate(data.date)}</p>
          <h2 id="jx-dle-title" className="gk-display">Devine l&apos;anime</h2>
        </div>
        <p className="jx-dle-left" aria-live="polite"><b>{end ? feedback.length : left}</b><small>{end ? "essais joués" : `essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}`}</small></p>
      </div>
      {!end && (
        <>
          {hints.map((h) => <p key={h.label} className="jx-tags-hint"><b>Indice : {h.label.toLowerCase()}</b>{h.label === "Ses thèmes" ? h.value.split(", ").map((t) => <span key={t}>{t}</span>) : <span>{h.value}</span>}</p>)}
          <p className="jx-dle-rules">{feedback.length ? <><b className="jx-key is-ok">Vert</b> : identique. <b className="jx-key is-near">Orange</b> : proche. Flèche : l&apos;anime mystère est plus haut ou plus bas.</> : <>Tape le titre d&apos;un anime pour faire ton premier essai, même au hasard : la comparaison te guidera.</>}</p>
          <Picker items={data.names.map((n) => ({ id: n.id, label: n.title, sub: `${n.year}${n.alt ? ` · ${n.alt}` : ""}`, alt: n.alt ? [n.alt] : [] }))} used={used} onPick={(id) => void send([...ids, id])} placeholder="Tape le titre d'un anime…" disabled={busy} />
        </>
      )}
      {error && <p className="jx-error" role="alert">{error}</p>}

      {end && (
        <div className="jx-dle-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimizedSrc(end.answer.cover, 256)} alt="" width={120} height={170} />
          <div>
            <p className={`jx-daily-verdict${end.ok ? " is-ok" : ""}`}>{end.ok ? <Check size={22} aria-hidden="true" /> : <X size={22} aria-hidden="true" />} {end.ok ? `Trouvé en ${feedback.length} essai${feedback.length > 1 ? "s" : ""} : +${end.score} pts` : "Raté pour aujourd'hui"}</p>
            <p className="jx-dle-answer">{end.answer.title}</p>
            <p className="jx-note">{end.answer.year}{end.answer.studio ? ` · ${end.answer.studio}` : ""} · Nouvel anime demain à minuit.</p>
            {end.saved === false && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
            <div className="jx-actions is-left">
              <button type="button" className="gk-btn gk-btn--sm" onClick={() => share({ title: "Devine l'anime · Guilde Otaku", text: shareText(), url: "/jeux?jeu=devine-anime" })}><Share2 size={16} aria-hidden="true" /> Partager</button>
              <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={() => onRanking("devine-anime")}><Trophy size={16} aria-hidden="true" /> Classement</button>
            </div>
          </div>
        </div>
      )}

      <ol className="jx-dle-rows" reversed>
        {[...feedback].reverse().map((f) => (
          <li key={f.id} className={f.ok ? "is-win" : ""}>
            <div className="jx-dle-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(f.cover, 96)} alt="" width={36} height={50} loading="lazy" />
              <strong>{f.title}</strong>
            </div>
            <div className="jx-dle-cells">
              <span className={cell(f.year.dir === "eq", f.year.near)}><small>Année</small><b>{f.year.value} {arrow(f.year.dir, "récent")}</b></span>
              <span className={cell(f.format.ok)}><small>Format</small><b>{f.format.value}</b></span>
              <span className={cell(f.episodes.dir === "eq", f.episodes.near)}><small>Épisodes</small><b>{f.episodes.value ?? "?"} {arrow(f.episodes.dir, "d'épisodes")}</b></span>
              <span className={cell(f.score.dir === "eq", f.score.near)}><small>Note</small><b>{f.score.value} {arrow(f.score.dir, "bien noté")}</b></span>
              <span className={cell(f.studio.ok)}><small>Studio</small><b>{f.studio.value ?? "?"}</b></span>
              <span className={cell(f.source.ok)}><small>Adapté de</small><b>{f.source.value ?? "?"}</b></span>
              <span className={`is-wide ${cell(f.genres.all, f.genres.shared.length > 0)}`}><small>Genres</small><b>{f.genres.value.map((g) => <i key={g} className={f.genres.shared.includes(g) ? "is-shared" : ""}>{g}</i>)}</b></span>
            </div>
          </li>
        ))}
      </ol>
      <p className="jx-note">Données : AniList.</p>
      <Toast />
    </section>
  );
}

/* ═══ DEVINE LE PERSO ════════════════════════════════════════════════════ */
const animeOf = (it: { sub?: string }) => it.sub;
interface CharAnswer { name: string; anime: string; image: string }
interface CharState { date: string; tries: number; names: { id: number; name: string; alt: string[]; anime: string }[]; hints: CharHint[]; played: { ok: boolean; score: number; feedback: CharVerdict[]; answer: CharAnswer } | null }

export function DevinePerso({ player, onRanking, level }: { player: PlayerApi; onRanking: OnRanking; level: Level }) {
  const [data, setData] = useState<CharState | null>(null);
  const [feedback, setFeedback] = useState<CharVerdict[]>([]);
  const [hints, setHints] = useState<CharHint[]>([]);
  const [started, setStarted] = useState(false);
  const [end, setEnd] = useState<{ ok: boolean; score: number; answer: CharAnswer; saved?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memory = useDayGuesses(data ? `guilde-dle-perso-${level === "normal" ? "" : `${level}-`}${data.date}` : null);
  const { share, Toast } = useShare();

  const send = useCallback(async (ids: number[]) => {
    setBusy(true); setError(null);
    try {
      const r = await api<{ feedback: CharVerdict[]; hints: CharHint[]; over: boolean; ok: boolean; score: number; saved: boolean; answer: CharAnswer | null }>("/api/games/devine-perso", { guesses: ids, level, ...player.payload() });
      setFeedback(r.feedback); setHints(r.hints); memory.set(ids);
      if (r.over && r.answer) {
        setEnd({ ok: r.ok, score: r.score, answer: r.answer, saved: r.saved });
        pushLocal({ game: "devine-perso", score: r.score, max: 100, at: new Date().toISOString(), label: r.ok ? `Trouvé en ${ids.length} essai${ids.length > 1 ? "s" : ""}` : "Raté" });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Essai non pris en compte."); } finally { setBusy(false); }
  }, [player, memory, level]);

  useEffect(() => {
    if (!player.device) return;
    let alive = true;
    api<CharState>(`/api/games/devine-perso?level=${level}&device=${player.device}${player.me ? `&member=${player.me}` : ""}`).then((d) => {
      if (!alive) return;
      setData(d); setHints(d.hints);
      if (d.played) { setFeedback(d.played.feedback); setEnd({ ok: d.played.ok, score: d.played.score, answer: d.played.answer }); }
    }).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [player.device, player.me, level]);
  const resumed = useRef(false);
  useEffect(() => {
    if (!data || data.played || resumed.current) return;
    resumed.current = true;
    const saved = memory.get();
    if (saved.length) void Promise.resolve().then(() => { setStarted(true); return send(saved); });
  }, [data, memory, send]);

  if (!data) return <section className="jx-panel"><p className={error ? "jx-error" : "jx-note"} role="status">{error ?? "Préparation du perso mystère…"}</p></section>;
  if (!started && !end && !feedback.length) return (
    <section className="jx-panel jx-dle" aria-label="Devine le perso" style={{ "--gk-accent": "#fb923c" } as React.CSSProperties}>
      <DleIntro title="Devine le perso" Icon={UserSearch} date={data.date} onStart={() => setStarted(true)}
        note={`Niveau ${LEVEL_LABEL[level]} (${multLabel(level)}) : ${level === "facile" ? "un perso très connu, le titre de son anime est donné d'entrée." : level === "expert" ? "un perso moins connu, le titre de son anime n'arrive qu'au 4e raté." : "un perso connu."} Un perso mystère par jour et par niveau, le même pour tout le monde.`}
        steps={[
          <>Tu pars de quelques infos : son rôle, son genre, son âge{level === "expert" ? "" : ", les genres et l'année de son anime"}.</>,
          <>Tape le nom d&apos;<b>un personnage</b>, ou le <b>titre d&apos;un anime</b> pour voir ses personnages, puis choisis-en un.</>,
          <>Chaque essai se compare au perso mystère : même anime, genre, rôle, studio, année de l&apos;anime (flèche plus récent ou plus ancien), genres en commun.</>,
          <>Chaque raté dévoile un indice : portrait de moins en moins flou, studio, thèmes, titre de l&apos;anime, doubleur, puis les initiales de son nom.</>,
          <>Trouve-le en {data.tries} essais au plus : moins tu en utilises, plus tu marques.</>,
        ]} />
      {error && <p className="jx-error" role="alert">{error}</p>}
    </section>
  );
  const ids = feedback.map((f) => f.id);
  const left = data.tries - feedback.length;
  const textHints = hints.filter((h) => h.kind === "text");
  const image = [...hints].reverse().find((h) => h.kind === "image");

  return (
    <section className="jx-panel jx-dle" aria-labelledby="jx-perso-title" style={{ "--gk-accent": "#fb923c" } as React.CSSProperties}>
      <div className="jx-daily-head">
        <div>
          <p className="jx-daily-date"><UserSearch size={16} aria-hidden="true" /> {frDate(data.date)}</p>
          <h2 id="jx-perso-title" className="gk-display">Devine le perso</h2>
        </div>
        <p className="jx-dle-left" aria-live="polite"><b>{end ? feedback.length : left}</b><small>{end ? "essais joués" : `essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}`}</small></p>
      </div>
      {!end && <p className="jx-dle-rules">{feedback.length ? "Vert : identique. Orange : proche. Flèche : l'anime du perso mystère est plus récent ou plus ancien. Chaque raté dévoile un indice." : "Tape le nom d'un perso, ou le titre d'un anime pour voir ses personnages. Chaque essai se compare au perso mystère, et chaque raté dévoile un indice."}</p>}

      <div className="jx-perso">
        <div className="jx-perso-pic">
          {end
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={optimizedSrc(end.answer.image, 384)} alt={end.answer.name} />
            : image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={image.value} alt="Portrait pixelisé du personnage mystère" className="is-pixel" />
              : <span aria-hidden="true">?</span>}
        </div>
        <dl className="jx-perso-hints">
          {textHints.map((h) => <div key={h.label}><dt>{h.label}</dt><dd>{h.value}</dd></div>)}
          {!end && left > 0 && <div className="is-next"><dt>Prochain indice</dt><dd>après un essai raté</dd></div>}
        </dl>
      </div>

      {!end && <Picker items={data.names.map((n) => ({ id: n.id, label: n.name, sub: n.anime, alt: n.alt }))} used={new Set(ids)} onPick={(id) => void send([...ids, id])} placeholder="Nom d'un perso, ou titre d'un anime…" disabled={busy} also={animeOf} />}
      {error && <p className="jx-error" role="alert">{error}</p>}

      {end && (
        <div className="jx-dle-end is-text">
          <p className={`jx-daily-verdict${end.ok ? " is-ok" : ""}`}>{end.ok ? <Check size={22} aria-hidden="true" /> : <X size={22} aria-hidden="true" />} {end.ok ? `Trouvé en ${feedback.length} essai${feedback.length > 1 ? "s" : ""} : +${end.score} pts` : "Raté pour aujourd'hui"}</p>
          <p className="jx-dle-answer">{end.answer.name}</p>
          <p className="jx-note">{end.answer.anime} · Nouveau perso demain à minuit.</p>
          {end.saved === false && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <div className="jx-actions is-left">
            <button type="button" className="gk-btn gk-btn--sm" onClick={() => share({ title: "Devine le perso · Guilde Otaku", text: `Devine le perso · Guilde Otaku · ${data.date}\n${end.ok ? `Trouvé en ${feedback.length}/${data.tries}` : "Raté"}. À ton tour !`, url: "/jeux?jeu=devine-perso" })}><Share2 size={16} aria-hidden="true" /> Partager</button>
            <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={() => onRanking("devine-perso")}><Trophy size={16} aria-hidden="true" /> Classement</button>
          </div>
        </div>
      )}

      <ol className="jx-dle-rows" reversed>
        {[...feedback].reverse().map((f) => (
          <li key={f.id} className={f.ok ? "is-win" : ""}>
            <div className="jx-dle-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.image && <img src={optimizedSrc(f.image, 96)} alt="" width={36} height={50} loading="lazy" />}
              <strong>{f.name}</strong>
            </div>
            <div className="jx-dle-cells">
              <span className={`is-wide ${f.sameAnime ? "is-ok" : ""}`}><small>Anime</small><b>{f.anime}</b></span>
              <span className={f.sameGender ? "is-ok" : ""}><small>Genre</small><b>{f.gender ?? "?"}</b></span>
              <span className={f.sameRole ? "is-ok" : ""}><small>Rôle</small><b>{f.role.replace("Personnage ", "")}</b></span>
              <span className={f.year ? (f.year.dir === "eq" ? "is-ok" : f.year.near ? "is-near" : "") : ""}><small>Année de l&apos;anime</small><b>{f.year ? <>{f.year.value} {arrow(f.year.dir, "récent")}</> : "?"}</b></span>
              <span className={f.sameStudio ? "is-ok" : ""}><small>Studio</small><b>{f.studio ?? "?"}</b></span>
              <span className={`is-wide ${f.sameAnime ? "is-ok" : f.genres.shared.length ? "is-near" : ""}`}><small>Genres de l&apos;anime</small><b>{f.genres.value.map((g) => <i key={g} className={f.genres.shared.includes(g) ? "is-shared" : ""}>{g}</i>)}</b></span>
            </div>
          </li>
        ))}
      </ol>
      <p className="jx-note">Données : AniList.</p>
      <Toast />
    </section>
  );
}

/* ═══ QUIZ DES ÉMOJIS ════════════════════════════════════════════════════ */
const EMOJI_MS = 20_000;
interface EmojiRound { emojis: string; hint: string | null; choices: string[] }
interface EmojiResult { score: number; max: number; good: number; saved: boolean; correction: { emojis: string; answer: string; ok: boolean; hint: boolean; points: number }[] }

export function EmojiQuiz({ player, onRanking, level }: { player: PlayerApi; onRanking: OnRanking; level: Level }) {
  const [titles, setTitles] = useState<string[] | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "reveal" | "sending" | "done">("intro");
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<EmojiRound[]>([]);
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [left, setLeft] = useState(EMOJI_MS);
  const [result, setResult] = useState<EmojiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ choice: number | null; ms: number; hint: boolean; text?: string }[]>([]);
  const started = useRef(0);

  async function start() {
    setPhase("loading"); setError(null); setResult(null);
    try {
      const d = await api<{ token: string; rounds: EmojiRound[]; titles: string[] | null }>(`/api/games/emoji?level=${level}`);
      answers.current = []; setToken(d.token); setRounds(d.rounds); setTitles(d.titles); setTyped(null); setR(0); setPicked(null); setHint(false);
      started.current = performance.now(); setLeft(EMOJI_MS); setPhase("play");
    } catch (e) { setError(e instanceof Error ? e.message : "Partie indisponible."); setPhase("intro"); }
  }
  const finish = useCallback(async () => {
    setPhase("sending");
    try {
      const d = await api<EmojiResult>("/api/games/emoji", { action: "finish", token, answers: answers.current, ...player.payload() });
      setResult(d); setPhase("done");
      pushLocal({ game: "emoji-quiz", score: d.score, max: d.max, at: new Date().toISOString(), label: `${d.good}/${d.correction.length} énigmes` });
    } catch (e) { setError(e instanceof Error ? e.message : "Correction impossible."); setPhase("intro"); }
  }, [token, player]);
  const answer = useCallback((choice: number | null, text?: string) => {
    if (phase !== "play") return;
    answers.current[r] = { choice, ms: Math.round(performance.now() - started.current), hint, ...(text ? { text } : {}) };
    setPicked(choice); setTyped(text ?? null); setPhase("reveal");
    window.setTimeout(() => {
      if (r + 1 >= rounds.length) { void finish(); return; }
      setR(r + 1); setPicked(null); setTyped(null); setHint(false); started.current = performance.now(); setLeft(EMOJI_MS); setPhase("play");
    }, 650);
  }, [phase, r, rounds.length, finish, hint]);
  useEffect(() => {
    if (phase !== "play") return;
    const t = window.setInterval(() => {
      const l = EMOJI_MS - (performance.now() - started.current);
      setLeft(Math.max(0, l));
      if (l <= 0) { window.clearInterval(t); answer(null); }
    }, 200);
    return () => window.clearInterval(t);
  }, [phase, answer]);

  const round = rounds[r];
  return (
    <section className="jx-panel" aria-labelledby="jx-emoji-title" style={{ "--gk-accent": "#facc15" } as React.CSSProperties}>
      {(phase === "intro" || phase === "loading") && (
        <div className="jx-intro">
          <span className="jx-big-icon" aria-hidden="true"><Smile size={38} /></span>
          <h2 id="jx-emoji-title" className="gk-display">Quiz des émojis</h2>
          <p>8 animes résumés en quelques émojis, 20 secondes chacun. 100 points par bonne réponse (50 si tu prends l&apos;indice), jusqu&apos;à 50 de bonus si tu es rapide.</p>
          <p className="jx-level-note">Niveau {LEVEL_LABEL[level]} ({multLabel(level)}) : {level === "facile" ? "4 titres proposés, indice gratuit." : level === "expert" ? "aucune proposition : tape le titre (les petites fautes passent)." : "4 titres proposés, l'indice coûte la moitié des points."}</p>
          {error && <p className="jx-error" role="alert">{error}</p>}
          <button type="button" className="gk-btn" onClick={start} disabled={phase === "loading"}><Play size={18} aria-hidden="true" /> {phase === "loading" ? "Préparation…" : "Lancer la partie"}</button>
        </div>
      )}
      {(phase === "play" || phase === "reveal") && round && (
        <div className="jx-round" key={r}>
          <div className="jx-round-head"><span className="jx-round-no">Énigme {r + 1} / {rounds.length}</span><span className="jx-timer"><Clock size={15} aria-hidden="true" /> {Math.ceil(left / 1000)} s</span></div>
          <div className="jx-timebar" aria-hidden="true"><span style={{ transform: `scaleX(${left / EMOJI_MS})` }} /></div>
          <p className="jx-emoji-big" role="img" aria-label="Énigme en émojis">{round.emojis}</p>
          <div className="jx-emoji-hint">
            {hint && round.hint ? <p><Lightbulb size={16} aria-hidden="true" /> {round.hint}</p>
              : round.hint && <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" disabled={phase !== "play"} onClick={() => setHint(true)}><Lightbulb size={16} aria-hidden="true" /> {level === "facile" ? "Indice (gratuit)" : "Indice (moitié des points)"}</button>}
          </div>
          {titles
            ? <>{phase === "reveal" && typed ? <p className="jx-note" role="status">Réponse envoyée : {typed}</p> : <TypedAnswer titles={titles} disabled={phase !== "play"} onSubmit={(t) => answer(null, t)} />}</>
            : <div className="jx-choices">
                {round.choices.map((c, i) => <button key={i} type="button" className="jx-choice" aria-pressed={picked === i} disabled={phase !== "play"} onClick={() => answer(i)}><b>{"ABCD"[i]}</b><span>{c}</span></button>)}
              </div>}
        </div>
      )}
      {phase === "sending" && <p className="jx-note" role="status">Correction…</p>}
      {phase === "done" && result && (
        <div className="jx-result">
          <p className="jx-score"><b>{result.score}</b><span>/ {result.max} points</span></p>
          <p className="jx-verdict">{result.good} énigme{result.good > 1 ? "s" : ""} sur {result.correction.length}</p>
          {!result.saved && <p className="jx-note">Partie gardée sur cet appareil (classement commun bientôt disponible).</p>}
          <ol className="jx-correction">
            {result.correction.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : "is-ko"}>
                <span className="jx-emoji-cell" aria-hidden="true">{c.emojis}</span>
                <span><strong>{c.answer}</strong><small>{c.ok ? (c.hint ? "Trouvé avec l'indice" : "Trouvé") : "Raté"}</small></span>
                <b>{c.ok ? `+${c.points}` : "0"}</b>
              </li>
            ))}
          </ol>
          <div className="jx-actions">
            <button type="button" className="gk-btn" onClick={start}><RotateCcw size={17} aria-hidden="true" /> Rejouer</button>
            <button type="button" className="gk-btn gk-btn--ghost" onClick={() => onRanking("emoji-quiz")}><Trophy size={17} aria-hidden="true" /> Voir le classement</button>
          </div>
        </div>
      )}
      {(phase === "intro" || phase === "done") && <Propose player={player} />}
    </section>
  );
}

/** Proposer une énigme : elle part en attente, l'admin la valide avant qu'elle n'entre dans le jeu. */
function Propose({ player }: { player: PlayerApi }) {
  const [open, setOpen] = useState(false);
  const [emojis, setEmojis] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api("/api/games/emoji", { action: "propose", emojis, answer, hint, ...player.payload() });
      setMsg({ ok: true, text: "Merci ! Ton énigme sera ajoutée au jeu après validation." }); setEmojis(""); setAnswer(""); setHint("");
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : "Envoi impossible." }); } finally { setBusy(false); }
  }
  if (!open) return <div className="jx-actions jx-propose-open"><button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={() => setOpen(true)}><Smile size={16} aria-hidden="true" /> Proposer une énigme</button></div>;
  return (
    <form className="jx-propose" onSubmit={submit}>
      <h3 className="jx-h3">Proposer une énigme</h3>
      <label className="jx-field"><span>Émojis (2 à 8)</span><input className="gk-input jx-propose-emojis" value={emojis} onChange={(e) => setEmojis(e.target.value)} maxLength={80} required placeholder="Colle tes émojis ici" /></label>
      <label className="jx-field"><span>Titre de l&apos;anime</span><input className="gk-input" value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={80} required /></label>
      <label className="jx-field"><span>Indice (facultatif)</span><input className="gk-input" value={hint} onChange={(e) => setHint(e.target.value)} maxLength={80} /></label>
      <div className="jx-actions is-left"><button type="submit" className="gk-btn gk-btn--sm" disabled={busy}><SendHorizontal size={16} aria-hidden="true" /> {busy ? "Envoi…" : "Envoyer"}</button><button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={() => setOpen(false)}>Fermer</button></div>
      {msg && <p className={msg.ok ? "jx-ok" : "jx-error"} role="status">{msg.text}</p>}
    </form>
  );
}
