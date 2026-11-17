import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { checkPuzzle } from "../../../../lib/games/emoji";
import { addEmoji, emojiRows } from "../../../../lib/games/store";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";

const NO_STORE = { "Cache-Control": "no-store" };

// Énigmes en émojis : liste (en attente et validées), ajout direct, validation, suppression.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  return NextResponse.json(await emojiRows(), { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const p = checkPuzzle((await req.json().catch(() => null)) ?? {});
  if (typeof p === "string") return NextResponse.json({ error: p }, { status: 400, headers: NO_STORE });
  const err = await addEmoji({ ...p, status: "approved", member_id: null, player_name: null });
  return err ? NextResponse.json({ error: err }, { status: 503, headers: NO_STORE }) : NextResponse.json({ saved: true }, { headers: NO_STORE });
}

export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const p = checkPuzzle(body ?? {});
  if (!Number.isInteger(id) || typeof p === "string") return NextResponse.json({ error: typeof p === "string" ? p : "Énigme inconnue." }, { status: 400, headers: NO_STORE });
  const { error } = await db.from("emoji_puzzles").update({ ...p, status: "approved" }).eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE }) : NextResponse.json({ saved: true }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const id = Number((await req.json().catch(() => null))?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Énigme inconnue." }, { status: 400, headers: NO_STORE });
  const { error } = await db.from("emoji_puzzles").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE }) : NextResponse.json({ deleted: true }, { headers: NO_STORE });
}
