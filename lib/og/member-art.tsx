// Images de partage d'un membre : aperçu social (1200×630) et carte Otaku (1080×1350).
// Rendu serveur via next/og. Les données viennent toujours de la base, à partir d'un
// identifiant validé : aucune URL, couleur ou texte n'est lu dans la requête.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Member } from "../../data/members";
import { rankAccents, rankRomaji, type Rank } from "../../app/config/ranks";
import { COUNTRIES } from "../../app/config/countries";
import { objectPosition } from "../member-extras";
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
  if (name.length > 22) return Math.round(base * 0.62);
  if (name.length > 15) return Math.round(base * 0.78);
  return base;
}

/** Aperçu social 1200×630 : deux visages à gauche, identité à droite. */
export async function renderMemberOg(m: Member, origin: string): Promise<ImageResponse> {
  const [fonts, real, anime] = await Promise.all([
    loadFonts(),
    portraitData(m.photo, origin, 640),
    portraitData(m.animeChar, origin, 640),
  ]);
  const { accent, romaji } = rankInfo(m);
  const both = real && anime;
  const panelW = both ? 300 : 600;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow" }}>
        <div style={{ display: "flex", borderRight: `8px solid ${accent}` }}>
          {(real || !anime) && <Portrait src={real} position={objectPosition(m.extras?.photoFocus, "50% 20%")} label="Réel" width={panelW} height={630} accent={PAPER} />}
          {both && <div style={{ display: "flex", width: 6, height: 630, background: INK }} />}
          {anime && <Portrait src={anime} position={objectPosition(m.extras?.animeFocus, "50% 15%")} label="Anime" width={both ? panelW - 6 : panelW} height={630} accent={accent} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "46px 48px 40px" }}>
          <div style={{ display: "flex", alignItems: "stretch", border: `3px solid ${PAPER}`, alignSelf: "flex-start", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 2 }}>
            <div style={{ display: "flex", padding: "5px 10px", background: PAPER, color: INK }}>{String(m.id).padStart(3, "0")}</div>
            <div style={{ display: "flex", padding: "5px 12px" }}>GUILDE OTAKU</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: nameSize(m.name, 96), lineHeight: 0.92, textTransform: "uppercase", letterSpacing: -1 }}>
              {m.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 22 }}>
              <div style={{ display: "flex", padding: "6px 14px", background: accent, color: onAccent(accent), fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 34, textTransform: "uppercase" }}>
                {m.rank}
              </div>
              {romaji && <div style={{ display: "flex", marginLeft: 16, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 30, color: "rgba(244,239,228,0.6)" }}>{romaji}</div>}
            </div>
            {m.badge && (
              <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 18, padding: "6px 12px", border: `3px solid ${GOLD}`, color: GOLD, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, textTransform: "uppercase" }}>
                {m.badge}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 24, color: "rgba(244,239,228,0.6)" }}>
            <div style={{ display: "flex" }}>Nakama de la Girudo</div>
            <div style={{ display: "flex", color: GOLD }}>guilde-otaku.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts }
  );
}

/** Carte Otaku 1080×1350 : diptyque réel / anime, identité, grade, distinction. */
export async function renderMemberCard(m: Member, origin: string): Promise<ImageResponse> {
  const [fonts, real, anime] = await Promise.all([
    loadFonts(),
    portraitData(m.photo, origin, 1080),
    portraitData(m.animeChar, origin, 1080),
  ]);
  const { accent, romaji, country } = rankInfo(m);
  const both = real && anime;
  const W = 1080 - 2 * 44 - 2 * 6;
  const panelH = 860;
  const panelW = both ? Math.floor((W - 8) / 2) : W;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: PAPER, padding: 44, fontFamily: "Barlow", color: INK }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, fontFamily: "Barlow Condensed" }}>
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

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", marginTop: 30 }}>
          <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: nameSize(m.name, 110), lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -1 }}>
            {m.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginTop: 18 }}>
            <div style={{ display: "flex", padding: "6px 16px", background: accent, color: onAccent(accent), border: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 38, textTransform: "uppercase" }}>
              {m.rank}
            </div>
            {romaji && <div style={{ display: "flex", marginLeft: 18, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 34, color: "rgba(13,12,16,0.6)" }}>{romaji}</div>}
            {m.badge && (
              <div style={{ display: "flex", marginLeft: 18, padding: "6px 14px", background: GOLD, border: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28, textTransform: "uppercase" }}>
                {m.badge}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 14, borderTop: `4px solid ${INK}`, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 28 }}>
            <div style={{ display: "flex" }}>
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
