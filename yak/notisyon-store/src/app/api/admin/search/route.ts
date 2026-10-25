import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { searchReport } from "@/lib/search-store";
export async function GET(){if(!(await isAdminAuthenticated()))return NextResponse.json({error:'Yetkisiz'},{status:401});return NextResponse.json(await searchReport())}
