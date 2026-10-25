import Image from "next/image";
import Link from "next/link";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import type { BlogCategory, BlogPost } from "@/lib/blog-store";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BlogPublicIndex({
  posts,
  categories,
  activeCategory,
}: {
  posts: BlogPost[];
  categories: BlogCategory[];
  activeCategory?: BlogCategory | null;
}) {
  const pageTitle = activeCategory
    ? activeCategory.name
    : "Notisyon Rehber";
  const pageDescription = activeCategory?.description ||
    "Çeyiz ve düğün hazırlığından planlama alışkanlıklarına kadar karar vermeyi kolaylaştıran kontrol listeleri, karşılaştırmalar ve uzman önerileri.";

  return (
    <main className="blog-public">
      <StoreHeader />

      <section className="blog-directory-head">
        <nav aria-label="Sayfa yolu"><Link href="/">Ana sayfa</Link><span>›</span>{activeCategory ? <><Link href="/blog">Rehber</Link><span>›</span><b>{activeCategory.name}</b></> : <b>Rehber</b>}</nav>
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
        <nav className="blog-category-nav" aria-label="Rehber kategorileri">
          <Link className={!activeCategory ? "active" : ""} href="/blog">Tümü</Link>
          {categories.map((category) => (
            <Link className={activeCategory?.id === category.id ? "active" : ""} href={`/blog/kategori/${category.slug}`} key={category.id}>{category.name}</Link>
          ))}
        </nav>
      </section>

      <section className="blog-tool-cta">
        <div>
          <span>ÜCRETSİZ PLANLAMA ARACI</span>
          <h2>Çeyiz hazırlığını kendi listene göre planla.</h2>
          <p>Ürünleri kategori kategori işaretle, tamamlanma durumunu ve ihtiyaçlarını tek yerde gör.</p>
        </div>
        <Link href="/ceyiz-defteri">Çeyiz defterlerini keşfet <i>→</i></Link>
      </section>

      <section className="blog-index">
        <header>
          <div>
            <span>{activeCategory ? "KATEGORİ İÇERİKLERİ" : "GÜNCEL İÇERİKLER"}</span>
            <h2>{activeCategory?.name || "Yeni rehberler"}</h2>
          </div>
          <p>{posts.length} rehber</p>
        </header>
        <div className="blog-card-grid">
          {posts.map((post) => (
            <article key={post.id}>
              <Link className="blog-card-image" href={`/blog/icerik/${post.slug}`}>
                {post.cover_image ? <Image src={post.cover_image} alt={post.cover_alt || post.title} fill sizes="(max-width: 700px) 100vw, 33vw" /> : <span>N</span>}
              </Link>
              <div>
                <h3><Link href={`/blog/icerik/${post.slug}`}>{post.title}</Link></h3>
                <span>{post.category_name || "REHBER"}</span>
                <p>{post.excerpt}</p>
                <small>{formatDate(post.published_at || post.created_at)}</small>
                <Link href={`/blog/icerik/${post.slug}`}>Devamını oku</Link>
              </div>
            </article>
          ))}
          {!posts.length && (
            <div className="blog-public-empty">
              <b>İlk rehber hazırlanıyor.</b>
              <p>Yeni içerikler çok yakında burada olacak.</p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
