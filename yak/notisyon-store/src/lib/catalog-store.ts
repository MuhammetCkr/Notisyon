import { getDb } from "@/lib/db";

export type CategoryFilters = { brand:boolean; price:boolean; stock:boolean; features:boolean; supplier:boolean; rating:boolean };
export type AdminCategory = {
  id:string; name:string; slug:string; parent_id:string|null; product_count:number; created_at:string; updated_at:string;
  path?:string;
  description_html:string|null; category_code:string|null; google_category:string|null; google_product_type:string|null;
  sort_order:number; active:boolean; show_out_of_stock_last:boolean; seo_title:string|null; seo_description:string|null;
  seo_keywords:string|null; indexable:boolean; follow_links:boolean; social_title:string|null; social_description:string|null;
  social_image:string|null; filter_config:CategoryFilters;
};
export type AdminVariant = {
  id?:string; sku:string; barcode:string|null; variation_code:string|null; attributes:Record<string,string>;
  stock_quantity:number; sale_price:number; compare_at_price:number|null; purchase_price:number|null;
  supplier_code:string|null; gtin:string|null; image_url:string|null; critical_stock:number; active:boolean;
};
export type AdminProduct = {
  id:string; name:string; slug:string; brand:string|null; supplier:string|null; gtin:string|null; unit:string; vat_rate:number;
  purchase_price:number|null; market_price:number|null; weight:number|null; desi:number|null; width:number|null; height:number|null;
  depth:number|null; shipping_price:number|null; min_purchase:number; max_purchase:number|null; video_url:string|null; tags:string[];
  published:boolean; featured:boolean; is_new:boolean; is_deal:boolean; free_shipping:boolean; short_description:string|null;
  description_html:string|null; seo_title:string|null; seo_description:string|null; seo_keywords:string|null; canonical_url:string|null;
  indexable:boolean; follow_links:boolean; origin_country:string; delivery_days:number|null; critical_stock:number; currency:string;
  prices_include_vat:boolean; sku:string|null; barcode:string|null; variation_code:string|null; stock_quantity:number; sale_price:number;
  compare_at_price:number|null; image_url:string|null; image_urls:string[]; category_ids:string[]; attributes:Record<string,string>;
  variants:AdminVariant[]; archived:boolean; images:{url:string;alt_text:string;position:number}[]; updated_at:string;
};

const defaultCategories = [
  {name:"Çeyiz Defteri",slug:"ceyiz-defteri",children:[]},
  {name:"Tebrik Kartı",slug:"tebrik-karti",children:[{name:"Teşekkür Kartları",slug:"tesekkur-kartlari"}]},
  {name:"Defter",slug:"defter",children:[{name:"Çizgili Defterler",slug:"cizgili-defterler"},{name:"Kareli Defterler",slug:"kareli-defterler"},{name:"Çizgisiz Defterler",slug:"cizgisiz-defterler"},{name:"Çizgili-Kareli Defterler",slug:"cizgili-kareli-defterler"},{name:"Çizgili-Çizgisiz Defterler",slug:"cizgili-cizgisiz-defterler"}]},
  {name:"Planlayıcı",slug:"planlayici",children:[{name:"Hamilelik Planlayıcıları",slug:"hamilelik-planlayicilari"},{name:"Günlük Planlayıcılar",slug:"gunluk-planlayicilar"}]},
  {name:"Eğlence & Oyun",slug:"eglence-oyun",children:[{name:"Kutu Oyunları",slug:"kutu-oyunlari"}]},
  {name:"Düğün & Nikah",slug:"dugun-nikah",children:[{name:"Dini Nikah Belgesi",slug:"dini-nikah-belgesi"}]},
  {name:"Baskı Ürünleri",slug:"baski-urunleri",children:[{name:"Kartvizit Baskı",slug:"kartvizit-baski"}]},
];

async function ensureDefaultCategories(){
  const db=getDb(); const count=await db.query(`SELECT count(*)::int count FROM categories`);
  if(count.rows[0].count>0)return;
  const client=await db.connect();
  try{await client.query("BEGIN");for(const root of defaultCategories){const parent=await client.query(`INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,[root.name,root.slug]);for(const child of root.children)await client.query(`INSERT INTO categories(name,slug,parent_id) VALUES($1,$2,$3) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,parent_id=EXCLUDED.parent_id`,[child.name,child.slug,parent.rows[0].id]);}await client.query("COMMIT");}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}

export async function listCategories() {
  await ensureDefaultCategories();
  const result = await getDb().query(`SELECT c.*,COUNT(pc.product_id)::int product_count FROM categories c LEFT JOIN product_categories pc ON pc.category_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`);
  return result.rows as AdminCategory[];
}

export async function getCategoryBySlug(slug:string) {
  const result=await getDb().query(`WITH RECURSIVE category_paths AS (SELECT id,parent_id,name,name::text path FROM categories WHERE parent_id IS NULL UNION ALL SELECT c.id,c.parent_id,c.name,(cp.path||'>'||c.name)::text FROM categories c JOIN category_paths cp ON cp.id=c.parent_id) SELECT c.*,cp.path,COUNT(pc.product_id)::int product_count FROM categories c JOIN category_paths cp ON cp.id=c.id LEFT JOIN product_categories pc ON pc.category_id=c.id WHERE c.slug=$1 AND c.active=true GROUP BY c.id,cp.path`,[slug]);
  return result.rows[0] as AdminCategory|undefined;
}

export async function listCategoryChildren(parentId:string) {
  const result=await getDb().query(`SELECT id,name,slug,sort_order FROM categories WHERE parent_id=$1 AND active=true ORDER BY sort_order,name`,[parentId]);
  return result.rows as Array<{id:string;name:string;slug:string;sort_order:number}>;
}

type CategoryInput=Omit<Partial<AdminCategory>,"filter_config">&{name:string;slug:string;parent_id:string|null;filter_config?:Partial<CategoryFilters>};
const categoryValues=(input:CategoryInput)=>[input.name,input.slug,input.parent_id||null,input.description_html||null,input.category_code||null,input.google_category||null,input.google_product_type||null,Number(input.sort_order)||0,input.active!==false,input.show_out_of_stock_last!==false,input.seo_title||null,input.seo_description||null,input.seo_keywords||null,input.indexable!==false,input.follow_links!==false,input.social_title||null,input.social_description||null,input.social_image||null,{brand:true,price:true,stock:true,features:true,supplier:false,rating:false,...input.filter_config}];

export async function createCategory(input:CategoryInput) {
  const v=categoryValues(input); const result=await getDb().query(`INSERT INTO categories(name,slug,parent_id,description_html,category_code,google_category,google_product_type,sort_order,active,show_out_of_stock_last,seo_title,seo_description,seo_keywords,indexable,follow_links,social_title,social_description,social_image,filter_config) VALUES(${v.map((_,i)=>`$${i+1}`).join(",")}) RETURNING *`,v);
  await getDb().query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('create','category',$1,$2)`,[result.rows[0].id,JSON.stringify({name:input.name,slug:input.slug,parent_id:input.parent_id})]);
  return result.rows[0];
}

export async function updateCategory(input:CategoryInput&{id:string}) {
  if(input.parent_id===input.id) throw new Error("Kategori kendisinin altında olamaz.");
  if(input.parent_id){const cycle=await getDb().query(`WITH RECURSIVE descendants AS (SELECT id FROM categories WHERE parent_id=$1 UNION ALL SELECT c.id FROM categories c JOIN descendants d ON c.parent_id=d.id) SELECT 1 FROM descendants WHERE id=$2 LIMIT 1`,[input.id,input.parent_id]);if(cycle.rowCount)throw new Error("Kategori kendi alt kategorisinin altına taşınamaz.");}
  const v=categoryValues(input); const fields=["name","slug","parent_id","description_html","category_code","google_category","google_product_type","sort_order","active","show_out_of_stock_last","seo_title","seo_description","seo_keywords","indexable","follow_links","social_title","social_description","social_image","filter_config"];
  const result=await getDb().query(`UPDATE categories SET ${fields.map((key,i)=>`${key}=$${i+2}`).join(",")},updated_at=now() WHERE id=$1 RETURNING *`,[input.id,...v]);
  if(!result.rows[0])throw new Error("Kategori bulunamadı.");
  await getDb().query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('update','category',$1,$2)`,[input.id,JSON.stringify({name:input.name,slug:input.slug,parent_id:input.parent_id})]);
  return result.rows[0];
}

export async function deleteCategory(id:string,replacementId?:string|null) { const client=await getDb().connect();try{await client.query("BEGIN");const current=(await client.query(`SELECT name,slug FROM categories WHERE id=$1 FOR UPDATE`,[id])).rows[0];if(!current)throw new Error("Kategori bulunamadı.");if(replacementId&&replacementId!==id)await client.query(`INSERT INTO product_categories(product_id,category_id) SELECT product_id,$2 FROM product_categories WHERE category_id=$1 ON CONFLICT DO NOTHING`,[id,replacementId]);await client.query(`DELETE FROM categories WHERE id=$1`,[id]);await client.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('delete','category',$1,$2)`,[id,JSON.stringify({name:current.name,slug:current.slug,replacementId:replacementId||null})]);await client.query("COMMIT");}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();} }

export async function reorderCategories(parentId:string|null,orderedIds:string[]){
  const uniqueIds=[...new Set(orderedIds)];
  if(uniqueIds.length!==orderedIds.length)throw new Error("Kategori sıralamasında tekrar eden kayıt var.");
  const client=await getDb().connect();
  try{
    await client.query("BEGIN");
    const existing=await client.query(`SELECT id FROM categories WHERE id=ANY($1::uuid[]) FOR UPDATE`,[uniqueIds]);
    if(existing.rowCount!==uniqueIds.length)throw new Error("Sıralanacak kategorilerden biri bulunamadı.");
    if(parentId){
      const parent=await client.query(`SELECT id FROM categories WHERE id=$1 FOR UPDATE`,[parentId]);
      if(!parent.rowCount)throw new Error("Hedef üst kategori bulunamadı.");
      const cycle=await client.query(`
        WITH RECURSIVE descendants AS (
          SELECT id,parent_id FROM categories WHERE id=ANY($1::uuid[])
          UNION ALL
          SELECT c.id,c.parent_id FROM categories c JOIN descendants d ON c.parent_id=d.id
        )
        SELECT 1 FROM descendants WHERE id=$2 LIMIT 1
      `,[uniqueIds,parentId]);
      if(cycle.rowCount)throw new Error("Kategori kendisinin veya alt kategorisinin altına taşınamaz.");
    }
    for(let i=0;i<uniqueIds.length;i++)await client.query(`UPDATE categories SET parent_id=$1,sort_order=$2,updated_at=now() WHERE id=$3`,[parentId,i,uniqueIds[i]]);
    await client.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('reorder','category',$1,$2)`,[uniqueIds[0],JSON.stringify({parentId,orderedIds:uniqueIds})]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}

const productSelect=`SELECT p.*,p.vat_rate::float8,p.purchase_price::float8,p.market_price::float8,p.weight::float8,p.desi::float8,p.width::float8,p.height::float8,p.depth::float8,p.shipping_price::float8,
  v.sku,v.barcode,v.variation_code,v.attributes,COALESCE(v.stock_quantity,0)::int stock_quantity,COALESCE(v.sale_price,0)::float8 sale_price,v.compare_at_price::float8,
  i.url image_url,COALESCE((SELECT array_agg(pi.url ORDER BY pi.position,pi.created_at) FROM product_images pi WHERE pi.product_id=p.id),'{}') image_urls,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('url',pi.url,'alt_text',COALESCE(pi.alt_text,''),'position',pi.position) ORDER BY pi.position,pi.created_at) FROM product_images pi WHERE pi.product_id=p.id),'[]'::jsonb) images,
  COALESCE(array_agg(DISTINCT pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL),'{}') category_ids
  FROM products p
  LEFT JOIN LATERAL (SELECT * FROM product_variants WHERE product_id=p.id ORDER BY created_at LIMIT 1) v ON true
  LEFT JOIN LATERAL (SELECT url FROM product_images WHERE product_id=p.id ORDER BY position,created_at LIMIT 1) i ON true
  LEFT JOIN product_categories pc ON pc.product_id=p.id`;

export async function listProducts() {
  const result=await getDb().query(`${productSelect} GROUP BY p.id,v.sku,v.barcode,v.variation_code,v.attributes,v.stock_quantity,v.sale_price,v.compare_at_price,i.url ORDER BY p.updated_at DESC,p.name`);
  return result.rows as AdminProduct[];
}

export async function getProduct(id:string) {
  const result=await getDb().query(`${productSelect} WHERE p.id=$1 GROUP BY p.id,v.sku,v.barcode,v.variation_code,v.attributes,v.stock_quantity,v.sale_price,v.compare_at_price,i.url`,[id]);
  if(!result.rows[0])return null;
  const variants=await getDb().query(`SELECT id,sku,barcode,variation_code,attributes,stock_quantity::int,sale_price::float8,compare_at_price::float8,purchase_price::float8,supplier_code,gtin,image_url,critical_stock::int,active FROM product_variants WHERE product_id=$1 ORDER BY created_at,id`,[id]);
  return {...result.rows[0],variants:variants.rows} as AdminProduct;
}

export async function saveProduct(input:Partial<AdminProduct>&{name:string;slug:string}) {
  const db=getDb(); const client=await db.connect();
  try { await client.query("BEGIN");
    input.slug=(input.slug||input.name).toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const fields=["name","slug","brand","short_description","published","featured","is_new","is_deal","free_shipping","supplier","gtin","unit","vat_rate","purchase_price","market_price","weight","desi","width","height","depth","shipping_price","min_purchase","max_purchase","video_url","tags","description_html","seo_title","seo_description","seo_keywords","canonical_url","indexable","follow_links","origin_country","delivery_days","critical_stock","currency","prices_include_vat","archived"];
    const values=[input.name,input.slug,input.brand||null,input.short_description||null,!!input.published,!!input.featured,!!input.is_new,!!input.is_deal,!!input.free_shipping,input.supplier||null,input.gtin||null,input.unit||"ADET",Number(input.vat_rate)||0,input.purchase_price??null,input.market_price??null,input.weight??null,input.desi??null,input.width??null,input.height??null,input.depth??null,input.shipping_price??null,Math.max(1,Number(input.min_purchase)||1),input.max_purchase??null,input.video_url||null,input.tags||[],input.description_html||null,input.seo_title||null,input.seo_description||null,input.seo_keywords||null,input.canonical_url||null,input.indexable!==false,input.follow_links!==false,input.origin_country||"TR",input.delivery_days??null,Math.max(0,Number(input.critical_stock)||0),input.currency||"TRY",input.prices_include_vat!==false,!!input.archived];
    let productId=input.id;
    if(productId)await client.query(`UPDATE products SET ${fields.map((key,i)=>`${key}=$${i+2}`).join(",")},updated_at=now() WHERE id=$1`,[productId,...values]);
    else{const inserted=await client.query(`INSERT INTO products(${fields.join(",")}) VALUES(${values.map((_,i)=>`$${i+1}`).join(",")}) RETURNING id`,values); productId=inserted.rows[0].id;}
    if(input.variants!==undefined){
      if(!input.variants.length)throw new Error("Üründe en az bir varyasyon bulunmalıdır.");
      const skus=input.variants.map(v=>v.sku.trim()); if(skus.some(x=>!x))throw new Error("Her varyasyonun stok kodu zorunludur."); if(new Set(skus).size!==skus.length)throw new Error("Varyasyon stok kodları benzersiz olmalıdır.");
      const kept:string[]=[];
      for(const variant of input.variants){
        const vals=[variant.sku.trim(),variant.barcode||null,variant.variation_code||null,variant.attributes||{},Math.max(0,Number(variant.stock_quantity)||0),Math.max(0,Number(variant.sale_price)||0),variant.compare_at_price??null,variant.purchase_price??null,variant.supplier_code||null,variant.gtin||null,variant.image_url||null,Math.max(0,Number(variant.critical_stock)||0),variant.active!==false];
        if(variant.id){await client.query(`UPDATE product_variants SET sku=$3,barcode=$4,variation_code=$5,attributes=$6,stock_quantity=$7,sale_price=$8,compare_at_price=$9,purchase_price=$10,supplier_code=$11,gtin=$12,image_url=$13,critical_stock=$14,active=$15,updated_at=now() WHERE id=$1 AND product_id=$2`,[variant.id,productId,...vals]);kept.push(variant.id);}else{const inserted=await client.query(`INSERT INTO product_variants(product_id,sku,barcode,variation_code,attributes,stock_quantity,sale_price,compare_at_price,purchase_price,supplier_code,gtin,image_url,critical_stock,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,[productId,...vals]);kept.push(inserted.rows[0].id);}
      }
      await client.query(`DELETE FROM product_variants WHERE product_id=$1 AND NOT(id=ANY($2::uuid[]))`,[productId,kept]);
    }else{
      const existing=await client.query(`SELECT id FROM product_variants WHERE product_id=$1 ORDER BY created_at LIMIT 1`,[productId]);
      const vals=[input.sku||`NT-${String(productId).slice(0,8).toUpperCase()}`,input.barcode||null,input.variation_code||null,input.attributes||{},Math.max(0,Number(input.stock_quantity)||0),Math.max(0,Number(input.sale_price)||0),input.compare_at_price??null,input.purchase_price??null,input.gtin||null,Math.max(0,Number(input.critical_stock)||5)];
      if(existing.rows[0])await client.query(`UPDATE product_variants SET sku=$2,barcode=$3,variation_code=$4,attributes=$5,stock_quantity=$6,sale_price=$7,compare_at_price=$8,purchase_price=$9,gtin=$10,critical_stock=$11,updated_at=now() WHERE id=$1`,[existing.rows[0].id,...vals]);
      else await client.query(`INSERT INTO product_variants(product_id,sku,barcode,variation_code,attributes,stock_quantity,sale_price,compare_at_price,purchase_price,gtin,critical_stock) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[productId,...vals]);
    }
    await client.query(`DELETE FROM product_categories WHERE product_id=$1`,[productId]);
    for(const categoryId of input.category_ids||[]) await client.query(`INSERT INTO product_categories(product_id,category_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[productId,categoryId]);
    if(input.images||input.image_urls){const images=input.images?.length?input.images:(input.image_urls||[]).map((url,index)=>({url,alt_text:input.name,position:index}));await client.query(`DELETE FROM product_images WHERE product_id=$1`,[productId]);for(let index=0;index<images.length;index++)if(images[index].url)await client.query(`INSERT INTO product_images(product_id,url,alt_text,position) VALUES($1,$2,$3,$4)`,[productId,images[index].url,images[index].alt_text||input.name,index]);}
    await client.query("COMMIT"); return productId;
  } catch(error){ await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function deleteProduct(id:string){ await getDb().query(`DELETE FROM products WHERE id=$1`,[id]); }

export type ProductBulkAction="publish"|"unpublish"|"archive"|"unarchive"|"delete"|"category"|"stock"|"price";
export async function bulkUpdateProducts(ids:string[],action:ProductBulkAction,value?:string|number){
 if(!ids.length)return 0;const db=getDb();
 if(action==="delete"){const result=await db.query(`DELETE FROM products WHERE id=ANY($1::uuid[])`,[ids]);return result.rowCount||0;}
 if(action==="category"){if(!value)throw new Error("Kategori seçin.");const client=await db.connect();try{await client.query("BEGIN");for(const id of ids)await client.query(`INSERT INTO product_categories(product_id,category_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[id,String(value)]);await client.query("COMMIT");return ids.length;}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}}
 if(action==="stock"){
  const stock=Math.max(0,Math.trunc(Number(value)||0)),client=await db.connect();
  try{await client.query("BEGIN");const variants=await client.query(`SELECT id,stock_quantity FROM product_variants WHERE product_id=ANY($1::uuid[]) FOR UPDATE`,[ids]);for(const variant of variants.rows){const before=Number(variant.stock_quantity),difference=stock-before;await client.query(`UPDATE product_variants SET stock_quantity=$2,updated_at=now() WHERE id=$1`,[variant.id,stock]);await client.query(`INSERT INTO inventory_movements(variant_id,type,quantity,balance_after,note,actor) VALUES($1,'adjustment',$2,$3,'Toplu stok güncellemesi','Yönetici')`,[variant.id,difference,stock]);}await client.query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('bulk_stock_update','product',$1,$2)`,[ids[0],JSON.stringify({ids,stock,variants:variants.rowCount||0})]);await client.query("COMMIT");return variants.rowCount||0;}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
 }
 if(action==="price"){const result=await db.query(`UPDATE product_variants SET sale_price=$2,updated_at=now() WHERE product_id=ANY($1::uuid[])`,[ids,Math.max(0,Number(value)||0)]);return result.rowCount||0;}
 const map={publish:["published",true],unpublish:["published",false],archive:["archived",true],unarchive:["archived",false]} as const;const [column,state]=map[action];const result=await db.query(`UPDATE products SET ${column}=$2,updated_at=now() WHERE id=ANY($1::uuid[])`,[ids,state]);return result.rowCount||0;
}

export async function duplicateProduct(id:string){const source=await getProduct(id);if(!source)throw new Error("Ürün bulunamadı.");const token=Date.now().toString(36).slice(-5);const variants=source.variants.map((variant,index)=>({...variant,id:undefined,sku:`${variant.sku}-K${token}${index+1}`,barcode:null}));const copy={...source,id:undefined,name:`${source.name} — Kopya`,slug:`${source.slug}-kopya-${token}`,published:false,archived:false,variants,images:source.images};return saveProduct(copy);}
