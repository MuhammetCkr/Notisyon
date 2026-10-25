CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_html TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_code TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS google_category TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS google_product_type TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_out_of_stock_last BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS indexable BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS follow_links BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS social_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS social_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS social_image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS filter_config JSONB NOT NULL DEFAULT '{"brand":true,"price":true,"stock":true,"features":true}'::jsonb;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_card_id TEXT UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  short_description TEXT,
  description_html TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_deal BOOLEAN NOT NULL DEFAULT false,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'ADET';
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS desi NUMERIC(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_purchase INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_purchase INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS indexable BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS follow_links BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_country TEXT NOT NULL DEFAULT 'TR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS critical_stock INTEGER NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'TRY';
ALTER TABLE products ADD COLUMN IF NOT EXISTS prices_include_vat BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_product_id TEXT,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  variation_code TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price >= 0),
  compare_at_price NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS supplier_code TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS critical_stock INTEGER NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS internal_note TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_marketing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_group_id UUID;

CREATE TABLE IF NOT EXISTS customer_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('password_reset','email_verification')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_auth_tokens_lookup_idx ON customer_auth_tokens(token_hash,purpose,expires_at);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_sessions_customer_idx ON customer_sessions(customer_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operasyon',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions(admin_user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'TR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('draft','pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
  grand_total NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS legal_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('paytr')),
  provider_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','paid','failed','cancelled')),
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_attempts DROP CONSTRAINT IF EXISTS payment_attempts_provider_check;
ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_provider_check CHECK (provider IN ('paytr','pos','bank_transfer','cash_on_delivery'));

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hepsijet')),
  tracking_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created',
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_by TEXT NOT NULL DEFAULT 'Yönetici',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS redirects (
  from_path TEXT PRIMARY KEY,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301,302)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id,customer_id)
);
CREATE INDEX IF NOT EXISTS product_reviews_product_idx ON product_reviews(product_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS search_queries (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed','blocked')),
  source TEXT NOT NULL DEFAULT 'footer',
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status,created_at DESC);

CREATE INDEX IF NOT EXISTS search_queries_report_idx ON search_queries(searched_at DESC,result_count,normalized_query);

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','received','refunded','cancelled')),
  reason TEXT NOT NULL,
  customer_note TEXT,
  admin_note TEXT,
  resolution TEXT NOT NULL DEFAULT 'refund' CHECK (resolution IN ('refund','exchange','store_credit')),
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  item_condition TEXT NOT NULL DEFAULT 'unopened',
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  UNIQUE(return_id,order_item_id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'paytr',
  provider_reference TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL DEFAULT 'manual_pending' CHECK (status IN ('requested','pending','completed','failed','manual_pending','cancelled')),
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft','issued','cancelled')),
  company_title TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  billing_address TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  subtotal NUMERIC(12,2) NOT NULL,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL,
  content_html TEXT NOT NULL,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS returns_order_idx ON returns(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS returns_status_idx ON returns(status,created_at DESC);
CREATE INDEX IF NOT EXISTS refunds_order_idx ON refunds(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS site_theme (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  custom_css TEXT NOT NULL DEFAULT '',
  custom_js TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_theme (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '*',
  location TEXT NOT NULL DEFAULT 'page_top' CHECK (location IN ('page_top','page_bottom')),
  html TEXT NOT NULL DEFAULT '',
  css TEXT NOT NULL DEFAULT '',
  js TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_blocks_page_location_idx ON site_blocks(page_path, location, active, position);
CREATE INDEX IF NOT EXISTS shipments_order_id_idx ON shipments(order_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage','fixed','free_shipping')),
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_amount NUMERIC(12,2) NOT NULL CHECK (initial_amount > 0),
  balance NUMERIC(12,2) NOT NULL CHECK (balance >= 0),
  minimum_order_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (minimum_order_total >= 0),
  recipient_email TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','used','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('issue','redeem','refund','adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS campaign_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  discount_amount NUMERIC(12,2) NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_redemptions_campaign_idx ON campaign_redemptions(campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem','refund','adjustment','expire')),
  points INTEGER NOT NULL,
  note TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL DEFAULT 'Yönetici',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gift_cards_status_idx ON gift_cards(status, created_at DESC);
CREATE INDEX IF NOT EXISTS loyalty_transactions_customer_idx ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sale','return','adjustment','import','initial')),
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  note TEXT,
  actor TEXT NOT NULL DEFAULT 'Sistem',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_type_check CHECK (type IN ('sale','return','adjustment','import','initial','cancellation'));

CREATE INDEX IF NOT EXISTS inventory_movements_variant_idx ON inventory_movements(variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_created_idx ON inventory_movements(created_at DESC);

CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_html TEXT NOT NULL DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_entities_module_idx ON admin_entities(module, sort_order, updated_at DESC);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  recipient text NOT NULL,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  provider_reference text,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_jobs_status_idx ON notification_jobs(status, scheduled_at);

INSERT INTO admin_entities(module,name,status,data,sort_order)
SELECT seed.module,seed.name,'active',seed.data::jsonb,seed.sort_order
FROM (VALUES
  ('order-stages','Ödeme bekleniyor','{"code":"pending_payment","color":"#d99614","customer_message":"Ödemeniz bekleniyor.","notify_customer":true}',10),
  ('order-stages','Ödeme alındı','{"code":"paid","color":"#198754","customer_message":"Ödemeniz alındı.","notify_customer":true}',20),
  ('order-stages','Hazırlanıyor','{"code":"processing","color":"#315fd3","customer_message":"Siparişiniz hazırlanıyor.","notify_customer":true}',30),
  ('order-stages','Kargoya verildi','{"code":"shipped","color":"#6f42c1","customer_message":"Siparişiniz kargoya verildi.","notify_customer":true}',40),
  ('order-stages','Teslim edildi','{"code":"delivered","color":"#157347","customer_message":"Siparişiniz teslim edildi.","notify_customer":true}',50),
  ('customer-groups','Perakende','{"discount":0,"credit_limit":0,"payment_term_days":0,"approval_required":false}',10),
  ('customer-groups','Bayi','{"discount":10,"credit_limit":0,"payment_term_days":0,"approval_required":true}',20),
  ('message-templates','Sipariş alındı','{"event":"order_created","channel":"email","sender_name":"Notisyon","subject":"Siparişiniz alındı: {{order_number}}","body":"Merhaba {{customer_name}}, siparişiniz başarıyla alındı."}',10),
  ('message-templates','Sipariş kargoda','{"event":"order_shipped","channel":"email","sender_name":"Notisyon","subject":"Siparişiniz kargoya verildi","body":"{{order_number}} numaralı siparişiniz {{tracking_number}} takip numarasıyla yola çıktı."}',20),
  ('message-templates','İade alındı','{"event":"return_received","channel":"email","sender_name":"Notisyon","subject":"İadeniz teslim alındı","body":"{{return_number}} numaralı iade kaydınız teslim alındı."}',30),
  ('automation','Ödenmeyen siparişi iptal et','{"trigger":"unpaid_order","action":"cancel_order","delay_minutes":1440,"condition":"Ödeme durumu beklemede"}',10),
  ('automation','Kritik stok bildirimi','{"trigger":"low_stock","action":"send_notification","delay_minutes":0,"condition":"Stok kritik eşik veya altında"}',20)
) AS seed(module,name,data,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM admin_entities current WHERE current.module=seed.module AND current.name=seed.name);

INSERT INTO admin_entities(module,name,status,data,sort_order)
SELECT seed.module,seed.name,'active',seed.data::jsonb,seed.sort_order
FROM (VALUES
  ('contracts','Mesafeli Satış Sözleşmesi','{"type":"Mesafeli satış","version":"1.0","required":true,"content":"<h2>Mesafeli Satış Sözleşmesi</h2><p>Bu sözleşme, Notisyon mağazası ile sipariş veren alıcı arasında elektronik ortamda kurulmuştur.</p><h3>Sipariş ve ödeme</h3><p>Ürün, fiyat, teslimat ve ödeme bilgileri sipariş özeti üzerinde alıcıya sunulur. Sipariş, ödeme onayının alınmasıyla işleme alınır.</p><h3>Teslimat ve cayma hakkı</h3><p>Teslimat, siparişte belirtilen adrese yapılır. Tüketici, yasal istisnalar saklı kalmak üzere teslimden itibaren 14 gün içinde cayma hakkını kullanabilir.</p><h3>İletişim</h3><p>Taleplerinizi destek@notisyon.com adresine iletebilirsiniz.</p>"}',10),
  ('contracts','Ön Bilgilendirme Formu','{"type":"Ön bilgilendirme","version":"1.0","required":true,"content":"<h2>Ön Bilgilendirme Formu</h2><p>Sipariş vermeden önce ürünlerin temel niteliklerini, vergiler dahil satış fiyatını, kargo ücretini ve teslimat koşullarını sipariş özetinde görebilirsiniz.</p><h3>Satıcı bilgileri</h3><p>Notisyon müşteri hizmetlerine destek@notisyon.com adresinden ulaşabilirsiniz.</p><h3>İade koşulları</h3><p>İade talebinizi hesabınız veya müşteri hizmetleri üzerinden iletebilirsiniz. Kullanılmış, kişiselleştirilmiş veya hijyen nedeniyle iadesi uygun olmayan ürünlerde yasal istisnalar uygulanır.</p>"}',20),
  ('contracts','Gizlilik ve KVKK Metni','{"type":"KVKK","version":"1.0","required":false,"content":"<h2>Gizlilik ve Kişisel Veriler</h2><p>Kişisel verileriniz siparişin kurulması, teslimat, müşteri hizmetleri, güvenlik ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.</p><p>Pazarlama ileti tercihlerinizi hesabınızdan değiştirebilir; veri sahibi taleplerinizi destek@notisyon.com adresine iletebilirsiniz.</p>"}',30)
) AS seed(module,name,data,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM admin_entities current WHERE current.module='contracts' AND current.name=seed.name);

INSERT INTO store_settings(key,value) VALUES
('general','{"store_name":"Notisyon","support_email":"destek@notisyon.com","support_phone":"05526453061","currency":"TRY","timezone":"Europe/Istanbul"}'::jsonb),
('shipping','{"free_shipping_threshold":350,"default_provider":"hepsijet"}'::jsonb),
('checkout','{"guest_checkout":true,"minimum_order_total":0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO blog_categories(name,slug,description) VALUES
('Çeyiz & Düğün Rehberi','ceyiz-dugun-rehberi','Çeyiz hazırlığı, düğün planlama ve özel günlere yönelik Notisyon rehberleri.'),
('Planlama & Ajanda','planlama-ajanda-rehberi','Zamanı, bütçeyi ve günlük düzeni daha bilinçli yönetmek için uygulanabilir öneriler.'),
('Oyun & Eğlence','oyun-eglence','Birlikte geçirilen zamanı keyifli hale getiren oyunlar, etkinlikler ve kutlama fikirleri.'),
('Defter & Kırtasiye','defter-kirtasiye-rehberi','İhtiyacınıza uygun defter, planlayıcı ve kırtasiye ürünlerini seçmenize yardımcı olan rehberler.')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  cover_alt TEXT,
  author TEXT NOT NULL DEFAULT 'Notisyon',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS indexable BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS follow_links BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;

CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts(published, published_at DESC);

CREATE TABLE IF NOT EXISTS site_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  form_type TEXT NOT NULL DEFAULT 'standard', description TEXT NOT NULL DEFAULT '',
  success_message TEXT NOT NULL DEFAULT 'Formunuz başarıyla gönderildi.', fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), form_id UUID NOT NULL REFERENCES site_forms(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS form_submissions_form_idx ON form_submissions(form_id,created_at DESC);

CREATE TABLE IF NOT EXISTS seo_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), url TEXT NOT NULL UNIQUE, canonical_url TEXT,
  seo_title TEXT, seo_description TEXT, seo_keywords TEXT, indexable BOOLEAN NOT NULL DEFAULT true,
  follow_links BOOLEAN NOT NULL DEFAULT true, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS not_found_logs (
  path TEXT PRIMARY KEY, visit_count INTEGER NOT NULL DEFAULT 1, first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_access_tokens_active_idx ON api_access_tokens(active, expires_at);

CREATE TABLE IF NOT EXISTS storefront_events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','product_view','add_to_cart','begin_checkout')),
  path TEXT,
  product_sku TEXT,
  cart_value NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS storefront_events_period_idx ON storefront_events(created_at, event_type);
CREATE INDEX IF NOT EXISTS storefront_events_session_idx ON storefront_events(session_id, created_at);
