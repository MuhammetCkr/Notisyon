/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart";
import { SourceProductCard } from "@/components/source-product-card";
import type { ProductPreview } from "@/data/catalog";
import type { DesignConfig, HomeSection } from "@/lib/design-config";
import { applyDesignTemplate } from "@/lib/design-template";

const categories = [
  ["Defter", "/defter-31"], ["Planlayıcı", "/planlayici-32"], ["Çeyiz Defteri", "/ceyiz-defteri"],
  ["Düğün & Nikah", "/dugun-nikah"], ["Tebrik Kartları", "/tebrik-karti-30"], ["Eğlence & Oyun", "/eglence-oyun"],
];

export function HomeDesignSections({ config, products }: { config: DesignConfig; products: ProductPreview[] }) {
  return <div className="managed-home-sections">{config.home.sections.filter((section) => section.active).map((section) => <HomeBlock config={config} products={products} section={section} key={section.id}/>)}</div>;
}

function HomeBlock({ config, products, section }: { config: DesignConfig; products: ProductPreview[]; section: HomeSection }) {
  if (section.sourceMode && section.customHtml?.trim()) {
    const html = applyDesignTemplate(section.customHtml, { title: section.title, subtitle: section.subtitle, image_url: section.imageUrl || section.slides?.[0]?.imageUrl || "", button_label: section.buttonLabel || section.slides?.[0]?.buttonLabel || "İncele", button_href: section.buttonHref || section.slides?.[0]?.buttonHref || "/urunler" });
    return <section className="managed-home-section managed-source-block" style={{ background: section.background }}>{section.customCss?.trim() ? <style>{section.customCss}</style> : null}<div dangerouslySetInnerHTML={{ __html: html }}/></section>;
  }
  if (section.type === "hero_slider") return <Hero section={section}/>;
  if (section.type === "product_carousel") {
    const filtered = products.filter((product) => section.productSource === "new" ? product.flags.new : section.productSource === "deal" ? product.flags.deal : section.productSource === "featured" ? product.flags.featured : true);
    const visible = (filtered.length ? filtered : products).slice(0, section.productLimit || 4);
    return <section className="managed-home-section managed-products" style={{ background: section.background }}><Heading section={section}/><div className="managed-product-grid">{visible.map((product) => config.productCard.sourceMode && config.productCard.customHtml.trim() ? <SourceProductCard key={product.sku} product={product} html={config.productCard.customHtml} css={config.productCard.customCss} buttonLabel={config.productCard.buttonLabel}/> : <article className="managed-product-card" data-style={config.productCard.style} key={product.sku}><Link className="managed-product-image" href={`/urun/${product.slug}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name}/> : <span className="category-cover-placeholder"><small>NOTİSYON</small><b>{product.coverText}</b></span>}{config.productCard.showBadges && product.badge ? <em>{product.badge}</em> : null}</Link>{config.productCard.showBrand && <small>{product.brand}</small>}<Link href={`/urun/${product.slug}`}><h3>{product.name}</h3></Link><strong>{product.price}</strong>{config.productCard.quickAdd && <AddToCartButton className="category-add-button" label={config.productCard.buttonLabel} product={{ sku: product.sku, name: product.name, brand: product.brand, price: product.priceValue }}/>}</article>)}</div></section>;
  }
  if (section.type === "category_grid") return <section className="managed-home-section managed-categories" style={{ background: section.background }}><Heading section={section}/><nav className="managed-category-grid" aria-label="Kategoriler">{categories.map(([label, href]) => <Link href={href} key={href}><span>{label}</span><b>→</b></Link>)}</nav></section>;
  if (section.type === "banner") return <section className="managed-home-section managed-banner" style={{ background: section.background, backgroundImage: section.imageUrl ? `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.2)),url(${section.imageUrl})` : undefined }}><h2>{section.title}</h2><p>{section.subtitle}</p>{section.buttonLabel && <Link href={section.buttonHref || "/"}>{section.buttonLabel} →</Link>}</section>;
  return <section className="managed-home-section managed-rich" style={{ background: section.background }}><div dangerouslySetInnerHTML={{ __html: section.html || "" }}/></section>;
}

function Hero({ section }: { section: HomeSection }) {
  const slides = section.slides?.length ? section.slides : [{ id: "empty", eyebrow: "NOTİSYON", title: section.title, description: section.subtitle, imageUrl: "", buttonLabel: "İncele", buttonHref: "/urunler" }];
  const [active, setActive] = useState(0), slide = slides[Math.min(active, slides.length - 1)];
  return <section className="managed-home-section managed-hero" style={{ backgroundColor: section.background, backgroundImage: slide.imageUrl ? `linear-gradient(90deg,rgba(255,255,255,.96),rgba(255,255,255,.08)),url(${slide.imageUrl})` : undefined }}><div className="managed-hero-copy"><span>{slide.eyebrow}</span><h1>{slide.title}</h1><p>{slide.description}</p><Link href={slide.buttonHref || "/urunler"}>{slide.buttonLabel || "İncele"} →</Link></div>{slides.length > 1 && <div className="managed-slider-dots">{slides.map((item, index) => <button aria-label={`${index + 1}. slayt`} className={active === index ? "active" : ""} key={item.id} onClick={() => setActive(index)}/>)}</div>}</section>;
}

function Heading({ section }: { section: HomeSection }) { return <header className="managed-section-heading"><div><span>NOTİSYON SEÇKİSİ</span><h2>{section.title}</h2></div><p>{section.subtitle}</p></header>; }
