import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminProductManager } from "@/components/admin-product-manager";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function ProductsPage({searchParams}:{searchParams:Promise<{archive?:string}>}){await connection();if(!(await isAdminAuthenticated()))redirect("/admin-login");const query=await searchParams;const archive=query.archive==='1';const active=archive?"/admin/products?archive=1":"/admin/products";return <AdminShell active={active} eyebrow="KATALOG YÖNETİMİ" title={archive?"Ürün arşivi":"Ürün yönetimi"}><AdminProductManager initialFilter={archive?"archived":"active"}/></AdminShell>}
