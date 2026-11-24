// Carte « planche de manga » 1080×1350 : la fiche découpée en cases, comme le mode
// « Lire en planche » du site (portrait anime, bio en bulle, photo, combat, bankai,
// extension du territoire). Rendu serveur via next/og, données de la base uniquement.
import { ImageResponse } from "next/og";
import type { Member } from "../../data/members";
import type { Pouvoirs } from "../../data/pouvoirs";
import { rankAccents, rankRomaji, type Rank } from "../../app/config/ranks";
import { COUNTRIES } from "../../app/config/countries";
import { memberAwards, objectPosition } from "../member-extras";
import { CARD_SIZE, INK, PAPER, loadDisplayFont, loadFonts, portraitData } from "./member-art";

const WHITE = "#fffdf8";
const GOLD = "#c9a84c";
const safeHex = (c: string | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : GOLD);
const hexA = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.55 ? INK : WHITE;
}
/** Coupe au dernier mot entier avant `max` caractères. */
function cutWords(s: string, max: number) {
  if (s.length <= max) return s;
  const at = s.lastIndexOf(" ", max - 1);
  return `${s.slice(0, at > max * 0.6 ? at : max - 1).replace(/[\s,;:.(]+$/, "")}…`;
}
/** Coupe un nom long en deux lignes, au mot le plus proche du milieu. */
function splitName(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (name.length <= 13 || words.length < 2) return [name.trim()];
  let best = 1, gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < gap) { gap = d; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}
const STATS: [keyof Member["stats"], string][] = [["force", "FORCE"], ["vitesse", "VITESSE"], ["technique", "TECHNIQUE"]];
const flex = { display: "flex" } as const;
const BORDER = `5px solid ${INK}`;
const LINES = `repeating-linear-gradient(115deg, ${hexA(WHITE, 0.1)} 0px, ${hexA(WHITE, 0.1)} 3px, transparent 3px, transparent 26px)`;
const DOTS = `radial-gradient(circle, ${INK} 1.6px, transparent 2.2px)`;

export async function renderMemberPlanche(m: Member, pouvoirs: Pouvoirs | null, origin: string): Promise<ImageResponse> {
  const accent = safeHex(rankAccents[m.rank as Rank] ?? m.color);
  const on = onAccent(accent);
  const romaji = rankRomaji[m.rank as Rank];
  const country = COUNTRIES.find((c) => c.code === m.country);
  const x = m.extras ?? {};
  const stats = m.stats && STATS.some(([k]) => (m.stats[k] ?? 0) > 0) ? m.stats : null;
  const special = m.special?.name && !["—", "Inconnu"].includes(m.special.name) ? m.special : null;
  const award = memberAwards(m)[0];
  const [fonts, display, anime, real] = await Promise.all([
    loadFonts(), loadDisplayFont(),
    portraitData(m.animeChar || m.photo, origin, 828),
    m.animeChar && m.photo ? portraitData(m.photo, origin, 640) : Promise.resolve(null),
  ]);

  const bio = cutWords((m.bio || "").replace(/\s+/g, " ").trim(), 230);
  const bioSize = bio.length < 110 ? 30 : bio.length < 160 ? 26 : bio.length < 200 ? 23 : 21;
  // Nom sur une ligne, ou deux (coupé au mot le plus proche du milieu) s'il est long.
  const nameLines = splitName(m.name);
  const longest = Math.max(...nameLines.map((l) => l.length), 3);
  const nameSize = Math.max(34, Math.min(72, Math.floor(500 / (longest * 0.86))));
  const caption = [m.birthday && `ANNIVERSAIRE : ${m.birthday.toUpperCase()}`, country?.label.toUpperCase()].filter((c): c is string => !!c);
  const panel = { ...flex, position: "relative", overflow: "hidden", border: BORDER, background: WHITE } as const;

  const Power = ({ kind, p, dark }: { kind: string; p: Pouvoirs["bankai"]; dark: boolean }) => (
    <div style={{ ...panel, flex: 1, flexDirection: "column", justifyContent: "flex-end", padding: "20px 22px", background: INK, color: WHITE, backgroundImage: dark ? `radial-gradient(circle at 50% 120%, ${hexA(accent, 0.6)} 0%, ${INK} 62%)` : LINES }}>
      <div style={{ ...flex, position: "absolute", top: 18, left: 20, background: accent, color: on, padding: "4px 12px", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 2 }}>{kind}</div>
      <div style={{ ...flex, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: p.nom.length > 24 ? 34 : 42, lineHeight: 1, textTransform: "uppercase" }}>{p.nom}</div>
      <div style={{ ...flex, marginTop: 6, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 23, color: hexA(WHITE, 0.75) }}>{p.sens}</div>
      <div style={{ ...flex, marginTop: 10, fontSize: 21, lineHeight: 1.3 }}>{cutWords(p.effet, 150)}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ ...flex, position: "relative", width: "100%", height: "100%", background: INK, fontFamily: "Barlow", color: INK }}>
        {/* Ombre décalée à la couleur du grade, puis la page de papier. */}
        <div style={{ ...flex, position: "absolute", left: 40, top: 40, width: 1012, height: 1282, background: accent }} />
        <div style={{ ...flex, position: "absolute", left: 24, top: 24, width: 1012, height: 1282, flexDirection: "column", gap: 14, padding: 16, background: WHITE, border: BORDER }}>

          {/* Rangée 1 : portrait anime | bio en bulle */}
          <div style={{ ...flex, gap: 14, height: 540 }}>
            <div style={{ ...panel, width: 600, backgroundImage: DOTS, backgroundSize: "9px 9px" }}>
              {anime && <img src={anime} width={600} height={540} alt="" style={{ width: 600, height: 540, objectFit: "cover", objectPosition: objectPosition(m.animeChar ? x.animeFocus : x.photoFocus, "50% 15%") }} />}
              <div style={{ ...flex, position: "absolute", top: 0, left: 0, background: accent, color: on, padding: "6px 16px", borderRight: BORDER, borderBottom: BORDER, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 26, letterSpacing: 2 }}>
                {`CHAPITRE ${String(m.id).padStart(2, "0")}`}
              </div>
              <div style={{ ...flex, position: "absolute", left: 18, bottom: 18, maxWidth: 560, flexDirection: "column", background: INK, color: WHITE, padding: "10px 18px 8px", border: `4px solid ${WHITE}` }}>
                <div style={{ ...flex, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 2, color: accent }}>
                  {[m.rank.toUpperCase(), romaji?.toUpperCase(), x.displayNameRomaji?.toUpperCase()].filter(Boolean).join(" · ")}
                </div>
                {nameLines.map((l, i) => <div key={i} style={{ ...flex, fontFamily: "Dela Gothic One", fontSize: nameSize, lineHeight: 1.12, whiteSpace: "nowrap", textTransform: "uppercase" }}>{l}</div>)}
              </div>
            </div>
            <div style={{ ...panel, flex: 1, flexDirection: "column", justifyContent: "center", padding: "24px 20px", background: PAPER }}>
              <div style={{ ...flex, justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: 230, padding: "30px 26px", background: WHITE, border: BORDER, borderRadius: 110, fontSize: bioSize, lineHeight: 1.3 }}>
                {bio || "…"}
              </div>
              {/* Bulles de pensée sous le texte */}
              <div style={{ ...flex, marginLeft: 60, marginTop: 10, width: 30, height: 30, borderRadius: 15, background: WHITE, border: BORDER }} />
              <div style={{ ...flex, marginLeft: 40, marginTop: 6, width: 18, height: 18, borderRadius: 9, background: WHITE, border: `4px solid ${INK}` }} />
              {caption.length > 0 && (
                <div style={{ ...flex, flexDirection: "column", marginTop: 20, alignSelf: "flex-start", background: INK, color: WHITE, padding: "6px 12px", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 21, letterSpacing: 1.5 }}>
                  {caption.map((c) => <div key={c} style={flex}>{c}</div>)}
                </div>
              )}
            </div>
          </div>

          {/* Rangée 2 : photo | combat | attaque spéciale */}
          {(real || stats || special) && (
            <div style={{ ...flex, gap: 14, height: 250 }}>
              {real && (
                <div style={{ ...panel, width: 280 }}>
                  <img src={real} width={280} height={250} alt="" style={{ width: 280, height: 250, objectFit: "cover", objectPosition: objectPosition(x.photoFocus, "50% 20%"), filter: "grayscale(1) contrast(1.15)" }} />
                  <div style={{ ...flex, position: "absolute", left: 10, top: 10, background: WHITE, border: `3px solid ${INK}`, padding: "3px 9px", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 19, letterSpacing: 1 }}>DANS LA VRAIE VIE…</div>
                </div>
              )}
              {stats && (
                <div style={{ ...panel, flex: 1, flexDirection: "column", justifyContent: "center", gap: 16, padding: "18px 22px" }}>
                  <div style={{ ...flex, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 26, letterSpacing: 2 }}>FICHE DE COMBAT</div>
                  {STATS.map(([k, label]) => {
                    const v = Math.min(100, m.stats[k] ?? 0);
                    return (
                      <div key={k} style={{ ...flex, alignItems: "center", gap: 14 }}>
                        <div style={{ ...flex, width: 120, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 23 }}>{label}</div>
                        <div style={{ ...flex, flex: 1, height: 22, border: `4px solid ${INK}` }}><div style={{ ...flex, width: `${v}%`, height: "100%", background: INK }} /></div>
                        <div style={{ ...flex, width: 62, justifyContent: "flex-end", fontFamily: "Dela Gothic One", fontSize: 30 }}>{String(v)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {special && (
                <div style={{ ...panel, ...(stats ? { width: 250 } : { flex: 1 }), flexDirection: "column", justifyContent: "flex-end", padding: 18, background: INK, color: WHITE, backgroundImage: LINES }}>
                  <div style={{ ...flex, position: "absolute", top: 20, left: 16, fontFamily: "Dela Gothic One", fontSize: 40, color: accent, transform: "rotate(-8deg)" }}>BAAM !</div>
                  <div style={{ ...flex, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: "uppercase" }}>{cutWords(special.name, 40)}</div>
                  {special.effect && special.effect !== "—" && <div style={{ ...flex, marginTop: 6, fontSize: 18, lineHeight: 1.25, color: hexA(WHITE, 0.85) }}>{cutWords(special.effect, 80)}</div>}
                </div>
              )}
            </div>
          )}

          {/* Rangée 3 : bankai | extension du territoire */}
          {pouvoirs && (
            <div style={{ ...flex, gap: 14, flex: 1 }}>
              <Power kind="BANKAI" p={pouvoirs.bankai} dark={false} />
              <Power kind="EXTENSION DU TERRITOIRE" p={pouvoirs.domaine} dark />
            </div>
          )}

          {/* Fin de la planche */}
          <div style={{ ...panel, height: 96, alignItems: "center", justifyContent: "space-between", padding: "0 22px", marginTop: pouvoirs ? 0 : "auto" }}>
            <div style={{ ...flex, flexDirection: "column", maxWidth: 680 }}>
              <div style={{ ...flex, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 24, letterSpacing: 2 }}>FIN DU CHAPITRE</div>
              {award && <div style={{ ...flex, fontSize: 20, color: "#444" }}>{cutWords(`Palmarès : ${award.title}${award.year ? ` (${award.year})` : ""}`, 60)}</div>}
            </div>
            <div style={{ ...flex, background: "#d7332b", color: WHITE, border: `4px solid ${INK}`, padding: "8px 16px", transform: "rotate(-4deg)", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 28, letterSpacing: 2 }}>GUILDE OTAKU</div>
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: [...fonts, ...display] }
  );
}
