export type DesignMenuItem = { id: string; label: string; href: string; visible: boolean };
export type FooterLink = { id: string; label: string; href: string };
export type FooterColumn = { id: string; title: string; links: FooterLink[] };
export type HeroSlide = { id: string; eyebrow: string; title: string; description: string; imageUrl: string; buttonLabel: string; buttonHref: string };
export type HomeSection = { id: string; type: "hero_slider" | "product_carousel" | "category_grid" | "banner" | "rich_text"; title: string; subtitle: string; active: boolean; background: string; imageUrl?: string; buttonLabel?: string; buttonHref?: string; productSource?: "featured" | "new" | "deal" | "all"; productLimit?: number; html?: string; slides?: HeroSlide[]; sourceMode?: boolean; customHtml?: string; customCss?: string };
export type DesignConfig = {
  brand: { logoUrl: string; logoAlt: string; faviconUrl: string; primaryColor: string; accentColor: string; pageBackground: string; fontFamily: string; contentWidth: number };
  announcement: { enabled: boolean; text: string; href: string; background: string; color: string };
  header: { layout: "logo_left" | "centered" | "compact"; sticky: boolean; showAccount: boolean; showCart: boolean; menu: DesignMenuItem[]; sourceMode: boolean; customHtml: string; customCss: string };
  footer: { newsletterEnabled: boolean; newsletterTitle: string; newsletterText: string; instagramUrl: string; whatsapp: string; email: string; phone: string; address: string; copyright: string; columns: FooterColumn[]; sourceMode: boolean; customHtml: string; customCss: string };
  productCard: { style: "minimal" | "bordered" | "elevated"; imageRatio: "square" | "portrait" | "landscape"; desktopColumns: number; mobileColumns: number; showBrand: boolean; showBadges: boolean; showComparePrice: boolean; quickAdd: boolean; buttonLabel: string; sourceMode: boolean; customHtml: string; customCss: string };
  home: { replaceLegacy: boolean; sections: HomeSection[] };
};

const logo = "https://static.ticimax.cloud/75269/Uploads/HeaderTasarim/Header8/27d6a0c1-d080-4e27-b38d-2c04fdceca48.jpg";
export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  brand: { logoUrl: logo, logoAlt: "Notisyon", faviconUrl: "/favicon.ico", primaryColor: "#1f2230", accentColor: "#a1f400", pageBackground: "#ffffff", fontFamily: "Arial, sans-serif", contentWidth: 1440 },
  announcement: { enabled: true, text: "350 TL ve üzeri alışverişlerde ücretsiz kargo", href: "", background: "#8b7656", color: "#ffffff" },
  header: { layout: "logo_left", sticky: true, showAccount: true, showCart: true, sourceMode: false, customHtml: "", customCss: "", menu: [
    { id: "menu-ceyiz", label: "Çeyiz Defteri", href: "/ceyiz-defteri", visible: true }, { id: "menu-kart", label: "Tebrik Kartı", href: "/tebrik-karti-30", visible: true }, { id: "menu-defter", label: "Defter", href: "/defter-31", visible: true }, { id: "menu-plan", label: "Planlayıcı", href: "/planlayici-32", visible: true }, { id: "menu-oyun", label: "Eğlence & Oyun", href: "/eglence-oyun", visible: true }, { id: "menu-dugun", label: "Düğün & Nikah", href: "/dugun-nikah", visible: true }, { id: "menu-blog", label: "Rehber", href: "/blog", visible: true },
  ] },
  footer: { newsletterEnabled: true, newsletterTitle: "Notisyon’dan haberdar ol.", newsletterText: "Yeni ürünler, özel koleksiyonlar ve fırsatlardan ilk sen haberdar ol.", instagramUrl: "https://www.instagram.com/notisyoncom/", whatsapp: "905526453061", email: "destek@notisyon.com", phone: "0552 645 30 61", address: "Ayazağa Mahallesi, 154. Sokak, Sarıyer/İstanbul", copyright: "Copyright © 2026 Notisyon. Tüm hakları saklıdır.", sourceMode: false, customHtml: "", customCss: "", columns: [
    { id: "footer-corporate", title: "Kurumsal", links: [{ id: "fl-about", label: "Hakkımızda", href: "/sayfa/hakkimizda" }, { id: "fl-privacy", label: "Gizlilik Politikası", href: "/sayfa/gizlilik-politikasi" }, { id: "fl-kvkk", label: "KVKK Aydınlatma Metni", href: "/sayfa/kvkk" }] },
    { id: "footer-categories", title: "Popüler Kategoriler", links: [{ id: "fl-notebook", label: "Defter Modelleri", href: "/defter-31" }, { id: "fl-planner", label: "Planlayıcı Defterler", href: "/planlayici-32" }, { id: "fl-guide", label: "Rehber", href: "/blog" }] },
    { id: "footer-help", title: "Müşteri Hizmetleri", links: [{ id: "fl-shipping", label: "Kargo ve Teslimat", href: "/sayfa/kargo-ve-teslimat" }, { id: "fl-return", label: "İade ve Değişim", href: "/sayfa/iade-ve-degisim" }, { id: "fl-contact", label: "İletişim", href: "/form/iletisim" }] },
  ] },
  productCard: { style: "bordered", imageRatio: "square", desktopColumns: 4, mobileColumns: 2, showBrand: true, showBadges: true, showComparePrice: true, quickAdd: true, buttonLabel: "Sepete ekle", sourceMode: false, customHtml: "", customCss: "" },
  home: { replaceLegacy: true, sections: [
    { id: "home-hero", type: "hero_slider", title: "Ana slider", subtitle: "Marka mesajı ve kampanya görselleri", active: true, background: "#f2eee8", slides: [{ id: "slide-main", eyebrow: "NOTİSYON KOLEKSİYONLARI", title: "Defter, planlayıcı ve çeyiz ürünleriyle planını kolaylaştır.", description: "Günlük notlarından düğün hazırlıklarına kadar sana eşlik eden tasarımları keşfet.", imageUrl: "", buttonLabel: "Ürünleri keşfet", buttonHref: "/urunler" }] },
    { id: "home-products", type: "product_carousel", title: "Çok satanlar", subtitle: "Müşterilerimizin en çok tercih ettiği ürünler", active: true, background: "#ffffff", productSource: "featured", productLimit: 4 },
    { id: "home-categories", type: "category_grid", title: "İhtiyacına göre keşfet", subtitle: "Not alma, planlama ve özel günler için", active: true, background: "#f5f4ee" },
  ] },
};

export function mergeDesignConfig(value: Partial<DesignConfig> | null | undefined): DesignConfig {
  return { ...DEFAULT_DESIGN_CONFIG, ...value, brand: { ...DEFAULT_DESIGN_CONFIG.brand, ...value?.brand }, announcement: { ...DEFAULT_DESIGN_CONFIG.announcement, ...value?.announcement }, header: { ...DEFAULT_DESIGN_CONFIG.header, ...value?.header, menu: value?.header?.menu?.length ? value.header.menu : DEFAULT_DESIGN_CONFIG.header.menu }, footer: { ...DEFAULT_DESIGN_CONFIG.footer, ...value?.footer, columns: value?.footer?.columns?.length ? value.footer.columns : DEFAULT_DESIGN_CONFIG.footer.columns }, productCard: { ...DEFAULT_DESIGN_CONFIG.productCard, ...value?.productCard }, home: { ...DEFAULT_DESIGN_CONFIG.home, ...value?.home, sections: value?.home?.sections?.length ? value.home.sections : DEFAULT_DESIGN_CONFIG.home.sections } };
}
