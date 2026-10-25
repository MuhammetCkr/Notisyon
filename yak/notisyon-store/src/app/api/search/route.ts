import { NextResponse } from "next/server";
import { searchStore } from "@/lib/search-store";
export async function GET(request:Request){try{return NextResponse.json(await searchStore(new URL(request.url).searchParams.get('q')||''))}catch{return NextResponse.json({error:'Arama şu anda tamamlanamadı.'},{status:500})}}
