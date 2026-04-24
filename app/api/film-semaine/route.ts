import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { isAdmin } from "../../../lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

const ALLOWED_INSERT_FIELDS = ["title", "tmdb_id", "week_label", "week_date", "poster_path", "backdrop_path", "synopsis", "trailer_key", "vote_average", "genres", "year", "runtime", "director"] as const;
const ALLOWED_UPDATE_FIELDS = ["watched", "chosen", "week_label", "week_date"] as const;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("film_semaine")
      .select("*")
      .order("week_date", { ascending: false });

  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json({ error: "La table film_semaine n'existe pas encore. Exécute le script SQL dans Supabase.", needsSetup: true }, { status: 500 });
    }
    return NextResponse.json({ error: "Erreur de base de données" }, { status: 500 });
  }
  return NextResponse.json({ films: data ?? [] });
} catch {
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}
}

export async function POST(req: NextRequest) {
  const authErr = isAdmin(req) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authErr) return authErr;

  try {
    const sb = getAdminClient();
    const body = await req.json();
    const insertData: Record<string, unknown> = { watched: false };
    for (const key of ALLOWED_INSERT_FIELDS) {
      if (body[key] !== undefined) insertData[key] = body[key];
    }
    const { data, error } = await sb
      .from("film_semaine")
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
    return NextResponse.json({ film: data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authErr = isAdmin(req) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authErr) return authErr;

  try {
    const sb = getAdminClient();
    const body = await req.json();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    if (body.chosen === true) {
      const { data: current } = await sb
        .from("film_semaine")
        .select("week_date")
        .eq("id", Number(id))
        .single();

      if (current) {
        await sb
          .from("film_semaine")
          .update({ chosen: false })
          .eq("week_date", current.week_date)
          .neq("id", Number(id));
      }
    }

    const updates: Record<string, any> = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await sb
      .from("film_semaine")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    return NextResponse.json({ film: data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = getAdminClient();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const { error } = await sb
      .from("film_semaine")
      .delete()
      .eq("id", Number(id));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur serveur" }, { status: 500 });
  }
}
