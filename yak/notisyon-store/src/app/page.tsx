/* eslint-disable @next/next/no-html-link-for-pages */
import { listStorefrontProducts } from "@/lib/storefront-catalog";
import { AddToCartButton } from "@/components/cart";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { HomeDesignSections } from "@/components/home-design-sections";
import { readDesignConfig } from "@/lib/design-store";
import { connection } from "next/server";
import { StorefrontExperience } from "@/components/storefront-experience";

const collectionLinks = [
  { icon: "notebook", title: "Defter", copy: "Notlarını stilinle buluştur.", href: "/defter-31" },
  { icon: "calendar", title: "Planlayıcı", copy: "Gününü daha iyi planla.", href: "/planlayici-32" },
  { icon: "heart", title: "Çeyiz Defteri", copy: "Hazırlıklarını tek yerde topla.", href: "/ceyiz-defteri" },
  { icon: "rings", title: "Düğün & Nikâh", copy: "En özel anlarına eşlik etsin.", href: "/dugun-nikah" },
  { icon: "letter", title: "Tebrik Kartları", copy: "Küçük detaylarla fark yarat.", href: "/tebrik-karti-30" },
  { icon: "game", title: "Eğlence & Oyun", copy: "Birlikte geçirilen zamanı güzelleştir.", href: "/eglence-oyun" },
];


function CategoryIcon({ name }: { name: string }) {
  if (name === "notebook") return <svg viewBox="0 0 24 24"><path d="M7 3.5h11.5A1.5 1.5 0 0 1 20 5v14a1.5 1.5 0 0 1-1.5 1.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5Z"/><path d="M7 3.5v17M2.5 7h4M2.5 11h4M2.5 15h4"/></svg>;
  if (name === "calendar") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18m-13 5 2 2 5-5"/></svg>;
  if (name === "heart") return <svg viewBox="0 0 24 24"><path d="M6 3.5h11a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M11.5 16s-4-2.2-4-5a2.2 2.2 0 0 1 4-1.3 2.2 2.2 0 0 1 4 1.3c0 2.8-4 5-4 5Z"/></svg>;
  if (name === "rings") return <svg viewBox="0 0 24 24"><circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/><path d="m12 5 2-3 2 3-2 2-2-2Z"/></svg>;
  if (name === "letter") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  return <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>;
}

export default async function Home() {
  await connection();
  const catalog = await listStorefrontProducts();
  const design = await readDesignConfig();
  const featuredProducts = (catalog.some((product) => product.flags.featured) ? catalog.filter((product) => product.flags.featured) : catalog).slice(0, 4);
  return (
    <main className={design.home.replaceLegacy ? "managed-home-active" : ""}>
      <StoreHeader />
      <StorefrontExperience bannersOnly/>
      {design.home.replaceLegacy && <HomeDesignSections config={design} products={catalog}/>} 
      {!design.home.replaceLegacy && <>
      <section className="notisyon-hero-v5" id="anasayfa"><div className="notisyon-hero-v5-inner"><div className="notisyon-hero-v5-copy"><span className="notisyon-hero-v5-kicker">NOTİSYON KOLEKSİYONLARI</span><h1>Defter, planlayıcı ve çeyiz ürünleriyle planını kolaylaştır.</h1><p>Günlük notlarından düğün hazırlıklarına kadar; defter, planlayıcı, çeyiz defteri ve özel gün ürünlerini keşfet.</p><div className="notisyon-hero-v5-actions"><a className="notisyon-hero-v5-primary" href="/urunler">Defter Modellerini İncele</a><a className="notisyon-hero-v5-secondary" href="#koleksiyonlar">Çeyiz Ürünleri →</a></div><nav className="notisyon-hero-v5-categories" aria-label="Ürün kategorileri"><a href="/urunler">Defter</a><a href="/urunler">Planlayıcı</a><a href="/urunler">Çeyiz Defteri</a><a href="/urunler">Tebrik Kartı</a><a href="/urunler">Eğlence &amp; Oyun</a><a href="/urunler">Düğün &amp; Nikah</a></nav></div><div className="notisyon-hero-v5-visual" aria-hidden="true"><div className="notisyon-hero-v5-card notisyon-hero-v5-card-1"><span>DEFTER</span><strong>Yaz.<br />Düşün.<br />Planla.</strong></div><div className="notisyon-hero-v5-card notisyon-hero-v5-card-2"><span>ÇEYİZ DEFTERİ</span><strong>Hazırlıklarını<br />tek yerde<br />topla.</strong></div><div className="notisyon-hero-v5-circle">✦</div><span className="notisyon-hero-v5-visual-note">PLANLA · YAZ · HATIRLA</span></div></div></section>
      <section className="section" id="cok-satanlar">
        <div className="section-heading"><div><p className="eyebrow">ÖNE ÇIKANLAR</p><h2>Çok satanlar</h2></div><a className="text-link" href="#tum-urunler">Tüm ürünleri gör <span>→</span></a></div>
        <div className="product-grid">{featuredProducts.map((product, index) => <article className="product-card" key={product.sku}><a href={`/urun/${product.slug}`}><div className={`product-image image-${index + 1}`}>{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 680px) 100vw, 25vw" /> : <div className="notebook-cover"><small>NOTİSYON</small><b>{product.coverText}</b></div>}<span className="product-badge">{index === 1 ? "%40 indirim" : "4 Al 3 Öde"}</span></div><p className="product-brand">{product.brand}</p><h3>{product.name}</h3><p className="price">{product.price}</p></a><AddToCartButton product={{ sku: product.sku, name: product.name, brand: product.brand, price: Number(product.price.replace(/[^0-9,]/g, "").replace(",", ".")) }} /></article>)}</div>
      </section>
      <section className="notisyon-categories-premium" id="koleksiyonlar" aria-labelledby="notisyon-home-categories-title">
        <header className="notisyon-categories-premium-head">
          <div className="notisyon-categories-premium-title"><span>KOLEKSİYONLAR</span><h2 id="notisyon-home-categories-title">İhtiyacına göre keşfet.</h2></div>
          <p>Not alma, planlama, özel günler ve keyifli anlar için.</p>
        </header>
        <nav className="notisyon-categories-premium-grid" aria-label="Koleksiyonlar">
          {collectionLinks.map((collection) => (
            <a className="notisyon-category-premium-card" href={collection.href} key={collection.title}>
              <span className="notisyon-category-premium-icon"><CategoryIcon name={collection.icon} /></span>
              <span className="notisyon-category-premium-copy"><strong>{collection.title}</strong><small>{collection.copy}</small></span>
              <span className="notisyon-category-premium-arrow">→</span>
            </a>
          ))}
        </nav>
      </section>
      <section className="notisyon-editorial-final" id="toptan"><div className="notisyon-editorial-copy"><span className="notisyon-editorial-kicker">ÇEYİZ &amp; DÜĞÜN</span><h2>Hazırlıklarını<br />daha düzenli planla.</h2><p>Çeyiz listesinden düğün hazırlıklarına kadar ihtiyaç duyduğun planlayıcıları ve özel ürünleri bir arada keşfet.</p><div className="notisyon-editorial-actions"><a className="notisyon-editorial-primary" href="/ceyiz-defteri">Çeyiz Ürünlerini Keşfet</a><a className="notisyon-editorial-secondary" href="/dugun-nikah">Düğün &amp; Nikah →</a></div></div><div className="notisyon-editorial-links"><a className="notisyon-editorial-link" href="/ceyiz-defteri"><span>01</span><div><strong>Çeyiz Defteri</strong><small>Listeler, hazırlıklar ve planlama</small></div><b>→</b></a><a className="notisyon-editorial-link" href="/dugun-nikah"><span>02</span><div><strong>Düğün &amp; Nikah</strong><small>Özel günlerine eşlik eden ürünler</small></div><b>→</b></a><a className="notisyon-editorial-link" href="/blog"><span>03</span><div><strong>Notisyon Rehber</strong><small>Hazırlık sürecini kolaylaştıran içerikler</small></div><b>→</b></a></div></section>
      <section className="notisyon-guide-final" id="rehber" aria-labelledby="notisyon-guide-final-title"><header className="notisyon-guide-final-head"><div><span>NOTİSYON REHBER</span><h2 id="notisyon-guide-final-title">Hazırlıklarını kolaylaştıran içerikler.</h2><p>Çeyiz, düğün ve planlama sürecinde işine yarayacak pratik rehberler.</p></div><a href="/blog">Tüm Rehberler →</a></header><div className="notisyon-guide-final-grid"><article><span>ÇEYİZ &amp; DÜĞÜN</span><h3>Çeyiz Listesinde Neler Olmalı?</h3><p>2026 çeyiz hazırlığında ihtiyaç duyabileceğin temel ürünleri kategorilere göre incele.</p><a href="/blog/icerik/ceyiz-listesinde-neler-olmali">Rehberi Oku →</a></article><article><span>DÜĞÜN PLANLAMA</span><h3>Düğün Hazırlıkları Nasıl Planlanır?</h3><p>Düğün gününe kadar yapılacakları 12 aylık plan üzerinden adım adım takip et.</p><a href="/blog/icerik/dugun-hazirliklari-nasil-planlanir">Rehberi Oku →</a></article><article><span>BOHÇA REHBERİ</span><h3>Gelin Bohçasına Ne Konur?</h3><p>Gelin ve damat bohçasında yer alabilecek ürünleri pratik bir listeyle keşfet.</p><a href="/blog/icerik/gelin-bohcasina-ne-konur">Rehberi Oku →</a></article><article><span>BÜTÇE &amp; PLANLAMA</span><h3>Düğün Bütçesi Nasıl Hazırlanır?</h3><p>Düğün harcamalarını ana kalemlere ayır ve bütçeni daha kolay takip et.</p><a href="/blog/icerik/dugun-butcesi-nasil-hazirlanir">Rehberi Oku →</a></article></div><aside className="notisyon-guide-tool"><div><span>ÜCRETSİZ PLANLAMA ARACI</span><h3>Çeyiz listen hazır olsun.</h3><p>325 maddelik interaktif çeyiz listesinde ihtiyaçlarını işaretle, ilerlemeni ve tahmini bütçeni takip et.</p></div><a href="/ceyiz-listesi">İnteraktif Çeyiz Listesini Aç →</a></aside></section>
      </>}
      <SiteFooter />
    </main>
  );
}
