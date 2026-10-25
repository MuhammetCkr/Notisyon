import { Pool } from "pg";

declare global {
  var notisyonDb: Pool | undefined;
  var notisyonDbSignature: string | undefined;
}

function connectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL tanımlı değil.");
  const parsed = new URL(raw);
  // node-postgres bağlantı URL'sindeki sslmode değerini ssl nesnesinden sonra
  // tekrar uygulayabiliyor. TLS davranışını yalnızca aşağıdaki açık ayar yönetsin.
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("sslcert");
  parsed.searchParams.delete("sslkey");
  parsed.searchParams.delete("sslrootcert");
  return parsed.toString();
}

export function getDb() {
  const url = connectionString();
  const useSsl = process.env.DATABASE_SSL === "true";
  const signature = `${url}|ssl:${useSsl}|v2`;
  if (global.notisyonDb && global.notisyonDbSignature !== signature) {
    void global.notisyonDb.end().catch(() => undefined);
    global.notisyonDb = undefined;
  }
  if (!global.notisyonDb) {
    global.notisyonDb = new Pool({
      connectionString: url,
      // Supabase'in paylaşımlı pooler'ı TLS zincirinde kendi ara
      // sertifikasını kullanır. Trafik yine şifrelenir; yerel Node
      // ortamında SELF_SIGNED_CERT_IN_CHAIN hatasını bu ayar önler.
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    global.notisyonDbSignature = signature;
  }
  return global.notisyonDb;
}
