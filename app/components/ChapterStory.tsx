"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMotionValueEvent, useScroll } from "framer-motion";

const CHAPTERS = [
  {
    number: "I",
    kicker: "LES VISAGES",
    heading: "UNE GUILDE. DES LÉGENDES.",
    description: "Des personnages, des grades et surtout les personnes qui font vivre la communauté.",
    image: "/atelier/teamotaku.png",
    alt: "Illustration collective de la Guilde Otaku",
    href: "/#annuaire",
    action: "Rencontrer la Guilde",
  },
  {
    number: "II",
    kicker: "L'ARÈNE",
    heading: "CHOISIS TON CAMP.",
    description: "Entre dans l'arène et découvre les affrontements de la Guilde.",
    image: "/arena_xillia.jpg",
    alt: "Décor illustré de l'arène",
    href: "/fighters",
    action: "Entrer dans l'arène",
  },
  {
    number: "III",
    kicker: "LES CHRONIQUES",
    heading: "UNE HISTOIRE À LA FOIS.",
    description: "Critiques, découvertes et verdicts : les histoires qui nourrissent nos discussions.",
    image: "/covers/bash/drops-of-god.jpg",
    alt: "Couverture illustrée d'une œuvre présentée dans la bibliothèque",
    href: "/bibliotheque",
    action: "Lire les chroniques",
  },
];

type Chapter = (typeof CHAPTERS)[number];

function ChapterPanel({ chapter, index, active, staged = false }: {
  chapter: Chapter; index: number; active?: boolean; staged?: boolean;
}) {
  return (
    <article
      className={`gk-story-panel ${staged && active ? "is-current" : ""}`}
      aria-hidden={staged && !active ? true : undefined}
    >
      <div className="gk-story-image">
        <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 899px) 90vw, 100vw" />
      </div>
      <div className="gk-story-shade" aria-hidden="true" />
      <div className="gk-story-content">
        <div className="gk-story-meta"><span>CHAPITRE {chapter.number}</span><span>0{index + 1} / 03</span></div>
        <p className="gk-story-kicker">{chapter.kicker}</p>
        <h3>{chapter.heading}</h3>
        <p className="gk-story-desc">{chapter.description}</p>
        <Link href={chapter.href} tabIndex={staged && !active ? -1 : undefined} className="gk-story-link">
          {chapter.action} <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <span className="gk-story-watermark" aria-hidden="true">{chapter.number}</span>
    </article>
  );
}

/** Three genuine destinations told as a scroll-linked editorial sequence.
 * On touch and reduced-motion devices the same content is freely scrollable. */
export default function ChapterStory() {
  const runway = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: runway, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < 0.34 ? 0 : value < 0.68 ? 1 : 2;
    setActive((old) => old === next ? old : next);
  });

  return (
    <section className="gk-story" aria-labelledby="gk-story-heading">
      <div className="gk-wrap gk-story-heading" data-gk-motion="reveal">
        <div><span className="gk-chapter"><b>✦</b><span>LA GUILDE EN TROIS ACTES</span></span>
          <h2 id="gk-story-heading" className="gk-display">L'HISTOIRE <em>CONTINUE.</em></h2>
        </div>
        <p>Trois portes d'entrée, mille façons de vivre la passion anime. Fais défiler l'histoire.</p>
      </div>
      <div className="gk-story-runway" ref={runway}>
        <div className="gk-story-sticky">
          <div className="gk-story-stage">
            {CHAPTERS.map((chapter, index) => (
              <ChapterPanel key={chapter.number} chapter={chapter} index={index} active={active === index} staged />
            ))}
          </div>
          <div className="gk-story-index" aria-hidden="true">
            {CHAPTERS.map((c, i) => <span key={c.number} className={active === i ? "is-current" : ""}>{c.number}</span>)}
            <span className="gk-story-progress-text">DÉFILE POUR EXPLORER</span>
          </div>
        </div>
      </div>
      <p className="gk-story-swipe-hint" aria-hidden="true">← GLISSE POUR DÉCOUVRIR LES CHAPITRES →</p>
      <div className="gk-story-mobile" aria-label="Explorer les trois chapitres">
        {CHAPTERS.map((chapter, index) => <ChapterPanel key={chapter.number} chapter={chapter} index={index} />)}
      </div>
    </section>
  );
}
