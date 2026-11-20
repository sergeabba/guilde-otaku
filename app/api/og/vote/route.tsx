import { NextRequest } from "next/server";
import { pollBySlug } from "../../../../lib/film-polls";
import { renderArtOg } from "../../../../lib/og/page-art";

// Aperçu du lien d'un vote de film : titre du vote et affiches des films en lice.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const slug = (searchParams.get("slug") ?? "").slice(0, 60);
  try {
    const poll = await pollBySlug(slug);
    if (!poll) return new Response("Vote inconnu", { status: 404 });
    const end = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(poll.ends_at));
    const png = Buffer.from(await (await renderArtOg({
      kicker: "TŌHYŌ · LE VOTE DU FILM",
      title: poll.title,
      sub: `${poll.films.map((f) => f.title).join(" · ").replace(/[.!?…]+$/, "")}. Fin du vote : ${end}.`,
      accent: "#d7332b",
      images: poll.films.filter((f) => f.poster).slice(0, 3).map((f) => `https://image.tmdb.org/t/p/w500${f.poster}`),
      backdrop: poll.films.find((f) => f.backdrop)?.backdrop ? `https://image.tmdb.org/t/p/w1280${poll.films.find((f) => f.backdrop)!.backdrop}` : undefined,
    }, origin)).arrayBuffer());
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
  } catch (err) {
    console.error("[og/vote]", err);
    return new Response("Aperçu indisponible", { status: 500 });
  }
}
