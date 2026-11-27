"use client";

// Le classement des primes, mis en scène : les quatre plus grosses têtes (les « Yonkō » de la
// Guilde) en grand, prime révélée quand l'affiche entre à l'écran (le compteur défile), puis
// tout le registre en barres comparées. Données : primes calculées par lib/wanted (fiche réelle).
import { useEffect, useRef, useState } from "react";
import { formatBounty } from "../../lib/wanted";
import type { Member } from "../../data/members";

type Ranked = { m: Member; prime: number; src: string | null };

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { void Promise.resolve().then(() => setOn(true)); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

/** Montant qui défile jusqu'à sa valeur une fois révélé (≈ 900 ms, s'arrête net sur la vraie prime). */
function Count({ value, on }: { value: number; on: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, value]);
  return <>{formatBounty(on ? v : 0)}</>;
}

function Emperor({ r, i, onPick }: { r: Ranked; i: number; onPick: (id: number) => void }) {
  const [ref, on] = useReveal<HTMLButtonElement>();
  return (
    <button ref={ref} type="button" className={`bb-emp n${i + 1}${on ? " is-on" : ""}`} onClick={() => onPick(r.m.id)} aria-label={`${i + 1}e prime : ${r.m.name}, ${formatBounty(r.prime)} berrys. Voir son avis`}>
      <span className="bb-emp-img">{r.src && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.src} alt="" loading="lazy" />}</span>
      <span className="bb-emp-no" aria-hidden="true">{i + 1}</span>
      <span className="bb-emp-txt">
        <small>{r.m.rank}</small>
        <strong>{r.m.name}</strong>
        <b aria-hidden="true">฿ <Count value={r.prime} on={on} /></b>
      </span>
      <span className="bb-emp-stamp" aria-hidden="true">Yonkō</span>
    </button>
  );
}

function Registry({ ranked, max, onPick }: { ranked: Ranked[]; max: number; onPick: (id: number) => void }) {
  // Composant à part : son observateur se monte quand les données sont là.
  const [listRef, listOn] = useReveal<HTMLOListElement>();
  return (
    <ol ref={listRef} className={`bb-reg${listOn ? " is-on" : ""}`} start={5} aria-label="Registre des primes, de la 5e à la dernière">
        {ranked.slice(4).map((r, i) => (
          <li key={r.m.id} style={{ "--w": `${(r.prime / max) * 100}%`, "--i": Math.min(i, 30) } as React.CSSProperties}>
            <button type="button" onClick={() => onPick(r.m.id)}>
              <span className="bb-reg-no">{i + 5}</span>
              <span className="bb-reg-name">{r.m.name}<small>{r.m.rank}</small></span>
              <span className="bb-reg-bar" aria-hidden="true"><i /></span>
              <span className="bb-reg-prime">฿ {formatBounty(r.prime)}</span>
            </button>
          </li>
        ))}
      </ol>
  );
}

export default function BountyBoard({ ranked, onPick }: { ranked: Ranked[]; onPick: (id: number) => void }) {
  if (ranked.length < 4) return null;
  const max = ranked[0].prime || 1;
  return (
    <section className="bb-board" aria-labelledby="bb-board-title" data-gk-motion="reveal">
      <header className="bb-board-head">
        <p>Yonkō · les quatre têtes les plus chères</p>
        <h2 id="bb-board-title">Le classement des primes</h2>
      </header>
      <div className="bb-emps">
        {ranked.slice(0, 4).map((r, i) => <Emperor key={r.m.id} r={r} i={i} onPick={onPick} />)}
      </div>
      <Registry ranked={ranked} max={max} onPick={onPick} />
    </section>
  );
}
