// Images de partage d'un membre : aperçu social (1200×630) et carte Otaku (1080×1350).
// Rendu serveur via next/og. Les données viennent toujours de la base, à partir d'un
// identifiant validé : aucune URL, couleur ou texte n'est lu dans la requête.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Member } from "../../data/members";
import { rankAccents, rankLogos, rankRomaji, type Rank } from "../../app/config/ranks";
import { COUNTRIES } from "../../app/config/countries";
import { CARD_MOTIFS, featuredWorks, memberAwards, objectPosition, workTitle, type CardMotif } from "../member-extras";
import { dominantVivid } from "./palette";
import { PROVIDER_LABEL } from "../music";
import { absoluteAsset } from "../members-server";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const CARD_SIZE = { width: 1080, height: 1350 } as const;

const INK = "#0d0c10";
const PAPER = "#f4efe4";
const GOLD = "#c9a84c";

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 700 | 900; style: "normal" }[]> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/BarlowCondensed-Black.ttf")),
    readFile(join(process.cwd(), "assets/fonts/BarlowCondensed-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Barlow-Medium.ttf")),
  ]).then(([black, bold, body]) => [
    { name: "Barlow Condensed", data: black, weight: 900 as const, style: "normal" as const },
    { name: "Barlow Condensed", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Barlow", data: body, weight: 500 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

/**
 * Récupère un portrait en JPEG/PNG redimensionné et le renvoie en data URI.
 * Passe par l'optimiseur d'images de Next (formats déjà autorisés dans next.config),
 * puis par l'original. Renvoie null si l'image est indisponible : la carte affiche alors un repli.
 */
async function portraitData(src: string | undefined, origin: string, width: number): Promise<string | null> {
  const abs = absoluteAsset(src, origin);
  if (!abs) return null;
  const candidates = [
    `${origin}/_next/image?url=${encodeURIComponent(src!.startsWith("/") ? src! : abs)}&w=${width}&q=75`,
    abs,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Accept: "image/jpeg,image/png" }, signal: AbortSignal.timeout(8000) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !/^image\/(jpeg|png)/.test(type)) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 6_000_000) continue;
      return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
    } catch {
      /* essai suivant */
    }
  }
  return null;
}

const safeHex = (c: string | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : GOLD);

function onAccent(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum > 140 ? INK : "#ffffff";
}

function Portrait({ src, position, label, width, height, accent }: { src: string | null; position: string; label: string; width: number; height: number; accent: string }) {
  return (
    <div style={{ position: "relative", display: "flex", width, height, overflow: "hidden", background: "#1d1a22" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={width} height={height} alt="" style={{ width, height, objectFit: "cover", objectPosition: position }} />
      ) : (
        <div style={{ display: "flex", width, height, alignItems: "center", justifyContent: "center", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: Math.round(width / 4), color: "rgba(244,239,228,0.12)" }}>
          ?
        </div>
      )}
      <div
        style={{
          position: "absolute", left: 0, bottom: Math.round(height * 0.05), display: "flex",
          padding: "6px 14px 5px 12px", background: accent, color: onAccent(accent),
          fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: Math.max(18, Math.round(width / 16)),
          letterSpacing: 1, textTransform: "uppercase", border: `3px solid ${INK}`, borderLeft: "none",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function rankInfo(m: Member) {
  const accent = safeHex(rankAccents[m.rank as Rank] ?? m.color);
  const romaji = rankRomaji[m.rank as Rank];
  const country = COUNTRIES.find((c) => c.code === m.country);
  return { accent, romaji, country };
}

function nameSize(name: string, base: number) {
  if (name.length > 26) return Math.round(base * 0.55);
  if (name.length > 18) return Math.round(base * 0.68);
  if (name.length > 12) return Math.round(base * 0.82);
  return base;
}

/** Coupe un texte trop long (les images ne savent pas faire défiler). */
function cut(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const ONE_LINE = { display: "flex", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as const;

/** Contenu enrichi présent dans la fiche (rien n'est inventé). */
function richContent(m: Member) {
  const awards = memberAwards(m);
  const anime = featuredWorks(m.extras?.favoriteAnime, 3);
  const manga = featuredWorks(m.extras?.favoriteManga, 3);
  const track = m.extras?.music?.[0];
  // Titre et artiste coupés séparément : l'artiste reste visible même avec un long titre.
  const trackLine = track && (track.title || track.artist)
    ? [track.title && cut(track.title, track.artist ? 30 : 50), track.artist && cut(track.artist, 22)].filter(Boolean).join(" · ")
    : null;
  return { awards, anime, manga, track, trackLine };
}

function awardText(a: { title: string; year?: number }) {
  return a.year && !a.title.includes(String(a.year)) ? `${a.title} ${a.year}` : a.title;
}

/** Aperçu social 1200×630 : lu en petit dans WhatsApp/Discord, donc peu d'éléments, en grand. */
export async function renderMemberOg(m: Member, origin: string): Promise<ImageResponse> {
  const [fonts, real, anime] = await Promise.all([
    loadFonts(),
    portraitData(m.photo, origin, 640),
    portraitData(m.animeChar, origin, 640),
  ]);
  const { accent, romaji } = rankInfo(m);
  const { awards, anime: favA, manga: favM, trackLine } = richContent(m);
  const both = real && anime;
  const panelW = both ? 300 : 600;
  const favs = [...favA.slice(0, 2), ...favM.slice(0, 2)].slice(0, 3).map((w) => cut(workTitle(w), 24));
  const dense = favs.length > 0 || !!trackLine;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow" }}>
        <div style={{ display: "flex", borderRight: `8px solid ${accent}` }}>
          {(real || !anime) && <Portrait src={real} position={objectPosition(m.extras?.photoFocus, "50% 20%")} label="Réel" width={panelW} height={630} accent={PAPER} />}
          {both && <div style={{ display: "flex", width: 6, height: 630, background: INK }} />}
          {anime && <Portrait src={anime} position={objectPosition(m.extras?.animeFocus, "50% 15%")} label="Anime" width={both ? panelW - 6 : panelW} height={630} accent={accent} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, padding: "40px 44px 34px" }}>
          <div style={{ display: "flex", alignItems: "stretch", border: `3px solid ${PAPER}`, alignSelf: "flex-start", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 2 }}>
            <div style={{ display: "flex", padding: "5px 10px", background: PAPER, color: INK }}>{String(m.id).padStart(3, "0")}</div>
            <div style={{ display: "flex", padding: "5px 12px" }}>GUILDE OTAKU</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: nameSize(m.name, dense ? 84 : 96), lineHeight: 0.92, textTransform: "uppercase", letterSpacing: -1 }}>
              {cut(m.name, 64)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
              <div style={{ display: "flex", padding: "6px 14px", background: accent, color: onAccent(accent), fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 32, textTransform: "uppercase" }}>
                {m.rank}
              </div>
              {romaji && <div style={{ display: "flex", marginLeft: 16, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 28, color: "rgba(244,239,228,0.6)" }}>{romaji}</div>}
            </div>
            {awards.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", marginTop: 16, maxWidth: 520 }}>
                <div style={{ ...ONE_LINE, padding: "6px 12px", border: `3px solid ${GOLD}`, color: GOLD, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, textTransform: "uppercase", maxWidth: awards.length > 1 ? 440 : 520 }}>
                  {cut(awardText(awards[0]), 36)}
                </div>
                {awards.length > 1 && <div style={{ display: "flex", marginLeft: 10, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, color: GOLD }}>+{awards.length - 1}</div>}
              </div>
            )}
            {favs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 18, maxWidth: 520 }}>
                <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 18, letterSpacing: 2, color: accent }}>SUKI NA ANIME · MANGA</div>
                <div style={{ ...ONE_LINE, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 25, marginTop: 2 }}>{cut(favs.join(" / "), 60)}</div>
              </div>
            )}
            {trackLine && (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 12, maxWidth: 520 }}>
                <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 18, letterSpacing: 2, color: accent }}>ONGAKU</div>
                <div style={{ ...ONE_LINE, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 25, marginTop: 2 }}>{trackLine}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 22, color: "rgba(244,239,228,0.6)" }}>
            <div style={{ display: "flex" }}>Nakama de la Girudo</div>
            <div style={{ display: "flex", color: GOLD }}>guilde-otaku.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts }
  );
}

/** Couverture d'une œuvre préférée (jaquette officielle) ou repli neutre. */
function Cover({ src, kind, width, height }: { src: string | null; kind: string; width: number; height: number }) {
  return (
    <div style={{ display: "flex", width, height, flexShrink: 0, border: `3px solid ${INK}`, background: "#d8d0bf", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} width={width} height={height} alt="" style={{ width, height, objectFit: "cover" }} />
        : <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 18, color: "rgba(13,12,16,0.45)" }}>{kind}</div>}
    </div>
  );
}

const hexA = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

let displayFontPromise: Promise<{ name: string; data: Buffer; weight: 400; style: "normal" }[]> | null = null;
function loadDisplayFont() {
  displayFontPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/DelaGothicOne-latin.ttf")),
    readFile(join(process.cwd(), "assets/fonts/DelaGothicOne-latin-ext.ttf")),
  ]).then(([latin, ext]) => [
    { name: "Dela Gothic One", data: latin, weight: 400 as const, style: "normal" as const },
    { name: "Dela Gothic One", data: ext, weight: 400 as const, style: "normal" as const },
  ]);
  return displayFontPromise;
}

/** Drapeau (SVG du site) en data URI, ou null. */
async function flagData(code: string | undefined, origin: string): Promise<string | null> {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  try {
    const res = await fetch(`${origin}/flags/${code.toLowerCase()}.svg`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("svg")) return null;
    return `data:image/svg+xml;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch { return null; }
}

/** Motif de fond : choisi dans l'admin, sinon déduit du numéro du membre. */
function motifLayer(motif: CardMotif, color: string): React.CSSProperties {
  switch (motif) {
    case "points": return { backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1.6px, transparent 2.2px)", backgroundSize: "18px 18px" };
    case "trame": return { backgroundImage: `radial-gradient(circle, ${hexA(color, 0.34)} 3px, transparent 3.6px)`, backgroundSize: "22px 22px" };
    case "vitesse": return { backgroundImage: "repeating-linear-gradient(112deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 2px, transparent 2px, transparent 24px)" };
    case "rayons": return { backgroundImage: `repeating-linear-gradient(135deg, ${hexA(color, 0.12)} 0px, ${hexA(color, 0.12)} 46px, transparent 46px, transparent 92px)` };
  }
}

/** Taille du nom : le mot le plus long tient sur la largeur, deux lignes au plus. */
function displaySize(name: string, width: number, max: number) {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length), 1);
  const bySize = Math.floor(width / (longest * 0.86));
  const byTotal = name.length > 22 ? Math.floor(width * 2 / (name.length * 0.84)) : max;
  return Math.max(54, Math.min(max, bySize, byTotal));
}

/** Coupe un texte au dernier mot entier avant `max` caractères. */
function cutWords(s: string, max: number): string {
  if (s.length <= max) return s;
  const cutAt = s.lastIndexOf(" ", max - 1);
  return `${s.slice(0, cutAt > max * 0.6 ? cutAt : max - 1).replace(/[\s,;:.]+$/, "")}…`;
}

/**
 * Carte Otaku 1080×1350, façon affiche : en haut, le diptyque réel / anime en grand
 * avec le nom et le grade posés sur le bas des images ; en bas, deux colonnes
 * équilibrées (identité, distinctions, bio | jaquettes en grand et musique).
 * Couleur du membre tirée de son portrait anime (ou choisie dans l'admin). Aucun lien.
 */
export async function renderMemberCard(m: Member, origin: string): Promise<ImageResponse> {
  const { awards, anime: favA, manga: favM, track, trackLine } = richContent(m);
  const favs = [...favA, ...favM].slice(0, 4);
  const { accent: rankColor, romaji, country } = rankInfo(m);
  const [fonts, display, real, anime, logo, flag, trackCover, ...covers] = await Promise.all([
    loadFonts(),
    loadDisplayFont(),
    portraitData(m.photo, origin, 1080),
    portraitData(m.animeChar, origin, 1080),
    portraitData(rankLogos[m.rank as Rank], origin, 128),
    flagData(m.country, origin),
    portraitData(track?.cover, origin, 128),
    ...favs.map((w) => portraitData(w.coverUrl, origin, 384)),
  ]);
  // Logo du grade (logo d'anime, souvent large) : hauteur fixe, largeur selon ses proportions.
  const logoW = logo ? await (async () => {
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(Buffer.from(logo.split(",")[1], "base64")).metadata();
      return meta.width && meta.height ? Math.min(190, Math.round((54 * meta.width) / meta.height)) : 54;
    } catch { return 54; }
  })() : 0;
  const custom = m.extras?.card;
  const picked = custom?.color ?? (anime ? await dominantVivid(Buffer.from(anime.split(",")[1], "base64")) : null);
  const color = safeHex(picked ?? rankColor);
  const motif: CardMotif = custom?.motif ?? CARD_MOTIFS[m.id % CARD_MOTIFS.length];
  const on = onAccent(color);

  const PAD = 48, W = 1080 - 2 * PAD;
  const both = real && anime;
  const heroInner = W - 10; // bordure 5 px de chaque côté
  const panelW = both ? Math.floor((heroInner - 6) / 2) : heroInner;
  const nameSize = displaySize(m.name, heroInner - 56, 112);

  // Colonnes du bas : la droite (œuvres, musique) n'existe que s'il y a de quoi la remplir.
  const hasRight = favs.length > 0 || !!trackLine;
  const RIGHT_W = hasRight ? 430 : 0;
  const GAP = hasRight ? 34 : 0;
  const LEFT_W = W - RIGHT_W - GAP;
  const bioMax = hasRight ? (awards.length > 2 ? 200 : 260) : 380;
  const bio = m.bio?.trim() ? cutWords(m.bio.trim(), bioMax) : "";
  // Jaquettes : 1 à 3 sur une rangée (très grandes), 4 en grille 2 × 2.
  const cols = favs.length === 4 ? 2 : Math.max(favs.length, 1);
  const rowsN = Math.ceil(favs.length / cols);
  const coverGap = 14;
  const coverAreaH = trackLine ? 360 : 440;
  let coverW = Math.floor((RIGHT_W - 8 - coverGap * (cols - 1)) / cols);
  let coverH = Math.round(coverW * 1.42);
  if (rowsN * coverH + (rowsN - 1) * coverGap > coverAreaH) {
    coverH = Math.floor((coverAreaH - (rowsN - 1) * coverGap) / rowsN);
    coverW = Math.round(coverH / 1.42);
  }
  const coverOf = new Map(favs.map((w, i) => [w, covers[i] ?? null]));
  // Hauteur estimée du bas ; les photos prennent tout le reste (pas de vide).
  const charsPerLine = Math.floor((LEFT_W - 24) / ((hasRight ? 25 : 28) * 0.5));
  const leftH = ((country || m.birthday) ? 40 : 0)
    + (awards.length ? 16 + Math.min(3, awards.length) * 52 : 0)
    + (bio ? 20 + Math.ceil(bio.length / charsPerLine) * (hasRight ? 35.5 : 40) : 0);
  const rightH = (favs.length ? 32 + rowsN * (coverH + coverGap) : 0) + (trackLine ? (favs.length ? 70 : 120) : 0);
  const bottomH = Math.max(leftH, rightH, 60);
  const HERO_H = Math.round(Math.min(900, Math.max(600, 1350 - 2 * PAD - 44 - 20 - 10 - 40 - 6 - bottomH - 12)));
  const kicker = (t: string) => <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 20, letterSpacing: 3, color }}>{t}</div>;
  const tag = (txt: string, bg: string, fg: string) => (
    <div style={{ position: "absolute", top: 16, left: 16, display: "flex", padding: "4px 12px", background: bg, color: fg, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 2, border: `3px solid ${INK}` }}>{txt}</div>
  );
  const panel = (src: string | null, pos: string, txt: string, bg: string, fg: string) => (
    <div style={{ position: "relative", display: "flex", width: panelW, height: HERO_H, overflow: "hidden", background: "#1d1a22" }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} width={panelW} height={HERO_H} alt="" style={{ width: panelW, height: HERO_H, objectFit: "cover", objectPosition: pos }} />
        : <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontFamily: "Dela Gothic One", fontSize: 120, color: "rgba(244,239,228,0.1)" }}>?</div>}
      {tag(txt, bg, fg)}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow", padding: PAD, overflow: "hidden" }}>
        {/* Fond : teinte du membre et motif. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, display: "flex", backgroundImage: `linear-gradient(170deg, ${hexA(color, 0.55)} 0%, ${hexA(color, 0.16)} 42%, ${hexA(INK, 0)} 70%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, display: "flex", ...motifLayer(motif, color) }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, display: "flex", background: color }} />

        {/* En-tête */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
          <div style={{ display: "flex", alignItems: "stretch", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>
            <div style={{ display: "flex", width: 12, background: color, border: `3px solid ${PAPER}`, borderRight: "none" }} />
            <div style={{ display: "flex", padding: "5px 14px", background: PAPER, color: INK, border: `3px solid ${PAPER}` }}>CARTE DE NAKAMA</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Dela Gothic One", fontSize: 24, letterSpacing: 1 }}>GUILDE OTAKU</div>
        </div>

        {/* Affiche : diptyque, nom et grade sur le bas des images */}
        <div style={{ position: "relative", display: "flex", marginTop: 20, width: W, height: HERO_H + 10, border: `5px solid ${PAPER}`, background: PAPER, boxShadow: `16px 16px 0 ${color}` }}>
          {(real || !anime) && panel(real, objectPosition(m.extras?.photoFocus, "50% 20%"), "RÉEL", PAPER, INK)}
          {both && <div style={{ display: "flex", width: 6, height: HERO_H, background: PAPER }} />}
          {anime && panel(anime, objectPosition(m.extras?.animeFocus, "50% 15%"), "ANIME", color, on)}
          <div style={{ position: "absolute", left: 0, bottom: 0, width: heroInner, height: 330, display: "flex", backgroundImage: `linear-gradient(0deg, ${hexA(INK, 0.96)} 0%, ${hexA(INK, 0.82)} 40%, ${hexA(INK, 0)} 100%)` }} />
          <div style={{ position: "absolute", left: 28, bottom: 24, width: heroInner - 56, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Dela Gothic One", fontSize: nameSize, lineHeight: 1.02, color: PAPER, textShadow: `5px 5px 0 ${color}` }}>
              {cut(m.name, 40)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} width={logoW} height={54} alt="" style={{ width: logoW, height: 54, objectFit: "contain", marginRight: 14 }} />
              )}
              <div style={{ display: "flex", padding: "6px 16px", background: rankColor, color: onAccent(rankColor), border: `3px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 30, textTransform: "uppercase" }}>{m.rank}</div>
              {romaji && <div style={{ display: "flex", marginLeft: 16, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 30, color }}>{romaji}</div>}
            </div>
          </div>
        </div>

        {/* Bas : deux colonnes */}
        <div style={{ position: "relative", display: "flex", flex: 1, marginTop: 40, paddingBottom: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", width: LEFT_W }}>
            {(country || m.birthday) && (
              <div style={{ display: "flex", alignItems: "center", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28 }}>
                {country && (
                  <div style={{ display: "flex", alignItems: "center", marginRight: 26 }}>
                    {flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={flag} width={36} height={25} alt="" style={{ width: 36, height: 25, marginRight: 10, border: `2px solid ${PAPER}` }} />
                    )}
                    {country.label}
                  </div>
                )}
                {m.birthday && (
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <div style={{ display: "flex", fontSize: 18, letterSpacing: 2, color: "rgba(244,239,228,0.6)", marginRight: 10 }}>ANNIVERSAIRE</div>
                    {m.birthday}
                  </div>
                )}
              </div>
            )}
            {awards.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16 }}>
                {awards.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ ...ONE_LINE, marginRight: 10, marginBottom: 10, padding: "5px 12px", background: i === 0 ? GOLD : "transparent", color: i === 0 ? INK : GOLD, border: `3px solid ${GOLD}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 23, textTransform: "uppercase", maxWidth: LEFT_W }}>
                    {cut(awardText(a), 34)}
                  </div>
                ))}
              </div>
            )}
            {bio && (
              <div style={{ display: "flex", marginTop: awards.length ? 8 : 20, paddingLeft: 18, borderLeft: `6px solid ${color}`, fontSize: hasRight ? 25 : 28, lineHeight: 1.42, color: "rgba(244,239,228,0.92)" }}>
                {bio}
              </div>
            )}
          </div>

          {hasRight && (
            <div style={{ display: "flex", flexDirection: "column", width: RIGHT_W, marginLeft: GAP }}>
              {favs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {kicker("SES ŒUVRES PRÉFÉRÉES")}
                  <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10, width: cols * (coverW + 6) + (cols - 1) * coverGap }}>
                    {favs.map((w, i) => (
                      <div key={i} style={{ display: "flex", marginRight: (i % cols) < cols - 1 ? coverGap : 0, marginBottom: coverGap, boxShadow: `6px 6px 0 ${color}` }}>
                        <Cover src={coverOf.get(w) ?? null} kind={w.kind === "ANIME" ? "ANIME" : "MANGA"} width={coverW} height={coverH} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {trackLine && track && (
                <div style={{ display: "flex", alignItems: "center", marginTop: favs.length ? 4 : 0 }}>
                  {trackCover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trackCover} width={favs.length ? 60 : 110} height={favs.length ? 60 : 110} alt="" style={{ width: favs.length ? 60 : 110, height: favs.length ? 60 : 110, objectFit: "cover", border: `3px solid ${PAPER}`, marginRight: 14 }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    {kicker(`ONGAKU · ${PROVIDER_LABEL[track.provider].toUpperCase()}`)}
                    <div style={{ ...ONE_LINE, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 27, maxWidth: RIGHT_W - (trackCover ? 80 : 0) }}>{trackLine}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: [...(await fonts), ...display] }
  );
}

/** Image générique de la Guilde (anciennes URL sans identifiant, membre inconnu). */
export async function renderGuildOg(): Promise<ImageResponse> {
  const fonts = await loadFonts();
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: INK, color: PAPER, padding: 80, fontFamily: "Barlow Condensed" }}>
        <div style={{ display: "flex", fontWeight: 900, fontSize: 150, lineHeight: 0.9 }}>GUILDE</div>
        <div style={{ display: "flex", fontWeight: 900, fontSize: 150, lineHeight: 0.9, color: GOLD }}>OTAKU</div>
        <div style={{ display: "flex", marginTop: 30, fontWeight: 700, fontSize: 36, color: "rgba(244,239,228,0.65)" }}>Le registre des Nakama, depuis 2020</div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}

export const SHARE_CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
