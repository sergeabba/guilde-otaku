import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemberProfileClient, { type ProfileNeighbor } from "./MemberProfileClient";
import { getPublicMember, parseMemberId } from "../../../lib/members-server";
import { memberCardUrl, memberOgUrl, memberProfilePath } from "../../../lib/share";
import { DOSSIER_BASH_DATA, normalizeDossierBashKey } from "../../../lib/dossier-bash";
import { workKey, type FavoriteWork } from "../../../lib/member-extras";
import { rankRomaji, type Rank } from "../../config/ranks";

// Rendue à la demande (la mise en page lit un cookie). Les données des membres sont
// mises en cache côté serveur et vidées à chaque modification dans l'admin
// (lib/revalidate-members.ts) ; les fiches voisines sont préchargées par le navigateur.

interface Props {
  params: Promise<{ id: string }>;
}

async function load(params: Props["params"]) {
  const id = parseMemberId((await params).id);
  return id === null ? null : getPublicMember(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Membre introuvable | Guilde Otaku", robots: { index: false } };

  const m = found.member;
  const romaji = rankRomaji[m.rank as Rank];
  const title = `${m.name}, ${m.rank} | Guilde Otaku`;
  const description = m.bio
    ? m.bio.slice(0, 155) + (m.bio.length > 155 ? "…" : "")
    : `La fiche de ${m.name}, ${m.rank}${romaji ? ` (${romaji})` : ""} de la Guilde Otaku.`;
  const image = memberOgUrl(m);

  return {
    title,
    description,
    alternates: { canonical: memberProfilePath(m.id) },
    openGraph: {
      title,
      description,
      url: memberProfilePath(m.id),
      siteName: "Guilde Otaku",
      images: [{ url: image, width: 1200, height: 630, type: "image/jpeg", alt: `${m.name} : portrait réel et version anime, ${m.rank}` }],
      locale: "fr_FR",
      type: "profile",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const neighbor = (m: { id: number; name: string; rank: string; animeChar: string; photo: string } | null): ProfileNeighbor | null =>
  m ? { id: m.id, name: m.name, rank: m.rank, image: m.animeChar || m.photo } : null;

/** Relie un favori à la Chronique du Bash quand elle en parle (par titre). */
function chroniqueLinks(works: FavoriteWork[]): Record<string, string> {
  const index = new Map<string, string>();
  for (const c of DOSSIER_BASH_DATA) {
    const slug = normalizeDossierBashKey(c.title).replace(/\s+/g, "-");
    index.set(normalizeDossierBashKey(c.title), slug);
    index.set(normalizeDossierBashKey(c.searchQuery), slug);
  }
  const out: Record<string, string> = {};
  for (const w of works) {
    for (const t of [w.titleRomaji, w.titleLocalized]) {
      const slug = t && index.get(normalizeDossierBashKey(t));
      if (slug) { out[workKey(w)] = slug; break; }
    }
  }
  return out;
}

export default async function MemberPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();

  const { member, prev, next } = found;
  const works = [...(member.extras?.favoriteAnime ?? []), ...(member.extras?.favoriteManga ?? [])];

  return (
    <MemberProfileClient
      member={member}
      prev={neighbor(prev)}
      next={neighbor(next)}
      cardUrl={memberCardUrl(member)}
      chroniques={chroniqueLinks(works)}
    />
  );
}
