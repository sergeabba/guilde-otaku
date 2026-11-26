"use client";

// Prototype H1 « Menu de pause » : l'accueil est une composition, pas une page.
// Plans, du fond vers l'avant : nuit grainée, bande rouge en diagonale, mot géant en contour,
// sceau du grade de l'hôte, silhouette d'écho, personnage détouré (qui chevauche le mot et la
// bande), entrées déstructurées (chacune sa taille, son angle, sa place), bloc date.
// L'entrée choisie fait changer l'hôte : le personnage réagit à la navigation.
// Téléphone : la même scène en pile verticale, entrées pleine largeur au pouce.
import { useState } from "react";
import type { ExploMember } from "../../../lib/explo-data";
import type { V3Entry } from "../../../lib/home-v3";
import Lame from "../guilde/Lame";
import Sceau from "../guilde/Sceau";
import Ransom from "../Ransom";
import { rankRomaji, type Rank } from "../../config/ranks";
import { useFace } from "../../../lib/face";
import FaceToggle from "../FaceToggle";
import "../../styles/pause-menu.css";

// Places des entrées sur ordinateur (x, y en %, taille en rem, angle) : un escalier
// volontairement irrégulier autour du personnage, jamais aligné.
const SLOTS: [number, number, number, number][] = [
  [56, 16, 4.6, -7], [66, 30, 3.3, -4], [52, 41, 2.6, -9], [70, 50, 3.8, -6],
  [58, 62, 2.4, -3], [74, 69, 2.9, -8], [50, 76, 2.2, -5], [66, 84, 2.6, -10],
];

function Host({ m }: { m: ExploMember }) {
  const face = useFace();
  const real = face === "real" && m.real;
  const src = real ? m.real! : m.cut?.src ?? m.anime ?? "";
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` } as React.CSSProperties;
  return (
    <div className={`pm-host${real || !m.cut ? " is-photo" : ""}`} key={`${m.id}-${face}`}>
      {!real && m.cut && <span className="pm-echo" style={mask} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" fetchPriority="high" style={real ? { objectPosition: m.realPos } : undefined} />
    </div>
  );
}

export default function PauseMenu({ members, entries, date, week, count, ranks }: {
  members: ExploMember[]; entries: V3Entry[]; date: { day: string; num: number; month: string }; week: number; count: number; ranks: number;
}) {
  const byId = new Map(members.map((m) => [m.id, m]));
  const [cur, setCur] = useState(0);
  const e = entries[cur];
  const host = byId.get(e.host)!;
  return (
    <section className="pm" style={{ "--pm-acc": host.accent } as React.CSSProperties} aria-label="Accueil de la Guilde">
      <div className="pm-band" aria-hidden="true" />
      <p className="pm-word" aria-hidden="true">Nakama</p>
      <Sceau className="pm-seal" rank={host.rank} text={rankRomaji[host.rank as Rank]} tone="rank" accent={host.accent} size="100%" />
      <Host m={host} />

      {/* Bloc date : repère permanent, toujours au même endroit. */}
      <div className="pm-date">
        <p className="pm-date-num"><span>{date.num}</span><small>{date.month}</small></p>
        <p className="pm-date-day">{date.day}</p>
        <p className="pm-date-hebdo">Hebdo n°{week} · {count} nakama · {ranks} grades</p>
      </div>
      <Ransom text="Guilde Otaku" as="h1" className="pm-title" />
      <div className="pm-face"><FaceToggle /></div>

      <nav className="pm-menu" aria-label="Entrées de la Guilde">
        <ul>
          {entries.map((x, i) => {
            const [l, t, size, rot] = SLOTS[i % SLOTS.length];
            return (
              <li key={x.id} className={i === cur ? "is-on" : ""} style={{ "--x": `${l}%`, "--y": `${t}%`, "--s": `${size}rem`, "--r": `${rot}deg` } as React.CSSProperties}>
                <a href={x.href} onMouseEnter={() => setCur(i)} onFocus={() => setCur(i)} aria-describedby={i === cur ? "pm-why" : undefined}>
                  <Sceau className="pm-item-seal" rubric={x.rubric} tone={i === cur ? "red" : "paper"} size="1.25em" />
                  <Lame tone={i === cur ? "paper" : "ink"} shadow={i === cur ? "red" : "none"} seed={x.id} tilt={0}>{x.label}</Lame>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <p id="pm-why" className="pm-why" aria-live="polite"><span>{e.why}</span><b>{host.name}</b></p>
    </section>
  );
}
