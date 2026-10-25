import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProduct,listCategories,listProducts,saveProduct } from "@/lib/catalog-store";

type ImportRow=Record<string,string|number|boolean|null>;
const yes=(value:unknown)=>["evet","yes","true","1"].includes(String(value??"").trim().toLocaleLowerCase("tr-TR"));
const csvLine=(line:string)=>{const cells:string[]=[];let current="",quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(char===","&&!quoted){cells.push(current);current="";}else current+=char;}cells.push(current);return cells;};

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});
  try{
    const form=await request.formData(),file=form.get("file");if(!(file instanceof File))return NextResponse.json({error:"Excel veya CSV dosyası seçin."},{status:400});
    const bytes=await file.arrayBuffer();let rows:ImportRow[]=[];
    if(file.name.toLocaleLowerCase("tr-TR").endsWith(".csv")){const lines=new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean),headers=csvLine(lines.shift()||"");rows=lines.map(line=>Object.fromEntries(csvLine(line).map((value,index)=>[headers[index],value])));}
    else{const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes);const sheet=workbook.getWorksheet("Ürünler")||workbook.worksheets[0];if(!sheet)throw new Error("Çalışma sayfası bulunamadı.");const headers=(sheet.getRow(1).values as unknown[]).slice(1).map(String);sheet.eachRow((row,index)=>{if(index===1)return;const values=(row.values as unknown[]).slice(1);if(values.some(value=>String(value??"").trim()))rows.push(Object.fromEntries(headers.map((header,column)=>[header,typeof values[column]==="object"&&values[column]&&"text" in (values[column] as object)?String((values[column] as {text:unknown}).text):values[column] as string|number|boolean|null])));});}
    const [products,categories]=await Promise.all([listProducts(),listCategories()]),bySku=new Map(products.filter(item=>item.sku).map(item=>[String(item.sku).toLocaleLowerCase("tr-TR"),item])),categoryBySlug=new Map(categories.map(item=>[item.slug,item.id]));let created=0,updated=0,failed=0;const errors:string[]=[];
    for(const [index,row] of rows.entries()){try{const name=String(row["Ürün adı"]||row.name||"").trim(),sku=String(row.SKU||row.sku||"").trim();if(!name||!sku)throw new Error("Ürün adı ve SKU zorunlu.");const existing=bySku.get(sku.toLocaleLowerCase("tr-TR")),detail=existing?await getProduct(existing.id):null;const categoryIds=String(row.Kategoriler||row.categories||"").split("|").map(value=>categoryBySlug.get(value.trim())).filter((value):value is string=>Boolean(value));const variant=detail?.variants[0]||{sku,barcode:null,variation_code:null,attributes:{},stock_quantity:0,sale_price:0,compare_at_price:null,purchase_price:null,supplier_code:null,gtin:null,image_url:null,critical_stock:5,active:true};await saveProduct({...detail,name,slug:String(row.URL||row.slug||detail?.slug||name),brand:String(row.Marka||row.brand||detail?.brand||"Notisyon"),category_ids:categoryIds.length?categoryIds:detail?.category_ids||[],images:detail?.images||[],image_urls:detail?.image_urls||[],published:row.Yayında!==undefined?yes(row.Yayında):detail?.published||false,archived:row.Arşiv!==undefined?yes(row.Arşiv):detail?.archived||false,seo_title:String(row["SEO başlığı"]||detail?.seo_title||""),seo_description:String(row["SEO açıklaması"]||detail?.seo_description||""),variants:[{...variant,sku,barcode:String(row.Barkod||row.barcode||variant.barcode||"")||null,stock_quantity:Number(row.Stok??row.stock??variant.stock_quantity)||0,sale_price:Number(row["Satış fiyatı"]??row.price??variant.sale_price)||0}]});if(existing)updated++;else created++;}catch(error){failed++;errors.push(`Satır ${index+2}: ${error instanceof Error?error.message:"İşlenemedi"}`);}}
    revalidatePath("/","layout");return NextResponse.json({created,updated,failed,errors:errors.slice(0,10)});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Dosya içe aktarılamadı."},{status:400});}
}
