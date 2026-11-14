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
    `${origin}/_next/image?url=${encodeURIComponent(src!.startsWith("/") ? src! : abs)}&w=${width}&q=80`,
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

/**
 * Carte Otaku 1080×1350, dans l'esprit de la fiche : fond sombre teinté à la couleur
 * du membre (tirée de son portrait anime, ou choisie dans l'admin), numéro de dossier
 * en filigrane, diptyque réel / anime à ombre dure, nom en grand, grade, palmarès,
 * pays et anniversaire, bio, favoris et musique s'ils sont renseignés. Aucun lien.
 */
export async function renderMemberCard(m: Member, origin: string): Promise<ImageResponse> {
  const { awards, anime: favA, manga: favM, track, trackLine } = richContent(m);
  const favs = [...favA, ...favM].slice(0, 6);
  const { accent: rankColor, romaji, country } = rankInfo(m);
  const [fonts, display, real, anime, logo, flag, trackCover, ...covers] = await Promise.all([
    loadFonts(),
    loadDisplayFont(),
    portraitData(m.photo, origin, 1080),
    portraitData(m.animeChar, origin, 1080),
    portraitData(rankLogos[m.rank as Rank], origin, 128),
    flagData(m.country, origin),
    portraitData(track?.cover, origin, 128),
    ...favs.map((w) => portraitData(w.coverUrl, origin, 256)),
  ]);
  const custom = m.extras?.card;
  const picked = custom?.color ?? (anime ? await dominantVivid(Buffer.from(anime.split(",")[1], "base64")) : null);
  const color = safeHex(picked ?? rankColor);
  const motif: CardMotif = custom?.motif ?? CARD_MOTIFS[m.id % CARD_MOTIFS.length];
  const on = onAccent(color);

  const PAD = 60, W = 1080 - 2 * PAD;
  const both = real && anime;
  const bio = m.bio?.trim() ? cut(m.bio.trim(), 170) : "";
  const nameSize = displaySize(m.name, W, 124);
  // Hauteur des photos = place restante une fois le texte estimé : pas de vide au milieu.
  const nameLines = Math.min(2, Math.max(1, Math.ceil((cut(m.name, 40).length * nameSize * 0.72) / W)));
  const bioLines = bio ? Math.ceil(bio.length / ((country || m.birthday) ? 46 : 70)) : 0;
  const textH = nameLines * nameSize * 1.02 + 16 + 64 + (awards.length ? 62 : 0)
    + ((country || m.birthday || bio) ? 20 + Math.max(country || m.birthday ? 78 : 0, bioLines * 35) : 0)
    + ((favs.length || trackLine) ? 22 + (favs.length ? 136 : 70) : 0);
  const panelH = Math.round(Math.min(780, Math.max(440, 1350 - 2 * PAD - 44 - 30 - 22 - 42 - textH - 10)));
  const panelW = both ? Math.floor((W - 26 - 6) / 2) : W - 26;
  const num = String(m.id).padStart(3, "0");
  const coverOf = new Map(favs.map((w, i) => [w, covers[i] ?? null]));
  const label = (txt: string, bg: string, fg: string) => (
    <div style={{ position: "absolute", left: 14, bottom: 14, display: "flex", padding: "5px 12px", background: bg, color: fg, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 2, border: `3px solid ${INK}` }}>{txt}</div>
  );
  const panel = (src: string | null, pos: string, txt: string, bg: string, fg: string) => (
    <div style={{ position: "relative", display: "flex", width: panelW, height: panelH, overflow: "hidden", background: "#1d1a22" }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} width={panelW} height={panelH} alt="" style={{ width: panelW, height: panelH, objectFit: "cover", objectPosition: pos }} />
        : <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontFamily: "Dela Gothic One", fontSize: 120, color: "rgba(244,239,228,0.1)" }}>?</div>}
      {label(txt, bg, fg)}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow", padding: PAD, overflow: "hidden" }}>
        {/* Fond : teinte du membre, motif, numéro en filigrane. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, display: "flex", backgroundImage: `linear-gradient(158deg, ${hexA(color, 0.62)} 0%, ${hexA(color, 0.2)} 38%, ${hexA(INK, 0)} 72%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, display: "flex", ...motifLayer(motif, color) }} />
        <div style={{ position: "absolute", top: 1010, left: 400, display: "flex", fontFamily: "Dela Gothic One", fontSize: 270, lineHeight: 1, color: hexA(color, 0.1), WebkitTextStroke: `4px ${hexA(color, 0.5)}` }}>{num}</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, display: "flex", background: color }} />

        {/* En-tête */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "stretch", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 26, letterSpacing: 2 }}>
            <div style={{ display: "flex", padding: "6px 12px", background: PAPER, color: INK, border: `3px solid ${PAPER}` }}>#{num}</div>
            <div style={{ display: "flex", padding: "6px 14px", border: `3px solid ${PAPER}`, borderLeft: "none" }}>DOSSIER D&apos;AVENTURIER</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Dela Gothic One", fontSize: 26, letterSpacing: 1 }}>GUILDE OTAKU</div>
        </div>

        {/* Diptyque */}
        <div style={{ position: "relative", display: "flex", marginTop: 30, alignSelf: "flex-start" }}>
          <div style={{ position: "absolute", left: -18, top: 40, width: 10, height: panelH - 80, display: "flex", background: color }} />
          <div style={{ display: "flex", border: `5px solid ${PAPER}`, background: PAPER, boxShadow: `22px 22px 0 ${color}` }}>
            {(real || !anime) && panel(real, objectPosition(m.extras?.photoFocus, "50% 20%"), "RÉEL", PAPER, INK)}
            {both && <div style={{ display: "flex", width: 6, height: panelH, background: PAPER }} />}
            {anime && panel(anime, objectPosition(m.extras?.animeFocus, "50% 15%"), "ANIME", color, on)}
          </div>
        </div>

        {/* Identité */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", marginTop: 42 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Dela Gothic One", fontSize: nameSize, lineHeight: 1.02, color: PAPER, textShadow: `6px 6px 0 ${color}`, maxWidth: W }}>
              {cut(m.name, 40)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} width={58} height={58} alt="" style={{ width: 58, height: 58, objectFit: "contain", marginRight: 14 }} />
              )}
              <div style={{ display: "flex", padding: "5px 16px", background: rankColor, color: onAccent(rankColor), border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${PAPER}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 32, textTransform: "uppercase" }}>{m.rank}</div>
              {romaji && <div style={{ display: "flex", marginLeft: 18, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 30, color }}>{romaji}</div>}
            </div>
            {awards.length > 0 && (
              <div style={{ display: "flex", marginTop: 16 }}>
                {awards.slice(0, 2).map((a, i) => (
                  <div key={i} style={{ ...ONE_LINE, marginRight: 10, padding: "5px 14px", background: i === 0 ? GOLD : "transparent", color: i === 0 ? INK : GOLD, border: `3px solid ${GOLD}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 25, textTransform: "uppercase", maxWidth: awards.length > 1 ? 440 : W }}>
                    {cut(awardText(a), 32)}
                  </div>
                ))}
                {awards.length > 2 && <div style={{ display: "flex", alignItems: "center", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 25, color: GOLD }}>+{awards.length - 2}</div>}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "stretch", marginTop: 20 }}>
            {(country || m.birthday) && (
              <div style={{ display: "flex", border: `3px solid ${PAPER}`, flexShrink: 0 }}>
                {country && (
                  <div style={{ display: "flex", flexDirection: "column", padding: "8px 16px", borderRight: m.birthday ? `3px solid ${PAPER}` : "none" }}>
                    <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 17, letterSpacing: 2, color: "rgba(244,239,228,0.6)" }}>PAYS</div>
                    <div style={{ display: "flex", alignItems: "center", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28 }}>
                      {flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={flag} width={32} height={22} alt="" style={{ width: 32, height: 22, marginRight: 8 }} />
                      )}
                      {country.label}
                    </div>
                  </div>
                )}
                {m.birthday && (
                  <div style={{ display: "flex", flexDirection: "column", padding: "8px 16px" }}>
                    <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 17, letterSpacing: 2, color: "rgba(244,239,228,0.6)" }}>ANNIVERSAIRE</div>
                    <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28 }}>{m.birthday}</div>
                  </div>
                )}
              </div>
            )}
            {bio && (
              <div style={{ display: "flex", flex: 1, marginLeft: country || m.birthday ? 22 : 0, paddingLeft: 18, borderLeft: `6px solid ${color}`, fontSize: 25, lineHeight: 1.38, color: "rgba(244,239,228,0.9)" }}>
                {bio}
              </div>
            )}
          </div>

          {(favs.length > 0 || trackLine) && (
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22 }}>
              {favs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 20, letterSpacing: 3, color }}>SUKI NA SAKUHIN · SES ŒUVRES</div>
                  <div style={{ display: "flex", marginTop: 8 }}>
                    {favs.map((w, i) => (
                      <div key={i} style={{ display: "flex", marginRight: 10 }}>
                        <Cover src={coverOf.get(w) ?? null} kind={w.kind === "ANIME" ? "ANIME" : "MANGA"} width={70} height={100} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {trackLine && track && (
                <div style={{ display: "flex", alignItems: "center", maxWidth: favs.length ? 420 : W }}>
                  {trackCover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trackCover} width={64} height={64} alt="" style={{ width: 64, height: 64, objectFit: "cover", border: `3px solid ${PAPER}`, marginRight: 12 }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 18, letterSpacing: 3, color }}>ONGAKU · {PROVIDER_LABEL[track.provider].toUpperCase()}</div>
                    <div style={{ ...ONE_LINE, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 26, maxWidth: favs.length ? 340 : W - 80 }}>{trackLine}</div>
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
