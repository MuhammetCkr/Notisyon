import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BlogPublicIndex } from "@/components/blog-public-index";
import { listBlogCategories, listBlogPosts } from "@/lib/blog-store";
import { readPlatformSettings, settingBoolean, settingNumber } from "@/lib/platform-settings";


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = (await listBlogCategories()).find((item) => item.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} | Notisyon Rehber`,
    description: category.description || `${category.name} konusundaki güncel Notisyon rehberlerini keşfedin.`,
  };
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const [allPosts, categories, platform] = await Promise.all([listBlogPosts(), listBlogCategories(), readPlatformSettings()]);
  if (!settingBoolean(platform.site, "blog_enabled", true)) notFound();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const posts = allPosts.filter((post) => post.category_id === category.id).slice(0, Math.max(1, settingNumber(platform.site, "blog_page_size", 12)));
  return <BlogPublicIndex posts={posts} categories={categories} activeCategory={category} />;
}
