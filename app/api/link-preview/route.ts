import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Sécurité: valider l'URL
    const urlToFetch = new URL(urlParam).toString();

    // Fetcher le HTML du site distant
    const response = await fetch(urlToFetch, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      // Timeout implicite géré par Edge, mais on pourrait le faire manuellement
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch remote URL: " + response.statusText }, { status: response.status });
    }

    const html = await response.text();

    // Regex simple pour extraire <meta property="og:image" content="...">
    // et <meta property="og:title" content="...">
    // et <meta property="og:description" content="...">
    const getMetaContent = (property: string): string | null => {
      // Gère les attributs dans le désordre (property=... content=... ou l'inverse)
      const regex = new RegExp(`<meta\\s+(?:[^>]*?\\s+)?(?:property|name)=["']${property}["']\\s+(?:[^>]*?\\s+)?content=["'](.*?)["']`);
      const regexAlt = new RegExp(`<meta\\s+(?:[^>]*?\\s+)?content=["'](.*?)["']\\s+(?:[^>]*?\\s+)?(?:property|name)=["']${property}["']`);
      
      const match = html.match(regex) || html.match(regexAlt);
      return match ? match[1] : null;
    };

    const title = getMetaContent("og:title") || getMetaContent("twitter:title") || "";
    const description = getMetaContent("og:description") || getMetaContent("twitter:description") || getMetaContent("description") || "";
    const image = getMetaContent("og:image") || getMetaContent("twitter:image") || "";

    // Gérer les URL relatives pour l'image
    let imageUrl = image;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('//')) {
        const origin = new URL(urlToFetch).origin;
        imageUrl = `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    return NextResponse.json({
      title,
      description,
      image: imageUrl,
      url: urlToFetch,
    });
  } catch (error: any) {
    console.error("[link-preview] Error:", error);
    return NextResponse.json({ error: "Failed to extract metadata" }, { status: 500 });
  }
}
