import fs from "node:fs/promises";
import path from "node:path";
import { createHmac } from "node:crypto";
import pg from "pg";

const root = process.cwd();
const envText = await fs.readFile(path.join(root, ".env.local"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
if (!process.env.ADMIN_SECRET || !process.env.DATABASE_URL) throw new Error("ADMIN_SECRET veya DATABASE_URL tanımlı değil.");

const expires = Date.now() + 60_000;
const signature = createHmac("sha256", process.env.ADMIN_SECRET).update(String(expires)).digest("hex");
const cookie = `notisyon_admin=${expires}.${signature}`;
const base = process.env.ADMIN_TEST_BASE_URL || "http://localhost:3002";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
const created = { customer: "", address: "", order: "", giftCard: "", campaign: "", checkoutOrder: "", checkoutCustomer: "", checkoutAddress: "", checkoutVariant: "", checkoutQuantity: 0 };

async function request(url, init = {}) {
  const response = await fetch(`${base}${url}`, { ...init, headers: { cookie, ...init.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(`${init.method || "GET"} ${url}: ${response.status} ${data.error || ""}`);
  return data;
}
const json = (body) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

await db.connect();
try {
  const token = Date.now().toString(36);
  created.customer = (await db.query(`INSERT INTO customers(email,first_name,last_name,phone) VALUES($1,'QA','Müşteri','05550000000') RETURNING id`, [`qa-${token}@notisyon.test`])).rows[0].id;
  created.address = (await db.query(`INSERT INTO addresses(customer_id,recipient_name,phone,line1,district,city,postal_code) VALUES($1,'QA Müşteri','05550000000','Test Sokak 1','Kadıköy','İstanbul','34000') RETURNING id`, [created.customer])).rows[0].id;
  created.order = (await db.query(`INSERT INTO orders(order_number,customer_id,shipping_address_id,billing_address_id,status,subtotal,shipping_total,grand_total) VALUES($1,$2,$3,$3,'paid',199.90,20,219.90) RETURNING id`, [`QA-${token}`, created.customer, created.address])).rows[0].id;
  await db.query(`INSERT INTO order_items(order_id,sku,name,unit_price,quantity,line_total) VALUES($1,$2,'QA Test Ürünü',99.95,2,199.90)`, [created.order, `QA-${token}`]);
  await db.query(`INSERT INTO payment_attempts(order_id,provider,provider_reference,status) VALUES($1,'paytr',$2,'paid')`, [created.order, `QA-PAY-${token}`]);

  const detail = await request(`/api/admin/operations?resource=order_detail&id=${created.order}`);
  if (detail.items.length !== 1 || detail.payments.length !== 1 || !detail.shipping_address) throw new Error("Sipariş ayrıntısı eksik döndü.");
  await request("/api/admin/operations?resource=orders", { method: "PUT", ...json({ resource: "orders", id: created.order, status: "processing" }) });
  await request("/api/admin/operations?resource=order_note", { method: "PUT", ...json({ resource: "order_note", id: created.order, note: "QA operasyon notu" }) });
  await request("/api/admin/operations?resource=shipment", { method: "PUT", ...json({ resource: "shipment", order_id: created.order, tracking_number: `QA-TRACK-${token}`, status: "created" }) });
  const updated = await request(`/api/admin/operations?resource=order_detail&id=${created.order}`);
  if (updated.status !== "processing" || updated.internal_note !== "QA operasyon notu" || updated.shipments.length !== 1 || updated.events.length < 3) throw new Error("Sipariş operasyon güncellemeleri doğrulanamadı.");
  const customer = await request(`/api/admin/operations?resource=customer_detail&id=${created.customer}`);
  if (customer.orders.length !== 1 || customer.addresses.length !== 1 || Number(customer.lifetime_value) !== 219.9) throw new Error("Müşteri 360° görünümü doğrulanamadı.");
  const gift = await request("/api/admin/operations?resource=gift_cards", { method: "PUT", ...json({ resource: "gift_cards", code: `QA-GIFT-${token}`, initial_amount: 1000, minimum_order_total: 0, recipient_email: `qa-${token}@notisyon.test`, status: "active" }) });
  created.giftCard = gift.id;
  await request("/api/admin/operations?resource=gift_card_adjustment", { method: "PUT", ...json({ resource: "gift_card_adjustment", id: gift.id, amount: -50, note: "QA bakiye testi" }) });
  const cards = await request("/api/admin/operations?resource=gift_cards");
  if (Number(cards.find((card) => card.id === gift.id)?.balance) !== 950) throw new Error("Hediye çeki bakiye hareketi doğrulanamadı.");
  const campaign = await request("/api/admin/operations?resource=campaigns", { method: "PUT", ...json({ resource: "campaigns", name: `QA Kampanya ${token}`, code: `QA-${token}`, type: "percentage", value: 10, minimum_total: 50, active: true }) });
  created.campaign = campaign.id;
  const campaignPreview = await request("/api/promotions", { method: "POST", ...json({ code: campaign.code, subtotal: 200 }) });
  if (Number(campaignPreview.discount) !== 20) throw new Error("Kampanya doğrulama akışı başarısız.");
  const variant = (await db.query(`SELECT v.id,v.sku,v.stock_quantity FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active=true AND p.published=true AND v.stock_quantity>0 ORDER BY v.created_at LIMIT 1`)).rows[0];
  if (!variant) throw new Error("Checkout testi için stoklu ürün bulunamadı.");
  const checkout = await request("/api/orders", { method: "POST", ...json({ customer: { email: `qa-checkout-${token}@notisyon.test`, firstName: "QA", lastName: "Checkout", phone: "05550000001" }, shippingAddress: { recipientName: "QA Checkout", phone: "05550000001", line1: "Test Sokak 2", district: "Kadıköy", city: "İstanbul", postalCode: "34000" }, items: [{ sku: variant.sku, quantity: 1 }], promotionCode: gift.code, legalConsent: true }) });
  created.checkoutOrder = checkout.orderId; created.checkoutVariant = variant.id; created.checkoutQuantity = 1;
  const checkoutRow = (await db.query(`SELECT customer_id,shipping_address_id,discount_total::float8,grand_total::float8,gift_card_id,status FROM orders WHERE id=$1`, [checkout.orderId])).rows[0];
  created.checkoutCustomer = checkoutRow.customer_id; created.checkoutAddress = checkoutRow.shipping_address_id;
  if (checkoutRow.gift_card_id !== gift.id || Number(checkoutRow.discount_total) <= 0 || Number(checkoutRow.grand_total) !== 0 || checkoutRow.status !== "paid" || checkout.paymentRequired !== false) throw new Error("Hediye çekinin checkout toplamına uygulanması doğrulanamadı.");
  const inventory = await request("/api/admin/operations?resource=inventory");
  if (!inventory.movements.some((row) => row.order_id === checkout.orderId && row.type === "sale")) throw new Error("Sipariş stok hareketi doğrulanamadı.");
  await request("/api/admin/operations?resource=loyalty_adjustment", { method: "PUT", ...json({ resource: "loyalty_adjustment", customer_id: created.customer, points: 125, note: "QA puan testi" }) });
  const loyalty = await request("/api/admin/operations?resource=loyalty");
  if (Number(loyalty.customers.find((row) => row.id === created.customer)?.points) !== 125) throw new Error("Sadakat puanı hareketi doğrulanamadı.");
  const audit = await request("/api/admin/operations?resource=audit");
  if (!audit.some((row) => row.resource_id === created.order) || !audit.some((row) => row.resource_id === gift.id)) throw new Error("Yönetici denetim kayıtları doğrulanamadı.");
  console.log("ADMIN_OPERATIONS_OK: sipariş, müşteri 360°, kampanya/hediye çeki checkout, sadakat puanı ve denetim kayıtları doğrulandı.");
} finally {
  if (created.giftCard) await db.query("DELETE FROM gift_cards WHERE id=$1", [created.giftCard]).catch(() => undefined);
  if (created.campaign) await db.query("DELETE FROM campaigns WHERE id=$1", [created.campaign]).catch(() => undefined);
  if (created.checkoutOrder) await db.query("DELETE FROM inventory_movements WHERE order_id=$1", [created.checkoutOrder]).catch(() => undefined);
  if (created.checkoutOrder) await db.query("DELETE FROM orders WHERE id=$1", [created.checkoutOrder]).catch(() => undefined);
  if (created.checkoutVariant && created.checkoutQuantity) await db.query("UPDATE product_variants SET stock_quantity=stock_quantity+$2 WHERE id=$1", [created.checkoutVariant, created.checkoutQuantity]).catch(() => undefined);
  if (created.checkoutAddress) await db.query("DELETE FROM addresses WHERE id=$1", [created.checkoutAddress]).catch(() => undefined);
  if (created.checkoutCustomer) await db.query("DELETE FROM customers WHERE id=$1", [created.checkoutCustomer]).catch(() => undefined);
  if (created.order) await db.query("DELETE FROM admin_audit_log WHERE resource_id=$1", [created.order]).catch(() => undefined);
  if (created.giftCard) await db.query("DELETE FROM admin_audit_log WHERE resource_id=$1", [created.giftCard]).catch(() => undefined);
  if (created.campaign) await db.query("DELETE FROM admin_audit_log WHERE resource_id=$1", [created.campaign]).catch(() => undefined);
  if (created.customer) await db.query("DELETE FROM admin_audit_log WHERE resource_id=$1", [created.customer]).catch(() => undefined);
  if (created.order) await db.query("DELETE FROM orders WHERE id=$1", [created.order]).catch(() => undefined);
  if (created.address) await db.query("DELETE FROM addresses WHERE id=$1", [created.address]).catch(() => undefined);
  if (created.customer) await db.query("DELETE FROM customers WHERE id=$1", [created.customer]).catch(() => undefined);
  await db.end();
}
