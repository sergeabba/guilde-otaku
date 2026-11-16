"use client";

// « Extraits » d'une fiche membre : les bandes-annonces des animes favoris, en bande
// défilante. Chargées seulement quand la section approche de l'écran ; lecture sur
// place après un appui (une seule à la fois). Sans bande-annonce connue : rien.
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import RomajiLabel from "../RomajiLabel";
import { workTitle, type FavoriteWork } from "../../../lib/member-extras";
import { trailerLangLabel } from "../../../lib/works/favorite";

type T = { youtubeId: string; lang?: string };

/** Où chercher la bande-annonce d'un favori (null : pas de source connue). */
export function trailerQuery(w: FavoriteWork): string | null {
  if (w.kind !== "ANIME") return null;
  if (w.source === "tmdb" && typeof w.sourceId === "string" && /^(tv|movie):\d+$/.test(w.sourceId)) return `source=tmdb&id=${w.sourceId}`;
  const al = w.source === "anilist" ? Number(w.sourceId) : w.anilistId;
  return al ? `source=anilist&id=${al}` : null;
}

const cache = new Map<string, Promise<T | null>>();
export function fetchTrailer(w: FavoriteWork): Promise<T | null> {
  if (w.trailer) return Promise.resolve(w.trailer);
  const q = trailerQuery(w);
  if (!q) return Promise.resolve(null);
  if (!cache.has(q)) cache.set(q, fetch(`/api/works/trailer?${q}`).then((r) => (r.ok ? r.json() : { trailer: null })).then((d) => d.trailer ?? null).catch(() => null));
  return cache.get(q)!;
}

/** Bande-annonce d'un favori (stockée, sinon cherchée). */
export function useWorkTrailer(w: FavoriteWork | null): T | null {
  const [t, setT] = useState<{ key: FavoriteWork | null; v: T | null }>({ key: null, v: null });
  useEffect(() => {
    if (!w) return;
    let alive = true;
    void fetchTrailer(w).then((v) => { if (alive) setT({ key: w, v }); });
    return () => { alive = false; };
  }, [w]);
  return w?.trailer ?? (t.key === w ? t.v : null);
}

export default function TrailerReel({ works, name }: { works: FavoriteWork[]; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<{ w: FavoriteWork; t: T }[] | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const candidates = works.filter((w) => w.trailer || trailerQuery(w)).slice(0, 10);

  useEffect(() => {
    const el = ref.current;
    if (!el || !candidates.length) return;
    let alive = true;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void Promise.all(candidates.map((w) => fetchTrailer(w).then((t) => (t ? { w, t } : null))))
        .then((list) => { if (alive) setItems(list.filter(Boolean) as { w: FavoriteWork; t: T }[]); });
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works]);

  if (!candidates.length || (items && !items.length)) return null;
  return (
    <div ref={ref} className="pf-reel" aria-label={`Extraits des animes préférés de ${name}`}>
      <h3 className="pf-h3"><RomajiLabel romaji="Yokoku" fr="Extraits" inline /></h3>
      <p className="pf-reel-sub">Les bandes-annonces de ses animes préférés.</p>
      <ol className="pf-reel-list" aria-busy={!items}>
        {(items ?? candidates.slice(0, 4).map((w) => ({ w, t: null }))).map(({ w, t }, i) => (
          <li key={i} className="pf-reel-item">
            {t && playing === t.youtubeId ? (
              <div className="pf-reel-screen">
                <iframe src={`https://www.youtube-nocookie.com/embed/${t.youtubeId}?autoplay=1&rel=0&playsinline=1`} title={`Bande-annonce de ${workTitle(w)}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              </div>
            ) : (
              <button type="button" className="pf-reel-btn" disabled={!t} onClick={() => t && setPlaying(t.youtubeId)} aria-label={t ? `Lire la bande-annonce de ${workTitle(w)}` : "Chargement"}>
                <span className="pf-reel-screen">
                  {t ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" />
                  ) : <span className="gk-skel" />}
                  {t && <span className="pf-reel-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>}
                </span>
              </button>
            )}
            <span className="pf-reel-title">{workTitle(w)}</span>
            {t && <span className="pf-reel-lang">{trailerLangLabel(t.lang)}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
