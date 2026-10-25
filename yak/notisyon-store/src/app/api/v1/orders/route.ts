import { authorizeApiRequest } from "@/lib/api-access";
import { getDb } from "@/lib/db";

export async function GET(request:Request){
  if(!(await authorizeApiRequest(request,"orders:read")))return Response.json({error:"Geçersiz veya yetkisiz API anahtarı."},{status:401});
  const items=(await getDb().query(`SELECT o.id,o.order_number,o.status,o.currency,o.subtotal,o.shipping_total,o.grand_total,o.created_at,o.updated_at,json_agg(json_build_object('sku',i.sku,'name',i.name,'quantity',i.quantity,'unit_price',i.unit_price,'line_total',i.line_total) ORDER BY i.id) items FROM orders o LEFT JOIN order_items i ON i.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 500`)).rows;
  return Response.json({items,count:items.length});
}
