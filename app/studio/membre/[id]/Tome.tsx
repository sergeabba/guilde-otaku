"use client";
import { setFace, useFace } from "../../../../lib/face";

// Un membre, un tome. La couverture se compose selon l'identité du membre :
// - édition (famille du grade) : prestige, shōnen ou seinen ;
// - motif et couleur choisis dans l'admin (carte du membre) ;
// - sens de lecture : si le personnage regarde à gauche, la couverture se met en miroir.
// Les chapitres n'apparaissent que s'ils ont un contenu réel, et leur mise en scène
// varie selon ce contenu (bio courte ou longue, une ou plusieurs distinctions…).
// Chaque geste a son bouton : balayer la couverture = boutons ‹ › et flèches du clavier.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import Image from "../../../components/GImage";
import ShareSheet from "../../../components/ShareSheet";
import type { Member } from "../../../../data/members";
import type { MemberLink, StudioMember } from "../../../../lib/studio-data";
import { fileSlug } from "../../../../lib/share";
import { saveImage, saveMessage } from "../../../../lib/save-image";
import { DUR, EASE, WIPE } from "../../../../lib/motion";
import { goTome } from "../../tome-nav";
import { Origines, Pouvoirs, Palmares, Univers, Generique, Liens, HorsSerie } from "./TomeChapters";

export interface TomeNeighbour { id: number; name: string; image: string | null; pos: string; accent: string }

const EDITION: Record<StudioMember["edition"], string> = { prestige: "Édition prestige", shonen: "Hebdo shōnen", seinen: "Collection seinen" };

export default function Tome({ m, member, prev, next, links, chroniques, position, total, plancheUrl }: {
  m: StudioMember; member: Member; prev: TomeNeighbour; next: TomeNeighbour; links: MemberLink[];
  chroniques: Record<string, string>; position: number; total: number; plancheUrl: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const face = useFace();
  const [moving, setMoving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const src = face === "anime" ? (m.anime ?? m.real) : (m.real ?? m.anime);
  const pos = face === "anime" ? m.animePos : m.realPos;
  const video = face === "anime" ? m.animeVideo : m.realVideo;
  // Une parenthèse ou un guillemet seul ne doit pas rester seul sur sa ligne : « ( MR » devient « (MR ».
  const words = m.name.replace(/["“”]/g, "").replace(/([(\[])\s+/g, "$1").replace(/\s+([)\]])/g, "$1").split(/\s+/);

  const chapters: [string, string][] = [["ch-origines", "Origines"]];
  if (m.stats || m.special || m.bankai || m.domaine) chapters.push(["ch-pouvoirs", "Pouvoirs"]);
  if (m.awards.length) chapters.push(["ch-palmares", "Palmarès"]);
  if (m.works.length) chapters.push(["ch-univers", "Univers"]);
  if (m.music.length) chapters.push(["ch-generique", "Générique"]);
  if (links.length) chapters.push(["ch-liens", "Liens"]);
  const [active, setActive] = useState<string>(chapters[0][0]);

  // Chapitre en cours de lecture (sommaire collant).
  useEffect(() => {
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".tm2-ch[id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = useCallback((dir: "prev" | "next") => goTome(router, dir === "next" ? next.id : prev.id, dir), [router, next.id, prev.id]);
  // Flèches du clavier : tome voisin (sauf pendant une saisie ou une fenêtre ouverte).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || shareOpen || document.querySelector("[aria-modal='true']")) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowRight") go("next"); else if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, shareOpen]);
  useEffect(() => { router.prefetch(`/studio/membre/${next.id}`); router.prefetch(`/studio/membre/${prev.id}`); }, [router, next.id, prev.id]);

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 90 || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return;
    go(info.offset.x < 0 ? "next" : "prev");
  };

  // Planche partageable : préparée dès que le bouton approche (iPhone : partage juste après l'appui).
  const job = useRef<Promise<Blob> | null>(null);
  const prepare = useCallback(() => {
    job.current ??= fetch(`${plancheUrl}${plancheUrl.includes("?") ? "&" : "?"}hd=1`).then((r) => { if (!r.ok) throw new Error(); return r.blob(); });
    job.current.catch(() => { job.current = null; });
    return job.current;
  }, [plancheUrl]);
  const download = async () => {
    try {
      const r = await saveImage(await prepare(), `tome-${m.id}-${fileSlug(m.name)}.jpg`);
      if (r !== "cancelled") setToast(saveMessage(r, "Planche"));
    } catch { setToast("La planche n'a pas pu être préparée. Réessaie."); }
  };
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  return (
    <article className="tm2-tome" data-tome={m.id}>
      {/* ── COUVERTURE ─────────────────────────────────────────────────────── */}
      <motion.section className={`tm2-cover ed-${m.edition} mo-${m.motif}${m.mirror ? " is-mirror" : ""}`} aria-labelledby="tm2-name"
        drag={reduce ? false : "x"} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.16} dragDirectionLock onDragEnd={onSwipe}>
        <div className="tm2-spine" aria-hidden="true"><span className="t-ui">Guilde Otaku</span><b className="t-logo">{m.id}</b><span className="t-ui">{m.rank}</span></div>
        <div className="tm2-art-wrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.figure key={`${face}-${moving}`} className="tm2-art"
              initial={reduce ? { opacity: 0 } : { clipPath: m.mirror ? WIPE.fromLeft : WIPE.fromRight }}
              animate={reduce ? { opacity: 1 } : { clipPath: WIPE.full }}
              exit={{ opacity: 0 }} transition={{ duration: reduce ? DUR.tap : DUR.page, ease: EASE.inOut }}>
              {moving && video ? (
                <video className="tm2-video" src={video} muted loop playsInline autoPlay style={{ objectPosition: pos }} aria-label={`${m.name}, portrait animé`} />
              ) : src && (
                <Image src={src} alt={`${m.name}, ${face === "anime" ? "version anime" : "photo"}`} fill priority sizes="(max-width: 899px) 100vw, 60vw" style={{ objectFit: "cover", objectPosition: pos }} />
              )}
            </motion.figure>
          </AnimatePresence>
        </div>
        <span className="tm2-motif" aria-hidden="true" />

        <div className="tm2-title">
          <p className="tm2-edition t-ui"><span>{EDITION[m.edition]}</span>{m.series && <span className="tm2-series">d&apos;après {m.series.title}</span>}</p>
          <h1 id="tm2-name" className="t-display tm2-name" style={{ "--len": Math.max(...words.map((w) => w.length)), "--chars": m.name.length } as React.CSSProperties}>
            {words.map((w, i) => <span key={i} style={{ "--i": i } as React.CSSProperties}>{w}</span>)}
          </h1>
          <p className="tm2-rank r-dense"><b className="t-display">{m.rank}</b><span className="t-edit">{m.romaji}{m.alias ? ` · « ${m.alias} »` : ""}</span></p>
          {m.lede && m.lede !== m.bio.trim() && <p className="tm2-blurb t-edit">{m.lede}</p>}
          <div className="tm2-cover-acts">
            {m.anime && m.real && (
              <button type="button" className="tm2-chip m-press t-ui" aria-pressed={face === "real"} onClick={() => { setFace(face === "anime" ? "real" : "anime"); setMoving(false); }}>
                {face === "anime" ? "Voir la photo" : "Voir l'anime"}
              </button>
            )}
            {video && (
              <button type="button" className="tm2-chip m-press t-ui" aria-pressed={moving} onClick={() => setMoving((v) => !v)}>{moving ? "Couverture fixe" : "Couverture animée"}</button>
            )}
            <button type="button" className="tm2-chip m-press t-ui" onClick={() => setShareOpen(true)} aria-haspopup="dialog"><Share2 size={15} aria-hidden="true" /> Partager</button>
            <button type="button" className="tm2-chip m-press t-ui" onClick={download} onPointerEnter={() => void prepare().catch(() => {})} onFocus={() => void prepare().catch(() => {})}>
              <Download size={15} aria-hidden="true" /> La planche
            </button>
          </div>
        </div>

        <p className="tm2-volume t-logo" aria-label={`Tome ${m.id}, ${position} sur ${total}`}><small className="t-ui">Tome</small>{m.id}</p>
        <div className="tm2-turn">
          <button type="button" className="m-press" onClick={() => go("prev")} aria-label={`Tome précédent : ${prev.name}`}><ChevronLeft size={22} aria-hidden="true" /></button>
          <span className="t-ui" aria-hidden="true">{position} / {total}</span>
          <button type="button" className="m-press" onClick={() => go("next")} aria-label={`Tome suivant : ${next.name}`}><ChevronRight size={22} aria-hidden="true" /></button>
        </div>
        <p className="tm2-swipe t-ui" aria-hidden="true">‹ balaie, ou touche les flèches ›</p>
      </motion.section>

      {/* ── SOMMAIRE COLLANT ───────────────────────────────────────────────── */}
      <nav className="tm2-toc" aria-label="Chapitres du tome">
        <span className="tm2-progress" aria-hidden="true" />
        {chapters.map(([id, label], i) => <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}><b className="t-logo">{i + 1}</b><span className="t-ui">{label}</span></a>)}
      </nav>

      <Origines m={m} n={1} />
      {chapters.map(([id], i) => {
        const n = i + 1;
        if (id === "ch-pouvoirs") return <Pouvoirs key={id} m={m} n={n} />;
        if (id === "ch-palmares") return <Palmares key={id} m={m} n={n} />;
        if (id === "ch-univers") return <Univers key={id} m={m} n={n} chroniques={chroniques} />;
        if (id === "ch-generique") return <Generique key={id} m={m} n={n} />;
        if (id === "ch-liens") return <Liens key={id} m={m} n={n} links={links} />;
        return null;
      })}
      <HorsSerie m={m} />

      {/* ── FIN DU TOME ────────────────────────────────────────────────────── */}
      <footer className="tm2-end">
        <p className="t-edit">Fin du tome {m.id}.</p>
        <div className="tm2-neighbours">
          {([["prev", prev], ["next", next]] as const).map(([dir, n]) => (
            <Link key={dir} href={`/studio/membre/${n.id}`} className={`tm2-spine-link${dir === "next" ? " is-next" : ""}`} style={{ "--a": n.accent } as React.CSSProperties}
              onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); go(dir); }}>
              {n.image && <span className="tm2-spine-img"><Image src={n.image} alt="" fill sizes="96px" style={{ objectFit: "cover", objectPosition: n.pos }} /></span>}
              <span><small className="t-ui">{dir === "prev" ? "Tome précédent" : "Tome suivant"}</small><b className="t-display">{n.name}</b></span>
            </Link>
          ))}
        </div>
        <Link href={`/studio/annuaire?m=${m.id}`} className="tm2-back t-ui">Retour à la collection</Link>
      </footer>

      <ShareSheet member={member} open={shareOpen} onClose={() => setShareOpen(false)} />
      <p className="tm2-toast" role="status" aria-live="polite">{toast}</p>
    </article>
  );
}
