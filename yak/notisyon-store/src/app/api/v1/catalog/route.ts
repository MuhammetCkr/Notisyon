import { authorizeApiRequest } from "@/lib/api-access";
import { getDb } from "@/lib/db";

export async function GET(request:Request){
  if(!(await authorizeApiRequest(request,"catalog:read")))return Response.json({error:"Geçersiz veya yetkisiz API anahtarı."},{status:401});
  const items=(await getDb().query(`SELECT p.id,p.slug,p.name,p.brand,p.updated_at,json_agg(json_build_object('id',v.id,'sku',v.sku,'barcode',v.barcode,'stock',v.stock_quantity,'price',v.sale_price,'active',v.active) ORDER BY v.created_at) variants FROM products p LEFT JOIN product_variants v ON v.product_id=p.id WHERE p.archived=false GROUP BY p.id ORDER BY p.updated_at DESC`)).rows;
  return Response.json({items,count:items.length});
}
