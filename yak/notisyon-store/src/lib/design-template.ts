export const HEADER_SOURCE_TEMPLATE = `<div class="custom-store-header">
  <a class="custom-store-logo" href="/">
    <img src="{{logo_url}}" alt="{{logo_alt}}">
  </a>
  <nav class="custom-store-menu">{{menu_html}}</nav>
  <div class="custom-store-actions">
    <a href="/hesabim">Hesabım</a>
    <a href="/sepet">Sepet</a>
  </div>
</div>`;

export const HEADER_SOURCE_CSS = `.custom-store-header {
  max-width: var(--notisyon-content-width);
  min-height: 84px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  background: #fff;
}
.custom-store-logo img { width: 150px; height: auto; display: block; }
.custom-store-menu { display: flex; gap: 24px; flex-wrap: wrap; }
.custom-store-menu a, .custom-store-actions a { color: #151827; text-decoration: none; font-weight: 700; }
.custom-store-actions { display: flex; gap: 16px; }
@media (max-width: 800px) { .custom-store-menu { display: none; } }`;

export const FOOTER_SOURCE_TEMPLATE = `<section class="custom-footer-newsletter">
  <div class="custom-newsletter-copy">
    <small>NOTİSYON</small>
    <h2>Notisyon’dan haberdar ol.</h2>
    <p>Yeni ürünler, özel koleksiyonlar ve fırsatlardan ilk sen haberdar ol.</p>
  </div>
  <form class="custom-newsletter-form" action="/api/newsletter" method="post">
    <input class="custom-newsletter-input" type="email" name="email" required placeholder="E-posta adresin">
    <button type="submit">KAYDOL</button>
    <label><input type="checkbox" name="consent" value="true" required> Üyelik koşullarını ve kişisel verilerimin korunmasını kabul ediyorum.</label>
  </form>
  <a class="custom-whatsapp" href="{{whatsapp_url}}">◉ &nbsp; WhatsApp Destek</a>
</section>
<div class="custom-store-footer">
  <section class="custom-footer-brand"><img src="{{logo_url}}" alt="{{logo_alt}}"><p>{{copyright}}</p></section>
  <div class="custom-footer-columns">{{footer_columns_html}}</div>
  <address><a href="mailto:{{email}}">{{email}}</a><a href="tel:{{phone}}">{{phone}}</a><p>{{address}}</p></address>
</div>`;

export const FOOTER_SOURCE_CSS = `.custom-footer-newsletter {
  max-width: var(--notisyon-content-width, 1440px);
  margin: 0 auto;
  padding: 46px 32px;
  display: grid;
  grid-template-columns: 1.1fr 1.25fr auto;
  align-items: center;
  gap: 42px;
  background: #fff;
  color: #17243b;
}
.custom-newsletter-copy small { color: #8b6844; font-size: 11px; font-weight: 800; letter-spacing: .18em; }
.custom-newsletter-copy h2 { margin: 10px 0 8px; font-size: 30px; line-height: 1.1; }
.custom-newsletter-copy p { margin: 0; color: #667286; font-size: 14px; }
.custom-newsletter-form { display: grid; grid-template-columns: 1fr auto; align-items: start; }
.custom-newsletter-input { min-height: 54px; padding: 17px 18px; border: 1px solid #d8cfc3; border-radius: 12px 0 0 12px; color: #17243b; font: inherit; }
.custom-newsletter-form button { min-height: 54px; padding: 0 28px; border: 0; border-radius: 0 12px 12px 0; background: #151515; color: #fff; font-weight: 800; }
.custom-newsletter-form label { grid-column: 1 / -1; margin-top: 9px; color: #697486; font-size: 11px; }
.custom-whatsapp { padding: 17px 23px; border-radius: 999px; background: #20d66b; color: #082b17; font-size: 13px; font-weight: 800; text-decoration: none; white-space: nowrap; }
.custom-store-footer {
  max-width: var(--notisyon-content-width);
  margin: 0 auto;
  padding: 64px 24px;
  display: grid;
  grid-template-columns: 1.1fr 2fr 1fr;
  gap: 48px;
  background: #f7f4ef;
  color: #17243b;
}
.custom-footer-brand img { width: 150px; }
.custom-footer-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.custom-footer-column { display: grid; align-content: start; gap: 10px; }
.custom-footer-column a, .custom-store-footer address a { color: #17243b; text-decoration: none; }
@media (max-width: 900px) { .custom-footer-newsletter { grid-template-columns: 1fr; gap: 22px; padding: 32px 20px; } .custom-whatsapp { justify-self: start; } .custom-store-footer { grid-template-columns: 1fr; } .custom-footer-columns { grid-template-columns: 1fr 1fr; } }`;

export const PRODUCT_CARD_SOURCE_TEMPLATE = `<article class="custom-product-card">
  <a class="custom-product-image" href="{{product_url}}">
    <img src="{{image_url}}" alt="{{product_name}}">
    <span class="custom-product-badge">{{badge}}</span>
  </a>
  <small>{{brand}}</small>
  <a href="{{product_url}}"><h3>{{product_name}}</h3></a>
  <strong>{{price}}</strong>
  <button type="button" data-add-to-cart>{{button_label}}</button>
</article>`;

export const PRODUCT_CARD_SOURCE_CSS = `.custom-product-card { display: grid; gap: 10px; color: #151827; }
.custom-product-image { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 16px; background: #f2f3f6; }
.custom-product-image img { width: 100%; height: 100%; object-fit: cover; }
.custom-product-badge { position: absolute; top: 12px; left: 12px; padding: 6px 9px; border-radius: 999px; background: #fff; color: #151827; font-size: 11px; }
.custom-product-card a { color: inherit; text-decoration: none; }
.custom-product-card h3 { margin: 0; font-size: 16px; }
.custom-product-card button { min-height: 42px; border: 0; border-radius: 10px; background: var(--store-primary); color: #fff; font-weight: 800; cursor: pointer; }`;

export const PAGE_BLOCK_SOURCE_TEMPLATE = `<section class="custom-page-block">
  <div>
    <span>NOTİSYON</span>
    <h2>{{title}}</h2>
    <p>{{subtitle}}</p>
    <a href="{{button_href}}">{{button_label}}</a>
  </div>
</section>`;

export const PAGE_BLOCK_SOURCE_CSS = `.custom-page-block { padding: 72px 28px; background: #f3f0ea; border-radius: 24px; }
.custom-page-block > div { max-width: 720px; margin: 0 auto; text-align: center; }
.custom-page-block h2 { margin: 12px 0; font-size: clamp(28px, 4vw, 52px); }
.custom-page-block a { display: inline-flex; margin-top: 16px; padding: 12px 20px; border-radius: 999px; background: var(--store-primary); color: #fff; text-decoration: none; font-weight: 800; }`;

export function escapeDesignValue(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export function applyDesignTemplate(template: string, values: Record<string, unknown>, rawKeys: string[] = []) {
  return template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_match, key: string) => rawKeys.includes(key) ? String(values[key] ?? "") : escapeDesignValue(values[key]));
}
