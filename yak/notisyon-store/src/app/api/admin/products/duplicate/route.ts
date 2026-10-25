import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { duplicateProduct } from "@/lib/catalog-store";

export async function POST(request:Request){if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});try{const {id}=await request.json();const productId=await duplicateProduct(String(id||""));return NextResponse.json({id:productId},{status:201});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Ürün kopyalanamadı."},{status:400});}}
