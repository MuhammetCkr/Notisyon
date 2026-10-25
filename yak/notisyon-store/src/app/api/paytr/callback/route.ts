import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { getPaytrConfig, paytrHmac } from "@/lib/paytr";
import { awardOrderLoyalty } from "@/lib/loyalty";

export async function POST(request: Request) {
  const form = await request.formData();
  const merchantOid = String(form.get("merchant_oid") || "");
  const status = String(form.get("status") || "");
  const totalAmount = String(form.get("total_amount") || "");
  const receivedHash = String(form.get("hash") || "");
  let config;
  try { config = getPaytrConfig(); } catch { return new Response("PAYTR notification failed: configuration", { status: 500 }); }
  const expectedHash = paytrHmac(`${merchantOid}${config.merchantSalt}${status}${totalAmount}`, config.merchantKey);
  const matches = receivedHash.length === expectedHash.length && timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
  if (!matches) return new Response("PAYTR notification failed: bad hash", { status: 400 });
  if (!merchantOid || !["success", "failed"].includes(status)) return new Response("PAYTR notification failed: invalid payload", { status: 400 });

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const payment = await client.query("SELECT p.id, p.order_id, p.status, o.status AS order_status,o.gift_card_id,o.discount_total FROM payment_attempts p JOIN orders o ON o.id=p.order_id WHERE p.provider='paytr' AND p.provider_reference=$1 FOR UPDATE", [merchantOid]);
    const row = payment.rows[0];
    if (!row) { await client.query("ROLLBACK"); return new Response("PAYTR notification failed: order not found", { status: 404 }); }
    const nextPaymentStatus = status === "success" ? "paid" : "failed";
    if (row.status !== nextPaymentStatus && row.order_status !== "paid") {
      const failedReason = { code: form.get("failed_reason_code"), message: form.get("failed_reason_msg"), totalAmount, paymentType: form.get("payment_type") };
      await client.query("UPDATE payment_attempts SET status=$1, response_payload=$2, updated_at=now() WHERE id=$3", [nextPaymentStatus, JSON.stringify(failedReason), row.id]);
      if (status === "success") {
        await client.query("UPDATE orders SET status='paid', updated_at=now() WHERE id=$1", [row.order_id]);
        await awardOrderLoyalty(client, row.order_id);
        await client.query(`INSERT INTO order_events(order_id,event_type,from_status,to_status,note) VALUES($1,'payment_paid',$2,'paid','PayTR ödemesi onaylandı.')`, [row.order_id, row.order_status]);
      } else {
        await client.query("UPDATE orders SET status='cancelled', updated_at=now() WHERE id=$1", [row.order_id]);
        const returnedItems = await client.query(`SELECT variant_id,quantity FROM order_items WHERE order_id=$1 AND variant_id IS NOT NULL`, [row.order_id]);
        for (const item of returnedItems.rows) {
          const restored = await client.query(`UPDATE product_variants SET stock_quantity=stock_quantity+$2,updated_at=now() WHERE id=$1 RETURNING stock_quantity`, [item.variant_id, item.quantity]);
          await client.query(`INSERT INTO inventory_movements(variant_id,order_id,type,quantity,balance_after,note) VALUES($1,$2,'return',$3,$4,'Başarısız ödeme stok iadesi')`, [item.variant_id, row.order_id, item.quantity, restored.rows[0].stock_quantity]);
        }
        await client.query(`DELETE FROM campaign_redemptions WHERE order_id=$1`, [row.order_id]);
        if (row.gift_card_id && Number(row.discount_total) > 0) {
          await client.query(`UPDATE gift_cards SET balance=balance+$2,status='active',updated_at=now() WHERE id=$1`, [row.gift_card_id, Number(row.discount_total)]);
          await client.query(`INSERT INTO gift_card_transactions(gift_card_id,order_id,type,amount,note) VALUES($1,$2,'refund',$3,'Başarısız ödeme iadesi')`, [row.gift_card_id, row.order_id, Number(row.discount_total)]);
        }
        await client.query(`INSERT INTO order_events(order_id,event_type,from_status,to_status,note) VALUES($1,'payment_failed',$2,'cancelled','Ödeme başarısız; stok ve promosyon bakiyesi iade edildi.')`, [row.order_id, row.order_status]);
      }
      await client.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES($1,'order',$2,$3)`, [status === "success" ? "payment_paid" : "payment_failed", row.order_id, JSON.stringify({ merchantOid })]);
    }
    await client.query("COMMIT");
    return new Response("OK", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    await client.query("ROLLBACK");
    return new Response("PAYTR notification failed: internal error", { status: 500 });
  } finally { client.release(); }
}
