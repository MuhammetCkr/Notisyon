"use client";
import { usePathname } from "next/navigation";
export function StorefrontMaintenance({ enabled, title, text }: { enabled: boolean; title: string; text: string }) { const pathname = usePathname(); if (!enabled || pathname.startsWith("/admin") || pathname.startsWith("/api")) return null; return <main className="store-maintenance" role="status"><div className="store-maintenance-mark">N</div><span>NOTİSYON</span><h1>{title}</h1><p>{text}</p><small>Yönetim paneli ve sistem servisleri çalışmaya devam ediyor.</small></main>; }
