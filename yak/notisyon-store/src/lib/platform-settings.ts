import "server-only";
import { getDb } from "@/lib/db";

export type SettingMap = Record<string, unknown>;
export type PlatformSettings = {
  company: SettingMap;
  payment: SettingMap;
  orders: SettingMap;
  seo: SettingMap;
  products: SettingMap;
  site: SettingMap;
  texts: SettingMap;
  social: SettingMap;
  marketing: SettingMap;
  suppliers: SettingMap;
};

const defaults: PlatformSettings = {
  company: { company_title: "Notisyon", store_name: "Notisyon Türkiye", email: "destek@notisyon.com", phone: "0552 645 30 61", address: "", country: "Türkiye", city: "İstanbul", district: "Sarıyer" },
  payment: { card_enabled: true, installments: true, transfer_enabled: false, minimum_order_total: 0, minimum_item_count: 1, payment_timeout_hours: 24, currency: "TRY" },
  orders: { order_prefix: "NTS", gift_wrap_enabled: true, gift_note_enabled: true, order_note_enabled: true, show_brand_in_cart: true, show_sku_in_cart: true, allow_unpaid_cancel: true, allow_paid_cancel: false, cancel_days: 1, return_days: 14, return_reason_required: true, pdf_show_images: true, pdf_show_sku: true },
  seo: { site_title: "Notisyon | Planla. Yaz. Hatırla.", site_description: "Defter, planlayıcı ve özel gün ürünleri.", site_keywords: "defter, planlayıcı, çeyiz defteri", breadcrumbs: true, product_name_on_detail: true, robots_content: "" },
  products: { show_prices: true, members_only_prices: false, show_rating: true, show_review_count: true, show_short_description: true, show_out_of_stock: true, out_of_stock_last: true, hide_without_image: false, products_per_page: 24, filters_enabled: true, filter_brand: true, filter_price: true, filter_stock: true, filter_rating: true, filter_features: true, buy_now_button: true },
  site: { maintenance_mode: false, show_categories_in_menu: true, favorites_enabled: true, cookie_management: true, password_min: 8, password_max: 64, postal_code_required: true, guest_checkout: true, membership_enabled: true, email_verification: true, account_deletion: true, blog_enabled: true, blog_page_size: 12 },
  texts: { out_of_stock: "Tükendi", add_to_cart: "Sepete ekle", buy_now: "Hemen al", empty_cart: "Sepetiniz henüz boş.", free_shipping: "Ücretsiz kargo", login_required: "Devam etmek için giriş yapın.", order_success: "Siparişiniz başarıyla alındı.", return_received: "İade talebiniz alındı.", newsletter_success: "Kaydınız alındı. Hoş geldiniz!", maintenance_title: "Kısa bir bakım arasındayız", maintenance_text: "Mağazamızı daha iyi hale getiriyoruz. Lütfen biraz sonra tekrar deneyin." },
  social: { instagram_url: "https://instagram.com/notisyon", facebook_url: "", x_url: "", pinterest_url: "", youtube_url: "", whatsapp_url: "https://wa.me/905526453061", share_title: "Notisyon", share_description: "Planla. Yaz. Hatırla.", share_image: "" },
  marketing: { yandex_metrica_id: "", ga4_id: "", ga4_server_side: false, gtm_id: "", gtm_url: "https://www.googletagmanager.com", google_ads_id: "", google_remarketing: false, meta_pixel_id: "", meta_conversion_api: false, tiktok_pixel_id: "", klaviyo_enabled: false, rich_snippets: true, rich_item_list: true, pinterest_feed: false, pinterest_product_count: 50 },
  suppliers: { default_supplier: "Notisyon Üretim", supplier_code_prefix: "NT-TD", lead_time_days: 7, merchant_enabled: false, send_shipping_tax: true, export_variants: true, export_out_of_stock: false, export_purchase_price: false, stock_buffer: 0 },
};

function object(value: unknown): SettingMap {
  return value && typeof value === "object" && !Array.isArray(value) ? value as SettingMap : {};
}

export async function readPlatformSettings(): Promise<PlatformSettings> {
  try {
    const keys = Object.keys(defaults).map((key) => `control_${key}`);
    const rows = (await getDb().query<{ key: string; value: unknown }>("SELECT key,value FROM store_settings WHERE key=ANY($1::text[])", [keys])).rows;
    const saved = Object.fromEntries(rows.map((row) => [row.key.replace(/^control_/, ""), object(row.value)]));
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, { ...value, ...object(saved[key]) }])) as PlatformSettings;
  } catch {
    return defaults;
  }
}

export function settingText(settings: SettingMap, key: string, fallback = "") {
  const value = String(settings[key] ?? "").trim();
  return value || fallback;
}

export function settingNumber(settings: SettingMap, key: string, fallback = 0) {
  const value = Number(settings[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function settingBoolean(settings: SettingMap, key: string, fallback = false) {
  return typeof settings[key] === "boolean" ? settings[key] : fallback;
}
