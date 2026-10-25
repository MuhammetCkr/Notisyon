import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { queueTemplate } from "@/lib/notification-store";
import { readPlatformSettings, settingText } from "@/lib/platform-settings";

type NewsletterPayload = {
  email: string;
  consent: boolean;
  source: string;
};

async function readPayload(request: Request): Promise<NewsletterPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      email: String(body.email ?? "").trim().toLowerCase(),
      consent: body.consent === true,
      source: String(body.source ?? "footer").slice(0, 80),
    };
  }

  const form = await request.formData();
  return {
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    consent: ["true", "1", "on", "yes"].includes(String(form.get("consent") ?? "").toLowerCase()),
    source: String(form.get("source") ?? "footer-source").slice(0, 80),
  };
}

function safeReturnUrl(request: Request, state: "success" | "error") {
  const origin = new URL(request.url).origin;
  const referer = request.headers.get("referer");

  try {
    const target = new URL(referer || "/", origin);
    if (target.origin !== origin) return new URL(`/?newsletter=${state}`, origin);
    target.searchParams.set("newsletter", state);
    return target;
  } catch {
    return new URL(`/?newsletter=${state}`, origin);
  }
}

export async function POST(request: Request) {
  const acceptsJson = (request.headers.get("content-type") ?? "").includes("application/json");

  try {
    const body = await readPayload(request);
    if (!/^\S+@\S+\.\S+$/.test(body.email)) throw new Error("Geçerli bir e-posta adresi girin.");
    if (!body.consent) throw new Error("İletişim izni onayı zorunludur.");

    const db = getDb();
    const row = (
      await db.query(
        `INSERT INTO newsletter_subscribers(email,status,source,consent_at,unsubscribed_at)
         VALUES($1,'active',$2,now(),NULL)
         ON CONFLICT(email) DO UPDATE SET
           status='active',source=EXCLUDED.source,consent_at=now(),unsubscribed_at=NULL,updated_at=now()
         RETURNING id,email,status`,
        [body.email, body.source],
      )
    ).rows[0];

    await queueTemplate(
      db,
      "newsletter_welcome",
      { email: body.email },
      { email: body.email },
      {
        subject: "Notisyon bültenine hoş geldiniz",
        body: "Yeni ürünler, koleksiyonlar ve fırsatlardan ilk siz haberdar olacaksınız.",
      },
    );

    if (!acceptsJson) return NextResponse.redirect(safeReturnUrl(request, "success"), 303);
    const platform = await readPlatformSettings();
    return NextResponse.json({ subscriber: row, message: settingText(platform.texts, "newsletter_success", "Kaydınız alındı. Hoş geldiniz!") }, { status: 201 });
  } catch (error) {
    if (!acceptsJson) return NextResponse.redirect(safeReturnUrl(request, "error"), 303);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kayıt tamamlanamadı." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const email = String(((await request.json()) as Record<string, unknown>).email ?? "")
      .trim()
      .toLowerCase();
    if (!email) throw new Error("E-posta adresi zorunludur.");
    await getDb().query(
      `UPDATE newsletter_subscribers
       SET status='unsubscribed',unsubscribed_at=now(),updated_at=now()
       WHERE email=$1`,
      [email],
    );
    return NextResponse.json({ ok: true, message: "Bülten aboneliğiniz sonlandırıldı." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İşlem tamamlanamadı." },
      { status: 400 },
    );
  }
}
