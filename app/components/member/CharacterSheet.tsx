// Fiche de personnage (DA v3) : le membre présenté comme un personnage principal de RPG.
// Plan 1 : nuit, dalle diagonale à la couleur du grade semée d'étoiles, sceau doré du grade.
// Plan 2 : le personnage détouré traverse la dalle et le nom. Plan 3 : statut (lames, chiffres
// géants), puis profil sur parchemin, distinctions, et deux scènes propres au membre : son
// bankai (atmosphère inversée, silhouette d'encre) et son territoire (nom qui tourne autour du
// portrait). Rendu serveur ; la bascule Anime / Réel passe par html[data-face].
import type { ExploMember } from "../../../lib/explo-data";
import Sceau from "../guilde/Sceau";
import Lame from "../guilde/Lame";
import Phylactere from "../guilde/Phylactere";
import { Cadre } from "../guilde/Ornement";
import { starTile } from "../guilde/textures";
import Ransom from "../Ransom";
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
          <Phylactere tone="gold" className="ch-rank">{m.rank} · {romaji}</Phylactere>
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
              <h2><Phylactere tone="red">Distinctions</Phylactere></h2>
              <ul>{m.awards.slice(0, 6).map((a, i) => <li key={i}><Phylactere tone="gold">{a.title}{a.year ? ` · ${a.year}` : ""}</Phylactere></li>)}</ul>
            </div>
          )}
        </div>
      </section>

      {m.bankai && (
        <section className="gu-scene is-flip ch-bankai" aria-labelledby="ch-bk">
          {m.cut && <span className="ch-bk-sil" aria-hidden="true" style={{ WebkitMaskImage: `url(${m.cut.src})`, maskImage: `url(${m.cut.src})` }} />}
          <p className="ch-bk-kicker"><Lame tone="ink" shadow="paper" seed="bankai">Bankai</Lame></p>
          <Ransom text={m.bankai.nom} as="h2" className="ch-bk-name" />
          <span id="ch-bk" hidden>{m.bankai.nom}</span>
          <p className="ch-bk-sens"><Phylactere tone="ink">{m.bankai.sens}</Phylactere></p>
          <p className="ch-bk-effet">{m.bankai.effet}</p>
        </section>
      )}

      {m.domaine && (
        <section className="gu-scene ch-domain" aria-label="Extension du territoire">
          <div className="ch-dom-ring">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <defs><path id="ch-dom-p" d="M100 100 m-86 0 a86 86 0 1 1 172 0 a86 86 0 1 1 -172 0" /></defs>
              {[86, 70, 54].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth={r === 86 ? 1.5 : .8} strokeDasharray={r === 70 ? "2 3" : undefined} />)}
              <text fontSize="9" letterSpacing="3" fill="currentColor"><textPath href="#ch-dom-p">{`${m.domaine.nom} · `.repeat(4).toUpperCase()}</textPath></text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {art && <img src={m.cut ? art : directSrc(art, 640)} alt="" loading="lazy" />}
          </div>
          <div className="ch-dom-text">
            <p className="ch-bk-kicker"><Lame tone="gold" shadow="red" seed="domaine">Extension du territoire</Lame></p>
            <h2 className="ch-dom-name">{m.domaine.nom}</h2>
            <p className="ch-bk-sens"><Phylactere tone="gold">{m.domaine.sens}</Phylactere></p>
            <p className="ch-bk-effet">{m.domaine.effet}</p>
          </div>
        </section>
      )}
    </div>
  );
}
