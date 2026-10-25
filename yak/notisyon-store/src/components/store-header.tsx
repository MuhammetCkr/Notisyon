/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CartLink } from "@/components/cart";
import { readDesignConfig } from "@/lib/design-store";
import { applyDesignTemplate } from "@/lib/design-template";
import { StoreSearch } from "@/components/store-search";
import { readPlatformSettings, settingBoolean } from "@/lib/platform-settings";

export async function StoreHeader() {
  const [design, platform] = await Promise.all([readDesignConfig(), readPlatformSettings()]);
  const announcement = design.announcement;
  const menu = settingBoolean(platform.site, "show_categories_in_menu", true) ? design.header.menu.filter((item) => item.visible) : [];
  if (design.header.sourceMode && design.header.customHtml.trim()) {
    const menuHtml = menu.map((item) => `<a href="${item.href.replace(/"/g, "&quot;")}">${item.label.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character)}</a>`).join("");
    const html = applyDesignTemplate(design.header.customHtml, { logo_url: design.brand.logoUrl, logo_alt: design.brand.logoAlt, announcement_text: announcement.text, menu_html: menuHtml, account_url: "/hesabim", cart_url: "/sepet" }, ["menu_html"]);
    return <>{announcement.enabled && (announcement.href ? <Link className="announcement" href={announcement.href}>{announcement.text}</Link> : <div className="announcement">{announcement.text}</div>)}<header className="notisyon-source-header" data-sticky={String(design.header.sticky)}>{design.header.customCss.trim() ? <style>{design.header.customCss}</style> : null}<div dangerouslySetInnerHTML={{ __html: html }}/></header></>;
  }
  return <>{announcement.enabled && (announcement.href ? <Link className="announcement" href={announcement.href}>{announcement.text}</Link> : <div className="announcement">{announcement.text}</div>)}<header className="notisyon-site-header" data-layout={design.header.layout} data-sticky={String(design.header.sticky)}><div className="notisyon-header-inner"><Link className="notisyon-header-logo" href="/" aria-label={`${design.brand.logoAlt} ana sayfa`}><img src={design.brand.logoUrl} alt={design.brand.logoAlt}/></Link>{menu.length?<nav className="notisyon-header-nav" aria-label="Ana menü">{menu.map((item) => <Link href={item.href} key={item.id}>{item.label}</Link>)}</nav>:null}<StoreSearch/><div className="notisyon-header-actions">{design.header.showAccount && <Link href="/hesabim" className="notisyon-account"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg><span>Hesabım</span></Link>}{design.header.showCart && <CartLink/>}</div></div></header></>;
}
