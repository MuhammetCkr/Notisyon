import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminControlCenter } from "@/components/admin-control-center";
import { AdminCatalogDictionary } from "@/components/admin-catalog-dictionary";
import { AdminBenefitCenter } from "@/components/admin-benefit-center";
import { AdminInventoryCenter } from "@/components/admin-inventory-center";
import { AdminEntityCenter } from "@/components/admin-entity-center";
import { AdminTeamCenter } from "@/components/admin-team-center";
import { AdminAutomationCenter } from "@/components/admin-automation-center";
import { AdminPosCenter } from "@/components/admin-pos-center";
import { AdminNotificationOperations } from "@/components/admin-notification-operations";
import { AdminSearchCenter } from "@/components/admin-search-center";
import { AdminCustomerGroups } from "@/components/admin-customer-groups";
import { AdminNewsletterCenter } from "@/components/admin-newsletter-center";
import { AdminApiAccessCenter } from "@/components/admin-api-access-center";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const entityModes = new Set(["order-stages", "customer-groups", "banners", "popups", "message-templates", "automation", "feeds", "contracts", "tax-rules", "regions"]);
const titles: Record<string, string> = { inventory: "Stok ve depo", shipping: "Kargo ve teslimat", payments: "Ödeme ayarları", tax: "Vergi ve fatura", team: "Ekip ve yetkiler", "api-access":"API ve WS yetkileri", audit: "Denetim kayıtları", notifications: "Bildirim merkezi", automation: "Otomasyonlar", localization: "Dil ve bölge", legal: "Yasal metinler", suppliers: "Tedarikçi yönetimi", tags: "Etiket yönetimi", "order-stages": "Sipariş aşamaları", pos: "Mağaza satışı", "customer-groups": "Müşteri grupları", membership: "Üyelik ayarları", "gift-cards": "Hediye çekleri", loyalty: "Puan ve sadakat", search: "Arama terimleri", banners: "Banner yönetimi", popups: "Popup yönetimi", "message-templates": "Mail ve SMS şablonları", "invoice-design": "Fatura tasarımı", contracts: "Sözleşmeler", cookies: "Çerez yönetimi", feeds: "XML ve ürün feed", "shipping-integrations": "Kargo entegrasyonları", currency: "Döviz kurları", "tax-rules": "Ek vergi yönetimi", regions: "Ülke ve bölge yönetimi" };


const titleOverrides:Record<string,string>={newsletter:"Bülten aboneleri"};

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");
  const { module } = await params;
  const content = module === "api-access" ? <AdminApiAccessCenter/>
    : module === "team" ? <AdminTeamCenter/>
    : module === "newsletter" ? <AdminNewsletterCenter/>
    : module === "search" ? <AdminSearchCenter/>
    : module === "customer-groups" ? <AdminCustomerGroups/>
    : module === "automation" ? <AdminAutomationCenter/>
    : module === "pos" ? <AdminPosCenter/>
    : module === "suppliers" || module === "tags" ? <AdminCatalogDictionary mode={module}/>
    : module === "inventory" ? <AdminInventoryCenter/>
    : module === "loyalty" ? <div className="control-stack"><AdminControlCenter mode="loyalty"/><AdminBenefitCenter mode="loyalty"/></div>
    : module === "gift-cards" || module === "audit" ? <AdminBenefitCenter mode={module}/>
    : module === "notifications" ? <div className="control-stack"><AdminControlCenter mode="notifications"/><AdminNotificationOperations/></div>
    : entityModes.has(module) ? <AdminEntityCenter mode={module}/>
    : <AdminControlCenter mode={module}/>;
  return <AdminShell active={`/admin/control/${module}`} eyebrow="YÖNETİM MODÜLÜ" title={titleOverrides[module] || titles[module] || "Mağaza yönetimi"}>{content}</AdminShell>;
}
