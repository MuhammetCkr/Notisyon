"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "./cart";
import { calculateShipping, type CommerceConfig } from "@/lib/commerce-config";

type FormValues = { firstName: string; lastName: string; email: string; phone: string; recipientName: string; line1: string; line2: string; district: string; city: string; postalCode: string };
const initialValues: FormValues = { firstName: "", lastName: "", email: "", phone: "", recipientName: "", line1: "", line2: "", district: "", city: "", postalCode: "" };

export function CheckoutForm({ config, customer }: { config: CommerceConfig; customer?: Record<string, unknown> | null }) {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const [values, setValues] = useState({ ...initialValues, firstName: String(customer?.first_name || ""), lastName: String(customer?.last_name || ""), email: String(customer?.email || ""), phone: String(customer?.phone || "") });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [promotion, setPromotion] = useState<{ code: string; label: string; discount: number; total: number } | null>(null);
  const [promotionState, setPromotionState] = useState("");
  const firstMethod = config.checkout.cardEnabled ? "card" : config.checkout.bankTransfer ? "bank_transfer" : "cash_on_delivery";
  const [paymentMethod, setPaymentMethod] = useState(firstMethod);
  const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: config.checkout.currency });
  const shipping = calculateShipping(subtotal, config.shipping);
  const update = (key: keyof FormValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  async function applyPromotion() {
    setPromotionState("Kod doğrulanıyor…"); setPromotion(null);
    try {
      const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promotionCode, subtotal }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Kod uygulanamadı.");
      setPromotion(data); setPromotionCode(data.code); setPromotionState(`${data.label} uygulandı.`);
    } catch (caught) { setPromotionState(caught instanceof Error ? caught.message : "Kod uygulanamadı."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!lines.length) return; setBusy(true); setError("");
    try {
      const orderResponse = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { email: values.email, firstName: values.firstName, lastName: values.lastName, phone: values.phone }, shippingAddress: { recipientName: values.recipientName || `${values.firstName} ${values.lastName}`, phone: values.phone, line1: values.line1, line2: values.line2, district: values.district, city: values.city, postalCode: values.postalCode }, items: lines.map(({ sku, quantity }) => ({ sku, quantity })), promotionCode: promotion?.code || undefined, paymentMethod, legalConsent: true }) });
      const order = await orderResponse.json(); if (!orderResponse.ok) throw new Error(order.error || "Sipariş oluşturulamadı.");
      if (!order.paymentRequired) { router.push(`/siparis/${order.orderId}?payment=${order.total === 0 ? "success" : "pending"}`); return; }
      const tokenResponse = await fetch("/api/paytr/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId }) });
      const token = await tokenResponse.json(); if (!tokenResponse.ok) throw new Error(token.error || "Ödeme oturumu başlatılamadı.");
      setIframeUrl(token.iframeUrl); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Beklenmeyen bir hata oluştu."); } finally { setBusy(false); }
  }
  if (!lines.length) return <main className="checkout-page"><p className="eyebrow">GÜVENLİ ÖDEME</p><h1>Ödemeye geçmek için sepetiniz boş.</h1><Link className="button button-dark" href="/urunler">Ürünleri incele</Link></main>;
  if (!config.general.guestCheckout && !customer) return <main className="checkout-page"><p className="eyebrow">GÜVENLİ ÖDEME</p><h1>Siparişi tamamlamak için giriş yapın.</h1><p>Mağaza ayarları gereği üyeliksiz alışveriş kapalıdır. Hesabınıza giriş yaptıktan sonra sepetiniz korunur.</p><Link className="button button-dark" href="/hesabim">Hesabıma giriş yap</Link></main>;
  if (iframeUrl) return <main className="checkout-page"><p className="eyebrow">PAYTR GÜVENLİ ÖDEME</p><h1>Ödeme adımı</h1><p>Kart bilgileriniz PayTR&apos;nin güvenli ödeme ekranına girilir; bu site kart verilerinizi saklamaz.</p><iframe className="paytr-frame" title="PayTR güvenli ödeme" src={iframeUrl} /></main>;
  return <main className="checkout-page"><p className="eyebrow">GÜVENLİ ÖDEME</p><h1>Teslimat ve ödeme</h1><p>Bilgilerinizi girdikten sonra PayTR&apos;nin güvenli ödeme ekranına yönlendirileceksiniz.</p>{config.checkout.minimumOrderTotal>0&&subtotal<config.checkout.minimumOrderTotal?<p className="form-error" role="alert">Sipariş alt limiti {money.format(config.checkout.minimumOrderTotal)}. Sepetinize {money.format(config.checkout.minimumOrderTotal-subtotal)} daha ürün ekleyin.</p>:null}<form className="checkout-form" onSubmit={submit}>
    <section><h2>İletişim bilgileri</h2><div className="form-grid two"><label>Ad<input required value={values.firstName} onChange={(e) => update("firstName", e.target.value)} /></label><label>Soyad<input required value={values.lastName} onChange={(e) => update("lastName", e.target.value)} /></label></div><div className="form-grid two"><label>E-posta<input required type="email" value={values.email} onChange={(e) => update("email", e.target.value)} /></label><label>Telefon<input required type="tel" placeholder="05xx xxx xx xx" value={values.phone} onChange={(e) => update("phone", e.target.value)} /></label></div></section>
    <section><h2>Teslimat adresi</h2><label>Alıcı adı soyadı<input required value={values.recipientName} placeholder="Boş bırakılırsa iletişim adı kullanılır" onChange={(e) => update("recipientName", e.target.value)} /></label><label>Adres<input required value={values.line1} onChange={(e) => update("line1", e.target.value)} /></label><label>Adres devamı <em>(opsiyonel)</em><input value={values.line2} onChange={(e) => update("line2", e.target.value)} /></label><div className="form-grid three"><label>İlçe<input required value={values.district} onChange={(e) => update("district", e.target.value)} /></label><label>İl<input required value={values.city} onChange={(e) => update("city", e.target.value)} /></label><label>Posta kodu<input value={values.postalCode} onChange={(e) => update("postalCode", e.target.value)} /></label></div></section>
    <section><h2>Ödeme yöntemi</h2><div className="checkout-payment-methods">{config.checkout.cardEnabled?<label><input type="radio" name="payment" checked={paymentMethod==="card"} onChange={()=>setPaymentMethod("card")}/><span><b>Kredi / banka kartı</b><small>{config.checkout.installments?"Taksit seçenekleri ödeme ekranında sunulur.":"Güvenli tek çekim ödeme."}</small></span></label>:null}{config.checkout.bankTransfer?<label><input type="radio" name="payment" checked={paymentMethod==="bank_transfer"} onChange={()=>setPaymentMethod("bank_transfer")}/><span><b>Havale / EFT</b><small>Sipariş sonrası banka bilgileri gösterilir.</small></span></label>:null}{config.checkout.cashOnDelivery?<label><input type="radio" name="payment" checked={paymentMethod==="cash_on_delivery"} onChange={()=>setPaymentMethod("cash_on_delivery")}/><span><b>Kapıda ödeme</b><small>{config.checkout.cashOnDeliveryFee?`${money.format(config.checkout.cashOnDeliveryFee)} hizmet bedeli`:"Ek hizmet bedeli yok"}</small></span></label>:null}</div></section><aside className="checkout-summary"><h2>Sipariş özeti</h2><p><span>Ara toplam</span><strong>{money.format(subtotal)}</strong></p><p><span>Kargo</span><strong>{shipping ? money.format(shipping) : "Ücretsiz"}</strong></p>{paymentMethod==="cash_on_delivery"&&config.checkout.cashOnDeliveryFee>0?<p><span>Kapıda ödeme</span><strong>{money.format(config.checkout.cashOnDeliveryFee)}</strong></p>:null}<small>{config.shipping.provider.toLocaleUpperCase("tr-TR")} · {config.shipping.estimatedDays}</small><div className="checkout-promotion"><label>Kupon veya hediye çeki</label><div><input value={promotionCode} onChange={(event) => { setPromotionCode(event.target.value.toUpperCase()); setPromotion(null); }} placeholder="Kodunuzu girin" /><button type="button" onClick={applyPromotion} disabled={!promotionCode.trim()}>Uygula</button></div>{promotionState && <small className={promotion ? "success" : ""}>{promotionState}</small>}</div>{promotion && <p className="discount"><span>İndirim</span><strong>−{money.format(promotion.discount)}</strong></p>}<p className="grand-total"><span>Genel toplam</span><strong>{money.format((promotion?.total ?? subtotal + shipping)+(paymentMethod==="cash_on_delivery"?config.checkout.cashOnDeliveryFee:0))}</strong></p></aside><label className="checkout-consent"><input type="checkbox" required/><span><Link href="/yasal/mesafeli-satis">Mesafeli satış sözleşmesini</Link> ve <Link href="/yasal/on-bilgilendirme">ön bilgilendirme formunu</Link> okudum, kabul ediyorum.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark checkout-submit" disabled={busy||subtotal<config.checkout.minimumOrderTotal||lines.reduce((sum,line)=>sum+line.quantity,0)<config.checkout.minimumItemCount}>{busy ? "Hazırlanıyor…" : (promotion?.total === 0 ? "Siparişi tamamla" : paymentMethod==="card"?"PayTR ile güvenli ödemeye geç":"Siparişi oluştur")}</button>
  </form></main>;
}
