import type { Metadata } from "next";
import Link from "next/link";
import Image from "../../components/GImage";
import StudioNav from "../StudioNav";
import SongOfTheDay from "../../components/SongOfTheDay";
import FilmPoll from "../../components/FilmPoll";
import { byRank, FR_MONTHS, nextBirthdays, studioMembers, type StudioMember } from "../../../lib/studio-data";
import { fetchFeaturedFilm, hebdoIssue, type HebdoIssue } from "../../../lib/hebdo";
import { getAnimeSong, todayIndex } from "../../../lib/anime-song";
import { getAtelierTiles } from "../../../lib/atelier-server";
import "./accueil.css";

export const metadata: Metadata = { title: "Prototype · L'hebdo de la Guilde | Guilde Otaku" };

const EDITION_LABEL: Record<HebdoIssue["kind"], string> = { prestige: "Édition prestige", shonen: "Hebdo shōnen", seinen: "Collection seinen", anniversaire: "Spécial anniversaire" };

/** ?semaine=AAAA-MM-JJ : feuilleter un autre numéro (archives). */
function issueDate(v?: string): Date {
  const m = v && /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return new Date();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) || d > new Date() ? new Date() : d;
}

// Prototype d'accueil : la Guilde comme un magazine hebdomadaire. La « une » change chaque
// semaine : édition anniversaire si un membre fête son anniversaire, sinon un membre tiré,
// dans l'édition de son grade. La disposition des chapitres change d'un numéro à l'autre.
export default async function StudioAccueil({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const date = issueDate((await searchParams).semaine);
  const past = date.toDateString() !== new Date().toDateString();
  const [all, film, song, tiles] = await Promise.all([
    studioMembers(), fetchFeaturedFilm(), getAnimeSong(todayIndex()).catch(() => null), getAtelierTiles().catch(() => []),
  ]);
  const is = hebdoIssue(all, date);
  const star = is.star;
  const births = nextBirthdays(all, date, 3);
  const ranks = byRank(all);
  const countries = new Set(all.map((m) => m.country).filter(Boolean)).size;
  const withAnime = all.filter((m) => m.anime && m.id !== star?.id);
  const faces = Array.from({ length: Math.min(7, withAnime.length) }, (_, i) => withAnime[(is.week * 5 + i * 7) % withAnime.length]).filter((m, i, a) => a.indexOf(m) === i);
  const issue = `Hebdo n°${is.week} · semaine du ${is.monday.getDate()} ${FR_MONTHS[is.monday.getMonth()]}`;
  const anniv = is.kind === "anniversaire";

  const chapters = [
    { id: "ch-une", title: "À la une" },
    { id: "ch-visages", title: "Les visages" },
    { id: "ch-grades", title: "La hiérarchie" },
    { id: "ch-bougies", title: "Les bougies" },
  ];
  // Numéro anniversaire : les bougies passent en tête.
  if (anniv) chapters.splice(0, 0, chapters.splice(3, 1)[0]);

  return (
    <main className={`st r-hebdo ac is-layout-${is.layout}`}>
      <StudioNav issue={issue} />
      {past && <p className="ac-archive-bar t-ui">Ancien numéro · <Link href="/studio/accueil">revenir au numéro de la semaine</Link></p>}

      {/* ── LA UNE ─────────────────────────────────────────────────────────── */}
      <section className={`ac-cover st-dots ed-${is.kind}${star?.mirror ? " is-mirror" : ""}`} aria-labelledby="ac-star-name" style={{ "--acc": star?.accent ?? "#c9a84c" } as React.CSSProperties}>
        <p className="ac-mast t-logo"><span className="st-sr">Guilde Otaku</span>
          {["GUILDE", "OTAKU"].map((w, wi) => (
            <span key={w} className="ac-mast-w" aria-hidden="true">
              {w.split("").map((c, i) => <span key={i} style={{ "--i": wi * 6 + i } as React.CSSProperties}>{c}</span>)}
            </span>
          ))}
        </p>
        <p className="ac-issue t-ui"><b>N° {is.week}</b> · {is.year} · {EDITION_LABEL[is.kind]}{is.collector && <em className="ac-collector">Numéro collector</em>}</p>
        <p className="ac-vert t-ui" aria-hidden="true">Shūkan · Girudo · Otaku</p>
        {anniv && is.birthday && star ? (
          <p className="ac-exclu ac-ribbon">
            <span className="t-ui">Joyeux anniversaire</span>
            <b className="t-display">{star.first}</b>
            <i className="t-edit">le {is.birthday.getDate()} {FR_MONTHS[is.birthday.getMonth()]}</i>
          </p>
        ) : star?.bankai && (
          <p className="ac-exclu r-kiri">
            <span className="t-ui">Exclusif</span>
            <b className="t-display">Le bankai de {star.first}</b>
            <i className="t-data">{star.bankai.nom}</i>
          </p>
        )}
        {anniv && <span className="ac-confetti" aria-hidden="true" />}

        {star && <Star m={star} />}
        {star && (
          <div className="ac-lines">
            <p className="ac-kicker t-ui">{anniv ? "La une de son anniversaire" : "En couverture"}</p>
            <h1 id="ac-star-name" className="t-display ac-name" style={{ "--len": Math.max(...star.name.split(/\s+/).map((w) => w.length)) } as React.CSSProperties}>{star.name.replace(/([(\[])\s+/g, "$1").replace(/\s+([)\]])/g, "$1")}</h1>
            <p className="ac-rank r-dense t-ui"><b>{star.rank}</b><span>{star.romaji}</span></p>
            {star.lede && <p className="ac-quote t-edit">« {star.lede} »</p>}
            <Link className="ac-cta t-ui m-press" href={`/studio/membre/${star.id}`}>Lire son tome <span aria-hidden="true">→</span></Link>
          </div>
        )}

        <aside className="ac-side" aria-label="Aussi dans ce numéro">
          {film && (
            <a className="ac-line ac-film" href="#ch-une">
              <small className="t-ui">Film de la semaine</small>
              <b className="t-edit">{film.title}</b>
            </a>
          )}
          {births[0] && !anniv && (
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
            {chapters.map((c, i) => <li key={c.id}><a href={`#${c.id}`}><b>{String(i + 1).padStart(2, "0")}</b> {c.title}</a></li>)}
            <li><Link href="/studio/accueil/archives"><b>{String(chapters.length + 1).padStart(2, "0")}</b> Les anciens numéros</Link></li>
          </ol>
        </aside>

        <div className="ac-barcode" aria-hidden="true"><i /><span className="t-ui">Gratuit · réservé aux nakama</span></div>
        <a className="ac-scroll t-ui" href={`#${chapters[0].id}`}>Ouvrir le numéro</a>
      </section>

      {chapters.map((c, i) => {
        const n = String(i + 1).padStart(2, "0");
        if (c.id === "ch-une") return (
          <section key={c.id} id="ch-une" className="ac-ch ac-une">
            <header className="st-wrap ac-ch-head">
              <p className="ac-ch-no t-logo">{n}</p>
              <h2 className="t-display">À la une</h2>
              <p className="t-edit">Ce qui se passe dans la Guilde cette semaine.</p>
            </header>
            <div className="st-wrap ac-une-grid">
              {film && (
                <Link href="/film-semaine" className="ac-film-card">
                  <span className="ac-film-img">{film.image && <Image src={film.image} alt="" fill sizes="(max-width: 899px) 100vw, 640px" style={{ objectFit: "cover" }} />}</span>
                  <span className="ac-film-txt"><small className="t-ui">Film de la semaine</small><b className="t-display">{film.title}</b>{film.synopsis && <span className="t-edit">{film.synopsis.slice(0, 180)}{film.synopsis.length > 180 ? "…" : ""}</span>}</span>
                </Link>
              )}
              <div className="ac-poll"><FilmPoll compact frame="ac-poll-frame" /></div>
              {tiles.length > 0 && (
                <Link href="/atelier" className="ac-atelier">
                  <span className="ac-atelier-strip" aria-hidden="true">
                    {tiles.slice(0, 5).map((t, k) => <span key={k}>{t.src && <Image src={t.src} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />}</span>)}
                  </span>
                  <span><small className="t-ui">Les futilités</small><b className="t-display">L&apos;atelier de la Guilde</b></span>
                </Link>
              )}
            </div>
            {song && <div className="ac-gen"><SongOfTheDay initial={song} today /></div>}
          </section>
        );
        if (c.id === "ch-visages") return (
          <section key={c.id} id="ch-visages" className="ac-ch ac-faces">
            <header className="st-wrap ac-ch-head">
              <p className="ac-ch-no t-logo">{n}</p>
              <h2 className="t-display">Les visages</h2>
              <p className="t-edit">Cette semaine, sept nakama sortent du registre. Une case chacun, comme sur une planche.</p>
            </header>
            <div className="st-wrap ac-page">
              {faces.map((m, k) => (
                <Link key={m.id} href={`/studio/membre/${m.id}`} className={`ac-case is-${k}`} style={{ "--acc": m.accent } as React.CSSProperties}>
                  {m.anime && <Image src={m.anime} alt="" fill sizes={k === 0 ? "(max-width: 899px) 100vw, 50vw" : "(max-width: 899px) 50vw, 25vw"} style={{ objectFit: "cover", objectPosition: m.animePos }} />}
                  <span className="ac-case-cap"><b className="t-display">{m.first}</b><small className="t-ui">{m.rank}</small></span>
                </Link>
              ))}
            </div>
          </section>
        );
        if (c.id === "ch-grades") return (
          <section key={c.id} id="ch-grades" className="ac-ch ac-ranks r-dense">
            <header className="st-wrap ac-ch-head">
              <p className="ac-ch-no t-logo">{n}</p>
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
        );
        return (
          <section key={c.id} id="ch-bougies" className={`ac-ch ac-births${anniv ? " is-fete" : ""}`}>
            <header className="st-wrap ac-ch-head">
              <p className="ac-ch-no t-logo">{n}</p>
              <h2 className="t-display">{anniv ? "On souffle les bougies" : "Les prochaines bougies"}</h2>
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
            <p className="st-wrap ac-more"><Link href="/birthdays" className="t-ui">Tout le calendrier des anniversaires →</Link></p>
          </section>
        );
      })}

      {/* ── FIN DU NUMÉRO ──────────────────────────────────────────────────── */}
      <section className="ac-end">
        <div className="st-wrap">
          <p className="t-edit">La suite au prochain numéro.</p>
          <p className="t-display ac-end-title">Et toi, quel nakama es-tu ?</p>
          <div className="ac-end-cta">
            <Link className="ac-cta t-ui m-press" href="/studio/annuaire">Ouvrir la collection <span aria-hidden="true">→</span></Link>
            <Link className="ac-cta is-ghost t-ui m-press" href="/studio/accueil/archives">Les anciens numéros</Link>
            <Link className="ac-cta is-ghost r-kiri t-ui m-press" href="/fighters">Lancer un combat</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Star({ m }: { m: StudioMember }) {
  return (
    <figure className="ac-star">
      {m.anime && <Image src={m.anime} alt={`${m.name}, version anime`} fill priority sizes="(max-width: 899px) 92vw, 46vw" style={{ objectFit: "cover", objectPosition: m.animePos }} />}
      {!m.anime && m.real && <Image src={m.real} alt={`${m.name}, photo`} fill priority sizes="(max-width: 899px) 92vw, 46vw" style={{ objectFit: "cover", objectPosition: m.realPos }} />}
      {m.real && m.anime && (
        <figure className="ac-polaroid">
          <span><Image src={m.real} alt={`${m.name}, photo`} fill sizes="160px" style={{ objectFit: "cover", objectPosition: m.realPos }} /></span>
          <figcaption className="t-edit">dans la vraie vie</figcaption>
        </figure>
      )}
    </figure>
  );
}
