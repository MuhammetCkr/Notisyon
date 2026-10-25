import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "@/lib/passwords";
import { queueTemplate } from "@/lib/notification-store";
import { readPlatformSettings, settingBoolean, settingNumber } from "@/lib/platform-settings";

export const customerCookieName = "notisyon_customer";

async function membershipSettings() {
  const [row, platform] = await Promise.all([(await getDb().query(`SELECT value FROM store_settings WHERE key='control_membership'`)).rows[0], readPlatformSettings()]);
  return { minimumPasswordLength: Math.max(8, Math.min(64, settingNumber(platform.site, "password_min", Number(row?.value?.minimum_password_length || 8)))), maximumPasswordLength: Math.max(8, Math.min(128, settingNumber(platform.site, "password_max", 64))), special: settingBoolean(platform.site, "password_special", true), number: settingBoolean(platform.site, "password_number", true), uppercase: settingBoolean(platform.site, "password_uppercase", true), emailVerification: settingBoolean(platform.site, "email_verification", row?.value?.email_verification === true), enabled: settingBoolean(platform.site, "membership_enabled", true) };
}

function validatePassword(password: string, rules: Awaited<ReturnType<typeof membershipSettings>>) { if (password.length < rules.minimumPasswordLength) throw new Error(`Parolanız en az ${rules.minimumPasswordLength} karakter olmalıdır.`); if (password.length > rules.maximumPasswordLength) throw new Error(`Parolanız en fazla ${rules.maximumPasswordLength} karakter olabilir.`); if (rules.uppercase && !/[A-ZÇĞİÖŞÜ]/.test(password)) throw new Error("Parolanız en az bir büyük harf içermelidir."); if (rules.number && !/\d/.test(password)) throw new Error("Parolanız en az bir rakam içermelidir."); if (rules.special && !/[^\p{L}\p{N}]/u.test(password)) throw new Error("Parolanız en az bir özel karakter içermelidir."); }

export async function createCustomerAccount(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }, meta: { userAgent?: string; ip?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçerli bir e-posta adresi girin.");
  const membership = await membershipSettings();
  if (!membership.enabled) throw new Error("Yeni üyelik oluşturma şu anda kapalıdır.");
  validatePassword(input.password, membership);
  const db = getDb();
  const existing = (await db.query(`SELECT id,password_hash FROM customers WHERE email=$1`, [email])).rows[0];
  if (existing?.password_hash) throw new Error("Bu e-posta ile kayıtlı bir hesap var.");
  const passwordHash = await hashPassword(input.password);
  const customer = existing
    ? (await db.query(`UPDATE customers SET first_name=$2,last_name=$3,phone=$4,password_hash=$5,active=true,customer_group_id=COALESCE(customer_group_id,(SELECT id FROM admin_entities WHERE module='customer-groups' AND name='Perakende' AND status='active' LIMIT 1)),updated_at=now() WHERE id=$1 RETURNING id,email,first_name,last_name,phone`, [existing.id, input.firstName.trim(), input.lastName.trim(), input.phone?.trim() || null, passwordHash])).rows[0]
    : (await db.query(`INSERT INTO customers(email,first_name,last_name,phone,password_hash,customer_group_id) VALUES($1,$2,$3,$4,$5,(SELECT id FROM admin_entities WHERE module='customer-groups' AND name='Perakende' AND status='active' LIMIT 1)) RETURNING id,email,first_name,last_name,phone`, [email, input.firstName.trim(), input.lastName.trim(), input.phone?.trim() || null, passwordHash])).rows[0];
  if (membership.emailVerification) await createCustomerAuthToken(String(customer.id), "email_verification", email, String(customer.first_name || ""));
  return createCustomerSession(customer, meta);
}

export async function loginCustomer(email: string, password: string, meta: { userAgent?: string; ip?: string }) {
  const customer = (await getDb().query(`SELECT id,email,first_name,last_name,phone,password_hash FROM customers WHERE lower(email)=lower($1) AND active`, [email.trim()])).rows[0];
  if (!customer?.password_hash || !(await verifyPassword(password, customer.password_hash))) throw new Error("E-posta veya parola hatalı.");
  await getDb().query(`UPDATE customers SET last_login_at=now() WHERE id=$1`, [customer.id]);
  return createCustomerSession(customer, meta);
}

async function createCustomerSession(customer: Record<string, unknown>, meta: { userAgent?: string; ip?: string }) {
  const token = createSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await getDb().query(`INSERT INTO customer_sessions(customer_id,token_hash,user_agent,ip_address,expires_at) VALUES($1,$2,$3,$4,$5)`, [customer.id, hashSessionToken(token), meta.userAgent || null, meta.ip || null, expires]);
  return { token, expires, customer: { id: customer.id, email: customer.email, first_name: customer.first_name, last_name: customer.last_name, phone: customer.phone } };
}

export async function readCustomerSession() {
  const token = (await cookies()).get(customerCookieName)?.value;
  if (!token) return null;
  const customer = (await getDb().query(`SELECT c.id,c.email,c.first_name,c.last_name,c.phone,c.email_marketing,c.sms_marketing,c.created_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=$1 AND s.expires_at>now() AND c.active`, [hashSessionToken(token)])).rows[0];
  return customer || null;
}

export async function revokeCustomerSession(token: string | undefined) {
  if (token) await getDb().query(`DELETE FROM customer_sessions WHERE token_hash=$1`, [hashSessionToken(token)]);
}

export async function customerAccountData(customerId: string) {
  const db = getDb();
  const [customer, addresses, orders, loyalty, returns] = await Promise.all([
    db.query(`SELECT id,email,first_name,last_name,phone,email_marketing,sms_marketing,created_at,last_login_at FROM customers WHERE id=$1`, [customerId]),
    db.query(`SELECT * FROM addresses WHERE customer_id=$1 ORDER BY created_at DESC`, [customerId]),
    db.query(`SELECT id,order_number,status,currency,grand_total::float8,created_at,
      (SELECT count(*)::int FROM order_items oi WHERE oi.order_id=o.id) item_count,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',oi.id,'name',oi.name,'sku',oi.sku,'quantity',oi.quantity,'unit_price',oi.unit_price::float8,'returned',COALESCE((SELECT sum(ri.quantity) FROM return_items ri JOIN returns r ON r.id=ri.return_id WHERE ri.order_item_id=oi.id AND r.status NOT IN ('rejected','cancelled')),0)) ORDER BY oi.name) FROM order_items oi WHERE oi.order_id=o.id),'[]'::jsonb) items
      FROM orders o WHERE customer_id=$1 ORDER BY created_at DESC`, [customerId]),
    db.query(`SELECT COALESCE(sum(points),0)::int balance FROM loyalty_transactions WHERE customer_id=$1`, [customerId]),
    db.query(`SELECT r.id,r.return_number,r.order_id,r.status,r.reason,r.resolution,r.refund_amount::float8,r.created_at,o.order_number FROM returns r JOIN orders o ON o.id=r.order_id WHERE r.customer_id=$1 ORDER BY r.created_at DESC`, [customerId]),
  ]);
  return { customer: customer.rows[0], addresses: addresses.rows, orders: orders.rows, loyalty: loyalty.rows[0], returns: returns.rows };
}

export async function createCustomerAuthToken(customerId: string, purpose: "password_reset" | "email_verification", email: string, firstName = "") {
  const db = getDb(); const token = createSessionToken(); const expires = new Date(Date.now() + (purpose === "password_reset" ? 60 : 24 * 60) * 60 * 1000);
  await db.query(`DELETE FROM customer_auth_tokens WHERE customer_id=$1 AND purpose=$2 AND used_at IS NULL`, [customerId, purpose]);
  await db.query(`INSERT INTO customer_auth_tokens(customer_id,token_hash,purpose,expires_at) VALUES($1,$2,$3,$4)`, [customerId, hashSessionToken(token), purpose, expires]);
  const path = purpose === "password_reset" ? `/hesabim?reset=${encodeURIComponent(token)}` : `/hesabim?verify=${encodeURIComponent(token)}`;
  await queueTemplate(db, purpose, { email }, { customer_name: firstName, action_url: path }, { subject: purpose === "password_reset" ? "Notisyon parola yenileme" : "Notisyon e-posta doğrulama", body: `${firstName ? `${firstName}, ` : ""}${purpose === "password_reset" ? "parolanızı yenilemek" : "e-posta adresinizi doğrulamak"} için bağlantıyı açın: ${path}` });
}

export async function requestPasswordReset(email: string) {
  const customer = (await getDb().query(`SELECT id,email,first_name FROM customers WHERE lower(email)=lower($1) AND active`, [email.trim()])).rows[0];
  if (customer) await createCustomerAuthToken(customer.id, "password_reset", customer.email, customer.first_name || "");
}

export async function consumeCustomerAuthToken(token: string, purpose: "password_reset" | "email_verification", password?: string) {
  const db = getDb(); const client = await db.connect();
  try { await client.query("BEGIN"); const row = (await client.query(`SELECT * FROM customer_auth_tokens WHERE token_hash=$1 AND purpose=$2 AND used_at IS NULL AND expires_at>now() FOR UPDATE`, [hashSessionToken(token), purpose])).rows[0]; if (!row) throw new Error("Bağlantı geçersiz veya süresi dolmuş.");
    if (purpose === "password_reset") { const membership = await membershipSettings(); if (!password) throw new Error("Yeni parola zorunludur."); validatePassword(password, membership); await client.query(`UPDATE customers SET password_hash=$2,updated_at=now() WHERE id=$1`, [row.customer_id, await hashPassword(password)]); await client.query(`DELETE FROM customer_sessions WHERE customer_id=$1`, [row.customer_id]); }
    else await client.query(`UPDATE customers SET email_verified=true,updated_at=now() WHERE id=$1`, [row.customer_id]);
    await client.query(`UPDATE customer_auth_tokens SET used_at=now() WHERE id=$1`, [row.id]); await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
