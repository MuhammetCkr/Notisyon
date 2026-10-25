import Link from "next/link";

// Dashboard payload is produced by controlled SQL projections in the server store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row=Record<string,any>;
const money=(v:unknown)=>Number(v||0).toLocaleString("tr-TR",{minimumFractionDigits:0,maximumFractionDigits:2})+" ₺";
const statusNames:Record<string,string>={draft:"Taslak",pending_payment:"Ödeme bekliyor",paid:"Ödendi",processing:"Hazırlanıyor",shipped:"Kargoda",delivered:"Teslim edildi",cancelled:"İptal",refunded:"İade"};
const fmt=(v:unknown)=>new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(String(v)));

export function AdminDashboard({data}:{data:Row}){
 const range=Number(data.rangeDays)||14;
 const journey={visitors:Number(data.journey?.visitors||0),productViews:Number(data.journey?.product_views||0),cartAdds:Number(data.journey?.cart_adds||0),checkouts:Number(data.journey?.checkouts||0),payments:Number(data.journey?.payments||0)};
 const funnel=[{label:"Toplam ziyaretçi",value:journey.visitors,tone:"visitor"},{label:"Ürün görüntüleyen",value:journey.productViews,tone:"product"},{label:"Sepete ekleyen",value:journey.cartAdds,tone:"cart"},{label:"Ödeme adımına geçen",value:journey.checkouts,tone:"checkout"},{label:"Siparişi tamamlayan",value:journey.payments,tone:"payment"}];
 const rate=(value:number,base:number)=>base>0?Math.min(100,Math.round(value/base*1000)/10):0;
 const actions=[
  data.orders.open>0&&{tone:"amber",title:`${data.orders.open} sipariş işlem bekliyor`,text:"Ödeme ve hazırlama sırasını kontrol edin.",href:"/admin/orders",cta:"Siparişlere git"},
  data.products.out_of_stock>0&&{tone:"red",title:`${data.products.out_of_stock} ürün stokta yok`,text:"Satış kaybını önlemek için stokları güncelleyin.",href:"/admin/products",cta:"Stokları incele"},
  data.products.drafts>0&&{tone:"blue",title:`${data.products.drafts} ürün taslakta`,text:"Eksik içerikleri tamamlayıp satışa açabilirsiniz.",href:"/admin/products",cta:"Ürünleri aç"},
  data.content.unread_forms>0&&{tone:"violet",title:`${data.content.unread_forms} yeni form yanıtı`,text:"Müşteri talepleri yanıtlanmayı bekliyor.",href:"/admin/forms",cta:"Yanıtları gör"},
 ].filter(Boolean) as Row[];
 return <div className="overview-v5">
  <section className="overview-v5-toolbar"><div><b>Operasyon görünümü</b><small>Son senkronizasyon şimdi tamamlandı</small></div><nav aria-label="Rapor tarih aralığı">{[[1,"Bugün"],[7,"7 gün"],[14,"14 gün"],[30,"30 gün"]].map(([days,label])=><Link className={range===days?"active":""} href={`/admin?range=${days}`} key={days}>{label}</Link>)}</nav></section>

  <section className="overview-v5-metrics">
   <article className="revenue"><div><span>Bu ay ciro</span><strong>{money(data.orders.month_revenue)}</strong><small>{data.orders.month_orders} sipariş · Ortalama sepet {money(data.orders.average_basket)}</small></div></article>
   <article className="today"><div><span>Bugün</span><strong>{money(data.orders.today_revenue)}</strong><small>{data.orders.today_orders} yeni sipariş</small></div></article>
   <article className="action"><div><span>Aksiyon bekleyen</span><strong>{data.orders.open}</strong><small>Ödeme veya hazırlama sürecinde</small></div></article>
   <article className="customers"><div><span>Müşteriler</span><strong>{data.customers.total}</strong><small>Son 30 günde +{data.customers.new_30d}</small></div></article>
  </section>

  <section className="overview-v5-signals">
   <Link href="/admin/orders?status=pending_payment"><span><b>Ödemesi yapılmayan siparişler</b><em>Müşteriye dönüş veya ödeme kontrolü gerekebilir.</em></span><strong>{data.orders.unpaid_orders}</strong><u>Siparişleri incele →</u></Link>
   <Link href="/admin/reports"><span><b>Tamamlanmayan sepetler</b><em>Ödeme adımına geçmeyen oturumları değerlendirin.</em></span><strong>{data.journey?.abandoned_carts||0}</strong><u>Raporu aç →</u></Link>
  </section>

  <section className="overview-v5-panel overview-v5-attention"><header><div><h2>Bugün ilgilenmeniz gerekenler</h2></div><small>{actions.length} aksiyon</small></header><div>{actions.length?actions.map((x,i)=><Link className={x.tone} href={x.href} key={i}><span><b>{x.title}</b><small>{x.text}</small></span><em>{x.cta} →</em></Link>):<div className="overview-v5-success"><span><b>Operasyon güncel</b><small>Kritik bekleyen iş görünmüyor.</small></span></div>}</div></section>

  <section className="overview-v5-grid overview-v5-main">
   <article className="overview-v5-panel overview-v5-journey"><header><div><h2>Ziyaretçi yolculuğu</h2><p>Satın alma yolundaki adımları ve kayıpları izleyin.</p></div><strong><small>Sipariş dönüşümü</small>%{rate(journey.payments,journey.visitors).toLocaleString("tr-TR")}</strong></header><div>{funnel.map((step,index)=>{const previous=index===0?step.value:funnel[index-1].value;const conversion=index===0?100:rate(step.value,previous);return <section key={step.label}><header><span>{step.label}</span><b>{step.value.toLocaleString("tr-TR")}</b><em>%{conversion.toLocaleString("tr-TR")}</em></header><div><i style={{width:`${Math.max(4,conversion)}%`}}/></div>{index>0&&<small>{Math.max(0,previous-step.value).toLocaleString("tr-TR")} ziyaretçi kaybı</small>}</section>})}</div><footer>Yalnızca analitik çerez izni veren ziyaretçiler ölçülür.</footer></article>
   <article className="overview-v5-panel overview-v5-status"><header><div><h2>Durum dağılımı</h2></div><Link href="/admin/orders">Tümünü gör →</Link></header><div>{data.statuses.length?data.statuses.map((x:Row)=><Link href={`/admin/orders?status=${x.status}`} key={x.status}><i className={`status-dot ${x.status}`}/><span><b>{statusNames[x.status]||x.status}</b><small>{money(x.total)}</small></span><strong>{x.count}</strong></Link>):<p className="overview-v5-empty">Henüz sipariş yok.</p>}</div></article>
  </section>

  <section className="overview-v5-grid overview-v5-tables">
   <article className="overview-v5-panel overview-v5-orders"><header><div><h2>Yeni siparişler</h2></div><Link href="/admin/orders">Sipariş merkezi →</Link></header><div><header><span>Sipariş</span><span>Müşteri</span><span>Durum</span><span>Tutar</span></header>{data.recentOrders.map((x:Row)=><Link href="/admin/orders" key={x.id}><span><b>#{x.order_number}</b><small>{fmt(x.created_at)} · {x.item_count} ürün</small></span><span>{x.customer}</span><em className={x.status}>{statusNames[x.status]||x.status}</em><strong>{money(x.grand_total)}</strong></Link>)}{!data.recentOrders.length&&<p className="overview-v5-empty">Henüz sipariş hareketi bulunmuyor.</p>}</div></article>
   <article className="overview-v5-panel overview-v5-stock"><header><div><h2>Kritik stoklar</h2></div><Link href="/admin/products">Stok yönetimi →</Link></header><div>{data.lowStock.map((x:Row)=><Link href={`/admin/products/${x.id}`} key={x.id}><span><b>{x.name}</b><small>{x.variant_count} varyasyon</small></span><em className={x.stock===0?"empty":"low"}>{x.stock===0?"Tükendi":`${x.stock} adet`}</em></Link>)}{!data.lowStock.length&&<div className="overview-v5-success compact"><span><b>Stoklar sağlıklı</b><small>Kritik seviyede ürün bulunmuyor.</small></span></div>}</div></article>
  </section>

  <section className="overview-v5-grid overview-v5-bottom">
   <article className="overview-v5-panel overview-v5-health"><header><div><h2>Ürün sağlığı</h2></div><Link href="/admin/products">Yönet →</Link></header><div><section><strong>{data.products.published}</strong><span>Yayında</span></section><section><strong>{data.products.drafts}</strong><span>Taslak</span></section><section><strong>{data.products.stock}</strong><span>Toplam stok</span></section><section><strong>{data.products.out_of_stock}</strong><span>Stoksuz</span></section></div></article>
   <article className="overview-v5-panel overview-v5-products"><header><div><h2>Ürün performansı</h2></div><Link href="/admin/reports">Rapor →</Link></header><ol>{data.topProducts.map((x:Row,i:number)=><li key={`${x.sku}-${i}`}><i>{i+1}</i><span><b>{x.name}</b><small>{x.sku}</small></span><strong>{x.quantity} adet<small>{money(x.revenue)}</small></strong></li>)}{!data.topProducts.length&&<p className="overview-v5-empty">Satış verisi oluştuğunda ürünler burada görünür.</p>}</ol></article>
   <article className="overview-v5-panel overview-v5-content"><header><div><h2>Yayın merkezi</h2></div><Link href="/admin/blog">Yönet →</Link></header><div><Link href="/admin/blog"><span><b>{data.content.blog_published} blog yayında</b><small>{data.content.blog_drafts} taslak içerik</small></span></Link><Link href="/admin/pages"><span><b>{data.content.pages_published} aktif sayfa</b><small>Kurumsal ve özel sayfalar</small></span></Link><Link href="/admin/campaigns"><span><b>{data.content.active_campaigns} aktif kampanya</b><small>İndirim ve kupon yönetimi</small></span></Link></div></article>
  </section>

  <section className="overview-v5-panel overview-v5-quick"><header><div><h2>Sık kullanılan araçlar</h2></div></header><div>{[["Yeni ürün ekle","/admin/products/new"],["Siparişleri yönet","/admin/orders"],["Blog içeriği oluştur","/admin/blog"],["Kampanya oluştur","/admin/campaigns"],["Sayfa düzenle","/admin/pages"],["Mağaza ayarları","/admin/settings"]].map(x=><Link href={x[1]} key={x[0]}><span>{x[0]}</span><b>→</b></Link>)}</div></section>
 </div>
}
