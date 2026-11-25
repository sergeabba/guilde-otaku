import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploData } from "../../../../../lib/explo-data";
import { parseMemberId } from "../../../../../lib/members-server";
import TurnLink from "../../../TurnLink";
import TabNav from "../../TabNav";
import { Cut, Face, hosts } from "../../parts";
import BankaiA from "./BankaiA";
import "../../a.css";
import "./ma.css";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseMemberId((await params).id);
  const { members } = await exploData();
  const m = members.find((x) => x.id === id);
  if (!m) notFound();
  return { title: `Exploration A · Chapitre ${m.id} : ${m.name} | Guilde Otaku` };
}

// Direction A, un membre : son chapitre. Page d'ouverture (splash), fiche en cases,
// puis la séquence du bankai et de l'extension du territoire, pilotée par le défilement.
export default async function ChapterA({ params }: Props) {
  const id = parseMemberId((await params).id);
  const { members, starId } = await exploData();
  const i = members.findIndex((x) => x.id === id);
  if (i < 0) notFound();
  const m = members[i];
  const prev = members[(i - 1 + members.length) % members.length], next = members[(i + 1) % members.length];
  const star = members.find((x) => x.id === starId) ?? m;
  // Bio découpée en encadrés de narration courts (phrases, puis virgules si une phrase est longue).
  const sentences = (m.bio.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [m.bio]).map((x) => x.trim()).filter(Boolean)
    .flatMap((x) => {
      if (x.length <= 120) return [x];
      const parts: string[] = []; let cur = "";
      for (const bit of x.split(/(?<=,)\s+/)) { if ((cur + " " + bit).trim().length > 110 && cur) { parts.push(cur.trim()); cur = bit; } else cur = `${cur} ${bit}`; }
      if (cur.trim()) parts.push(cur.trim());
      return parts;
    }).slice(0, 3);
  const words = m.name.replace(/["“”]/g, "").replace(/([(\[])\s+/g, "$1").split(/\s+/);
  const total = m.stats ? m.stats.force + m.stats.vitesse + m.stats.technique : 0;

  return (
    <main className="xa xa-m" data-explo={`/explo/a/membre/${m.id}`} style={{ "--acc": m.accent } as React.CSSProperties}>
      <TabNav hosts={hosts(members, star)} />

      {/* ── SPLASH : l'ouverture du chapitre ────────────────────────────────── */}
      <section className="xa-page xa-m1" aria-labelledby="xa-name">
        <div className="xa-panel xa-mk1"><div className="xa-in"><span className="xa-speed" /><span className="xa-tone" /></div></div>
        <div className="xa-m-title">
          <p className="xa-chapter">Chapitre {String(m.id).padStart(2, "0")}</p>
          <h1 id="xa-name" className="xa-m-name">{words.map((w, k) => <span key={k} style={{ "--k": k } as React.CSSProperties}>{w}</span>)}</h1>
          {m.alias && <p className="xa-box xa-alias">« {m.alias} »</p>}
          <p className="xa-box xa-m-facts">{[m.country, m.birthday ? `né le ${m.birthday}` : null, m.series ? `d'après ${m.series}` : null].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="xa-m-hero"><Cut m={m} className="xa-cut xa-inked" priority /></div>
        {sentences.map((s, k) => <p key={k} className={`xa-box xa-narr xa-n${k}`}>{s}</p>)}
        <p className="xa-hanko xa-m-hanko"><span>{m.rank}<br />{m.romaji}</span></p>
        <p className="xa-sfx xa-sfx-m" aria-hidden="true"><span>GO</span><span>GO</span><span>GO</span></p>
        <span className="xa-folio" aria-hidden="true">p. 1</span>
      </section>

      {/* ── FICHE : cases de la fiche technique ─────────────────────────────── */}
      <section className="xa-page xa-m2" aria-label="Fiche technique">
        {m.stats && (
          <div className="xa-panel xa-sk1"><div className="xa-in">
            <p className="xa-box xa-sk-cap">Puissance totale : {total}</p>
            <dl className="xa-brush">
              {(["force", "vitesse", "technique"] as const).map((k) => (
                <div key={k} style={{ "--v": m.stats![k] } as React.CSSProperties}><dt>{k}</dt><dd><svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M1 7 C 20 2, 40 10, 60 5 S 90 8, 99 6" pathLength={100} strokeDasharray={`${m.stats![k]} 100`} /></svg><b>{m.stats![k]}</b></dd></div>
              ))}
            </dl>
          </div></div>
        )}
        {m.special && (
          <div className="xa-panel xa-sk2"><div className="xa-in"><span className="xa-speed" style={{ "--sx": "0%", "--sy": "50%" } as React.CSSProperties} />
            <p className="xa-box">Attaque spéciale</p>
            <p className="xa-move">{m.special.name}</p>
            {m.special.effect && <p className="xa-move-fx">{m.special.effect}</p>}
          </div></div>
        )}
        <div className="xa-panel xa-sk3"><div className="xa-in"><Face m={m} zoom={2.4} /></div></div>
        {m.works.length > 0 && (
          <div className="xa-shelf" aria-label="Ses séries préférées">
            {m.works.slice(0, 5).map((w, k) => (
              <span key={k} className="xa-work" style={{ "--r": `${(k % 2 ? 1 : -1) * (3 + k)}deg` } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.cover && <img src={w.cover} alt="" loading="lazy" />}
                <b>{w.title}</b>
              </span>
            ))}
          </div>
        )}
        {m.awards.length > 0 && <p className="xa-box xa-awards">Palmarès : {m.awards.map((a) => a.title).join(" · ")}</p>}
        <span className="xa-folio" aria-hidden="true">p. 2</span>
      </section>

      {(m.bankai || m.domaine) && <BankaiA m={m} />}

      {/* ── FIN DU CHAPITRE ─────────────────────────────────────────────────── */}
      <section className="xa-page xa-m-end" aria-label="Autres chapitres">
        <p className="xa-tbc">Fin du chapitre {m.id}. À suivre…</p>
        <div className="xa-m-next">
          {[prev, next].map((n, k) => (
            <TurnLink key={n.id} href={`/explo/a/membre/${n.id}`} kind="xa-turn" className={`xa-nextk ${k ? "is-next" : "is-prev"}`} label={`${k ? "Chapitre suivant" : "Chapitre précédent"} : ${n.name}`}>
              <span className="xa-in"><Face m={n} zoom={1.8} /></span>
              <span className="xa-tag"><small>{k ? "Chapitre suivant" : "Chapitre précédent"}</small><b>{n.first}</b></span>
            </TurnLink>
          ))}
        </div>
        <TurnLink href="/explo/a" kind="xa-turn" className="xa-turnpage xa-back">Retour au chapitre de la semaine</TurnLink>
      </section>
    </main>
  );
}
