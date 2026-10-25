"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { calculateShipping, type CommerceConfig } from "@/lib/commerce-config";

export function CartContents({ shipping: shippingConfig, currency, emptyText = "Sepetiniz şu an boş.", freeShippingText = "Ücretsiz kargo" }: { shipping: CommerceConfig["shipping"]; currency: string; emptyText?: string; freeShippingText?: string }) {
  const { lines, subtotal, changeQuantity, remove } = useCart();
  const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency });
  const shipping = calculateShipping(subtotal, shippingConfig);
  if (!lines.length) return <main className="cart-page"><p className="eyebrow">SEPETİNİZ</p><h1>{emptyText}</h1><p>Beğendiğiniz ürünleri ekleyerek alışverişe başlayabilirsiniz.</p><Link className="button button-dark" href="/urunler">Ürünleri incele</Link></main>;

  return <main className="cart-page"><p className="eyebrow">SEPETİNİZ</p><h1>Sipariş özeti</h1><div className="cart-layout"><section className="cart-lines">{lines.map((line) => <article className="cart-line" key={line.sku}><div className="cart-thumb"><b>{line.name.split(" ").slice(-2).join(" ")}</b></div><div><p>{line.brand}</p><h2>{line.name}</h2><strong>{money.format(line.price)}</strong></div><div className="quantity"><button aria-label="Azalt" onClick={() => changeQuantity(line.sku, line.quantity - 1)}>−</button><span>{line.quantity}</span><button aria-label="Artır" onClick={() => changeQuantity(line.sku, line.quantity + 1)}>+</button></div><button className="remove" onClick={() => remove(line.sku)}>Kaldır</button></article>)}</section><aside className="order-summary"><h2>Toplam</h2><p><span>Ara toplam</span><strong>{money.format(subtotal)}</strong></p><p><span>Kargo</span><strong>{shipping ? money.format(shipping) : freeShippingText}</strong></p><p className="grand-total"><span>Genel toplam</span><strong>{money.format(subtotal + shipping)}</strong></p><p className="shipping-note">{shippingConfig.freeShippingThreshold===0||subtotal>=shippingConfig.freeShippingThreshold?`${freeShippingText} uygulandı.`:`${money.format(shippingConfig.freeShippingThreshold-subtotal)} daha ekleyin, kargonuz ücretsiz olsun.`}</p><small>{shippingConfig.provider.toLocaleUpperCase("tr-TR")} · Tahmini teslimat {shippingConfig.estimatedDays}</small><Link className="button button-dark checkout" href="/odeme">Ödemeye geç</Link></aside></div></main>;
}
