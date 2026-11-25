"use client";

// La collection : quatre façons de parcourir la Guilde, mêmes filtres partout
// (recherche, grade, pays, portrait anime ou réel).
// - Collection : écran de sélection de personnages (scène + grille, curseur P1, clavier).
// - Liste : annuaire classique, rapide, triable.
// - Générations : les grades regroupés en quatre familles (aucune date d'arrivée n'existe).
// - Bibliothèque : les tomes des membres rangés sur des étagères.
// Ouvrir un membre : sa carte (ou sa tranche) devient la couverture de son tome.
// Téléphone : en mode collection, une feuille monte du bas ; chaque geste a son bouton.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import Image from "../../components/GImage";
import { useBackClose } from "../../hooks/useBackClose";
import { flagUrl } from "../../config/countries";
import { DUR, EASE, SPRING } from "../../../lib/motion";
import { goTome } from "../tome-nav";

export interface CollectionMember {
  id: number; name: string; first: string; rank: string; romaji: string; accent: string;
  anime: string | null; real: string | null; animePos: string; realPos: string; lede: string;
  country: string | null; flag: string | null; birthday: string | null; birthDay: number | null; birthMonth: number | null;
  stats: { force: number; vitesse: number; technique: number } | null; bankai: string | null; alias: string | null;
  generation: string; edition: string;
}
type Face = "anime" | "real";
type Mode = "collection" | "liste" | "generations" | "bibliotheque";
const MODES: [Mode, string][] = [["collection", "Collection"], ["liste", "Liste"], ["generations", "Générations"], ["bibliotheque", "Bibliothèque"]];
const SEEN = "gk-collection-vus";
const MODE_KEY = "gk-collection-vue";
const no = (id: number) => `N°${String(id).padStart(3, "0")}`;
const pic = (m: CollectionMember, f: Face) => (f === "real" ? (m.real ? { src: m.real, pos: m.realPos } : m.anime ? { src: m.anime, pos: m.animePos } : null) : (m.anime ? { src: m.anime, pos: m.animePos } : m.real ? { src: m.real, pos: m.realPos } : null));
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const daysTo = (m: CollectionMember, now: Date) => {
  if (!m.birthDay || !m.birthMonth) return 999;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let d = new Date(now.getFullYear(), m.birthMonth - 1, m.birthDay).getTime();
  if (d < t) d = new Date(now.getFullYear() + 1, m.birthMonth - 1, m.birthDay).getTime();
  return Math.round((d - t) / 86400000);
};

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

export default function Collection({ members, ranks, countries, generations }: {
  members: CollectionMember[];
  ranks: { rank: string; romaji: string; accent: string; count: number }[];
  countries: { code: string; label: string; count: number }[];
  generations: { id: string; label: string; romaji: string; blurb: string }[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const [mode, setMode] = useState<Mode>("collection");
  const [rank, setRank] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [face, setFace] = useState<Face>("anime");
  const [sort, setSort] = useState<"numero" | "nom" | "anniversaire">("numero");
  const [sel, setSel] = useState<number>(members[0]?.id ?? 0);
  const [sheet, setSheet] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [fresh, setFresh] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const out = members.filter((m) => (!rank || m.rank === rank) && (!country || m.flag === country) && (!q || fold(`${m.name} ${m.rank} ${m.alias ?? ""} ${m.country ?? ""}`).includes(fold(q))));
    if (mode !== "liste" || sort === "numero") return out;
    if (sort === "nom") return [...out].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    const now = new Date();
    return [...out].sort((a, b) => daysTo(a, now) - daysTo(b, now));
  }, [members, rank, country, q, mode, sort]);
  const cur = members.find((m) => m.id === sel) ?? list[0] ?? members[0];
  const idx = list.findIndex((m) => m.id === cur?.id);

  // Vue, découverts et membre choisi : mémorisés sur l'appareil ou dans l'adresse.
  useEffect(() => {
    void Promise.resolve().then(() => {
      try { setSeen(new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]") as number[])); } catch { /* stockage indisponible */ }
      const p = new URLSearchParams(location.search);
      const v = (p.get("vue") ?? (() => { try { return localStorage.getItem(MODE_KEY); } catch { return null; } })()) as Mode | null;
      if (v && MODES.some(([k]) => k === v)) setMode(v);
      const m = Number(p.get("m"));
      if (m && members.some((x) => x.id === m)) setSel(m);
    });
  }, [members]);
  useEffect(() => {
    if (!cur || mode !== "collection") return;
    const t = window.setTimeout(() => setSeen((s) => {
      if (s.has(cur.id)) return s;
      const n = new Set(s).add(cur.id);
      try { localStorage.setItem(SEEN, JSON.stringify([...n])); } catch { /* stockage indisponible */ }
      setFresh((f) => f + 1);
      return n;
    }), 700);
    return () => window.clearTimeout(t);
  }, [cur, mode]);

  const changeMode = (v: Mode) => {
    setMode(v); setSheet(false);
    try { localStorage.setItem(MODE_KEY, v); } catch { /* stockage indisponible */ }
    const url = new URL(location.href); url.searchParams.set("vue", v); history.replaceState(history.state, "", url);
  };
  const pick = useCallback((id: number, openSheet = false) => {
    setSel(id);
    const url = new URL(location.href); url.searchParams.set("m", String(id)); history.replaceState(history.state, "", url);
    if (openSheet) setSheet(true);
  }, []);
  /** Ouvre le tome : l'image d'origine devient la couverture. */
  const open = useCallback((id: number, from?: Element | null) => { setSheet(false); goTome(router, id, "open", from); }, [router]);
  useBackClose(sheet, () => setSheet(false));

  // Clavier (mode collection) : flèches dans la grille, Entrée ouvre le tome, « / » cherche.
  const onKey = (e: React.KeyboardEvent) => {
    if (!list.length) return;
    const cols = Math.max(1, Math.round((grid.current?.clientWidth ?? 600) / ((grid.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 120)));
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (step) {
      e.preventDefault();
      const next = list[Math.min(list.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + step))];
      pick(next.id);
      grid.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus();
    } else if (e.key === "Enter" && cur) { e.preventDefault(); if (phone) setSheet(true); else open(cur.id, grid.current?.querySelector(`[data-id="${cur.id}"] img`)); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "/" && !(document.activeElement instanceof HTMLInputElement)) { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  const neighbour = (d: 1 | -1) => { if (!list.length) return; const n = list[(Math.max(0, idx) + d + list.length) % list.length]; pick(n.id); };
  const onSheetDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) setSheet(false);
    else if (Math.abs(info.offset.x) > 80 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) neighbour(info.offset.x < 0 ? 1 : -1);
  };
  const filtered = !!(rank || country || q);
  const showStage = !phone && mode === "collection" && cur;

  return (
    <div className={`co-app is-${mode}`} style={{ "--acc": cur?.accent ?? "#c9a84c" } as React.CSSProperties}>
      {showStage && <aside className="co-stage" aria-live="polite"><Stage m={cur} face={face} reduce={!!reduce} onOpen={(el) => open(cur.id, el)} /></aside>}

      <section className="co-board" aria-labelledby="co-title">
        <header className="co-head">
          <div>
            <p className="co-kicker t-ui">Annuaire</p>
            <h1 id="co-title" className="t-display co-title">{mode === "bibliotheque" ? "Les tomes" : mode === "generations" ? "Les générations" : mode === "liste" ? "L'annuaire" : "La collection"}</h1>
          </div>
          <p className="co-count t-data" title="Membres déjà vus sur cet appareil"><b key={fresh} className={`t-logo${fresh ? " is-pop" : ""}`}>{seen.size}</b><span>/{members.length}</span><small className="t-ui">découverts</small></p>
        </header>

        <div className="co-modes" role="tablist" aria-label="Façon de parcourir">
          {MODES.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => changeMode(k)} className="t-ui">
              {label}{mode === k && <motion.span layoutId="co-mode" className="co-mode-ink" transition={reduce ? { duration: 0 } : SPRING.cursor} />}
            </button>
          ))}
        </div>

        <div className="co-tools">
          <label className="co-search"><span className="st-sr">Chercher un membre</span>
            <input ref={search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nakama, un pays  ( / )" />
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
        <div className="co-countries" role="group" aria-label="Pays">
          {countries.map((c) => (
            <button key={c.code} type="button" aria-pressed={country === c.code} onClick={() => setCountry(country === c.code ? null : c.code)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagUrl(c.code)} alt="" width={20} height={14} /> {c.label} <small>{c.count}</small>
            </button>
          ))}
          {filtered && <button type="button" className="co-reset" onClick={() => { setRank(null); setCountry(null); setQ(""); }}>Tout afficher</button>}
        </div>
        <p className="co-result t-ui" aria-live="polite">{list.length} membre{list.length > 1 ? "s" : ""}{filtered ? " affiché" + (list.length > 1 ? "s" : "") : ""}</p>

        {!list.length && <p className="co-empty t-edit">Aucun nakama ne répond à ces critères.</p>}

        {mode === "collection" && list.length > 0 && (
          <div ref={grid} className="co-grid" role="listbox" aria-label="Membres" aria-activedescendant={cur ? `co-${cur.id}` : undefined} onKeyDown={onKey}>
            {list.map((m, i) => {
              const p = pic(m, face), on = m.id === cur?.id;
              return (
                <button key={m.id} id={`co-${m.id}`} data-id={m.id} type="button" role="option" aria-selected={on} tabIndex={on ? 0 : -1}
                  className={`co-tile${seen.has(m.id) ? "" : " is-new"}`} style={{ "--acc": m.accent, "--i": Math.min(i, 16) } as React.CSSProperties}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") pick(m.id); }}
                  onClick={(e) => (phone ? pick(m.id, true) : on ? open(m.id, e.currentTarget.querySelector("img")) : pick(m.id))}
                  aria-label={`${m.name}, ${m.rank}${phone ? "" : on ? ", ouvrir son tome" : ""}`}>
                  {p && <Image src={p.src} alt="" fill sizes="(max-width: 899px) 34vw, 150px" style={{ objectFit: "cover", objectPosition: p.pos }} />}
                  <span className="co-tile-no t-data">{String(m.id).padStart(3, "0")}</span>
                  <span className="co-tile-name t-ui">{m.first}</span>
                  {on && !phone && <motion.span layoutId="co-cursor" className="co-cursor t-ui" transition={reduce ? { duration: 0 } : SPRING.cursor}>P1</motion.span>}
                </button>
              );
            })}
          </div>
        )}

        {mode === "liste" && list.length > 0 && (
          <>
            <div className="co-sort" role="group" aria-label="Trier">
              {([["numero", "N°"], ["nom", "Nom"], ["anniversaire", "Anniversaire"]] as const).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
            <ol className="co-list">
              {list.map((m) => {
                const p = pic(m, face);
                return (
                  <li key={m.id} style={{ "--acc": m.accent } as React.CSSProperties}>
                    <a href={`/studio/membre/${m.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); open(m.id, e.currentTarget.querySelector("img")); }}>
                      <span className="co-list-img">{p && <Image src={p.src} alt="" fill sizes="56px" style={{ objectFit: "cover", objectPosition: p.pos }} />}</span>
                      <span className="co-list-no t-data">{no(m.id)}</span>
                      <span className="co-list-name"><b>{m.name}</b>{m.alias && <small>{m.alias}</small>}</span>
                      <span className="co-list-rank t-ui">{m.rank}</span>
                      <span className="co-list-meta">{m.flag && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={flagUrl(m.flag)} alt="" width={18} height={12} /> </>}{m.country ?? ""}</span>
                      <span className="co-list-meta">{m.birthday ?? ""}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {mode === "generations" && list.length > 0 && (
          <div className="co-gens">
            <p className="co-note t-edit">Les grades de la Guilde, regroupés en quatre familles.</p>
            {generations.map((g) => {
              const gl = list.filter((m) => m.generation === g.id);
              if (!gl.length) return null;
              return (
                <section key={g.id} className={`co-gen is-${g.id}`} aria-labelledby={`gen-${g.id}`}>
                  <header><h2 id={`gen-${g.id}`} className="t-display">{g.label}</h2><p className="t-edit">{g.romaji} · {g.blurb}</p><b className="t-logo">{gl.length}</b></header>
                  <ul>
                    {gl.map((m) => {
                      const p = pic(m, face);
                      return (
                        <li key={m.id} style={{ "--acc": m.accent } as React.CSSProperties}>
                          <a href={`/studio/membre/${m.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); open(m.id, e.currentTarget.querySelector("img")); }}>
                            <span className="co-gen-img">{p && <Image src={p.src} alt="" fill sizes="(max-width: 899px) 40vw, 180px" style={{ objectFit: "cover", objectPosition: p.pos }} />}</span>
                            <b className="t-ui">{m.first}</b><small>{m.rank}</small>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {mode === "bibliotheque" && list.length > 0 && (
          <ul className="co-shelf" aria-label="Tomes des membres">
            {list.map((m) => {
              const p = pic(m, face);
              return (
                <li key={m.id} className={`ed-${m.edition}`} style={{ "--acc": m.accent } as React.CSSProperties}>
                  <a href={`/studio/membre/${m.id}`} aria-label={`Tome ${m.id} : ${m.name}, ${m.rank}`}
                    onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); open(m.id, e.currentTarget.querySelector(".co-spine-peek")); }}>
                    <span className="co-spine-peek">{p && <Image src={p.src} alt="" fill sizes="120px" style={{ objectFit: "cover", objectPosition: p.pos }} />}</span>
                    <span className="co-spine-no t-logo">{m.id}</span>
                    <span className="co-spine-name t-display">{m.name}</span>
                    <span className="co-spine-rank t-ui">{m.rank}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {phone && sheet && cur && mode === "collection" && (
          <>
            <motion.button type="button" className="co-scrim" aria-label="Fermer" onClick={() => setSheet(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="co-sheet" role="dialog" aria-modal="true" aria-label={cur.name}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={reduce ? { duration: DUR.tap } : SPRING.sheet}
              drag dragDirectionLock dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }} dragElastic={{ top: 0.05, bottom: 0.6, left: 0.4, right: 0.4 }} onDragEnd={onSheetDrag}>
              <span className="co-grip" aria-hidden="true" />
              <button type="button" className="co-sheet-close t-ui" onClick={() => setSheet(false)}>Fermer</button>
              <Stage m={cur} face={face} reduce={!!reduce} onOpen={(el) => open(cur.id, el)} compact />
              <div className="co-sheet-nav">
                <button type="button" onClick={() => neighbour(-1)} aria-label="Membre précédent">‹</button>
                <span className="t-ui">{idx + 1} / {list.length} · ou balaie</span>
                <button type="button" onClick={() => neighbour(1)} aria-label="Membre suivant">›</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stage({ m, face, reduce, onOpen, compact = false }: { m: CollectionMember; face: Face; reduce: boolean; onOpen: (from: Element | null) => void; compact?: boolean }) {
  const p = pic(m, face);
  const fig = useRef<HTMLDivElement>(null);
  return (
    <div className={`co-scene${compact ? " is-compact" : ""}`} style={{ "--acc": m.accent } as React.CSSProperties}>
      <span className="co-burst" aria-hidden="true" />
      <div ref={fig} className="co-portrait-wrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.figure key={`${m.id}-${face}`} className="co-portrait"
            initial={reduce ? { opacity: 0 } : { clipPath: "polygon(0 0, 0 0, -20% 100%, -20% 100%)", x: 30 }}
            animate={reduce ? { opacity: 1 } : { clipPath: "polygon(0 0, 120% 0, 100% 100%, -20% 100%)", x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: reduce ? DUR.tap : DUR.enter, ease: EASE.out }}>
            {p && <Image src={p.src} alt={`${m.name}, ${face === "real" ? "photo" : "version anime"}`} fill sizes={compact ? "92vw" : "40vw"} priority style={{ objectFit: "cover", objectPosition: p.pos }} />}
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="co-id">
        <p className="co-no t-data">{no(m.id)}{m.alias ? <span> · {m.alias}</span> : null}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2 key={m.id} className="t-display co-name" initial={reduce ? false : { y: "40%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? undefined : { y: "-30%", opacity: 0 }} transition={{ duration: reduce ? 0 : DUR.swap + 0.06, ease: EASE.out }}>{m.name}</motion.h2>
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
          <button type="button" className="co-open t-ui m-press" onClick={() => onOpen(fig.current?.querySelector("img") ?? null)}>Ouvrir son tome <span aria-hidden="true">→</span></button>
          <Link className="co-fight t-ui r-kiri" href="/fighters">Le défier</Link>
        </div>
      </div>
    </div>
  );
}
