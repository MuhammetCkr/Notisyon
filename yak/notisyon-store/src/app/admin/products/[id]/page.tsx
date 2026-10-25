import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminProductDetail } from "@/components/admin-product-detail";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function ProductDetailPage({params}:PageProps<"/admin/products/[id]">){await connection();if(!(await isAdminAuthenticated()))redirect("/admin-login");const {id}=await params;return <AdminShell active="/admin/products" title="Ürün düzenleme"><AdminProductDetail id={id}/></AdminShell>}
