import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CategoryCatalog } from "@/components/category-catalog";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { listStorefrontProducts } from "@/lib/storefront-catalog";
import { getCategoryBySlug, listCategoryChildren } from "@/lib/catalog-store";
import { readDesignConfig } from "@/lib/design-store";
import { readPlatformSettings } from "@/lib/platform-settings";


type CategoryDefinition = {
  title: string;
  eyebrow: string;
  description: string;
  match: string[];
  children?: { label: string; href: string }[];
};

const categories: Record<string, CategoryDefinition> = {
  "ceyiz-defteri": { title: "Çeyiz Defteri", eyebrow: "EVLİLİK HAZIRLIKLARI", description: "Çeyiz listesinden düğün bütçesine kadar bütün hazırlıklarını tek bir zarif düzende takip et.", match: ["Çeyiz Defteri"] },
  "tebrik-karti-30": { title: "Tebrik Kartları", eyebrow: "KÜÇÜK AMA ANLAMLI", description: "Siparişlerine ve hediyelerine kişisel, sıcak ve özenli bir dokunuş ekle.", match: ["Tebrik Kartı"], children: [{ label: "Teşekkür Kartları", href: "/tesekkur-kartlari" }] },
  "tesekkur-kartlari": { title: "Teşekkür Kartları", eyebrow: "TEŞEKKÜRÜN EN ZARİF HALİ", description: "Markanı ve hediyelerini tamamlayan, akılda kalan teşekkür kartlarını keşfet.", match: ["Tebrik Kartı>Teşekkür Kartları"] },
  "defter-31": { title: "Defterler", eyebrow: "YAZ · DÜŞÜN · HATIRLA", description: "Notlarını, fikirlerini ve günlük planlarını stiline uygun bir Notisyon defteriyle buluştur.", match: ["Defter"], children: [{ label: "Çizgili", href: "/cizgili" }, { label: "Kareli", href: "/kareli" }, { label: "Çizgisiz", href: "/cizgisiz" }, { label: "Çizgili–Kareli", href: "/cizgili-kareli" }, { label: "Çizgili–Çizgisiz", href: "/cizgili-cizgisiz" }] },
  "cizgili": { title: "Çizgili Defterler", eyebrow: "DÜZENLİ NOTLAR", description: "Günlük notların ve uzun yazıların için akıcı bir yazma deneyimi.", match: ["Defter>Çizgili-Kareli Defterler", "Defter>Çizgili-Çizgisiz Defterler"] },
  "kareli": { title: "Kareli Defterler", eyebrow: "PLANLI FİKİRLER", description: "Dersler, hesaplamalar ve düzenli taslaklar için kareli defter seçenekleri.", match: ["Defter>Çizgili-Kareli Defterler"] },
  "cizgisiz": { title: "Çizgisiz Defterler", eyebrow: "ÖZGÜR SAYFALAR", description: "Çizimlerin, eskizlerin ve sınırlandırılmamış fikirlerin için boş sayfalar.", match: ["Defter>Çizgisiz Defterler"] },
  "cizgili-kareli": { title: "Çizgili–Kareli Defterler", eyebrow: "İKİ DÜZEN BİR ARADA", description: "Yazı ve hesap çalışmalarını tek sette bir araya getiren kullanışlı defterler.", match: ["Defter>Çizgili-Kareli Defterler"] },
  "cizgili-cizgisiz": { title: "Çizgili–Çizgisiz Defterler", eyebrow: "YAZI VE TASARIM", description: "Yazmak ve özgürce çizmek isteyenler için dengeli defter setleri.", match: ["Defter>Çizgili-Çizgisiz Defterler"] },
  "planlayici-32": { title: "Planlayıcılar", eyebrow: "GÜNÜNÜ KENDİ RİTMİNDE PLANLA", description: "Günlük yaşamdan özel dönemlere kadar hedeflerini sade ve sürdürülebilir biçimde düzenle.", match: ["Planlayıcı"], children: [{ label: "Hamilelik Planlayıcıları", href: "/hamilelik-planlayicilari" }, { label: "Tüm Planlayıcılar", href: "/planlayicilar" }] },
  "hamilelik-planlayicilari": { title: "Hamilelik Planlayıcıları", eyebrow: "HER ANI HATIRLA", description: "Hamilelik yolculuğundaki notlarını, kontrollerini ve anılarını bir arada tut.", match: ["Planlayıcı>Hamilelik Planlayıcıları"] },
  "planlayicilar": { title: "Günlük Planlayıcılar", eyebrow: "PLANLA VE TAMAMLA", description: "Günün önceliklerini görünür kılan pratik ve motive edici planlayıcılar.", match: ["Planlayıcı>Planlayıcılar"] },
  "eglence-oyun": { title: "Eğlence & Oyun", eyebrow: "BİRLİKTE GÜZEL VAKİT", description: "Arkadaşlarınla ve sevdiklerinle geçirdiğin anları çoğaltan yaratıcı oyunlar.", match: ["Eğlence & Oyun"], children: [{ label: "Kutu Oyunları", href: "/kutu-oyunlari" }] },
  "kutu-oyunlari": { title: "Kutu Oyunları", eyebrow: "MASANIN ETRAFINDA BULUŞ", description: "Sohbeti başlatan, birlikte geçirilen zamanı unutulmaz kılan oyunlar.", match: ["Eğlence & Oyun>Kutu Oyunları"] },
  "dugun-nikah": { title: "Düğün & Nikâh", eyebrow: "ÖZEL GÜNLER İÇİN", description: "Nikâh ve düğün hazırlıklarına anlam katan zarif, hatırası kalıcı ürünler.", match: ["Düğün & Nikah"], children: [{ label: "Dini Nikâh Belgesi", href: "/dini-nikah-belgesi" }] },
  "dini-nikah-belgesi": { title: "Dini Nikâh Belgesi", eyebrow: "HATIRASI KALAN BİR İMZA", description: "Özel gününüzü şık ve anlamlı bir belgeyle kalıcı bir hatıraya dönüştürün.", match: ["Düğün & Nikah>Dini Nikah Belgesi"] },
  "baski-urunleri": { title: "Baskı Ürünleri", eyebrow: "MARKANA ÖZEL", description: "İşletmenin kimliğini tamamlayan sade ve profesyonel baskı çözümleri.", match: ["Baskı Ürünleri"], children: [{ label: "Kartvizit Baskı", href: "/kartvizit-baski" }] },
  "kartvizit-baski": { title: "Kartvizit Baskı", eyebrow: "İLK İZLENİMİNİ TASARLA", description: "Markanı doğru yansıtan, kaliteli ve profesyonel kartvizit baskıları.", match: ["Baskı Ürünleri>Kartvizit Baskı"] },
};

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const definition = categories[category];
  const managed=await getCategoryBySlug(category.replace(/-\d+$/, ""));
  if (!definition&&!managed) return {};
  const title=managed?.seo_title||`${managed?.name||definition?.title} | Notisyon`,description=managed?.seo_description||definition?.description||undefined;
  return { title, description, keywords:managed?.seo_keywords||undefined, alternates:{canonical:`/${managed?.slug||category}`}, robots:{index:managed?.indexable!==false,follow:managed?.follow_links!==false},openGraph:{title:managed?.social_title||title,description:managed?.social_description||description,images:managed?.social_image?[managed.social_image]:undefined} };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  await connection();
  const { category } = await params;
  const definition = categories[category];
  const managed=await getCategoryBySlug(category.replace(/-\d+$/, ""));
  if (!definition&&!managed) notFound();
  const managedChildren=managed?await listCategoryChildren(managed.id):[];
  const view={title:managed?.name||definition!.title,eyebrow:definition?.eyebrow||"NOTİSYON KOLEKSİYONU",description:managed?.seo_description||definition?.description||"Notisyon ürünlerini keşfedin.",match:definition?.match||[managed?.path||managed!.name],children:managedChildren.length?managedChildren.map(child=>({label:child.name,href:`/${child.slug}`})):definition?.children};

  const [products, design, platform] = await Promise.all([listStorefrontProducts(view.match), readDesignConfig(), readPlatformSettings()]);

  return (
    <main className="category-page">
      <StoreHeader />

      <div className="category-shell">
        <nav className="category-breadcrumb" aria-label="Sayfa yolu"><Link href="/">Ana sayfa</Link><span>›</span><span>{view.title}</span></nav>
        <header className="category-intro">
          <div><span>{view.eyebrow}</span><h1>{view.title}</h1></div>
          <div><p>{view.description}</p><small>{products.length} ürün</small></div>
        </header>
        {view.children?.length ? <nav className="category-subcategories" aria-label="Alt kategoriler">{view.children.map((child) => <Link href={child.href} key={child.href}>{child.label}<span>→</span></Link>)}</nav> : null}
        <CategoryCatalog products={products} filterConfig={managed?.filter_config} cardConfig={design.productCard} globalSettings={platform.products} texts={platform.texts}/>
        {managed?.description_html?<section className="category-managed-content"><span>KATEGORİ REHBERİ</span><h2>{managed.name} hakkında</h2><div dangerouslySetInnerHTML={{__html:managed.description_html}}/></section>:null}
      </div>
      <SiteFooter />
    </main>
  );
}
