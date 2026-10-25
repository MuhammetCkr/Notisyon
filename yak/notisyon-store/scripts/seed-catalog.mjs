import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const root = process.cwd();
const envFile = await fs.readFile(path.join(root, ".env.local"), "utf8").catch(() => "");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL .env.local içinde tanımlı değil.");

const slugify = (value) => value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const catalog = JSON.parse(await fs.readFile(path.join(root, "src", "data", "ticimax-catalog.json"), "utf8"));
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined });

async function categoryIdFor(pathValue) {
  const parts = pathValue.split(">").map((part) => part.trim()).filter(Boolean);
  let parentId = null;
  for (let index = 0; index < parts.length; index += 1) {
    const fullPath = parts.slice(0, index + 1).join("-");
    const result = await client.query(
      `INSERT INTO categories (slug, name, parent_id) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
       RETURNING id`,
      [slugify(fullPath), parts[index], parentId],
    );
    parentId = result.rows[0].id;
  }
  return parentId;
}

await client.connect();
try {
  await client.query("BEGIN");
  for (const source of catalog.products) {
    const productSlug = `${slugify(source.name)}-${source.sourceCardId}`;
    const product = await client.query(
      `INSERT INTO products (source_card_id, slug, name, brand, short_description, description_html, seo_title, seo_description, seo_keywords, featured, is_new, is_deal, free_shipping, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (source_card_id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, brand=EXCLUDED.brand, short_description=EXCLUDED.short_description, description_html=EXCLUDED.description_html, seo_title=EXCLUDED.seo_title, seo_description=EXCLUDED.seo_description, seo_keywords=EXCLUDED.seo_keywords, featured=EXCLUDED.featured, is_new=EXCLUDED.is_new, is_deal=EXCLUDED.is_deal, free_shipping=EXCLUDED.free_shipping, published=EXCLUDED.published, updated_at=now()
       RETURNING id`,
      [source.sourceCardId, productSlug, source.name, source.brand || null, source.shortDescription || null, source.descriptionHtml || null, source.seo.title || null, source.seo.description || null, source.seo.keywords || null, source.flags.featured, source.flags.new, source.flags.deal, source.flags.freeShipping, source.variants.some((variant) => variant.active)],
    );
    const productId = product.rows[0].id;
    await client.query("DELETE FROM product_categories WHERE product_id = $1", [productId]);
    for (const categoryPath of source.categories) {
      const categoryId = await categoryIdFor(categoryPath);
      if (categoryId) await client.query("INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [productId, categoryId]);
    }
    for (const variant of source.variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, source_product_id, sku, barcode, variation_code, stock_quantity, sale_price, compare_at_price, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (sku) DO UPDATE SET product_id=EXCLUDED.product_id, source_product_id=EXCLUDED.source_product_id, barcode=EXCLUDED.barcode, variation_code=EXCLUDED.variation_code, stock_quantity=EXCLUDED.stock_quantity, sale_price=EXCLUDED.sale_price, compare_at_price=EXCLUDED.compare_at_price, active=EXCLUDED.active, updated_at=now()`,
        [productId, variant.sourceProductId || null, variant.sku, variant.barcode || null, variant.variationCode || null, variant.stock, variant.discountPrice || variant.salePrice, variant.discountPrice ? variant.salePrice : null, variant.active],
      );
    }
  }
  await client.query("COMMIT");
  console.log(`${catalog.products.length} ürün kartı veritabanına aktarıldı.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
