import { getDb } from "@/lib/db";
import { readPlatformSettings, settingBoolean, settingNumber, settingText } from "@/lib/platform-settings";

const xml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://notisyon.com").replace(/\/$/, "");
  const [configured, saved, platform] = await Promise.all([(await getDb().query("SELECT data FROM admin_entities WHERE module='feeds' AND status='active' ORDER BY sort_order LIMIT 1")).rows[0]?.data, (await getDb().query("SELECT value FROM store_settings WHERE key='control_feeds'")).rows[0]?.value || {}, readPlatformSettings()]);
  const settings = { ...saved, ...(configured || {}) };
  const includeOut = settings.include_out_of_stock ?? settingBoolean(platform.suppliers, "export_out_of_stock");
  const includeVariants = settings.include_variants ?? settingBoolean(platform.suppliers, "export_variants", true);
  const stockBuffer = Math.max(0, settingNumber(platform.suppliers, "stock_buffer"));
  const merchantCategory = settingText(platform.suppliers, "merchant_category");
  const productType = settingText(platform.suppliers, "merchant_product_type");
  const rows = (await getDb().query(`SELECT p.name,p.slug,p.brand,p.short_description,v.sku,v.stock_quantity::int,v.sale_price::float8,v.compare_at_price::float8,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY position,created_at LIMIT 1) image_url FROM products p JOIN product_variants v ON v.product_id=p.id AND v.active=true WHERE p.published=true AND COALESCE(p.archived,false)=false ${includeOut ? "" : "AND v.stock_quantity>$1"} ${includeVariants ? "" : "AND v.id=(SELECT id FROM product_variants pv WHERE pv.product_id=p.id AND pv.active ORDER BY pv.created_at LIMIT 1)"} ORDER BY p.updated_at DESC`, includeOut ? [] : [stockBuffer])).rows;
  const items = rows.map((row) => `<item><g:id>${xml(row.sku)}</g:id><g:title>${xml(row.name)}</g:title><g:description>${xml(row.short_description || row.name)}</g:description><g:link>${xml(`${base}/urun/${row.slug}`)}</g:link><g:image_link>${xml(row.image_url ? `${base}${row.image_url}` : "")}</g:image_link><g:availability>${row.stock_quantity > stockBuffer ? "in_stock" : "out_of_stock"}</g:availability><g:price>${Number(row.sale_price).toFixed(2)} TRY</g:price><g:brand>${xml(row.brand || "Notisyon")}</g:brand>${merchantCategory ? `<g:google_product_category>${xml(merchantCategory)}</g:google_product_category>` : ""}${productType ? `<g:product_type>${xml(productType)}</g:product_type>` : ""}<g:condition>new</g:condition></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Notisyon Ürün Feed</title><link>${xml(base)}</link><description>Notisyon güncel ürün kataloğu</description>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900, stale-while-revalidate=3600" } });
}
