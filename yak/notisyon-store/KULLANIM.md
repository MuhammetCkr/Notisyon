# Notisyon kullanım notları

## Çalıştırma

```powershell
cd C:\Users\Harun\Documents\Codex\2026-10-21\yak\notisyon-store
npm run db:migrate
npm run dev -- -p 3002
```

Yönetim paneli `http://localhost:3002/admin`, mağaza `http://localhost:3002` adresindedir.

## Yönetim paneli kapsamı

- Genel bakış, satış raporları ve operasyon uyarıları
- Ürün, kategori ağacı, marka, tedarikçi, etiket, varyasyon, fiyat, stok ve SEO
- Sipariş, ödeme durumu, kargo, fatura, iade ve müşteri notları
- Müşteri 360°, gruplar, üyelik, adresler, sadakat ve hediye çekleri
- Kampanya, site içi arama raporu ve izinli bülten aboneleri
- Rehber/blog, sayfalar, formlar, dosyalar, banner, popup ve bloklar
- Görsel kimlik, header, footer, ürün kartları, ana sayfa blokları ve özel HTML/CSS/JavaScript
- Yönlendirme, canonical/meta, sitemap, robots ve 404 kayıtları
- Otomasyon, bildirim kuyruğu, mail/SMS şablonları ve denetim kayıtları
- Yönetici hesapları, roller ve modül bazlı yetkiler
- PayTR, HepsiJet, SMTP ve ürün feed bağlantı merkezi

## Güvenlik

Yönetici parolası, veritabanı adresi ve sağlayıcı anahtarları yalnızca `.env.local` dosyasına yazılır. Bu dosyayı paylaşmayın veya kaynak kontrolüne eklemeyin. Ekip üyelerini panelde **Sistem ve Güvenlik → Ekip ve Yetkiler** bölümünden ayrı hesaplarla yönetin.

## Dış servisleri canlıya alma

`.env.example` dosyasındaki PayTR, HepsiJet ve SMTP alanlarını sağlayıcı bilgilerinizle doldurup sunucuyu yeniden başlatın. Bağlantı Merkezi eksik ve hazır alanları otomatik olarak gösterir.
