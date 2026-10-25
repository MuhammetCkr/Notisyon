import { createHash,randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

const allowedScopes=new Set(["catalog:read","orders:read","orders:write","customers:read","inventory:write"]);
const denied=()=>NextResponse.json({error:"Yetkisiz"},{status:401});

export async function GET(){
  if(!(await isAdminAuthenticated()))return denied();
  const items=(await getDb().query(`SELECT id,name,token_prefix,scopes,active,expires_at,last_used_at,created_at FROM api_access_tokens ORDER BY created_at DESC`)).rows;
  return NextResponse.json({items});
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return denied();
  try{
    const body=await request.json(),name=String(body.name||"").trim();
    const requestedScopes=(Array.isArray(body.scopes)?body.scopes:[]).map((scope:unknown)=>String(scope));
    const scopes=[...new Set<string>(requestedScopes)].filter(scope=>allowedScopes.has(scope));
    if(!name)throw new Error("Yetki kodu adı zorunlu.");
    if(!scopes.length)throw new Error("En az bir erişim kapsamı seçin.");
    const secret=`nty_${randomBytes(32).toString("base64url")}`,prefix=secret.slice(0,12),hash=createHash("sha256").update(secret).digest("hex");
    const expiresAt=body.expires_at?new Date(String(body.expires_at)):null;
    if(expiresAt&&Number.isNaN(expiresAt.getTime()))throw new Error("Geçersiz son kullanma tarihi.");
    const row=(await getDb().query(`INSERT INTO api_access_tokens(name,token_prefix,token_hash,scopes,expires_at) VALUES($1,$2,$3,$4,$5) RETURNING id,name,token_prefix,scopes,active,expires_at,last_used_at,created_at`,[name,prefix,hash,scopes,expiresAt])).rows[0];
    await getDb().query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('create','api_access_token',$1,$2)`,[row.id,JSON.stringify({name,scopes,expiresAt})]);
    return NextResponse.json({item:row,token:secret},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Yetki kodu oluşturulamadı."},{status:400});}
}

export async function DELETE(request:Request){
  if(!(await isAdminAuthenticated()))return denied();
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return NextResponse.json({error:"Kimlik eksik."},{status:400});
  const row=(await getDb().query(`UPDATE api_access_tokens SET active=false,updated_at=now() WHERE id=$1 RETURNING id,name`,[id])).rows[0];
  if(!row)return NextResponse.json({error:"Yetki kodu bulunamadı."},{status:404});
  await getDb().query(`INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('revoke','api_access_token',$1,$2)`,[id,JSON.stringify({name:row.name})]);
  return NextResponse.json({ok:true});
}
