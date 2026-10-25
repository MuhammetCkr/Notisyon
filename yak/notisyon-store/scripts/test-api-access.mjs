import fs from "node:fs/promises";
import path from "node:path";
import { createHmac } from "node:crypto";
import pg from "pg";

const envText=await fs.readFile(path.join(process.cwd(),".env.local"),"utf8");
for(const line of envText.split(/\r?\n/)){const match=line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,"");}
const expires=Date.now()+120_000,signature=createHmac("sha256",process.env.ADMIN_SECRET||"").update(String(expires)).digest("hex"),cookie=`notisyon_admin=${expires}.${signature}`,base=process.env.ADMIN_TEST_BASE_URL||"http://localhost:3002";
let tokenId="";
try{
  const create=await fetch(`${base}/api/admin/api-access`,{method:"POST",headers:{cookie,"content-type":"application/json"},body:JSON.stringify({name:"Otomatik doğrulama",scopes:["catalog:read"]})});
  const created=await create.json();if(!create.ok)throw new Error(created.error||`create ${create.status}`);tokenId=created.item.id;
  const catalog=await fetch(`${base}/api/v1/catalog`,{headers:{authorization:`Bearer ${created.token}`}});const payload=await catalog.json();if(!catalog.ok||!Array.isArray(payload.items))throw new Error(payload.error||`catalog ${catalog.status}`);
  const forbidden=await fetch(`${base}/api/v1/orders`,{headers:{authorization:`Bearer ${created.token}`}});if(forbidden.status!==401)throw new Error(`Kapsam kontrolü başarısız: ${forbidden.status}`);
  console.log(`API_ACCESS_OK: anahtar üretimi, katalog erişimi ve kapsam reddi doğrulandı (${payload.count} ürün).`);
}finally{
  if(tokenId){const parsed=new URL(process.env.DATABASE_URL);parsed.searchParams.delete("sslmode");const pool=new pg.Pool({connectionString:parsed.toString(),ssl:process.env.DATABASE_SSL==="true"?{rejectUnauthorized:false}:undefined});await pool.query(`DELETE FROM api_access_tokens WHERE id=$1`,[tokenId]);await pool.end();}
}
