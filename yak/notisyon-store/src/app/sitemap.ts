import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://notisyon.com").replace(/\/$/, "");
  const db = getDb();
  const config = (await db.query("SELECT value FROM store_settings WHERE key='sitemap'")).rows[0]?.value || (await db.query("SELECT value FROM store_settings WHERE key='control_sitemap'")).rows[0]?.value || {};
  if (config.enabled === false) return [{ url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
  const [products, categories, pages, posts] = await Promise.all([
    db.query("SELECT slug,updated_at FROM products WHERE published=true AND COALESCE(archived,false)=false AND indexable=true"),
    db.query("SELECT slug,updated_at FROM categories WHERE active=true AND indexable=true"),
    db.query("SELECT slug,updated_at FROM content_pages WHERE published=true"),
    db.query("SELECT slug,updated_at FROM blog_posts WHERE published=true AND indexable=true"),
  ]);
  return [
    { url: base, lastModified: new Date(), changeFrequency: config.frequency || "daily", priority: Number(config.home_priority || 100) / 100 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: .75 },
    ...products.rows.map((row) => ({ url: `${base}/urun/${row.slug}`, lastModified: row.updated_at, changeFrequency: (config.frequency || "weekly") as "daily"|"weekly"|"monthly", priority: Number(config.product_priority || 80) / 100 })),
    ...categories.rows.map((row) => ({ url: `${base}/${row.slug}`, lastModified: row.updated_at, changeFrequency: (config.frequency || "weekly") as "daily"|"weekly"|"monthly", priority: Number(config.category_priority || 70) / 100 })),
    ...pages.rows.map((row) => ({ url: `${base}/sayfa/${row.slug}`, lastModified: row.updated_at, changeFrequency: "monthly" as const, priority: .5 })),
    ...posts.rows.map((row) => ({ url: `${base}/blog/icerik/${row.slug}`, lastModified: row.updated_at, changeFrequency: "monthly" as const, priority: .65 })),
  ];
}
