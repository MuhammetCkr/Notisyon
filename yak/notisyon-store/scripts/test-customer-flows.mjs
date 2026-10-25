import fs from "node:fs/promises";
import path from "node:path";
import { createHmac } from "node:crypto";
import pg from "pg";

const root=process.cwd(),envText=await fs.readFile(path.join(root,".env.local"),"utf8");
for(const line of envText.split(/\r?\n/)){const match=line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,"")}
if(!process.env.ADMIN_SECRET||!process.env.DATABASE_URL)throw new Error("ADMIN_SECRET veya DATABASE_URL tanımlı değil.");
const base=process.env.ADMIN_TEST_BASE_URL||"http://localhost:3002",token=Date.now().toString(36),email=`qa-account-${token}@notisyon.test`,newsletterEmail=`qa-news-${token}@notisyon.test`,password="Qa-Test-2026!";
const expires=Date.now()+60_000,signature=createHmac("sha256",process.env.ADMIN_SECRET).update(String(expires)).digest("hex"),adminCookie=`notisyon_admin=${expires}.${signature}`;
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="true"?{rejectUnauthorized:false}:undefined});
let customerCookie="",customerId="",orderId="",variantId="",addressId="",orderQuantity=0;
async function jsonRequest(url,init={}){const response=await fetch(`${base}${url}`,{...init,headers:{"Content-Type":"application/json",...init.headers}}),data=await response.json();if(!response.ok)throw new Error(`${init.method||"GET"} ${url}: ${response.status} ${data.error||""}`);return{data,response}}
await db.connect();
try{
  const register=await jsonRequest("/api/account",{method:"POST",body:JSON.stringify({action:"register",email,password,firstName:"QA",lastName:"Hesap",phone:"05550000123"})});customerCookie=(register.response.headers.get("set-cookie")||"").split(";")[0];if(!customerCookie)throw new Error("Müşteri oturum çerezi oluşmadı.");customerId=register.data.customer.id;
  const account=(await jsonRequest("/api/account",{headers:{cookie:customerCookie}})).data;if(!account.authenticated||account.customer.email!==email)throw new Error("Müşteri hesabı doğrulanamadı.");
  const address=(await jsonRequest("/api/account",{method:"PUT",headers:{cookie:customerCookie},body:JSON.stringify({resource:"address",recipient_name:"QA Hesap",phone:"05550000123",line1:"Test Sokak 24",district:"Kadıköy",city:"İstanbul",postal_code:"34000"})})).data.address;addressId=address.id;
  const variant=(await db.query(`SELECT v.id,v.sku,v.stock_quantity FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active AND p.published AND v.stock_quantity>0 ORDER BY v.created_at LIMIT 1`)).rows[0];if(!variant)throw new Error("Test için stoklu ürün bulunamadı.");variantId=variant.id;orderQuantity=1;
  const checkout=(await jsonRequest("/api/orders",{method:"POST",headers:{cookie:customerCookie},body:JSON.stringify({customer:{email,firstName:"QA",lastName:"Hesap",phone:"05550000123"},shippingAddress:{recipientName:"QA Hesap",phone:"05550000123",line1:"Test Sokak 24",district:"Kadıköy",city:"İstanbul",postalCode:"34000"},items:[{sku:variant.sku,quantity:1}],legalConsent:true})})).data;orderId=checkout.orderId;
  await db.query(`UPDATE orders SET status='delivered' WHERE id=$1`,[orderId]);const item=(await db.query(`SELECT id FROM order_items WHERE order_id=$1 LIMIT 1`,[orderId])).rows[0];
  const returned=(await jsonRequest("/api/account",{method:"POST",headers:{cookie:customerCookie},body:JSON.stringify({action:"request_return",order_id:orderId,items:[{order_item_id:item.id,quantity:1,reason:"QA iade testi"}],reason:"QA iade testi",resolution:"refund"})})).data;if(!returned.return?.return_number)throw new Error("Müşteri iade talebi oluşmadı.");
  await jsonRequest("/api/newsletter",{method:"POST",body:JSON.stringify({email:newsletterEmail,consent:true,source:"qa"})});const newsletter=(await jsonRequest("/api/admin/newsletter",{headers:{cookie:adminCookie}})).data;if(!newsletter.items.some(row=>row.email===newsletterEmail))throw new Error("Bülten kaydı yönetim paneline düşmedi.");
  const search=(await jsonRequest("/api/search?q=defter")).data;if(!Array.isArray(search.products)||!Array.isArray(search.categories))throw new Error("Mağaza araması geçersiz yanıt verdi.");
  console.log("CUSTOMER_FLOWS_OK: üyelik, oturum, adres, sipariş, müşteri iadesi, bülten ve mağaza araması doğrulandı.");
}finally{
  await db.query(`DELETE FROM notification_jobs WHERE recipient=ANY($1::text[])`,[[email,newsletterEmail]]).catch(()=>undefined);
  await db.query(`DELETE FROM newsletter_subscribers WHERE email=$1`,[newsletterEmail]).catch(()=>undefined);
  if(orderId)await db.query(`DELETE FROM admin_audit_log WHERE details->>'orderId'=$1 OR resource_id IN (SELECT id FROM returns WHERE order_id=$1)`,[orderId]).catch(()=>undefined);
  if(orderId)await db.query(`DELETE FROM inventory_movements WHERE order_id=$1`,[orderId]).catch(()=>undefined);
  if(orderId)await db.query(`DELETE FROM orders WHERE id=$1`,[orderId]).catch(()=>undefined);
  if(variantId&&orderQuantity)await db.query(`UPDATE product_variants SET stock_quantity=stock_quantity+$2 WHERE id=$1`,[variantId,orderQuantity]).catch(()=>undefined);
  if(addressId)await db.query(`DELETE FROM addresses WHERE id=$1`,[addressId]).catch(()=>undefined);
  if(customerId)await db.query(`DELETE FROM customers WHERE id=$1`,[customerId]).catch(()=>undefined);
  await db.end();
}
