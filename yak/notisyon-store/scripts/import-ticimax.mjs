import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
};
const source = valueFor("--source");
const output = valueFor("--out") ?? "src/data/ticimax-catalog.json";

if (!source) {
  throw new Error("Kullanım: npm run import:ticimax -- --source <TicimaxExport.xls> [--out <dosya>]");
}

const text = (value) => (value === undefined || value === null ? "" : String(value).trim());
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const flag = (value) => number(value) === 1;

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(source);
const worksheet = workbook.worksheets[0];
if (!worksheet) throw new Error("Ticimax Excel dosyasında çalışma sayfası bulunamadı.");

const headers = {};
worksheet.getRow(1).eachCell((cell, column) => { headers[text(cell.value)] = column; });
const read = (row, header) => text(row.getCell(headers[header]).value);

const products = new Map();
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;
  const cardId = read(row, "URUNKARTIID");
  if (!cardId) return;

  const variant = {
    sourceProductId: read(row, "URUNID"),
    sku: read(row, "STOKKODU"),
    variationCode: read(row, "VARYASYONKODU"),
    barcode: read(row, "BARKOD"),
    stock: number(read(row, "STOKADEDI")),
    salePrice: number(read(row, "SATISFIYATI")),
    discountPrice: number(read(row, "INDIRIMLIFIYAT")),
    active: flag(read(row, "URUNAKTIF")),
  };

  if (!products.has(cardId)) {
    products.set(cardId, {
      sourceCardId: cardId,
      name: read(row, "URUNADI"),
      shortDescription: read(row, "ONYAZI"),
      descriptionHtml: read(row, "ACIKLAMA"),
      categories: read(row, "KATEGORILER").split(";").map((item) => item.trim()).filter(Boolean),
      brand: read(row, "MARKA"),
      seo: { title: read(row, "SEO_SAYFABASLIK"), description: read(row, "SEO_SAYFAACIKLAMA"), keywords: read(row, "SEO_ANAHTARKELIME") },
      flags: { featured: flag(read(row, "VITRIN")), new: flag(read(row, "YENIURUN")), deal: flag(read(row, "FIRSATURUNU")), freeShipping: flag(read(row, "UCRETSIZKARGO")) },
      variants: [],
    });
  }
  products.get(cardId).variants.push(variant);
});

const catalog = { importedAt: new Date().toISOString(), source: "Ticimax ürün dışa aktarımı", products: [...products.values()] };
const destination = path.resolve(output);
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`${catalog.products.length} ürün kartı ${destination} konumuna aktarıldı.`);
