"use client";

import { useEffect, useState } from "react";
import type { SiteBlock } from "@/lib/block-store";

const blankBlock: Omit<SiteBlock, "id"> = { name: "Yeni HTML bloğu", page_path: "/", location: "page_top", html: "<section class=\"custom-section\">\n  <h2>Yeni içerik alanı</h2>\n  <p>İçeriğinizi buraya ekleyin.</p>\n</section>", css: ".custom-section { max-width: 1440px; margin: 0 auto; padding: 48px 32px; }", js: "", position: 0, active: false };

export function AdminBlockManager() {
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [selected, setSelected] = useState<SiteBlock | null>(null);
  const [status, setStatus] = useState("Yükleniyor…");

  useEffect(() => {
    fetch("/api/admin/blocks").then((response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<SiteBlock[]>;
    }).then((data) => {
      setBlocks(data); setSelected(data[0] || null); setStatus("Hazır");
    }).catch(() => setStatus("Veritabanına bağlanılamadı"));
  }, []);

  async function addBlock() {
    setStatus("Blok oluşturuluyor…");
    const response = await fetch("/api/admin/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blankBlock) });
    if (!response.ok) return setStatus("Blok oluşturulamadı");
    const block = await response.json() as SiteBlock; setBlocks((items) => [...items, block]); setSelected(block); setStatus("Yeni blok hazır");
  }

  async function save() {
    if (!selected) return;
    setStatus("Kaydediliyor…");
    const response = await fetch("/api/admin/blocks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
    if (!response.ok) return setStatus("Kaydetme başarısız");
    const saved = await response.json() as SiteBlock; setBlocks((items) => items.map((item) => item.id === saved.id ? saved : item)); setSelected(saved); setStatus(saved.active ? "Kaydedildi — mağazada aktif" : "Taslak kaydedildi");
  }

  async function remove() {
    if (!selected || !window.confirm(`“${selected.name}” bloğu silinsin mi?`)) return;
    const response = await fetch(`/api/admin/blocks?id=${selected.id}`, { method: "DELETE" });
    if (!response.ok) return setStatus("Silme başarısız");
    const remaining = blocks.filter((item) => item.id !== selected.id); setBlocks(remaining); setSelected(remaining[0] || null); setStatus("Blok silindi");
  }

  function change<K extends keyof SiteBlock>(key: K, value: SiteBlock[K]) { if (selected) setSelected({ ...selected, [key]: value }); }

  return <section className="admin-blocks" id="bloklar">
    <header><div><span>BLOK YÖNETİMİ</span><h2>HTML içerik blokları</h2><p>Sayfalara kaynak dosyalarını açmadan yeni içerik alanları ekleyin.</p></div><div><small>{status}</small><button onClick={addBlock}>+ Yeni blok</button></div></header>
    <div className="admin-block-workspace">
      <aside>{blocks.length ? blocks.map((block) => <button className={selected?.id === block.id ? "active" : ""} key={block.id} onClick={() => setSelected(block)}><span>{block.name}</span><small>{block.page_path === "*" ? "Tüm sayfalar" : block.page_path} · {block.active ? "Aktif" : "Taslak"}</small></button>) : <p>Henüz blok eklenmedi.</p>}</aside>
      {selected ? <div className="admin-block-editor">
        <div className="admin-block-fields"><label>Blok adı<input value={selected.name} onChange={(event) => change("name", event.target.value)} /></label><label>Sayfa<select value={selected.page_path} onChange={(event) => change("page_path", event.target.value)}><option value="/">Ana sayfa</option><option value="*">Tüm sayfalar</option><option value="/urunler">Tüm ürünler</option><option value="/ceyiz-defteri">Çeyiz Defteri</option><option value="/defter-31">Defterler</option><option value="/planlayici-32">Planlayıcılar</option></select></label><label>Konum<select value={selected.location} onChange={(event) => change("location", event.target.value as SiteBlock["location"])}><option value="page_top">Sayfa üstü</option><option value="page_bottom">Sayfa altı</option></select></label><label>Sıra<input min="0" type="number" value={selected.position} onChange={(event) => change("position", Number(event.target.value))} /></label><label className="admin-block-active"><input type="checkbox" checked={selected.active} onChange={(event) => change("active", event.target.checked)} /> Mağazada göster</label></div>
        <div className="admin-block-code"><label><span>HTML</span><textarea value={selected.html} onChange={(event) => change("html", event.target.value)} spellCheck={false}/></label><label><span>Bu bloğa özel CSS</span><textarea value={selected.css} onChange={(event) => change("css", event.target.value)} spellCheck={false}/></label><label><span>Bu bloğa özel JavaScript</span><textarea value={selected.js} onChange={(event) => change("js", event.target.value)} spellCheck={false}/></label></div>
        <div className="admin-block-actions"><button className="danger" onClick={remove}>Bloğu sil</button><a href={selected.page_path === "*" ? "/" : selected.page_path} target="_blank">Sayfada önizle ↗</a><button onClick={save}>Kaydet ve yayınla</button></div>
      </div> : <div className="admin-block-empty"><strong>Yeni bir HTML bloğu oluşturun</strong><p>Bloklar sayfaya göre yayınlanır ve istediğiniz zaman pasif hale getirilebilir.</p><button onClick={addBlock}>İlk bloğu oluştur</button></div>}
    </div>
  </section>;
}
