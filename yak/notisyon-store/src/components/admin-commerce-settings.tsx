"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Value = string | number | boolean;
type Values = Record<string, Value>;
type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "password" | "textarea" | "select" | "toggle";
  options?: string[];
  hint?: string;
  wide?: boolean;
};
type Group = { title: string; description: string; fields: Field[] };
type Definition = { label: string; eyebrow: string; description: string; defaults: Values; groups: Group[] };

const field = (key: string, label: string, extra: Omit<Field, "key" | "label"> = {}): Field => ({ key, label, ...extra });

export const commerceSettings: Record<string, Definition> = {
  company: {
    label: "Firma bilgileri", eyebrow: "KURUMSAL KİMLİK", description: "Fatura, sözleşme, iletişim ve resmi belgelerde kullanılan işletme bilgileri.",
    defaults: { company_title: "Notisyon", sector: "Kırtasiye ve hediyelik ürünler", authorized_person: "", phone: "0552 645 30 61", fax: "", tax_office: "", tax_number: "", trade_registry_number: "", mersis_number: "", store_name: "Notisyon Türkiye", email: "destek@notisyon.com", address: "", postal_code: "", country: "Türkiye", city: "İstanbul", district: "Sarıyer" },
    groups: [
      { title: "Yasal firma kimliği", description: "E-fatura, mesafeli satış sözleşmesi ve kurumsal iletişimde kullanılır.", fields: [field("company_title", "Firma ticari unvanı", { wide: true }), field("sector", "Hizmet verilen sektör"), field("authorized_person", "Yetkili kişi"), field("tax_office", "Vergi dairesi"), field("tax_number", "Vergi numarası"), field("trade_registry_number", "Ticari sicil no"), field("mersis_number", "MERSİS no")] },
      { title: "Mağaza ve iletişim", description: "Müşteri belgeleri ve iletişim sayfasındaki bilgiler.", fields: [field("store_name", "Mağaza adı"), field("email", "E-posta", { type: "email" }), field("phone", "Telefon"), field("fax", "Faks"), field("address", "Adres", { type: "textarea", wide: true }), field("postal_code", "Posta kodu"), field("country", "Ülke"), field("city", "Şehir"), field("district", "İlçe")] },
    ],
  },
  payment: {
    label: "Ödeme ayarları", eyebrow: "ÖDEME VE CHECKOUT", description: "Sepette gösterilen ödeme seçenekleri, sınırlar ve müşteri onayları.",
    defaults: { card_enabled: true, installments: true, transfer_enabled: false, transfer_discount: 0, cash_on_delivery: false, cash_on_delivery_fee: 0, cash_on_delivery_min: 0, cash_on_delivery_max: 10000, minimum_order_total: 0, minimum_item_count: 1, payment_timeout_hours: 24, show_withdrawal_separately: true, contracts_prechecked: false, currency: "TRY" },
    groups: [
      { title: "Ödeme yöntemleri", description: "Canlı sağlayıcı anahtarları Bağlantı Merkezi üzerinden tamamlanır.", fields: [field("card_enabled", "Kredi kartı ödeme", { type: "toggle" }), field("installments", "Taksit seçenekleri", { type: "toggle" }), field("transfer_enabled", "Havale / EFT", { type: "toggle" }), field("transfer_discount", "Havale indirimi (%)", { type: "number" }), field("cash_on_delivery", "Kapıda ödeme", { type: "toggle" }), field("cash_on_delivery_fee", "Kapıda ödeme ek ücreti", { type: "number" }), field("cash_on_delivery_min", "Kapıda ödeme alt limiti", { type: "number" }), field("cash_on_delivery_max", "Kapıda ödeme üst limiti", { type: "number" })] },
      { title: "Sipariş sınırları ve onay", description: "Ödeme adımına ilerleme ve sözleşme davranışları.", fields: [field("currency", "Varsayılan para birimi", { type: "select", options: ["TRY", "EUR", "USD", "GBP"] }), field("minimum_order_total", "Minimum alışveriş tutarı", { type: "number" }), field("minimum_item_count", "Minimum ürün adedi", { type: "number" }), field("payment_timeout_hours", "Ödeme tamamlama süresi (saat)", { type: "number" }), field("show_withdrawal_separately", "Cayma hakkını ayrı göster", { type: "toggle" }), field("contracts_prechecked", "Sözleşme onaylarını seçili göster", { type: "toggle" })] },
    ],
  },
  orders: {
    label: "Sipariş ayarları", eyebrow: "SİPARİŞ AKIŞI", description: "Sepet, sipariş numarası, bildirim, iptal, iade ve belge kuralları.",
    defaults: { order_email: "destek@notisyon.com", order_prefix: "NTS", delivery_date_enabled: false, gift_wrap_enabled: true, gift_wrap_fee: 0, gift_note_enabled: true, order_note_enabled: true, show_brand_in_cart: true, show_sku_in_cart: true, show_barcode_in_cart: false, allow_unpaid_cancel: true, allow_paid_cancel: false, cancel_days: 1, return_days: 14, return_reason_required: true, return_shipping_customer_pays: false, refund_shipping_fee: true, custom_order_number: true, pdf_show_images: true, pdf_show_sku: true },
    groups: [
      { title: "Sipariş ve sepet", description: "Müşterinin sipariş öncesi ve sonrasında göreceği bilgiler.", fields: [field("order_email", "Sipariş bildirim e-postası", { type: "email" }), field("order_prefix", "Sipariş numarası öneki"), field("custom_order_number", "Özel sipariş numarası", { type: "toggle" }), field("delivery_date_enabled", "Teslimat tarihi seçimi", { type: "toggle" }), field("gift_wrap_enabled", "Hediye paketi", { type: "toggle" }), field("gift_wrap_fee", "Hediye paketi tutarı", { type: "number" }), field("gift_note_enabled", "Hediye notu", { type: "toggle" }), field("order_note_enabled", "Sipariş notu", { type: "toggle" }), field("show_brand_in_cart", "Sepette marka göster", { type: "toggle" }), field("show_sku_in_cart", "Sepette stok kodu göster", { type: "toggle" }), field("show_barcode_in_cart", "Sepette barkod göster", { type: "toggle" })] },
      { title: "İptal ve iade", description: "Müşteri hesabındaki iptal/iade yetkileri ve geri ödeme davranışı.", fields: [field("allow_unpaid_cancel", "Ödenmemiş sipariş iptali", { type: "toggle" }), field("allow_paid_cancel", "Ödenmiş sipariş iptali", { type: "toggle" }), field("cancel_days", "İptal gün sınırı", { type: "number" }), field("return_days", "İade talebi gün sınırı", { type: "number" }), field("return_reason_required", "İade nedeni zorunlu", { type: "toggle" }), field("return_shipping_customer_pays", "İade kargosunu müşteri öder", { type: "toggle" }), field("refund_shipping_fee", "Kargo ücretini iade et", { type: "toggle" })] },
      { title: "Belge ve çıktı", description: "Sipariş PDF ve paketleme çıktısında yer alacak alanlar.", fields: [field("pdf_show_images", "PDF'de ürün resmi", { type: "toggle" }), field("pdf_show_sku", "PDF'de stok kodu", { type: "toggle" })] },
    ],
  },
  seo: {
    label: "Arama motoru bilgileri", eyebrow: "TEKNİK SEO", description: "Site geneli meta, doğrulama, robots ve görsel adlandırma kuralları.",
    defaults: { site_title: "Notisyon | Planla. Yaz. Hatırla.", site_description: "Defter, planlayıcı ve özel gün ürünleri.", site_keywords: "defter, planlayıcı, çeyiz defteri", google_verification: "", yandex_verification: "", bing_verification: "", pinterest_verification: "", image_name_template: "{URUNADI}-{STOKKODU}", image_alt_template: "{URUNADI} | {KATEGORI} | {MARKA}", breadcrumbs: true, product_name_on_detail: true, robots_content: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: https://notisyon.com/sitemap.xml" },
    groups: [
      { title: "Arama görünümü", description: "Ana sayfanın varsayılan arama motoru başlık ve açıklaması.", fields: [field("site_title", "Site başlık bilgisi", { wide: true }), field("site_description", "Site açıklaması", { type: "textarea", wide: true }), field("site_keywords", "Site anahtar kelimeleri", { wide: true })] },
      { title: "Site doğrulama kodları", description: "Yalnızca sağlayıcının verdiği doğrulama içeriğini girin.", fields: [field("google_verification", "Google doğrulama kodu"), field("yandex_verification", "Yandex doğrulama kodu"), field("bing_verification", "Bing doğrulama kodu"), field("pinterest_verification", "Pinterest doğrulama kodu")] },
      { title: "Ürün ve tarama yapısı", description: "Dinamik değişkenler: {URUNADI}, {KATEGORI}, {MARKA}, {STOKKODU}.", fields: [field("image_name_template", "Ürün resim adı şablonu"), field("image_alt_template", "Ürün resim alt etiketi şablonu"), field("breadcrumbs", "Breadcrumb göster", { type: "toggle" }), field("product_name_on_detail", "Ürün detayda ürün adını göster", { type: "toggle" }), field("robots_content", "robots.txt içeriği", { type: "textarea", wide: true })] },
    ],
  },
  products: {
    label: "Ürün ayarları", eyebrow: "GLOBAL KATALOG DAVRANIŞI", description: "Bütün ürün listeleri, detay sayfaları, yorumlar ve filtreler için varsayılan kurallar.",
    defaults: { show_prices: true, members_only_prices: false, image_slider: true, show_review_count: true, show_rating: true, show_unit: false, show_category: false, show_sku: false, show_barcode: false, show_short_description: true, show_delivery_estimate: true, show_brand_logo: false, show_out_of_stock: true, out_of_stock_last: true, hide_without_image: false, hover_zoom: true, quick_add_popup: false, products_per_page: 24, new_product_days: 30, bestseller_days: 30, bestseller_count: 12, stock_alert_email: true, reviews_without_purchase: false, ratings_without_purchase: false, variant_stock: true, buy_now_button: true, tags_on_detail: true, filters_enabled: true, filter_position: "Sol", filter_brand: true, filter_price: true, filter_stock: true, filter_rating: true, filter_features: true },
    groups: [
      { title: "Liste ve kart görünümü", description: "Tema kart tasarımından bağımsız global görünürlük kuralları.", fields: [field("show_prices", "Fiyatları göster", { type: "toggle" }), field("members_only_prices", "Fiyatları yalnız üyelere göster", { type: "toggle" }), field("image_slider", "Ürün kartında görsel slider", { type: "toggle" }), field("show_review_count", "Yorum sayısını göster", { type: "toggle" }), field("show_rating", "Ürün puanını göster", { type: "toggle" }), field("show_unit", "Satış birimini göster", { type: "toggle" }), field("show_category", "Kategoriyi göster", { type: "toggle" }), field("show_sku", "Stok kodunu göster", { type: "toggle" }), field("show_barcode", "Barkodu göster", { type: "toggle" }), field("show_short_description", "Ön yazıyı göster", { type: "toggle" }), field("show_delivery_estimate", "Tahmini teslimatı göster", { type: "toggle" }), field("show_brand_logo", "Marka logosunu göster", { type: "toggle" }), field("hover_zoom", "Üzerine gelince görseli büyüt", { type: "toggle" }), field("quick_add_popup", "Sepete ekleme popup'ı", { type: "toggle" })] },
      { title: "Stok ve sıralama", description: "Tükenen ve eksik içerikli ürünlerin mağaza davranışı.", fields: [field("show_out_of_stock", "Stoksuz ürünleri göster", { type: "toggle" }), field("out_of_stock_last", "Stoksuzları sona taşı", { type: "toggle" }), field("hide_without_image", "Görselsiz ürünleri gizle", { type: "toggle" }), field("products_per_page", "Sayfa başına ürün", { type: "number" }), field("new_product_days", "Yeni ürün süresi (gün)", { type: "number" }), field("bestseller_days", "Çok satan dönem (gün)", { type: "number" }), field("bestseller_count", "Çok satan ürün sayısı", { type: "number" }), field("stock_alert_email", "Kritik stok e-postası", { type: "toggle" })] },
      { title: "Detay, yorum ve varyasyon", description: "Ürün detay etkileşim ve değerlendirme kuralları.", fields: [field("reviews_without_purchase", "Satın alımsız yorum", { type: "toggle" }), field("ratings_without_purchase", "Satın alımsız puan", { type: "toggle" }), field("variant_stock", "Varyasyon stoklarını göster", { type: "toggle" }), field("buy_now_button", "Hemen al butonu", { type: "toggle" }), field("tags_on_detail", "Ürün detayda etiket", { type: "toggle" })] },
      { title: "Ürün filtreleri", description: "Kategori listelerinde müşteriye sunulan filtreler.", fields: [field("filters_enabled", "Filtre sistemi", { type: "toggle" }), field("filter_position", "Filtre konumu", { type: "select", options: ["Sol", "Sağ", "Üst"] }), field("filter_brand", "Marka filtresi", { type: "toggle" }), field("filter_price", "Fiyat filtresi", { type: "toggle" }), field("filter_stock", "Stok filtresi", { type: "toggle" }), field("filter_rating", "Puan filtresi", { type: "toggle" }), field("filter_features", "Varyasyon/özellik filtresi", { type: "toggle" })] },
    ],
  },
  site: {
    label: "Site yönetim araçları", eyebrow: "MAĞAZA DAVRANIŞI", description: "Bakım, adres, üyelik, favoriler, döviz ve genel vitrin araçları.",
    defaults: { maintenance_mode: false, force_www: false, currency_enabled: false, auto_update_currency: true, show_categories_in_menu: true, product_zoom: "Büyüteç", favorites_enabled: true, stop_offscreen_videos: true, cookie_management: true, password_min: 8, password_max: 64, password_special: true, password_number: true, password_uppercase: true, postal_code_required: true, tckn_required: false, door_number_enabled: false, door_number_required: false, map_enabled: false, guest_checkout: true, membership_enabled: true, email_verification: true, account_deletion: true, blog_enabled: true, blog_page_size: 12 },
    groups: [
      { title: "Site davranışı", description: "Mağazanın genel çalışma ve görüntüleme özellikleri.", fields: [field("maintenance_mode", "Siteyi bakım moduna al", { type: "toggle" }), field("force_www", "WWW yönlendirmesi", { type: "toggle" }), field("currency_enabled", "Çoklu para birimi", { type: "toggle" }), field("auto_update_currency", "Döviz kurlarını otomatik güncelle", { type: "toggle" }), field("show_categories_in_menu", "Menüde kategorileri göster", { type: "toggle" }), field("product_zoom", "Ürün detay zoom tipi", { type: "select", options: ["Büyüteç", "Tam ekran", "Pinch zoom", "Kapalı"] }), field("favorites_enabled", "Favori liste sistemi", { type: "toggle" }), field("stop_offscreen_videos", "Ekran dışı videoları durdur", { type: "toggle" }), field("cookie_management", "Çerez tercih merkezi", { type: "toggle" })] },
      { title: "Parola güvenliği", description: "Yeni ve güncellenen müşteri parolaları için kurallar.", fields: [field("password_min", "Minimum uzunluk", { type: "number" }), field("password_max", "Maksimum uzunluk", { type: "number" }), field("password_special", "Özel karakter zorunlu", { type: "toggle" }), field("password_number", "Rakam zorunlu", { type: "toggle" }), field("password_uppercase", "Büyük harf zorunlu", { type: "toggle" })] },
      { title: "Adres ve üyelik", description: "Checkout ve hesap oluşturma alanlarının zorunlulukları.", fields: [field("postal_code_required", "Posta kodu zorunlu", { type: "toggle" }), field("tckn_required", "TCKN zorunlu", { type: "toggle" }), field("door_number_enabled", "Kapı no alanı", { type: "toggle" }), field("door_number_required", "Kapı no zorunlu", { type: "toggle" }), field("map_enabled", "Adres haritası", { type: "toggle" }), field("guest_checkout", "Üyeliksiz alışveriş", { type: "toggle" }), field("membership_enabled", "Üyelik sistemi", { type: "toggle" }), field("email_verification", "E-posta doğrulaması", { type: "toggle" }), field("account_deletion", "Üye hesabını silebilir", { type: "toggle" })] },
      { title: "Blog", description: "Rehber/blog listeleme davranışı.", fields: [field("blog_enabled", "Blog aktif", { type: "toggle" }), field("blog_page_size", "Sayfa başına içerik", { type: "number" })] },
    ],
  },
  texts: {
    label: "Sistem metinleri", eyebrow: "MAĞAZA DİLİ", description: "Sepet, stok, üyelik ve müşteri hizmetleri ekranlarında kullanılan kısa sistem metinleri.",
    defaults: { out_of_stock: "Tükendi", add_to_cart: "Sepete ekle", buy_now: "Hemen al", empty_cart: "Sepetiniz henüz boş.", free_shipping: "Ücretsiz kargo", login_required: "Devam etmek için giriş yapın.", order_success: "Siparişiniz başarıyla alındı.", return_received: "İade talebiniz alındı.", newsletter_success: "Kaydınız alındı. Hoş geldiniz!", maintenance_title: "Kısa bir bakım arasındayız", maintenance_text: "Mağazamızı daha iyi hale getiriyoruz. Lütfen biraz sonra tekrar deneyin." },
    groups: [{ title: "Müşteri arayüzü metinleri", description: "Bu metinler mağazanın ilgili durum ekranlarında kullanılır.", fields: [field("out_of_stock", "Stokta yok metni"), field("add_to_cart", "Sepete ekle butonu"), field("buy_now", "Hemen al butonu"), field("empty_cart", "Boş sepet mesajı", { wide: true }), field("free_shipping", "Ücretsiz kargo metni"), field("login_required", "Giriş zorunluluğu mesajı", { wide: true }), field("order_success", "Sipariş başarı mesajı", { wide: true }), field("return_received", "İade alındı mesajı", { wide: true }), field("newsletter_success", "Bülten başarı mesajı", { wide: true }), field("maintenance_title", "Bakım sayfası başlığı", { wide: true }), field("maintenance_text", "Bakım sayfası açıklaması", { type: "textarea", wide: true })] }],
  },
  social: {
    label: "Sosyal medya", eyebrow: "SOSYAL KANALLAR", description: "Sosyal bağlantılar, paylaşım görünümü ve isteğe bağlı sosyal giriş sağlayıcıları.",
    defaults: { instagram_url: "https://instagram.com/notisyon", facebook_url: "", x_url: "", pinterest_url: "", youtube_url: "", whatsapp_url: "https://wa.me/905526453061", share_title: "Notisyon", share_description: "Planla. Yaz. Hatırla.", share_image: "", facebook_login: false, facebook_app_id: "", facebook_app_secret: "", google_login: false, google_client_id: "", google_client_secret: "", apple_login: false, apple_client_id: "", apple_team_id: "" },
    groups: [
      { title: "Sosyal bağlantılar ve paylaşım", description: "Footer ve sosyal paylaşım kartlarının varsayılanları.", fields: [field("instagram_url", "Instagram URL"), field("facebook_url", "Facebook URL"), field("x_url", "X / Twitter URL"), field("pinterest_url", "Pinterest URL"), field("youtube_url", "YouTube URL"), field("whatsapp_url", "WhatsApp URL"), field("share_title", "Paylaşım başlığı"), field("share_description", "Paylaşım açıklaması", { type: "textarea", wide: true }), field("share_image", "Paylaşım görseli URL", { wide: true })] },
      { title: "Sosyal giriş", description: "Sağlayıcı anahtarları girilmeden açık konuma alınamaz.", fields: [field("facebook_login", "Facebook ile giriş", { type: "toggle" }), field("facebook_app_id", "Facebook App ID"), field("facebook_app_secret", "Facebook App Secret", { type: "password" }), field("google_login", "Google ile giriş", { type: "toggle" }), field("google_client_id", "Google Client ID"), field("google_client_secret", "Google Client Secret", { type: "password" }), field("apple_login", "Apple ile giriş", { type: "toggle" }), field("apple_client_id", "Apple Client ID"), field("apple_team_id", "Apple Team ID")] },
    ],
  },
  marketing: {
    label: "Dijital pazarlama", eyebrow: "ÖLÇÜMLEME VE REKLAM", description: "Analitik, reklam dönüşümü, ürün verisi ve izinli pazarlama etiketleri.",
    defaults: { yandex_metrica_id: "", ga4_id: "", ga4_api_secret: "", ga4_server_side: false, include_shipping_tax: true, separate_variants: true, gtm_id: "", gtm_url: "https://www.googletagmanager.com", google_ads_id: "", google_ads_label: "", google_remarketing: false, meta_pixel_id: "", meta_access_token: "", meta_conversion_api: false, tiktok_pixel_id: "", tiktok_access_token: "", klaviyo_enabled: false, klaviyo_public_key: "", klaviyo_private_key: "", rich_snippets: true, rich_item_list: true, rich_brand: true, rich_category: true, rich_price: true, rich_stock: true, rich_image: true, rich_sku: true, rich_description: true, pinterest_feed: false, pinterest_product_count: 50, adjust_token: "", adjust_purchase_event: "", adjust_add_to_cart_event: "", adjust_checkout_event: "" },
    groups: [
      { title: "Google ve Yandex", description: "Analitik etiketleri yalnız analitik çerez onayından sonra çalışır.", fields: [field("yandex_metrica_id", "Yandex Metrica Sayaç ID"), field("ga4_id", "Google Analytics GA4 ID"), field("ga4_api_secret", "GA4 Measurement Protocol API Secret", { type: "password" }), field("ga4_server_side", "GA4 sunucu taraflı ölçüm", { type: "toggle" }), field("include_shipping_tax", "Kargo ve KDV dahil tutar gönder", { type: "toggle" }), field("separate_variants", "Varyant bilgisini ayrı gönder", { type: "toggle" }), field("gtm_id", "Google Tag Manager ID"), field("gtm_url", "Google Tag Manager URL"), field("google_ads_id", "Google Ads Conversion ID"), field("google_ads_label", "Google Ads Conversion Label"), field("google_remarketing", "Google yeniden pazarlama", { type: "toggle" })] },
      { title: "Meta, TikTok ve Klaviyo", description: "Tarayıcı etiketleri pazarlama çerez iznine bağlıdır.", fields: [field("meta_pixel_id", "Facebook / Meta Pixel ID"), field("meta_access_token", "Meta Conversion API token", { type: "password" }), field("meta_conversion_api", "Meta Conversion API", { type: "toggle" }), field("tiktok_pixel_id", "TikTok Pixel ID"), field("tiktok_access_token", "TikTok Access Token", { type: "password" }), field("klaviyo_enabled", "Klaviyo aktif", { type: "toggle" }), field("klaviyo_public_key", "Klaviyo Public API Key"), field("klaviyo_private_key", "Klaviyo Private API Key", { type: "password" })] },
      { title: "Rich snippets ve Pinterest", description: "Ürün yapılandırılmış verisi ve sosyal ürün akışı.", fields: [field("rich_snippets", "Rich Snippets aktif", { type: "toggle" }), field("rich_item_list", "ItemList şeması", { type: "toggle" }), field("rich_brand", "Marka bilgisi", { type: "toggle" }), field("rich_category", "Kategori bilgisi", { type: "toggle" }), field("rich_price", "Fiyat bilgisi", { type: "toggle" }), field("rich_stock", "Stok bilgisi", { type: "toggle" }), field("rich_image", "Ürün resmi", { type: "toggle" }), field("rich_sku", "Ürün kodu", { type: "toggle" }), field("rich_description", "Ürün açıklaması", { type: "toggle" }), field("pinterest_feed", "Pinterest RSS akışı", { type: "toggle" }), field("pinterest_product_count", "Pinterest ürün sayısı", { type: "number" })] },
      { title: "Adjust olay eşleştirmeleri", description: "Mobil uygulama kurulursa kullanılacak olay kodları.", fields: [field("adjust_token", "Adjust Token"), field("adjust_purchase_event", "Purchase event"), field("adjust_add_to_cart_event", "Add to cart event"), field("adjust_checkout_event", "Begin checkout event")] },
    ],
  },
  suppliers: {
    label: "Tedarikçi ayarları", eyebrow: "TEDARİK VE ÜRÜN AKIŞI", description: "Varsayılan tedarik, Google Merchant ve ürün feed aktarım davranışları.",
    defaults: { default_supplier: "Notisyon Üretim", supplier_code_prefix: "NT-TD", purchase_email: "satinalma@notisyon.com", lead_time_days: 7, auto_purchase_alert: true, merchant_enabled: false, merchant_category: "", merchant_product_type: "", send_shipping_tax: true, export_variants: true, export_out_of_stock: false, export_purchase_price: false, stock_buffer: 0 },
    groups: [
      { title: "Tedarik operasyonu", description: "Ürün ve varyasyon kayıtlarında kullanılan varsayılanlar.", fields: [field("default_supplier", "Varsayılan tedarikçi"), field("supplier_code_prefix", "Tedarikçi kod öneki"), field("purchase_email", "Satın alma e-postası", { type: "email" }), field("lead_time_days", "Tedarik süresi (gün)", { type: "number" }), field("auto_purchase_alert", "Otomatik satın alma uyarısı", { type: "toggle" }), field("stock_buffer", "Feed stok güvenlik payı", { type: "number" })] },
      { title: "Google Merchant ve feed", description: "Ürün akışında kullanılacak global eşleştirme ve aktarım kuralları.", fields: [field("merchant_enabled", "Google Merchant aktarımı", { type: "toggle" }), field("merchant_category", "Google ürün kategorisi", { wide: true }), field("merchant_product_type", "Google ürün tipi", { wide: true }), field("send_shipping_tax", "Kargo ve KDV dahil tutar gönder", { type: "toggle" }), field("export_variants", "Varyasyonları ayrı aktar", { type: "toggle" }), field("export_out_of_stock", "Stoksuz ürünleri aktar", { type: "toggle" }), field("export_purchase_price", "Alış fiyatını aktar", { type: "toggle" })] },
    ],
  },
};

export const commerceSettingsOrder = ["company", "payment", "orders", "seo", "products", "site", "texts", "social", "marketing", "suppliers"];

async function request(options?: RequestInit) {
  const response = await fetch("/api/admin/operations?resource=settings", { cache: "no-store", ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Ayarlar yüklenemedi.");
  return body as Record<string, unknown>;
}

export function AdminCommerceSettings({ section }: { section: string }) {
  const definition = commerceSettings[section] || commerceSettings.company;
  const [values, setValues] = useState<Values>(definition.defaults);
  const [status, setStatus] = useState("Ayarlar yükleniyor…");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void request().then((data) => {
      setValues({ ...definition.defaults, ...((data[`control_${section}`] || {}) as Values) });
      setDirty(false);
      setStatus("Tüm ayarlar güncel");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "Ayarlar yüklenemedi."));
  }, [definition, section]);

  const fieldCount = definition.groups.reduce((total, group) => total + group.fields.length, 0);
  const completed = useMemo(() => {
    const meaningful = Object.values(values).filter((value) => typeof value === "boolean" || value !== "").length;
    return Math.round((meaningful / Math.max(1, Object.keys(definition.defaults).length)) * 100);
  }, [definition.defaults, values]);

  function update(key: string, value: Value) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setStatus("Kaydediliyor…");
    try {
      await request({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "settings", key: `control_${section}`, value: values }) });
      setDirty(false);
      setStatus("Kaydedildi ve mağaza yapılandırmasına işlendi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kaydedilemedi.");
    }
  }

  return <div className="commerce-settings-suite">
    <aside className="commerce-settings-nav">
      <header><span>GENEL AYARLAR</span><b>Mağaza yapılandırması</b><small>{commerceSettingsOrder.length} yönetim alanı</small></header>
      <nav>{commerceSettingsOrder.map((key) => <Link className={key === section ? "active" : ""} href={`/admin/settings/${key}`} key={key}><span>{commerceSettings[key].label}</span><i>›</i></Link>)}</nav>
      <footer><span>●</span><p><b>Merkezi kayıt</b><small>Değişiklikler sürümlü ayar deposunda saklanır.</small></p></footer>
    </aside>
    <main className="commerce-settings-main">
      <section className="commerce-settings-heading"><div><span>{definition.eyebrow}</span><h2>{definition.label}</h2><p>{definition.description}</p></div><div><b>{fieldCount}</b><span>yönetilebilir alan</span><em>{completed}% dolu</em></div></section>
      {definition.groups.map((group) => <section className="commerce-settings-card" key={group.title}>
        <header><div><h3>{group.title}</h3><p>{group.description}</p></div><span>{group.fields.length} ayar</span></header>
        <div>{group.fields.map((item) => <SettingField field={item} value={values[item.key]} update={update} key={item.key}/>)}</div>
      </section>)}
      <footer className="commerce-settings-save"><span className={dirty ? "dirty" : ""}>{dirty ? "Kaydedilmemiş değişiklikler var" : status}</span><button type="button" disabled={!dirty} onClick={() => void save()}>Değişiklikleri kaydet</button></footer>
    </main>
  </div>;
}

function SettingField({ field: item, value, update }: { field: Field; value: Value; update: (key: string, value: Value) => void }) {
  return <label className={`${item.wide ? "wide" : ""} ${item.type === "toggle" ? "toggle-field" : ""}`}><span>{item.label}</span>
    {item.type === "toggle" ? <button type="button" className={`premium-switch ${value ? "on" : ""}`} onClick={() => update(item.key, !value)}><i/><b>{value ? "Açık" : "Kapalı"}</b></button>
      : item.type === "select" ? <select value={String(value ?? "")} onChange={(event) => update(item.key, event.target.value)}>{item.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select>
        : item.type === "textarea" ? <textarea value={String(value ?? "")} onChange={(event) => update(item.key, event.target.value)}/>
          : <input type={item.type || "text"} value={String(value ?? "")} onChange={(event) => update(item.key, item.type === "number" ? Number(event.target.value) : event.target.value)}/>} 
    {item.hint ? <small>{item.hint}</small> : null}
  </label>;
}
