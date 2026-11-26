// Fiche de personnage (DA v3) : le membre présenté comme un personnage principal de RPG.
// Plan 1 : nuit, dalle diagonale à la couleur du grade semée d'étoiles, sceau doré du grade.
// Plan 2 : le personnage détouré traverse la dalle et le nom. Plan 3 : statut (lames, chiffres
// géants), puis profil sur parchemin, distinctions, et deux scènes propres au membre : son
// bankai (atmosphère inversée, silhouette d'encre) et son territoire (nom qui tourne autour du
// portrait). Rendu serveur ; la bascule Anime / Réel passe par html[data-face].
import type { ExploMember } from "../../../lib/explo-data";
import Sceau from "../guilde/Sceau";
import Lame from "../guilde/Lame";
import PowerScene from "./PowerScene";
import { Cadre } from "../guilde/Ornement";
import { starTile } from "../guilde/textures";
import FaceToggle from "../FaceToggle";
import { directSrc } from "../../../lib/image-loader";
import { rankRomaji, type Rank } from "../../config/ranks";
import "../../styles/character-sheet.css";

export default function CharacterSheet({ m }: { m: ExploMember }) {
  const romaji = rankRomaji[m.rank as Rank];
  const art = m.cut?.src ?? m.anime ?? m.real;
  const tile = starTile("rgba(0,0,0,.2)", 30);
  const stats = m.stats ? (["force", "vitesse", "technique"] as const).map((k) => [k, m.stats![k]] as const) : [];
  return (
    <div className="ch gu-night" style={{ "--ch-acc": m.accent, "--ch-tile": tile } as React.CSSProperties}>
      <section className="ch-hero" aria-labelledby="ch-name">
        <div className="ch-slab" aria-hidden="true" />
        <Sceau className="ch-seal" rank={m.rank} text={romaji} tone="gold" size="100%" />
        <div className="ch-art">
          {m.cut && <span className="ch-echo face-anime has-real" style={{ WebkitMaskImage: `url(${m.cut.src})`, maskImage: `url(${m.cut.src})` }} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {art && <img className={`ch-img${m.cut ? "" : " is-photo"}${m.real ? " face-anime has-real" : ""}`} src={m.cut ? art : directSrc(art, 960)} alt={`${m.name}, version anime`} fetchPriority="high" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.real && <img className="ch-img is-photo face-real" src={directSrc(m.real, 960)} alt={`${m.name}, photo`} style={{ objectPosition: m.realPos }} />}
        </div>
        <header className="ch-id">
          <p className="ch-no">N°{String(m.id).padStart(3, "0")}</p>
          <h1 id="ch-name" className="ch-name">{m.name}</h1>
          <p className="ch-rank"><b>{m.rank}</b>{romaji && <span>{romaji}</span>}</p>
          {m.alias && <p className="ch-alias">« {m.alias} »</p>}
        </header>
        <div className="ch-face"><FaceToggle /></div>
        <aside className="ch-status" aria-label="Statut">
          {stats.length > 0 ? stats.map(([k, v], i) => (
            <p key={k} className="ch-stat" style={{ "--i": i } as React.CSSProperties}>
              <Lame tone={i === 0 ? "paper" : "ink"} shadow="acc" seed={k + m.id}>{k}</Lame>
              <span className="ch-num">{v}</span>
            </p>
          )) : <p className="ch-stat-none">Statistiques non renseignées</p>}
          {m.special && <p className="ch-special"><small>Coup spécial</small><b>{m.special.name}</b></p>}
        </aside>
      </section>

      <section className="gu-scene is-paper ch-story" aria-label="Profil">
        <div className="ch-sheet">
          <Cadre />
          {m.bio && <p className="ch-bio gu-lettrine">{m.bio}</p>}
          <dl className="ch-facts">
            {m.country && <div><dt>Pays</dt><dd>{m.country}</dd></div>}
            {m.birthday && <div><dt>Anniversaire</dt><dd>{m.birthday}</dd></div>}
            <div><dt>Édition</dt><dd>{m.edition}</dd></div>
          </dl>
          {m.awards.length > 0 && (
            <div className="ch-awards">
              <h2 className="ch-awards-h">Distinctions</h2>
              <ul>{m.awards.slice(0, 6).map((a, i) => <li key={i} className="ch-award"><b>{a.title}</b>{a.year && <small>{a.year}</small>}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      {m.special && <PowerScene kind="special" id="ch-sp" seed={m.id} nom={m.special.name} sens="Attaque spéciale" effet={m.special.effect} family={m.powerScenes?.special?.family} art={m.powerScenes?.special?.art ?? m.cut?.src ?? art} />}
      {m.bankai && <PowerScene kind="bankai" id="ch-bk" seed={m.id} nom={m.bankai.nom} sens={m.bankai.sens} effet={m.bankai.effet} family={m.powerScenes?.bankai?.family} art={m.powerScenes?.bankai?.art ?? m.cut?.src ?? art} />}
      {m.domaine && <PowerScene kind="domaine" id="ch-dom" seed={m.id} nom={m.domaine.nom} sens={m.domaine.sens} effet={m.domaine.effet} family={m.powerScenes?.domaine?.family} art={m.powerScenes?.domaine?.art ?? m.cut?.src ?? art} />}
    </div>
  );
}
