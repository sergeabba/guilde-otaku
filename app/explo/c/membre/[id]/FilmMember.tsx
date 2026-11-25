"use client";

// Le film d'un membre (direction C). Six scènes sur la même scène WebGL :
// 0 le titre (portrait en trame) · 1 « dans la vraie vie » (fondu à l'encre vers la photo,
// sous-titres de la bio) · 2 la fiche · 3 le bankai (l'image éclate, décalage chromatique,
// puis se reforme) · 4 l'extension du territoire (anneaux qui envahissent l'image) · 5 la suite.
import { useCallback, useMemo, useRef, useState } from "react";
import InkStage from "../../../InkStage";
import TurnLink from "../../../TurnLink";
import { goScene, hex, useFilm, type Shot } from "../../useFilm";
import type { ExploMember } from "../../../../../lib/explo-data";

export default function FilmMember({ m, images, prev, next, lines }: { m: ExploMember; images: string[]; prev: { id: number; name: string }; next: { id: number; name: string }; lines: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const tint = hex(m.accent);
  const fy = Number(m.animePos.split(" ")[1]?.replace("%", "")) / 100 || .2;
  const hasReal = images.length > 1;
  // Scène → texture (0 : anime, 1 : photo).
  const tex = useMemo(() => [0, hasReal ? 1 : 0, 0, 0, 0, 0], [hasReal]);
  const shots = useMemo<Shot[]>(() => [
    { tint, halftone: .95, focusY: fy },
    { tint, halftone: .12, focusY: .25 },
    { tint, halftone: .45, focusY: fy },
    { tint, halftone: .7, shatter: .75, focusY: fy },
    { tint, halftone: .85, rings: 1, focusY: fy },
    { tint, halftone: .35, focusY: fy },
  ], [tint, fy]);
  const [pair, setPair] = useState<[number, number]>([0, tex[1]]);
  const onScene = useCallback((i: number, to: number) => setPair([tex[i], tex[to]]), [tex]);
  const u = useFilm(root, shots, onScene);
  const labels = ["Titre", "Vraie vie", "Fiche", "Bankai", "Territoire", "Suite"];
  const spaced = (s: string) => s.toUpperCase().split("").join(" ");

  return (
    <div ref={root} className="xc xcm" data-explo={`/explo/c/membre/${m.id}`} style={{ height: `${shots.length * 170 + 20}svh`, "--tint": m.accent } as React.CSSProperties}>
      <div className="xc-fixed">
        <InkStage className="xc-canvas" images={images} from={pair[0]} to={pair[1]} u={u} />
        <span className="xc-letter is-top" aria-hidden="true" /><span className="xc-letter is-bottom" aria-hidden="true" />

        {m.cut && (
          <div className="xcm-actor" data-k={3} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.cut.src} alt="" data-explo-hero="" />
          </div>
        )}

        <section className="xc-scene xcm-s0" data-k={0} aria-labelledby="xcm-name">
          <p className="xc-kicker">La Guilde présente</p>
          <h1 id="xcm-name" className="xcm-name">{m.name}</h1>
          <p className="xcm-rank"><b>{m.rank}</b><span>{m.romaji}</span>{m.alias && <em>« {m.alias} »</em>}</p>
        </section>
        <section className="xc-scene xcm-s1" data-k={1} aria-label="Dans la vraie vie">
          <p className="xc-kicker">{hasReal ? "Dans la vraie vie" : "Son histoire"}</p>
          <div className="xcm-subs">{lines.map((l, k) => <p key={k}>{l}</p>)}</div>
          <p className="xcm-credit">{[m.country, m.birthday, m.series ? `d'après ${m.series}` : null].filter(Boolean).join("   ·   ")}</p>
        </section>
        <section className="xc-scene xcm-s2" data-k={2} aria-label="Fiche">
          <p className="xc-kicker">Fiche</p>
          {m.stats && (
            <dl className="xcm-stats">
              {(["force", "vitesse", "technique"] as const).map((k) => <div key={k}><dt>{k}</dt><dd>{m.stats![k]}</dd></div>)}
            </dl>
          )}
          {m.special && <p className="xcm-special"><small>Attaque spéciale</small><b>{m.special.name}</b><span>{m.special.effect}</span></p>}
        </section>
        <section className="xc-scene xcm-s3" data-k={3} aria-label="Bankai">
          {m.bankai ? (<>
            <p className="xcm-big" aria-hidden="true">{spaced("Bankai")}</p>
            <h2 className="xcm-power">{m.bankai.nom}</h2>
            <p className="xc-sub">« {m.bankai.sens} » · {m.bankai.effet}</p>
          </>) : <p className="xc-sub">Aucun bankai n&apos;a encore été imaginé pour {m.first}.</p>}
        </section>
        <section className="xc-scene xcm-s4" data-k={4} aria-label="Extension du territoire">
          {m.domaine ? (<>
            <p className="xc-kicker">Ryōiki tenkai · extension du territoire</p>
            <h2 className="xcm-power is-domain">{m.domaine.nom}</h2>
            <p className="xc-sub">« {m.domaine.sens} » · {m.domaine.effet}</p>
          </>) : <p className="xc-sub">Aucun territoire n&apos;a encore été imaginé pour {m.first}.</p>}
        </section>
        <section className="xc-scene xcm-s5" data-k={5} aria-label="Suite">
          <p className="xc-kicker">Prochaine séance</p>
          <div className="xcm-next">
            <TurnLink href={`/explo/c/membre/${next.id}`} kind="xc-ink">{next.name}</TurnLink>
            <TurnLink href={`/explo/c/membre/${prev.id}`} kind="xc-ink" className="is-prev">← {prev.name}</TurnLink>
            <TurnLink href="/explo/c" kind="xc-ink" className="is-prev">Index de la Guilde</TurnLink>
          </div>
        </section>

        <nav className="xc-timeline" aria-label="Scènes">
          <span className="xc-tl-bar" aria-hidden="true"><i /></span>
          {labels.map((l, k) => (
            <button key={l} type="button" className="xc-tl-tick" style={{ left: `${(k / (labels.length - 1)) * 100}%` }} onClick={() => root.current && goScene(root.current, k, labels.length)}>
              <small>{`0${k}:${String(k * 23 % 60).padStart(2, "0")}`}</small><span>{l}</span>
            </button>
          ))}
        </nav>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a className="xc-logo" href="/explo/c" aria-label="Guilde Otaku"><img src="/logo-header.png" alt="" width={40} height={34} /></a>
        <a className="xc-index-btn" href="/explo/c">Index</a>
      </div>
    </div>
  );
}
