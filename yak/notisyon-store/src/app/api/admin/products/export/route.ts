import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listCategories,listProducts } from "@/lib/catalog-store";

export async function GET(){
  if(!(await isAdminAuthenticated()))return Response.json({error:"Yetkisiz"},{status:401});
  const [products,categories]=await Promise.all([listProducts(),listCategories()]);
  const workbook=new ExcelJS.Workbook();workbook.creator="Notisyon Commerce OS";workbook.created=new Date();
  const sheet=workbook.addWorksheet("Ürünler",{views:[{state:"frozen",ySplit:1}]});
  sheet.columns=[
    {header:"Ürün ID",key:"id",width:38},{header:"Ürün adı",key:"name",width:34},{header:"URL",key:"slug",width:30},{header:"Marka",key:"brand",width:20},{header:"SKU",key:"sku",width:22},{header:"Barkod",key:"barcode",width:20},{header:"Stok",key:"stock",width:12},{header:"Satış fiyatı",key:"price",width:16},{header:"Kategoriler",key:"categories",width:36},{header:"Yayında",key:"published",width:12},{header:"Arşiv",key:"archived",width:12},{header:"SEO başlığı",key:"seoTitle",width:36},{header:"SEO açıklaması",key:"seoDescription",width:50}
  ];
  const categoryMap=new Map(categories.map(category=>[category.id,category.slug]));
  for(const product of products)sheet.addRow({id:product.id,name:product.name,slug:product.slug,brand:product.brand||"",sku:product.sku||"",barcode:product.barcode||"",stock:product.stock_quantity,price:product.sale_price,categories:product.category_ids.map(id=>categoryMap.get(id)).filter(Boolean).join("|"),published:product.published?"Evet":"Hayır",archived:product.archived?"Evet":"Hayır",seoTitle:product.seo_title||"",seoDescription:product.seo_description||""});
  sheet.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF222431"}};cell.alignment={vertical:"middle"};});sheet.autoFilter={from:"A1",to:"M1"};sheet.getColumn("price").numFmt='#,##0.00 "₺"';
  const variants=workbook.addWorksheet("Varyasyonlar",{views:[{state:"frozen",ySplit:1}]});variants.columns=[{header:"Ürün ID",key:"product",width:38},{header:"Ürün",key:"name",width:32},{header:"SKU",key:"sku",width:24},{header:"Barkod",key:"barcode",width:20},{header:"Özellikler",key:"attributes",width:38},{header:"Stok",key:"stock",width:12},{header:"Fiyat",key:"price",width:16},{header:"Aktif",key:"active",width:12}];
  for(const product of products){const detail=(await import("@/lib/catalog-store")).getProduct;const complete=await detail(product.id);for(const variant of complete?.variants||[])variants.addRow({product:product.id,name:product.name,sku:variant.sku,barcode:variant.barcode||"",attributes:Object.entries(variant.attributes).map(([key,value])=>`${key}:${value}`).join("|"),stock:variant.stock_quantity,price:variant.sale_price,active:variant.active?"Evet":"Hayır"});}
  variants.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF315FD3"}};});
  const buffer=await workbook.xlsx.writeBuffer();
  return new Response(buffer,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="notisyon-katalog-${new Date().toISOString().slice(0,10)}.xlsx"`}});
}
