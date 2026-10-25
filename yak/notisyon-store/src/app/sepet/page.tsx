import { CartContents } from "@/components/cart-contents";
import { readCommerceConfig } from "@/lib/store-config";
import { readPlatformSettings, settingText } from "@/lib/platform-settings";

export default async function CartPage() { const [config, platform] = await Promise.all([readCommerceConfig(), readPlatformSettings()]); return <CartContents shipping={config.shipping} currency={config.checkout.currency} emptyText={settingText(platform.texts, "empty_cart", "Sepetiniz şu an boş.")} freeShippingText={settingText(platform.texts, "free_shipping", "Ücretsiz kargo")} />; }
