type Queryable = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };

export type PromotionResult = {
  kind: "campaign" | "gift_card";
  id: string;
  code: string;
  label: string;
  discount: number;
};

export async function calculatePromotion(db: Queryable, rawCode: string, subtotal: number, shippingTotal: number, lock = false): Promise<PromotionResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error("İndirim kodunu girin.");
  const campaign = await db.query(
    `SELECT c.*,c.value::float8,c.minimum_total::float8,count(r.id)::int AS usage_count
     FROM campaigns c LEFT JOIN campaign_redemptions r ON r.campaign_id=c.id
     WHERE upper(c.code)=upper($1) AND c.active=true AND (c.starts_at IS NULL OR c.starts_at<=now()) AND (c.ends_at IS NULL OR c.ends_at>now())
     GROUP BY c.id`,
    [code],
  );
  if (campaign.rows[0]) {
    const row = campaign.rows[0];
    if (subtotal < Number(row.minimum_total || 0)) throw new Error(`Bu kupon için minimum sepet ${Number(row.minimum_total).toLocaleString("tr-TR")} TL.`);
    if (row.usage_limit && Number(row.usage_count) >= Number(row.usage_limit)) throw new Error("Bu kuponun kullanım limiti doldu.");
    const discount = row.type === "percentage" ? Math.min(subtotal, subtotal * Math.min(100, Number(row.value)) / 100) : row.type === "fixed" ? Math.min(subtotal, Number(row.value)) : shippingTotal;
    if (discount <= 0) throw new Error("Bu kupon sepetinizde indirim oluşturmuyor.");
    return { kind: "campaign", id: String(row.id), code, label: String(row.name), discount: Math.round(discount * 100) / 100 };
  }
  const gift = await db.query(
    `SELECT id,code,balance::float8,minimum_order_total::float8,status,expires_at FROM gift_cards
     WHERE upper(code)=upper($1) ${lock ? "FOR UPDATE" : ""}`,
    [code],
  );
  const row = gift.rows[0];
  if (!row) throw new Error("Kupon veya hediye çeki bulunamadı.");
  if (row.status !== "active" || Number(row.balance) <= 0) throw new Error("Bu hediye çeki kullanılamıyor.");
  if (row.expires_at && new Date(String(row.expires_at)).getTime() <= Date.now()) throw new Error("Bu hediye çekinin süresi doldu.");
  if (subtotal < Number(row.minimum_order_total || 0)) throw new Error(`Bu hediye çeki için minimum sepet ${Number(row.minimum_order_total).toLocaleString("tr-TR")} TL.`);
  return { kind: "gift_card", id: String(row.id), code, label: "Hediye çeki", discount: Math.round(Math.min(Number(row.balance), subtotal + shippingTotal) * 100) / 100 };
}
