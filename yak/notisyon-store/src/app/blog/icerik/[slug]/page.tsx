import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { getBlogPost, listBlogPosts } from "@/lib/blog-store";


const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const readingTime = (html: string) => Math.max(1, Math.ceil(plainText(html).split(" ").filter(Boolean).length / 190));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.seo_title || `${post.title} | Notisyon Rehber`,
    description: post.seo_description || post.excerpt,
    keywords: post.seo_keywords?.split(",").map((item) => item.trim()),
    alternates: { canonical: post.canonical_url || `/blog/icerik/${post.slug}` },
    robots: { index: post.indexable !== false, follow: post.follow_links !== false },
  };
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const allPosts = await listBlogPosts();
  const related = allPosts
    .filter((item) => item.id !== post.id && (item.category_id === post.category_id || !post.category_id))
    .slice(0, 3);
  const minutes = readingTime(post.content_html);
  const categoryHref = post.category_slug ? `/blog/kategori/${post.category_slug}` : "/blog";
  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="blog-public">
      <StoreHeader />
      <article className="blog-detail">
        <nav aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link><span>›</span>
          <Link href="/blog">Notisyon Rehber</Link><span>›</span>
          <Link href={categoryHref}>{post.category_name || "Blog"}</Link>
        </nav>

        <header>
          <span>{post.category_name || "NOTİSYON REHBER"}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="blog-detail-meta">
            <b>{post.author}</b><i />
            <time>{formattedDate}</time><i />
            <span>{minutes} dk okuma</span>
          </div>
        </header>

        {post.cover_image && (
          <div className="blog-detail-cover">
            <Image src={post.cover_image} alt={post.cover_alt || post.title} fill sizes="(max-width: 900px) 100vw, 1100px" priority />
          </div>
        )}

        <div className="blog-detail-layout">
          <aside>
            <div className="blog-detail-summary">
              <span>REHBER ÖZETİ</span>
              <p>{post.excerpt}</p>
              <Link href={categoryHref}>{post.category_name || "Tüm rehberler"} →</Link>
            </div>
            <div className="blog-share-card">
              <span>PAYLAŞ</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${process.env.NEXT_PUBLIC_SITE_URL || ""}/blog/icerik/${post.slug}`)}`}>WhatsApp</a>
              <a href={`mailto:?subject=${encodeURIComponent(post.title)}`}>E-posta</a>
            </div>
          </aside>

          <div>
            <div className="blog-article-content" dangerouslySetInnerHTML={{ __html: post.content_html }} />
            <section className="blog-article-cta">
              <span>NOTİSYON İLE PLANLAYIN</span>
              <h2>Hazırlıklarınızı tek bir yerde düzenleyin.</h2>
              <p>İhtiyaçlarınızı not alın, önceliklerinizi belirleyin ve süreci adım adım takip edin.</p>
              <Link href="/ceyiz-defteri">Çeyiz defterlerini keşfet →</Link>
            </section>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="blog-related">
          <header><div><span>DAHA FAZLA KEŞFET</span><h2>Benzer rehberler</h2></div><Link href={categoryHref}>Tümünü gör →</Link></header>
          <div>
            {related.map((item) => (
              <Link href={`/blog/icerik/${item.slug}`} key={item.id}>
                <span>{item.category_name || "REHBER"}</span>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <b>Rehberi incele →</b>
              </Link>
            ))}
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
