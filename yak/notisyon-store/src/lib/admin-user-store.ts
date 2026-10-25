import { getDb } from "@/lib/db";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "@/lib/passwords";

export const adminRoles = {
  "Tam Yetkili": ["*"],
  Operasyon: ["dashboard", "orders", "customers", "shipping", "returns", "forms", "notifications"],
  Katalog: ["dashboard", "catalog", "products", "categories", "inventory", "files"],
  Pazarlama: ["dashboard", "campaigns", "content", "blog", "pages", "seo", "theme", "files"],
  Raporlama: ["dashboard", "reports"],
} as const;

export type AdminUser = { id: string; name: string; email: string; role: string; permissions: string[]; active: boolean; last_login_at: string | null; created_at: string };

export async function adminSessionSeconds(){const row=(await getDb().query(`SELECT value FROM store_settings WHERE key='control_team'`)).rows[0]?.value||{};return Math.max(15*60,Math.min(24*60*60,Number(row.session_timeout||720)*60))}

const publicColumns = "id,name,email,role,permissions,active,last_login_at,created_at,updated_at";

export async function listAdminUsers(): Promise<AdminUser[]> {
  await ensureLegacyOwner();
  return (await getDb().query(`SELECT ${publicColumns} FROM admin_users ORDER BY active DESC,name`)).rows;
}

export async function ensureLegacyOwner() {
  const password = process.env.ADMIN_PASSWORD || ""; if (!password) return null;
  const db = getDb(); const exists = (await db.query(`SELECT ${publicColumns} FROM admin_users ORDER BY created_at LIMIT 1`)).rows[0]; if (exists) return exists;
  return (await db.query(`INSERT INTO admin_users(name,email,password_hash,role,permissions,active) VALUES('Harun Çukur','yonetici@notisyon.local',$1,'Tam Yetkili','["*"]'::jsonb,true) ON CONFLICT(email) DO NOTHING RETURNING ${publicColumns}`, [await hashPassword(password)])).rows[0] || null;
}

export async function saveAdminUser(input: Record<string, unknown>) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const role = Object.hasOwn(adminRoles, String(input.role)) ? String(input.role) : "Operasyon";
  const permissions = Array.isArray(input.permissions) ? input.permissions.map(String) : [...adminRoles[role as keyof typeof adminRoles]];
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Ad ve geçerli e-posta zorunludur.");
  const db = getDb();
  let row;
  if (input.id) {
    const password = String(input.password || "");
    row = password
      ? (await db.query(`UPDATE admin_users SET name=$1,email=$2,role=$3,permissions=$4,active=$5,password_hash=$6,updated_at=now() WHERE id=$7 RETURNING ${publicColumns}`, [name, email, role, JSON.stringify(permissions), input.active !== false, await hashPassword(password), input.id])).rows[0]
      : (await db.query(`UPDATE admin_users SET name=$1,email=$2,role=$3,permissions=$4,active=$5,updated_at=now() WHERE id=$6 RETURNING ${publicColumns}`, [name, email, role, JSON.stringify(permissions), input.active !== false, input.id])).rows[0];
  } else {
    const password = String(input.password || "");
    if (password.length < 8) throw new Error("Yeni yönetici için en az 8 karakterli parola zorunludur.");
    row = (await db.query(`INSERT INTO admin_users(name,email,password_hash,role,permissions,active) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${publicColumns}`, [name, email, await hashPassword(password), role, JSON.stringify(permissions), input.active !== false])).rows[0];
  }
  if (!row) throw new Error("Yönetici bulunamadı.");
  await db.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES($1,'admin_user',$2,$3)`, [input.id ? "update" : "create", row.id, JSON.stringify({ name, email, role })]);
  return row;
}

export async function removeAdminUser(id: string, currentUserId?: string) {
  if (!id) throw new Error("Yönetici kimliği zorunludur.");
  if (id === currentUserId) throw new Error("Kendi hesabınızı silemezsiniz.");
  const db = getDb();
  const fullAdmins = Number((await db.query(`SELECT count(*)::int count FROM admin_users WHERE active AND role='Tam Yetkili'`)).rows[0].count);
  const target = (await db.query(`SELECT role FROM admin_users WHERE id=$1`, [id])).rows[0];
  if (target?.role === "Tam Yetkili" && fullAdmins <= 1) throw new Error("Son tam yetkili yönetici silinemez.");
  const row = (await db.query(`DELETE FROM admin_users WHERE id=$1 RETURNING id,email`, [id])).rows[0];
  if (!row) throw new Error("Yönetici bulunamadı.");
  await db.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('delete','admin_user',$1,$2)`, [id, JSON.stringify({ email: row.email })]);
}

export async function authenticateAdmin(email: string, password: string, meta: { userAgent?: string; ip?: string }) {
  const db = getDb();
  const user = (await db.query(`SELECT * FROM admin_users WHERE lower(email)=lower($1) AND active`, [email.trim()])).rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;
  const token = createSessionToken();
  const expires = new Date(Date.now() + (await adminSessionSeconds()) * 1000);
  await db.query(`INSERT INTO admin_sessions(admin_user_id,token_hash,user_agent,ip_address,expires_at) VALUES($1,$2,$3,$4,$5)`, [user.id, hashSessionToken(token), meta.userAgent || null, meta.ip || null, expires]);
  await db.query(`UPDATE admin_users SET last_login_at=now() WHERE id=$1`, [user.id]);
  return { token: `db.${token}`, user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions }, expires };
}

export async function readAdminSession(cookieValue: string | undefined) {
  if (!cookieValue?.startsWith("db.")) return null;
  const token = cookieValue.slice(3);
  if (!token) return null;
  const row = (await getDb().query(`SELECT u.${publicColumns.split(",").join(",u.")} FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`, [hashSessionToken(token)])).rows[0];
  return row || null;
}

export async function revokeAdminSession(cookieValue: string | undefined) {
  if (cookieValue?.startsWith("db.")) await getDb().query(`DELETE FROM admin_sessions WHERE token_hash=$1`, [hashSessionToken(cookieValue.slice(3))]);
}
