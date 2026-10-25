import fs from "node:fs/promises";
import path from "node:path";
import { createHmac } from "node:crypto";
import pg from "pg";

const root=process.cwd(),envText=await fs.readFile(path.join(root,".env.local"),"utf8");
for(const line of envText.split(/\r?\n/)){const match=line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,"");}
if(!process.env.ADMIN_SECRET)throw new Error("ADMIN_SECRET tanımlı değil.");
const expires=Date.now()+60_000,signature=createHmac("sha256",process.env.ADMIN_SECRET).update(String(expires)).digest("hex"),cookie=`notisyon_admin=${expires}.${signature}`,base=process.env.CATALOG_TEST_BASE_URL||"http://localhost:3002";
const createdProducts=[],createdCategories=[];
async function request(url,init={}){const response=await fetch(`${base}${url}`,{...init,headers:{cookie,...init.headers}});const type=response.headers.get("content-type")||"";const data=type.includes("json")?await response.json():await response.arrayBuffer();if(!response.ok)throw new Error(`${init.method||"GET"} ${url}: ${response.status} ${data?.error||""}`);return {response,data};}
const json=body=>({"Content-Type":"application/json",body:JSON.stringify(body)});
try{
 for(const [route,expected] of [["/admin?range=30","30 gün"],["/admin/brands","Marka yönetimi"],["/admin/control/suppliers","Tedarikçi yönetimi"],["/admin/control/tags","Etiket yönetimi"],["/admin/control/feeds","XML ve ürün feed"],["/admin/products/new","Yeni ürün"]]){const page=await request(route);const html=new TextDecoder().decode(page.data);if(!html.includes(expected))throw new Error(`${route} yönetim ekranı doğrulanamadı.`);}
 const {data:categories}=await request("/api/admin/categories");if(!categories.length)throw new Error("Kategori bulunamadı.");
 const token=Date.now().toString(36),parent=(await request("/api/admin/categories",{method:"POST",...json({name:`QA Kategori ${token}`,slug:`qa-kategori-${token}`,parent_id:null,active:false})})).data;createdCategories.push(parent.id);
 const child=(await request("/api/admin/categories",{method:"POST",...json({name:`QA Alt ${token}`,slug:`qa-alt-${token}`,parent_id:parent.id,active:false})})).data;createdCategories.unshift(child.id);
 await request("/api/admin/categories/reorder",{method:"POST",...json({parentId:parent.id,orderedIds:[child.id]})});
 const cycleResponse=await fetch(`${base}/api/admin/categories/reorder`,{method:"POST",headers:{cookie,"Content-Type":"application/json"},body:JSON.stringify({parentId:child.id,orderedIds:[parent.id]})});
 if(cycleResponse.status!==400)throw new Error("Kategori döngüsü güvenlik kontrolü başarısız.");
 const product=(await request("/api/admin/products",{method:"POST",...json({name:`QA Ürün ${token}`,slug:`qa-urun-${token}`,brand:"Notisyon QA",published:false,category_ids:[child.id],sku:`QA-${token}`,stock_quantity:3,sale_price:99.9})})).data;createdProducts.push(product.id);
 await request(`/api/admin/products/${product.id}`);
 await request("/api/admin/products/bulk",{method:"POST",...json({ids:[product.id],action:"publish"})});
 await request("/api/admin/products/bulk",{method:"POST",...json({ids:[product.id],action:"stock",value:11})});
 await request("/api/admin/products/bulk",{method:"POST",...json({ids:[product.id],action:"price",value:129.9})});
 await request("/api/admin/products/bulk",{method:"POST",...json({ids:[product.id],action:"archive"})});
 await request("/api/admin/products/bulk",{method:"POST",...json({ids:[product.id],action:"unarchive"})});
 const duplicate=(await request("/api/admin/products/duplicate",{method:"POST",...json({id:product.id})})).data;createdProducts.push(duplicate.id);
 const exported=await request("/api/admin/products/export");if(!exported.response.headers.get("content-type")?.includes("spreadsheet")||exported.data.byteLength<1000)throw new Error("Excel çıktısı doğrulanamadı.");
 const csv=`Ürün adı,URL,Marka,SKU,Stok,Satış fiyatı,Kategoriler,Yayında\nQA İçe Aktarım ${token},qa-import-${token},Notisyon QA,QA-IMP-${token},7,75.5,${child.slug},Hayır\n`,form=new FormData();form.append("file",new Blob([csv],{type:"text/csv"}),"catalog-test.csv");const imported=(await request("/api/admin/products/import",{method:"POST",body:form})).data;if(imported.created!==1)throw new Error(`CSV içe aktarma başarısız: ${JSON.stringify(imported)}`);
 const {data:allProducts}=await request("/api/admin/products"),importedProduct=allProducts.find(item=>item.slug===`qa-import-${token}`);if(!importedProduct)throw new Error("İçe aktarılan ürün bulunamadı.");createdProducts.push(importedProduct.id);
 console.log(`CATALOG_ADMIN_OK: ürün CRUD, toplu işlemler, kopyalama, kategori hiyerarşisi, CSV içe aktarma ve Excel dışa aktarma doğrulandı.`);
}finally{
 for(const id of createdProducts.reverse())await request(`/api/admin/products?id=${id}`,{method:"DELETE"}).catch(()=>undefined);
 for(const id of createdCategories)await request(`/api/admin/categories?id=${id}`,{method:"DELETE"}).catch(()=>undefined);
 if(process.env.DATABASE_URL&&createdProducts.length){const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="true"?{rejectUnauthorized:false}:undefined});await db.connect();try{await db.query(`DELETE FROM admin_audit_log WHERE resource_id=ANY($1::text[])`,[createdProducts]);}finally{await db.end();}}
}
