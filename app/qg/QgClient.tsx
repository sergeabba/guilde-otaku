"use client";

// Le Quartier général : la tour de la Guilde en coupe, du toit à l'atelier du sous-sol.
// On la descend en faisant défiler la page (parcours vertical naturel) ; chaque étage
// s'éclaire en entrant à l'écran et mène à sa rubrique. Un ascenseur (ordinateur) ou un
// afficheur d'étage (téléphone) indique où l'on est. Les occupants, affiches et
// couvertures sont ceux de la Guilde (données réelles).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { optimizedSrc } from "../../lib/img";
import { formatBounty } from "../../lib/wanted";
import { RoomArt, type RoomKind } from "./rooms";
import "./qg.css";

export interface QgPerson { id: number; name: string; rank: string; color: string; cut: { src: string; w: number; h: number } | null; anime: string | null }
export interface QgData {
  total: number;
  ranks: { rank: string; count: number; color: string; logo: string; romaji: string }[];
  founder: QgPerson | null;
  court: QgPerson[];
  wanted: (QgPerson & { prime: number })[];
  birthday: (QgPerson & { day: number; month: number; days: number }) | null;
  film: { title: string; synopsis: string | null; image: string | null } | null;
  chronique: { title: string; cover: string; season: string | null; count: number } | null;
  covers: string[];
  teams: number | null;
  atelier: string[];
  plans: number;
  games: number;
  gamers: QgPerson[];
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Un occupant de la salle : son détourage s'il existe, sinon son portrait dans un médaillon. */
function Occupant({ p, style, className = "" }: { p: QgPerson; style: React.CSSProperties; className?: string }) {
  const src = p.cut?.src ?? p.anime;
  if (!src) return null;
  return (
    <Link href={`/membres/${p.id}`} className={`qg-occ${p.cut ? "" : " is-framed"} ${className}`} style={{ ...style, "--c": p.color } as React.CSSProperties} aria-label={`${p.name}, ${p.rank} : voir sa fiche`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedSrc(src, 640) ?? src} alt="" loading="lazy" decoding="async" />
      <span className="qg-occ-name">{p.name}</span>
    </Link>
  );
}

/** Image posée dans le décor (écran, cadre, toile, couverture), à une position du plan. */
function Inset({ src, box, className = "", children }: { src?: string | null; box: [number, number, number, number]; className?: string; children?: React.ReactNode }) {
  const [x, y, w, h] = box;
  return (
    <span className={`qg-inset ${className}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={optimizedSrc(src, 828) ?? src} alt="" loading="lazy" decoding="async" />}
      {children}
    </span>
  );
}

interface Floor { id: string; no: string; kind: RoomKind; name: string; romaji: string; href: string; cta: string; lines: React.ReactNode[]; light: [number, number]; scene: React.ReactNode }

export default function QgClient({ data }: { data: QgData }) {
  const [current, setCurrent] = useState("toit");
  const [dark, setDark] = useState(false);
  const moonTaps = useRef(0);
  const bday = data.birthday;

  const floors: Floor[] = [
    {
      id: "toit", no: "R", kind: "toit", name: "Le Toit", romaji: "Okujō", href: "/calendrier", cta: "Voir les sorties de la semaine", light: [72, 28],
      lines: [<>La nuit sur la ville. D&apos;ici, on guette les sorties de la semaine.</>, <>{data.total} membres dorment (ou pas) dans la tour.</>],
      scene: (
        <>
          <button type="button" className="qg-neon" onClick={() => { moonTaps.current += 1; if (moonTaps.current >= 7) { moonTaps.current = 0; setDark((v) => !v); } }} aria-label="Enseigne de la Guilde">
            <span>Guilde</span><span>Otaku</span>
          </button>
        </>
      ),
    },
    {
      id: "trone", no: "6", kind: "trone", name: "La Salle du Trône", romaji: "Gyokuza no ma", href: "/#annuaire", cta: "Ouvrir l'annuaire", light: [50, 30],
      lines: [<>Neuf bannières, une par grade, de la plus haute à la plus discrète.</>, <>{data.ranks.map((r) => `${r.count} ${r.rank}`).join(" · ")}</>],
      scene: (
        <>
          {data.founder && <Occupant p={data.founder} className="is-throne" style={{ left: "50%", bottom: "26%", height: "58%" }} />}
          {data.court.slice(0, 4).map((p, i) => <Occupant key={p.id} p={p} className="is-court" style={{ left: `${[16, 29, 71, 84][i]}%`, bottom: "4%", height: "42%" }} />)}
        </>
      ),
    },
    {
      id: "musee", no: "5", kind: "musee", name: "Le Musée", romaji: "Hakubutsukan", href: "/wanted", cta: "Voir le classement des primes", light: [50, 18],
      lines: data.wanted.length ? [<>La plus grosse prime de la Guilde, exposée sous verre.</>, <>{data.wanted.map((w, i) => `${i + 1}. ${w.name}`).join(" · ")}</>] : [<>Les vitrines attendent leurs records.</>],
      scene: (
        <>
          {data.wanted[0] && <Inset src={data.wanted[0].cut ? null : data.wanted[0].anime} box={[36.9, 15.6, 26.2, 45.4]} className="is-frame">{data.wanted[0].cut && /* eslint-disable-next-line @next/next/no-img-element */ <img className="is-cut" src={optimizedSrc(data.wanted[0].cut.src, 640)} alt="" loading="lazy" />}</Inset>}
          {data.wanted[1] && <Inset src={data.wanted[1].anime} box={[10.4, 21.8, 14.2, 30.9]} className="is-frame" />}
          {data.wanted[2] && <Inset src={data.wanted[2].anime} box={[75.4, 21.8, 14.2, 30.9]} className="is-frame" />}
          {data.wanted[0] && <span className="qg-plaque" style={{ left: "43.1%", top: "65.6%", width: "13.8%", height: "4.9%" }}>฿ {formatBounty(data.wanted[0].prime)}</span>}
        </>
      ),
    },
    {
      id: "cinema", no: "4", kind: "cinema", name: "La Salle de projection", romaji: "Gekijō", href: data.film ? "/film-semaine" : "/cinema", cta: data.film ? "Le film de la semaine" : "Entrer au Cinéma", light: [50, 40],
      lines: data.film ? [<>Ce soir à l&apos;écran : <b>{data.film.title}</b>, le film élu de la semaine.</>] : [<>Aucun film élu en ce moment : l&apos;écran attend la prochaine séance.</>],
      scene: (
        <Inset src={data.film?.image} box={[20.6, 12.2, 58.8, 52.2]} className="is-screen">
          <span className="qg-screen-title">{data.film ? data.film.title : "Relâche"}</span>
        </Inset>
      ),
    },
    {
      id: "biblio", no: "3", kind: "biblio", name: "La Bibliothèque", romaji: "Toshokan", href: "/bibliotheque", cta: "Lire la Chronique du Bash", light: [89, 25],
      lines: data.chronique ? [<>À la une de la Chronique{data.chronique.season ? ` (${data.chronique.season})` : ""} : <b>{data.chronique.title}</b>.</>, <>{data.chronique.count} chroniques sur les rayons.</>] : [<>Les rayons de la Chronique du Bash.</>],
      scene: data.chronique ? <Inset src={data.chronique.cover} box={[79.4, 52, 11.2, 28.5]} className="is-book" /> : null,
    },
    {
      id: "arcade", no: "2", kind: "arcade", name: "La Salle d'arcade", romaji: "Gēmusen", href: "/jeux", cta: "Choisir une borne", light: [50, 22],
      lines: [<>{data.games} bornes, une identité chacune : quiz, blind tests, duels de goûts.</>, <>Les meilleures techniques de la Guilde y ont leurs habitudes : {data.gamers.map((g) => g.name).join(", ")}.</>],
      scene: <>{data.gamers.map((p, i) => <Occupant key={p.id} p={p} className="is-player" style={{ left: `${[22, 50, 78][i]}%`, bottom: "0%", height: "50%" }} />)}</>,
    },
    {
      id: "fete", no: "1", kind: "fete", name: "La Salle des fêtes", romaji: "Shukuga no ma", href: "/birthdays", cta: "Le calendrier des anniversaires", light: [50, 42],
      lines: bday ? [<>{bday.days === 0 ? <>Aujourd&apos;hui, on fête <b>{bday.name}</b> !</> : <>Prochaine fête : <b>{bday.name}</b>, le {bday.day} {MONTHS[bday.month - 1]}, dans {bday.days} jour{bday.days > 1 ? "s" : ""}.</>}</>] : [<>Les anniversaires de la Guilde.</>],
      scene: bday ? <Occupant p={bday} className="is-guest" style={{ left: "26%", bottom: "12%", height: "62%" }} /> : null,
    },
    {
      id: "vestiaire", no: "0", kind: "vestiaire", name: "Le Vestiaire", romaji: "Kōishitsu", href: "/teams", cta: "Voir les équipes", light: [50, 10],
      lines: [data.teams === null ? <>Les casiers des équipes de la Guilde (compositions publiées dans Teams).</> : <>{data.teams} équipe{data.teams > 1 ? "s" : ""} publiée{data.teams > 1 ? "s" : ""} : les casiers sont prêts.</>],
      scene: null,
    },
    {
      id: "atelier", no: "-1", kind: "atelier", name: "L'Atelier", romaji: "Kōbō", href: "/atelier", cta: "Visiter les Futilités", light: [44, 14],
      lines: [<>Au sous-sol, les créations de la Guilde sèchent sur le chevalet.</>, <>{data.plans} bons plans punaisés au liège (<Link href="/bons-plans">les consulter</Link>).</>],
      scene: <Inset src={data.atelier[0]} box={[31.25, 25.6, 25, 35.5]} className="is-canvas">{!data.atelier[0] && <span className="qg-blank">Toile blanche</span>}</Inset>,
    },
  ];

  // Étages éclairés en entrant à l'écran ; étage courant pour l'ascenseur.
  useEffect(() => {
    const rooms = [...document.querySelectorAll<HTMLElement>(".qg-floor")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-lit"); }
        if (e.intersectionRatio > 0.5) setCurrent((e.target as HTMLElement).dataset.floor ?? "toit");
      }
    }, { threshold: [0, 0.25, 0.5, 0.75] });
    rooms.forEach((r) => { if (reduce) r.classList.add("is-lit"); io.observe(r); });
    return () => io.disconnect();
  }, []);

  // Easter egg : le code Konami (ou sept touches sur l'enseigne) plonge la tour dans l'heure sombre.
  useEffect(() => {
    const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    const onKey = (e: KeyboardEvent) => { i = e.key === code[i] ? i + 1 : e.key === code[0] ? 1 : 0; if (i === code.length) { i = 0; setDark((v) => !v); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cur = floors.find((f) => f.id === current) ?? floors[0];
  return (
    <div className={`gk-page tone-dark qg${dark ? " is-dark" : ""}`}>
      <GuildeHeader activePage="qg" tone="dark" accentColor="#e9c46a" />
      <main>
        <header className="qg-head">
          <p className="qg-kicker">Honbu · le repaire de la Guilde</p>
          <h1 className="qg-title"><span>Le Quartier</span> <span>général</span></h1>
          <p className="qg-lede">Neuf étages, du toit à l&apos;atelier. Descends : chaque salle s&apos;allume à ton passage et mène à sa rubrique.</p>
          {dark && <p className="qg-dark-note" role="status">L&apos;heure sombre. La tour attend que minuit passe.</p>}
        </header>

        <div className="qg-tower">
          {floors.map((f) => (
            <section key={f.id} id={`qg-${f.id}`} data-floor={f.id} className={`qg-floor k-${f.kind}`} aria-labelledby={`qg-${f.id}-t`}
              style={{ "--lx": `${f.light[0]}%`, "--ly": `${f.light[1]}%` } as React.CSSProperties}>
              <div className="qg-plate">
                <span className="qg-no" aria-hidden="true">{f.no}</span>
                <h2 id={`qg-${f.id}-t`}><span className="gk-sr">Étage {f.no} : </span>{f.name}</h2>
                <i>{f.romaji}</i>
              </div>
              <div className="qg-room">
                <div className="qg-stage">
                  <RoomArt kind={f.kind} ranks={data.ranks} color={bday?.color ?? "#c9a84c"} teams={data.teams} />
                  <span className="qg-glow" aria-hidden="true" />
                  {f.scene}
                  <span className="qg-dim" aria-hidden="true" />
                </div>
              </div>
              <div className="qg-log">
                {f.lines.map((l, i) => <p key={i}>{l}</p>)}
                <Link className="qg-cta" href={f.href}>{f.cta} <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </section>
          ))}
          <p className="qg-ground" aria-hidden="true">Fondations · depuis 2020</p>
        </div>
      </main>

      {/* Ascenseur : ordinateur (colonne d'étages) et téléphone (afficheur). */}
      <nav className="qg-lift" aria-label="Ascenseur : aller à un étage">
        {floors.map((f) => (
          <a key={f.id} href={`#qg-${f.id}`} aria-current={current === f.id ? "location" : undefined}>
            <b>{f.no}</b><span>{f.name}</span>
          </a>
        ))}
      </nav>
      <p className="qg-lcd" aria-hidden="true"><b>{cur.no}</b><span>{cur.name}</span></p>
    </div>
  );
}
