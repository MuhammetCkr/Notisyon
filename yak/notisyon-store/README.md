# Notisyon Commerce OS

Notisyon mağazası ve yönetim paneli; Next.js 16, PostgreSQL ve React üzerinde çalışan tek projedir. Katalog, kategori ağacı, varyasyon/stok, sipariş, müşteri, iade, kampanya, sadakat, içerik, tasarım, SEO, ekip yetkileri, bildirim, otomasyon ve entegrasyon hazırlıklarını kapsar.

## Kurulum

```powershell
npm install
npm run db:migrate
npm run dev -- -p 3002
```

- Mağaza: `http://localhost:3002`
- Yönetim paneli: `http://localhost:3002/admin`
- Müşteri hesabı: `http://localhost:3002/hesabim`

Gizli değerler yalnızca `.env.local` içinde tutulur. İlk yönetici hesabı, `ADMIN_PASSWORD` tanımlıysa panelde Ekip ve Yetkiler bölümü ilk açıldığında oluşturulur. Parolayı kaynak dosyalarına veya dokümantasyona yazmayın.

## Doğrulama

```powershell
npm run lint
npx tsc --noEmit
npm run db:test
npm run catalog:test
npm run admin:test
npm run customer:test
npm run smoke:test
npm run build
```

## Dış servisler

PayTR, HepsiJet ve SMTP altyapıları hazırdır. Canlı bağlantı için `.env.example` içindeki ilgili sağlayıcı değerlerini `.env.local` dosyasına ekleyin. Kimlik bilgileri yönetim paneli veritabanına yazılmaz.
