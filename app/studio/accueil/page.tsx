import type { Metadata } from "next";
import Link from "next/link";
import Image from "../../components/GImage";
import StudioNav from "../StudioNav";
import { byRank, coverStar, FR_MONTHS, isoWeek, nextBirthdays, studioMembers } from "../../../lib/studio-data";
import "./accueil.css";

export const metadata: Metadata = { title: "Prototype · L'hebdo de la Guilde | Guilde Otaku" };

// Prototype d'accueil : la Guilde comme un magazine hebdomadaire. La « une » change chaque
// semaine (membre tiré parmi ceux qui ont un portrait anime), puis le défilement raconte la
// Guilde en chapitres : les visages, la hiérarchie, les prochaines bougies.
export default async function StudioAccueil() {
  const all = await studioMembers();
  const now = new Date();
  const { week, year, monday } = isoWeek(now);
  const star = coverStar(all, week, year);
  const births = nextBirthdays(all, now, 3);
  const ranks = byRank(all);
  const countries = new Set(all.map((m) => m.country).filter(Boolean)).size;
  const withAnime = all.filter((m) => m.anime && m.id !== star?.id);
  const faces = Array.from({ length: Math.min(7, withAnime.length) }, (_, i) => withAnime[(week * 5 + i * 7) % withAnime.length]).filter((m, i, a) => a.indexOf(m) === i);
  const issue = `Hebdo n°${week} · semaine du ${monday.getDate()} ${FR_MONTHS[monday.getMonth()]}`;

  return (
    <main className="st r-hebdo ac">
      <StudioNav issue={issue} />

      {/* ── LA UNE ─────────────────────────────────────────────────────────── */}
      <section className="ac-cover st-dots" aria-labelledby="ac-star-name">
        <p className="ac-mast t-logo" aria-label="Guilde Otaku">
          {["GUILDE", "OTAKU"].map((w, wi) => (
            <span key={w} className="ac-mast-w" aria-hidden="true">
              {w.split("").map((c, i) => <span key={i} style={{ "--i": wi * 6 + i } as React.CSSProperties}>{c}</span>)}
            </span>
          ))}
        </p>
        <p className="ac-issue t-ui"><b>N° {week}</b> · {year} · L&apos;hebdo de la Guilde</p>
        <p className="ac-vert t-ui" aria-hidden="true">Shūkan · Girudo · Otaku</p>
        {star?.bankai && (
          <p className="ac-exclu r-kiri">
            <span className="t-ui">Exclusif</span>
            <b className="t-display">Le bankai de {star.first}</b>
            <i className="t-data">{star.bankai.nom}</i>
          </p>
        )}

        {star && (
          <>
            <figure className="ac-star" style={{ "--acc": star.accent } as React.CSSProperties}>
              {star.anime && <Image src={star.anime} alt={`${star.name}, version anime`} fill priority sizes="(max-width: 899px) 92vw, 46vw" style={{ objectFit: "cover", objectPosition: star.animePos }} />}
              {star.real && (
                <figure className="ac-polaroid">
                  <span><Image src={star.real} alt={`${star.name}, photo`} fill sizes="160px" style={{ objectFit: "cover", objectPosition: star.realPos }} /></span>
                  <figcaption className="t-edit">dans la vraie vie</figcaption>
                </figure>
              )}
            </figure>

            <div className="ac-lines">
              <p className="ac-kicker t-ui">En couverture</p>
              <h1 id="ac-star-name" className="t-display ac-name">{star.name}</h1>
              <p className="ac-rank r-dense t-ui" style={{ "--acc": star.accent } as React.CSSProperties}><b>{star.rank}</b><span>{star.romaji}</span></p>
              {star.lede && <p className="ac-quote t-edit">« {star.lede} »</p>}
              <Link className="ac-cta t-ui" href={`/studio/membre/${star.id}`}>Lire son tome <span aria-hidden="true">→</span></Link>
            </div>
          </>
        )}

        <aside className="ac-side" aria-label="Aussi dans ce numéro">
          {births[0] && (
            <Link className="ac-line ac-bday" href={`/studio/membre/${births[0].m.id}`}>
              <span className="ac-bday-face">{births[0].m.anime && <Image src={births[0].m.anime} alt="" fill sizes="64px" style={{ objectFit: "cover", objectPosition: births[0].m.animePos }} />}</span>
              <span>
                <small className="t-ui">Anniversaire</small>
                <b className="t-edit">{births[0].m.first}</b>
                <em className="t-logo">{births[0].days === 0 ? "Aujourd'hui" : births[0].days === 1 ? "Demain" : `J-${births[0].days}`}</em>
              </span>
            </Link>
          )}
          <div className="ac-line ac-count">
            <small className="t-ui">Le registre</small>
            <p><b className="t-logo">{all.length}</b> membres</p>
            <p><b className="t-logo">{ranks.length}</b> grades · <b className="t-logo">{countries}</b> pays</p>
          </div>
          <ol className="ac-line ac-contents">
            <li><a href="#ch-visages"><b>01</b> Les visages</a></li>
            <li><a href="#ch-grades"><b>02</b> La hiérarchie</a></li>
            <li><a href="#ch-bougies"><b>03</b> Les bougies</a></li>
            <li><Link href="/studio/annuaire"><b>04</b> La collection</Link></li>
          </ol>
        </aside>

        <div className="ac-barcode" aria-hidden="true"><i /><span className="t-ui">Gratuit · réservé aux nakama</span></div>
        <a className="ac-scroll t-ui" href="#ch-visages">Ouvrir le numéro</a>
      </section>

      {/* ── CHAPITRE 01 · LES VISAGES ──────────────────────────────────────── */}
      <section id="ch-visages" className="ac-ch ac-faces">
        <header className="st-wrap ac-ch-head">
          <p className="ac-ch-no t-logo">01</p>
          <h2 className="t-display">Les visages</h2>
          <p className="t-edit">Cette semaine, sept nakama sortent du registre. Une case chacun, comme sur une planche.</p>
        </header>
        <div className="st-wrap ac-page">
          {faces.map((m, i) => (
            <Link key={m.id} href={`/studio/membre/${m.id}`} className={`ac-case is-${i}`} style={{ "--acc": m.accent } as React.CSSProperties}>
              {m.anime && <Image src={m.anime} alt="" fill sizes={i === 0 ? "(max-width: 899px) 100vw, 50vw" : "(max-width: 899px) 50vw, 25vw"} style={{ objectFit: "cover", objectPosition: m.animePos }} />}
              <span className="ac-case-cap"><b className="t-display">{m.first}</b><small className="t-ui">{m.rank}</small></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CHAPITRE 02 · LA HIÉRARCHIE ────────────────────────────────────── */}
      <section id="ch-grades" className="ac-ch ac-ranks r-dense">
        <header className="st-wrap ac-ch-head">
          <p className="ac-ch-no t-logo">02</p>
          <h2 className="t-display">La hiérarchie</h2>
          <p className="t-edit">Du Fondateur aux Revenants : chaque grade a son histoire, ses légendes et ses fantômes.</p>
        </header>
        <ol className="st-wrap ac-ladder">
          {ranks.map((g) => (
            <li key={g.rank} style={{ "--acc": g.accent } as React.CSSProperties}>
              <span className="ac-rk-count t-data">{String(g.members.length).padStart(2, "0")}</span>
              <span className="ac-rk-name"><b className="t-display">{g.rank}</b><small className="t-edit">{g.romaji}</small></span>
              <span className="ac-rk-faces">
                {g.members.slice(0, 6).map((m) => (
                  <Link key={m.id} href={`/studio/membre/${m.id}`} title={m.name} aria-label={m.name}>
                    {(m.anime || m.real) && <Image src={(m.anime || m.real)!} alt="" fill sizes="56px" style={{ objectFit: "cover", objectPosition: m.anime ? m.animePos : m.realPos }} />}
                  </Link>
                ))}
                {g.members.length > 6 && <em className="t-ui">+{g.members.length - 6}</em>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CHAPITRE 03 · LES BOUGIES ──────────────────────────────────────── */}
      <section id="ch-bougies" className="ac-ch ac-births">
        <header className="st-wrap ac-ch-head">
          <p className="ac-ch-no t-logo">03</p>
          <h2 className="t-display">Les prochaines bougies</h2>
        </header>
        <div className="st-wrap ac-bdays">
          {births.map(({ m, days }) => (
            <Link key={m.id} href={`/studio/membre/${m.id}`} className="ac-bcard" style={{ "--acc": m.accent } as React.CSSProperties}>
              <span className="ac-bcard-img">{m.anime && <Image src={m.anime} alt="" fill sizes="(max-width: 899px) 80vw, 30vw" style={{ objectFit: "cover", objectPosition: m.animePos }} />}</span>
              <span className="ac-bcard-date t-edit">{m.birthDay} {FR_MONTHS[(m.birthMonth ?? 1) - 1]}</span>
              <b className="t-display">{m.first}</b>
              <span className="ac-bcard-days t-logo">{days === 0 ? "Aujourd'hui !" : days === 1 ? "Demain" : `dans ${days} jours`}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FIN DU NUMÉRO ──────────────────────────────────────────────────── */}
      <section className="ac-end">
        <div className="st-wrap">
          <p className="t-edit">La suite au prochain numéro.</p>
          <p className="t-display ac-end-title">Et toi, quel nakama es-tu ?</p>
          <div className="ac-end-cta">
            <Link className="ac-cta t-ui" href="/studio/annuaire">Ouvrir la collection <span aria-hidden="true">→</span></Link>
            <Link className="ac-cta is-ghost r-kiri t-ui" href="/fighters">Lancer un combat</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
