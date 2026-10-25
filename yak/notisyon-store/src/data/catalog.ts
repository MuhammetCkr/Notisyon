import ticimaxCatalog from "./ticimax-catalog.json";

export type ProductPreview = {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  priceValue: number;
  badge: string;
  coverText: string;
  imageUrl?: string;
  shortDescription?: string;
  barcode?: string;
  categories: string[];
  stock: number;
  flags: { freeShipping: boolean; deal: boolean; new: boolean; featured: boolean };
};

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

const publicProductImages: Record<string, string> = {
  TEDDYS: "https://static.ticimax.cloud/cdn-cgi/image/width=900,quality=85,format=webp/75269/uploads/urunresimleri/buyuk/a5-spiralli-okul-defteri-120-sayfa-4lu-9c19-4.jpg",
  SV1: "https://static.ticimax.cloud/cdn-cgi/image/width=900,quality=85,format=webp/75269/uploads/urunresimleri/buyuk/sevgiliyle-yapilacak-50-aktivite-karti-881203.jpg",
  LACIVERT: "https://static.ticimax.cloud/cdn-cgi/image/width=900,quality=85,format=webp/75269/uploads/urunresimleri/buyuk/ceyiz-defteri-dugun-planlayici-ceyiz-l-00f-a7.jpg",
  GRI: "https://static.ticimax.cloud/cdn-cgi/image/width=900,quality=85,format=webp/75269/uploads/urunresimleri/buyuk/ceyiz-defteri-dugun-planlayici-ceyiz-l-4901ff.jpg",
};

function toPreview(product: (typeof ticimaxCatalog.products)[number]): ProductPreview {
    const firstVariant = product.variants[0];
    const price = firstVariant.discountPrice || firstVariant.salePrice;
    const badge = product.flags.freeShipping ? "Ücretsiz kargo" : product.flags.deal ? "Fırsat ürünü" : product.flags.new ? "Yeni ürün" : "Notisyon";
    const sku = firstVariant.sku || product.sourceCardId;
    return {
      sku,
      slug: sku.toLowerCase(),
      name: product.name,
      brand: product.brand || "Notisyon",
      price: money.format(price),
      priceValue: price,
      badge,
      coverText: product.name.split(" ").slice(-2).join(" "),
      imageUrl: publicProductImages[sku],
      shortDescription: product.shortDescription?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
      categories: product.categories,
      stock: product.variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0),
      flags: {
        freeShipping: product.flags.freeShipping,
        deal: product.flags.deal,
        new: product.flags.new,
        featured: product.flags.featured,
      },
    };
}

const homeProductSkus = ["TEDDYS", "SV1", "LACIVERT", "GRI"];

export const featuredProducts: ProductPreview[] = homeProductSkus
  .map((sku) => ticimaxCatalog.products.find((product) => product.variants.some((variant) => variant.sku === sku)))
  .filter((product): product is (typeof ticimaxCatalog.products)[number] => Boolean(product))
  .map(toPreview);

export const allProductPreviews: ProductPreview[] = ticimaxCatalog.products
  .filter((product) => product.variants.some((variant) => variant.active))
  .map(toPreview);

export const catalogImportSummary = { productCount: ticimaxCatalog.products.length, importedAt: ticimaxCatalog.importedAt };
export const importedProducts = ticimaxCatalog.products;

export function findProductBySku(slug: string) {
  return importedProducts.find((product) => product.variants.some((variant) => variant.sku.toLowerCase() === slug.toLowerCase()));
}
