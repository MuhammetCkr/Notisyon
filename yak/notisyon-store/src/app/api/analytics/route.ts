import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const allowed=new Set(["page_view","product_view","add_to_cart","begin_checkout"]);

export async function POST(request:Request){
  try{
    const body=await request.json(),eventType=String(body.event_type||"");
    const visitorId=String(body.visitor_id||"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80);
    const sessionId=String(body.session_id||"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80);
    if(!allowed.has(eventType)||visitorId.length<8||sessionId.length<8)return NextResponse.json({error:"Geçersiz olay."},{status:400});
    await getDb().query(`INSERT INTO storefront_events(visitor_id,session_id,event_type,path,product_sku,cart_value) VALUES($1,$2,$3,$4,$5,$6)`,[visitorId,sessionId,eventType,String(body.path||"").slice(0,300)||null,String(body.product_sku||"").slice(0,100)||null,Number.isFinite(Number(body.cart_value))?Math.max(0,Number(body.cart_value)):null]);
    return NextResponse.json({ok:true},{status:201});
  }catch{return NextResponse.json({error:"Olay kaydedilemedi."},{status:400});}
}
