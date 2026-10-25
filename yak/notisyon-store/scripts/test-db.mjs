import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("SUPABASE_ERROR: DATABASE_URL tanımlı değil.");
  process.exit(1);
}

let target;
try {
  target = new URL(process.env.DATABASE_URL);
} catch {
  console.error(
    "SUPABASE_ERROR: DATABASE_URL biçimi geçersiz. Tek tırnak, köşeli parantez ve boşluk kullanmayın.",
  );
  process.exit(1);
}
console.log(
  `Bağlantı hedefi: kullanıcı=${decodeURIComponent(target.username)}, sunucu=${target.hostname}, port=${target.port || "5432"}`,
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 1,
  connectionTimeoutMillis: 10_000,
});

try {
  const result = await pool.query(
    "SELECT count(*)::int AS table_count FROM information_schema.tables WHERE table_schema = 'public'",
  );
  console.log(`SUPABASE_OK: ${result.rows[0].table_count} public tablo bulundu.`);
} catch (error) {
  console.error(`SUPABASE_ERROR: ${error.code ?? "UNKNOWN"} ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
