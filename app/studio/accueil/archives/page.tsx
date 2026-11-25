import type { Metadata } from "next";
import Link from "next/link";
import Image from "../../../components/GImage";
import StudioNav from "../../StudioNav";
import { FR_MONTHS, isoWeek, studioMembers } from "../../../../lib/studio-data";
import { hebdoArchive, hebdoIssue } from "../../../../lib/hebdo";
import "../accueil.css";

export const metadata: Metadata = { title: "Prototype · Les anciens numéros | Guilde Otaku" };

const LABEL = { prestige: "Prestige", shonen: "Shōnen", seinen: "Seinen", anniversaire: "Anniversaire" } as const;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Les anciennes unes, rangées comme une pile de magazines. Elles sont reconstituées avec la
// règle de tirage actuelle : pour figer l'historique, chaque une devra être enregistrée.
export default async function Archives() {
  const all = await studioMembers();
  const now = new Date();
  const issues = [hebdoIssue(all, now), ...hebdoArchive(all, now, 15)];
  const { week, monday } = isoWeek(now);
  return (
    <main className="st r-hebdo ac ac-arch">
      <StudioNav issue={`Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`} />
      <header className="st-wrap ac-arch-head">
        <p className="t-ui ac-kicker">Archives</p>
        <h1 className="t-display">Les anciens numéros</h1>
        <p className="t-edit">Chaque semaine, une une. Les éditions anniversaire et les numéros collector sont signalés.</p>
      </header>
      <ol className="st-wrap ac-stack">
        {issues.map((is, i) => {
          const m = is.star;
          const img = m?.anime ?? m?.real;
          return (
            <li key={`${is.year}-${is.week}`} className={`ac-mini ed-${is.kind}`} style={{ "--acc": m?.accent ?? "#c9a84c", "--r": `${((is.week * 7) % 5) - 2}deg` } as React.CSSProperties}>
              <Link href={i === 0 ? "/studio/accueil" : `/studio/accueil?semaine=${iso(is.monday)}`} aria-label={`Numéro ${is.week} de ${is.year}${m ? `, ${m.name} en couverture` : ""}`}>
                <span className="ac-mini-img">{img && <Image src={img} alt="" fill sizes="(max-width: 899px) 46vw, 240px" style={{ objectFit: "cover", objectPosition: m?.anime ? m.animePos : m?.realPos }} />}</span>
                <span className="ac-mini-mast t-logo">GUILDE OTAKU</span>
                <span className="ac-mini-no t-ui">N°{is.week} · {LABEL[is.kind]}</span>
                {is.collector && <span className="ac-mini-collector t-ui">Collector</span>}
                <b className="ac-mini-name t-display">{m?.first ?? ""}</b>
                <small className="ac-mini-date t-edit">{i === 0 ? "Cette semaine" : `Semaine du ${is.monday.getDate()} ${FR_MONTHS[is.monday.getMonth()]}`}</small>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="st-wrap ac-arch-note t-edit">Ces unes sont reconstituées avec la règle de tirage actuelle. Si un membre rejoint ou quitte la Guilde, d&apos;anciennes couvertures peuvent changer : pour un historique figé, il faudra enregistrer chaque une en base (proposition, rien n&apos;est créé pour l&apos;instant).</p>
    </main>
  );
}
