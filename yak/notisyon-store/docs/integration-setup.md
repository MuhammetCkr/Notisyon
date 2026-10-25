# Canlıya alma ve entegrasyon notları

## Yerel geliştirme

1. `.env.example` dosyasını `.env.local` olarak kopyalayın.
2. Önce PostgreSQL bağlantınızı `DATABASE_URL` alanına girin.
3. `npm run db:migrate` ile tabloları oluşturun, ardından `npm run db:seed` ile Ticimax'tan aktarılan 47 ürünü veritabanına yükleyin.

## PayTR

`.env.local` içine mağaza panelinizdeki `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY` ve `PAYTR_MERCHANT_SALT` bilgilerini ekleyin. Geliştirme/test için `PAYTR_TEST_MODE=true` kalabilir; canlıya geçmeden önce `false` yapın.

Yayına çıktıktan sonra PayTR panelinde Bildirim URL olarak aşağıdaki adresi tanımlayın:

`https://alanadiniz.com/api/paytr/callback`

Bu endpoint PayTR'nin imzasını doğrular, tekrarlanan bildirimleri güvenle ele alır ve yalnızca ödeme bildirimi gerçekten başarılı olduğunda siparişi `paid` durumuna getirir. Kart verisi uygulamaya gelmez; PayTR iframe'inde kalır.

## HepsiJET

HepsiJET gönderi oluşturma adımı için kullanıcı adı/parola/müşteri kodunu `.env.local` içindeki alanlara girin. API uç noktası ve zorunlu alanlar sözleşmenize ait olduğundan, canlı entegrasyonu HepsiJET'in size sağladığı güncel teknik dokümanla eşleştirilmelidir. Siparişler ödeme onayından sonra `shipments` tablosunda izlenecek şekilde hazırlandı.

## Yayın öncesi kontrol

- PayTR test işlemini hem başarılı hem başarısız dönüşle doğrulayın.
- HepsiJET test ortamında gönderi oluşturmayı ve takip numarasını doğrulayın.
- Alan adı HTTPS ile yayında olmalı; PayTR bildirim URL'si dışarıdan erişilebilir olmalıdır.
