import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function CategoriesPage(){await connection();if(!(await isAdminAuthenticated()))redirect("/admin-login");return <AdminShell active="/admin/categories" title="Kategoriler"><AdminCategoryManager/></AdminShell>}
