"use client";

// Fiche en planche de manga : les mêmes données que la fiche classique, découpées en
// cases (portrait, bulle pour la bio, combat, bankai, extension du territoire,
// palmarès, favori). Les cases absentes (pas de stats, pas de favori…) disparaissent.
import Link from "next/link";
import Image from "../../components/GImage";
import type { Member } from "../../../data/members";
import type { Pouvoirs } from "../../../data/pouvoirs";
import { featuredWorks, memberAwards, objectPosition, workTitle } from "../../../lib/member-extras";
import { optimizedSrc } from "../../../lib/img";
import { rankRomaji, type Rank } from "../../config/ranks";
import { COUNTRIES } from "../../config/countries";
import type { ProfileNeighbor } from "./MemberProfileClient";
import "./planche.css";

const STATS: [keyof Member["stats"], string][] = [["force", "Force"], ["vitesse", "Vitesse"], ["technique", "Technique"]];

export default function MemberPlanche({ member, pouvoirs, next }: { member: Member; pouvoirs: Pouvoirs | null; next: ProfileNeighbor | null }) {
  const extras = member.extras ?? {};
  const awards = memberAwards(member).slice(0, 3);
  const stats = member.stats && STATS.some(([k]) => (member.stats[k] ?? 0) > 0) ? member.stats : null;
  const special = member.special?.name && !["—", "Inconnu"].includes(member.special.name) ? member.special : null;
  const fav = featuredWorks(extras.favoriteAnime ?? [], 1)[0] ?? featuredWorks(extras.favoriteManga ?? [], 1)[0];
  const country = COUNTRIES.find((c) => c.code === member.country);
  const romaji = rankRomaji[member.rank as Rank];
  const hero = member.animeChar || member.photo;
  const real = member.animeChar && member.photo ? member.photo : null;
  const caption = [member.birthday && `Anniversaire : ${member.birthday}`, country?.label].filter(Boolean).join(" · ");

  return (
    <article className="pl-page" aria-label={`Planche de ${member.name}`}>
      {hero && (
        <section className="pl-p pl-hero pl-tone">
          <Image src={hero} alt={`${member.name}, version anime`} fill priority sizes="(max-width: 699px) 100vw, 620px"
            style={{ objectFit: "cover", objectPosition: objectPosition(member.animeChar ? extras.animeFocus : extras.photoFocus, "50% 15%") }} />
          <span className="pl-chap">Chapitre {String(member.id).padStart(2, "0")}</span>
          <div className="pl-name">
            <small>{member.rank}{romaji ? ` · ${romaji}` : ""}{extras.displayNameRomaji ? ` · ${extras.displayNameRomaji}` : ""}</small>
            <h2>{member.name}</h2>
          </div>
        </section>
      )}

      <section className="pl-p pl-bio">
        {member.bio ? <p className="pl-bubble">{member.bio}</p> : <p className="pl-bubble">…</p>}
        {caption && <span className="pl-cap">{caption}</span>}
      </section>

      {real && (
        <section className="pl-p pl-real">
          <Image src={real} alt={`${member.name}, photo`} fill sizes="(max-width: 699px) 50vw, 320px"
            style={{ objectFit: "cover", objectPosition: objectPosition(extras.photoFocus, "50% 20%") }} />
          <span className="pl-box">Dans la vraie vie…</span>
        </section>
      )}

      {stats && (
        <section className="pl-p pl-stats">
          <h3>Fiche de combat</h3>
          {STATS.map(([k, label]) => {
            const v = Math.min(100, member.stats[k] ?? 0);
            return <div key={k} className="pl-row"><span>{label}</span><i className="pl-bar" aria-hidden="true"><b style={{ width: `${v}%` }} /></i><strong>{v}</strong></div>;
          })}
        </section>
      )}

      {special && (
        <section className="pl-p pl-special pl-lines">
          <span className="pl-sfx" aria-hidden="true">Baam&nbsp;!</span>
          <h3>{special.name}</h3>
          {special.effect && special.effect !== "—" && <p>{special.effect}</p>}
        </section>
      )}

      {pouvoirs && (
        <>
          <section className="pl-p pl-bankai pl-lines">
            <p className="pl-shout"><span className="gk-sr">Bankai</span><span aria-hidden="true">Ban… kai&nbsp;!</span></p>
            <h3 lang="ja-Latn">{pouvoirs.bankai.nom}</h3>
            <p className="pl-sens">{pouvoirs.bankai.sens}</p>
            <p className="pl-effet">{pouvoirs.bankai.effet}</p>
          </section>
          <section className="pl-p pl-domaine">
            <p className="pl-kind">Extension du territoire</p>
            <h3 lang="ja-Latn">{pouvoirs.domaine.nom}</h3>
            <p className="pl-sens">{pouvoirs.domaine.sens}</p>
            <p className="pl-effet">{pouvoirs.domaine.effet}</p>
          </section>
        </>
      )}

      {awards.length > 0 && (
        <section className="pl-p pl-awards">
          <h3>Palmarès</h3>
          <ul>{awards.map((a, i) => <li key={i}>{a.title}<small>{[a.year, a.description].filter(Boolean).join(" · ")}</small></li>)}</ul>
        </section>
      )}

      {fav && (
        <section className="pl-p pl-fav pl-tone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {fav.coverUrl && <img src={optimizedSrc(fav.coverUrl, 256)} alt="" loading="lazy" />}
          <div>
            <small>{fav.kind === "MANGA" ? "Manga préféré" : "Anime préféré"}{fav.year ? ` · ${fav.year}` : ""}</small>
            <h3>{workTitle(fav)}</h3>
            {fav.personalNote && <p className="pl-think">« {fav.personalNote} »</p>}
          </div>
        </section>
      )}

      <footer className="pl-p pl-end">
        {next ? <Link href={`/membres/${next.id}`}>Fin du chapitre · Suite : {next.name} →</Link> : <span>Fin du chapitre</span>}
        <span className="pl-hanko">Guilde Otaku</span>
      </footer>
    </article>
  );
}
