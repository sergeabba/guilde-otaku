"use client";

// Les chapitres du tome. Chaque mise en scène dépend du contenu réel :
// - Origines : grande citation si la bio est courte, colonnes avec lettrine si elle est longue ;
// - Pouvoirs : révélations (bankai en plan de cinéma, extension du territoire qui s'ouvre),
//   rejouables par un bouton, figées si le visiteur demande moins d'animations ;
// - Palmarès : une distinction seule devient une plaque d'honneur, plusieurs forment une vitrine ;
// - Univers : un ou deux favoris en double page, au-delà une étagère ;
// - Générique : la musique favorite, sans lecture automatique, Spotify et YouTube distincts ;
// - Liens : seulement les liens prouvés par les données.
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { ExternalLink, Pause, Play } from "lucide-react";
import Image from "../../../components/GImage";
import WorkSheet from "../../../components/works/WorkSheet";
import { useMusicDock } from "../../../components/MusicDock";
import { flagUrl } from "../../../config/countries";
import { isPlayable, openUrl, PROVIDER_LABEL } from "../../../../lib/music";
import type { MemberLink, StudioMember, StudioWork } from "../../../../lib/studio-data";
import type { MemberActivity } from "../../../../lib/member-activity";
import { workKey, type MemberTrack } from "../../../../lib/member-extras";
import { goTome } from "../../tome-nav";
import { useRouter } from "next/navigation";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function Head({ n, title, kicker }: { n: number; title: string; kicker?: string }) {
  return (
    <header className="tm2-ch-head">
      <p className="t-logo">Chapitre {n}</p>
      <h2 className="t-display">{title}</h2>
      {kicker && <p className="tm2-ch-kicker t-edit">{kicker}</p>}
    </header>
  );
}

// ─── 1. Origines ──────────────────────────────────────────────────────────────
export function Origines({ m, n }: { m: StudioMember; n: number }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!m.birthDay || !m.birthMonth) return;
    const now = new Date(), t = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let d = new Date(now.getFullYear(), m.birthMonth - 1, m.birthDay).getTime();
    if (d < t) d = new Date(now.getFullYear() + 1, m.birthMonth - 1, m.birthDay).getTime();
    void Promise.resolve().then(() => setDays(Math.round((d - t) / 86400000)));
  }, [m.birthDay, m.birthMonth]);
  const short = m.bio.trim().length > 0 && m.bio.trim().length <= 180;
  return (
    <section id="ch-origines" className={`tm2-ch tm2-origines${short ? " is-quote" : ""}`}>
      <Head n={n} title="Origines" />
      <div className="tm2-orig-grid">
        <div className="tm2-bio t-edit">
          {m.bio ? (short ? <blockquote><p>{m.bio}</p></blockquote> : <p>{m.bio}</p>) : <p className="tm2-muted">La bio de {m.first} n&apos;est pas encore écrite.</p>}
          {m.real && m.anime && (
            <figure className="tm2-polaroid">
              <span><Image src={m.real} alt={`${m.name}, photo`} fill sizes="240px" style={{ objectFit: "cover", objectPosition: m.realPos }} /></span>
              <figcaption className="t-edit">{m.first}, dans le monde réel.</figcaption>
            </figure>
          )}
        </div>
        <dl className="tm2-facts">
          <div><dt className="t-ui">Numéro</dt><dd className="t-logo">N°{String(m.id).padStart(3, "0")}</dd></div>
          <div><dt className="t-ui">Grade</dt><dd className="r-dense"><span className="t-display">{m.rank}</span></dd></div>
          {m.country && <div><dt className="t-ui">Pays</dt><dd>{/* eslint-disable-next-line @next/next/no-img-element */}{m.flag && <img src={flagUrl(m.flag)} alt="" width={24} height={16} />} {m.country}</dd></div>}
          {m.birthDay && m.birthMonth && <div><dt className="t-ui">Anniversaire</dt><dd>{m.birthDay} {MONTHS[m.birthMonth - 1]}{days !== null && <small className="t-logo">{days === 0 ? "aujourd'hui !" : days === 1 ? "demain" : `J-${days}`}</small>}</dd></div>}
        </dl>
      </div>
    </section>
  );
}

// ─── 2. Pouvoirs ──────────────────────────────────────────────────────────────
/** Révélation déclenchée à l'arrivée à l'écran, rejouable : la clé relance les animations CSS. */
function Reveal({ className, stage, replay, children }: { className: string; stage: string; replay: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.45 });
  const [take, setTake] = useState(0);
  return (
    <div ref={ref} className={`${className}${seen ? " is-on" : ""}`}>
      <div key={take} className={stage}>{children}</div>
      <button type="button" className="tm2-replay t-ui" onClick={() => setTake((t) => t + 1)}>{replay}</button>
    </div>
  );
}

function Letters({ text }: { text: string }) {
  return <>{[...text].map((c, i) => <span key={i} className="tm2-l" style={{ "--i": i } as React.CSSProperties}>{c === " " ? " " : c}</span>)}</>;
}

export function Pouvoirs({ m, n }: { m: StudioMember; n: number }) {
  return (
    <section id="ch-pouvoirs" className="tm2-ch tm2-power r-kiri">
      <Head n={n} title="Pouvoirs" kicker={m.bankai || m.domaine ? "Bankai et territoire imaginés par la Guilde" : undefined} />
      {(m.stats || m.special) && (
        <div className="tm2-hud">
          {m.stats && (
            <dl className="tm2-stats">
              {(["force", "vitesse", "technique"] as const).map((k) => (
                <div key={k} style={{ "--v": m.stats![k] } as React.CSSProperties}><dt className="t-ui">{k}</dt><dd className="t-data">{m.stats![k]}</dd><i aria-hidden="true" /></div>
              ))}
            </dl>
          )}
          {m.special && (
            <div className="tm2-special"><p className="tm2-move-kind t-ui">Attaque spéciale</p><p className="tm2-move-name t-display">{m.special.name}</p>{m.special.effect && <p className="tm2-move-fx">{m.special.effect}</p>}</div>
          )}
        </div>
      )}
      {m.bankai && (
        <Reveal className="tm2-bankai" stage="tm2-bk-stage" replay="Revoir le bankai">
          <span className="tm2-bars" aria-hidden="true" /><span className="tm2-flash" aria-hidden="true" />
          <p className="tm2-sfx t-display" aria-hidden="true">Ban… kai !</p>
          <p className="tm2-move-kind t-ui">Bankai</p>
          <h3 className="tm2-move-name t-display" aria-label={m.bankai.nom}><span aria-hidden="true"><Letters text={m.bankai.nom} /></span></h3>
          <p className="tm2-move-sens t-data">{m.bankai.sens}</p>
          <p className="tm2-move-fx">{m.bankai.effet}</p>
        </Reveal>
      )}
      {m.domaine && (
        <Reveal className="tm2-domain" stage="tm2-dm-stage" replay="Rouvrir le territoire">
          <span className="tm2-dm-field" aria-hidden="true" />
          <p className="tm2-move-kind t-ui">Ryōiki tenkai · extension du territoire</p>
          <h3 className="tm2-move-name t-display">{m.domaine.nom}</h3>
          <p className="tm2-move-sens t-data">{m.domaine.sens}</p>
          <p className="tm2-move-fx">{m.domaine.effet}</p>
        </Reveal>
      )}
    </section>
  );
}

// ─── 3. Palmarès ──────────────────────────────────────────────────────────────
export function Palmares({ m, n }: { m: StudioMember; n: number }) {
  const solo = m.awards.length === 1;
  return (
    <section id="ch-palmares" className={`tm2-ch tm2-awards r-dense${solo ? " is-solo" : ""}`}>
      <Head n={n} title="Palmarès" kicker={solo ? "Distinction d'honneur" : `${m.awards.length} distinctions`} />
      <ol className="tm2-plaques">
        {m.awards.map((a, i) => (
          <li key={i} style={{ "--i": i } as React.CSSProperties}>
            <span className="tm2-plaque-year t-data">{a.year ?? "Kunshō"}</span>
            <b className="t-display">{a.title}</b>
            {a.description && <p className="t-edit">{a.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── 4. Univers ───────────────────────────────────────────────────────────────
export function Univers({ m, n, chroniques }: { m: StudioMember; n: number; chroniques: Record<string, string> }) {
  const [open, setOpen] = useState<StudioWork | null>(null);
  const feature = m.works.length <= 2;
  return (
    <section id="ch-univers" className={`tm2-ch tm2-univers${feature ? " is-feature" : ""}`}>
      <Head n={n} title="Univers" kicker={`Ce qui fait vibrer ${m.first}`} />
      <ul className="tm2-shelf">
        {m.works.map((w, i) => (
          <li key={w.key} style={{ "--r": `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` } as React.CSSProperties}>
            <button type="button" className="tm2-work" onClick={() => setOpen(w)} aria-haspopup="dialog" aria-label={`${w.title}, ${w.kind.toLowerCase()} : ouvrir la mini-fiche`}>
              <span className="tm2-cover-img">{w.cover && <Image src={w.cover} alt="" fill sizes={feature ? "(max-width: 899px) 70vw, 360px" : "(max-width: 899px) 44vw, 200px"} style={{ objectFit: "cover" }} />}</span>
              <span className="tm2-work-txt"><b className="t-ui">{w.title}</b><small className="t-ui">{w.kind}{w.year ? ` · ${w.year}` : ""}</small>
                {feature && w.raw.synopsis && <span className="tm2-work-syn">{w.raw.synopsis.slice(0, 220)}{w.raw.synopsis.length > 220 ? "…" : ""}</span>}</span>
            </button>
            {w.note && <p className="tm2-note t-edit">« {w.note} »</p>}
          </li>
        ))}
      </ul>
      {open && <WorkSheet key={open.key} work={open.raw} chronique={chroniques[workKey(open.raw)]} onClose={() => setOpen(null)} />}
    </section>
  );
}

// ─── 5. Générique ─────────────────────────────────────────────────────────────
export function Generique({ m, n }: { m: StudioMember; n: number }) {
  const dock = useMusicDock();
  const queue = m.music.filter(isPlayable).map((t) => ({ ...t, owner: m.first }));
  const lead = m.music[0];
  const leadOn = !!dock && dock.isCurrent(lead) && dock.playing;
  const play = (t: MemberTrack) => {
    if (!dock) return;
    if (dock.isCurrent(t)) { dock.toggle(); return; }
    dock.play(queue, Math.max(0, queue.findIndex((q) => q.provider === t.provider && q.id === t.id)));
  };
  const full = (t: MemberTrack) => dock?.play([{ provider: "youtube", id: t.fullVideo!, title: t.title, artist: t.artist, cover: `https://i.ytimg.com/vi/${t.fullVideo}/mqdefault.jpg`, owner: m.first }], 0);
  const cover = (t: MemberTrack) => t.cover ?? (t.provider === "youtube" ? `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg` : null);
  return (
    <section id="ch-generique" className="tm2-ch tm2-gen">
      <Head n={n} title="Générique" kicker={`Le morceau qui ouvre le tome de ${m.first}`} />
      <div className="tm2-gen-lead">
        <div className={`tm2-vinyl${leadOn ? " is-playing" : ""}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover(lead) && <img src={cover(lead)!} alt="" width={240} height={240} loading="lazy" decoding="async" />}
        </div>
        <div className="tm2-gen-info">
          <p className="t-ui tm2-gen-kind">Musique favorite</p>
          <p className="t-display tm2-gen-title">{lead.title ?? "Morceau sans titre"}</p>
          {lead.artist && <p className="t-edit tm2-gen-artist">{lead.artist}</p>}
          <Services t={lead} on={leadOn} play={play} full={full} />
        </div>
      </div>
      {m.music.length > 1 && (
        <ol className="tm2-gen-list">
          {m.music.slice(1).map((t) => {
            const on = !!dock && dock.isCurrent(t) && dock.playing;
            return (
              <li key={`${t.provider}:${t.id}`} className={on ? "is-on" : ""}>
                <span className="tm2-gen-txt"><b>{t.title ?? "Morceau sans titre"}</b>{t.artist && <small>{t.artist}</small>}</span>
                <Services t={t} on={on} play={play} full={full} compact />
              </li>
            );
          })}
        </ol>
      )}
      <p className="tm2-gen-note">Rien ne se lance tout seul. Le lecteur reste en bas de l&apos;écran pendant la navigation.</p>
    </section>
  );
}

function Services({ t, on, play, full, compact = false }: { t: MemberTrack; on: boolean; play: (t: MemberTrack) => void; full: (t: MemberTrack) => void; compact?: boolean }) {
  const label = [t.title, t.artist].filter(Boolean).join(" · ") || "ce morceau";
  if (!isPlayable(t)) return <p className="tm2-gen-legacy">Apple Music n&apos;est plus lu sur le site.</p>;
  return (
    <div className={`tm2-services${compact ? " is-compact" : ""}`}>
      <button type="button" className={`tm2-svc m-press is-${t.provider}`} onClick={() => play(t)} aria-label={on ? `Pause : ${label}` : `Écouter ${label} sur ${t.provider === "spotify" ? "Spotify, extrait de 30 secondes" : "YouTube"}`}>
        {on ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        <span className="t-ui">{t.provider === "spotify" ? "Spotify · extrait" : "YouTube"}</span>
      </button>
      {t.provider === "spotify" && t.fullVideo && (
        <button type="button" className="tm2-svc m-press is-youtube" onClick={() => full(t)} aria-label={`Écouter ${label} en entier sur YouTube`}>
          <Play size={16} aria-hidden="true" /><span className="t-ui">YouTube · en entier</span>
        </button>
      )}
      {!compact && (
        <a className="tm2-svc-ext" href={openUrl(t)} target="_blank" rel="noopener noreferrer">
          Ouvrir dans {PROVIDER_LABEL[t.provider]} <ExternalLink size={13} aria-hidden="true" /><span className="st-sr"> (nouvel onglet)</span>
        </a>
      )}
    </div>
  );
}

// ─── 6. Liens ─────────────────────────────────────────────────────────────────
const LINK_KIND: Record<MemberLink["kind"], string> = { cite: "Palmarès", team: "Équipe", oeuvres: "Goûts", pays: "Pays" };

export function Liens({ m, n, links }: { m: StudioMember; n: number; links: MemberLink[] }) {
  const router = useRouter();
  return (
    <section id="ch-liens" className="tm2-ch tm2-links">
      <Head n={n} title="Liens" kicker={`Les autres héros qui croisent la route de ${m.first}`} />
      <ul className="tm2-link-grid">
        {links.map((l) => (
          <li key={l.id} style={{ "--a": l.accent } as React.CSSProperties}>
            <a href={`/studio/membre/${l.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); goTome(router, l.id, "open", e.currentTarget.querySelector(".tm2-link-img")); }}>
              <span className="tm2-link-img">{l.image && <Image src={l.image} alt="" fill sizes="(max-width: 899px) 30vw, 160px" style={{ objectFit: "cover", objectPosition: l.pos }} />}</span>
              <span className="tm2-link-kind t-ui">{LINK_KIND[l.kind]}</span>
              <b className="t-display">{l.name}</b>
              <small className="t-edit">{l.reason}</small>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Hors-série : activité réelle (jeux, votes), chargée à l'approche ─────────
interface Badge { id: string; label: string; tier: string; desc?: string }

export function HorsSerie({ m }: { m: StudioMember }) {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { once: true, margin: "400px 0px" });
  const [act, setAct] = useState<MemberActivity | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => {
    if (!near) return;
    let alive = true;
    fetch(`/api/membres/activite?id=${m.id}`).then((r) => r.json()).then((d) => alive && setAct(d)).catch(() => {});
    fetch(`/api/games/badges?member=${m.id}`).then((r) => r.json()).then((d) => alive && setBadges(d.members?.[0]?.badges ?? [])).catch(() => {});
    return () => { alive = false; };
  }, [near, m.id]);
  const records = act?.records ?? [], films = act?.films ?? [];
  const empty = !records.length && !films.length && !badges.length && !(act?.bash?.watch || act?.bash?.skip);
  return (
    <section ref={ref} className={`tm2-extra r-kiri${act && empty ? " is-empty" : ""}`} aria-label={`Hors-série : ${m.first} dans les jeux et les votes`} hidden={!!act && empty}>
      {act && !empty && (
        <>
          <p className="t-display tm2-extra-title">Hors-série</p>
          {badges.length > 0 && <ul className="tm2-badges">{badges.map((b) => <li key={b.id} className={`is-${b.tier}`} title={b.desc}>{b.label}</li>)}</ul>}
          {records.length > 0 && (
            <ol className="tm2-records">
              {records.slice(0, 6).map((r) => (
                <li key={r.game} style={{ "--v": r.pct } as React.CSSProperties}><span className="t-ui">{r.label}</span><b className="t-data">{r.best}<small>/{r.bestMax}</small></b><i aria-hidden="true" /></li>
              ))}
            </ol>
          )}
          {films.length > 0 && <p className="tm2-extra-line t-edit">{films.length} vote{films.length > 1 ? "s" : ""} pour le film de la semaine{films.some((f) => f.won) ? `, dont ${films.filter((f) => f.won).length} gagnant${films.filter((f) => f.won).length > 1 ? "s" : ""}` : ""}.</p>}
        </>
      )}
    </section>
  );
}
