import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploData } from "../../../lib/explo-data";
import CharacterSheet from "../../components/member/CharacterSheet";
import MemberProfileClient, { type ProfileNeighbor } from "./MemberProfileClient";
import { getPublicMember, parseMemberId } from "../../../lib/members-server";
import { memberCardUrl, memberOgUrl, memberProfilePath } from "../../../lib/share";
import { chroniqueLinks } from "../../../lib/chroniques";
import { rankRomaji, type Rank } from "../../config/ranks";
import { POUVOIRS } from "../../../data/pouvoirs";
import { tinyImage } from "../../../lib/tiny-image";

// Rendue à la demande (la mise en page lit un cookie). Les données des membres sont
// mises en cache côté serveur et vidées à chaque modification dans l'admin
// (lib/revalidate-members.ts) ; les fiches voisines sont préchargées par le navigateur.

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function load(params: Props["params"]) {
  const id = parseMemberId((await params).id);
  return id === null ? null : getPublicMember(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  // Membre masqué ou inconnu : vraie erreur 404 (les métadonnées sont calculées avant
  // l'envoi de la page aux robots : moteurs de recherche, aperçus WhatsApp…).
  if (!found) notFound();

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

export default async function MemberPage({ params, searchParams }: Props) {
  const found = await load(params);
  // Vue par défaut : la fiche de personnage ; ?vue=planche (planche de manga), ?vue=fiche (classique).
  const vue = (await searchParams)?.vue;
  const mode = vue === "fiche" ? "fiche" : vue === "planche" ? "planche" : "perso";
  if (!found) notFound();

  const { member, prev, next } = found;
  const [backdrop, explo] = await Promise.all([tinyImage(member.animeChar || member.photo), exploData().catch(() => null)]);
  const em = explo?.members.find((x) => x.id === member.id);
  const works = [...(member.extras?.favoriteAnime ?? []), ...(member.extras?.favoriteManga ?? [])];

  return (
    <MemberProfileClient
      member={member}
      prev={neighbor(prev)}
      next={neighbor(next)}
      cardUrl={memberCardUrl(member)}
      chroniques={chroniqueLinks(works)}
      pouvoirs={POUVOIRS[member.id] ?? null}
      initialMode={em ? mode : mode === "perso" ? "planche" : mode}
      sheet={em ? <CharacterSheet m={em} /> : null}
      backdrop={backdrop}
    />
  );
}
