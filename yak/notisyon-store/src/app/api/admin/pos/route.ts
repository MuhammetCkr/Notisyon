import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { readCommerceConfig } from "@/lib/store-config";
import { awardOrderLoyalty } from "@/lib/loyalty";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  const rows = (await getDb().query(`SELECT v.id,v.sku,v.barcode,v.stock_quantity,v.sale_price::float8,v.attributes,p.name,p.brand,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY position LIMIT 1) image FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active AND p.published AND ($1='' OR p.name ILIKE '%'||$1||'%' OR v.sku ILIKE '%'||$1||'%' OR v.barcode ILIKE '%'||$1||'%') ORDER BY p.name LIMIT 60`, [query])).rows;
  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json(); const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "Satışa en az bir ürün ekleyin." }, { status: 400 });
  const config = await readCommerceConfig(); const db = getDb(); const client = await db.connect();
  try {
    await client.query("BEGIN"); let customerId: string | null = null;
    if (String(body.customer_email || "").trim()) { const email = String(body.customer_email).trim().toLowerCase(); customerId = (await client.query(`INSERT INTO customers(email,first_name,last_name,phone) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO UPDATE SET first_name=COALESCE(NULLIF(EXCLUDED.first_name,''),customers.first_name),last_name=COALESCE(NULLIF(EXCLUDED.last_name,''),customers.last_name),phone=COALESCE(NULLIF(EXCLUDED.phone,''),customers.phone),updated_at=now() RETURNING id`, [email, String(body.first_name || ""), String(body.last_name || ""), String(body.phone || "")])).rows[0].id; }
    const lines: Array<Record<string, unknown>> = []; let subtotal = 0;
    for (const input of items) { const quantity = Math.max(1, Math.trunc(Number(input.quantity))); const row = (await client.query(`SELECT v.id,v.sku,v.stock_quantity,v.sale_price::float8,p.name FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=$1 AND v.active AND p.published FOR UPDATE`, [input.id])).rows[0]; if (!row || Number(row.stock_quantity) < quantity) throw new Error(`${input.sku || "Ürün"} için yeterli stok yok.`); const balance = (await client.query(`UPDATE product_variants SET stock_quantity=stock_quantity-$2,updated_at=now() WHERE id=$1 RETURNING stock_quantity`, [row.id, quantity])).rows[0].stock_quantity; const total = Number(row.sale_price) * quantity; subtotal += total; lines.push({ ...row, quantity, total, balance }); }
    const discount = Math.min(subtotal, Math.max(0, Number(body.discount || 0))); const grandTotal = Math.round((subtotal - discount) * 100) / 100; const prefix = String(body.receipt_prefix || "MGS").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "MGS"; const orderNumber = `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomUUID().slice(0,6).toUpperCase()}`;
    const order = (await client.query(`INSERT INTO orders(order_number,customer_id,status,currency,subtotal,shipping_total,discount_total,grand_total,internal_note) VALUES($1,$2,'paid',$3,$4,0,$5,$6,$7) RETURNING *`, [orderNumber, customerId, config.checkout.currency, subtotal, discount, grandTotal, String(body.note || "Mağaza satışı")])).rows[0];
    for (const line of lines) { await client.query(`INSERT INTO order_items(order_id,variant_id,sku,name,unit_price,quantity,line_total) VALUES($1,$2,$3,$4,$5,$6,$7)`, [order.id,line.id,line.sku,line.name,line.sale_price,line.quantity,line.total]); await client.query(`INSERT INTO inventory_movements(variant_id,order_id,type,quantity,balance_after,note) VALUES($1,$2,'sale',$3,$4,'Mağaza satışı')`, [line.id,order.id,-Number(line.quantity),line.balance]); }
    await client.query(`INSERT INTO payment_attempts(order_id,provider,provider_reference,status,request_payload,response_payload) VALUES($1,'pos',$2,'paid',$3,$4)`, [order.id, `POS-${randomUUID().slice(0,8).toUpperCase()}`, JSON.stringify({ method: body.payment_method || "cash" }), JSON.stringify({ approved: true })]);
    await client.query(`INSERT INTO order_events(order_id,event_type,to_status,note,created_by) VALUES($1,'pos_sale','paid',$2,'Mağaza Satışı')`, [order.id, `${body.payment_method === "card" ? "Kart" : "Nakit"} ödeme ile mağaza satışı tamamlandı.`]);
    await awardOrderLoyalty(client, order.id);
    await client.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('create','pos_order',$1,$2)`, [order.id, JSON.stringify({ orderNumber, grandTotal, itemCount: lines.length })]); await client.query("COMMIT"); return NextResponse.json({ orderId: order.id, orderNumber, grandTotal });
  } catch (error) { await client.query("ROLLBACK"); return NextResponse.json({ error: error instanceof Error ? error.message : "Satış tamamlanamadı" }, { status: 400 }); } finally { client.release(); }
}
