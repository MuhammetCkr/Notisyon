import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { readAdminSession } from "@/lib/admin-user-store";

export const adminCookieName = "notisyon_admin";

function secret() { return process.env.ADMIN_SECRET || ""; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }

export function createAdminSession(maxAgeSeconds=12*60*60) {
  const expires = Date.now() + 1000 * maxAgeSeconds;
  return `${expires}.${sign(String(expires))}`;
}

export async function isAdminAuthenticated() {
  const value = (await cookies()).get(adminCookieName)?.value;
  if (!value) return false;
  if (value.startsWith("db.")) return Boolean(await readAdminSession(value));
  if (!secret()) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function getAdminUser() {
  const value = (await cookies()).get(adminCookieName)?.value;
  return readAdminSession(value);
}

export async function hasAdminPermission(permission: string) {
  const user = await getAdminUser();
  if (!user) return isAdminAuthenticated();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function validAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD || "";
  if (!configured || !secret()) return false;
  const expected = Buffer.from(configured);
  const received = Buffer.from(password);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
