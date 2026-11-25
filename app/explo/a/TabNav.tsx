"use client";

// Navigation A : les onglets de tranche d'un livre, sur le bord droit de la page.
// Au survol ou au focus, l'onglet sort de la tranche et montre son « hôte », un membre choisi
// d'après les données (le plus fort pour Fighters, le plus lecteur pour la Bibliothèque…).
// Téléphone : un marque-page rouge en bas à droite déplie un sommaire en planche de cases.
import { useEffect, useState } from "react";
import { useBackClose } from "../../hooks/useBackClose";

interface Host { id: number; name: string; src: string | null; box: number[] | null }
interface Tab { href: string; label: string; why: string; host: Host | null }

function HostImg({ h }: { h: Host }) {
  if (!h.src) return null;
  const fx = h.box ? (h.box[0] + h.box[2]) / 2 : 50, fy = h.box ? h.box[1] + (h.box[3] - h.box[1]) * .14 : 20;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={h.src} alt="" loading="lazy" style={{ objectPosition: `${fx}% ${fy}%`, transformOrigin: `${fx}% ${fy}%`, transform: "scale(1.9)" }} />;
}

export default function TabNav({ hosts }: { hosts: Tab[] }) {
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <a className="xa-logo" href="/explo/a" aria-label="Guilde Otaku">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="" width={44} height={38} />
      </a>
      <nav className="xa-tabs" aria-label="Rubriques">
        {hosts.map((t, i) => (
          <a key={t.href} href={t.href} className="xa-tab" style={{ "--i": i } as React.CSSProperties}>
            <span className="xa-tab-label">{t.label}</span>
            {t.host && <span className="xa-tab-peek" aria-hidden="true"><HostImg h={t.host} /><small>{t.why} · {t.host.name}</small></span>}
          </a>
        ))}
      </nav>
      <button type="button" className="xa-ribbon" aria-expanded={open} onClick={() => setOpen(true)}>Sommaire</button>
      {open && (
        <div className="xa-toc" role="dialog" aria-modal="true" aria-label="Sommaire">
          <button type="button" className="xa-toc-close" onClick={() => setOpen(false)} autoFocus>Fermer</button>
          {hosts.map((t, i) => (
            <a key={t.href} href={t.href} className={`xa-toc-k xa-tk${i}`} onClick={() => setOpen(false)}>
              {t.host && <HostImg h={t.host} />}
              <b>{t.label}</b>{t.why && t.host && <small>{t.why} : {t.host.name}</small>}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
