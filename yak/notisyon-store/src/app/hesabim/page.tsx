import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { CustomerAccount } from "@/components/customer-account";

export const metadata = { title: "Hesabım | Notisyon", description: "Notisyon müşteri hesabınızı ve siparişlerinizi yönetin." };
export default function AccountPage() { return <><StoreHeader/><CustomerAccount/><SiteFooter/></>; }
