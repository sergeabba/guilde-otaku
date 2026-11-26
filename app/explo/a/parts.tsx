// Pièces communes de la direction A (rendu serveur).
import type { ExploMember } from "../../../lib/explo-data";
import { directSrc } from "../../../lib/image-loader";

/** Photo réelle de remplacement, montrée seulement si le visiteur a choisi « Réel » (html[data-face]). */
function Real({ m, className, eager, width }: { m: ExploMember; className?: string; eager?: boolean; width: number }) {
  if (!m.real) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`${className ?? ""} is-real face-real`} src={directSrc(m.real, width)} alt={`${m.name}, photo réelle`} decoding="async" loading={eager ? "eager" : "lazy"} style={{ objectPosition: m.realPos }} />;
}

/** Personnage détouré (ou portrait entier à défaut), et sa photo réelle pour la bascule. */
export function Cut({ m, className, priority = false, eager = false }: { m: ExploMember; className?: string; priority?: boolean; eager?: boolean }) {
  const swap = m.real ? " face-anime has-real" : "";
  if (m.cut) {
    return <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${className ?? ""}${swap}`} src={m.cut.src} alt={`${m.name}, version anime`} width={m.cut.w} height={m.cut.h} decoding="async" loading={priority || eager ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} data-explo-hero={priority ? "" : undefined} />
      <Real m={m} className={className} eager={priority || eager} width={960} />
    </>;
  }
  const src = m.anime ?? m.real;
  if (!src) return null;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={`${className ?? ""} is-plain${m.anime ? swap : ""}`} src={directSrc(src, 960)} alt={m.name} decoding="async" loading={priority || eager ? "eager" : "lazy"} />
    {m.anime && <Real m={m} className={className} eager={priority || eager} width={960} />}
  </>;
}

/** Gros plan sur le visage (haut de la silhouette détourée), et celui de la photo réelle. */
export function Face({ m, zoom = 2.4 }: { m: ExploMember; zoom?: number }) {
  const c = m.cut;
  const fx = c ? (c.box[0] + c.box[2]) / 2 : 50, fy = c ? c.box[1] + (c.box[3] - c.box[1]) * 0.14 : 20;
  const src = c?.src ?? m.anime ?? m.real;
  if (!src) return null;
  const hasReal = !!m.real && src !== m.real;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={`xa-face${hasReal ? " face-anime has-real" : ""}`} src={c ? src : directSrc(src, 640)} alt="" loading="lazy" decoding="async"
      style={{ objectPosition: `${fx}% ${fy}%`, transformOrigin: `${fx}% ${fy}%`, transform: `scale(${zoom})` }} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {hasReal && <img className="xa-face face-real" src={directSrc(m.real!, 640)} alt="" loading="lazy" decoding="async"
      style={{ objectPosition: m.realPos, transformOrigin: m.realPos, transform: `scale(${Math.max(1, zoom * 0.55)})` }} />}
  </>;
}

/** Hôtes des onglets : choisis d'après les données réelles. */
export function hosts(all: ExploMember[], star: ExploMember) {
  const cast = all.filter((m) => m.cut);
  const strongest = [...cast].filter((m) => m.stats).sort((a, b) => (b.stats!.force + b.stats!.vitesse + b.stats!.technique) - (a.stats!.force + a.stats!.vitesse + a.stats!.technique))[0] ?? star;
  const reader = [...cast].sort((a, b) => b.works.length - a.works.length)[0] ?? star;
  const decorated = [...cast].sort((a, b) => b.awards.length - a.awards.length)[0] ?? star;
  const pick = (m: ExploMember) => ({ id: m.id, name: m.first, src: m.cut?.src ?? null, box: m.cut?.box ?? null });
  return [
    { href: "/explo/a", label: "Le chapitre", why: "En couverture", host: pick(star) },
    { href: "/explo/a/annuaire", label: "Les nakama", why: "Le plus décoré", host: pick(decorated) },
    { href: "/fighters", label: "Fighters", why: "Le plus fort", host: pick(strongest) },
    { href: "/bibliotheque", label: "Bibliothèque", why: "Le plus lecteur", host: pick(reader) },
    { href: "/teams", label: "Teams", why: "", host: null },
    { href: "/cinema", label: "Cinéma", why: "", host: null },
  ];
}
