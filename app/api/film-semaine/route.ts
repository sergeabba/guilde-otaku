import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ films: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getAdminClient();
    const body = await req.json();
    const { data, error } = await sb
      .from("film_semaine")
      .insert({
        title: body.title,
        tmdb_id: body.tmdb_id,
        week_label: body.week_label,
        week_date: body.week_date,
        poster_path: body.poster_path,
        backdrop_path: body.backdrop_path,
        synopsis: body.synopsis,
        trailer_key: body.trailer_key,
        vote_average: body.vote_average,
        genres: body.genres,
        year: body.year,
        runtime: body.runtime,
        director: body.director,
        watched: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ film: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    if (body.watched !== undefined) updates.watched = body.watched;
    if (body.chosen !== undefined) updates.chosen = body.chosen;
    if (body.week_label !== undefined) updates.week_label = body.week_label;
    if (body.week_date !== undefined) updates.week_date = body.week_date;

    const { data, error } = await sb
      .from("film_semaine")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ film: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur serveur" }, { status: 500 });
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
