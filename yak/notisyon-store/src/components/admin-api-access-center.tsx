"use client";

import { useEffect,useState } from "react";

type TokenItem={id:string;name:string;token_prefix:string;scopes:string[];active:boolean;expires_at:string|null;last_used_at:string|null;created_at:string};
const scopes=[
  ["catalog:read","Kataloğu oku","Ürün, varyasyon, fiyat ve stok verisini okur."],
  ["orders:read","Siparişleri oku","Sipariş ve satır bilgilerini okur."],
  ["orders:write","Siparişleri güncelle","Sipariş durumu ve operasyon bilgilerini günceller."],
  ["customers:read","Müşterileri oku","Müşteri verisine kontrollü erişim sağlar."],
  ["inventory:write","Stok güncelle","Harici sistemden stok hareketi işler."],
] as const;

export function AdminApiAccessCenter(){
  const [items,setItems]=useState<TokenItem[]>([]),[name,setName]=useState(""),[selected,setSelected]=useState<string[]>(["catalog:read"]),[expires,setExpires]=useState(""),[revealed,setRevealed]=useState(""),[message,setMessage]=useState("Yetki kodları yükleniyor…"),[busy,setBusy]=useState(false);
  async function load(){const response=await fetch("/api/admin/api-access",{cache:"no-store"}),data=await response.json();if(!response.ok)throw new Error(data.error||"Kayıtlar yüklenemedi.");setItems(data.items||[]);setMessage(`${data.items?.length||0} yetki kodu kayıtlı`);}
  useEffect(()=>{const timer=window.setTimeout(()=>{void load().catch(error=>setMessage(error.message));},0);return()=>window.clearTimeout(timer);},[]);
  function toggle(scope:string){setSelected(current=>current.includes(scope)?current.filter(item=>item!==scope):[...current,scope]);}
  async function create(){setBusy(true);setRevealed("");try{const response=await fetch("/api/admin/api-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,scopes:selected,expires_at:expires||null})}),data=await response.json();if(!response.ok)throw new Error(data.error);setRevealed(data.token);setName("");await load();setMessage("Yeni yetki kodu oluşturuldu. Anahtarı şimdi güvenli bir yere kaydedin.");}catch(error){setMessage(error instanceof Error?error.message:"Oluşturulamadı.");}finally{setBusy(false);}}
  async function revoke(item:TokenItem){if(!confirm(`“${item.name}” erişimi iptal edilsin mi?`))return;const response=await fetch(`/api/admin/api-access?id=${item.id}`,{method:"DELETE"}),data=await response.json();if(!response.ok)return setMessage(data.error||"İptal edilemedi.");await load();setMessage("Yetki kodu iptal edildi.");}
  const date=(value:string|null)=>value?new Date(value).toLocaleString("tr-TR"):"—";
  return <div className="api-access-center">
    <section className="api-access-intro"><div><span>GÜVENLİ ENTEGRASYON</span><h2>API ve WS yetki kodları</h2><p>ERP, muhasebe, pazar yeri ve özel uygulamalara yalnızca ihtiyaç duydukları kapsamları verin. Gizli anahtar sadece oluşturulduğu anda gösterilir.</p></div><aside><b>/api/v1/catalog</b><b>/api/v1/orders</b><small>Authorization: Bearer &lt;anahtar&gt;</small></aside></section>
    <section className="api-access-create"><header><div><span>YENİ ERİŞİM</span><h3>Yetki kodu oluştur</h3></div><small>{message}</small></header><div className="api-access-form"><label><span>Bağlantı adı</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="Örn. Muhasebe uygulaması"/></label><label><span>Son kullanma tarihi</span><input type="date" value={expires} onChange={event=>setExpires(event.target.value)}/><small>Boş bırakırsanız süresiz olur.</small></label></div><div className="api-scope-grid">{scopes.map(([value,label,description])=><button type="button" className={selected.includes(value)?"selected":""} onClick={()=>toggle(value)} key={value}><i>{selected.includes(value)?"✓":""}</i><span><b>{label}</b><small>{description}</small></span></button>)}</div><footer><button disabled={busy||!name.trim()||!selected.length} onClick={()=>void create()}>{busy?"Oluşturuluyor…":"Güvenli anahtar oluştur"}</button></footer></section>
    {revealed&&<section className="api-token-reveal"><div><b>Bu anahtar yalnızca bir kez gösterilir</b><p>Anahtarı şimdi kopyalayıp parola kasanızda saklayın.</p></div><code>{revealed}</code><button onClick={()=>void navigator.clipboard.writeText(revealed)}>Kopyala</button></section>}
    <section className="api-token-list"><header><span>Ad</span><span>Kapsamlar</span><span>Son kullanım</span><span>Geçerlilik</span><span>Eylem</span></header>{items.length?items.map(item=><article key={item.id} className={!item.active?"revoked":""}><div><b>{item.name}</b><code>{item.token_prefix}••••••••</code></div><span>{item.scopes.map(scope=><em key={scope}>{scope}</em>)}</span><span>{date(item.last_used_at)}</span><span><i className={item.active?"active":""}/>{item.active?(item.expires_at?date(item.expires_at):"Süresiz"):"İptal edildi"}</span><button disabled={!item.active} onClick={()=>void revoke(item)}>İptal et</button></article>):<p>Henüz API yetki kodu oluşturulmadı.</p>}</section>
  </div>;
}
