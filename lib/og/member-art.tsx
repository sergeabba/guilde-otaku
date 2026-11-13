// Images de partage d'un membre : aperçu social (1200×630) et carte Otaku (1080×1350).
// Rendu serveur via next/og. Les données viennent toujours de la base, à partir d'un
// identifiant validé : aucune URL, couleur ou texte n'est lu dans la requête.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Member } from "../../data/members";
import { rankAccents, rankRomaji, type Rank } from "../../app/config/ranks";
import { COUNTRIES } from "../../app/config/countries";
import { featuredWorks, memberAwards, objectPosition, workTitle } from "../member-extras";
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

/** Carte Otaku 1080×1350 : diptyque, identité, palmarès, favoris et musique (si renseignés). */
export async function renderMemberCard(m: Member, origin: string): Promise<ImageResponse> {
  const { awards, anime: favA, manga: favM, track, trackLine } = richContent(m);
  const favs = [...favA, ...favM];
  const [fonts, real, anime, trackCover, ...covers] = await Promise.all([
    loadFonts(),
    portraitData(m.photo, origin, 1080),
    portraitData(m.animeChar, origin, 1080),
    portraitData(track?.cover, origin, 128),
    ...favs.map((w) => portraitData(w.coverUrl, origin, 256)),
  ]);
  const { accent, romaji, country } = rankInfo(m);
  const both = real && anime;
  const W = 1080 - 2 * 44 - 2 * 6;
  const extra = (awards.length ? 1 : 0) + (favs.length ? 2 : 0) + (trackLine ? 1 : 0);
  // Plus il y a de contenu, plus le diptyque se resserre (jamais sous 560 px).
  const panelH = Math.max(560, 860 - extra * 75);
  const panelW = both ? Math.floor((W - 8) / 2) : W;
  const coverOf = new Map(favs.map((w, i) => [w, covers[i] ?? null]));
  const columns = [
    { label: "SUKI NA ANIME", works: favA },
    { label: "SUKI NA MANGA", works: favM },
  ].filter((c) => c.works.length);
  const colW = columns.length > 1 ? Math.floor((W - 24) / 2) : W;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: PAPER, padding: 44, fontFamily: "Barlow", color: INK }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, fontFamily: "Barlow Condensed" }}>
          <div style={{ display: "flex", alignItems: "stretch", border: `4px solid ${INK}`, fontWeight: 900, fontSize: 28, letterSpacing: 2 }}>
            <div style={{ display: "flex", padding: "6px 12px", background: INK, color: PAPER }}>{String(m.id).padStart(3, "0")}</div>
            <div style={{ display: "flex", padding: "6px 14px" }}>CARTE OTAKU</div>
          </div>
          <div style={{ display: "flex", fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>GUILDE OTAKU</div>
        </div>

        <div style={{ display: "flex", border: `6px solid ${INK}`, boxShadow: `14px 14px 0 ${accent}`, background: INK }}>
          {(real || !anime) && <Portrait src={real} position={objectPosition(m.extras?.photoFocus, "50% 20%")} label="Dans la vraie vie" width={panelW} height={panelH} accent={PAPER} />}
          {both && <div style={{ display: "flex", width: 8, height: panelH, background: INK }} />}
          {anime && <Portrait src={anime} position={objectPosition(m.extras?.animeFocus, "50% 15%")} label="Version anime" width={panelW} height={panelH} accent={accent} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", marginTop: 26 }}>
          <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: nameSize(m.name, extra > 2 ? 96 : 110), lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -1 }}>
            {cut(m.name, 44)}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
            <div style={{ display: "flex", padding: "6px 16px", background: accent, color: onAccent(accent), border: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 36, textTransform: "uppercase" }}>
              {m.rank}
            </div>
            {romaji && <div style={{ display: "flex", marginLeft: 18, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 32, color: "rgba(13,12,16,0.6)" }}>{romaji}</div>}
          </div>

          {awards.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 14, maxWidth: W }}>
              {awards.slice(0, 2).map((a, i) => (
                <div key={i} style={{ ...ONE_LINE, marginRight: 10, padding: "5px 12px", background: i === 0 ? GOLD : PAPER, border: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 26, textTransform: "uppercase", maxWidth: awards.length > 1 ? 430 : W }}>
                  {cut(awardText(a), 30)}
                </div>
              ))}
              {awards.length > 2 && <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 26 }}>+{awards.length - 2}</div>}
            </div>
          )}

          {columns.length > 0 && (
            <div style={{ display: "flex", marginTop: 18 }}>
              {columns.map((c, ci) => (
                <div key={c.label} style={{ display: "flex", flexDirection: "column", width: colW, marginLeft: ci ? 24 : 0 }}>
                  <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 2 }}>{c.label}</div>
                  <div style={{ display: "flex", marginTop: 6 }}>
                    {c.works.slice(0, columns.length > 1 ? 3 : 5).map((w, i) => (
                      <div key={i} style={{ display: "flex", marginRight: 8 }}>
                        <Cover src={coverOf.get(w) ?? null} kind={w.kind === "ANIME" ? "ANIME" : "MANGA"} width={columns.length > 1 ? 72 : 80} height={columns.length > 1 ? 102 : 114} />
                      </div>
                    ))}
                  </div>
                  <div style={{ ...ONE_LINE, marginTop: 6, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 24, maxWidth: colW }}>
                    {cut(c.works.slice(0, 3).map((w) => cut(workTitle(w), 22)).join(" / "), columns.length > 1 ? 40 : 80)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {trackLine && track && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 16, maxWidth: W }}>
              {trackCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trackCover} width={52} height={52} alt="" style={{ width: 52, height: 52, objectFit: "cover", border: `3px solid ${INK}`, marginRight: 12 }} />
              )}
              <div style={{ display: "flex", padding: "4px 10px", background: INK, color: PAPER, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 2 }}>ONGAKU</div>
              <div style={{ ...ONE_LINE, marginLeft: 12, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 30, maxWidth: W - (trackCover ? 344 : 280) }}>{trackLine}</div>
              <div style={{ display: "flex", marginLeft: 12, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 22, color: "rgba(13,12,16,0.55)" }}>{PROVIDER_LABEL[track.provider]}</div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 12, borderTop: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 26 }}>
            <div style={{ ...ONE_LINE, maxWidth: 520 }}>
              {[country?.label, m.birthday ? `Anniversaire : ${m.birthday}` : null].filter(Boolean).join("   /   ")}
            </div>
            <div style={{ display: "flex" }}>guilde-otaku.vercel.app/membres/{m.id}</div>
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: await fonts }
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
