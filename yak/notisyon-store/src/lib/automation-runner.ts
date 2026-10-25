import { getDb } from "@/lib/db";

type Rule = { id: string; name: string; data: { trigger?: string; action?: string; delay_minutes?: number } };
type Result = { id: string; name: string; affected: number; message: string };

export async function runAutomationRules(ruleId?: string) {
  const db = getDb();
  const rules = (await db.query(`SELECT id,name,data FROM admin_entities WHERE module='automation' AND status='active' ${ruleId ? "AND id=$1" : ""} ORDER BY sort_order`, ruleId ? [ruleId] : [])).rows as Rule[];
  const results: Result[] = [];
  for (const rule of rules) {
    const delay = Math.max(0, Number(rule.data.delay_minutes || 0));
    let affected = 0; let message = "Kural doğrulandı; uygun kayıt bulunmadı.";
    if (rule.data.trigger === "unpaid_order" && rule.data.action === "cancel_order") {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const orders = (await client.query(`SELECT id,order_number FROM orders WHERE status='pending_payment' AND created_at < now()-($1::int*interval '1 minute') FOR UPDATE`, [delay])).rows;
        for (const order of orders) {
          const items = (await client.query(`SELECT variant_id,quantity FROM order_items WHERE order_id=$1 AND variant_id IS NOT NULL`, [order.id])).rows;
          for (const item of items) {
            const variant = (await client.query(`UPDATE product_variants SET stock_quantity=stock_quantity+$2,updated_at=now() WHERE id=$1 RETURNING stock_quantity`, [item.variant_id, item.quantity])).rows[0];
            if (variant) await client.query(`INSERT INTO inventory_movements(variant_id,order_id,type,quantity,balance_after,note) VALUES($1,$2,'cancellation',$3,$4,'Ödenmeyen sipariş otomatik iptal edildi')`, [item.variant_id, order.id, item.quantity, variant.stock_quantity]);
          }
          await client.query(`UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1`, [order.id]);
          await client.query(`INSERT INTO order_events(order_id,event_type,from_status,to_status,note,created_by) VALUES($1,'automation','pending_payment','cancelled',$2,'Otomasyon')`, [order.id, `${delay} dakika içinde ödeme alınmadığı için otomatik iptal edildi.`]);
        }
        await client.query("COMMIT"); affected = orders.length; message = affected ? `${affected} ödenmeyen sipariş iptal edildi ve stokları iade edildi.` : message;
      } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    } else if (rule.data.trigger === "low_stock" && rule.data.action === "send_notification") {
      const notificationSettings=(await db.query(`SELECT value FROM store_settings WHERE key='control_notifications'`)).rows[0]?.value||{};
      if(notificationSettings.low_stock_email===false)message="Kritik stok e-postası bildirim ayarlarından kapatılmış.";
      else {const rows = (await db.query(`SELECT v.id,v.sku,v.stock_quantity,p.name FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active AND p.published AND v.stock_quantity<=v.critical_stock`)).rows;
      for (const row of rows) {
        const fingerprint = `low-stock:${row.id}:${new Date().toISOString().slice(0,10)}`;
        const insert = await db.query(`INSERT INTO notification_jobs(event_type,channel,recipient,subject,body,status,payload) SELECT 'low_stock','email',$1,$2,$3,'queued',$4 WHERE NOT EXISTS(SELECT 1 FROM notification_jobs WHERE payload->>'fingerprint'=$5) RETURNING id`, [process.env.SMTP_FROM || "yonetim@notisyon.com", `Kritik stok: ${row.name}`, `${row.name} (${row.sku}) stoğu ${row.stock_quantity} adede düştü.`, JSON.stringify({ fingerprint, variantId: row.id }), fingerprint]);
        affected += insert.rowCount || 0;
      }
      message = affected ? `${affected} kritik stok bildirimi kuyruğa alındı.` : message;
      }
    } else if (rule.data.trigger === "order_delivered" && rule.data.action === "request_review") {
      const rows = (await db.query(`SELECT o.id,o.order_number,c.email,c.first_name FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='delivered' AND o.updated_at < now()-($1::int*interval '1 minute')`, [delay])).rows;
      for (const row of rows) {
        const fingerprint = `review:${row.id}`;
        const insert = await db.query(`INSERT INTO notification_jobs(event_type,channel,recipient,subject,body,status,payload) SELECT 'review_request','email',$1,$2,$3,'queued',$4 WHERE NOT EXISTS(SELECT 1 FROM notification_jobs WHERE payload->>'fingerprint'=$5) RETURNING id`, [row.email, `${row.order_number} siparişinizi değerlendirin`, `${row.first_name || "Merhaba"}, ürünlerimizle ilgili görüşlerinizi paylaşmanızı isteriz.`, JSON.stringify({ fingerprint, orderId: row.id }), fingerprint]);
        affected += insert.rowCount || 0;
      }
      message = affected ? `${affected} değerlendirme isteği kuyruğa alındı.` : message;
    } else if (rule.data.trigger === "scheduled_content" && rule.data.action === "publish_content") {
      const published = await db.query(`UPDATE blog_posts SET published=true,updated_at=now() WHERE NOT published AND published_at IS NOT NULL AND published_at<=now() RETURNING id`);
      affected = published.rowCount || 0; message = affected ? `${affected} planlı içerik yayınlandı.` : message;
    } else if (rule.data.action === "create_task") {
      const insert = await db.query(`INSERT INTO notification_jobs(event_type,channel,recipient,subject,body,status,payload) VALUES('automation_task','email',$1,$2,$3,'queued',$4)`, [process.env.SMTP_FROM || "yonetim@notisyon.com", `Otomasyon görevi: ${rule.name}`, `“${rule.name}” kuralı için manuel kontrol görevi oluşturuldu.`, JSON.stringify({ ruleId: rule.id })]);
      affected = insert.rowCount || 0; message = "Operasyon görevi bildirim kuyruğuna alındı.";
    }
    const lastResult = { ...rule.data, last_result: message, last_run_at: new Date().toISOString(), affected };
    await db.query(`UPDATE admin_entities SET data=$2,updated_at=now() WHERE id=$1`, [rule.id, JSON.stringify(lastResult)]);
    await db.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('run','automation',$1,$2)`, [rule.id, JSON.stringify({ affected, message })]);
    results.push({ id: rule.id, name: rule.name, affected, message });
  }
  return results;
}
