"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminRichTextEditor } from "@/components/admin-rich-text-editor";

type Category = { id: string; name: string; slug: string; description?: string };
type Post = {
  id?: string;
  category_id: string;
  category_name?: string;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  cover_image: string;
  cover_alt: string;
  author: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  canonical_url: string;
  indexable: boolean;
  follow_links: boolean;
  published: boolean;
  featured: boolean;
  published_at: string;
};
type Filter = "all" | "published" | "draft" | "featured";

const empty: Post = {
  category_id: "", title: "", slug: "", excerpt: "", content_html: "", cover_image: "", cover_alt: "",
  author: "Notisyon", seo_title: "", seo_description: "", seo_keywords: "", canonical_url:"", indexable:true, follow_links:true, published: false, featured: false, published_at: "",
};

const slugify = (value: string) => value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const textLength = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
const normalizePost = (post: Partial<Post>): Post => ({
  ...empty,
  ...post,
  category_id: post.category_id || "",
  title: post.title || "",
  slug: post.slug || "",
  excerpt: post.excerpt || "",
  content_html: post.content_html || "",
  cover_image: post.cover_image || "",
  cover_alt: post.cover_alt || "",
  author: post.author || "Notisyon",
  seo_title: post.seo_title || "",
  seo_description: post.seo_description || "",
  seo_keywords: post.seo_keywords || "",
  canonical_url: post.canonical_url || "",
  indexable: post.indexable !== false,
  follow_links: post.follow_links !== false,
  published: !!post.published,
  featured: !!post.featured,
  published_at: post.published_at || "",
});

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "İşlem başarısız");
  return data;
}

export function AdminBlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [edit, setEdit] = useState<Post | null>(null);
  const [categoryEdit, setCategoryEdit] = useState<Partial<Category> | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState("Rehber içerikleri yükleniyor…");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const data = await request("/api/admin/blog");
    setPosts(data.posts.map(normalizePost));
    setCategories(data.categories);
    setStatus(`${data.posts.length} içerik · ${data.categories.length} koleksiyon`);
  };
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const shown = useMemo(() => posts.filter((post) => {
    const queryMatches = `${post.title} ${post.category_name || ""}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
    const filterMatches = filter === "all" || (filter === "published" && post.published) || (filter === "draft" && !post.published) || (filter === "featured" && post.featured);
    return queryMatches && filterMatches;
  }), [posts, query, filter]);

  const editorialChecks = useMemo(() => edit ? [
    { label: "Başlık ve URL hazır", ok: edit.title.trim().length >= 15 && !!edit.slug },
    { label: "Koleksiyon seçildi", ok: !!edit.category_id },
    { label: "Özet yeterince açıklayıcı", ok: edit.excerpt.trim().length >= 80 },
    { label: "Ana içerik tamamlandı", ok: textLength(edit.content_html) >= 300 },
    { label: "Kapak ve alternatif metin var", ok: !!edit.cover_image && edit.cover_alt.trim().length >= 8 },
    { label: "SEO başlığı ve açıklaması hazır", ok: edit.seo_title.trim().length >= 30 && edit.seo_description.trim().length >= 80 },
  ] : [], [edit]);
  const editorialScore = editorialChecks.length ? Math.round((editorialChecks.filter((item) => item.ok).length / editorialChecks.length) * 100) : 0;

  function change<K extends keyof Post>(key: K, value: Post[K]) { setEdit((current) => current ? { ...current, [key]: value } : current); }

  async function save() {
    if (!edit?.title.trim()) return setStatus("Başlık zorunludur.");
    if (!edit.slug.trim()) return setStatus("URL adresi zorunludur.");
    setSaving(true);
    try {
      await request("/api/admin/blog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...edit, slug: edit.slug || slugify(edit.title), resource: "post" }) });
      setEdit(null);
      await load();
      setStatus(edit.published ? "İçerik kaydedildi ve rehberde yayınlandı." : "Taslak güvenle kaydedildi.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Kaydedilemedi"); }
    finally { setSaving(false); }
  }

  async function upload(file?: File) {
    if (!file || !edit) return;
    setStatus("Kapak görseli yükleniyor…");
    const form = new FormData(); form.append("folder", "blog"); form.append("files", file);
    try { const data = await request("/api/admin/uploads", { method: "POST", body: form }); change("cover_image", data.urls[0]); setStatus("Kapak görseli yüklendi."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Görsel yüklenemedi"); }
  }

  async function saveCategory() {
    if (!categoryEdit?.name) return;
    await request("/api/admin/blog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...categoryEdit, slug: categoryEdit.slug || slugify(categoryEdit.name), resource: "category" }) });
    setCategoryEdit(null); await load();
  }

  async function remove(resource: "blog-posts" | "blog-categories", id?: string) {
    if (!id || !confirm("Bu kayıt silinsin mi?")) return;
    await request(`/api/admin/blog?resource=${resource}&id=${id}`, { method: "DELETE" });
    if (resource === "blog-posts") setEdit(null);
    await load();
  }

  return <div className="blog-admin">
    <section className="blog-admin-overview" aria-label="Rehber özeti"><article><b>{posts.filter((item) => item.published).length}</b><span>Yayında</span></article><article><b>{posts.filter((item) => !item.published).length}</b><span>Taslak</span></article><article><b>{posts.filter((item) => item.featured).length}</b><span>Öne çıkan</span></article><article><b>{categories.length}</b><span>Koleksiyon</span></article></section>

    <nav className="blog-admin-actions"><button type="button" onClick={() => setEdit({ ...empty })}>＋ Yeni içerik oluştur</button><button type="button" className="secondary" onClick={() => setCategoryEdit({ name: "", slug: "", description: "" })}>Koleksiyonları yönet</button><a href="/blog" target="_blank" rel="noreferrer">Rehberi görüntüle ↗</a><span>{status}</span></nav>

    <section className="blog-admin-list">
      <header><div><span>YAYIN PLANI</span><h3>Tüm içerikler</h3></div><label>⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık veya koleksiyon ara" /></label></header>
      <div className="blog-filter-tabs" aria-label="İçerik durumu filtreleri">{([
        ["all", "Tümü", posts.length], ["published", "Yayında", posts.filter((item) => item.published).length], ["draft", "Taslak", posts.filter((item) => !item.published).length], ["featured", "Öne çıkan", posts.filter((item) => item.featured).length],
      ] as const).map(([value, label, count]) => <button type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{label}<b>{count}</b></button>)}</div>
      <div className="blog-table"><div className="blog-table-head"><span>İçerik</span><span>Koleksiyon</span><span>Yayın tarihi</span><span>Durum</span><span /></div>{shown.map((post) => <button type="button" className="blog-table-row" onClick={() => setEdit({ ...post, published_at: post.published_at?.slice(0, 16) || "" })} key={post.id}><span>{post.cover_image ? <img src={post.cover_image} alt="" /> : <i>YAZI</i>}<b>{post.title}<small>/{post.slug}</small></b></span><span>{post.category_name || "Koleksiyonsuz"}</span><span>{post.published_at ? new Date(post.published_at).toLocaleDateString("tr-TR") : "—"}</span><em className={post.published ? "live" : ""}>{post.published ? "Yayında" : "Taslak"}</em><strong>Düzenle →</strong></button>)}{!shown.length && <p className="blog-empty">Bu filtreye uyan içerik bulunamadı.</p>}</div>
    </section>

    {edit && <div className="blog-editor-bg"><section className="blog-editor">
      <header><div><span>REHBER İÇERİĞİ</span><h2>{edit.id ? "Yazıyı düzenle" : "Yeni rehber oluştur"}</h2></div><div className="blog-editor-header-actions">{edit.slug && <a href={`/blog/icerik/${edit.slug}`} target="_blank" rel="noreferrer">Ön izleme ↗</a>}<button type="button" aria-label="Editörü kapat" onClick={() => setEdit(null)}>×</button></div></header>
      <div className="blog-editor-grid"><main>
        <article className="blog-editor-card"><div className="blog-card-heading"><div><span>01</span><h3>Başlık ve özet</h3></div><p>Okurun rehberi neden açması gerektiğini tek bakışta anlatın.</p></div><label>Yazı başlığı<input value={edit.title} onChange={(event) => { const value = event.target.value; setEdit({ ...edit, title: value, ...(!edit.id && !edit.slug ? { slug: slugify(value) } : {}) }); }} placeholder="Açık, fayda odaklı içerik başlığı" /></label><label>URL adresi<div className="slug-input"><span>/blog/icerik/</span><input value={edit.slug} onChange={(event) => change("slug", slugify(event.target.value))} /></div></label><label>Kısa açıklama<textarea value={edit.excerpt} onChange={(event) => change("excerpt", event.target.value)} maxLength={500} placeholder="Listeleme ve arama sonuçlarında görünecek özeti yazın" /><small>{edit.excerpt.length}/500</small></label></article>
        <AdminRichTextEditor label="Rehber içeriği" value={edit.content_html} onChange={(value) => change("content_html", value)} />
        <article className="blog-editor-card seo"><div className="blog-card-heading"><div><span>03</span><h3>Arama görünümü</h3></div><p>Google sonucunda başlığın ve açıklamanın nasıl anlatılacağını yönetin.</p></div><div className="blog-serp-preview"><small>notisyon.com › blog › içerik</small><b>{edit.seo_title || edit.title || "Rehber başlığı"}</b><p>{edit.seo_description || edit.excerpt || "Arama sonucunda gösterilecek açıklama burada görünür."}</p></div><label>SEO başlığı<input value={edit.seo_title} onChange={(event) => change("seo_title", event.target.value)} maxLength={70} /><small className={edit.seo_title.length > 60 ? "warning" : ""}>{edit.seo_title.length}/70</small></label><label>SEO açıklaması<textarea value={edit.seo_description} onChange={(event) => change("seo_description", event.target.value)} maxLength={160} /><small className={edit.seo_description.length > 155 ? "warning" : ""}>{edit.seo_description.length}/160</small></label><label>Anahtar kelimeler<input value={edit.seo_keywords} onChange={(event) => change("seo_keywords", event.target.value)} placeholder="çeyiz listesi, düğün planlama" /></label><label>Canonical URL<input value={edit.canonical_url} onChange={(event)=>change("canonical_url",event.target.value)} placeholder={`https://notisyon.com/blog/icerik/${edit.slug||"yazi"}`}/></label><div className="robot-grid"><label>Arama motoru dizini<select value={edit.indexable?"index":"noindex"} onChange={event=>change("indexable",event.target.value==="index")}><option value="index">Index — listele</option><option value="noindex">No index — listeleme</option></select></label><label>Bağlantı takibi<select value={edit.follow_links?"follow":"nofollow"} onChange={event=>change("follow_links",event.target.value==="follow")}><option value="follow">Follow — takip et</option><option value="nofollow">No follow — takip etme</option></select></label></div></article>
      </main><aside>
        <article className="blog-editor-card blog-editorial-score"><div><span style={{ "--score": `${editorialScore * 3.6}deg` } as React.CSSProperties}><b>{editorialScore}</b><small>/100</small></span><div><h3>Yayın kalitesi</h3><p>{editorialScore >= 80 ? "Yayın için güçlü görünüyor." : "Eksik alanları tamamlayın."}</p></div></div><ul>{editorialChecks.map((item) => <li className={item.ok ? "done" : ""} key={item.label}><i>{item.ok ? "✓" : "·"}</i>{item.label}</li>)}</ul></article>
        <article className="blog-editor-card"><h3>Yayın durumu</h3><label className="blog-toggle"><input type="checkbox" checked={edit.published} onChange={(event) => change("published", event.target.checked)} /><span />Yayında</label><label className="blog-toggle"><input type="checkbox" checked={edit.featured} onChange={(event) => change("featured", event.target.checked)} /><span />Öne çıkan içerik</label><label>Yayın tarihi<input type="datetime-local" value={edit.published_at} onChange={(event) => change("published_at", event.target.value)} /></label><p className="blog-field-help">Yayın tarihi boş bırakılırsa içerik ilk yayın anında tarih alır.</p></article>
        <article className="blog-editor-card"><h3>Koleksiyon ve yazar</h3><label>Koleksiyon<select value={edit.category_id || ""} onChange={(event) => change("category_id", event.target.value)}><option value="">Koleksiyon seçin</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Yazar<input value={edit.author} onChange={(event) => change("author", event.target.value)} /></label></article>
        <article className="blog-editor-card"><h3>Kapak görseli</h3><p className="blog-field-help">Yatay, yüksek kaliteli ve yazısız bir görsel önerilir.</p><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void upload(event.target.files?.[0])} />{edit.cover_image ? <div className="blog-cover-preview"><img src={edit.cover_image} alt={edit.cover_alt} /><button type="button" onClick={() => change("cover_image", "")}>Kaldır</button></div> : <button type="button" className="blog-upload" onClick={() => fileRef.current?.click()}>＋ Bilgisayardan görsel seç</button>}<label>Görsel açıklaması<input value={edit.cover_alt} onChange={(event) => change("cover_alt", event.target.value)} placeholder="Görselde ne olduğunu açıklayın" /></label></article>
      </aside></div>
      <footer>{edit.id && <button type="button" className="danger" onClick={() => void remove("blog-posts", edit.id)}>Yazıyı sil</button>}<span>{edit.published ? "Kaydettiğinizde değişiklikler mağazada görünür." : "İçerik taslak olarak saklanacak."}</span><button type="button" className="secondary" onClick={() => setEdit(null)}>Vazgeç</button><button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Kaydediliyor…" : edit.published ? "Kaydet ve yayınla" : "Taslağı kaydet"}</button></footer>
    </section></div>}

    {categoryEdit && <div className="blog-editor-bg"><section className="blog-category-modal"><header><div><span>İÇERİK MİMARİSİ</span><h2>Rehber koleksiyonları</h2></div><button type="button" onClick={() => setCategoryEdit(null)}>×</button></header><p className="blog-category-intro">Okurun ihtiyacına göre gezinebileceği açık ve anlamlı konu başlıkları oluşturun.</p><div className="category-list">{categories.map((category) => <div key={category.id}><b>{category.name}<small>/blog/kategori/{category.slug}</small></b><button type="button" onClick={() => setCategoryEdit(category)}>Düzenle</button><button type="button" onClick={() => void remove("blog-categories", category.id)}>Sil</button></div>)}</div><label>Koleksiyon adı<input value={categoryEdit.name || ""} onChange={(event) => setCategoryEdit({ ...categoryEdit, name: event.target.value, slug: categoryEdit.id ? categoryEdit.slug : slugify(event.target.value) })} /></label><label>URL adresi<div className="slug-input"><span>/blog/kategori/</span><input value={categoryEdit.slug || ""} onChange={(event) => setCategoryEdit({ ...categoryEdit, slug: slugify(event.target.value) })} /></div></label><label>Koleksiyon açıklaması<textarea value={categoryEdit.description || ""} onChange={(event) => setCategoryEdit({ ...categoryEdit, description: event.target.value })} /></label><footer><button type="button" className="secondary" onClick={() => setCategoryEdit({ name: "", slug: "", description: "" })}>Yeni koleksiyon</button><button type="button" onClick={() => void saveCategory()}>Koleksiyonu kaydet</button></footer></section></div>}
  </div>;
}
