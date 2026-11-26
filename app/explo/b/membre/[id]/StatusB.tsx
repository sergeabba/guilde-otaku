"use client";

// Écran de statut (direction B). Onglets Statut / Pouvoirs / Palmarès / Univers (Q et E),
// membre précédent et suivant (← →), Échap pour revenir.
// Bankai : incrustation plein écran (bandes noires en diagonale, gros plan sur le regard,
// nom en lettres découpées), puis le résultat. Extension du territoire : toute l'interface
// change d'environnement (fond, anneaux, texte qui tourne) jusqu'à « Dissiper ».
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ExploMember } from "../../../../../lib/explo-data";
import { viewTransition, waitFor } from "../../../../../lib/view-transition";
import { Host } from "../../MenuB";
import Ransom from "../../../../components/Ransom";

type Tab = "statut" | "pouvoirs" | "palmares" | "univers";
const TABS: [Tab, string][] = [["statut", "Statut"], ["pouvoirs", "Pouvoirs"], ["palmares", "Palmarès"], ["univers", "Univers"]];
const roman = (n: number) => [["M", 1000], ["CM", 900], ["D", 500], ["CD", 400], ["C", 100], ["XC", 90], ["L", 50], ["XL", 40], ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]].reduce((a, [s, v]) => { while (n >= (v as number)) { a += s; n -= v as number; } return a; }, "");

function Radar({ s }: { s: { force: number; vitesse: number; technique: number } }) {
  const pt = (v: number, a: number) => `${100 + Math.cos(a) * v * .8},${100 + Math.sin(a) * v * .8}`;
  const A = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
  const vals = [s.force, s.vitesse, s.technique];
  return (
    <svg className="xs-radar" viewBox="0 0 200 200" role="img" aria-label={`Force ${s.force}, vitesse ${s.vitesse}, technique ${s.technique}`}>
      {[100, 66, 33].map((r) => <polygon key={r} points={A.map((a) => pt(r, a)).join(" ")} className="xs-radar-grid" />)}
      <polygon points={A.map((a, k) => pt(vals[k], a)).join(" ")} className="xs-radar-val" />
      {["Force", "Vitesse", "Technique"].map((l, k) => (
        <text key={l} x={100 + Math.cos(A[k]) * 96} y={100 + Math.sin(A[k]) * 96 + (k === 0 ? -6 : 14)} textAnchor="middle">{l} {vals[k]}</text>
      ))}
    </svg>
  );
}

export default function StatusB({ m, prev, next }: { m: ExploMember; prev: { id: number; name: string }; next: { id: number; name: string } }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("statut");
  const [skill, setSkill] = useState(m.bankai ? 1 : 0);
  const [cutin, setCutin] = useState(false);
  const [domain, setDomain] = useState(false);
  const src = m.cut?.src ?? m.anime ?? m.real ?? "";
  const c = m.cut, fx = c ? (c.box[0] + c.box[2]) / 2 : 50, fy = c ? c.box[1] + (c.box[3] - c.box[1]) * .13 : 20;
  const skills = [
    m.special && { k: "Attaque spéciale", name: m.special.name, sens: "", fx: m.special.effect, act: null },
    m.bankai && { k: "Bankai", name: m.bankai.nom, sens: m.bankai.sens, fx: m.bankai.effet, act: "bankai" as const },
    m.domaine && { k: "Extension du territoire", name: m.domaine.nom, sens: m.domaine.sens, fx: m.domaine.effet, act: "domain" as const },
  ].filter(Boolean) as { k: string; name: string; sens: string; fx: string; act: "bankai" | "domain" | null }[];
  const cur = skills[Math.min(skill, skills.length - 1)];

  const go = useCallback((id: number) => {
    const href = `/explo/b/membre/${id}`;
    viewTransition({ kind: "xb-slash", update: async () => { router.push(href); await waitFor(`[data-explo="${href}"]`, 1200); } });
  }, [router]);
  useEffect(() => { router.prefetch(`/explo/b/membre/${next.id}`); router.prefetch(`/explo/b/membre/${prev.id}`); }, [router, next.id, prev.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (cutin) setCutin(false); else if (domain) setDomain(false); else location.href = "/explo/b#nakama"; return; }
      if (cutin) return;
      const t = TABS.findIndex(([x]) => x === tab);
      if (e.key.toLowerCase() === "e") setTab(TABS[(t + 1) % TABS.length][0]);
      else if (e.key.toLowerCase() === "q") setTab(TABS[(t - 1 + TABS.length) % TABS.length][0]);
      else if (e.key === "ArrowRight") go(next.id); else if (e.key === "ArrowLeft") go(prev.id);
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [tab, cutin, domain, go, next.id, prev.id]);
  useEffect(() => { if (!cutin) return; const t = setTimeout(() => setCutin(false), reduce ? 6000 : 4200); return () => clearTimeout(t); }, [cutin, reduce]);

  const activate = (a: "bankai" | "domain" | null) => { if (a === "bankai") setCutin(true); if (a === "domain") setDomain(true); };

  return (
    <main className={`xb xs${domain ? " is-domain" : ""}`} data-explo={`/explo/b/membre/${m.id}`} style={{ "--acc": m.accent } as React.CSSProperties}>
      <div className="xb-bg" aria-hidden="true"><span className="xb-star" /><span className="xb-star is-2" /><span className="xb-stripes" /><span className="xs-rings" /></div>
      <a className="xs-menu" href="/explo/b#nakama"><span>Menu</span><kbd>Échap</kbd></a>

      <div className="xb-stage xs-stage"><Host m={m} big /></div>
      {domain && m.domaine && (
        <svg className="xs-ring" viewBox="0 0 400 400" aria-hidden="true">
          <defs><path id="xs-ring-p" d="M200,200 m-175,0 a175,175 0 1,1 350,0 a175,175 0 1,1 -350,0" /></defs>
          <text><textPath href="#xs-ring-p">{`${m.domaine.nom} ✦ ${m.domaine.sens} ✦ ${m.domaine.nom} ✦ `}</textPath></text>
        </svg>
      )}

      <header className="xs-head">
        <p className="xs-no">N° {roman(m.id)}</p>
        <Ransom text={m.first} as="h1" className="xs-name" />
        <div className="xs-card">
          <svg viewBox="0 0 120 170" aria-hidden="true" className="xs-card-frame">
            <rect x="4" y="4" width="112" height="162" rx="3" /><rect x="10" y="10" width="100" height="150" rx="2" />
            <path d="M60 18 L68 30 L60 42 L52 30 Z" /><path d="M60 128 L68 140 L60 152 L52 140 Z" />
            <circle cx="60" cy="85" r="26" /><path d="M34 85 H10 M86 85 H110" />
          </svg>
          <b>{m.rank}</b><span>{m.romaji}</span>
        </div>
      </header>

      {domain && m.domaine && (
        <div className="xs-dm-banner" role="status">
          <span>Ryōiki tenkai</span><b>{m.domaine.nom}</b>
          <button type="button" onClick={() => setDomain(false)}>Dissiper</button>
        </div>
      )}

      <section className="xs-panel" aria-label={`Statut de ${m.name}`}>
        <div className="xs-tabs" role="tablist" aria-label="Rubriques du statut">
          <kbd aria-hidden="true">Q</kbd>
          {TABS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {tab === k && <motion.span layoutId="xs-tab" className="xs-tab-ink" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 40 }} />}
              <span>{l}</span>
            </button>
          ))}
          <kbd aria-hidden="true">E</kbd>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} className="xs-body" role="tabpanel" initial={reduce ? false : { opacity: 0, x: 40, skewX: -6 }} animate={{ opacity: 1, x: 0, skewX: 0 }} exit={reduce ? undefined : { opacity: 0, x: -30 }} transition={{ duration: .22, ease: [.8, 0, .2, 1] }}>
            {tab === "statut" && (
              <div className="xs-statut">
                {m.stats ? <Radar s={m.stats} /> : <p className="xs-note">Pas encore de statistiques de combat.</p>}
                <div className="xs-bio">
                  <p className="xs-name-full">{m.name}{m.alias ? ` · « ${m.alias} »` : ""}</p>
                  <p>{m.bio || `La bio de ${m.first} n'est pas encore écrite.`}</p>
                  <p className="xs-chips">{[m.country, m.birthday, m.series ? `d'après ${m.series}` : null].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</p>
                </div>
              </div>
            )}
            {tab === "pouvoirs" && (skills.length ? (
              <div className="xs-skills">
                <ul>
                  {skills.map((s, k) => (
                    <li key={s.k}><button type="button" aria-pressed={k === skill} onClick={() => setSkill(k)}><small>{s.k}</small><b>{s.name}</b></button></li>
                  ))}
                </ul>
                <div className="xs-skill">
                  <p className="xs-skill-k">{cur.k}</p>
                  <p className="xs-skill-name">{cur.name}</p>
                  {cur.sens && <p className="xs-skill-sens">« {cur.sens} »</p>}
                  {cur.fx && <p>{cur.fx}</p>}
                  {cur.act && <button type="button" className="xb-go" onClick={() => activate(cur.act)}>{cur.act === "bankai" ? "Libérer le bankai" : "Étendre le territoire"}</button>}
                </div>
              </div>
            ) : <p className="xs-note">Aucun pouvoir n&apos;a encore été imaginé pour {m.first}.</p>)}
            {tab === "palmares" && (m.awards.length ? (
              <ul className="xs-medals">{m.awards.map((a, k) => <li key={k}><span aria-hidden="true">✦</span><b>{a.title}</b>{a.year && <small>{a.year}</small>}</li>)}</ul>
            ) : <p className="xs-note">Pas encore de distinction : le palmarès de {m.first} reste à écrire.</p>)}
            {tab === "univers" && (m.works.length ? (
              <ul className="xs-works">{m.works.map((w, k) => <li key={k} style={{ "--r": `${(k % 2 ? 1 : -1) * (2 + k)}deg` } as React.CSSProperties}>{/* eslint-disable-next-line @next/next/no-img-element */}{w.cover && <img src={w.cover} alt="" loading="lazy" />}<b>{w.title}</b></li>)}</ul>
            ) : <p className="xs-note">{m.first} n&apos;a pas encore rangé ses séries préférées.</p>)}
          </motion.div>
        </AnimatePresence>
      </section>

      <nav className="xs-nav" aria-label="Autres nakama">
        <button type="button" onClick={() => go(prev.id)}><kbd aria-hidden="true">←</kbd> {prev.name}</button>
        <button type="button" onClick={() => go(next.id)}>{next.name} <kbd aria-hidden="true">→</kbd></button>
      </nav>

      <AnimatePresence>
        {cutin && m.bankai && (
          <motion.div className="xs-cutin" role="dialog" aria-modal="true" aria-label={`Bankai : ${m.bankai.nom}`} onClick={() => setCutin(false)}
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
            <span className="xs-ci-flash" />
            <span className="xs-ci-bar is-a" /><span className="xs-ci-bar is-b" />
            <div className="xs-ci-band"><span style={{ backgroundImage: `url(${src})`, backgroundPosition: `${fx}% ${fy + 3}%` }} /></div>
            <Ransom text="Bankai" as="p" className="xs-ci-word" />
            <p className="xs-ci-name">{m.bankai.nom}</p>
            <div className="xs-ci-res"><b>« {m.bankai.sens} »</b><span>{m.bankai.effet}</span></div>
            <button type="button" className="xs-ci-close" onClick={() => setCutin(false)} autoFocus>Fermer <kbd>Échap</kbd></button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
