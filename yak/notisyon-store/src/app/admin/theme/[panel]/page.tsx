import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { AdminDesignStudio, type DesignStudioTab } from "@/components/admin-design-studio";
import { isAdminAuthenticated } from "@/lib/admin-auth";


const panelTitles: Record<DesignStudioTab, string> = {
  identity: "Görsel kimlik",
  header: "Header ve menü",
  footer: "Footer",
  cards: "Ürün kartları",
  home: "Sayfa tasarımı",
  code: "Gelişmiş tema kodları",
};

export default async function ThemePanelPage({ params }: { params: Promise<{ panel: string }> }) {
  await connection();
  if (!(await isAdminAuthenticated())) redirect("/admin-login");
  const { panel } = await params;
  if (!(panel in panelTitles)) redirect("/admin/theme/identity");
  const selectedPanel = panel as DesignStudioTab;

  return <AdminShell
    active={`/admin/theme/${selectedPanel}`}
    eyebrow="TASARIM · TEMA YÖNETİMİ"
    title={panelTitles[selectedPanel]}
    actions={<Link className="admin-section-link" href="/admin/blocks">Blok yönetimine geç →</Link>}
  >
    <AdminDesignStudio initialTab={selectedPanel} key={selectedPanel}/>
  </AdminShell>;
}
