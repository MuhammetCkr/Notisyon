import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminBlockManager } from "@/components/admin-block-manager";
import { AdminShell } from "@/components/admin-shell";
import { isAdminAuthenticated } from "@/lib/admin-auth";


export default async function BlocksPage() {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");

  return (
    <AdminShell
      active="/admin/blocks"
      eyebrow="İÇERİK VE TASARIM"
      title="Blok yönetimi"
      actions={<Link className="admin-section-link" href="/admin/theme">Tema yönetimine geç →</Link>}
    >
      <section className="block-page-intro">
        <div>
          <span>SAYFA YERLEŞİMİ</span>
          <h2>İçerik bloklarını bağımsız yönetin</h2>
          <p>HTML bloklarını sayfa ve konuma göre hazırlayın, sıralayın ve mağazada yayınlayın.</p>
        </div>
        <div className="block-page-steps">
          <span><b>01</b> Sayfayı seç</span>
          <span><b>02</b> Konumu belirle</span>
          <span><b>03</b> İçeriği yayınla</span>
        </div>
      </section>
      <AdminBlockManager />
    </AdminShell>
  );
}
