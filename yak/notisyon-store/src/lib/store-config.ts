import { getDb } from "@/lib/db";
import type { CommerceConfig } from "@/lib/commerce-config";

type JsonMap = Record<string, unknown>;

const defaults: CommerceConfig = {
  general: { storeName: "Notisyon", supportEmail: "destek@notisyon.com", supportPhone: "0552 645 30 61", orderPrefix: "NTS", storeStatus: "Aktif", maintenanceMode: false, guestCheckout: true },
  shipping: { provider: "hepsijet", freeShippingThreshold: 350, flatRate: 59.9, estimatedDays: "1-3 iş günü", sameDayCutoff: "14:00", trackingNotifications: true },
  checkout: { minimumOrderTotal: 0, minimumItemCount: 1, currency: "TRY", cardEnabled: true, installments: true, bankTransfer: false, cashOnDelivery: false, cashOnDeliveryFee: 0, cashOnDeliveryMin: 0, cashOnDeliveryMax: 10000 },
  tax: { pricesIncludeTax: true, defaultVat: 20, invoicePrefix: "NT", companyTitle: "Notisyon", eInvoice: false, eArchive: true },
};

function object(value: unknown): JsonMap { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonMap : {}; }
function text(value: unknown, fallback: string) { const result = String(value ?? "").trim(); return result || fallback; }
function number(value: unknown, fallback: number) { const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : fallback; }

export async function readCommerceConfig(): Promise<CommerceConfig> {
  const rows = (await getDb().query(`SELECT key,value FROM store_settings WHERE key=ANY($1::text[])`, [["general", "shipping", "checkout", "control_general", "control_shipping", "control_payments", "control_payment", "control_tax", "control_company", "control_orders", "control_site"]])).rows;
  const settings = Object.fromEntries(rows.map((row) => [row.key, object(row.value)])) as Record<string, JsonMap>;
  const company = object(settings.control_company);
  const orderSettings = object(settings.control_orders);
  const site = object(settings.control_site);
  const general: JsonMap = {
    ...object(settings.general),
    ...object(settings.control_general),
    ...(company.store_name ? { store_name: company.store_name } : {}),
    ...(company.email ? { support_email: company.email } : {}),
    ...(company.phone ? { support_phone: company.phone } : {}),
    ...(orderSettings.order_prefix ? { order_prefix: orderSettings.order_prefix } : {}),
    ...(typeof site.maintenance_mode === "boolean" ? { maintenance_mode: site.maintenance_mode } : {}),
    ...(typeof site.guest_checkout === "boolean" ? { guest_checkout: site.guest_checkout } : {}),
  };
  const shipping: JsonMap = { ...object(settings.shipping), ...object(settings.control_shipping) };
  const checkout: JsonMap = { ...object(settings.checkout), ...object(settings.control_payments), ...object(settings.control_payment) };
  const tax: JsonMap = { ...object(settings.control_tax), ...(company.company_title ? { company_title: company.company_title } : {}) };
  return {
    general: {
      storeName: text(general.store_name, defaults.general.storeName), supportEmail: text(general.support_email, defaults.general.supportEmail), supportPhone: text(general.support_phone, defaults.general.supportPhone),
      orderPrefix: text(general.order_prefix, defaults.general.orderPrefix).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || defaults.general.orderPrefix,
      storeStatus: text(general.store_status, defaults.general.storeStatus), maintenanceMode: Boolean(general.maintenance_mode), guestCheckout: general.guest_checkout !== false,
    },
    shipping: {
      provider: text(shipping.provider ?? shipping.default_provider, defaults.shipping.provider).toLocaleLowerCase("tr-TR"), freeShippingThreshold: number(shipping.free_shipping_threshold, defaults.shipping.freeShippingThreshold),
      flatRate: number(shipping.flat_rate, defaults.shipping.flatRate), estimatedDays: text(shipping.estimated_days, defaults.shipping.estimatedDays), sameDayCutoff: text(shipping.same_day_cutoff, defaults.shipping.sameDayCutoff), trackingNotifications: shipping.tracking_notifications !== false,
    },
    checkout: {
      minimumOrderTotal: number(checkout.minimum_order_total, defaults.checkout.minimumOrderTotal), minimumItemCount: Math.max(1, number(checkout.minimum_item_count, defaults.checkout.minimumItemCount)), currency: text(checkout.currency, defaults.checkout.currency).slice(0, 3).toUpperCase(), cardEnabled: checkout.card_enabled !== false, installments: checkout.installments !== false, bankTransfer: Boolean(checkout.transfer_enabled ?? checkout.bank_transfer), cashOnDelivery: Boolean(checkout.cash_on_delivery), cashOnDeliveryFee: number(checkout.cash_on_delivery_fee, 0), cashOnDeliveryMin: number(checkout.cash_on_delivery_min, 0), cashOnDeliveryMax: number(checkout.cash_on_delivery_max, 10000),
    },
    tax: {
      pricesIncludeTax: tax.prices_include_tax !== false, defaultVat: number(tax.default_vat, defaults.tax.defaultVat), invoicePrefix: text(tax.invoice_prefix, defaults.tax.invoicePrefix).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase(), companyTitle: text(tax.company_title, defaults.tax.companyTitle), eInvoice: Boolean(tax.e_invoice), eArchive: tax.e_archive !== false,
    },
  };
}

