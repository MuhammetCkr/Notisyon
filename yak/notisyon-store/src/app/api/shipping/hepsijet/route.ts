import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const required = ["HEPSIJET_API_BASE_URL", "HEPSIJET_USERNAME", "HEPSIJET_PASSWORD", "HEPSIJET_CUSTOMER_CODE"] as const;
const state = () => ({ configured: required.every((key) => Boolean(String(process.env[key] || "").trim())), fields: required.map((key) => ({ key, configured: Boolean(String(process.env[key] || "").trim()) })) });

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json({ provider: "HepsiJet", ...state(), capabilities: ["shipment_create", "label", "tracking", "cancel"] });
}

export async function POST() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!state().configured) return NextResponse.json({ error: "HepsiJet kimlik bilgileri eksik", code: "HEPSIJET_CONFIG_MISSING" }, { status: 503 });
  return NextResponse.json({ error: "Canlı gönderi işlemleri entegrasyon bilgileri doğrulandıktan sonra etkinleştirilecek", code: "HEPSIJET_LIVE_ACTION_DISABLED" }, { status: 501 });
}
