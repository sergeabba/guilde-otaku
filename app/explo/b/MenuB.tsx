"use client";

// Le menu principal (direction B). Deux écrans dans la même page :
// - le menu : rubriques en barres inclinées, curseur triangulaire, hôte de la rubrique en grand ;
// - « Nakama » : sélection d'équipe, cartes inclinées, membre sélectionné en grand.
// Clavier : ↑ ↓ (menu), ← → (équipe), Entrée, Échap. Retour du téléphone : revient au menu.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ExploMember } from "../../../lib/explo-data";
import { useBackClose } from "../../hooks/useBackClose";
import { viewTransition, waitFor } from "../../../lib/view-transition";
import Ransom from "./Ransom";

export interface BEntry { id: string; label: string; href: string; host: number; why: string }

export function Host({ m, big = false }: { m: ExploMember; big?: boolean }) {
  const src = m.cut?.src ?? m.anime ?? m.real ?? "";
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` } as React.CSSProperties;
  return (
    <div className={`xb-host${big ? " is-big" : ""}${m.cut ? "" : " is-plain"}`} style={{ "--acc": m.accent } as React.CSSProperties}>
      <span className="xb-sil is-acc" style={mask} />
      <span className="xb-sil is-ink" style={mask} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${m.name}, version anime`} data-explo-hero="" />
    </div>
  );
}

export default function MenuB({ members, entries, hud }: { members: ExploMember[]; entries: BEntry[]; hud: { day: string; date: string; week: number; count: number; ranks: number } }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const cast = useMemo(() => members.filter((m) => m.cut), [members]);
  const [i, setI] = useState(0);
  const [party, setParty] = useState(false);
  const [sel, setSel] = useState(0);
  useBackClose(party, () => setParty(false));
  const host = byId.get(entries[i].host)!;
  const pm = cast[sel];

  const open = useCallback((href: string) => {
    viewTransition({ kind: "xb-slash", update: async () => { router.push(href); await waitFor(`[data-explo="${href}"]`, 1200); } });
  }, [router]);
  const activate = useCallback((k: number) => {
    const e = entries[k];
    if (e.id === "nakama") { setParty(true); setSel(Math.max(0, cast.findIndex((c) => c.id === e.host))); return; }
    location.href = e.href;
  }, [entries, cast]);

  useEffect(() => {
    if (location.hash === "#nakama") void Promise.resolve().then(() => setParty(true));
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (!party) {
        if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => (x + 1) % entries.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => (x - 1 + entries.length) % entries.length); }
        else if (e.key === "Enter") { e.preventDefault(); activate(i); }
      } else {
        if (e.key === "ArrowRight") { e.preventDefault(); setSel((x) => (x + 1) % cast.length); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); setSel((x) => (x - 1 + cast.length) % cast.length); }
        else if (e.key === "Enter") { e.preventDefault(); open(`/explo/b/membre/${cast[sel].id}`); }
        else if (e.key === "Escape") { e.preventDefault(); setParty(false); }
      }
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [party, i, sel, entries.length, cast, activate, open]);

  // Carte sélectionnée gardée visible dans la rangée.
  useEffect(() => { if (party) document.querySelector(`[data-card="${sel}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" }); }, [sel, party, reduce]);

  const slash = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : {
    initial: { clipPath: "polygon(100% 0, 130% 0, 100% 100%, 70% 100%)", x: 80 },
    animate: { clipPath: "polygon(-30% 0, 130% 0, 100% 100%, -60% 100%)", x: 0 },
    exit: { clipPath: "polygon(-30% 0, -30% 0, -60% 100%, -60% 100%)", x: -60 },
  };

  return (
    <main className={`xb${party ? " is-party" : ""}`} data-explo="/explo/b" style={{ "--acc": (party ? pm : host).accent } as React.CSSProperties}>
      <div className="xb-bg" aria-hidden="true"><span className="xb-star" /><span className="xb-star is-2" /><span className="xb-stripes" /></div>

      {/* Bloc de date, en haut à gauche : semaine, jour, compteurs réels. */}
      <div className="xb-hud">
        <p className="xb-hud-week"><small>Hebdo</small><b>{hud.week}</b></p>
        <p className="xb-hud-day"><b>{hud.day}</b><span>{hud.date}</span></p>
        <p className="xb-hud-count">{hud.count} nakama · {hud.ranks} grades</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a className="xb-logo" href="/explo/b" aria-label="Guilde Otaku"><img src="/logo-header.png" alt="" width={44} height={38} /></a>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={party ? `p${pm.id}` : `m${host.id}`} className="xb-stage" {...slash} transition={{ duration: reduce ? .15 : .45, ease: [.8, 0, .2, 1] }}>
          <Host m={party ? pm : host} big />
        </motion.div>
      </AnimatePresence>

      {!party ? (
        <nav className="xb-menu" aria-label="Menu principal">
          <ul>
            {entries.map((e, k) => (
              <li key={e.id} className={k === i ? "is-on" : ""} style={{ "--k": k } as React.CSSProperties}>
                <a href={e.href} onMouseEnter={() => setI(k)} onFocus={() => setI(k)} onClick={(ev) => { if (e.id === "nakama") { ev.preventDefault(); activate(k); } }}
                  aria-current={k === i ? "true" : undefined}>
                  {k === i && <motion.span layoutId="xb-bar" className="xb-bar" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 38 }} />}
                  {k === i && <motion.span layoutId="xb-cursor" className="xb-cursor" aria-hidden="true" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }} />}
                  {k === i ? <Ransom text={e.label} className="xb-item is-ransom" /> : <span className="xb-item">{e.label}</span>}
                </a>
              </li>
            ))}
          </ul>
          <p className="xb-why" key={entries[i].id}><span>{entries[i].why}</span><b>{host.name}</b></p>
        </nav>
      ) : (
        <section className="xb-party" aria-label="Sélection des nakama">
          <div className="xb-party-head">
            <button type="button" className="xb-back" onClick={() => setParty(false)}>‹ Menu</button>
            <Ransom text="Choisis ton nakama" as="h1" className="xb-party-title" />
          </div>
          <div className="xb-pick">
            <Ransom key={pm.id} text={pm.first} as="p" className="xb-pick-name" />
            <p className="xb-pick-rank"><b>{pm.rank}</b><span>{pm.romaji}</span></p>
            {pm.bankai && <p className="xb-pick-skill"><small>Bankai</small>{pm.bankai.nom}</p>}
            <button type="button" className="xb-go" onClick={() => open(`/explo/b/membre/${pm.id}`)}>Voir le statut <kbd>Entrée</kbd></button>
          </div>
          <ul className="xb-roster" role="listbox" aria-label="Nakama" aria-activedescendant={`xb-c${sel}`}>
            {cast.map((m, k) => (
              <li key={m.id} id={`xb-c${k}`} data-card={k} role="option" aria-selected={k === sel} className={k === sel ? "is-on" : ""} style={{ "--acc": m.accent } as React.CSSProperties}>
                <button type="button" onMouseEnter={() => setSel(k)} onFocus={() => setSel(k)}
                  // Au toucher, le focus arrive avant le clic : on retient si la carte était déjà choisie
                  // au moment de l'appui, pour qu'un premier toucher sélectionne seulement.
                  onPointerDown={(e) => { e.currentTarget.dataset.was = String(k === sel); }}
                  onClick={(e) => { const was = e.currentTarget.dataset.was; delete e.currentTarget.dataset.was; if (was === "true" || (was === undefined && k === sel)) open(`/explo/b/membre/${m.id}`); else setSel(k); }}
                  aria-label={`${m.name}, ${m.rank}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.cut!.src} alt="" loading="lazy" />
                  <span>{m.first}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="xb-keys" aria-hidden="true">{party ? "← → Choisir · Entrée Valider · Échap Retour" : "↑ ↓ Choisir · Entrée Valider"}</p>
    </main>
  );
}
