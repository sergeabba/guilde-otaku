"use client";

// Navigation des prototypes. Le sommaire plein écran complète la navigation rapide,
// il ne la remplace pas :
// - ordinateur : liens rapides dans la barre, recherche (Ctrl K), sommaire ;
// - téléphone : barre d'onglets en bas (mêmes rubriques que le site), sommaire en dernier onglet.
// Échap, le retour du téléphone et le bouton Fermer referment le sommaire ; le focus y reste piégé.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { useBackClose } from "../hooks/useBackClose";
import { openSearch } from "../components/GuildeHeader";
import { IconBiblio, IconFighters, IconGuilde, IconSommaire, IconTeams } from "../components/GuildeIcons";
import { DUR, EASE } from "../../lib/motion";

const QUICK = [
  { href: "/studio/accueil", label: "L'hebdo", short: "Hebdo", Icon: IconGuilde, match: /^\/studio\/accueil/ },
  { href: "/studio/annuaire", label: "Collection", short: "Membres", Icon: IconTeams, match: /^\/studio\/(annuaire|membre)/ },
  { href: "/fighters", label: "Fighters", short: "Fighters", Icon: IconFighters, match: /^\/fighters/ },
  { href: "/bibliotheque", label: "Bibliothèque", short: "Biblio", Icon: IconBiblio, match: /^\/bibliotheque/ },
] as const;

const TOC: { group: string; items: [string, string, string][] }[] = [
  { group: "La Guilde", items: [["/studio/accueil", "L'hebdo de la Guilde", "Accueil"], ["/studio/accueil/archives", "Les anciennes couvertures", "Archives"], ["/studio/annuaire", "La collection des membres", "Annuaire"], ["/birthdays", "Les anniversaires", "Fête"], ["/wanted", "Les avis de recherche", "Wanted"]] },
  { group: "Compétition", items: [["/fighters", "Guilde Fighters", "Arcade"], ["/teams", "Les Teams", "Jour de match"], ["/jeux", "La salle de jeux", "Quiz"]] },
  { group: "Culture", items: [["/bibliotheque", "La bibliothèque", "Chroniques"], ["/cinema", "Le cinéma", "Salle obscure"], ["/calendrier", "Le calendrier", "Diffusion"], ["/film-semaine", "Le film de la semaine", "Vote"]] },
  { group: "Bonus", items: [["/atelier", "Les futilités", "Atelier"], ["/bons-plans", "Les bons plans", "Adresses"]] },
];

export default function StudioNav({ issue, dark = false }: { issue: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const path = usePathname() ?? "";
  const btn = useRef<HTMLButtonElement>(null);
  const dockBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  useBackClose(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>("a, button");
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open]);

  const show = (from: HTMLButtonElement | null) => { opener.current = from; setOpen(true); };
  let n = 0;
  return (
    <>
      <header className={`st-nav${dark ? " is-dark" : ""}`}>
        <Link href="/studio/accueil" className="st-nav-logo" aria-label="Guilde Otaku, l'hebdo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-header.png" alt="" width={34} height={30} />
          <span>GUILDE OTAKU</span>
        </Link>
        <span className="st-nav-issue">{issue}</span>
        <nav className="st-nav-quick" aria-label="Navigation rapide">
          {QUICK.map((q) => <Link key={q.href} href={q.href} aria-current={q.match.test(path) ? "page" : undefined}>{q.label}</Link>)}
        </nav>
        <div className="st-nav-acts">
          <button type="button" className="st-nav-search" onClick={openSearch} aria-label="Rechercher dans la Guilde"><Search size={17} aria-hidden="true" /><kbd>Ctrl K</kbd></button>
          <button ref={btn} type="button" className="st-nav-open" aria-expanded={open} aria-controls="st-toc" onClick={() => show(btn.current)}><i aria-hidden="true" /> Sommaire</button>
        </div>
      </header>

      <nav className="st-dock" aria-label="Navigation rapide">
        {QUICK.map(({ href, short, Icon, match }) => (
          <Link key={href} href={href} aria-current={match.test(path) ? "page" : undefined}><Icon aria-hidden="true" /><span>{short}</span></Link>
        ))}
        <button ref={dockBtn} type="button" onClick={() => show(dockBtn.current)} aria-expanded={open} aria-controls="st-toc"><IconSommaire aria-hidden="true" /><span>Sommaire</span></button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.nav ref={panel} id="st-toc" className="st-toc r-hebdo" aria-label="Sommaire de la Guilde" role="dialog" aria-modal="true"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }} animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }} transition={{ duration: reduce ? DUR.tap : DUR.enter, ease: EASE.out }}>
            <div className="st-toc-head">
              <button type="button" className="st-toc-close" onClick={() => setOpen(false)} autoFocus>Fermer</button>
              <p className="t-display st-toc-title">Sommaire</p>
              <button type="button" className="st-toc-search" onClick={() => { setOpen(false); openSearch(); }}><Search size={16} aria-hidden="true" /> Chercher un membre, une œuvre</button>
            </div>
            <div>
              {TOC.map((g) => (
                <div key={g.group}>
                  <p className="st-toc-group">{g.group}</p>
                  <ol>
                    {g.items.map(([href, label, tag]) => (
                      <li key={href}><Link href={href} aria-current={path === href ? "page" : undefined} onClick={() => setOpen(false)}><b>{String(++n).padStart(2, "0")}</b><span className="t-edit">{label}</span><small>{tag}</small></Link></li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
