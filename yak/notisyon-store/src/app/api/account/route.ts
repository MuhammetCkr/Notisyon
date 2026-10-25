import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeCustomerAuthToken, createCustomerAccount, customerAccountData, customerCookieName, loginCustomer, readCustomerSession, requestPasswordReset, revokeCustomerSession } from "@/lib/customer-auth";
import { getDb } from "@/lib/db";
import { createReturn } from "@/lib/admin-operations-store";
import { readPlatformSettings, settingBoolean, settingNumber } from "@/lib/platform-settings";

const meta = (request: Request) => ({ userAgent: request.headers.get("user-agent") || undefined, ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" };

export async function GET() {
  const customer = await readCustomerSession();
  if (!customer) return NextResponse.json({ authenticated: false });
  const platform = await readPlatformSettings();
  return NextResponse.json({ authenticated: true, ...(await customerAccountData(customer.id)), policies: { accountDeletion: settingBoolean(platform.site, "account_deletion", true), returnDays: settingNumber(platform.orders, "return_days", 14), allowUnpaidCancel: settingBoolean(platform.orders, "allow_unpaid_cancel", true), allowPaidCancel: settingBoolean(platform.orders, "allow_paid_cancel", false), cancelDays: settingNumber(platform.orders, "cancel_days", 1), postalCodeRequired: settingBoolean(platform.site, "postal_code_required", true) } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "logout") {
      const store = await cookies(); await revokeCustomerSession(store.get(customerCookieName)?.value);
      const response = NextResponse.json({ ok: true }); response.cookies.delete(customerCookieName); return response;
    }
    if (body.action === "request_reset") { await requestPasswordReset(String(body.email || "")); return NextResponse.json({ ok: true, message: "Bu adres kayıtlıysa parola yenileme bağlantısı gönderim kuyruğuna alındı." }); }
    if (body.action === "reset_password") { await consumeCustomerAuthToken(String(body.token || ""), "password_reset", String(body.password || "")); return NextResponse.json({ ok: true, message: "Parolanız yenilendi. Yeni parolanızla giriş yapabilirsiniz." }); }
    if (body.action === "verify_email") { await consumeCustomerAuthToken(String(body.token || ""), "email_verification"); return NextResponse.json({ ok: true, message: "E-posta adresiniz doğrulandı." }); }
    if (body.action === "cancel_order") { const session = await readCustomerSession(); if (!session) return NextResponse.json({ error: "Sipariş iptali için giriş yapın." }, { status: 401 }); const platform = await readPlatformSettings(); const order = (await getDb().query(`SELECT id,status,created_at FROM orders WHERE id=$1 AND customer_id=$2`, [body.order_id, session.id])).rows[0]; if (!order) throw new Error("Sipariş bulunamadı."); const allowed = order.status === "pending_payment" ? settingBoolean(platform.orders, "allow_unpaid_cancel", true) : order.status === "paid" ? settingBoolean(platform.orders, "allow_paid_cancel", false) : false; if (!allowed) throw new Error("Bu sipariş müşteri tarafından iptal edilemez."); const days = Math.max(0, settingNumber(platform.orders, "cancel_days", 1)); if (Date.now() - new Date(order.created_at).getTime() > days * 86400000) throw new Error(`${days} günlük iptal süresi sona ermiş.`); await getDb().query(`UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1`, [order.id]); await getDb().query(`INSERT INTO order_events(order_id,event_type,from_status,to_status,note) VALUES($1,'customer_cancel',$2,'cancelled','Müşteri hesabından iptal edildi.')`, [order.id, order.status]); return NextResponse.json({ ok: true, message: "Siparişiniz iptal edildi." }); }
    if (body.action === "request_return") {
      const session = await readCustomerSession(); if (!session) return NextResponse.json({ error: "İade talebi için giriş yapın." }, { status: 401 });
      const order = (await getDb().query(`SELECT id,status,created_at FROM orders WHERE id=$1 AND customer_id=$2`, [body.order_id, session.id])).rows[0];
      if (!order) throw new Error("Sipariş bulunamadı."); if (!['paid','processing','shipped','delivered'].includes(order.status)) throw new Error("Bu sipariş iade talebine uygun değil.");
      const platform = await readPlatformSettings(); const returnDays = Math.max(1, settingNumber(platform.orders, "return_days", 14));
      if (Date.now() - new Date(order.created_at).getTime() > returnDays * 86400000) throw new Error(`${returnDays} günlük iade süresi sona ermiş.`);
      if (settingBoolean(platform.orders, "return_reason_required", true) && !String(body.reason || "").trim()) throw new Error("İade nedeni zorunludur.");
      const result = await createReturn({ order_id: order.id, items: body.items, reason: body.reason, customer_note: body.customer_note, resolution: body.resolution || 'refund', item_condition: body.item_condition || 'unopened' });
      return NextResponse.json({ return: result });
    }
    const result = body.action === "register"
      ? await createCustomerAccount({ email: body.email, password: body.password, firstName: body.firstName, lastName: body.lastName, phone: body.phone }, meta(request))
      : await loginCustomer(String(body.email || ""), String(body.password || ""), meta(request));
    const response = NextResponse.json({ ok: true, customer: result.customer }); response.cookies.set(customerCookieName, result.token, cookieOptions); return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "İşlem tamamlanamadı" }, { status: 400 }); }
}

export async function PUT(request: Request) {
  const session = await readCustomerSession();
  if (!session) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  try {
    const body = await request.json(); const db = getDb();
    if (body.resource === "address") {
      const values = [session.id, String(body.recipient_name || "").trim(), String(body.phone || "").trim(), String(body.line1 || "").trim(), String(body.line2 || "").trim() || null, String(body.district || "").trim(), String(body.city || "").trim(), String(body.postal_code || "").trim() || null];
      const platform = await readPlatformSettings();
      if (!values[1] || !values[2] || !values[3] || !values[5] || !values[6] || (settingBoolean(platform.site, "postal_code_required", true) && !values[7])) throw new Error("Adres alanlarını eksiksiz doldurun.");
      const row = body.id
        ? (await db.query(`UPDATE addresses SET recipient_name=$2,phone=$3,line1=$4,line2=$5,district=$6,city=$7,postal_code=$8 WHERE id=$9 AND customer_id=$1 RETURNING *`, [...values, body.id])).rows[0]
        : (await db.query(`INSERT INTO addresses(customer_id,recipient_name,phone,line1,line2,district,city,postal_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, values)).rows[0];
      if (!row) throw new Error("Adres bulunamadı."); return NextResponse.json({ address: row });
    }
    const row = (await db.query(`UPDATE customers SET first_name=$2,last_name=$3,phone=$4,email_marketing=$5,sms_marketing=$6,updated_at=now() WHERE id=$1 RETURNING id,email,first_name,last_name,phone,email_marketing,sms_marketing`, [session.id, String(body.first_name || "").trim(), String(body.last_name || "").trim(), String(body.phone || "").trim(), body.email_marketing === true || body.email_marketing === "true", body.sms_marketing === true || body.sms_marketing === "true"])).rows[0];
    return NextResponse.json({ customer: row });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kaydedilemedi" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const session = await readCustomerSession(); if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const url = new URL(request.url);
  if (url.searchParams.get("account") === "1") { const platform = await readPlatformSettings(); if (!settingBoolean(platform.site, "account_deletion", true)) return NextResponse.json({ error: "Hesap silme özelliği kapalı." }, { status: 403 }); const db = getDb(); await db.query(`UPDATE customers SET active=false,email_marketing=false,sms_marketing=false,updated_at=now() WHERE id=$1`, [session.id]); await db.query(`DELETE FROM customer_sessions WHERE customer_id=$1`, [session.id]); const response = NextResponse.json({ ok: true }); response.cookies.delete(customerCookieName); return response; }
  const id = url.searchParams.get("address"); if (!id) return NextResponse.json({ error: "Adres zorunlu" }, { status: 400 });
  await getDb().query(`DELETE FROM addresses WHERE id=$1 AND customer_id=$2`, [id, session.id]); return NextResponse.json({ ok: true });
}
