import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { processNotificationQueue } from "@/lib/notification-processor";

const unauthorized = () => NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const rows = (await getDb().query("SELECT * FROM notification_jobs ORDER BY created_at DESC LIMIT 250")).rows;
  const counts = (await getDb().query("SELECT status,count(*)::int count FROM notification_jobs GROUP BY status")).rows;
  return NextResponse.json({ items: rows, counts: Object.fromEntries(counts.map((row) => [row.status, row.count])), providerReady: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM) });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const body = await request.json();
    if (body.action === "process") return NextResponse.json(await processNotificationQueue(Number(body.limit) || 25));
    if (body.action === "retry") {
      const row = (await getDb().query("UPDATE notification_jobs SET status='queued',last_error=NULL,scheduled_at=now(),updated_at=now() WHERE id=$1 RETURNING *", [body.id])).rows[0];
      if (!row) throw new Error("Bildirim bulunamadı");
      return NextResponse.json({ item: row });
    }
    const recipient = String(body.recipient || "").trim(); const content = String(body.body || "").trim();
    if (!recipient || !content) throw new Error("Alıcı ve mesaj zorunludur");
    const channel = body.channel === "sms" ? "sms" : "email";
    const row = (await getDb().query("INSERT INTO notification_jobs(event_type,channel,recipient,subject,body,status,payload) VALUES('manual',$1,$2,$3,$4,'queued',$5) RETURNING *", [channel, recipient, String(body.subject || ""), content, JSON.stringify({ source: "admin" })])).rows[0];
    await getDb().query("INSERT INTO admin_audit_log(action,resource_type,resource_id,details) VALUES('create','notification',$1,$2)", [row.id, JSON.stringify({ channel, recipient })]);
    return NextResponse.json({ item: row });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Bildirim oluşturulamadı" }, { status: 400 }); }
}
