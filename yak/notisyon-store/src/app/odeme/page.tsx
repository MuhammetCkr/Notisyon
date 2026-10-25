import { CheckoutForm } from "@/components/checkout-form";
import { readCommerceConfig } from "@/lib/store-config";
import { readCustomerSession } from "@/lib/customer-auth";

export default async function CheckoutPage() { const [config, customer] = await Promise.all([readCommerceConfig(), readCustomerSession()]); return <CheckoutForm config={config} customer={customer} />; }
