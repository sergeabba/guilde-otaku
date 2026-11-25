"use client";

// Navigation des prototypes : une barre fine (logo, numéro de la semaine) et un
// bouton « Sommaire » qui ouvre la table des matières de la Guilde en plein écran,
// comme le sommaire d'un magazine. Échap ou retour du téléphone le ferment.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useBackClose } from "../hooks/useBackClose";

const TOC: { group: string; items: [string, string, string][] }[] = [
  { group: "La Guilde", items: [["/studio/accueil", "L'hebdo de la Guilde", "Accueil"], ["/studio/annuaire", "La collection des membres", "Annuaire"], ["/birthdays", "Les anniversaires", "Fête"], ["/wanted", "Les avis de recherche", "Wanted"]] },
  { group: "Compétition", items: [["/fighters", "Guilde Fighters", "Arcade"], ["/teams", "Les Teams", "Jour de match"], ["/jeux", "La salle de jeux", "Quiz"]] },
  { group: "Culture", items: [["/bibliotheque", "La bibliothèque", "Chroniques"], ["/cinema", "Le cinéma", "Salle obscure"], ["/calendrier", "Le calendrier", "Diffusion"], ["/film-semaine", "Le film de la semaine", "Vote"]] },
  { group: "Bonus", items: [["/atelier", "Les futilités", "Atelier"], ["/bons-plans", "Les bons plans", "Adresses"]] },
];

export default function StudioNav({ issue, dark = false }: { issue: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);
  useBackClose(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); btn.current?.focus(); };
  }, [open]);
  let n = 0;
  return (
    <>
      <header className={`st-nav${dark ? " is-dark" : ""}`}>
        <Link href="/studio/accueil" className="st-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-header.png" alt="" width={34} height={30} />
          <span>GUILDE OTAKU</span>
        </Link>
        <span className="st-nav-issue">{issue}</span>
        <button ref={btn} type="button" className="st-nav-open" aria-expanded={open} aria-controls="st-toc" onClick={() => setOpen(true)}><i aria-hidden="true" /> Sommaire</button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.nav id="st-toc" className="st-toc r-hebdo" aria-label="Sommaire de la Guilde"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }} animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }} transition={{ duration: reduce ? 0.12 : 0.42, ease: [0.22, 1, 0.36, 1] }}>
            <div className="st-toc-head">
              <button type="button" className="st-toc-close" onClick={() => setOpen(false)} autoFocus>Fermer</button>
              <p className="t-display st-toc-title">Sommaire</p>
            </div>
            <div>
              {TOC.map((g) => (
                <div key={g.group}>
                  <p className="st-toc-group">{g.group}</p>
                  <ol>
                    {g.items.map(([href, label, tag]) => (
                      <li key={href}><Link href={href} onClick={() => setOpen(false)}><b>{String(++n).padStart(2, "0")}</b><span className="t-edit">{label}</span><small>{tag}</small></Link></li>
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
