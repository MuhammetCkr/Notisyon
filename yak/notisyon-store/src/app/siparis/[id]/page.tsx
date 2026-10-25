import Link from "next/link";

export default async function OrderStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { id } = await params; const { payment } = await searchParams; const pending = payment === "success";
  return <main className="checkout-page"><p className="eyebrow">SİPARİŞ DURUMU</p><h1>{pending ? "Ödeme sonucunuz kontrol ediliyor" : "Ödeme işlemi tamamlanmadı"}</h1><p>{pending ? "Ödeme kesinliği PayTR'nin güvenli sunucu bildirimi ile doğrulanır. İşleminiz onaylandığında siparişiniz hazırlanacaktır." : "Ödeme tamamlanmadıysa sepetinize dönerek yeniden deneyebilirsiniz."}</p><p className="order-reference">Sipariş referansı: {id}</p><Link className="button button-dark" href={pending ? "/" : "/sepet"}>{pending ? "Ana sayfaya dön" : "Sepete dön"}</Link></main>;
}
