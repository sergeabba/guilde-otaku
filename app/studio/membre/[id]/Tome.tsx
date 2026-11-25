"use client";

// Un membre, un tome : couverture de volume (portrait qui déborde, nom en grand, numéro du
// tome), puis quatre chapitres dans les trois registres de la Guilde. Sommaire collant avec
// avancement de lecture. Sur téléphone, balayer la couverture mène au tome voisin.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import Image from "../../../components/GImage";
import type { StudioMember } from "../../../../lib/studio-data";
import { flagUrl } from "../../../config/countries";

const CH = [["ch-origines", "Origines"], ["ch-pouvoirs", "Pouvoirs"], ["ch-palmares", "Palmarès"], ["ch-univers", "Univers"]] as const;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export default function Tome({ m, prev, next }: { m: StudioMember; prev: { id: number; name: string }; next: { id: number; name: string } }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [face, setFace] = useState<"anime" | "real">(m.anime ? "anime" : "real");
  const [days, setDays] = useState<number | null>(null);
  const [active, setActive] = useState<string>(CH[0][0]);
  const src = face === "anime" ? (m.anime ?? m.real) : (m.real ?? m.anime);
  const pos = face === "anime" ? m.animePos : m.realPos;
  const words = m.name.replace(/["“”]/g, "").split(/\s+/);

  // Compte à rebours de l'anniversaire, calculé chez le visiteur (son fuseau).
  useEffect(() => {
    if (!m.birthDay || !m.birthMonth) return;
    const now = new Date(), t = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let d = new Date(now.getFullYear(), m.birthMonth - 1, m.birthDay).getTime();
    if (d < t) d = new Date(now.getFullYear() + 1, m.birthMonth - 1, m.birthDay).getTime();
    void Promise.resolve().then(() => setDays(Math.round((d - t) / 86400000)));
  }, [m.birthDay, m.birthMonth]);

  // Chapitre en cours de lecture (sommaire collant).
  useEffect(() => {
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-45% 0px -50% 0px" });
    CH.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 90 || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return;
    router.push(`/studio/membre/${info.offset.x < 0 ? next.id : prev.id}`);
  };

  return (
    <article className="tm2-tome">
      {/* ── COUVERTURE DU TOME ─────────────────────────────────────────────── */}
      <motion.section className="tm2-cover" aria-labelledby="tm2-name" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18} dragDirectionLock onDragEnd={onSwipe} dragListener={!reduce}>
        <div className="tm2-spine" aria-hidden="true"><span className="t-ui">Guilde Otaku</span><b className="t-logo">{m.id}</b><span className="t-ui">{m.rank}</span></div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.figure key={face} className="tm2-art"
            initial={reduce ? { opacity: 0 } : { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }} transition={{ duration: reduce ? 0.12 : 0.55, ease: [0.22, 1, 0.36, 1] }}>
            {src && <Image src={src} alt={`${m.name}, ${face === "anime" ? "version anime" : "photo"}`} fill priority sizes="(max-width: 899px) 100vw, 62vw" style={{ objectFit: "cover", objectPosition: pos }} />}
          </motion.figure>
        </AnimatePresence>
        <span className="tm2-burst" aria-hidden="true" />

        <div className="tm2-title">
          <p className="tm2-series t-edit">Les chroniques de la Guilde</p>
          <h1 id="tm2-name" className="t-display tm2-name">{words.map((w, i) => <span key={i} style={{ "--i": i } as React.CSSProperties}>{w}</span>)}</h1>
          <p className="tm2-rank r-dense"><b className="t-display">{m.rank}</b><span className="t-edit">{m.romaji}{m.alias ? ` · « ${m.alias} »` : ""}</span></p>
          {m.lede && m.lede !== m.bio.trim() && <p className="tm2-blurb t-edit">{m.lede}</p>}
        </div>

        <p className="tm2-volume t-logo" aria-label={`Tome ${m.id}`}><small className="t-ui">Tome</small>{m.id}</p>
        {m.anime && m.real && (
          <button type="button" className="tm2-flip t-ui" onClick={() => setFace(face === "anime" ? "real" : "anime")} aria-label={face === "anime" ? "Voir la photo" : "Voir la version anime"}>
            <span>{face === "anime" ? "Réel" : "Anime"}</span>
          </button>
        )}
        <p className="tm2-swipe t-ui" aria-hidden="true">‹ balaie pour changer de tome ›</p>
      </motion.section>

      {/* ── SOMMAIRE COLLANT ───────────────────────────────────────────────── */}
      <nav className="tm2-toc" aria-label="Chapitres du tome">
        <span className="tm2-progress" aria-hidden="true" />
        {CH.map(([id, label], i) => <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}><b className="t-logo">{i + 1}</b><span className="t-ui">{label}</span></a>)}
      </nav>

      {/* ── CHAPITRE 1 · ORIGINES (magazine) ───────────────────────────────── */}
      <section id="ch-origines" className="tm2-ch tm2-origines">
        <header className="tm2-ch-head"><p className="t-logo">Chapitre 1</p><h2 className="t-display">Origines</h2></header>
        <div className="tm2-orig-grid">
          <div className="tm2-bio t-edit">
            {m.bio ? <p>{m.bio}</p> : <p>La bio de {m.first} reste à écrire.</p>}
            {m.real && m.anime && (
              <figure className="tm2-polaroid">
                <span><Image src={m.real} alt={`${m.name}, photo`} fill sizes="240px" style={{ objectFit: "cover", objectPosition: m.realPos }} /></span>
                <figcaption className="t-edit">{m.first}, dans le monde réel.</figcaption>
              </figure>
            )}
          </div>
          <dl className="tm2-facts">
            <div><dt className="t-ui">Numéro</dt><dd className="t-logo">N°{String(m.id).padStart(3, "0")}</dd></div>
            <div><dt className="t-ui">Grade</dt><dd className="r-dense"><span className="t-display">{m.rank}</span></dd></div>
            {m.country && <div><dt className="t-ui">Pays</dt><dd>{/* eslint-disable-next-line @next/next/no-img-element */}{m.flag && <img src={flagUrl(m.flag)} alt="" width={24} height={16} />} {m.country}</dd></div>}
            {m.birthDay && m.birthMonth && <div><dt className="t-ui">Anniversaire</dt><dd>{m.birthDay} {MONTHS[m.birthMonth - 1]}{days !== null && <small className="t-logo">{days === 0 ? "aujourd'hui !" : days === 1 ? "demain" : `J-${days}`}</small>}</dd></div>}
          </dl>
        </div>
      </section>

      {/* ── CHAPITRE 2 · POUVOIRS (compétition) ────────────────────────────── */}
      <section id="ch-pouvoirs" className="tm2-ch tm2-power r-kiri">
        <header className="tm2-ch-head"><p className="t-logo">Chapitre 2</p><h2 className="t-display">Pouvoirs</h2></header>
        {m.stats && (
          <dl className="tm2-stats">
            {(["force", "vitesse", "technique"] as const).map((k) => (
              <div key={k} style={{ "--v": m.stats![k] } as React.CSSProperties}><dt className="t-ui">{k}</dt><dd className="t-data">{m.stats![k]}</dd><i aria-hidden="true" /></div>
            ))}
          </dl>
        )}
        <div className="tm2-moves">
          {m.special && (
            <div className="tm2-move is-special"><p className="tm2-move-kind t-ui">Attaque spéciale</p><p className="tm2-move-name t-display">{m.special.name}</p>{m.special.effect && <p className="tm2-move-fx">{m.special.effect}</p>}</div>
          )}
          {m.bankai && (
            <div className="tm2-move is-bankai"><span className="tm2-sfx t-display" aria-hidden="true">Ban… kai !</span><p className="tm2-move-kind t-ui">Bankai</p><p className="tm2-move-name t-display">{m.bankai.nom}</p><p className="tm2-move-sens t-data">{m.bankai.sens}</p><p className="tm2-move-fx">{m.bankai.effet}</p></div>
          )}
          {m.domaine && (
            <div className="tm2-move is-domain"><p className="tm2-move-kind t-ui">Ryōiki tenkai · extension du territoire</p><p className="tm2-move-name t-display">{m.domaine.nom}</p><p className="tm2-move-sens t-data">{m.domaine.sens}</p><p className="tm2-move-fx">{m.domaine.effet}</p></div>
          )}
        </div>
      </section>

      {/* ── CHAPITRE 3 · PALMARÈS (prestige) ───────────────────────────────── */}
      <section id="ch-palmares" className="tm2-ch tm2-awards r-dense">
        <header className="tm2-ch-head"><p className="t-logo">Chapitre 3</p><h2 className="t-display">Palmarès</h2></header>
        {m.awards.length ? (
          <ol className="tm2-plaques">
            {m.awards.map((a, i) => (
              <li key={i}><span className="tm2-plaque-year t-data">{a.year ?? "·"}</span><b className="t-display">{a.title}</b>{a.description && <p className="t-edit">{a.description}</p>}</li>
            ))}
          </ol>
        ) : <div className="tm2-empty"><b className="t-display">À suivre…</b><p className="t-edit">Le palmarès de {m.first} s&apos;écrira dans les prochains tomes.</p></div>}
      </section>

      {/* ── CHAPITRE 4 · UNIVERS (magazine) ────────────────────────────────── */}
      <section id="ch-univers" className="tm2-ch tm2-univers">
        <header className="tm2-ch-head"><p className="t-logo">Chapitre 4</p><h2 className="t-display">Univers</h2></header>
        {m.works.length ? (
          <ul className="tm2-shelf">
            {m.works.map((w, i) => (
              <li key={i} style={{ "--r": `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` } as React.CSSProperties}>
                <span className="tm2-cover-img">{w.cover && <Image src={w.cover} alt="" fill sizes="(max-width: 899px) 40vw, 200px" style={{ objectFit: "cover" }} />}</span>
                <b className="t-ui">{w.title}</b><small className="t-ui">{w.kind}{w.year ? ` · ${w.year}` : ""}</small>
                {w.note && <p className="tm2-note t-edit">« {w.note} »</p>}
              </li>
            ))}
          </ul>
        ) : <div className="tm2-empty"><b className="t-display">Étagère vide</b><p className="t-edit">{m.first} n&apos;a pas encore rangé ses séries préférées.</p></div>}
      </section>

      {/* ── FIN DU TOME ────────────────────────────────────────────────────── */}
      <footer className="tm2-end">
        <p className="t-edit">Fin du tome {m.id}.</p>
        <div className="tm2-neighbours">
          <Link href={`/studio/membre/${prev.id}`} className="tm2-spine-link"><small className="t-ui">Tome précédent</small><b className="t-display">{prev.name}</b></Link>
          <Link href={`/studio/membre/${next.id}`} className="tm2-spine-link is-next"><small className="t-ui">Tome suivant</small><b className="t-display">{next.name}</b></Link>
        </div>
        <Link href={`/studio/annuaire?m=${m.id}`} className="tm2-back t-ui">Retour à la collection</Link>
      </footer>
    </article>
  );
}
