import type { Metadata } from "next";
import { connection } from "next/server";
import { BlogPublicIndex } from "@/components/blog-public-index";
import { listBlogCategories, listBlogPosts } from "@/lib/blog-store";
import { readPlatformSettings, settingBoolean, settingNumber } from "@/lib/platform-settings";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Notisyon Rehber | Çeyiz, Düğün ve Planlama",
  description: "Çeyiz, düğün, planlama ve kırtasiye dünyası için uygulanabilir listeler, karşılaştırmalar ve güncel rehberler.",
};

export default async function BlogPage() {
  await connection();
  const [posts, categories, platform] = await Promise.all([listBlogPosts(), listBlogCategories(), readPlatformSettings()]);
  if (!settingBoolean(platform.site, "blog_enabled", true)) notFound();
  return <BlogPublicIndex posts={posts.slice(0, Math.max(1, settingNumber(platform.site, "blog_page_size", 12)))} categories={categories} />;
}
