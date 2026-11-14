import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "../../../../lib/auth";
import { DRIVE_TAG, driveConfig, getGuildVideos } from "../../../../lib/drive";

const NO_STORE = { "Cache-Control": "no-store" };

// État du Cinéma de la Guilde (dossier Google Drive) : configuré ? combien de vidéos ?
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const cfg = driveConfig();
  if (!cfg) return NextResponse.json({ configured: false }, { headers: NO_STORE });
  try {
    const collections = await getGuildVideos();
    return NextResponse.json({
      configured: true,
      folderUrl: `https://drive.google.com/drive/folders/${cfg.folder}`,
      collections: collections.map((c) => ({ name: c.name, count: c.videos.length })),
    }, { headers: NO_STORE });
  } catch (e) {
    return NextResponse.json({ configured: true, folderUrl: `https://drive.google.com/drive/folders/${cfg.folder}`, error: e instanceof Error ? e.message : "Google Drive indisponible." }, { headers: NO_STORE });
  }
}

// Rafraîchir tout de suite après avoir déposé des vidéos (sinon : toutes les 10 min).
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  revalidateTag(DRIVE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
