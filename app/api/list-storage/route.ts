import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "../../../lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "guilde-images";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") ?? "fighters";
  const prefix = searchParams.get("prefix") ?? "";

  try {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await adminClient.storage
      .from(BUCKET)
      .list(folder, { limit: 200, sortBy: { column: "name", order: "asc" } });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const files = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .filter((f) => !prefix || f.name.startsWith(prefix))
      .map((f) => {
        const path = `${folder}/${f.name}`;
        const { data: urlData } = adminClient.storage.from(BUCKET).getPublicUrl(path);
        return {
          name: f.name,
          url: urlData.publicUrl,
          path,
        };
      });

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
