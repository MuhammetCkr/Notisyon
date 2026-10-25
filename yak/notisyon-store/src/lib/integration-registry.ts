export type IntegrationId = "database" | "paytr" | "hepsijet" | "merchant" | "smtp";

export type IntegrationConfig = {
  id: IntegrationId;
  enabled: boolean;
  mode: "test" | "production";
  account: string;
  endpoint: string;
  settings?: Record<string, string | number | boolean>;
};

type Definition = {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  color: string;
  defaultEndpoint: string;
  requiredEnvironment: string[];
  optionalEnvironment?: string[];
};

export const integrationDefinitions: Definition[] = [
  { id: "database", name: "Supabase PostgreSQL", category: "Veritabanı", description: "Ürün, sipariş, müşteri ve içerik verilerinin ana veri kaynağı.", color: "violet", defaultEndpoint: "Sunucu bağlantısı", requiredEnvironment: ["DATABASE_URL"] },
  { id: "paytr", name: "PayTR", category: "Ödeme", description: "Token üretimi, güvenli ödeme ekranı, callback doğrulaması ve ödeme durumu senkronizasyonu hazırdır.", color: "blue", defaultEndpoint: "/api/paytr/callback", requiredEnvironment: ["PAYTR_MERCHANT_ID", "PAYTR_MERCHANT_KEY", "PAYTR_MERCHANT_SALT"], optionalEnvironment: ["PAYTR_TEST_MODE"] },
  { id: "hepsijet", name: "HepsiJet", category: "Kargo", description: "Gönderi oluşturma, etiket, takip numarası, durum eşitleme ve teslimat hareketleri için hazırlanmıştır.", color: "orange", defaultEndpoint: "/api/shipping/hepsijet", requiredEnvironment: ["HEPSIJET_API_BASE_URL", "HEPSIJET_USERNAME", "HEPSIJET_PASSWORD", "HEPSIJET_CUSTOMER_CODE"] },
  { id: "merchant", name: "Google Merchant Feed", category: "Ürün Feed", description: "Google alışveriş kanalları için ürün kataloğu ve stok/fiyat çıktısı.", color: "green", defaultEndpoint: "/api/feed/products.xml", requiredEnvironment: [] },
  { id: "smtp", name: "Transactional Email", category: "E-posta", description: "Sipariş, ödeme, kargo ve üyelik mesajlarının sunucu üzerinden gönderimi.", color: "pink", defaultEndpoint: "SMTP / API", requiredEnvironment: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"] },
];

function defaultSettings(id: IntegrationId): Record<string, string | number | boolean> {
  if (id === "hepsijet") return { labelSize: "10x15", senderBranch: "Merkez", autoCreateShipment: false, autoSyncTracking: true };
  if (id === "paytr") return { installment: true, callbackEnabled: true };
  if (id === "merchant") return { includeOutOfStock: false, language: "tr", currency: "TRY" };
  if (id === "smtp") return { senderName: "Notisyon", replyTo: "destek@notisyon.com" };
  return {};
}

export const defaultIntegrationConfigs: IntegrationConfig[] = integrationDefinitions.map((definition) => ({
  id: definition.id,
  enabled: definition.id === "database",
  mode: definition.id === "database" ? "production" : "test",
  account: definition.id === "database" ? "Notisyon Store" : "",
  endpoint: definition.defaultEndpoint,
  settings: defaultSettings(definition.id),
}));

export function integrationReadiness(configs: IntegrationConfig[]) {
  return integrationDefinitions.map((definition) => {
    const stored = configs.find((item) => item.id === definition.id);
    const config = { ...defaultIntegrationConfigs.find((item) => item.id === definition.id)!, ...stored };
    const missingEnvironment = definition.requiredEnvironment.filter((key) => !String(process.env[key] || "").trim());
    const credentialsReady = missingEnvironment.length === 0;
    return {
      ...definition,
      ...config,
      requiredEnvironment: definition.requiredEnvironment.map((key) => ({ key, configured: !missingEnvironment.includes(key) })),
      optionalEnvironment: (definition.optionalEnvironment || []).map((key) => ({ key, configured: Boolean(String(process.env[key] || "").trim()) })),
      credentialsReady,
      operational: Boolean(config.enabled && credentialsReady),
      status: config.enabled ? credentialsReady ? "operational" : "credentials_missing" : credentialsReady ? "ready_to_enable" : "setup_required",
    };
  });
}
