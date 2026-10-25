"use client";

import { useState } from "react";
import { AdminEntityCenter } from "@/components/admin-entity-center";

export function AdminAutomationCenter() {
  const [state, setState] = useState("Kurallar kaydedildiğinde buradan toplu çalıştırılabilir."); const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); setState("Otomasyon kuralları çalıştırılıyor…"); try { const response = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setState((data.results || []).map((item: { name: string; message: string }) => `${item.name}: ${item.message}`).join(" · ") || "Etkin kural bulunamadı."); } catch (error) { setState(error instanceof Error ? error.message : "Otomasyon çalıştırılamadı."); } finally { setBusy(false); } }
  return <div className="automation-center"><section className="automation-runner"><div><span>OTOMASYON MOTORU</span><h2>Kuralları şimdi çalıştır</h2><p>{state}</p></div><button disabled={busy} onClick={() => void run()}>{busy ? "Çalıştırılıyor…" : "▶ Tüm etkin kuralları çalıştır"}</button></section><AdminEntityCenter mode="automation"/></div>;
}
