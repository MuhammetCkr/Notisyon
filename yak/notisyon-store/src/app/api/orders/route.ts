import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculatePromotion, type PromotionResult } from "@/lib/promotions";
import { calculateShipping } from "@/lib/commerce-config";
import { readCommerceConfig } from "@/lib/store-config";
import { awardOrderLoyalty } from "@/lib/loyalty";
import { queueTemplate } from "@/lib/notification-store";
import { readCustomerSession } from "@/lib/customer-auth";
import { readPlatformSettings, settingBoolean } from "@/lib/platform-settings";

type OrderRequest = {
  customer: { email: string; firstName: string; lastName: string; phone: string };
  shippingAddress: { recipientName: string; phone: string; line1: string; line2?: string; district: string; city: string; postalCode?: string };
  items: Array<{ sku: string; quantity: number }>;
  promotionCode?: string;
  legalConsent?: boolean;
  paymentMethod?: "card" | "bank_transfer" | "cash_on_delivery";
};

const orderNumber = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

export async function POST(request: Request) {
  const [config, platform] = await Promise.all([readCommerceConfig(), readPlatformSettings()]);
  const customerSession = await readCustomerSession();
  if (config.general.maintenanceMode || config.general.storeStatus !== "Aktif") return NextResponse.json({ error: "Mağaza şu anda sipariş kabul etmiyor." }, { status: 503 });
  const payload = await request.json().catch(() => null) as OrderRequest | null;
  if (!payload || !payload.customer?.email || !payload.shippingAddress?.line1 || !Array.isArray(payload.items) || payload.items.length === 0 || payload.legalConsent !== true) {
    return NextResponse.json({ error: "Sipariş bilgileri eksik veya geçersiz." }, { status: 400 });
  }
  if (payload.items.some((item) => !item.sku || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    return NextResponse.json({ error: "Sepetteki ürün miktarları geçersiz." }, { status: 400 });
  }
  if (!config.general.guestCheckout && !customerSession) return NextResponse.json({ error: "Siparişi tamamlamak için hesabınıza giriş yapın." }, { status: 401 });
  if (settingBoolean(platform.site, "postal_code_required", true) && !payload.shippingAddress.postalCode?.trim()) return NextResponse.json({ error: "Posta kodu zorunludur." }, { status: 400 });
  const itemCount = payload.items.reduce((sum, item) => sum + item.quantity, 0);
  if (itemCount < config.checkout.minimumItemCount) return NextResponse.json({ error: `Sipariş için en az ${config.checkout.minimumItemCount} ürün eklemelisiniz.` }, { status: 400 });
  const paymentMethod = payload.paymentMethod || "card";
  const enabled = paymentMethod === "card" ? config.checkout.cardEnabled : paymentMethod === "bank_transfer" ? config.checkout.bankTransfer : config.checkout.cashOnDelivery;
  if (!enabled) return NextResponse.json({ error: "Seçilen ödeme yöntemi kullanılamıyor." }, { status: 400 });

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const customer = await client.query(
      `INSERT INTO customers (email, first_name, last_name, phone, customer_group_id) VALUES ($1,$2,$3,$4,(SELECT id FROM admin_entities WHERE module='customer-groups' AND name='Perakende' AND status='active' LIMIT 1))
       ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, phone=EXCLUDED.phone, customer_group_id=COALESCE(customers.customer_group_id,EXCLUDED.customer_group_id), updated_at=now()
       RETURNING id`,
      [payload.customer.email.trim().toLowerCase(), payload.customer.firstName.trim(), payload.customer.lastName.trim(), payload.customer.phone.trim()],
    );
    const address = await client.query(
      `INSERT INTO addresses (customer_id, recipient_name, phone, line1, line2, district, city, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [customer.rows[0].id, payload.shippingAddress.recipientName.trim(), payload.shippingAddress.phone.trim(), payload.shippingAddress.line1.trim(), payload.shippingAddress.line2?.trim() || null, payload.shippingAddress.district.trim(), payload.shippingAddress.city.trim(), payload.shippingAddress.postalCode?.trim() || null],
    );
    const lines: Array<{ variantId: string; sku: string; name: string; unitPrice: number; quantity: number; balanceAfter: number }> = [];
    for (const item of payload.items) {
      const variant = await client.query(
        `SELECT v.id, v.sku, v.stock_quantity, v.sale_price, p.name FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.sku=$1 AND v.active=true AND p.published=true FOR UPDATE`,
        [item.sku],
      );
      const row = variant.rows[0];
      if (!row || row.stock_quantity < item.quantity) throw new Error(`STOCK:${item.sku}`);
      const updatedStock = await client.query("UPDATE product_variants SET stock_quantity=stock_quantity-$1, updated_at=now() WHERE id=$2 RETURNING stock_quantity", [item.quantity, row.id]);
      lines.push({ variantId: row.id, sku: row.sku, name: row.name, unitPrice: Number(row.sale_price), quantity: item.quantity, balanceAfter: Number(updatedStock.rows[0].stock_quantity) });
    }
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    if (subtotal < config.checkout.minimumOrderTotal) throw new Error("MINIMUM_ORDER");
    const shippingTotal = calculateShipping(subtotal, config.shipping);
    let promotion: PromotionResult | null = null;
    if (payload.promotionCode?.trim()) {
      try { promotion = await calculatePromotion(client, payload.promotionCode, subtotal, shippingTotal, true); }
      catch (error) { throw new Error(`PROMO:${error instanceof Error ? error.message : "Kod uygulanamadı."}`); }
    }
    let groupDiscount = 0; let customerGroup: { name?: string; discount?: number } | null = null;
    if (customerSession && String(customerSession.email).toLocaleLowerCase('tr-TR') === payload.customer.email.trim().toLocaleLowerCase('tr-TR')) {
      const group = (await client.query(`SELECT g.name,g.data FROM customers c JOIN admin_entities g ON g.id=c.customer_group_id AND g.module='customer-groups' AND g.status='active' WHERE c.id=$1`, [customerSession.id])).rows[0];
      if (group) { const rate = Math.max(0, Math.min(100, Number(group.data?.discount || 0))); groupDiscount = Math.round(Math.max(0, subtotal - (promotion?.discount || 0)) * rate) / 100; customerGroup = { name: group.name, discount: rate }; }
    }
    const discountTotal = Math.round(((promotion?.discount || 0) + groupDiscount) * 100) / 100;
    const codFee = paymentMethod === "cash_on_delivery" ? config.checkout.cashOnDeliveryFee : 0;
    if (paymentMethod === "cash_on_delivery" && (subtotal < config.checkout.cashOnDeliveryMin || subtotal > config.checkout.cashOnDeliveryMax)) throw new Error("COD_LIMIT");
    const grandTotal = Math.max(0, Math.round((subtotal + shippingTotal + codFee - discountTotal) * 100) / 100);
    const orderStatus = grandTotal === 0 ? "paid" : "pending_payment";
    const contracts = (await client.query(`SELECT name,data->>'type' type,data->>'version' version FROM admin_entities WHERE module='contracts' AND status='active' AND COALESCE((data->>'required')::boolean,false)`)).rows;
    const order = await client.query(
      `INSERT INTO orders (order_number, customer_id, shipping_address_id, billing_address_id, status, currency, subtotal, shipping_total, discount_total, grand_total, promotion_code, campaign_id, gift_card_id, legal_snapshot)
       VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, order_number, grand_total,status`,
      [orderNumber(config.general.orderPrefix), customer.rows[0].id, address.rows[0].id, orderStatus, config.checkout.currency, subtotal, shippingTotal, discountTotal, grandTotal, promotion?.code || null, promotion?.kind === "campaign" ? promotion.id : null, promotion?.kind === "gift_card" ? promotion.id : null, JSON.stringify({ acceptedAt: new Date().toISOString(), contracts })],
    );
    for (const line of lines) {
      await client.query("INSERT INTO order_items (order_id, variant_id, sku, name, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7)", [order.rows[0].id, line.variantId, line.sku, line.name, line.unitPrice, line.quantity, line.unitPrice * line.quantity]);
      await client.query(`INSERT INTO inventory_movements(variant_id,order_id,type,quantity,balance_after,note) VALUES($1,$2,'sale',$3,$4,'Sipariş stok çıkışı')`, [line.variantId, order.rows[0].id, -line.quantity, line.balanceAfter]);
    }
    await client.query(`INSERT INTO payment_attempts(order_id,provider,status,request_payload,response_payload) VALUES($1,$2,$3,$4,$5)`, [order.rows[0].id, paymentMethod === "card" ? "paytr" : paymentMethod, grandTotal === 0 ? "paid" : "pending", JSON.stringify({ paymentMethod, codFee }), JSON.stringify({ configured: true })]);
    if (promotion?.kind === "campaign") await client.query(`INSERT INTO campaign_redemptions(campaign_id,order_id,customer_id,discount_amount) VALUES($1,$2,$3,$4)`, [promotion.id, order.rows[0].id, customer.rows[0].id, discountTotal]);
    if (promotion?.kind === "gift_card") {
      await client.query(`UPDATE gift_cards SET balance=GREATEST(0,balance-$2),status=CASE WHEN GREATEST(0,balance-$2)=0 THEN 'used' ELSE status END,updated_at=now() WHERE id=$1`, [promotion.id, discountTotal]);
      await client.query(`INSERT INTO gift_card_transactions(gift_card_id,order_id,type,amount,note) VALUES($1,$2,'redeem',$3,'Siparişte kullanıldı')`, [promotion.id, order.rows[0].id, -discountTotal]);
    }
    await client.query(`INSERT INTO order_events(order_id,event_type,note) VALUES($1,'order_created',$2)`, [order.rows[0].id, [promotion ? `${promotion.code} kodu uygulandı` : "", customerGroup ? `${customerGroup.name} grubu %${customerGroup.discount} indirimi uygulandı` : ""].filter(Boolean).join(" · ") || "Sipariş oluşturuldu."]);
    await queueTemplate(client, "order_created", { email: payload.customer.email.trim().toLowerCase(), phone: payload.customer.phone }, { customer_name: payload.customer.firstName, order_number: order.rows[0].order_number, order_total: grandTotal.toFixed(2), order_id: order.rows[0].id }, { subject: `Siparişiniz alındı: ${order.rows[0].order_number}`, body: `${payload.customer.firstName}, ${order.rows[0].order_number} numaralı siparişiniz başarıyla oluşturuldu.` });
    if (orderStatus === "paid") await awardOrderLoyalty(client, order.rows[0].id);
    await client.query("COMMIT");
    return NextResponse.json({ orderId: order.rows[0].id, orderNumber: order.rows[0].order_number, total: Number(order.rows[0].grand_total), discount: discountTotal, paymentMethod, paymentRequired: grandTotal > 0 && paymentMethod === "card" }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && error.message.startsWith("STOCK:")) return NextResponse.json({ error: "Stok miktarı güncellendi. Lütfen sepetinizi kontrol edin." }, { status: 409 });
    if (error instanceof Error && error.message.startsWith("PROMO:")) return NextResponse.json({ error: error.message.slice(6) }, { status: 400 });
    if (error instanceof Error && error.message === "MINIMUM_ORDER") return NextResponse.json({ error: `Sipariş alt limiti ${config.checkout.minimumOrderTotal.toLocaleString("tr-TR", { style: "currency", currency: config.checkout.currency })}.` }, { status: 400 });
    if (error instanceof Error && error.message === "COD_LIMIT") return NextResponse.json({ error: `Kapıda ödeme ${config.checkout.cashOnDeliveryMin}–${config.checkout.cashOnDeliveryMax} ${config.checkout.currency} arasındaki siparişlerde kullanılabilir.` }, { status: 400 });
    return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 500 });
  } finally { client.release(); }
}
