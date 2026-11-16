// Aperçus de lien (WhatsApp, Discord, réseaux) des rubriques du site : une image
// 1200×630 par rubrique, avec un vrai contenu du moment (chronique à la une,
// prochain épisode, prochain anniversaire…). Rendu serveur, converti en JPEG léger.
import { ImageResponse } from "next/og";
import { DOSSIER_BASH_DATA, dossierBashSeason, sortDossierBash } from "../dossier-bash";
import { getPublicMembers } from "../members-server";
import { GOLD, INK, OG_SIZE, PAPER, loadDisplayFont, loadFonts, portraitData } from "./member-art";

export const PAGE_IDS = ["accueil", "bibliotheque", "atelier", "calendrier", "cinema", "fighters", "anniversaires", "wanted", "bons-plans", "jeux"] as const;
export type PageId = (typeof PAGE_IDS)[number];

interface Art {
  kicker: string;          // rōmaji · rubrique
  title: string;
  sub: string;
  accent: string;
  images: string[];        // 1 à 3 images (portrait), affichées à droite
  backdrop?: string;       // image paysage plein fond
}

const BASE = { accent: GOLD, images: [] as string[] };

async function artFor(page: PageId): Promise<Art> {
  switch (page) {
    case "accueil": {
      const n = (await getPublicMembers().catch(() => [])).length;
      return { ...BASE, kicker: "NAKAMA · LE REGISTRE", title: "Guilde Otaku", sub: `${n ? `${n} membres, ` : ""}une bande d'amis qui débat d'animes depuis 2020.`, images: ["/atelier/teamotaku.png"] };
    }
    case "bibliotheque": {
      const une = sortDossierBash(DOSSIER_BASH_DATA)[0];
      const season = une ? dossierBashSeason(une.date)?.label : null;
      return { ...BASE, kicker: `TOSHOKAN · LA CHRONIQUE DU BASH${season ? ` · ${season.toUpperCase()}` : ""}`, title: "La Bibliothèque", sub: une ? `À la une : ${une.title}. Verdicts, chroniques et notes de la semaine.` : "Les verdicts de la Guilde.", accent: une?.color ?? GOLD, images: une ? [une.hdCover || une.cover] : [], backdrop: une?.backdrop };
    }
    case "atelier": {
      const { getAtelierTiles } = await import("../atelier-server");
      const tiles = await getAtelierTiles(3).catch(() => []);
      return { ...BASE, kicker: "KŌBŌ · LA GALERIE", title: "Les futilités de la Guilde", sub: "Portraits, scènes et délires visuels : la galerie des créations de la Guilde.", images: tiles.map((t) => t.src) };
    }
    case "calendrier": {
      const { getAiringWeek } = await import("../airing");
      const now = Date.now() / 1000;
      const next = (await getAiringWeek().catch(() => [])).find((e) => e.at > now && (e.banner || e.cover));
      return { ...BASE, kicker: "HŌSŌ · SIMULCAST", title: "Les sorties Crunchyroll", sub: next ? `Prochain épisode : ${next.title}, épisode ${next.episode}.` : "Les épisodes de la semaine, jour par jour.", accent: "#f47521", images: next?.cover ? [next.cover] : [], backdrop: next?.banner ?? undefined };
    }
    case "cinema": {
      const { getCinemaRows } = await import("../cinema");
      const rows = await getCinemaRows().catch(() => null);
      const hero = rows?.series.find((i) => i.backdrop && i.poster);
      return { ...BASE, kicker: "GEKIJŌ · LE CINÉMA OTAKU", title: "Le Cinéma Otaku", sub: "Bandes-annonces, vidéos de la Guilde et où regarder les animes en France.", images: hero?.poster ? [hero.poster] : [], backdrop: hero?.backdrop ?? undefined };
    }
    case "fighters":
      return { ...BASE, kicker: "TŌSHI · L'ARÈNE", title: "Fighters", sub: "Choisis ton combattant parmi les membres et lance le duel.", accent: "#e8412c", images: ["/atelier/duel-food.png"] };
    case "anniversaires": {
      const { parseBirthday } = await import("../../app/types");
      const { daysUntil } = await import("../../app/utils/birthdays");
      const list = (await getPublicMembers().catch(() => []))
        .map((m) => ({ m, b: parseBirthday(m.birthday) }))
        .filter((x): x is { m: typeof x.m; b: { day: number; month: number } } => !!x.b)
        .map((x) => ({ ...x, d: daysUntil(x.b.day, x.b.month) }))
        .sort((a, b) => a.d - b.d);
      const next = list[0];
      const when = next ? (next.d === 0 ? "aujourd'hui" : next.d === 1 ? "demain" : `dans ${next.d} jours`) : "";
      return { ...BASE, kicker: "TANJŌBI · LES ANNIVERSAIRES", title: "Anniversaires", sub: next ? `Prochain : ${next.m.name}, le ${next.m.birthday} (${when}).` : "Qui souffle ses bougies, et quand.", accent: "#f472b6", images: next ? [next.m.animeChar || next.m.photo] : [] };
    }
    case "wanted": {
      const ms = (await getPublicMembers().catch(() => [])).filter((m) => m.animeChar || m.photo).slice(0, 3);
      return { ...BASE, kicker: "TEHAISHO · AVIS DE RECHERCHE", title: "Wanted", sub: "Les avis de recherche et les primes des membres de la Guilde.", accent: "#c8241d", images: ms.map((m) => m.animeChar || m.photo) };
    }
    case "jeux":
      return { ...BASE, kicker: "ASOBI · LA SALLE DE JEUX", title: "Jeux de la Guilde", sub: "Quiz des génériques, duels de goûts entre membres et badges à débloquer.", accent: "#e8412c", images: ["/atelier/duel-food.png"] };
    case "bons-plans":
      return { ...BASE, kicker: "OTOKU · LES BONNES ADRESSES", title: "Bons plans", sub: "Les liens que la Guilde se refile : animes, scans, films et outils.", images: ["/logo.png"] };
  }
}

const hexA = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

export async function renderPageOg(page: PageId, origin: string): Promise<ImageResponse> {
  const art = await artFor(page);
  const [fonts, display, bd, ...imgs] = await Promise.all([
    loadFonts(), loadDisplayFont(),
    art.backdrop ? portraitData(art.backdrop, origin, 1200) : Promise.resolve(null),
    ...art.images.slice(0, 3).map((src) => portraitData(src, origin, 640)),
  ]);
  const pics = imgs.filter(Boolean) as string[];
  const accent = /^#[0-9a-f]{6}$/i.test(art.accent) ? art.accent : GOLD;
  // Le mot le plus long tient dans la colonne de texte (Dela Gothic est large).
  const longest = Math.max(...art.title.split(/\s+/).map((w) => w.length));
  const titleSize = Math.min(100, Math.floor((pics.length ? 600 : 1000) / (longest * 0.74)));
  // Une image : grande affiche ; deux ou trois : éventail de cases.
  const frames = pics.length === 1
    ? [{ w: 330, h: 470, x: 0, y: 0, r: -2 }]
    : pics.length === 2
      ? [{ w: 250, h: 360, x: 0, y: 40, r: -5 }, { w: 250, h: 360, x: 150, y: 0, r: 4 }]
      : [{ w: 210, h: 300, x: 0, y: 80, r: -7 }, { w: 210, h: 300, x: 120, y: 20, r: 0 }, { w: 210, h: 300, x: 240, y: 90, r: 7 }];

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow", overflow: "hidden" }}>
        {bd && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bd} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: bd
          ? `linear-gradient(90deg, ${hexA(INK, 0.97)} 0%, ${hexA(INK, 0.9)} 45%, ${hexA(INK, 0.45)} 100%)`
          : `linear-gradient(150deg, ${hexA(accent, 0.45)} 0%, ${hexA(accent, 0.1)} 40%, ${hexA(INK, 0)} 70%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 2px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 630, display: "flex", background: accent }} />

        {/* Texte */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: pics.length ? 690 : 1100, height: 630, padding: "54px 0 46px 64px" }}>
          <div style={{ display: "flex", alignItems: "stretch", alignSelf: "flex-start", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 3 }}>
            <div style={{ display: "flex", width: 12, background: accent, border: `3px solid ${PAPER}`, borderRight: "none" }} />
            <div style={{ display: "flex", padding: "5px 14px", background: PAPER, color: INK, border: `3px solid ${PAPER}` }}>{art.kicker}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Dela Gothic One", fontSize: titleSize, lineHeight: 1, color: PAPER, textShadow: `6px 6px 0 ${accent}` }}>{art.title}</div>
            <div style={{ display: "flex", marginTop: 22, maxWidth: 600, fontSize: 30, lineHeight: 1.35, color: "rgba(244,239,228,0.9)" }}>{art.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Dela Gothic One", fontSize: 26, letterSpacing: 1 }}>
            GUILDE OTAKU
            <div style={{ display: "flex", marginLeft: 16, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 24, color: "rgba(244,239,228,0.6)" }}>depuis 2020</div>
          </div>
        </div>

        {/* Images (cases inclinées, ombre dure) */}
        {pics.length > 0 && (
          <div style={{ position: "absolute", right: pics.length === 1 ? 90 : 60, top: pics.length === 1 ? 80 : 110, width: pics.length === 1 ? 340 : 460, height: 480, display: "flex" }}>
            {frames.map((f, i) => pics[i] && (
              <div key={i} style={{ position: "absolute", left: f.x, top: f.y, width: f.w, height: f.h, display: "flex", transform: `rotate(${f.r}deg)`, border: `5px solid ${PAPER}`, background: INK, boxShadow: `12px 12px 0 ${accent}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pics[i]} width={f.w - 10} height={f.h - 10} alt="" style={{ width: f.w - 10, height: f.h - 10, objectFit: "cover", objectPosition: "50% 20%" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: [...(await fonts), ...display] }
  );
}

/** URL d'aperçu d'une rubrique : version du jour, pour que WhatsApp la rafraîchisse. */
export function pageOgUrl(page: PageId, now = new Date()): string {
  return `/api/og/page?p=${page}&v=${now.toISOString().slice(0, 10).replace(/-/g, "")}`;
}
