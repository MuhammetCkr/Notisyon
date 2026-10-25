import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminProductCreate } from "@/components/admin-product-create";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function NewProductPage(){
 await connection();
 if(!(await isAdminAuthenticated()))redirect("/admin-login");
 return <AdminShell active="/admin/products/new" eyebrow="KATALOG · YENİ KAYIT" title="Yeni ürün oluştur"><AdminProductCreate/></AdminShell>
}
