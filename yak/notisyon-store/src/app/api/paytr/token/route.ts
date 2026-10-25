import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientIp, getPaytrConfig, paytrHmac } from "@/lib/paytr";

type TokenRequest = { orderId?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TokenRequest | null;
  if (!body?.orderId) return NextResponse.json({ error: "Sipariş kimliği eksik." }, { status: 400 });

  let config;
  try { config = getPaytrConfig(); } catch { return NextResponse.json({ error: "PayTR ayarları henüz eklenmemiş." }, { status: 503 }); }

  const db = getDb();
  const orderResult = await db.query(
    `SELECT o.id, o.order_number, o.grand_total, o.status, c.email, c.first_name, c.last_name, c.phone,
            a.line1, a.line2, a.district, a.city
       FROM orders o JOIN customers c ON c.id=o.customer_id JOIN addresses a ON a.id=o.shipping_address_id
      WHERE o.id=$1`,
    [body.orderId],
  );
  const order = orderResult.rows[0];
  if (!order || order.status !== "pending_payment") return NextResponse.json({ error: "Bu sipariş için ödeme başlatılamıyor." }, { status: 409 });

  const lines = await db.query("SELECT name, unit_price, quantity FROM order_items WHERE order_id=$1 ORDER BY id", [order.id]);
  if (!lines.rowCount) return NextResponse.json({ error: "Sipariş kalemleri bulunamadı." }, { status: 404 });

  const merchantOid = order.order_number.replace(/[^a-zA-Z0-9]/g, "");
  const paymentAmount = String(Math.round(Number(order.grand_total) * 100));
  const basket = Buffer.from(JSON.stringify(lines.rows.map((line) => [line.name, Number(line.unit_price).toFixed(2), Number(line.quantity)]))).toString("base64");
  const safeEmail = String(order.email).trim().toLowerCase();
  const ip = clientIp(request.headers);
  const hashText = `${config.merchantId}${ip}${merchantOid}${safeEmail}${paymentAmount}${basket}00TRY${config.testMode}`;
  const token = paytrHmac(`${hashText}${config.merchantSalt}`, config.merchantKey);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const values = new URLSearchParams({
    merchant_id: config.merchantId, user_ip: ip, merchant_oid: merchantOid, email: safeEmail,
    payment_amount: paymentAmount, paytr_token: token, user_basket: basket, debug_on: config.testMode,
    no_installment: "0", max_installment: "0", user_name: `${order.first_name} ${order.last_name}`.trim(),
    user_address: [order.line1, order.line2, order.district, order.city].filter(Boolean).join(", "),
    user_phone: order.phone || "", merchant_ok_url: `${siteUrl}/siparis/${order.id}?payment=success`,
    merchant_fail_url: `${siteUrl}/siparis/${order.id}?payment=failed`, timeout_limit: "30", currency: "TL",
    test_mode: config.testMode, lang: "tr", iframe_v2: "1",
  });
  const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: values.toString(), cache: "no-store" });
  const response = await paytrResponse.json().catch(() => null) as { status?: string; token?: string; reason?: string } | null;
  if (!paytrResponse.ok || response?.status !== "success" || !response.token) {
    return NextResponse.json({ error: response?.reason || "PayTR ödeme oturumu oluşturulamadı." }, { status: 502 });
  }
  await db.query(
    `INSERT INTO payment_attempts (order_id, provider, provider_reference, status, request_payload, response_payload)
     VALUES ($1,'paytr',$2,'pending',$3,$4)
     ON CONFLICT (provider_reference) DO UPDATE SET status='pending', request_payload=EXCLUDED.request_payload, response_payload=EXCLUDED.response_payload, updated_at=now()`,
    [order.id, merchantOid, JSON.stringify({ merchantOid, paymentAmount, testMode: config.testMode }), JSON.stringify({ status: response.status })],
  );
  return NextResponse.json({ token: response.token, iframeUrl: `https://www.paytr.com/odeme/guvenli/${response.token}` });
}
