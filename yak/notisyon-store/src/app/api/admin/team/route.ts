import { NextResponse } from "next/server";
import { getAdminUser, isAdminAuthenticated } from "@/lib/admin-auth";
import { adminRoles, listAdminUsers, removeAdminUser, saveAdminUser } from "@/lib/admin-user-store";

const unauthorized = () => NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
async function canManage() {
  if (!(await isAdminAuthenticated())) return false;
  const user = await getAdminUser();
  return !user || user.role === "Tam Yetkili" || (Array.isArray(user.permissions) && user.permissions.includes("*"));
}

export async function GET() {
  if (!(await canManage())) return unauthorized();
  return NextResponse.json({ users: await listAdminUsers(), roles: adminRoles, current: await getAdminUser() });
}

export async function PUT(request: Request) {
  if (!(await canManage())) return unauthorized();
  try { return NextResponse.json({ user: await saveAdminUser(await request.json()) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Yönetici kaydedilemedi" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await canManage())) return unauthorized();
  try {
    const current = await getAdminUser();
    await removeAdminUser(new URL(request.url).searchParams.get("id") || "", current?.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Yönetici silinemedi" }, { status: 400 }); }
}
