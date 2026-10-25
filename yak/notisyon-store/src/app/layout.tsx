import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { connection } from "next/server";
import { CartProvider } from "@/components/cart";
import { SiteBlocks } from "@/components/site-blocks";
import { StorefrontExperience } from "@/components/storefront-experience";
import { StorefrontMarketing } from "@/components/storefront-marketing";
import { StorefrontMaintenance } from "@/components/storefront-maintenance";
import { StorefrontAnalytics } from "@/components/storefront-analytics";
import { readTheme } from "@/lib/theme-store";
import { readDesignConfig } from "@/lib/design-store";
import { readCommerceConfig } from "@/lib/store-config";
import { readPlatformSettings, settingBoolean, settingText } from "@/lib/platform-settings";
import "./globals.css";
import "./footer.css";
import "./category-cards.css";
import "./site-header.css";
import "./home-content-sections.css";
import "./category-page.css";
import "./admin.css";
import "./admin-catalog.css";
import "./admin-product-detail.css";
import "./admin-product-pro.css";
import "./admin-rich-editor.css";
import "./product-rich-description.css";
import "./admin-operations.css";
import "./admin-navigation.css";
import "./managed-content.css";
import "./admin-blog.css";
import "./blog.css";
import "./blog-premium.css";
import "./admin-enterprise.css";
import "./admin-files.css";
import "./admin-system.css";
import "./admin-pages-v2.css";
import "./admin-seo-v2.css";
import "./admin-orders-v2.css";
import "./admin-orders-complete.css";
import "./admin-dashboard-v2.css";
import "./admin-dashboard-v3.css";
import "./admin-command-search.css";
import "./admin-premium.css";
import "./admin-report-premium.css";
import "./admin-refinements.css";
import "./admin-integrations-premium.css";
import "./admin-catalog-premium.css";
import "./admin-customers-premium.css";
import "./admin-readable.css";
import "./admin-login-premium.css";
import "./admin-catalog-complete.css";
import "./admin-visual-system.css";
import "./admin-design-studio.css";
import "./storefront-design.css";
import "./admin-final-ui.css";
import "./admin-customers-complete.css";
import "./account.css";
import "./account-complete.css";
import "./search.css";
import "./admin-search-report.css";
import "./admin-customer-groups.css";
import "./storefront-experience.css";
import "./admin-automation.css";
import "./admin-seo-complete.css";
import "./legal.css";
import "./admin-pos.css";
import "./reviews.css";
import "./admin-notification-dispatch.css";
import "./admin-newsletter.css";
import "./admin-commerce-settings.css";
import "./admin-api-access.css";
import "./admin-polish.css";
import "./admin-ui-refresh.css";
import "./admin-ops-reports-v2.css";
import "./admin-premium-shell-v4.css";
import "./admin-premium-shell-v5.css";
import "./admin-unified-v6.css";
import "./admin-quality-v7.css";
import "./admin-login-corporate-v4.css";
import "./admin-alignment-v8.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [commerce, design, platform] = await Promise.all([readCommerceConfig(), readDesignConfig(), readPlatformSettings()]);
    const title = settingText(platform.seo, "site_title", `${commerce.general.storeName} | Planla. Yaz. Hatırla.`);
    const description = settingText(platform.seo, "site_description", "Defter, planlayıcı ve özel gün ürünleri.");
    const shareTitle = settingText(platform.social, "share_title", title);
    const shareDescription = settingText(platform.social, "share_description", description);
    const shareImage = settingText(platform.social, "share_image");
    const google = settingText(platform.seo, "google_verification"); const yandex = settingText(platform.seo, "yandex_verification"); const bing = settingText(platform.seo, "bing_verification"); const pinterest = settingText(platform.seo, "pinterest_verification");
    return { title, description, keywords: settingText(platform.seo, "site_keywords").split(",").map((item) => item.trim()).filter(Boolean), icons: design.brand.faviconUrl ? { icon: design.brand.faviconUrl } : undefined, verification: { ...(google ? { google } : {}), ...(yandex ? { yandex } : {}), other: { ...(bing ? { "msvalidate.01": bing } : {}), ...(pinterest ? { "p:domain_verify": pinterest } : {}) } }, openGraph: { title: shareTitle, description: shareDescription, siteName: commerce.general.storeName, locale: "tr_TR", type: "website", images: shareImage ? [shareImage] : undefined } };
  } catch { return { title: "Notisyon | Planla. Yaz. Hatırla.", description: "Defter, planlayıcı ve özel gün ürünleri." }; }
}

async function getThemeCode() {
  try { const theme = await readTheme(); return { css: theme.custom_css, js: theme.custom_js }; }
  catch { return { css: "", js: "" }; }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const [theme, design, platform] = await Promise.all([getThemeCode(), readDesignConfig(), readPlatformSettings()]);
  const style = {
    "--store-primary": design.brand.primaryColor,
    "--store-accent": design.brand.accentColor,
    "--store-page-bg": design.brand.pageBackground,
    "--store-font": design.brand.fontFamily,
    "--store-content-width": `${design.brand.contentWidth}px`,
    "--store-announcement-bg": design.announcement.background,
    "--store-announcement-color": design.announcement.color,
    "--product-columns": String(design.productCard.desktopColumns),
    "--product-mobile-columns": String(design.productCard.mobileColumns),
    "--product-ratio": design.productCard.imageRatio === "portrait" ? "4/5" : design.productCard.imageRatio === "landscape" ? "4/3" : "1/1",
  } as CSSProperties;
  return (
    <html lang="tr">
      <head>
        {design.brand.faviconUrl ? <link rel="icon" href={design.brand.faviconUrl} /> : null}
        {theme.css ? (
          <style
            id="notisyon-custom-theme"
            dangerouslySetInnerHTML={{ __html: theme.css }}
          />
        ) : null}
      </head>
      <body className={`${design.productCard.showBrand ? "" : "store-hide-brand"} ${design.productCard.showBadges ? "" : "store-hide-badges"} ${settingBoolean(platform.products,"show_prices",true)&&!settingBoolean(platform.products,"members_only_prices")?"":"store-hide-prices store-hide-purchase"}`} data-product-card-style={design.productCard.style} style={style}>
        <CartProvider><StorefrontExperience/><StorefrontMarketing/><StorefrontAnalytics/><StorefrontMaintenance enabled={settingBoolean(platform.site, "maintenance_mode")} title={settingText(platform.texts, "maintenance_title", "Kısa bir bakım arasındayız")} text={settingText(platform.texts, "maintenance_text", "Mağazamızı daha iyi hale getiriyoruz.")}/><SiteBlocks location="page_top" />{children}<SiteBlocks location="page_bottom" /></CartProvider>
        {theme.js ? (
          <script
            id="notisyon-custom-script"
            dangerouslySetInnerHTML={{ __html: theme.js }}
          />
        ) : null}
      </body>
    </html>
  );
}
