import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSettings, saveSettings } from "@/lib/admin-operations-store";
import { defaultIntegrationConfigs, integrationReadiness, type IntegrationConfig } from "@/lib/integration-registry";

const unauthorized = () => NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

async function currentConfigs() {
  const settings = await getSettings();
  const stored = Array.isArray(settings.integrations) ? settings.integrations as IntegrationConfig[] : [];
  return defaultIntegrationConfigs.map((base) => ({ ...base, ...stored.find((item) => item.id === base.id), settings: { ...base.settings, ...stored.find((item) => item.id === base.id)?.settings } }));
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const integrations = integrationReadiness(await currentConfigs());
  return NextResponse.json({ integrations, summary: { total: integrations.length, operational: integrations.filter((item) => item.operational).length, awaitingCredentials: integrations.filter((item) => item.status === "credentials_missing" || item.status === "setup_required").length } });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const body = await request.json();
    const id = String(body.id || "");
    const configs = await currentConfigs();
    const current = configs.find((item) => item.id === id);
    if (!current) return NextResponse.json({ error: "Bilinmeyen entegrasyon" }, { status: 400 });
    const next: IntegrationConfig = {
      ...current,
      enabled: Boolean(body.enabled),
      mode: body.mode === "production" ? "production" : "test",
      account: String(body.account || "").trim(),
      endpoint: String(body.endpoint || current.endpoint).trim(),
      settings: typeof body.settings === "object" && body.settings ? { ...current.settings, ...body.settings } : current.settings,
    };
    await saveSettings("integrations", configs.map((item) => item.id === id ? next : item));
    return NextResponse.json({ integration: integrationReadiness(configs.map((item) => item.id === id ? next : item)).find((item) => item.id === id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Entegrasyon kaydedilemedi" }, { status: 400 });
  }
}
