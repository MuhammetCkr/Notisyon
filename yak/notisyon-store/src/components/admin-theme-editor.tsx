"use client";
import { useEffect, useState } from "react";

export function AdminThemeEditor() {
  const [css,setCss]=useState(""); const [js,setJs]=useState(""); const [status,setStatus]=useState("Yükleniyor…");
  useEffect(()=>{fetch("/api/admin/theme").then(r=>r.json()).then(d=>{setCss(d.custom_css||"");setJs(d.custom_js||"");setStatus("Hazır")}).catch(()=>setStatus("Veritabanına bağlanılamadı"))},[]);
  async function save(){setStatus("Kaydediliyor…");const r=await fetch("/api/admin/theme",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({css,js})});setStatus(r.ok?"Kaydedildi — mağazada aktif":"Kaydetme başarısız");}
  return <section className="admin-theme" id="ozel-kod"><header><div><span>TEMA KODLARI</span><h2>Özel CSS ve JavaScript</h2></div><div><small>{status}</small><button onClick={save}>Kaydet ve yayınla</button></div></header><div className="admin-editors"><label><span>CSS</span><textarea value={css} onChange={e=>setCss(e.target.value)} spellCheck={false} placeholder="/* Özel stillerinizi buraya ekleyin */" /></label><label><span>JavaScript</span><textarea value={js} onChange={e=>setJs(e.target.value)} spellCheck={false} placeholder="// Özel JavaScript kodunuz" /></label></div><p>Buraya eklenen kodlar mağazanın tüm sayfalarında çalışır. Yalnızca güvendiğiniz kodları kullanın.</p></section>;
}
