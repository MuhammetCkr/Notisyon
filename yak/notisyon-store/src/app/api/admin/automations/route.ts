import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { runAutomationRules } from "@/lib/automation-runner";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try { const body = await request.json().catch(() => ({})); return NextResponse.json({ results: await runAutomationRules(body.id ? String(body.id) : undefined) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Otomasyon çalıştırılamadı" }, { status: 400 }); }
}
