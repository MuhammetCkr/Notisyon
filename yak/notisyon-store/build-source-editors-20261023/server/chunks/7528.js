exports.id=7528,exports.ids=[7528],exports.modules={8420:(a,b,c)=>{"use strict";c.d(b,{CategoryCatalog:()=>l});var d=c(48249),e=c(81220),f=c(2116),g=c.n(f),h=c(67484),i=c(78132),j=c(90080);let k=[{key:"inStock",label:"Stoktakiler"},{key:"new",label:"Yeni \xfcr\xfcnler"},{key:"deal",label:"Fırsat \xfcr\xfcnleri"},{key:"freeShipping",label:"\xdccretsiz kargo"}];function l({products:a,filterConfig:b,cardConfig:c}){let[f,m]=(0,h.useState)([]),[n,o]=(0,h.useState)([]),[p,q]=(0,h.useState)("all"),[r,s]=(0,h.useState)("recommended"),[t,u]=(0,h.useState)(!1),v=(0,h.useMemo)(()=>[...a.filter(a=>(0===n.length||n.includes(a.brand))&&("all"===p||"under100"===p&&a.priceValue<100||"100to250"===p&&a.priceValue>=100&&a.priceValue<=250||"over250"===p&&a.priceValue>250)&&f.every(b=>"inStock"===b?a.stock>0:a.flags[b]))].sort((a,b)=>"priceAsc"===r?a.priceValue-b.priceValue:"priceDesc"===r?b.priceValue-a.priceValue:"nameAsc"===r?a.name.localeCompare(b.name,"tr"):"nameDesc"===r?b.name.localeCompare(a.name,"tr"):Number(b.flags.featured)-Number(a.flags.featured)),[n,f,p,a,r]),w={brand:!0,price:!0,stock:!0,features:!0,...b},x=k.filter(a=>"inStock"===a.key?w.stock:w.features),y=Array.from(new Set(a.map(a=>a.brand))).sort((a,b)=>a.localeCompare(b,"tr")),z=f.length+n.length+ +("all"!==p),A={style:"bordered",showBrand:!0,showBadges:!0,quickAdd:!0,buttonLabel:"Sepete ekle",...c};return(0,d.jsxs)("div",{className:"category-commerce",children:[(0,d.jsxs)("button",{className:"category-mobile-filter",type:"button",onClick:()=>u(a=>!a),children:["Filtreler ",z?`(${z})`:""]}),(0,d.jsxs)("aside",{className:t?"category-filters is-open":"category-filters",children:[(0,d.jsxs)("div",{className:"category-filter-heading",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("span",{children:"FİLTRELE"}),(0,d.jsx)("h2",{children:"Se\xe7imini daralt"})]}),z>0&&(0,d.jsx)("button",{type:"button",onClick:()=>{m([]),o([]),q("all")},children:"Temizle"})]}),(0,d.jsx)("div",{className:"category-filter-options",children:x.map(a=>(0,d.jsxs)("label",{children:[(0,d.jsx)("input",{type:"checkbox",checked:f.includes(a.key),onChange:()=>{var b;return b=a.key,void m(a=>a.includes(b)?a.filter(a=>a!==b):[...a,b])}}),(0,d.jsx)("span",{children:a.label})]},a.key))}),w.brand&&y.length>1?(0,d.jsxs)("div",{className:"category-filter-group",children:[(0,d.jsx)("b",{children:"Marka"}),y.map(a=>(0,d.jsxs)("label",{children:[(0,d.jsx)("input",{type:"checkbox",checked:n.includes(a),onChange:()=>o(b=>b.includes(a)?b.filter(b=>b!==a):[...b,a])}),(0,d.jsx)("span",{children:a})]},a))]}):null,w.price?(0,d.jsxs)("div",{className:"category-filter-group",children:[(0,d.jsx)("b",{children:"Fiyat aralığı"}),(0,d.jsxs)("select",{value:p,onChange:a=>q(a.target.value),children:[(0,d.jsx)("option",{value:"all",children:"T\xfcm fiyatlar"}),(0,d.jsx)("option",{value:"under100",children:"100 TL altı"}),(0,d.jsx)("option",{value:"100to250",children:"100 – 250 TL"}),(0,d.jsx)("option",{value:"over250",children:"250 TL \xfczeri"})]})]}):null]}),(0,d.jsxs)("section",{className:"category-results","aria-live":"polite",children:[(0,d.jsxs)("div",{className:"category-toolbar",children:[(0,d.jsxs)("p",{children:[(0,d.jsx)("strong",{children:v.length})," \xfcr\xfcn g\xf6steriliyor"]}),(0,d.jsxs)("label",{children:[(0,d.jsx)("span",{children:"Sırala"}),(0,d.jsxs)("select",{value:r,onChange:a=>s(a.target.value),children:[(0,d.jsx)("option",{value:"recommended",children:"\xd6nerilen sıralama"}),(0,d.jsx)("option",{value:"priceAsc",children:"Fiyat: d\xfcş\xfckten y\xfckseğe"}),(0,d.jsx)("option",{value:"priceDesc",children:"Fiyat: y\xfcksekten d\xfcş\xfcğe"}),(0,d.jsx)("option",{value:"nameAsc",children:"\xdcr\xfcn adı: A–Z"}),(0,d.jsx)("option",{value:"nameDesc",children:"\xdcr\xfcn adı: Z–A"})]})]})]}),v.length?(0,d.jsx)("div",{className:"category-product-grid",children:v.map((a,b)=>A.sourceMode&&A.customHtml?.trim()?(0,d.jsx)(j.N,{product:a,html:A.customHtml,css:A.customCss||"",buttonLabel:A.buttonLabel},a.sku):(0,d.jsxs)("article",{className:"category-product-card","data-card-style":A.style,children:[(0,d.jsxs)(g(),{className:"category-product-visual",href:`/urun/${a.slug}`,children:[a.imageUrl?(0,d.jsx)(e.A,{src:a.imageUrl,alt:a.name,fill:!0,sizes:"(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"}):(0,d.jsxs)("span",{className:"category-cover-placeholder",children:[(0,d.jsx)("small",{children:"NOTİSYON"}),(0,d.jsx)("b",{children:a.coverText}),(0,d.jsx)("i",{children:a.sku})]}),A.showBadges&&(0,d.jsx)("span",{className:"category-product-badge",children:a.badge}),a.stock<=0&&(0,d.jsx)("span",{className:"category-product-stock",children:"T\xfckendi"}),(0,d.jsx)("span",{className:"category-product-index",children:String(b+1).padStart(2,"0")}),(0,d.jsxs)("span",{className:"category-product-discover",children:["\xdcr\xfcn\xfc incele ",(0,d.jsx)("i",{children:"↗"})]})]}),(0,d.jsxs)("div",{className:"category-product-info",children:[A.showBrand&&(0,d.jsx)("p",{children:a.brand}),(0,d.jsx)(g(),{href:`/urun/${a.slug}`,children:(0,d.jsx)("h3",{children:a.name})}),(0,d.jsxs)("div",{className:"category-product-price",children:[(0,d.jsx)("strong",{children:a.price}),(0,d.jsx)("span",{children:"KDV dahil"})]}),A.quickAdd&&(0,d.jsx)(i.AddToCartButton,{className:"category-add-button",label:A.buttonLabel,product:{sku:a.sku,name:a.name,brand:a.brand,price:a.priceValue}})]})]},a.sku))}):(0,d.jsxs)("div",{className:"category-empty",children:[(0,d.jsx)("strong",{children:"Bu filtrelerde \xfcr\xfcn bulunamadı."}),(0,d.jsx)("button",{type:"button",onClick:()=>{m([]),o([]),q("all")},children:"Filtreleri temizle"})]})]})]})}},20503:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0});var d={MutableRequestCookiesAdapter:function(){return o},ReadonlyRequestCookiesError:function(){return j},RequestCookiesAdapter:function(){return k},appendMutableCookies:function(){return n},areCookiesMutableInCurrentPhase:function(){return q},createCookiesWithMutableAccessCheck:function(){return p},getModifiedCookieValues:function(){return m},responseCookiesToRequestCookies:function(){return s}};for(var e in d)Object.defineProperty(b,e,{enumerable:!0,get:d[e]});let f=c(91488),g=c(20445),h=c(29294),i=c(43014);class j extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options")}static callable(){throw new j}}class k{static seal(a){return new Proxy(a,{get(a,b,c){switch(b){case"clear":case"delete":case"set":return j.callable;default:return g.ReflectAdapter.get(a,b,c)}}})}static fresh(a){return new Proxy(a,{get:(a,b,c)=>g.ReflectAdapter.get(a,b,c)})}}let l=Symbol.for("next.mutated.cookies");function m(a){let b=a[l];return b&&Array.isArray(b)&&0!==b.length?b:[]}function n(a,b){let c=m(b);if(0===c.length)return!1;let d=new f.ResponseCookies(a),e=d.getAll();for(let a of c)d.set(a);for(let a of e)d.set(a);return!0}class o{static wrap(a,b){let c=new f.ResponseCookies(new Headers);for(let b of a.getAll())c.set(b);let d=[],e=new Set,j=()=>{let a=h.workAsyncStorage.getStore();if(a&&(a.pathWasRevalidated=i.ActionDidRevalidateStaticAndDynamic),d=c.getAll().filter(a=>e.has(a.name)),b){let a=[];for(let b of d){let c=new f.ResponseCookies(new Headers);c.set(b),a.push(c.toString())}b(a)}},k=new Proxy(c,{get(a,b,c){switch(b){case l:return d;case"delete":return function(...b){e.add("string"==typeof b[0]?b[0]:b[0].name);try{return a.delete(...b),k}finally{j()}};case"set":return function(...b){e.add("string"==typeof b[0]?b[0]:b[0].name);try{return a.set(...b),k}finally{j()}};default:return g.ReflectAdapter.get(a,b,c)}}});return k}}function p(a){let b=new Proxy(a.mutableCookies,{get(c,d,e){switch(d){case"delete":return function(...d){return r(a,"cookies().delete"),c.delete(...d),b};case"set":return function(...d){return r(a,"cookies().set"),c.set(...d),b};default:return g.ReflectAdapter.get(c,d,e)}}});return b}function q(a){return"action"===a.phase}function r(a,b){if(!q(a))throw new j}function s(a){let b=new f.RequestCookies(new Headers);for(let c of a.getAll())b.set(c);return b}},21488:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,23318,23)),Promise.resolve().then(c.bind(c,50714)),Promise.resolve().then(c.bind(c,28038))},28038:(a,b,c)=>{"use strict";c.d(b,{CategoryCatalog:()=>d});let d=(0,c(77943).registerClientReference)(function(){throw Error("Attempted to call CategoryCatalog() from the server but CategoryCatalog is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Harun\\Documents\\Codex\\2026-10-21\\yak\\notisyon-store\\src\\components\\category-catalog.tsx","CategoryCatalog")},43014:(a,b)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0});var c={ActionDidNotRevalidate:function(){return e},ActionDidRevalidateDynamicOnly:function(){return g},ActionDidRevalidateStaticAndDynamic:function(){return f}};for(var d in c)Object.defineProperty(b,d,{enumerable:!0,get:c[d]});let e=0,f=1,g=2},55056:(a,b,c)=>{"use strict";c.d(b,{Td:()=>f,aQ:()=>h,fK:()=>j,gK:()=>g,hd:()=>d,kx:()=>k,ld:()=>l,nv:()=>i,uo:()=>e});let d=`<div class="custom-store-header">
  <a class="custom-store-logo" href="/">
    <img src="{{logo_url}}" alt="{{logo_alt}}">
  </a>
  <nav class="custom-store-menu">{{menu_html}}</nav>
  <div class="custom-store-actions">
    <a href="/hesabim">Hesabım</a>
    <a href="/sepet">Sepet</a>
  </div>
</div>`,e=`.custom-store-header {
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
@media (max-width: 800px) { .custom-store-menu { display: none; } }`,f=`<div class="custom-store-footer">
  <section class="custom-footer-brand">
    <img src="{{logo_url}}" alt="{{logo_alt}}">
    <p>{{copyright}}</p>
  </section>
  <div class="custom-footer-columns">{{footer_columns_html}}</div>
  <address>
    <a href="mailto:{{email}}">{{email}}</a>
    <a href="tel:{{phone}}">{{phone}}</a>
    <p>{{address}}</p>
  </address>
</div>`,g=`.custom-store-footer {
  max-width: var(--notisyon-content-width);
  margin: 0 auto;
  padding: 64px 24px;
  display: grid;
  grid-template-columns: 1.1fr 2fr 1fr;
  gap: 48px;
  color: #fff;
}
.custom-footer-brand img { width: 150px; filter: brightness(0) invert(1); }
.custom-footer-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.custom-footer-column { display: grid; align-content: start; gap: 10px; }
.custom-footer-column a, .custom-store-footer address a { color: #fff; text-decoration: none; }
@media (max-width: 800px) { .custom-store-footer { grid-template-columns: 1fr; } .custom-footer-columns { grid-template-columns: 1fr 1fr; } }`,h=`<article class="custom-product-card">
  <a class="custom-product-image" href="{{product_url}}">
    <img src="{{image_url}}" alt="{{product_name}}">
    <span class="custom-product-badge">{{badge}}</span>
  </a>
  <small>{{brand}}</small>
  <a href="{{product_url}}"><h3>{{product_name}}</h3></a>
  <strong>{{price}}</strong>
  <button type="button" data-add-to-cart>{{button_label}}</button>
</article>`,i=`.custom-product-card { display: grid; gap: 10px; color: #151827; }
.custom-product-image { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 16px; background: #f2f3f6; }
.custom-product-image img { width: 100%; height: 100%; object-fit: cover; }
.custom-product-badge { position: absolute; top: 12px; left: 12px; padding: 6px 9px; border-radius: 999px; background: #fff; color: #151827; font-size: 11px; }
.custom-product-card a { color: inherit; text-decoration: none; }
.custom-product-card h3 { margin: 0; font-size: 16px; }
.custom-product-card button { min-height: 42px; border: 0; border-radius: 10px; background: var(--store-primary); color: #fff; font-weight: 800; cursor: pointer; }`,j=`<section class="custom-page-block">
  <div>
    <span>NOTİSYON</span>
    <h2>{{title}}</h2>
    <p>{{subtitle}}</p>
    <a href="{{button_href}}">{{button_label}}</a>
  </div>
</section>`,k=`.custom-page-block { padding: 72px 28px; background: #f3f0ea; border-radius: 24px; }
.custom-page-block > div { max-width: 720px; margin: 0 auto; text-align: center; }
.custom-page-block h2 { margin: 12px 0; font-size: clamp(28px, 4vw, 52px); }
.custom-page-block a { display: inline-flex; margin-top: 16px; padding: 12px 20px; border-radius: 999px; background: var(--store-primary); color: #fff; text-decoration: none; font-weight: 800; }`;function l(a,b,c=[]){return a.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(a,d)=>c.includes(d)?String(b[d]??""):String(b[d]??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a]||a))}},56336:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,2116,23)),Promise.resolve().then(c.bind(c,78132)),Promise.resolve().then(c.bind(c,8420))},66579:(a,b,c)=>{"use strict";c.a(a,async(a,d)=>{try{c.d(b,{$:()=>h,K:()=>i});var e=c(20903),f=a([e]);e=(f.then?(await f)():f)[0];let j=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}),k=`
  WITH RECURSIVE category_tree AS (
    SELECT id,parent_id,name,name::text AS path FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id,c.parent_id,c.name,(ct.path || '>' || c.name)::text
    FROM categories c JOIN category_tree ct ON ct.id=c.parent_id
  )
  SELECT p.name,p.slug,p.brand,p.short_description,p.description_html,p.published,p.featured,p.is_new,p.is_deal,p.free_shipping,p.seo_title,p.seo_description,p.seo_keywords,p.canonical_url,p.indexable,p.follow_links,
    v.sku,v.barcode,v.stock_quantity::int,v.sale_price::float8,v.compare_at_price::float8,
    (SELECT pi.url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.position,pi.created_at LIMIT 1) image_url,
    COALESCE(ca.categories,'{}') categories
  FROM products p
  JOIN LATERAL (SELECT * FROM product_variants WHERE product_id=p.id AND active=true ORDER BY created_at LIMIT 1) v ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT ct.path) FILTER (WHERE ct.path IS NOT NULL) categories
    FROM product_categories pc
    JOIN category_tree ct ON ct.id=pc.category_id
    WHERE pc.product_id=p.id
  ) ca ON true
  WHERE p.published=true AND COALESCE(p.archived,false)=false
`;function g(a){let b=Number(a.sale_price||0);return{sku:a.sku,slug:a.slug,name:a.name,brand:a.brand||"Notisyon",price:j.format(b),priceValue:b,badge:a.free_shipping?"\xdccretsiz kargo":a.is_deal?"Fırsat \xfcr\xfcn\xfc":a.is_new?"Yeni \xfcr\xfcn":"Notisyon",coverText:a.name.split(" ").slice(-2).join(" "),imageUrl:a.image_url||void 0,categories:a.categories||[],stock:Number(a.stock_quantity||0),flags:{freeShipping:a.free_shipping,deal:a.is_deal,new:a.is_new,featured:a.featured}}}async function h(a){let b=(await (0,e.L)().query(`${k} ORDER BY p.featured DESC,p.updated_at DESC`)).rows.map(g);return a?.length?b.filter(b=>b.categories.some(b=>a.some(a=>b===a||b.startsWith(`${a}>`)))):b}async function i(a){let b=(await (0,e.L)().query(`${k} AND (lower(p.slug)=lower($1) OR lower(v.sku)=lower($1)) LIMIT 1`,[a])).rows[0];if(!b)return null;let c=await (0,e.L)().query("SELECT sku,barcode,attributes,stock_quantity::int,sale_price::float8,compare_at_price::float8,image_url FROM product_variants WHERE product_id=(SELECT id FROM products WHERE slug=$1) AND active=true ORDER BY created_at",[b.slug]);return{...g(b),shortDescription:b.short_description||"",descriptionHtml:b.description_html||"",barcode:b.barcode,compareAtPrice:b.compare_at_price,seoTitle:b.seo_title,seoDescription:b.seo_description,seoKeywords:b.seo_keywords,canonicalUrl:b.canonical_url,indexable:b.indexable,followLinks:b.follow_links,variants:c.rows}}d()}catch(a){d(a)}})},69833:(a,b,c)=>{"use strict";let d=c(24814),e=c(8834),f=c(38895),g=Reflect.get(d._(c(28039)),"default"),h=(0,e.prepareImageConfig)({deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1})},81220:(a,b,c)=>{"use strict";c.d(b,{A:()=>d.Image});var d=c(73836);c(69833)},89768:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),Object.defineProperty(b,"createDedupedByCallsiteServerErrorLoggerDev",{enumerable:!0,get:function(){return i}});let d=function(a){if(a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var b=e(void 0);if(b&&b.has(a))return b.get(a);var c={__proto__:null},d=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var f in a)if("default"!==f&&Object.prototype.hasOwnProperty.call(a,f)){var g=d?Object.getOwnPropertyDescriptor(a,f):null;g&&(g.get||g.set)?Object.defineProperty(c,f,g):c[f]=a[f]}return c.default=a,b&&b.set(a,c),c}(c(91986));function e(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(e=function(a){return a?c:b})(a)}let f={current:null},g="function"==typeof d.cache?d.cache:a=>a,h=console.error;function i(a){return function(...b){h(a(...b))}}g(a=>{try{h(f.current)}finally{f.current=null}})},90080:(a,b,c)=>{"use strict";c.d(b,{N:()=>g});var d=c(48249),e=c(78132),f=c(55056);function g({product:a,html:b,css:c,buttonLabel:h}){let{add:i}=(0,e.useCart)(),j=(0,f.ld)(b,{product_url:`/urun/${a.slug}`,image_url:a.imageUrl||"",product_name:a.name,brand:a.brand,price:a.price,badge:a.badge||"",sku:a.sku,stock:a.stock,button_label:h});return(0,d.jsxs)("div",{className:"source-product-card",onClick:function(b){b.target.closest("[data-add-to-cart]")&&(b.preventDefault(),i({sku:a.sku,name:a.name,brand:a.brand,price:a.priceValue}))},children:[c.trim()?(0,d.jsx)("style",{children:c}):null,(0,d.jsx)("div",{dangerouslySetInnerHTML:{__html:j}})]})}}};