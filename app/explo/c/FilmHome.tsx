"use client";

// Accueil cinéma (direction C). Une scène WebGL fixe, des chapitres traversés au défilement :
// ouverture (le membre de la semaine en trame), puis les quatre générations de la Guilde,
// puis l'index. Navigation : frise de chapitres en bas (timecode), index plein écran.
import { useCallback, useMemo, useRef, useState } from "react";
import InkStage from "../InkStage";
import { goScene, hex, useFilm, type Shot } from "./useFilm";
import TurnLink from "../TurnLink";
import { useBackClose } from "../../hooks/useBackClose";

export interface Scene { k: number; kicker: string; title: string; text: string; image: string; tint: string; focusY: number; cast: { id: number; name: string; src: string; h: number }[]; lead: { id: number; name: string }; tc: string }
export interface IndexItem { id: number; name: string; rank: string; cut: string | null }

export default function FilmHome({ scenes, index }: { scenes: Scene[]; index: IndexItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [pair, setPair] = useState<[number, number]>([0, 1]);
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState<IndexItem | null>(null);
  useBackClose(open, () => setOpen(false));
  const shots = useMemo<Shot[]>(() => scenes.map((s, k) => ({ tint: hex(s.tint), halftone: k === 0 ? .9 : .55, focusY: s.focusY })), [scenes]);
  const onScene = useCallback((i: number, to: number) => setPair([i, to]), []);
  const u = useFilm(root, shots, onScene);
  const images = useMemo(() => scenes.map((s) => s.image), [scenes]);

  return (
    <div ref={root} className="xc" data-explo="/explo/c" style={{ height: `${scenes.length * 170 + 30}svh` }}>
      <div className="xc-fixed">
        <InkStage className="xc-canvas" images={images} from={pair[0]} to={pair[1]} u={u} />
        <span className="xc-letter is-top" aria-hidden="true" /><span className="xc-letter is-bottom" aria-hidden="true" />
        <span className="xc-grain" aria-hidden="true" />

        {scenes.map((s) => (
          <section key={s.k} data-k={s.k} className={`xc-scene${s.k === 0 ? " is-open" : ""}`} aria-label={s.title} style={{ "--tint": s.tint } as React.CSSProperties}>
            <div className="xc-cast" aria-hidden="true">
              {s.cast.map((c, j) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={c.id} src={c.src} alt="" className={`xc-actor a${j}`} loading={s.k === 0 ? "eager" : "lazy"} />
              ))}
            </div>
            <p className="xc-kicker">{s.kicker}</p>
            {s.k === 0 ? <h2 className="xp-sr">{s.title}</h2> : <h2 className="xc-title">{s.title}</h2>}
            <p className="xc-sub">{s.text}</p>
            {s.k > 0 && (
              <p className="xc-credits">{[{ id: s.lead.id, name: s.lead.name }, ...s.cast].map((c) => <TurnLink key={c.id} href={`/explo/c/membre/${c.id}`} kind="xc-ink">{c.name}</TurnLink>)}</p>
            )}
          </section>
        ))}
        <h1 className="xc-mast" data-k={0}><span>Guilde</span><span>Otaku</span></h1>

        {/* Frise des chapitres : timecode, avancement, saut direct. */}
        <nav className="xc-timeline" aria-label="Chapitres">
          <span className="xc-tl-bar" aria-hidden="true"><i /></span>
          {scenes.map((s) => (
            <button key={s.k} type="button" className="xc-tl-tick" style={{ left: `${(s.k / Math.max(1, scenes.length - 1)) * 100}%` }}
              aria-current={pair[0] === s.k ? "step" : undefined} onClick={() => root.current && goScene(root.current, s.k, scenes.length)}>
              <small>{s.tc}</small><span>{s.title}</span>
            </button>
          ))}
        </nav>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a className="xc-logo" href="/explo/c" aria-label="Guilde Otaku"><img src="/logo-header.png" alt="" width={40} height={34} /></a>
        <button type="button" className="xc-index-btn" onClick={() => setOpen(true)} aria-expanded={open}>Index <span>{index.length}</span></button>
      </div>

      {open && (
        <div className="xc-index" role="dialog" aria-modal="true" aria-label="Index des nakama" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          <button type="button" className="xc-index-close" onClick={() => setOpen(false)} autoFocus>Fermer</button>
          <div className="xc-index-peek" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {peek?.cut && <img key={peek.id} src={peek.cut} alt="" />}
            {peek && <p>{peek.rank}</p>}
          </div>
          <ol>
            {index.map((m, k) => (
              <li key={m.id} onMouseEnter={() => setPeek(m)} onFocus={() => setPeek(m)}>
                <TurnLink href={`/explo/c/membre/${m.id}`} kind="xc-ink"><small>{String(k + 1).padStart(2, "0")}</small><span>{m.name}</span></TurnLink>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
