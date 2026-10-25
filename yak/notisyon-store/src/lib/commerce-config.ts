export type CommerceConfig = {
  general: { storeName: string; supportEmail: string; supportPhone: string; orderPrefix: string; storeStatus: string; maintenanceMode: boolean; guestCheckout: boolean };
  shipping: { provider: string; freeShippingThreshold: number; flatRate: number; estimatedDays: string; sameDayCutoff: string; trackingNotifications: boolean };
  checkout: { minimumOrderTotal: number; minimumItemCount: number; currency: string; cardEnabled: boolean; installments: boolean; bankTransfer: boolean; cashOnDelivery: boolean; cashOnDeliveryFee: number; cashOnDeliveryMin: number; cashOnDeliveryMax: number };
  tax: { pricesIncludeTax: boolean; defaultVat: number; invoicePrefix: string; companyTitle: string; eInvoice: boolean; eArchive: boolean };
};

export function calculateShipping(subtotal: number, shipping: CommerceConfig["shipping"]) {
  if (subtotal <= 0 || shipping.freeShippingThreshold === 0 || subtotal >= shipping.freeShippingThreshold) return 0;
  return Math.max(0, shipping.flatRate);
}
