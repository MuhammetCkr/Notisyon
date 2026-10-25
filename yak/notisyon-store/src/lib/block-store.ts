import { getDb } from "@/lib/db";

export type SiteBlock = {
  id: string;
  name: string;
  page_path: string;
  location: "page_top" | "page_bottom";
  html: string;
  css: string;
  js: string;
  position: number;
  active: boolean;
  updated_at?: string;
};

export async function listBlocks() {
  const result = await getDb().query<SiteBlock>("SELECT id,name,page_path,location,html,css,js,position,active,updated_at FROM site_blocks ORDER BY page_path,location,position,created_at");
  return result.rows;
}

export async function listActiveBlocks(pathname: string, location: SiteBlock["location"]) {
  const result = await getDb().query<SiteBlock>("SELECT id,name,page_path,location,html,css,js,position,active,updated_at FROM site_blocks WHERE active=true AND location=$1 AND (page_path='*' OR page_path=$2) ORDER BY position,created_at", [location, pathname]);
  return result.rows;
}

export async function createBlock(block: Omit<SiteBlock, "id">) {
  const result = await getDb().query<SiteBlock>("INSERT INTO site_blocks (name,page_path,location,html,css,js,position,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [block.name, block.page_path, block.location, block.html, block.css, block.js, block.position, block.active]);
  return result.rows[0];
}

export async function updateBlock(block: SiteBlock) {
  const result = await getDb().query<SiteBlock>("UPDATE site_blocks SET name=$2,page_path=$3,location=$4,html=$5,css=$6,js=$7,position=$8,active=$9,updated_at=now() WHERE id=$1 RETURNING *", [block.id, block.name, block.page_path, block.location, block.html, block.css, block.js, block.position, block.active]);
  return result.rows[0];
}

export async function deleteBlock(id: string) {
  await getDb().query("DELETE FROM site_blocks WHERE id=$1", [id]);
}
