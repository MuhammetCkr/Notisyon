import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readPlatformSettings, settingBoolean, settingText } from "@/lib/platform-settings";

export async function GET() {
  const db = getDb();
  const [entities, cookies, platform] = await Promise.all([
    db.query(`SELECT id,module,name,data,sort_order FROM admin_entities WHERE module=ANY($1::text[]) AND status='active' ORDER BY sort_order,id`, [["banners", "popups"]]),
    db.query(`SELECT value FROM store_settings WHERE key='control_cookies'`),
    readPlatformSettings(),
  ]);
  const now = Date.now();
  const active = entities.rows.filter((row) => {
    const start = row.data?.starts_at ? new Date(row.data.starts_at).getTime() : 0;
    const end = row.data?.ends_at ? new Date(row.data.ends_at).getTime() : Number.POSITIVE_INFINITY;
    return start <= now && end >= now;
  });
  const cookieSettings = { consent_banner: true, analytics_default: false, marketing_default: false, preference_days: 180, show_reject_all: true, ...(cookies.rows[0]?.value || {}), ...(settingBoolean(platform.site, "cookie_management", true) ? {} : { consent_banner: false }) };
  return NextResponse.json({
    banners: active.filter((row) => row.module === "banners").map(({ id, name, data }) => ({ id, name, ...data })),
    popups: active.filter((row) => row.module === "popups").map(({ id, name, data }) => ({ id, name, ...data })),
    cookieSettings,
    publicSettings: { marketing: {
      ga4Id: settingText(platform.marketing, "ga4_id"), gtmId: settingText(platform.marketing, "gtm_id"), googleAdsId: settingText(platform.marketing, "google_ads_id"), metaPixelId: settingText(platform.marketing, "meta_pixel_id"), tiktokPixelId: settingText(platform.marketing, "tiktok_pixel_id"), yandexMetricaId: settingText(platform.marketing, "yandex_metrica_id"), klaviyoPublicKey: settingText(platform.marketing, "klaviyo_public_key"), klaviyoEnabled: settingBoolean(platform.marketing, "klaviyo_enabled"),
    } },
  });
}
