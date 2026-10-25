"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown>;
const money = (value: unknown) => Number(value || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
const date = (value: unknown) => value ? new Date(String(value)).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "—";
const segment = (customer: Row) => Number(customer.lifetime_value) >= 2000 ? "VIP" : Number(customer.order_count) >= 2 ? "Sadık" : Number(customer.order_count) >= 1 ? "Müşteri" : "Yeni";
const statusNames: Record<string, string> = { draft: "Taslak", pending_payment: "Ödeme bekliyor", paid: "Ödendi", processing: "Hazırlanıyor", shipped: "Kargoda", delivered: "Teslim edildi", cancelled: "İptal", refunded: "İade edildi" };

function addressText(value: unknown) {
  const address = (value || {}) as Row;
  return [address.line1, address.line2, address.district, address.city, address.postal_code].filter(Boolean).join(", ");
}

export function AdminCustomerCenter() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [detailState, setDetailState] = useState("");
  const [state, setState] = useState("Müşteri verileri yükleniyor…");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/admin/operations?resource=customers", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Müşteriler yüklenemedi");
      setRows(data); setState(`${data.length} müşteri`);
    } catch (error) { setState(error instanceof Error ? error.message : "Müşteri verileri yüklenemedi"); }
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const shown = useMemo(() => rows.filter((customer) => {
    const text = `${customer.first_name || ""} ${customer.last_name || ""} ${customer.email || ""} ${customer.phone || ""} ${Array.isArray(customer.tags) ? customer.tags.join(" ") : ""}`.toLocaleLowerCase("tr-TR");
    const stateMatches = filter === "active" ? customer.active !== false : filter === "passive" ? customer.active === false : filter === "all" || segment(customer) === filter;
    return text.includes(query.toLocaleLowerCase("tr-TR")) && stateMatches;
  }), [rows, query, filter]);
  const total = rows.reduce((sum, customer) => sum + Number(customer.lifetime_value || 0), 0);
  const buyers = rows.filter((customer) => Number(customer.order_count) > 0).length;

  async function openCustomer(customer: Row) {
    setSelected(customer); setDetail(null); setDraft(null); setDetailState("Profil yükleniyor…");
    try {
      const response = await fetch(`/api/admin/operations?resource=customer_detail&id=${encodeURIComponent(String(customer.id))}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profil yüklenemedi");
      setDetail(data); setDraft({ ...data, tags_text: Array.isArray(data.tags) ? data.tags.join(", ") : "" }); setDetailState("");
    } catch (error) { setDetailState(error instanceof Error ? error.message : "Profil yüklenemedi"); }
  }
  function closeCustomer() { setSelected(null); setDetail(null); setDraft(null); setDetailState(""); }
  function patch(key: string, value: unknown) { setDraft((current) => current ? { ...current, [key]: value } : current); }
  async function saveCustomer() {
    if (!draft) return;
    setSaving(true); setDetailState("Kaydediliyor…");
    try {
      const response = await fetch("/api/admin/operations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, resource: "customer_profile", tags: String(draft.tags_text || "").split(",") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profil kaydedilemedi");
      await load(); await openCustomer({ ...draft, ...data }); setDetailState("Müşteri profili kaydedildi.");
    } catch (error) { setDetailState(error instanceof Error ? error.message : "Profil kaydedilemedi"); }
    finally { setSaving(false); }
  }
  function exportCsv() {
    const lines = [["Ad Soyad", "E-posta", "Telefon", "Sipariş", "Toplam Değer", "Segment", "Etiketler", "E-posta İzni", "SMS İzni", "Durum"], ...shown.map((customer) => [`${customer.first_name || ""} ${customer.last_name || ""}`, customer.email, customer.phone || "", customer.order_count, customer.lifetime_value, segment(customer), Array.isArray(customer.tags) ? customer.tags.join(" | ") : "", customer.email_marketing !== false ? "Evet" : "Hayır", customer.sms_marketing ? "Evet" : "Hayır", customer.active !== false ? "Aktif" : "Pasif"])].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob(["\ufeff" + lines], { type: "text/csv;charset=utf-8" })); anchor.download = `notisyon-musteriler-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(anchor.href);
  }

  const active = detail || selected;
  const orders = (detail?.orders || []) as Row[];
  const addresses = (detail?.addresses || []) as Row[];
  const loyalty = (detail?.loyalty || {}) as Row;
  return <div className="customer-center">
    <section className="customer-kpis">
      <article><span>TOPLAM MÜŞTERİ</span><b>{rows.length}</b><small>Kayıtlı müşteri profili</small></article>
      <article><span>SİPARİŞ VEREN</span><b>{buyers}</b><small>%{rows.length ? Math.round(buyers / rows.length * 100) : 0} aktif müşteri</small></article>
      <article><span>MÜŞTERİ DEĞERİ</span><b>{money(total)}</b><small>Toplam yaşam boyu değer</small></article>
      <article><span>ORTALAMA DEĞER</span><b>{money(rows.length ? total / rows.length : 0)}</b><small>Müşteri başına gelir</small></article>
    </section>
    <section className="customer-panel">
      <header><div><span>MÜŞTERİ VERİTABANI</span><h2>Müşteri merkezi</h2></div><button onClick={exportCsv}>↓ CSV dışa aktar</button></header>
      <div className="customer-toolbar"><label>⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad, e-posta, telefon veya etiket ara" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tüm müşteriler</option><option>VIP</option><option>Sadık</option><option>Müşteri</option><option>Yeni</option><option value="active">Aktif hesaplar</option><option value="passive">Pasif hesaplar</option></select><span>{state} · {shown.length} sonuç</span></div>
      <div className="customer-table">
        <header><span>Müşteri</span><span>İletişim</span><span>Segment</span><span>Sipariş</span><span>Toplam değer</span><span>Son hareket</span></header>
        {shown.map((customer) => <button key={String(customer.id)} onClick={() => void openCustomer(customer)}><span className="customer-name"><i>{String(customer.first_name || customer.email || "M").slice(0, 1).toUpperCase()}</i><span><b>{String(customer.first_name || "İsimsiz")} {String(customer.last_name || "")}</b><small>{String(customer.email || "")}</small></span></span><span>{String(customer.phone || "—")}</span><em className={segment(customer).toLocaleLowerCase("tr-TR")}>{segment(customer)}</em><strong>{String(customer.order_count || 0)}</strong><b>{money(customer.lifetime_value)}</b><span>{customer.last_order_at ? date(customer.last_order_at) : date(customer.created_at)}</span></button>)}
        {!shown.length && <p>Filtrelere uygun müşteri bulunamadı.</p>}
      </div>
    </section>
    {selected && active && <div className="customer-drawer-bg" onMouseDown={closeCustomer}><aside className="customer-drawer-wide" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span>MÜŞTERİ 360° PROFİLİ</span><h2>{String(active.first_name || "İsimsiz")} {String(active.last_name || "")}</h2></div><button onClick={closeCustomer} aria-label="Müşteri dosyasını kapat">×</button></header>
      <div className="customer-profile">
        <div className="customer-profile-head"><div className="profile-avatar">{String(active.first_name || active.email || "M").slice(0, 2).toUpperCase()}</div><div><em>{segment(active)} müşteri</em><p>{detailState || `${orders.length} sipariş · ${addresses.length} kayıtlı adres`}</p></div></div>
        <section className="customer-summary-cards"><article><span>Sipariş</span><b>{String(active.order_count || 0)}</b></article><article><span>Toplam değer</span><b>{money(active.lifetime_value)}</b></article><article><span>Son sipariş</span><b>{orders[0] ? date(orders[0].created_at) : "—"}</b></article><article><span>Sadakat puanı</span><b>{Number(loyalty.points || 0).toLocaleString("tr-TR")}</b></article></section>
        {draft && <section className="customer-edit-card"><div className="customer-section-title"><div><span>PROFİL VE İZİNLER</span><h3>Müşteri bilgileri</h3></div><label className="customer-active"><input type="checkbox" checked={draft.active !== false} onChange={(event) => patch("active", event.target.checked)} /> Aktif hesap</label></div><div className="customer-form-grid"><label>Ad<input value={String(draft.first_name || "")} onChange={(event) => patch("first_name", event.target.value)} /></label><label>Soyad<input value={String(draft.last_name || "")} onChange={(event) => patch("last_name", event.target.value)} /></label><label>E-posta<input type="email" value={String(draft.email || "")} onChange={(event) => patch("email", event.target.value)} /></label><label>Telefon<input value={String(draft.phone || "")} onChange={(event) => patch("phone", event.target.value)} /></label><label className="wide">Etiketler<input value={String(draft.tags_text || "")} onChange={(event) => patch("tags_text", event.target.value)} placeholder="VIP, kurumsal, toptan (virgülle ayırın)" /></label><label className="wide">Yönetici iç notu<textarea value={String(draft.internal_note || "")} onChange={(event) => patch("internal_note", event.target.value)} placeholder="Müşteriye gösterilmeyen CRM notu" /></label></div><div className="customer-consents"><label><input type="checkbox" checked={draft.email_marketing !== false} onChange={(event) => patch("email_marketing", event.target.checked)} /><span><b>E-posta izni</b><small>Kampanya ve duyuru e-postaları</small></span></label><label><input type="checkbox" checked={Boolean(draft.sms_marketing)} onChange={(event) => patch("sms_marketing", event.target.checked)} /><span><b>SMS izni</b><small>Kampanya ve işlem SMS bildirimleri</small></span></label></div></section>}
        <div className="customer-detail-grid"><section className="customer-detail-card"><h3>Profil özeti</h3><dl><div><dt>Kayıt tarihi</dt><dd>{date(active.created_at)}</dd></div><div><dt>Son güncelleme</dt><dd>{date(active.updated_at)}</dd></div><div><dt>Sadakat hareketi</dt><dd>{String(loyalty.transaction_count || 0)}</dd></div></dl></section><section className="customer-detail-card"><h3>Adres defteri</h3><div className="customer-address-list">{addresses.map((address) => <address key={String(address.id)}><b>{String(address.recipient_name || "Adres")}</b><span>{addressText(address) || "Adres bilgisi yok"}</span><small>{String(address.country_code || "TR")} · {String(address.phone || "Telefon yok")}</small></address>)}{!addresses.length && <p className="muted">Kayıtlı adres bulunmuyor.</p>}</div></section></div>
        <section className="customer-orders-card"><header><div><span>SİPARİŞ GEÇMİŞİ</span><h3>Müşterinin siparişleri</h3></div><b>{orders.length} kayıt</b></header><div className="customer-orders-table"><header><span>Sipariş</span><span>Tarih</span><span>Durum</span><span>Tutar</span><span /></header>{orders.map((order) => <div key={String(order.id)}><b>{String(order.order_number)}</b><span>{date(order.created_at)}</span><em>{statusNames[String(order.status)] || String(order.status)}</em><strong>{money(order.grand_total)}</strong><a href={`/admin/orders?order=${encodeURIComponent(String(order.id))}`}>Siparişe git →</a></div>)}{!orders.length && <p className="muted">Bu müşteriye ait sipariş bulunmuyor.</p>}</div></section>
      </div><div className="customer-drawer-actions"><a href={`mailto:${String(active.email || "")}`}>E-posta gönder</a><button className="secondary" onClick={closeCustomer}>Vazgeç</button><button disabled={!draft || saving} onClick={() => void saveCustomer()}>{saving ? "Kaydediliyor…" : "Profili kaydet"}</button></div>
    </aside></div>}
  </div>;
}
