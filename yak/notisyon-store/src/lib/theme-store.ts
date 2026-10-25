import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";

export type ThemeSettings = { custom_css: string; custom_js: string; updated_at?: string | null };
const localFile = path.join(process.cwd(), "src", "data", "theme-settings.json");

export async function readTheme(): Promise<ThemeSettings> {
  if (process.env.DATABASE_URL) {
    const result = await getDb().query("SELECT custom_css, custom_js, updated_at FROM site_theme WHERE id=1");
    return result.rows[0] || { custom_css: "", custom_js: "", updated_at: null };
  }
  try { return JSON.parse(await readFile(localFile, "utf8")) as ThemeSettings; }
  catch { return { custom_css: "", custom_js: "", updated_at: null }; }
}

export async function saveTheme(css: string, js: string) {
  if (process.env.DATABASE_URL) {
    await getDb().query("INSERT INTO site_theme (id,custom_css,custom_js,updated_at) VALUES (1,$1,$2,now()) ON CONFLICT (id) DO UPDATE SET custom_css=$1,custom_js=$2,updated_at=now()", [css, js]);
    return;
  }
  await writeFile(localFile, JSON.stringify({ custom_css: css, custom_js: js, updated_at: new Date().toISOString() }, null, 2), "utf8");
}
