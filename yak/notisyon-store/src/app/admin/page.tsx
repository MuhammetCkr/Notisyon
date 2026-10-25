import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminDashboard } from "@/components/admin-dashboard";
import { dashboardData } from "@/lib/admin-operations-store";

export default async function AdminPage({searchParams}:{searchParams:Promise<{range?:string}>}){await connection();if(!(await isAdminAuthenticated()))redirect("/admin-login");const params=await searchParams;const requested=Number(params.range);const range=[1,7,14,30].includes(requested)?requested:14;const data=await dashboardData(range);return <AdminShell active="/admin" eyebrow="OPERASYON MERKEZİ" title="Mağazanın genel görünümü"><AdminDashboard data={data}/></AdminShell>}
