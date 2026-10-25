import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { getDb } from "@/lib/db";

const slugTypes: Record<string, string> = { "mesafeli-satis": "Mesafeli satış", "on-bilgilendirme": "Ön bilgilendirme", kvkk: "KVKK", gizlilik: "Gizlilik", "iade-kosullari": "İade koşulları", "cerez-politikasi": "Çerez politikası" };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `${slugTypes[slug] || "Yasal Metin"} | Notisyon` }; }
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const type = slugTypes[slug]; if (!type) notFound(); const row = (await getDb().query(`SELECT name,data,updated_at FROM admin_entities WHERE module='contracts' AND status='active' AND data->>'type'=$1 ORDER BY sort_order LIMIT 1`, [type])).rows[0]; if (!row) notFound(); return <><StoreHeader/><main className="legal-page"><header><span>YASAL BİLGİLENDİRME</span><h1>{row.name}</h1><p>Sürüm {String(row.data.version || "1.0")} · Son güncelleme {new Date(row.updated_at).toLocaleDateString("tr-TR")}</p></header><article dangerouslySetInnerHTML={{ __html: String(row.data.content || "") }}/></main><SiteFooter/></>; }
