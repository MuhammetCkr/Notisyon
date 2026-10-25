import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readTheme, saveTheme } from "@/lib/theme-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json(await readTheme());
}
export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json() as { css?: string; js?: string };
  if ((body.css?.length || 0) > 250000 || (body.js?.length || 0) > 250000) return NextResponse.json({ error: "Kod boyutu çok büyük" }, { status: 413 });
  await saveTheme(body.css || "", body.js || "");
  return NextResponse.json({ ok: true });
}
