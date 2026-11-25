"use client";

// La collection : écran de sélection de personnages pour l'annuaire.
// Ordinateur : la scène (gauche) montre le membre survolé ou choisi, la grille (droite)
// se parcourt à la souris, au clavier (flèches, Entrée, « / » pour chercher).
// Téléphone : toucher une carte ouvre une feuille qui monte du bas ; on la tire vers le
// bas pour la fermer, on la balaie à gauche ou à droite pour passer au membre voisin.
// Les membres déjà vus sur cet appareil sont comptés (« découverts »).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import Image from "../../components/GImage";
import { useBackClose } from "../../hooks/useBackClose";

export interface CollectionMember {
  id: number; name: string; first: string; rank: string; romaji: string; accent: string;
  anime: string | null; real: string | null; animePos: string; realPos: string; lede: string;
  country: string | null; birthday: string | null;
  stats: { force: number; vitesse: number; technique: number } | null; bankai: string | null; alias: string | null;
}
type Face = "anime" | "real";
const SEEN = "gk-collection-vus";
const no = (id: number) => `N°${String(id).padStart(3, "0")}`;
const pic = (m: CollectionMember, f: Face) => (f === "real" ? (m.real ? { src: m.real, pos: m.realPos } : m.anime ? { src: m.anime, pos: m.animePos } : null) : (m.anime ? { src: m.anime, pos: m.animePos } : m.real ? { src: m.real, pos: m.realPos } : null));
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const on = () => setPhone(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

export default function Collection({ members, ranks }: { members: CollectionMember[]; ranks: { rank: string; romaji: string; accent: string; count: number }[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const [rank, setRank] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [face, setFace] = useState<Face>("anime");
  const [sel, setSel] = useState<number>(members[0]?.id ?? 0);
  const [sheet, setSheet] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const search = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => members.filter((m) => (!rank || m.rank === rank) && (!q || fold(`${m.name} ${m.rank} ${m.alias ?? ""}`).includes(fold(q)))), [members, rank, q]);
  const cur = members.find((m) => m.id === sel) ?? list[0] ?? members[0];
  const idx = list.findIndex((m) => m.id === cur?.id);

  // Découverts : mémorisés sur l'appareil, comptés quand un membre reste affiché un instant.
  useEffect(() => { void Promise.resolve().then(() => { try { setSeen(new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]") as number[])); } catch { /* stockage indisponible */ } }); }, []);
  useEffect(() => {
    if (!cur) return;
    const t = window.setTimeout(() => setSeen((s) => {
      if (s.has(cur.id)) return s;
      const n = new Set(s).add(cur.id);
      try { localStorage.setItem(SEEN, JSON.stringify([...n])); } catch { /* stockage indisponible */ }
      return n;
    }), 700);
    return () => window.clearTimeout(t);
  }, [cur]);

  // Sélection gardée dans l'adresse (?m=), pour partager un membre.
  useEffect(() => {
    const m = Number(new URLSearchParams(location.search).get("m"));
    if (m && members.some((x) => x.id === m)) void Promise.resolve().then(() => setSel(m));
  }, [members]);
  const pick = useCallback((id: number, openSheet = false) => {
    setSel(id);
    const url = new URL(location.href); url.searchParams.set("m", String(id)); history.replaceState(history.state, "", url);
    if (openSheet) setSheet(true);
  }, []);
  const open = useCallback((id: number) => router.push(`/studio/membre/${id}`), [router]);
  useBackClose(sheet, () => setSheet(false));

  // Clavier : flèches dans la grille, Entrée ouvre le tome, « / » cherche.
  const onKey = (e: React.KeyboardEvent) => {
    if (!list.length) return;
    const cols = Math.max(1, Math.round((grid.current?.clientWidth ?? 600) / ((grid.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 120)));
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (step) {
      e.preventDefault();
      const next = list[Math.min(list.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + step))];
      pick(next.id);
      grid.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus();
    } else if (e.key === "Enter" && cur) { e.preventDefault(); if (phone) setSheet(true); else open(cur.id); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  const neighbour = (d: 1 | -1) => { if (!list.length) return; const n = list[(Math.max(0, idx) + d + list.length) % list.length]; pick(n.id); };
  const onSheetDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) setSheet(false);
    else if (Math.abs(info.offset.x) > 80 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) neighbour(info.offset.x < 0 ? 1 : -1);
  };

  return (
    <div className="co-app" style={{ "--acc": cur?.accent ?? "#c9a84c" } as React.CSSProperties}>
      {!phone && cur && <aside className="co-stage" aria-live="polite"><Stage m={cur} face={face} reduce={!!reduce} onOpen={() => open(cur.id)} /></aside>}

      <section className="co-board" aria-labelledby="co-title">
        <header className="co-head">
          <div>
            <p className="co-kicker t-ui">Annuaire</p>
            <h1 id="co-title" className="t-display co-title">La collection</h1>
          </div>
          <p className="co-count t-data" title="Membres déjà vus sur cet appareil"><b className="t-logo">{seen.size}</b><span>/{members.length}</span><small className="t-ui">découverts</small></p>
        </header>

        <div className="co-tools">
          <label className="co-search"><span className="st-sr">Chercher un membre</span>
            <input ref={search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nakama  ( / )" />
          </label>
          <div className="co-face" role="group" aria-label="Portraits">
            <button type="button" aria-pressed={face === "anime"} onClick={() => setFace("anime")}>Anime</button>
            <button type="button" aria-pressed={face === "real"} onClick={() => setFace("real")}>Réel</button>
          </div>
        </div>

        <nav className="co-tabs r-dense" aria-label="Grades">
          <button type="button" aria-pressed={!rank} onClick={() => setRank(null)} style={{ "--t": "#f3eee2" } as React.CSSProperties}><b>Tous</b><small>{members.length}</small></button>
          {ranks.map((r) => (
            <button key={r.rank} type="button" aria-pressed={rank === r.rank} onClick={() => setRank(rank === r.rank ? null : r.rank)} style={{ "--t": r.accent } as React.CSSProperties}><b>{r.rank}</b><small>{r.count}</small></button>
          ))}
        </nav>

        <div ref={grid} className="co-grid" role="listbox" aria-label="Membres" aria-activedescendant={cur ? `co-${cur.id}` : undefined} onKeyDown={onKey}>
          {list.map((m) => {
            const p = pic(m, face), on = m.id === cur?.id;
            return (
              <button key={m.id} id={`co-${m.id}`} data-id={m.id} type="button" role="option" aria-selected={on} tabIndex={on ? 0 : -1}
                className={`co-tile${seen.has(m.id) ? "" : " is-new"}`} style={{ "--acc": m.accent } as React.CSSProperties}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") pick(m.id); }}
                onClick={() => (phone ? pick(m.id, true) : on ? open(m.id) : pick(m.id))}
                aria-label={`${m.name}, ${m.rank}${phone ? "" : on ? ", ouvrir son tome" : ""}`}>
                {p && <Image src={p.src} alt="" fill sizes="(max-width: 899px) 34vw, 150px" style={{ objectFit: "cover", objectPosition: p.pos }} />}
                <span className="co-tile-no t-data">{String(m.id).padStart(3, "0")}</span>
                <span className="co-tile-name t-ui">{m.first}</span>
                {on && !phone && <motion.span layoutId="co-cursor" className="co-cursor t-ui" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}>P1</motion.span>}
              </button>
            );
          })}
          {!list.length && <p className="co-empty t-edit">Aucun nakama ne répond à ce nom.</p>}
        </div>
      </section>

      <AnimatePresence>
        {phone && sheet && cur && (
          <>
            <motion.button type="button" className="co-scrim" aria-label="Fermer" onClick={() => setSheet(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="co-sheet" role="dialog" aria-modal="true" aria-label={cur.name}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 40 }}
              drag dragDirectionLock dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }} dragElastic={{ top: 0.05, bottom: 0.6, left: 0.4, right: 0.4 }} onDragEnd={onSheetDrag}>
              <span className="co-grip" aria-hidden="true" />
              <Stage m={cur} face={face} reduce={!!reduce} onOpen={() => open(cur.id)} compact />
              <div className="co-sheet-nav">
                <button type="button" onClick={() => neighbour(-1)} aria-label="Membre précédent">‹</button>
                <span className="t-ui">{idx + 1} / {list.length} · balaie pour changer</span>
                <button type="button" onClick={() => neighbour(1)} aria-label="Membre suivant">›</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stage({ m, face, reduce, onOpen, compact = false }: { m: CollectionMember; face: Face; reduce: boolean; onOpen: () => void; compact?: boolean }) {
  const p = pic(m, face);
  return (
    <div className={`co-scene${compact ? " is-compact" : ""}`} style={{ "--acc": m.accent } as React.CSSProperties}>
      <span className="co-burst" aria-hidden="true" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.figure key={`${m.id}-${face}`} className="co-portrait"
          initial={reduce ? { opacity: 0 } : { clipPath: "polygon(0 0, 0 0, -20% 100%, -20% 100%)", x: 30 }}
          animate={reduce ? { opacity: 1 } : { clipPath: "polygon(0 0, 120% 0, 100% 100%, -20% 100%)", x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: reduce ? 0.12 : 0.42, ease: [0.22, 1, 0.36, 1] }}>
          {p && <Image src={p.src} alt={`${m.name}, ${face === "real" ? "photo" : "version anime"}`} fill sizes={compact ? "92vw" : "40vw"} priority style={{ objectFit: "cover", objectPosition: p.pos }} />}
        </motion.figure>
      </AnimatePresence>
      <div className="co-id">
        <p className="co-no t-data">{no(m.id)}{m.alias ? <span> · {m.alias}</span> : null}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2 key={m.id} className="t-display co-name" initial={reduce ? false : { y: "40%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? undefined : { y: "-30%", opacity: 0 }} transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>{m.name}</motion.h2>
        </AnimatePresence>
        <p className="co-rank r-dense"><b className="t-display">{m.rank}</b><span className="t-edit">{m.romaji}</span></p>
        {m.bankai && <p className="co-bankai r-kiri"><span className="t-ui">Bankai</span> <b className="t-data">{m.bankai}</b></p>}
        {m.stats && (
          <dl className="co-stats">
            {(["force", "vitesse", "technique"] as const).map((k) => (
              <div key={k}><dt className="t-ui">{k}</dt><dd><i><em style={{ width: `${Math.min(100, m.stats![k])}%` }} /></i><b className="t-data">{m.stats![k]}</b></dd></div>
            ))}
          </dl>
        )}
        {!compact && m.lede && <p className="co-lede t-edit">« {m.lede} »</p>}
        <div className="co-acts">
          <button type="button" className="co-open t-ui" onClick={onOpen}>Ouvrir son tome <span aria-hidden="true">→</span></button>
          <Link className="co-fight t-ui r-kiri" href="/fighters">Le défier</Link>
        </div>
      </div>
    </div>
  );
}
