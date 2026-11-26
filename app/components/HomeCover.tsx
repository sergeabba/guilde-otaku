"use client";

// Couverture de l'accueil, dans la voix du grand menu : nom de la Guilde en lettres
// découpées, membre de couverture détouré (ou sa photo, selon la préférence Anime / Réel),
// et les entrées majeures du site en barres inclinées, toutes visibles et cliquables.
// Ordinateur : couverture éditoriale sur un écran. Téléphone : une pile qui se lit en
// défilant, sans geste imposé, et le début de la suite reste visible.
import Link from "next/link";
import type { Member } from "../../data/members";
import { rankAccents } from "../config/ranks";
import { directSrc } from "../../lib/image-loader";
import { useFace } from "../../lib/face";
import Ransom from "./Ransom";
import FaceToggle from "./FaceToggle";
import "../styles/home-cover.css";

export interface CoverCut { src: string; w: number; h: number }

export interface CoverEntry { href: string; label: string; hint: string; onClick?: () => void }

function Host({ m, cut, priority }: { m: Member; cut?: CoverCut; priority?: boolean }) {
  const face = useFace();
  const real = face === "real" && !!m.photo;
  if (!real && cut) {
    const mask = { WebkitMaskImage: `url(${cut.src})`, maskImage: `url(${cut.src})` } as React.CSSProperties;
    return (
      <div className="hc-host">
        <span className="hc-sil is-paper" style={mask} />
        <span className="hc-sil is-ink" style={mask} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cut.src} width={cut.w} height={cut.h} alt="" decoding="async" fetchPriority={priority ? "high" : "auto"} loading={priority ? "eager" : "lazy"} />
      </div>
    );
  }
  const src = real ? m.photo : (m.animeChar || m.photo);
  if (!src) return <div className="hc-host is-empty" aria-hidden="true"><span>{m.name.slice(0, 2)}</span></div>;
  return (
    <div className="hc-host is-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={directSrc(src, 960)} alt="" decoding="async" fetchPriority={priority ? "high" : "auto"} loading={priority ? "eager" : "lazy"} />
    </div>
  );
}

export default function HomeCover({ lead, side, cuts, entries, facts, onOpen }: {
  lead: Member | null; side: Member[]; cuts: Record<number, CoverCut>;
  entries: CoverEntry[]; facts: { label: string; value: number }[];
  onOpen: (m: Member, el: HTMLElement) => void;
}) {
  const acc = lead ? rankAccents[lead.rank] ?? "#f5e400" : "#f5e400";
  return (
    <section className="hc" aria-label="Couverture" style={{ "--hc-acc": acc } as React.CSSProperties}>
      <div className="hc-bg" aria-hidden="true"><span className="hc-star" /><span className="hc-star is-2" /><span className="hc-stripes" /></div>

      <div className="hc-copy">
        <p className="hc-kicker"><b>Depuis 2020</b><span>Le registre des membres</span></p>
        <Ransom text="Guilde Otaku" as="h1" className="hc-title" />
        <p className="hc-lede">Une bande d&apos;amis qui débat d&apos;animes, élit ses films et se décerne des titres. Voici qui la compose.</p>
        <dl className="hc-facts">
          {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      </div>

      {lead && (
        <button type="button" className="hc-stage" onClick={(e) => onOpen(lead, e.currentTarget)} aria-label={`Ouvrir la fiche de ${lead.name}, ${lead.rank}`}>
          <Host m={lead} cut={cuts[lead.id]} priority />
          <span className="hc-cap"><b>{lead.name}</b><small>{lead.rank}</small></span>
        </button>
      )}

      <nav className="hc-menu" aria-label="Entrées principales">
        <ul>
          {entries.map((e, k) => (
            <li key={e.href} style={{ "--k": k } as React.CSSProperties}>
              <Link href={e.href} onClick={e.onClick ? (ev) => { ev.preventDefault(); e.onClick!(); } : undefined}>
                <span className="hc-item">{e.label}</span>
                <small>{e.hint}</small>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {side.length > 0 && (
        <div className="hc-side" aria-label="Aussi en couverture">
          {side.map((m) => (
            <button key={m.id} type="button" className="hc-mini" onClick={(e) => onOpen(m, e.currentTarget)} aria-label={`Ouvrir la fiche de ${m.name}, ${m.rank}`} style={{ "--hc-c": rankAccents[m.rank] } as React.CSSProperties}>
              <Host m={m} cut={cuts[m.id]} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="hc-face"><FaceToggle /></div>
    </section>
  );
}
