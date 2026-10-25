import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminDesignStudio } from "@/components/admin-design-studio";
import { AdminShell } from "@/components/admin-shell";
import { isAdminAuthenticated } from "@/lib/admin-auth";


export default async function HeaderDesignPage() {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");

  return <AdminShell active="/admin/theme/header" eyebrow="TASARIM · HEADER" title="Header ve menü tasarımı">
    <AdminDesignStudio initialTab="header"/>
  </AdminShell>;
}
