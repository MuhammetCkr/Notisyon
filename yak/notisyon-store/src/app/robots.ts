import type { MetadataRoute } from "next";
import { readPlatformSettings, settingText } from "@/lib/platform-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://notisyon.com").replace(/\/$/, "");
  const platform = await readPlatformSettings();
  const source = settingText(platform.seo, "robots_content");
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  const allow = lines.filter((line) => /^allow\s*:/i.test(line)).map((line) => line.replace(/^allow\s*:/i, "").trim()).filter(Boolean);
  const disallow = lines.filter((line) => /^disallow\s*:/i.test(line)).map((line) => line.replace(/^disallow\s*:/i, "").trim()).filter(Boolean);
  const sitemap = lines.filter((line) => /^sitemap\s*:/i.test(line)).map((line) => line.replace(/^sitemap\s*:/i, "").trim()).filter(Boolean);
  return { rules: { userAgent: "*", allow: allow.length ? allow : "/", disallow: disallow.length ? disallow : ["/admin", "/api/admin", "/odeme"] }, sitemap: sitemap.length ? sitemap : `${base}/sitemap.xml`, host: base };
}
