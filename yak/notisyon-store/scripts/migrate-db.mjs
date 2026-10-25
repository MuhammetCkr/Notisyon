import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const root = process.cwd();
const envFile = await fs.readFile(path.join(root, ".env.local"), "utf8").catch(() => "");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL .env.local içinde tanımlı değil.");
const schema = await fs.readFile(path.join(root, "db", "schema.sql"), "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
await client.connect();
try { await client.query("BEGIN"); await client.query(schema); await client.query("COMMIT"); console.log("Veritabanı şeması uygulandı."); }
catch (error) { await client.query("ROLLBACK"); throw error; }
finally { await client.end(); }
