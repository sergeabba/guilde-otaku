"use client";

// Le générique du jour : un opening et un ending de grandes séries, toutes époques,
// vidéos officielles (chaînes des ayants droit) lues avec le lecteur YouTube.
// Pendant la lecture, la vidéo suit le défilement dans un mini-lecteur.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play, SkipForward, X, ArrowUp } from "lucide-react";
import type { Generique } from "../../lib/generiques";
import { ytThumb } from "../../lib/free-channels";
import { useMusicDock } from "../components/MusicDock";
import WordReveal from "../components/WordReveal";

type Kind = "tous" | "OP" | "ED";
const ERAS = [
  { id: "toutes", label: "Toutes époques", test: () => true },
  { id: "classiques", label: "80-90", test: (y: number) => y < 2000 },
  { id: "2000", label: "2000", test: (y: number) => y >= 2000 && y < 2010 },
  { id: "2010", label: "2010", test: (y: number) => y >= 2010 && y < 2020 },
  { id: "2020", label: "2020", test: (y: number) => y >= 2020 },
] as const;
const KIND_LABEL = { OP: "Opening", ED: "Ending" } as const;
const embed = (key: string) => `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
const watch = (key: string) => `https://www.youtube.com/watch?v=${key}`;
const title = (g: Generique) => `${KIND_LABEL[g.kind]} · ${g.series}`;

export default function Generiques() {
  const ref = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ date: string; op: number; ed: number; list: Generique[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mini, setMini] = useState(false);
  const [kind, setKind] = useState<Kind>("tous");
  const [era, setEra] = useState<(typeof ERAS)[number]["id"]>("toutes");
  const dock = useMusicDock();
  const dockMinimize = dock?.minimize;

  // Chargé quand la section approche de l'écran.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      fetch("/api/generiques").then((r) => r.json()).then((d) => { setData(d); setCurrent(d.op >= 0 ? d.op : 0); }).catch(() => setFailed(true));
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mini-lecteur : la vidéo en cours suit le défilement quand son emplacement sort de l'écran.
  useEffect(() => {
    const el = slot.current;
    if (!el || !playing) return;
    const io = new IntersectionObserver(([e]) => setMini(!e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  const play = useCallback((i: number) => {
    setCurrent(i); setPlaying(true);
    dockMinimize?.(); // une seule source de son à la fois
  }, [dockMinimize]);
  const stop = useCallback(() => { setPlaying(false); setMini(false); }, []);

  const list = useMemo(() => data?.list ?? [], [data]);
  const shown = useMemo(() => {
    const e = ERAS.find((x) => x.id === era)!;
    return list.map((g, i) => ({ g, i })).filter(({ g }) => (kind === "tous" || g.kind === kind) && e.test(g.year ?? 0));
  }, [list, kind, era]);
  const next = useCallback(() => {
    if (!shown.length) return;
    const at = shown.findIndex((x) => x.i === current);
    play(shown[(at + 1) % shown.length].i);
  }, [shown, current, play]);

  const g = current !== null ? list[current] : null;
  const daily = data ? [data.op, data.ed].filter((i) => i >= 0) : [];

  return (
    <section ref={ref} className="cin-op" aria-labelledby="cin-op-title">
      <div className="gk-wrap cin-intro">
        <span className="gk-chapter"><b>♪</b><span>ŌPUNINGU · ENDINGU</span></span>
        <h2 id="cin-op-title" className="gk-display cin-h2"><WordReveal>Le générique <em>du jour.</em></WordReveal></h2>
        <p>Un opening et un ending des grandes séries, de Ken le Survivant à Frieren, changés chaque jour à minuit. Lance-en un et continue de faire défiler : la vidéo te suit.</p>
      </div>

      {failed && <p className="gk-wrap cin-empty" role="alert">Les génériques sont indisponibles pour le moment.</p>}
      {!data && !failed && <div className="gk-wrap"><div className="cin-op-skel gk-skel" aria-hidden="true" /></div>}

      {data && g && (
        <div className="gk-wrap cin-op-stage">
          {/* Emplacement fixe : la vidéo y reste tant qu'il est à l'écran, sinon elle flotte. */}
          <div ref={slot} className="cin-op-slot">
            <div className={`cin-op-screen${mini && playing ? " is-mini" : ""}`}>
              {playing
                ? <iframe key={g.key} src={embed(g.key)} title={title(g)} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                : (
                  <button type="button" className="cin-op-poster" onClick={() => play(current!)} aria-label={`Regarder : ${title(g)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ytThumb(g.key, "hq")} alt="" />
                    <span className="cin-gh-play" aria-hidden="true"><Play size={34} fill="currentColor" /></span>
                  </button>
                )}
              {mini && playing && (
                <div className="cin-op-mini-bar">
                  <span>{title(g)}</span>
                  <button type="button" onClick={() => slot.current?.scrollIntoView({ behavior: "smooth", block: "center" })} aria-label="Revenir au générique"><ArrowUp size={16} aria-hidden="true" /></button>
                  <button type="button" onClick={next} aria-label="Générique suivant"><SkipForward size={16} aria-hidden="true" /></button>
                  <button type="button" onClick={stop} aria-label="Arrêter la vidéo"><X size={16} aria-hidden="true" /></button>
                </div>
              )}
            </div>
          </div>
          <div className="cin-op-now">
            <p className="cin-op-kind">{KIND_LABEL[g.kind]}{daily.includes(current!) ? " du jour" : ""}</p>
            <h3 className="gk-display">{g.series}</h3>
            <p className="cin-op-meta">{[g.year, g.label, g.channel ? `chaîne ${g.channel}` : "chaîne officielle"].filter(Boolean).join(" · ")}</p>
            <div className="cin-op-actions">
              {!playing && <button type="button" className="cin-play" onClick={() => play(current!)}><Play size={18} aria-hidden="true" /> Regarder</button>}
              <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={next}><SkipForward size={16} aria-hidden="true" /> Suivant</button>
              <a className="gk-btn gk-btn--sm gk-btn--ghost" href={watch(g.key)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> YouTube</a>
            </div>
            <ul className="cin-op-daily" aria-label="Génériques du jour">
              {daily.map((i) => (
                <li key={i}>
                  <button type="button" aria-pressed={current === i} onClick={() => play(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ytThumb(list[i].key, "mq")} alt="" loading="lazy" />
                    <span><b>{KIND_LABEL[list[i].kind]} du jour</b><small>{list[i].series}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data && (
        <div className="cin-op-all">
          <div className="gk-wrap cin-op-filters">
            <div className="gk-chips" role="group" aria-label="Type">
              {(["tous", "OP", "ED"] as Kind[]).map((k) => <button key={k} type="button" className="gk-chip" aria-pressed={kind === k} onClick={() => setKind(k)}><span>{k === "tous" ? "Tous" : `${KIND_LABEL[k]}s`}</span></button>)}
            </div>
            <div className="gk-chips" role="group" aria-label="Époque">
              {ERAS.map((e) => <button key={e.id} type="button" className="gk-chip" aria-pressed={era === e.id} onClick={() => setEra(e.id)}><span>{e.label}</span></button>)}
            </div>
            <p className="cin-op-count">{shown.length} générique{shown.length > 1 ? "s" : ""}</p>
          </div>
          <ul className="cin-op-rail">
            {shown.map(({ g: x, i }) => (
              <li key={x.key}>
                <button type="button" aria-pressed={current === i && playing} onClick={() => play(i)}>
                  <span className="cin-op-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ytThumb(x.key, "mq")} alt="" loading="lazy" />
                    <i>{x.kind}</i>
                  </span>
                  <b>{x.series}</b>
                  <small>{[x.year, x.label].filter(Boolean).join(" · ")}</small>
                </button>
              </li>
            ))}
          </ul>
          <p className="gk-wrap cin-credit">Vidéos des chaînes officielles des ayants droit (Crunchyroll, TOHO animation, Aniplex, Toei…), repérées grâce à TMDB. Certaines peuvent être bloquées selon le pays : le lecteur l&apos;indique, et le lien YouTube reste disponible.</p>
        </div>
      )}
    </section>
  );
}
