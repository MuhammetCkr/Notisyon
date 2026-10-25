import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createBlock, deleteBlock, listBlocks, updateBlock, type SiteBlock } from "@/lib/block-store";

function clean(input: Partial<SiteBlock>) {
  const location = input.location === "page_bottom" ? "page_bottom" : "page_top";
  return {
    name: String(input.name || "Yeni HTML bloğu").slice(0, 120),
    page_path: String(input.page_path || "*").slice(0, 200),
    location,
    html: String(input.html || "").slice(0, 250000),
    css: String(input.css || "").slice(0, 250000),
    js: String(input.js || "").slice(0, 250000),
    position: Math.max(0, Number(input.position) || 0),
    active: Boolean(input.active),
  } as const;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json(await listBlocks());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json(await createBlock(clean(await request.json())), { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json() as Partial<SiteBlock>;
  if (!body.id) return NextResponse.json({ error: "Blok kimliği eksik" }, { status: 400 });
  return NextResponse.json(await updateBlock({ id: body.id, ...clean(body) }));
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Blok kimliği eksik" }, { status: 400 });
  await deleteBlock(id);
  return NextResponse.json({ ok: true });
}
