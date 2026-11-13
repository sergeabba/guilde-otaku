import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const valid = isAdmin(req);
  return NextResponse.json({ valid }, {
    status: valid ? 200 : 401,
    headers: { "Cache-Control": "no-store" },
  });
}
