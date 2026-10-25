import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";


export default async function ThemePage() {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");
  redirect("/admin/theme/identity");
}
