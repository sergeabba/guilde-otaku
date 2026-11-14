import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AtelierTile } from "../../lib/atelier-server";
import WordReveal from "./WordReveal";

const WIDTHS = [1, 0.74, 1.32, 0.86, 1.12, 0.78, 1.24];

/**
 * Mur de l'Atelier : les images de la galerie, tirées au hasard à chaque visite,
 * défilent en bandes inclinées dans des sens opposés (CSS, en boucle). Survol :
 * la bande s'arrête, la case se redresse et montre son titre. Le défilement de la
 * page pousse les bandes en parallaxe. Moins d'animations : bandes fixes.
 */
export default function AtelierWall({ tiles }: { tiles: AtelierTile[] }) {
  if (tiles.length < 4) return null;
  const rowsN = tiles.length >= 18 ? 3 : 2;
  const rows = Array.from({ length: rowsN }, (_, r) => tiles.filter((_, i) => i % rowsN === r));
  // Une bande courte est répétée pour remplir les grands écrans sans trou.
  const fill = (row: AtelierTile[]) => { let out = row; while (out.length < 8) out = [...out, ...row]; return out; };

  return (
    <section className="gk-wall tone-dark" aria-labelledby="gk-wall-title">
      <div className="gk-wrap gk-wall-head">
        <div>
          <span className="gk-chapter"><b>✦</b><span>L&apos;ATELIER</span></span>
          <h2 id="gk-wall-title" className="gk-display"><WordReveal>Sorti de <em>l&apos;Atelier.</em></WordReveal></h2>
        </div>
        <div className="gk-wall-side">
          <p>Les créations de la Guilde, dans un ordre différent à chaque visite.</p>
          <Link href="/atelier" className="gk-story-link">Ouvrir l&apos;Atelier <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="gk-wall-stage" aria-hidden="true">
        <div className="gk-wall-tilt">
          {rows.map((row, r) => {
            const items = fill(row);
            return (
              <div key={r} className={`gk-wall-row is-${r % 2 ? "rev" : "fwd"}`} style={{ "--n": items.length } as React.CSSProperties}>
                <div className="gk-wall-track">
                  {[0, 1].map((copy) => items.map((t, i) => (
                    <Link
                      key={`${copy}-${i}`} href="/atelier" tabIndex={-1} className="gk-wall-tile"
                      style={{ "--w": WIDTHS[(i + r * 2) % WIDTHS.length], "--acc": t.accent, "--rot": `${(i + r) % 2 ? 1.4 : -1.2}deg` } as React.CSSProperties}
                    >
                      <Image src={t.src} alt="" fill sizes="(max-width: 899px) 220px, 340px" />
                      <span className="gk-wall-cap">{t.title}</span>
                    </Link>
                  )))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
