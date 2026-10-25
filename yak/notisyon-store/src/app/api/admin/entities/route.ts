import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

const allowed = new Set(["team", "order-stages", "customer-groups", "banners", "popups", "message-templates", "automation", "feeds", "contracts", "tax-rules", "regions"]);
const unauthorized = () => NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
const moduleOf = (value: unknown) => { const moduleName = String(value || ""); if (!allowed.has(moduleName)) throw new Error("Geçersiz modül"); return moduleName; };

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const moduleName = moduleOf(new URL(request.url).searchParams.get("module"));
    const rows = (await getDb().query("SELECT * FROM admin_entities WHERE module=$1 ORDER BY sort_order ASC, updated_at DESC", [moduleName])).rows;
    return NextResponse.json({ items: rows });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kayıtlar yüklenemedi" }, { status: 400 }); }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const body = await request.json();
    const moduleName = moduleOf(body.module);
    const name = String(body.name || "").trim();
    if (!name) throw new Error("Kayıt adı zorunludur");
    const status = ["active", "passive", "draft"].includes(body.status) ? body.status : "active";
    const data = typeof body.data === "object" && body.data ? body.data : {};
    const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
    const row = body.id
      ? (await getDb().query("UPDATE admin_entities SET name=$1,status=$2,data=$3,sort_order=$4,updated_at=now() WHERE id=$5 AND module=$6 RETURNING *", [name, status, data, sortOrder, body.id, moduleName])).rows[0]
      : (await getDb().query("INSERT INTO admin_entities(module,name,status,data,sort_order) VALUES($1,$2,$3,$4,$5) RETURNING *", [moduleName, name, status, data, sortOrder])).rows[0];
    if (!row) throw new Error("Kayıt bulunamadı");
    await getDb().query("INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES($1,$2,$3,$4)", [body.id ? "update" : "create", `admin_entity:${moduleName}`, row.id, JSON.stringify({ name, status })]);
    return NextResponse.json({ item: row });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kayıt kaydedilemedi" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const url = new URL(request.url); const moduleName = moduleOf(url.searchParams.get("module")); const id = String(url.searchParams.get("id") || "");
    if (moduleName === "customer-groups") { const used = Number((await getDb().query(`SELECT count(*)::int count FROM customers WHERE customer_group_id=$1`, [id])).rows[0]?.count || 0); if (used) throw new Error(`Bu gruba bağlı ${used} müşteri var. Önce müşterileri başka gruba taşıyın.`); }
    const row = (await getDb().query("DELETE FROM admin_entities WHERE id=$1 AND module=$2 RETURNING id,name", [id, moduleName])).rows[0];
    if (!row) throw new Error("Kayıt bulunamadı");
    await getDb().query("INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('delete',$1,$2,$3)", [`admin_entity:${moduleName}`, id, JSON.stringify({ name: row.name })]);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kayıt silinemedi" }, { status: 400 }); }
}
