import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import WordReveal from "./WordReveal";

const CHAPTERS = [
  {
    number: "I",
    kicker: "LES VISAGES",
    heading: "UNE GUILDE. DES LÉGENDES.",
    description: "Des personnages, des grades et surtout les personnes qui font vivre la communauté.",
    image: "/atelier/teamotaku.png", w: 2080, h: 2048,
    alt: "Illustration collective de la Guilde Otaku",
    href: "/#annuaire",
    action: "Rencontrer la Guilde",
    tint: "#3a2a12",
  },
  {
    number: "II",
    kicker: "L'ARÈNE",
    heading: "CHOISIS TON CAMP.",
    description: "Entre dans l'arène et découvre les affrontements de la Guilde.",
    image: "/arena_xillia.jpg", w: 1920, h: 1080,
    alt: "Décor illustré de l'arène",
    href: "/fighters",
    action: "Entrer dans l'arène",
    tint: "#14202e",
  },
  {
    number: "III",
    kicker: "LES CHRONIQUES",
    heading: "UNE HISTOIRE À LA FOIS.",
    description: "Critiques, découvertes et verdicts : les histoires qui nourrissent nos discussions.",
    image: "/covers/bash/drops-of-god.jpg", w: 424, h: 600,
    alt: "Couverture illustrée d'une œuvre présentée dans la bibliothèque",
    href: "/bibliotheque",
    action: "Lire les chroniques",
    tint: "#3a1218",
  },
];

/**
 * Trois chapitres en cases empilées : chaque case monte par-dessus la précédente,
 * coupée en biais comme une planche de manga, et la précédente recule (réduite,
 * assombrie). Tout est piloté par le défilement natif (CSS, animation-timeline) :
 * aucun script pendant le défilement. Sans prise en charge, les cases s'empilent
 * simplement ; avec « moins d'animations », rien ne bouge.
 */
export default function ChapterStory() {
  return (
    <section className="gk-story" aria-labelledby="gk-story-heading">
      <div className="gk-wrap gk-story-heading">
        <div><span className="gk-chapter"><b>✦</b><span>LA GUILDE EN TROIS ACTES</span></span>
          <h2 id="gk-story-heading" className="gk-display"><WordReveal>L&apos;HISTOIRE <em>CONTINUE.</em></WordReveal></h2>
        </div>
        <p>Trois portes d&apos;entrée, mille façons de vivre la passion anime.</p>
      </div>
      <div className="gk-stack" style={{ timelineScope: CHAPTERS.map((_, i) => `--gk-s${i}`).join(", ") } as React.CSSProperties}>
        {CHAPTERS.map((c, i) => (
          <article
            key={c.number}
            className="gk-stack-panel"
            style={{
              zIndex: i + 1,
              viewTimelineName: `--gk-s${i}`,
              "--recede-by": i < CHAPTERS.length - 1 ? `--gk-s${i + 1}` : "none",
              "--tint": c.tint,
            } as React.CSSProperties}
          >
            <div className="gk-stack-inner">
              <div className="gk-stack-bg" aria-hidden="true">
                <Image src={c.image} alt="" fill sizes="(max-width: 899px) 100vw, 50vw" />
              </div>
              <div className="gk-stack-shade" aria-hidden="true" />
              <figure className="gk-stack-figure" style={{ aspectRatio: `${c.w} / ${c.h}`, maxWidth: `min(${c.w}px, 44vw)`, maxHeight: c.h }}>
                <Image src={c.image} alt={c.alt} fill sizes="(min-width: 900px) 44vw, 1px" />
              </figure>
              <div className="gk-stack-content">
                <div className="gk-story-meta"><span>CHAPITRE {c.number}</span><span>0{i + 1} / 03</span></div>
                <p className="gk-story-kicker">{c.kicker}</p>
                <h3>{c.heading}</h3>
                <p className="gk-story-desc">{c.description}</p>
                <Link href={c.href} className="gk-story-link">
                  {c.action} <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
