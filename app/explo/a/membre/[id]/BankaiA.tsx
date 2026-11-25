"use client";

// Le bankai et l'extension du territoire, version planche : une scène fixe pendant que le
// visiteur fait défiler 4 écrans. Une seule variable --p (0 à 1) pilote tout en CSS :
// 0-0,25 la planche se brise · 0,2 l'encre envahit · 0,28 « BAN… KAI ! » · 0,38 le personnage
// surgit, aux couleurs du membre · 0,5 gros plan (bande de regard) · 0,58 le nom du bankai ·
// 0,78 le territoire s'étend en cercle et transforme tout l'environnement.
// Mouvement réduit : la scène n'est pas fixée, l'état final s'affiche directement.
import { useEffect, useRef } from "react";
import type { ExploMember } from "../../../../../lib/explo-data";

export default function BankaiA({ m }: { m: ExploMember }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--p", "1"); el.dataset.static = "1"; return; }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  const c = m.cut;
  const src = c?.src ?? m.anime ?? m.real ?? "";
  const fx = c ? (c.box[0] + c.box[2]) / 2 : 50, fy = c ? c.box[1] + (c.box[3] - c.box[1]) * 0.13 : 20;
  const crop = (zoom: number, dy = 0) => ({ backgroundImage: `url(${src})`, backgroundSize: `${zoom * 100}% auto`, backgroundPosition: `${fx}% ${fy + dy}%` });
  return (
    <section ref={ref} className="xa-bk" aria-labelledby="xa-bk-title" style={{ "--p": 0, "--acc": m.accent, "--cut": `url(${src})` } as React.CSSProperties}>
      <h2 id="xa-bk-title" className="xp-sr">Bankai et extension du territoire de {m.first}</h2>
      {/* Texte complet, lisible par tous (la mise en scène est décorative). */}
      <div className="xp-sr">
        {m.bankai && <p>Bankai : {m.bankai.nom}, « {m.bankai.sens} ». {m.bankai.effet}</p>}
        {m.domaine && <p>Extension du territoire : {m.domaine.nom}, « {m.domaine.sens} ». {m.domaine.effet}</p>}
      </div>
      <div className="xa-bk-stage" aria-hidden="true">
        <div className="xa-bk-shards">
          {[[-1, -1, 2.2, -4], [1, -1, 1.6, 6], [-1, 1, 1.3, 12], [1, 1, 3.2, -2]].map(([dx, dy, z, dyc], k) => (
            <span key={k} className={`xa-shard s${k}`} style={{ "--dx": dx, "--dy": dy, ...crop(z, dyc) } as React.CSSProperties} />
          ))}
        </div>
        <span className="xa-bk-ink" />
        <span className="xa-bk-lines" />
        <p className="xa-bk-sfx"><span>BAN…</span><span>KAI !</span></p>
        <div className="xa-bk-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" />
          <span className="xa-bk-duo" />
        </div>
        <div className="xa-bk-band"><span style={crop(1.7, 3)} /></div>
        {m.bankai && (
          <div className="xa-bk-name">
            <p className="xa-bk-kind">Bankai</p>
            <p className="xa-bk-title">{m.bankai.nom}</p>
            <p className="xa-box xa-bk-sens">« {m.bankai.sens} »</p>
            <p className="xa-box xa-bk-fx">{m.bankai.effet}</p>
          </div>
        )}
        {m.domaine && (
          <div className="xa-dm">
            <span className="xa-dm-rings" />
            <svg className="xa-dm-ring" viewBox="0 0 400 400">
              <defs><path id={`xa-dm-${m.id}`} d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" /></defs>
              <text><textPath href={`#xa-dm-${m.id}`}>{`${m.domaine.nom} · ${m.domaine.nom} · ${m.domaine.nom} · `}</textPath></text>
            </svg>
            <div className="xa-dm-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </div>
            <div className="xa-dm-text">
              <p className="xa-bk-kind">Ryōiki tenkai</p>
              <p className="xa-dm-title">{m.domaine.nom}</p>
              <p className="xa-box">« {m.domaine.sens} » · {m.domaine.effet}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
