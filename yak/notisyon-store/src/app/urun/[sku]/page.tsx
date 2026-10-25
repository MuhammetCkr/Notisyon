import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AddToCartButton } from "@/components/cart";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { readCustomerSession } from "@/lib/customer-auth";
import { readPlatformSettings, settingBoolean, settingText } from "@/lib/platform-settings";
import { getStorefrontProduct } from "@/lib/storefront-catalog";

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params;
  const product = await getStorefrontProduct(sku);
  if (!product) return {};
  return { title: product.seoTitle || `${product.name} | Notisyon`, description: product.seoDescription || product.shortDescription.replace(/<[^>]*>/g, "").slice(0, 160) || undefined, keywords: product.seoKeywords || undefined, alternates: product.canonicalUrl ? { canonical: product.canonicalUrl } : undefined, robots: { index: product.indexable, follow: product.followLinks }, openGraph: { title: product.seoTitle || product.name, description: product.seoDescription || undefined, images: product.imageUrl ? [product.imageUrl] : undefined } };
}

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  await connection();
  const { sku } = await params;
  const [product, platform, customer] = await Promise.all([getStorefrontProduct(sku), readPlatformSettings(), readCustomerSession()]);
  if (!product) notFound();
  const showPrices = settingBoolean(platform.products, "show_prices", true) && (!settingBoolean(platform.products, "members_only_prices") || Boolean(customer));
  const showSku = settingBoolean(platform.products, "show_sku"), showBarcode = settingBoolean(platform.products, "show_barcode"), showCategory = settingBoolean(platform.products, "show_category", true), showShort = settingBoolean(platform.products, "show_short_description", true), showVariantStock = settingBoolean(platform.products, "variant_stock", true);
  const addLabel = settingText(platform.texts, "add_to_cart", "Sepete ekle"), outOfStock = settingText(platform.texts, "out_of_stock", "Tükendi");
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://notisyon.com").replace(/\/$/, "");
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, ...(settingBoolean(platform.marketing, "rich_image", true) && product.imageUrl ? { image: [product.imageUrl.startsWith("http") ? product.imageUrl : `${base}${product.imageUrl}`] } : {}), ...(settingBoolean(platform.marketing, "rich_description", true) ? { description: product.shortDescription } : {}), ...(settingBoolean(platform.marketing, "rich_sku", true) ? { sku: product.sku } : {}), ...(settingBoolean(platform.marketing, "rich_brand", true) ? { brand: { "@type": "Brand", name: product.brand } } : {}), offers: { "@type": "Offer", priceCurrency: "TRY", price: product.priceValue, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${base}/urun/${product.slug}` } };
  return <main className="product-page"><StoreHeader/>{settingBoolean(platform.marketing, "rich_snippets", true) ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}/> : null}<div className="product-detail-shell"><Link className="back-link" href="/urunler">← Mağazaya dön</Link><div className="product-detail"><div className="detail-image">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={900} height={900} unoptimized/> : <div className="detail-cover"><small>NOTİSYON</small><b>{product.coverText}</b></div>}</div><section><p className="eyebrow">{product.brand}</p><h1>{product.name}</h1>{showPrices ? <p className="detail-price">{product.price}</p> : <p className="detail-price-gate">Fiyatı görmek için hesabınıza giriş yapın.</p>}{showShort && product.shortDescription ? <p className="detail-short">{product.shortDescription.replace(/<[^>]*>/g, "")}</p> : null}<p className="detail-stock">{product.stock > 0 ? "Stokta" : outOfStock}</p>{product.variants.length > 1 ? <div className="storefront-variants"><span>Seçenekler</span>{product.variants.map((variant) => <div key={variant.sku}><div><b>{Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || variant.sku}</b>{showVariantStock ? <small>{variant.stock_quantity > 0 ? `${variant.stock_quantity} adet stokta` : outOfStock}</small> : null}</div>{showPrices ? <strong>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(variant.sale_price)}</strong> : null}{showPrices && variant.stock_quantity > 0 ? <AddToCartButton className="variant-add-button" label={addLabel} product={{ sku: variant.sku, name: product.name, brand: product.brand, price: variant.sale_price }}/> : null}</div>)}</div> : showPrices && product.stock > 0 ? <AddToCartButton className="detail-button" label={addLabel} product={{ sku: product.sku, name: product.name, brand: product.brand, price: product.priceValue }}/> : null}<dl>{showCategory ? <div><dt>Kategori</dt><dd>{product.categories.join(" / ") || "Kategorisiz"}</dd></div> : null}<div><dt>Varyasyon</dt><dd>{product.variants.length}</dd></div>{showSku ? <div><dt>Stok kodu</dt><dd>{product.sku}</dd></div> : null}{showBarcode && product.barcode ? <div><dt>Barkod</dt><dd>{product.barcode}</dd></div> : null}</dl></section></div>{product.descriptionHtml ? <section className="product-rich-description"><span>ÜRÜN DETAYLARI</span><h2>{product.name}</h2><div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/></section> : null}</div><SiteFooter/></main>;
}
