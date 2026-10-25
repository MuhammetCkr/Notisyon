import { NextResponse } from "next/server";
import { listActiveBlocks, type SiteBlock } from "@/lib/block-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.searchParams.get("path") || "/";
  const location: SiteBlock["location"] = url.searchParams.get("location") === "page_bottom" ? "page_bottom" : "page_top";
  return NextResponse.json(await listActiveBlocks(pathname, location));
}
