import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminCommerceSettings } from "@/components/admin-commerce-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const titles: Record<string, string> = { company: "Firma bilgileri", payment: "Ödeme ayarları", orders: "Sipariş ayarları", seo: "Arama motoru bilgileri", products: "Ürün ayarları", site: "Site yönetim araçları", texts: "Sistem metinleri", social: "Sosyal medya", marketing: "Dijital pazarlama", suppliers: "Tedarikçi ayarları" };

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");
  const { section } = await params;
  if (!titles[section]) notFound();
  return <AdminShell active={`/admin/settings/${section}`} eyebrow="MAĞAZA AYARLARI" title={titles[section]}>
    <AdminCommerceSettings section={section}/>
  </AdminShell>;
}
