"use client";

import { useEffect, useMemo, useState } from "react";

type EnvironmentCheck = { key: string; configured: boolean };
type Integration = {
  id: string; name: string; category: string; description: string; enabled: boolean; operational: boolean;
  credentialsReady: boolean; status: "operational" | "credentials_missing" | "ready_to_enable" | "setup_required";
  mode: "test" | "production"; account: string; endpoint: string; color: string;
  settings: Record<string, string | number | boolean>; requiredEnvironment: EnvironmentCheck[]; optionalEnvironment: EnvironmentCheck[];
};

const statusText: Record<Integration["status"], string> = { operational: "Çalışıyor", credentials_missing: "Bilgi bekleniyor", ready_to_enable: "Etkinleştirilebilir", setup_required: "Kurulum gerekli" };

export function AdminIntegrations() {
  const [items, setItems] = useState<Integration[]>([]);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [filter, setFilter] = useState("Tümü");
  const [message, setMessage] = useState("Bağlantılar kontrol ediliyor…");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/integrations", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Bağlantılar yüklenemedi");
    setItems(data.integrations || []);
    setMessage("Sunucu ve kimlik bilgisi kontrolleri güncel");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((error) => setMessage(error.message)); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function save() {
    if (!editing) return;
    setBusy(true); setMessage("Entegrasyon ayarları kaydediliyor…");
    try {
      const response = await fetch("/api/admin/integrations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kaydetme başarısız");
      await load(); setEditing(null); setMessage("Entegrasyon ayarları kaydedildi ve yeniden doğrulandı");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kaydetme başarısız"); }
    finally { setBusy(false); }
  }

  const categories = ["Tümü", ...Array.from(new Set(items.map((item) => item.category)))];
  const visible = useMemo(() => filter === "Tümü" ? items : items.filter((item) => item.category === filter), [items, filter]);
  const operational = items.filter((item) => item.operational).length;

  return <div className="integration-center">
    <section className="integration-summary-strip">
      <div><b>{operational}</b><span>çalışan bağlantı</span></div>
      <div><b>{items.filter((item) => item.credentialsReady && !item.enabled).length}</b><span>etkinleştirilebilir</span></div>
      <div><b>{items.filter((item) => !item.credentialsReady).length}</b><span>kimlik bilgisi bekliyor</span></div>
      <p>{message}</p>
    </section>
    <section className="integration-toolbar">
      <div>{categories.map((category) => <button type="button" key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div>
      <span>Gizli anahtarlar yalnızca sunucudaki .env.local dosyasında tutulur</span>
    </section>
    <section className="integration-cards">{visible.map((item) => <article key={item.id}>
      <header><div className={`integration-logo ${item.color}`}>{item.name.slice(0, 2).toUpperCase()}</div><div><span>{item.category}</span><h3>{item.name}</h3></div><em className={item.operational ? "connected" : item.credentialsReady ? "ready" : ""}>{statusText[item.status]}</em></header>
      <p>{item.description}</p>
      <dl><div><dt>Çalışma modu</dt><dd>{item.mode === "production" ? "Canlı" : "Test"}</dd></div><div><dt>Hesap</dt><dd>{item.account || "Tanımlanmadı"}</dd></div><div><dt>Bağlantı</dt><dd>{item.endpoint}</dd></div></dl>
      <div className="integration-requirements"><b>Canlı bağlantı kontrolü</b>{item.requiredEnvironment.length === 0 ? <span className="done">✓ Ek kimlik bilgisi gerekmiyor</span> : item.requiredEnvironment.map((field) => <span className={field.configured ? "done" : "missing"} key={field.key}>{field.configured ? "✓" : "!"} {field.key}</span>)}</div>
      <footer><button type="button" onClick={() => setEditing(item)}>Ayarları yönet</button><span>{item.operational ? "● Operasyonel" : item.credentialsReady ? "● Etkinleştirme bekliyor" : "○ Bilgiler girilince hazır"}</span></footer>
    </article>)}</section>

    {editing && <div className="integration-modal"><section>
      <header><div><span>{editing.category.toUpperCase()}</span><h2>{editing.name} yapılandırması</h2></div><button type="button" aria-label="Kapat" onClick={() => setEditing(null)}>×</button></header>
      <div>
        <label>Bağlantı durumu<button type="button" className={`premium-switch ${editing.enabled ? "on" : ""}`} onClick={() => setEditing({ ...editing, enabled: !editing.enabled })}><i/><b>{editing.enabled ? "Etkin" : "Kapalı"}</b></button></label>
        <label>Çalışma modu<select value={editing.mode} onChange={(event) => setEditing({ ...editing, mode: event.target.value as Integration["mode"] })}><option value="test">Test</option><option value="production">Canlı</option></select></label>
        <label className="wide">Hesap / mağaza kodu<input value={editing.account} onChange={(event) => setEditing({ ...editing, account: event.target.value })} placeholder="Sağlayıcı hesap veya müşteri kodu"/></label>
        <label className="wide">Webhook, API veya feed adresi<input value={editing.endpoint} onChange={(event) => setEditing({ ...editing, endpoint: event.target.value })}/></label>
        {editing.id === "hepsijet" && <><label>Etiket ölçüsü<select value={String(editing.settings.labelSize || "10x15")} onChange={(event) => setEditing({ ...editing, settings: { ...editing.settings, labelSize: event.target.value } })}><option>10x15</option><option>A4</option><option>A5</option></select></label><label>Gönderici şube<input value={String(editing.settings.senderBranch || "")} onChange={(event) => setEditing({ ...editing, settings: { ...editing.settings, senderBranch: event.target.value } })}/></label></>}
        {editing.id === "smtp" && <><label>Gönderici adı<input value={String(editing.settings.senderName || "")} onChange={(event) => setEditing({ ...editing, settings: { ...editing.settings, senderName: event.target.value } })}/></label><label>Yanıt adresi<input value={String(editing.settings.replyTo || "")} onChange={(event) => setEditing({ ...editing, settings: { ...editing.settings, replyTo: event.target.value } })}/></label></>}
        <div className="integration-security"><b>Sunucu kimlik bilgileri</b><p>Parola ve API anahtarları bu ekranda tutulmaz. Aşağıdaki değerleri <code>.env.local</code> dosyasına girdiğinizde durum otomatik olarak “Hazır” olur.</p><div>{editing.requiredEnvironment.length ? editing.requiredEnvironment.map((field) => <span className={field.configured ? "done" : "missing"} key={field.key}>{field.configured ? "✓ Tanımlı" : "Eksik"} — {field.key}</span>) : <span className="done">✓ Ek kimlik bilgisi gerekmiyor</span>}</div></div>
      </div>
      <footer><button type="button" className="secondary" onClick={() => setEditing(null)}>Vazgeç</button><button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Kaydediliyor…" : "Ayarları kaydet"}</button></footer>
    </section></div>}
  </div>;
}
