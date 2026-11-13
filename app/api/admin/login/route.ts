import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, adminConfigIssue, checkAdminPassword, createAdminSession } from "../../../../lib/admin-session";

export async function POST(req: NextRequest) {
  const issue = adminConfigIssue();
  if (issue) {
    return NextResponse.json(
      { error: `Administration non configurée : ${issue}. À corriger dans les variables d'environnement du serveur, puis redéployer.` },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const body = await req.json();
    if (!checkAdminPassword(body?.password)) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const token = createAdminSession();
    if (!token) return NextResponse.json({ error: "Administration indisponible" }, { status: 503 });
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
  }
}
