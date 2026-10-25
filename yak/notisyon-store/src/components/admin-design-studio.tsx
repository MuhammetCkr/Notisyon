/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AdminThemeEditor } from "@/components/admin-theme-editor";
import { DEFAULT_DESIGN_CONFIG, type DesignConfig, type DesignMenuItem, type FooterColumn, type HomeSection } from "@/lib/design-config";
import { applyDesignTemplate, escapeDesignValue, FOOTER_SOURCE_CSS, FOOTER_SOURCE_TEMPLATE, HEADER_SOURCE_CSS, HEADER_SOURCE_TEMPLATE, PRODUCT_CARD_SOURCE_CSS, PRODUCT_CARD_SOURCE_TEMPLATE } from "@/lib/design-template";

export type DesignStudioTab = "identity" | "header" | "footer" | "cards" | "home" | "code";

const cloneDefault = () => structuredClone(DEFAULT_DESIGN_CONFIG);
const api = async (options?: RequestInit) => {
  const response = await fetch("/api/admin/operations?resource=settings", { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "İşlem başarısız");
  return data as Record<string, unknown>;
};

export function AdminDesignStudio({ initialTab = "identity" }: { initialTab?: DesignStudioTab }) {
  const [config, setConfig] = useState<DesignConfig>(cloneDefault);
  const [status, setStatus] = useState("Tasarım ayarları yükleniyor…");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void api().then((all) => {
      const stored = all.design_config as Partial<DesignConfig> | undefined;
      setConfig(mergeClient(stored));
      setStatus("Tasarım stüdyosu hazır");
    }).catch((error: Error) => setStatus(error.message));
  }, []);
  function update(next: DesignConfig) { setConfig(next); setDirty(true); }
  async function save() {
    setStatus("Tasarım yayınlanıyor…");
    try {
      await api({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "settings", key: "design_config", value: config }) });
      setDirty(false); setStatus("Kaydedildi — vitrin ayarları yayında");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Kaydetme başarısız"); }
  }

  return <section className="design-studio">
    <header className="design-studio-toolbar"><div><span className={dirty ? "dirty" : ""}/><p>{dirty ? "Kaydedilmemiş değişiklikler var" : status}</p></div><div><a href="/" target="_blank">Mağazayı görüntüle ↗</a><button className={dirty ? "dirty" : ""} disabled={!dirty} onClick={() => void save()}>{dirty ? "Kaydet ve yayınla" : "Değişiklik yok"}</button></div></header>
    <div className="design-studio-layout">
      <main className="design-studio-main">
        {initialTab === "identity" && <IdentityEditor value={config} set={update} />}
        {initialTab === "header" && <><SourceCodeWorkspace value={config} set={update} tab="header"/><details className="design-extra-settings"><summary><span><b>Menü ve davranış ayarları</b><small>Menü bağlantıları, duyuru bandı ve header seçenekleri</small></span><em>⌄</em></summary><div><HeaderEditor value={config} set={update}/></div></details></>}
        {initialTab === "footer" && <><SourceCodeWorkspace value={config} set={update} tab="footer"/><details className="design-extra-settings"><summary><span><b>Footer içerik ayarları</b><small>İletişim bilgileri, bağlantı kolonları ve e-bülten</small></span><em>⌄</em></summary><div><FooterEditor value={config} set={update}/></div></details></>}
        {initialTab === "cards" && <><SourceCodeWorkspace value={config} set={update} tab="cards"/><details className="design-extra-settings"><summary><span><b>Ürün kartı ayarları</b><small>Kolon, görsel oranı, rozet ve sepete ekleme davranışı</small></span><em>⌄</em></summary><div><CardEditor value={config} set={update}/></div></details></>}
        {initialTab === "home" && <HomeEditor value={config} set={update} />}
        {initialTab === "code" && <><AdvancedEditor/><AdminThemeEditor/></>}
      </main>
    </div>
  </section>;
}

function IdentityEditor({ value, set }: EditorProps) {
  const brand = value.brand;
  const patch = (next: Partial<typeof brand>) => set({ ...value, brand: { ...brand, ...next } });
  return <EditorCard eyebrow="MARKA KİMLİĞİ" title="Logo, ikon ve tasarım sistemi" copy="Yüklediğiniz dosyalar mağazanın header, footer ve tarayıcı sekmesinde kullanılır.">
    <div className="design-asset-grid"><AssetField label="Mağaza logosu" value={brand.logoUrl} preview="logo" onChange={(logoUrl) => patch({ logoUrl })}/><AssetField label="Favicon" value={brand.faviconUrl} preview="favicon" onChange={(faviconUrl) => patch({ faviconUrl })}/></div>
    <div className="design-form-grid"><Field label="Logo alternatif metni" value={brand.logoAlt} onChange={(logoAlt) => patch({ logoAlt })}/><Field label="İçerik genişliği" type="number" suffix="px" value={brand.contentWidth} onChange={(contentWidth) => patch({ contentWidth: Number(contentWidth) })}/><ColorField label="Kurumsal koyu renk" value={brand.primaryColor} onChange={(primaryColor) => patch({ primaryColor })}/><ColorField label="Vurgu rengi" value={brand.accentColor} onChange={(accentColor) => patch({ accentColor })}/><ColorField label="Sayfa arka planı" value={brand.pageBackground} onChange={(pageBackground) => patch({ pageBackground })}/><label>Yazı ailesi<select value={brand.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })}><option value="Arial, sans-serif">Arial — sade</option><option value="Inter, Arial, sans-serif">Inter — modern</option><option value="Georgia, serif">Georgia — editoryal</option><option value="system-ui, sans-serif">Sistem yazı tipi</option></select></label></div>
  </EditorCard>;
}

function HeaderEditor({ value, set }: EditorProps) {
  const header = value.header, announcement = value.announcement;
  const patchHeader = (next: Partial<typeof header>) => set({ ...value, header: { ...header, ...next } });
  const patchAnnouncement = (next: Partial<typeof announcement>) => set({ ...value, announcement: { ...announcement, ...next } });
  const patchMenu = (id: string, next: Partial<DesignMenuItem>) => patchHeader({ menu: header.menu.map((item) => item.id === id ? { ...item, ...next } : item) });
  const move = (index: number, direction: number) => { const menu = [...header.menu], target = index + direction; if (target < 0 || target >= menu.length) return; [menu[index], menu[target]] = [menu[target], menu[index]]; patchHeader({ menu }); };
  return <><EditorCard eyebrow="HEADER AYARLARI" title="Duyuru ve üst navigasyon" copy="Masaüstü ve mobil header davranışını, görünür öğeleri ve duyuru bandını yönetin.">
    <div className="design-form-grid"><label>Header düzeni<select value={header.layout} onChange={(event) => patchHeader({ layout: event.target.value as typeof header.layout })}><option value="logo_left">Logo solda</option><option value="centered">Logo ortada</option><option value="compact">Kompakt</option></select></label><Toggle label="Sayfada sabit kalsın" checked={header.sticky} onChange={(sticky) => patchHeader({ sticky })}/><Toggle label="Hesabım bağlantısı" checked={header.showAccount} onChange={(showAccount) => patchHeader({ showAccount })}/><Toggle label="Sepeti göster" checked={header.showCart} onChange={(showCart) => patchHeader({ showCart })}/></div>
    <div className="design-subcard"><header><div><b>Duyuru bandı</b><small>Kargo veya kampanya mesajı</small></div><Toggle label="Aktif" checked={announcement.enabled} onChange={(enabled) => patchAnnouncement({ enabled })}/></header><div className="design-form-grid"><Field label="Duyuru metni" value={announcement.text} onChange={(text) => patchAnnouncement({ text })}/><Field label="Bağlantı" value={announcement.href} placeholder="/kampanyalar" onChange={(href) => patchAnnouncement({ href })}/><ColorField label="Arka plan" value={announcement.background} onChange={(background) => patchAnnouncement({ background })}/><ColorField label="Yazı rengi" value={announcement.color} onChange={(color) => patchAnnouncement({ color })}/></div></div>
  </EditorCard><EditorCard eyebrow="MENÜ YÖNETİMİ" title="Ana menü bağlantıları" copy="Bağlantıları sıralayın, gizleyin veya yeni menü öğeleri oluşturun."><div className="design-repeat-list">{header.menu.map((item, index) => <div className="design-menu-row" key={item.id}><span className="drag-handle">⋮⋮</span><input aria-label="Menü adı" value={item.label} onChange={(event) => patchMenu(item.id, { label: event.target.value })}/><input aria-label="Menü bağlantısı" value={item.href} onChange={(event) => patchMenu(item.id, { href: event.target.value })}/><Toggle label="Göster" checked={item.visible} onChange={(visible) => patchMenu(item.id, { visible })}/><span className="row-buttons"><button onClick={() => move(index, -1)}>↑</button><button onClick={() => move(index, 1)}>↓</button><button className="danger" onClick={() => patchHeader({ menu: header.menu.filter((entry) => entry.id !== item.id) })}>×</button></span></div>)}</div><button className="outline-add" onClick={() => patchHeader({ menu: [...header.menu, { id: crypto.randomUUID(), label: "Yeni menü", href: "/", visible: true }] })}>＋ Menü bağlantısı ekle</button></EditorCard></>;
}

function FooterEditor({ value, set }: EditorProps) {
  const footer = value.footer;
  const patch = (next: Partial<typeof footer>) => set({ ...value, footer: { ...footer, ...next } });
  const patchColumn = (id: string, next: Partial<FooterColumn>) => patch({ columns: footer.columns.map((column) => column.id === id ? { ...column, ...next } : column) });
  return <><EditorCard eyebrow="FOOTER YAPISI" title="Bülten, iletişim ve sosyal kanallar" copy="Alt alan içeriğini ve müşteri iletişim noktalarını güncelleyin."><div className="design-form-grid"><Toggle label="E-bülten alanı" checked={footer.newsletterEnabled} onChange={(newsletterEnabled) => patch({ newsletterEnabled })}/><Field label="Bülten başlığı" value={footer.newsletterTitle} onChange={(newsletterTitle) => patch({ newsletterTitle })}/><Field label="Bülten açıklaması" value={footer.newsletterText} onChange={(newsletterText) => patch({ newsletterText })}/><Field label="Instagram adresi" value={footer.instagramUrl} onChange={(instagramUrl) => patch({ instagramUrl })}/><Field label="WhatsApp numarası" value={footer.whatsapp} onChange={(whatsapp) => patch({ whatsapp })}/><Field label="E-posta" value={footer.email} onChange={(email) => patch({ email })}/><Field label="Telefon" value={footer.phone} onChange={(phone) => patch({ phone })}/><Field label="Adres" value={footer.address} onChange={(address) => patch({ address })}/><Field label="Telif metni" value={footer.copyright} onChange={(copyright) => patch({ copyright })}/></div></EditorCard>
    <EditorCard eyebrow="FOOTER MENÜLERİ" title="Bağlantı kolonları" copy="Kurumsal, kategori ve yardım kolonlarını ayrı ayrı yönetin."><div className="footer-column-editor">{footer.columns.map((column) => <section key={column.id}><header><input value={column.title} onChange={(event) => patchColumn(column.id, { title: event.target.value })}/><button className="danger" onClick={() => patch({ columns: footer.columns.filter((entry) => entry.id !== column.id) })}>Kolonu sil</button></header>{column.links.map((link) => <div key={link.id}><input value={link.label} onChange={(event) => patchColumn(column.id, { links: column.links.map((entry) => entry.id === link.id ? { ...entry, label: event.target.value } : entry) })}/><input value={link.href} onChange={(event) => patchColumn(column.id, { links: column.links.map((entry) => entry.id === link.id ? { ...entry, href: event.target.value } : entry) })}/><button onClick={() => patchColumn(column.id, { links: column.links.filter((entry) => entry.id !== link.id) })}>×</button></div>)}<button className="outline-add" onClick={() => patchColumn(column.id, { links: [...column.links, { id: crypto.randomUUID(), label: "Yeni bağlantı", href: "/" }] })}>＋ Bağlantı ekle</button></section>)}</div><button className="outline-add" onClick={() => patch({ columns: [...footer.columns, { id: crypto.randomUUID(), title: "Yeni kolon", links: [] }] })}>＋ Footer kolonu ekle</button></EditorCard></>;
}

function CardEditor({ value, set }: EditorProps) {
  const card = value.productCard, patch = (next: Partial<typeof card>) => set({ ...value, productCard: { ...card, ...next } });
  return <EditorCard eyebrow="ÜRÜN KARTI TASARIMI" title="Listeleme kartlarının görünümü" copy="Kategori, arama ve ana sayfa ürün bloklarında ortak kart dilini belirleyin."><div className="card-style-picker">{(["minimal", "bordered", "elevated"] as const).map((style) => <button className={card.style === style ? "active" : ""} key={style} onClick={() => patch({ style })}><i className={`card-miniature ${style}`}><span/><b/><small/></i><strong>{style === "minimal" ? "Minimal" : style === "bordered" ? "Çerçeveli" : "Gölgeli"}</strong></button>)}</div><div className="design-form-grid"><label>Görsel oranı<select value={card.imageRatio} onChange={(event) => patch({ imageRatio: event.target.value as typeof card.imageRatio })}><option value="square">Kare 1:1</option><option value="portrait">Dikey 4:5</option><option value="landscape">Yatay 4:3</option></select></label><Field label="Masaüstü kolon" type="number" value={card.desktopColumns} onChange={(desktopColumns) => patch({ desktopColumns: Math.min(6, Math.max(2, Number(desktopColumns))) })}/><Field label="Mobil kolon" type="number" value={card.mobileColumns} onChange={(mobileColumns) => patch({ mobileColumns: Math.min(2, Math.max(1, Number(mobileColumns))) })}/><Field label="Buton metni" value={card.buttonLabel} onChange={(buttonLabel) => patch({ buttonLabel })}/><Toggle label="Markayı göster" checked={card.showBrand} onChange={(showBrand) => patch({ showBrand })}/><Toggle label="Kampanya rozetleri" checked={card.showBadges} onChange={(showBadges) => patch({ showBadges })}/><Toggle label="Karşılaştırma fiyatı" checked={card.showComparePrice} onChange={(showComparePrice) => patch({ showComparePrice })}/><Toggle label="Hızlı sepete ekle" checked={card.quickAdd} onChange={(quickAdd) => patch({ quickAdd })}/></div></EditorCard>;
}

function HomeEditor({ value, set }: EditorProps) {
  const home = value.home, patch = (next: Partial<typeof home>) => set({ ...value, home: { ...home, ...next } });
  const patchSection = (id: string, next: Partial<HomeSection>) => patch({ sections: home.sections.map((section) => section.id === id ? { ...section, ...next } : section) });
  const move = (index: number, direction: number) => { const sections = [...home.sections], target = index + direction; if (target < 0 || target >= sections.length) return; [sections[index], sections[target]] = [sections[target], sections[index]]; patch({ sections }); };
  function add(type: HomeSection["type"]) { const names = { hero_slider: "Yeni slider", product_carousel: "Ürün vitrini", category_grid: "Kategori vitrini", banner: "Kampanya bannerı", rich_text: "İçerik alanı" }; const section: HomeSection = { id: crypto.randomUUID(), type, title: names[type], subtitle: "", active: true, background: "#ffffff", productSource: "featured", productLimit: 4, buttonLabel: "İncele", buttonHref: "/urunler", html: "<h2>Yeni içerik alanı</h2><p>Metninizi buraya ekleyin.</p>", slides: type === "hero_slider" ? [{ id: crypto.randomUUID(), eyebrow: "YENİ KOLEKSİYON", title: "Yeni sezonu keşfedin.", description: "Koleksiyon açıklaması", imageUrl: "", buttonLabel: "İncele", buttonHref: "/urunler" }] : undefined }; patch({ sections: [...home.sections, section] }); }
  return <EditorCard eyebrow="SAYFA OLUŞTURUCU" title="Ana sayfa blokları" copy="Slider, ürün vitrini, banner, kategori ve metin alanlarını ekleyip sıralayın." action={<Toggle label="Yönetilen tasarım aktif" checked={home.replaceLegacy} onChange={(replaceLegacy) => patch({ replaceLegacy })}/>}><div className="section-add-bar"><button onClick={() => add("hero_slider")}>＋ Slider</button><button onClick={() => add("product_carousel")}>＋ Ürün vitrini</button><button onClick={() => add("category_grid")}>＋ Kategoriler</button><button onClick={() => add("banner")}>＋ Banner</button><button onClick={() => add("rich_text")}>＋ Metin alanı</button></div><div className="home-section-list">{home.sections.map((section, index) => <details open={index === 0} key={section.id}><summary><span className="section-type">{sectionLabel(section.type)}</span><b>{section.title}</b><em>{section.active ? "Yayında" : "Gizli"}</em><span className="section-actions"><button onClick={(event) => { event.preventDefault(); move(index, -1); }}>↑</button><button onClick={(event) => { event.preventDefault(); move(index, 1); }}>↓</button></span></summary><div className="section-editor"><div className="design-form-grid"><Field label="Blok başlığı" value={section.title} onChange={(title) => patchSection(section.id, { title })}/><Field label="Alt açıklama" value={section.subtitle} onChange={(subtitle) => patchSection(section.id, { subtitle })}/><ColorField label="Arka plan" value={section.background} onChange={(background) => patchSection(section.id, { background })}/><Toggle label="Mağazada göster" checked={section.active} onChange={(active) => patchSection(section.id, { active })}/></div>{section.type === "hero_slider" && <SlideEditor section={section} patch={(next) => patchSection(section.id, next)}/>} {section.type === "product_carousel" && <div className="design-form-grid"><label>Ürün kaynağı<select value={section.productSource} onChange={(event) => patchSection(section.id, { productSource: event.target.value as HomeSection["productSource"] })}><option value="featured">Öne çıkanlar</option><option value="new">Yeni ürünler</option><option value="deal">Fırsat ürünleri</option><option value="all">Tüm ürünler</option></select></label><Field label="Ürün adedi" type="number" value={section.productLimit || 4} onChange={(productLimit) => patchSection(section.id, { productLimit: Number(productLimit) })}/></div>}{section.type === "banner" && <div className="design-form-grid"><AssetField label="Banner görseli" value={section.imageUrl || ""} preview="banner" onChange={(imageUrl) => patchSection(section.id, { imageUrl })}/><Field label="Buton metni" value={section.buttonLabel || ""} onChange={(buttonLabel) => patchSection(section.id, { buttonLabel })}/><Field label="Buton bağlantısı" value={section.buttonHref || ""} onChange={(buttonHref) => patchSection(section.id, { buttonHref })}/></div>}{section.type === "rich_text" && <label className="full-field">İçerik HTML<textarea rows={8} value={section.html || ""} onChange={(event) => patchSection(section.id, { html: event.target.value })}/></label>}<footer><button className="danger" onClick={() => patch({ sections: home.sections.filter((entry) => entry.id !== section.id) })}>Bloğu kaldır</button></footer></div></details>)}</div></EditorCard>;
}

function SlideEditor({ section, patch }: { section: HomeSection; patch: (value: Partial<HomeSection>) => void }) {
  const slides = section.slides || [];
  const patchSlide = (id: string, next: Partial<(typeof slides)[number]>) => patch({ slides: slides.map((slide) => slide.id === id ? { ...slide, ...next } : slide) });
  return <div className="slide-editor"><h4>Slider sayfaları</h4>{slides.map((slide, index) => <section key={slide.id}><header><b>Slayt {index + 1}</b><button className="danger" onClick={() => patch({ slides: slides.filter((entry) => entry.id !== slide.id) })}>Kaldır</button></header><div className="design-form-grid"><Field label="Üst başlık" value={slide.eyebrow} onChange={(eyebrow) => patchSlide(slide.id, { eyebrow })}/><Field label="Ana başlık" value={slide.title} onChange={(title) => patchSlide(slide.id, { title })}/><Field label="Açıklama" value={slide.description} onChange={(description) => patchSlide(slide.id, { description })}/><AssetField label="Arka plan görseli" value={slide.imageUrl} preview="banner" onChange={(imageUrl) => patchSlide(slide.id, { imageUrl })}/><Field label="Buton metni" value={slide.buttonLabel} onChange={(buttonLabel) => patchSlide(slide.id, { buttonLabel })}/><Field label="Buton bağlantısı" value={slide.buttonHref} onChange={(buttonHref) => patchSlide(slide.id, { buttonHref })}/></div></section>)}<button className="outline-add" onClick={() => patch({ slides: [...slides, { id: crypto.randomUUID(), eyebrow: "YENİ", title: "Yeni slayt", description: "", imageUrl: "", buttonLabel: "İncele", buttonHref: "/urunler" }] })}>＋ Slayt ekle</button></div>;
}

function AdvancedEditor() { return <div className="design-advanced"><div><span>GELİŞMİŞ AYARLAR</span><h3>Mağaza geneli özel kod</h3><p>Bu bölümdeki CSS ve JavaScript bütün mağaza sayfalarına uygulanır. Header, footer veya ürün kartına özel kodlar için ilgili tasarım sekmesini kullanın.</p></div></div>; }

function SourceCodeWorkspace({ value, set, tab }: EditorProps & { tab: "header" | "footer" | "cards" }) {
  const settings = tab === "header" ? value.header : tab === "footer" ? value.footer : value.productCard;
  const templates = tab === "header" ? [HEADER_SOURCE_TEMPLATE, HEADER_SOURCE_CSS] : tab === "footer" ? [FOOTER_SOURCE_TEMPLATE, FOOTER_SOURCE_CSS] : [PRODUCT_CARD_SOURCE_TEMPLATE, PRODUCT_CARD_SOURCE_CSS];
  const tokens = tab === "header" ? ["logo_url", "logo_alt", "announcement_text", "menu_html", "account_url", "cart_url"] : tab === "footer" ? ["logo_url", "logo_alt", "footer_columns_html", "email", "phone", "address", "copyright", "newsletter_title", "newsletter_text", "whatsapp_url"] : ["product_url", "image_url", "product_name", "brand", "price", "badge", "sku", "stock", "button_label"];
  const labels = { header: "Header tasarımı", footer: "Footer tasarımı", cards: "Ürün kartı tasarımı" };
  const copies = { header: "Logo, menü ve sağ aksiyon alanlarını görerek düzenleyin. İsterseniz Kaynak düğmesiyle HTML görünümüne geçin.", footer: "Footer içeriğini görerek düzenleyin. Metin, bağlantı, görsel ve tablo araçlarının tamamı elinizin altında.", cards: "Ürün kartını görsel olarak düzenleyin; gerektiğinde HTML kaynağına tek tuşla geçin." };

  function patch(next: { sourceMode?: boolean; customHtml?: string; customCss?: string }) {
    if (tab === "header") set({ ...value, header: { ...value.header, ...next } });
    else if (tab === "footer") set({ ...value, footer: { ...value.footer, ...next } });
    else set({ ...value, productCard: { ...value.productCard, ...next } });
  }
  const htmlValue = settings.customHtml || templates[0];
  const menuHtml = value.header.menu.filter((item) => item.visible).map((item) => `<a href="${escapeDesignValue(item.href)}">${escapeDesignValue(item.label)}</a>`).join("");
  const footerColumnsHtml = value.footer.columns.map((column) => `<section class="custom-footer-column"><h3>${escapeDesignValue(column.title)}</h3>${column.links.map((link) => `<a href="${escapeDesignValue(link.href)}">${escapeDesignValue(link.label)}</a>`).join("")}</section>`).join("");
  const previewHtml = applyDesignTemplate(htmlValue, {
    logo_url: value.brand.logoUrl,
    logo_alt: value.brand.logoAlt,
    menu_html: menuHtml,
    account_url: "/hesabim",
    cart_url: "/sepet",
    footer_columns_html: footerColumnsHtml,
    email: value.footer.email,
    phone: value.footer.phone,
    address: value.footer.address,
    copyright: value.footer.copyright,
    whatsapp_url: `https://wa.me/${value.footer.whatsapp.replace(/\D/g, "")}`,
    product_url: "/urun/ornek-urun",
    image_url: "/file.svg",
    product_name: "Örnek ürün başlığı",
    brand: "NOTİSYON",
    price: "249,90 TL",
    badge: "Yeni",
    sku: "NTS-001",
    stock: "25",
    button_label: value.productCard.buttonLabel,
  }, ["menu_html", "footer_columns_html"]);
  function changeHtml(customHtml: string) { patch({ customHtml, customCss: settings.customCss || templates[1], sourceMode: Boolean(customHtml.trim()) }); }

  return <EditorCard eyebrow="TASARIM EDİTÖRÜ" title={labels[tab]} copy={copies[tab]} action={<span className={settings.sourceMode ? "html-design-status active" : "html-design-status"}>{settings.sourceMode ? "Özel tasarım yayında" : "Standart tasarım"}</span>}>
    <div className="html-design-toolbar"><label>Tasarım yedeği<select><option>Güncel tasarım</option></select></label><div><button type="button" onClick={() => patch({ sourceMode: true, customHtml: templates[0], customCss: templates[1] })}>Hazır tasarımı yükle</button>{settings.sourceMode && <button className="secondary" type="button" onClick={() => patch({ sourceMode: false })}>Standart tasarıma dön</button>}</div></div>
    <RichHtmlEditor value={htmlValue} previewValue={previewHtml} previewCss={settings.customCss || templates[1]} onChange={changeHtml}/>
    <details className="html-variable-help"><summary>Kullanılabilir dinamik alanlar <span>Göster</span></summary><div className="source-token-list">{tokens.map((token) => <button type="button" key={token} onClick={() => changeHtml(`${htmlValue}{{${token}}}`)}>{`{{${token}}}`}</button>)}</div></details>
    <p className="html-editor-hint">HTML yeterliyse başka bir alan doldurmanız gerekmez. Genel stil eklemek isterseniz sol menüdeki <b>Gelişmiş</b> bölümünü kullanabilirsiniz.{tab === "cards" ? <> Sepete ekleme düğmesinde <code>data-add-to-cart</code> niteliğini koruyun.</> : null}</p>
  </EditorCard>;
}

function RichHtmlEditor({ value, previewValue, previewCss, onChange }: { value: string; previewValue: string; previewCss: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceView, setSourceView] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
    const safePreview = sanitizeEditorPreview(previewValue);
    if (!sourceView && editorRef.current && editorRef.current.innerHTML !== safePreview) editorRef.current.innerHTML = safePreview;
  }, [value, previewValue, sourceView]);

  function commit(next: string) { setDraft(next); onChange(next); }
  function command(name: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    if (editorRef.current) commit(editorRef.current.innerHTML);
  }
  function promptCommand(name: "createLink" | "insertImage", label: string) {
    const result = window.prompt(label, "https://");
    if (result) command(name, result);
  }
  function toggleSource() {
    setSourceView((current) => !current);
  }

  const button = (label: string, commandName: string, title: string, commandValue?: string) => <button type="button" title={title} onMouseDown={(event) => { event.preventDefault(); command(commandName, commandValue); }}>{label}</button>;
  return <section className="rich-html-editor">
    <style>{previewCss}</style>
    <div className="rich-editor-toolbar" aria-label="Metin düzenleme araçları">
      <div className="rich-tool-group text-tools">{button("B", "bold", "Kalın")}{button("I", "italic", "İtalik")}{button("U", "underline", "Altı çizili")}{button("S", "strikeThrough", "Üstü çizili")}{button("x₂", "subscript", "Alt simge")}{button("x²", "superscript", "Üst simge")}{button("⌫", "removeFormat", "Biçimi temizle")}</div>
      <div className="rich-tool-group selects"><select aria-label="Paragraf biçimi" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}><option value="p">Biçem</option><option value="h2">Başlık 2</option><option value="h3">Başlık 3</option><option value="blockquote">Alıntı</option><option value="p">Paragraf</option></select><select aria-label="Yazı tipi" defaultValue="Arial" onChange={(event) => command("fontName", event.target.value)}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option></select><select aria-label="Yazı boyutu" defaultValue="3" onChange={(event) => command("fontSize", event.target.value)}><option value="2">Küçük</option><option value="3">Normal</option><option value="4">Büyük</option><option value="5">Çok büyük</option></select></div>
      <span className="rich-toolbar-break" aria-hidden="true"/>
      <div className="rich-tool-group">{button("A̲", "foreColor", "Yazı rengi", "#17243b")}{button("A▣", "backColor", "Arka plan rengi", "#fff2a8")}{button("1.", "insertOrderedList", "Numaralı liste")}{button("•", "insertUnorderedList", "Madde işaretli liste")}{button("⇤", "outdent", "Girintiyi azalt")}{button("⇥", "indent", "Girintiyi artır")}{button("❝", "formatBlock", "Alıntı", "blockquote")}</div>
      <div className="rich-tool-group">{button("≡", "justifyLeft", "Sola hizala")}{button("≣", "justifyCenter", "Ortala")}{button("≡", "justifyRight", "Sağa hizala")}{button("☰", "justifyFull", "İki yana yasla")}{button("↶", "undo", "Geri al")}{button("↷", "redo", "Yinele")}</div>
      <div className="rich-tool-group"><button type="button" title="Bağlantı ekle" onMouseDown={(event) => { event.preventDefault(); promptCommand("createLink", "Bağlantı adresini girin"); }}>🔗</button>{button("⛓̸", "unlink", "Bağlantıyı kaldır")}<button type="button" title="Görsel ekle" onMouseDown={(event) => { event.preventDefault(); promptCommand("insertImage", "Görsel adresini girin"); }}>▧</button><button type="button" title="Tablo ekle" onMouseDown={(event) => { event.preventDefault(); command("insertHTML", "<table><tbody><tr><td>Hücre 1</td><td>Hücre 2</td></tr><tr><td>Hücre 3</td><td>Hücre 4</td></tr></tbody></table>"); }}>▦</button></div>
      <button type="button" className={`source-toggle ${sourceView ? "active" : ""}`} onClick={toggleSource}>〈/〉 Kaynak</button>
    </div>
    {sourceView ? <textarea className="rich-source-editor" spellCheck={false} value={draft} onChange={(event) => commit(event.target.value)} aria-label="HTML kaynak kodu"/> : <div ref={editorRef} className="rich-editor-canvas" contentEditable suppressContentEditableWarning onClick={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }} onInput={(event) => commit(event.currentTarget.innerHTML)} aria-label="Görsel tasarım alanı"/>}
  </section>;
}

function sanitizeEditorPreview(html: string) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelectorAll("script,iframe,object,embed,link,meta").forEach((node) => node.remove());
  documentNode.body.querySelectorAll("*").forEach((node) => [...node.attributes].forEach((attribute) => {
    if (attribute.name.toLowerCase().startsWith("on")) node.removeAttribute(attribute.name);
  }));
  return documentNode.body.innerHTML;
}

function AssetField({ label, value, onChange, preview }: { label: string; value: string; onChange: (value: string) => void; preview: "logo" | "favicon" | "banner" }) {
  const [uploading, setUploading] = useState(false);
  async function upload(file?: File) { if (!file) return; setUploading(true); const data = new FormData(); data.append("files", file); data.append("folder", "theme"); try { const response = await fetch("/api/admin/uploads", { method: "POST", body: data }), body = await response.json(); if (!response.ok) throw new Error(body.error); onChange(body.urls[0]); } finally { setUploading(false); } }
  return <div className={`asset-field ${preview}`}><span>{label}</span><div className="asset-preview">{value ? <img src={value} alt=""/> : <b>Görsel yok</b>}</div><input aria-label={`${label} adresi`} value={value} placeholder="Görsel adresi" onChange={(event) => onChange(event.target.value)}/><label className="asset-upload">{uploading ? "Yükleniyor…" : "Bilgisayardan yükle"}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/x-icon" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])}/></label></div>;
}

function EditorCard({ eyebrow, title, copy, action, children }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="design-editor-card"><header><div><span>{eyebrow}</span><h3>{title}</h3><p>{copy}</p></div>{action}</header><div className="design-editor-body">{children}</div></section>; }
function Field({ label, value, onChange, type = "text", suffix, placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; suffix?: string; placeholder?: string }) { return <label>{label}<span className="input-wrap"><input type={type} value={String(value ?? "")} placeholder={placeholder} onChange={(event) => onChange(event.target.value)}/>{suffix && <em>{suffix}</em>}</span></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label>{label}<span className="color-field"><input type="color" value={value} onChange={(event) => onChange(event.target.value)}/><input value={value} onChange={(event) => onChange(event.target.value)}/></span></label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="design-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i/><span>{label}</span></label>; }
type EditorProps = { value: DesignConfig; set: (value: DesignConfig) => void };
function mergeClient(value?: Partial<DesignConfig>): DesignConfig { const defaults = cloneDefault(); if (!value) return defaults; return { ...defaults, ...value, brand: { ...defaults.brand, ...value.brand }, announcement: { ...defaults.announcement, ...value.announcement }, header: { ...defaults.header, ...value.header, menu: value.header?.menu?.length ? value.header.menu : defaults.header.menu }, footer: { ...defaults.footer, ...value.footer, columns: value.footer?.columns?.length ? value.footer.columns : defaults.footer.columns }, productCard: { ...defaults.productCard, ...value.productCard }, home: { ...defaults.home, ...value.home, sections: value.home?.sections?.length ? value.home.sections : defaults.home.sections } }; }
function sectionLabel(type: HomeSection["type"]) { return { hero_slider: "SLIDER", product_carousel: "ÜRÜNLER", category_grid: "KATEGORİLER", banner: "BANNER", rich_text: "METİN" }[type]; }
