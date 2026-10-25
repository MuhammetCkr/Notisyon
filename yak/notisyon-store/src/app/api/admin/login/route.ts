import { NextResponse } from "next/server";
import { adminCookieName, createAdminSession, validAdminPassword } from "@/lib/admin-auth";
import { adminSessionSeconds, authenticateAdmin } from "@/lib/admin-user-store";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const email = String(form.get("email") || "").trim();
  const session = email ? await authenticateAdmin(email, password, { userAgent: request.headers.get("user-agent") || undefined, ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() }) : null;
  if (!session && !validAdminPassword(password)) return NextResponse.redirect(new URL("/admin-login?error=1", request.url), 303);
  const maxAge=await adminSessionSeconds();
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(adminCookieName, session?.token || createAdminSession(maxAge), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge, path: "/" });
  return response;
}
