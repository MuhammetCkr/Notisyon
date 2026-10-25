import Link from "next/link";
import { CategoryCatalog } from "@/components/category-catalog";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { listStorefrontProducts } from "@/lib/storefront-catalog";
import { readDesignConfig } from "@/lib/design-store";
import { connection } from "next/server";
import { readPlatformSettings } from "@/lib/platform-settings";

const navItems = [
  ["Çeyiz Defteri", "/ceyiz-defteri"], ["Tebrik Kartı", "/tebrik-karti-30"], ["Defter", "/defter-31"],
  ["Planlayıcı", "/planlayici-32"], ["Eğlence & Oyun", "/eglence-oyun"], ["Düğün & Nikâh", "/dugun-nikah"],
];


export default async function ProductsPage() {
  await connection();
  const [products, design, platform] = await Promise.all([listStorefrontProducts(), readDesignConfig(), readPlatformSettings()]);
  return (
    <main className="category-page">
      <StoreHeader />
      <div className="category-shell">
        <nav className="category-breadcrumb" aria-label="Sayfa yolu"><Link href="/">Ana sayfa</Link><span>›</span><span>Tüm ürünler</span></nav>
        <header className="category-intro"><div><span>NOTİSYON KOLEKSİYONLARI</span><h1>Tüm ürünler</h1></div><div><p>Defter, planlayıcı ve özel gün ürünlerini tek bir seçkide keşfet; ihtiyacına göre filtrele ve sırala.</p><small>{products.length} ürün</small></div></header>
        <nav className="category-subcategories" aria-label="Kategoriler">{navItems.map(([label, href]) => <Link href={href} key={href}>{label}<span>→</span></Link>)}</nav>
        <CategoryCatalog products={products} cardConfig={design.productCard} globalSettings={platform.products} texts={platform.texts} />
      </div>
      <SiteFooter />
    </main>
  );
}
