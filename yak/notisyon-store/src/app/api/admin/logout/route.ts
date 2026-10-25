import { NextResponse } from "next/server";
import { adminCookieName } from "@/lib/admin-auth";
import { revokeAdminSession } from "@/lib/admin-user-store";
export async function POST(request: Request) { await revokeAdminSession(request.headers.get("cookie")?.match(/(?:^|;\s*)notisyon_admin=([^;]+)/)?.[1]); const response = NextResponse.redirect(new URL("/admin-login", request.url), 303); response.cookies.delete(adminCookieName); return response; }
