"use client";

// Une équipe de la Guilde, façon anime de sport et soirée de Ligue des champions :
// le onze de foot en cartes de joueurs sur un terrain bleu nuit étoilé (« équipe de la
// semaine »), le cinq de basket en cartes de présentation d'avant-match sur un parquet
// sombre. Portrait anime ou réel au choix ; toucher un joueur ouvre sa fiche de match.
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Crown, Flame, Zap } from "lucide-react";
import Image from "../components/GImage";
import { onColor } from "../utils/color";
import { LINE_LABEL, SPORT_LABEL, lineOf, lineRatings, slotsOf, teamPower, type GuildTeam, type SlotDef, type TeamSlot } from "../../lib/teams-logic";

export interface TeamMember {
  id: number; name: string; rank: string;
  anime: string | null; real: string | null; animePos: string; realPos: string;
  /** Écusson de la carte : logo de la série du portrait anime, sinon logo du grade. */
  logo: string | null;
  /** Logo du grade, si le logo de série ne charge pas. */
  logoFallback?: string | null;
  stats: { force?: number; vitesse?: number; technique?: number } | null;
  special: string | null; bankai: string | null;
}
export type Face = "anime" | "real";
type Player = { def: SlotDef; slot: TeamSlot; m: TeamMember };

const DEFAULT_COLOR = { basket: "#f97316", foot: "#2563eb" } as const;
const first = (name: string) => name.replace(/["“”«»()]/g, " ").trim().split(/\s+/)[0];
const initials = (name: string) => name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "G";
/** Portrait demandé, sinon l'autre. */
export function face(m: TeamMember, f: Face): { src: string | null; pos: string } {
  const want = f === "real" ? { src: m.real, pos: m.realPos } : { src: m.anime, pos: m.animePos };
  return want.src ? want : f === "real" ? { src: m.anime, pos: m.animePos } : { src: m.real, pos: m.realPos };
}

function Portrait({ m, f, sizes, priority }: { m: TeamMember; f: Face; sizes: string; priority?: boolean }) {
  const p = face(m, f);
  return p.src ? <Image src={p.src} alt="" fill sizes={sizes} priority={priority} style={{ objectFit: "cover", objectPosition: p.pos }} /> : <span className="tm-noimg" aria-hidden="true">{initials(m.name)}</span>;
}

export default function TeamBoard({ team, members, faceMode = "anime", preview = false }: { team: GuildTeam; members: Map<number, TeamMember>; faceMode?: Face; preview?: boolean }) {
  const color = team.color ?? DEFAULT_COLOR[team.sport];
  const defs = slotsOf(team.sport, team.formation);
  const players: Player[] = defs.flatMap((def) => {
    const slot = team.slots.find((x) => x.slot === def.id);
    const m = slot && members.get(slot.memberId);
    return slot && m ? [{ def, slot, m }] : [];
  });
  const empty = defs.filter((d) => !players.some((p) => p.def.id === d.id));
  const [picked, setPicked] = useState<number | null>(null);
  const current = players.find((p) => p.m.id === picked) ?? players.find((p) => p.slot.captain) ?? players[0] ?? null;
  const power = teamPower(players.map((p) => p.m.stats));
  const style = { "--tm": color, "--tm-on": onColor(color) } as React.CSSProperties;
  const label = (p: Player) => `${p.m.name}, ${p.def.label}${p.slot.number !== undefined ? `, numéro ${p.slot.number}` : ""}${p.slot.captain ? ", capitaine" : ""}`;

  return (
    <section className={`tm-team is-${team.sport}`} style={style} aria-labelledby={`tm-${team.id}`}>
      <div className="tm-stage">
        <span className="tm-stage-fx" aria-hidden="true"><i /><i /><i /></span>
        <header className="tm-banner">
          <Crest name={team.name} color={color} sport={team.sport} />
          <div className="tm-banner-text">
            <p className="tm-sport">{SPORT_LABEL[team.sport]}{team.sport === "foot" ? ` · ${team.formation}` : ""}</p>
            <h2 id={`tm-${team.id}`} className="tm-name">{team.name}</h2>
            {team.motto && <p className="tm-motto">« {team.motto} »</p>}
          </div>
          {(() => { const cap = players.find((p) => p.slot.captain); return cap ? <Captain p={cap} f={faceMode} /> : null; })()}
          {power !== null && (
            <div className="tm-power" title="Moyenne des stats des titulaires">
              <span>Puissance</span><b>{power}</b>
              <i aria-hidden="true"><em style={{ width: `${power}%` }} /></i>
            </div>
          )}
          {/* Note de chaque ligne (moyenne des titulaires qui y jouent). */}
          {power !== null && (
            <ul className="tm-lines-rating" aria-label="Note par ligne">
              {lineRatings(team.sport, players.map((p) => ({ code: p.def.code, stats: p.m.stats }))).map((l) => (
                <li key={l.line}><span>{LINE_LABEL[l.line]}</span><b>{l.value ?? "–"}</b></li>
              ))}
            </ul>
          )}
        </header>

        {players.length === 0 ? (
          <p className="tm-empty">Effectif à venir : aucun titulaire choisi pour l&apos;instant.</p>
        ) : (
          <div className="tm-body">
            {false ? (
              <div className="tm-court">
                <span className="tm-court-lines" aria-hidden="true"><i /><i /></span>
                <ol className="tm-five" aria-label="Cinq majeur">
                  {players.map((p, i) => (
                    <li key={p.def.id} style={{ "--i": i } as React.CSSProperties}>
                      <button type="button" className="tm-card" aria-pressed={current?.m.id === p.m.id} onClick={() => setPicked(p.m.id)} aria-label={label(p)}>
                        <span className="tm-card-no" aria-hidden="true">{p.slot.number ?? ""}</span>
                        <span className="tm-card-img"><Portrait m={p.m} f={faceMode} sizes="220px" /></span>
                        {p.m.logo && <Logo className="tm-card-logo" src={p.m.logo} fallback={p.m.logoFallback} />}
                        <span className="tm-card-pos">{p.def.id}</span>
                        {p.slot.captain && <span className="tm-cap" title="Capitaine"><Crown size={14} aria-hidden="true" /></span>}
                        <span className="tm-card-name">{first(p.m.name)}</span>
                      </button>
                    </li>
                  ))}
                  {empty.map((d, i) => (
                    <li key={d.id} style={{ "--i": players.length + i } as React.CSSProperties}>
                      <span className="tm-card is-ghost" aria-label={`${d.label} : poste à pourvoir`}><span className="tm-card-pos">{d.id}</span><span className="tm-card-name">À recruter</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className={`tm-pitch${team.sport === "basket" ? " is-court" : ""}`} aria-label={team.sport === "basket" ? "Cinq majeur sur le terrain" : `Onze de départ en ${team.formation}`} role="group">
                <span className="tm-lines" aria-hidden="true"><i className="tm-box is-top" /><i className="tm-box is-bottom" /><i className="tm-circle" /><i className="tm-half" /></span>
                {empty.map((d) => (
                  <span key={d.id} className="tm-ghost" style={{ left: `${d.x}%`, top: `${d.y}%` }} title={`${d.label} : poste à pourvoir`}><b>{d.code}</b></span>
                ))}
                {players.map((p, i) => (
                  <button key={p.def.id} type="button" className="tm-player" aria-pressed={current?.m.id === p.m.id} onClick={() => setPicked(p.m.id)}
                    style={{ left: `${p.def.x}%`, top: `${p.def.y}%`, "--i": i } as React.CSSProperties} aria-label={label(p)}>
                    <span className="tm-player-card">
                      <Portrait m={p.m} f={faceMode} sizes="140px" />
                      {p.m.logo && <Logo className="tm-player-logo" src={p.m.logo} fallback={p.m.logoFallback} />}
                      {p.slot.number !== undefined && <b className="tm-player-no">{p.slot.number}</b>}
                    </span>
                    <span className="tm-player-name">{p.slot.captain && <Crown size={11} aria-hidden="true" />}{first(p.m.name)}</span>
                  </button>
                ))}
              </div>
            )}

            {current && <PlayerSheet key={current.m.id} p={current} preview={preview} />}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Écusson original de l'équipe : forme selon le sport (blason pour le foot, médaillon pour le
 * basket), couleur de l'équipe, motif choisi de façon stable d'après son nom, initiales.
 */
function Crest({ name, color, sport }: { name: string; color: string; sport: string }) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const motif = h % 3, ink = "#050509";
  const clip = sport === "foot" ? "M50 4 L92 16 V52 C92 76 72 90 50 98 C28 90 8 76 8 52 V16 Z" : "M50 4 A46 46 0 1 1 49.9 4 Z";
  return (
    <svg className="tm-crest-svg" viewBox="0 0 100 102" aria-hidden="true">
      <defs><clipPath id={`cr-${h}`}><path d={clip} /></clipPath></defs>
      <path d={clip} fill={ink} transform="translate(4 4)" />
      <g clipPath={`url(#cr-${h})`}>
        <rect width="100" height="102" fill={color} />
        {motif === 0 && <path d="M-10 70 L110 20 V44 L-10 94 Z" fill={ink} opacity=".85" />}
        {motif === 1 && [0, 1, 2].map((i) => <rect key={i} x={18 + i * 26} y="0" width="12" height="102" fill={ink} opacity=".8" />)}
        {motif === 2 && <path d="M50 0 L100 50 L50 102 L0 50 Z" fill={ink} opacity=".8" />}
      </g>
      <path d={clip} fill="none" stroke="#fff" strokeWidth="4" />
      <text x="50" y="62" textAnchor="middle" fontSize="30" fill="#fff" stroke={ink} strokeWidth="5" paintOrder="stroke" style={{ fontFamily: "Anton, sans-serif" }}>{initials(name)}</text>
    </svg>
  );
}

/**
 * Logo de série du joueur. Cause des échecs : /api/series-logo répond 502 quand TMDB n'est pas
 * configuré ou ne répond pas, 404 quand la série n'a pas de logo. On passe alors au logo du
 * grade, puis on retire l'image (Safari afficherait sinon un « ? » bleu).
 */
function Logo({ src, fallback, className }: { src: string; fallback?: string | null; className: string }) {
  const [cur, setCur] = useState<string | null>(src);
  // eslint-disable-next-line @next/next/no-img-element
  return cur ? <img className={className} src={cur} alt="" loading="lazy" onError={() => setCur(cur !== fallback && fallback ? fallback : null)} /> : null;
}

/** Le capitaine mis en avant, comme une présentation de titulaire : numéro géant, portrait. */
function Captain({ p, f }: { p: Player; f: Face }) {
  return (
    <div className="tm-captain" aria-label={`Capitaine : ${p.m.name}`}>
      <span className="tm-captain-no" aria-hidden="true">{p.slot.number ?? "C"}</span>
      <span className="tm-captain-img"><Portrait m={p.m} f={f} sizes="200px" /></span>
      <span className="tm-captain-txt"><small>Capitaine</small><b>{p.m.name}</b><i>{p.def.label}</i></span>
    </div>
  );
}

function PlayerSheet({ p, preview }: { p: Player; preview: boolean }) {
  const st = p.m.stats;
  const both = !!(p.m.anime && p.m.real);
  return (
    <aside className="tm-sheet" aria-live="polite">
      <div className={`tm-sheet-faces${both ? " is-duo" : ""}`}>
        {p.m.real && <figure className="tm-sheet-img"><Image src={p.m.real} alt={`${p.m.name}, photo`} fill sizes="(max-width: 899px) 30vw, 150px" style={{ objectFit: "cover", objectPosition: p.m.realPos }} /><figcaption>Réel</figcaption></figure>}
        {p.m.anime && <figure className="tm-sheet-img is-anime"><Image src={p.m.anime} alt={`${p.m.name}, version anime`} fill sizes="(max-width: 899px) 30vw, 150px" style={{ objectFit: "cover", objectPosition: p.m.animePos }} /><figcaption>Anime</figcaption></figure>}
      </div>
      <div className="tm-sheet-body">
        <p className="tm-sheet-kick">{p.slot.number !== undefined ? `N° ${p.slot.number} · ` : ""}{p.def.label}{(() => { const l = lineOf(p.def.code); return l ? ` · ${LINE_LABEL[l]}` : ""; })()}{p.slot.captain ? " · Capitaine" : ""}</p>
        <h3 className="tm-sheet-name">{p.m.name}</h3>
        <p className="tm-sheet-rank">{p.m.rank}</p>
        {st && (
          <dl className="tm-sheet-stats">
            {(["force", "vitesse", "technique"] as const).map((k) => (
              <div key={k}><dt>{k}</dt><dd><i aria-hidden="true"><em style={{ width: `${Math.min(100, st[k] ?? 0)}%` }} /></i><b>{st[k] ?? 0}</b></dd></div>
            ))}
          </dl>
        )}
        {p.m.special && <p className="tm-sheet-skill"><Zap size={15} aria-hidden="true" /> <span>Arme</span> {p.m.special}</p>}
        {p.m.bankai && <p className="tm-sheet-skill"><Flame size={15} aria-hidden="true" /> <span>Bankai</span> <i lang="ja-Latn">{p.m.bankai}</i></p>}
        {!preview && <Link className="gk-btn gk-btn--sm tm-sheet-link" href={`/membres/${p.m.id}`}>Sa fiche <ArrowRight size={15} aria-hidden="true" /></Link>}
      </div>
    </aside>
  );
}
