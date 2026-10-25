import { getDb } from "@/lib/db";
import type { ProductPreview } from "@/data/catalog";

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

type StorefrontRow = {
  name: string; slug: string; brand: string | null; short_description: string | null;
  description_html: string | null; published: boolean; featured: boolean; is_new: boolean;
  is_deal: boolean; free_shipping: boolean; sku: string; barcode: string | null;
  stock_quantity: number; sale_price: number; compare_at_price: number | null;
  image_url: string | null; categories: string[];
  seo_title:string|null; seo_description:string|null; seo_keywords:string|null; canonical_url:string|null;
  indexable:boolean; follow_links:boolean;
};

export type StorefrontVariant={sku:string;barcode:string|null;attributes:Record<string,string>;stock_quantity:number;sale_price:number;compare_at_price:number|null;image_url:string|null};

const storefrontQuery = `
  WITH RECURSIVE category_tree AS (
    SELECT id,parent_id,name,name::text AS path FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id,c.parent_id,c.name,(ct.path || '>' || c.name)::text
    FROM categories c JOIN category_tree ct ON ct.id=c.parent_id
  )
  SELECT p.name,p.slug,p.brand,p.short_description,p.description_html,p.published,p.featured,p.is_new,p.is_deal,p.free_shipping,p.seo_title,p.seo_description,p.seo_keywords,p.canonical_url,p.indexable,p.follow_links,
    v.sku,v.barcode,v.stock_quantity::int,v.sale_price::float8,v.compare_at_price::float8,
    (SELECT pi.url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.position,pi.created_at LIMIT 1) image_url,
    COALESCE(ca.categories,'{}') categories
  FROM products p
  JOIN LATERAL (SELECT * FROM product_variants WHERE product_id=p.id AND active=true ORDER BY created_at LIMIT 1) v ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT ct.path) FILTER (WHERE ct.path IS NOT NULL) categories
    FROM product_categories pc
    JOIN category_tree ct ON ct.id=pc.category_id
    WHERE pc.product_id=p.id
  ) ca ON true
  WHERE p.published=true AND COALESCE(p.archived,false)=false
`;

function toPreview(row: StorefrontRow): ProductPreview {
  const price = Number(row.sale_price || 0);
  return {
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand || "Notisyon",
    price: money.format(price),
    priceValue: price,
    badge: row.free_shipping ? "Ücretsiz kargo" : row.is_deal ? "Fırsat ürünü" : row.is_new ? "Yeni ürün" : "Notisyon",
    coverText: row.name.split(" ").slice(-2).join(" "),
    imageUrl: row.image_url || undefined,
    shortDescription: row.short_description || undefined,
    barcode: row.barcode || undefined,
    categories: row.categories || [],
    stock: Number(row.stock_quantity || 0),
    flags: { freeShipping: row.free_shipping, deal: row.is_deal, new: row.is_new, featured: row.featured },
  };
}

export async function listStorefrontProducts(categoryPaths?: string[]) {
  const result = await getDb().query<StorefrontRow>(`${storefrontQuery} ORDER BY p.featured DESC,p.updated_at DESC`);
  const products = result.rows.map(toPreview);
  if (!categoryPaths?.length) return products;
  return products.filter((product) => product.categories.some((path) => categoryPaths.some((wanted) => path === wanted || path.startsWith(`${wanted}>`))));
}

export async function getStorefrontProduct(identifier: string) {
  const result = await getDb().query<StorefrontRow>(`${storefrontQuery} AND (lower(p.slug)=lower($1) OR lower(v.sku)=lower($1)) LIMIT 1`, [identifier]);
  const row = result.rows[0];
  if (!row) return null;
  const variants=await getDb().query<StorefrontVariant>(`SELECT sku,barcode,attributes,stock_quantity::int,sale_price::float8,compare_at_price::float8,image_url FROM product_variants WHERE product_id=(SELECT id FROM products WHERE slug=$1) AND active=true ORDER BY created_at`,[row.slug]);
  return { ...toPreview(row), shortDescription: row.short_description || "", descriptionHtml: row.description_html || "", barcode: row.barcode, compareAtPrice: row.compare_at_price,seoTitle:row.seo_title,seoDescription:row.seo_description,seoKeywords:row.seo_keywords,canonicalUrl:row.canonical_url,indexable:row.indexable,followLinks:row.follow_links,variants:variants.rows };
}
