import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const allowed = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"], ["image/gif", ".gif"], ["image/x-icon", ".ico"], ["image/vnd.microsoft.icon", ".ico"]]);

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const data = await request.formData();
  const files = data.getAll("files").filter((item): item is File => item instanceof File);
  if (!files.length) return NextResponse.json({ error: "Dosya seçilmedi." }, { status: 400 });
  if (files.length > 12) return NextResponse.json({ error: "Tek seferde en fazla 12 görsel yüklenebilir." }, { status: 400 });
  const requestedFolder=String(data.get("folder")||"products");
  const folder=requestedFolder==="blog"?"blog":requestedFolder==="theme"?"theme":"products";
  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  const urls: string[] = [];
  for (const file of files) {
    const extension = allowed.get(file.type);
    if (!extension) return NextResponse.json({ error: `${file.name}: desteklenmeyen dosya türü.` }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: `${file.name}: dosya 8 MB sınırını aşıyor.` }, { status: 400 });
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/${folder}/${filename}`);
  }
  return NextResponse.json({ urls }, { status: 201 });
}
