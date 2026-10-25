import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculatePromotion } from "@/lib/promotions";
import { calculateShipping } from "@/lib/commerce-config";
import { readCommerceConfig } from "@/lib/store-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subtotal = Math.max(0, Number(body.subtotal || 0));
    if (!subtotal) return NextResponse.json({ error: "Sepet tutarı geçersiz." }, { status: 400 });
    const config = await readCommerceConfig();
    const shipping = calculateShipping(subtotal, config.shipping);
    const result = await calculatePromotion(getDb(), String(body.code || ""), subtotal, shipping);
    return NextResponse.json({ ...result, total: Math.max(0, Math.round((subtotal + shipping - result.discount) * 100) / 100) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kod doğrulanamadı." }, { status: 400 });
  }
}
