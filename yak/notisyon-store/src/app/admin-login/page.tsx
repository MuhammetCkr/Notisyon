import Link from "next/link";
import { Suspense } from "react";
import {
  AdminLoginForm,
  AdminLoginFormFromUrl,
} from "@/components/admin-login-form";

export default function AdminLogin() {
  return (
    <main className="admin-login-v3 admin-login-corporate">
      <section className="login-brand-panel">
        <Link href="/" className="login-wordmark" aria-label="Notisyon ana sayfa">
          <span className="login-wordmark-mark">N</span>
          <span>
            <strong>NOTİSYON</strong>
            <small>COMMERCE OS</small>
          </span>
        </Link>

        <div className="login-brand-message">
          <p className="login-eyebrow">YÖNETİM VE OPERASYON</p>
          <h1>Mağazanızın kontrol merkezi.</h1>
          <p>
            Katalog, sipariş, müşteri, içerik ve mağaza ayarlarınızı tek bir
            güvenli çalışma alanından yönetin.
          </p>
        </div>

        <ul className="login-capabilities" aria-label="Yönetim paneli kapsamı">
          <li><b>Katalog yönetimi</b><span>Ürün, stok ve fiyat operasyonları</span></li>
          <li><b>Sipariş merkezi</b><span>Ödeme, hazırlık ve teslimat akışı</span></li>
          <li><b>Mağaza yönetimi</b><span>Tasarım, içerik ve performans ayarları</span></li>
        </ul>

        <footer className="login-brand-footer">
          <span>Notisyon Commerce OS</span>
          <span>Kurumsal yönetim altyapısı</span>
        </footer>
      </section>

      <section className="login-access-panel">
        <header className="login-access-header">
          <div className="login-environment">
            <span aria-hidden="true" />
            Sistem çevrimiçi
          </div>
          <Link href="/">Mağazaya dön →</Link>
        </header>

        <div className="login-access-content">
          <div className="login-intro">
            <p className="login-eyebrow">YETKİLİ ERİŞİMİ</p>
            <h2>Yönetim paneline giriş</h2>
            <p>Devam etmek için yönetici hesabınızla güvenli oturum açın.</p>
          </div>
          <Suspense fallback={<AdminLoginForm hasError={false} />}>
            <AdminLoginFormFromUrl />
          </Suspense>
        </div>

        <footer className="login-access-footer">
          <span>© 2026 Notisyon</span>
          <span>Güvenli bağlantı · Oturum koruması etkin</span>
        </footer>
      </section>
    </main>
  );
}