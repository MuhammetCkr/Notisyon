"use client";

import type { MouseEvent } from "react";
import { useCart } from "@/components/cart";
import type { ProductPreview } from "@/data/catalog";
import { applyDesignTemplate } from "@/lib/design-template";

export function SourceProductCard({ product, html, css, buttonLabel }: { product: ProductPreview; html: string; css: string; buttonLabel: string }) {
  const { add } = useCart();
  const rendered = applyDesignTemplate(html, {
    product_url: `/urun/${product.slug}`,
    image_url: product.imageUrl || "",
    product_name: product.name,
    brand: product.brand,
    price: product.price,
    badge: product.badge || "",
    sku: product.sku,
    stock: product.stock,
    button_label: buttonLabel,
  });

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-add-to-cart]")) return;
    event.preventDefault();
    add({ sku: product.sku, name: product.name, brand: product.brand, price: product.priceValue });
  }

  return <div className="source-product-card" onClick={handleClick}>
    {css.trim() ? <style>{css}</style> : null}
    <div dangerouslySetInnerHTML={{ __html: rendered }}/>
  </div>;
}
