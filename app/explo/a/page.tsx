import type { Metadata } from "next";
import { exploData, type ExploMember } from "../../../lib/explo-data";
import TurnLink from "../TurnLink";
import TabNav from "./TabNav";
import FaceToggle from "../../components/FaceToggle";
import { Cut, Face, hosts } from "./parts";
import "./a.css";

export const metadata: Metadata = { title: "Exploration A · La planche vivante | Guilde Otaku" };

// DIRECTION A · « La planche vivante » : le manga comme langage même de l'interface.
// La page est une suite de planches : cases diagonales, gouttières blanches, personnages
// détourés qui débordent des cases, onomatopées, bulles et encadrés de narration.
// Navigation : les onglets de tranche d'un livre (ordinateur), un marque-page (téléphone).
export default async function ExploA() {
  const { members, starId, week } = await exploData();
  const cast = members.filter((m) => m.cut);
  const star = cast.find((m) => m.id === starId) ?? cast[0];
  const pick = (k: number) => cast[(week * 7 + k * 11) % cast.length];
  const faces = [1, 2, 3].map(pick).filter((m) => m.id !== star.id);
  const page2 = Array.from(new Set([4, 5, 6, 7, 8, 9, 10].map(pick))).filter((m) => m.id !== star.id).slice(0, 6);
  const ranks = Array.from(new Set(members.map((m) => m.rank))).map((r) => ({ rank: r, ms: members.filter((m) => m.rank === r) }));

  return (
    <main className="xa" data-explo="/explo/a">
      <TabNav hosts={hosts(members, star)} />
      <div className="xa-facebtn"><FaceToggle /></div>

      {/* ── PLANCHE 1 : l'ouverture du chapitre ─────────────────────────────── */}
      <section className="xa-page xa-p1" aria-labelledby="xa-title">
        <div className="xa-panel xa-k1"><div className="xa-in"><span className="xa-speed" /><span className="xa-tone" /></div></div>
        <div className="xa-panel xa-k2"><div className="xa-in">
          <p className="xa-chapter">Chapitre {week}</p>
          <h1 id="xa-title" className="xa-mast"><span>Guilde</span><span>Otaku</span></h1>
          <p className="xa-since">Depuis 2020 · {members.length} nakama</p>
        </div></div>
        <div className="xa-panel xa-k3"><div className="xa-in">
          <p className="xa-box">Cette semaine, {star.first} ouvre le chapitre.</p>
        </div></div>
        {faces.map((m, i) => (
          <TurnLink key={m.id} href={`/explo/a/membre/${m.id}`} kind="xa-turn" className={`xa-panel xa-eye xa-e${i}`} label={m.name}>
            <span className="xa-in"><Face m={m} zoom={2.6} /></span><span className="xa-eye-name">{m.first}</span>
          </TurnLink>
        ))}
        <TurnLink href={`/explo/a/membre/${star.id}`} kind="xa-turn" className="xa-hero" label={`Lire le chapitre de ${star.name}`} morph=".xa-cut">
          <Cut m={star} className="xa-cut xa-inked" priority />
        </TurnLink>
        <p className="xa-sfx xa-sfx-1" aria-hidden="true"><span>DO</span><span>OO</span><span>N</span><b>!!</b></p>
        {star.lede && <p className="xa-balloon"><span>{star.lede}</span></p>}
        <p className="xa-hanko" aria-hidden="true"><span>{star.rank}</span></p>
        <a className="xa-turnpage" href="#nakama">Tourner la page <span aria-hidden="true">↓</span></a>
        <span className="xa-folio" aria-hidden="true">p. 1</span>
      </section>

      {/* ── PLANCHE 2 : les nakama, une case chacun, qui débordent ─────────── */}
      <section id="nakama" className="xa-page xa-p2" aria-label="Les nakama de la semaine">
        <p className="xa-box xa-box-top">Pendant ce temps, dans la Guilde…</p>
        {page2.map((m, i) => (
          <TurnLink key={m.id} href={`/explo/a/membre/${m.id}`} kind="xa-turn" className={`xa-cast xa-c${i}`} style={{ "--acc": m.accent } as React.CSSProperties} label={`${m.name}, ${m.rank}`} morph=".xa-cut">
            <span className="xa-cast-bg"><span className="xa-in"><span className="xa-speed" /><span className="xa-tone" /></span></span>
            <Cut m={m} className="xa-cut xa-inked" eager />
            <span className="xa-tag"><b>{m.first}</b><small>{m.rank}</small></span>
          </TurnLink>
        ))}
        <p className="xa-sfx xa-sfx-2" aria-hidden="true"><span>ZA</span><span>WA</span><b>…</b></p>
        <span className="xa-folio" aria-hidden="true">p. 2</span>
      </section>

      {/* ── PLANCHE 3 : le sommaire des grades, en colonnes verticales ─────── */}
      <section className="xa-page xa-p3" aria-labelledby="xa-ranks">
        <h2 id="xa-ranks" className="xa-p3-title">Sommaire des grades</h2>
        <ol className="xa-cols">
          {ranks.map(({ rank, ms }) => (
            <li key={rank} style={{ "--acc": ms[0].accent } as React.CSSProperties}>
              <b className="xa-col-name">{rank}</b>
              <span className="xa-col-count">{ms.length}</span>
              <span className="xa-col-heads">
                {ms.filter((m) => m.cut).slice(0, 4).map((m) => (
                  <TurnLink key={m.id} href={`/explo/a/membre/${m.id}`} kind="xa-turn" className="xa-head" label={m.name}><Face m={m} zoom={2.2} /></TurnLink>
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="xa-tbc" aria-hidden="true">À suivre…</p>
        <span className="xa-folio" aria-hidden="true">p. 3</span>
      </section>
    </main>
  );
}

export type { ExploMember };
