"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart";
import { SourceProductCard } from "@/components/source-product-card";
import type { ProductPreview } from "@/data/catalog";
import type { CategoryFilters } from "@/lib/catalog-store";
import type { DesignConfig } from "@/lib/design-config";
import type { SettingMap } from "@/lib/platform-settings";

type FilterKey = "inStock" | "new" | "deal" | "freeShipping";
type SortKey = "recommended" | "priceAsc" | "priceDesc" | "nameAsc" | "nameDesc";

const filters: { key: FilterKey; label: string }[] = [
  { key: "inStock", label: "Stoktakiler" },
  { key: "new", label: "Yeni ürünler" },
  { key: "deal", label: "Fırsat ürünleri" },
  { key: "freeShipping", label: "Ücretsiz kargo" },
];

export function CategoryCatalog({ products,filterConfig,cardConfig,globalSettings,texts }: { products: ProductPreview[];filterConfig?:Partial<CategoryFilters>;cardConfig?:DesignConfig["productCard"];globalSettings?:SettingMap;texts?:SettingMap }) {
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [activeBrands,setActiveBrands]=useState<string[]>([]),[priceBand,setPriceBand]=useState("all");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const eligible = products.filter((product) => (globalSettings?.show_out_of_stock !== false || product.stock > 0) && (globalSettings?.hide_without_image !== true || Boolean(product.imageUrl)));
    const result = eligible.filter((product) => (activeBrands.length===0||activeBrands.includes(product.brand))&&(
      priceBand==="all"||(priceBand==="under100"&&product.priceValue<100)||(priceBand==="100to250"&&product.priceValue>=100&&product.priceValue<=250)||(priceBand==="over250"&&product.priceValue>250))&&activeFilters.every((filter) => {
      if (filter === "inStock") return product.stock > 0;
      return product.flags[filter];
    }));

    return [...result].sort((a, b) => {
      if (sort === "priceAsc") return a.priceValue - b.priceValue;
      if (sort === "priceDesc") return b.priceValue - a.priceValue;
      if (sort === "nameAsc") return a.name.localeCompare(b.name, "tr");
      if (sort === "nameDesc") return b.name.localeCompare(a.name, "tr");
      const stockOrder = globalSettings?.out_of_stock_last !== false ? Number(b.stock > 0) - Number(a.stock > 0) : 0;
      return stockOrder || Number(b.flags.featured) - Number(a.flags.featured);
    });
  }, [activeBrands,activeFilters,globalSettings, priceBand,products, sort]);

  const config={brand:globalSettings?.filter_brand!==false,price:globalSettings?.filter_price!==false,stock:globalSettings?.filter_stock!==false,features:globalSettings?.filter_features!==false,...filterConfig};
  const visibleFilters=filters.filter(item=>item.key==="inStock"?config.stock:config.features);
  const brands=Array.from(new Set(products.map(product=>product.brand))).sort((a,b)=>a.localeCompare(b,"tr"));
  const activeCount=activeFilters.length+activeBrands.length+(priceBand==="all"?0:1);
  const card={style:"bordered",showBrand:true,showBadges:true,quickAdd:true,buttonLabel:"Sepete ekle",...cardConfig};
  const filtersEnabled=globalSettings?.filters_enabled!==false;
  const pageSize=Math.max(1,Math.min(120,Number(globalSettings?.products_per_page)||24));
  const pagedProducts=visibleProducts.slice(0,pageSize);
  const showPrices=globalSettings?.show_prices!==false&&globalSettings?.members_only_prices!==true;
  const addLabel=String(texts?.add_to_cart||card.buttonLabel||"Sepete ekle"),outOfStock=String(texts?.out_of_stock||"Tükendi");

  function toggleFilter(filter: FilterKey) {
    setActiveFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  }

  return (
    <div className="category-commerce">
      {filtersEnabled?<button className="category-mobile-filter" type="button" onClick={() => setFiltersOpen((open) => !open)}>
        Filtreler {activeCount ? `(${activeCount})` : ""}
      </button>:null}

      {filtersEnabled?<aside className={filtersOpen ? "category-filters is-open" : "category-filters"}>
        <div className="category-filter-heading">
          <div><span>FİLTRELE</span><h2>Seçimini daralt</h2></div>
          {activeCount > 0 && <button type="button" onClick={() => {setActiveFilters([]);setActiveBrands([]);setPriceBand("all");}}>Temizle</button>}
        </div>
        <div className="category-filter-options">
          {visibleFilters.map((filter) => (
            <label key={filter.key}>
              <input type="checkbox" checked={activeFilters.includes(filter.key)} onChange={() => toggleFilter(filter.key)} />
              <span>{filter.label}</span>
            </label>
          ))}
        </div>
        {config.brand&&brands.length>1?<div className="category-filter-group"><b>Marka</b>{brands.map(brand=><label key={brand}><input type="checkbox" checked={activeBrands.includes(brand)} onChange={()=>setActiveBrands(current=>current.includes(brand)?current.filter(item=>item!==brand):[...current,brand])}/><span>{brand}</span></label>)}</div>:null}
        {config.price?<div className="category-filter-group"><b>Fiyat aralığı</b><select value={priceBand} onChange={e=>setPriceBand(e.target.value)}><option value="all">Tüm fiyatlar</option><option value="under100">100 TL altı</option><option value="100to250">100 – 250 TL</option><option value="over250">250 TL üzeri</option></select></div>:null}
      </aside>:null}

      <section className="category-results" aria-live="polite">
        <div className="category-toolbar">
          <p><strong>{pagedProducts.length}</strong> / {visibleProducts.length} ürün gösteriliyor</p>
          <label>
            <span>Sırala</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="recommended">Önerilen sıralama</option>
              <option value="priceAsc">Fiyat: düşükten yükseğe</option>
              <option value="priceDesc">Fiyat: yüksekten düşüğe</option>
              <option value="nameAsc">Ürün adı: A–Z</option>
              <option value="nameDesc">Ürün adı: Z–A</option>
            </select>
          </label>
        </div>

        {pagedProducts.length ? (
          <div className="category-product-grid">
            {pagedProducts.map((product, index) => card.sourceMode && card.customHtml?.trim() && showPrices ? <SourceProductCard key={product.sku} product={product} html={card.customHtml} css={card.customCss || ""} buttonLabel={addLabel}/> : (
              <article className="category-product-card" data-card-style={card.style} key={product.sku}>
                <Link className="category-product-visual" href={`/urun/${product.slug}`}>
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw" />
                  ) : (
                    <span className="category-cover-placeholder"><small>NOTİSYON</small><b>{product.coverText}</b><i>{product.sku}</i></span>
                  )}
                  {card.showBadges&&<span className="category-product-badge">{product.badge}</span>}
                  {product.stock <= 0 && <span className="category-product-stock">{outOfStock}</span>}
                  <span className="category-product-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="category-product-discover">Ürünü incele <i>↗</i></span>
                </Link>
                <div className="category-product-info">
                  {card.showBrand&&<p>{product.brand}</p>}
                  <Link href={`/urun/${product.slug}`}><h3>{product.name}</h3></Link>
                  {globalSettings?.show_category===true&&product.categories[0]?<small className="category-product-meta">{product.categories[0].split(">").at(-1)}</small>:null}
                  {globalSettings?.show_sku===true?<small className="category-product-meta">Stok kodu: {product.sku}</small>:null}
                  {globalSettings?.show_barcode===true&&product.barcode?<small className="category-product-meta">Barkod: {product.barcode}</small>:null}
                  {globalSettings?.show_short_description!==false&&product.shortDescription?<p className="category-product-description">{product.shortDescription}</p>:null}
                  {showPrices?<div className="category-product-price"><strong>{product.price}</strong><span>KDV dahil</span></div>:<div className="category-member-price">Fiyatı görmek için üye girişi yapın</div>}
                  {globalSettings?.show_delivery_estimate!==false&&product.stock>0?<small className="category-product-delivery">Tahmini kargoya teslim: 1–3 iş günü</small>:null}
                  {card.quickAdd&&product.stock>0&&showPrices?<AddToCartButton className="category-add-button" label={addLabel} product={{ sku: product.sku, name: product.name, brand: product.brand, price: product.priceValue }} />:null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="category-empty"><strong>Bu filtrelerde ürün bulunamadı.</strong><button type="button" onClick={() => {setActiveFilters([]);setActiveBrands([]);setPriceBand("all");}}>Filtreleri temizle</button></div>
        )}
      </section>
    </div>
  );
}
