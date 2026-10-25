import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const folders = ["products", "blog", "theme"] as const;
const unauthorized = () => NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const root = path.join(process.cwd(), "public", "uploads"); const rows: unknown[] = [];
  for (const folder of folders) {
    const directory = path.join(root, folder);
    for (const name of await readdir(directory).catch(() => [])) {
      const absolute = path.join(directory, name); const info = await stat(absolute).catch(() => null);
      if (info?.isFile()) rows.push({ name, folder, url: `/uploads/${folder}/${name}`, size: info.size, updated_at: info.mtime });
    }
  }
  return NextResponse.json(rows.sort((a, b) => new Date((b as {updated_at:string}).updated_at).getTime() - new Date((a as {updated_at:string}).updated_at).getTime()));
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const url = new URL(request.url); const folder = String(url.searchParams.get("folder") || ""); const name = String(url.searchParams.get("name") || "");
  if (!folders.includes(folder as typeof folders[number]) || !name || path.basename(name) !== name) return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
  const root = path.resolve(process.cwd(), "public", "uploads"); const target = path.resolve(root, folder, name);
  if (!target.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
  try { await unlink(target); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Dosya bulunamadı veya silinemedi" }, { status: 404 }); }
}
