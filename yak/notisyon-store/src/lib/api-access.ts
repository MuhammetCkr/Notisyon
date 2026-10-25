import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";

export type ApiScope="catalog:read"|"orders:read"|"orders:write"|"customers:read"|"inventory:write";

export async function authorizeApiRequest(request:Request,scope:ApiScope){
  const authorization=request.headers.get("authorization")||"";
  const token=authorization.startsWith("Bearer ")?authorization.slice(7).trim():"";
  if(!token)return null;
  const hash=createHash("sha256").update(token).digest("hex");
  const row=(await getDb().query(`SELECT id,name,scopes FROM api_access_tokens WHERE token_hash=$1 AND active=true AND (expires_at IS NULL OR expires_at>now())`,[hash])).rows[0];
  if(!row||(!row.scopes.includes("*")&&!row.scopes.includes(scope)))return null;
  await getDb().query(`UPDATE api_access_tokens SET last_used_at=now(),updated_at=now() WHERE id=$1`,[row.id]);
  return row as {id:string;name:string;scopes:string[]};
}
