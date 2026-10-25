import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { reorderCategories } from "@/lib/catalog-store";

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});
  try{const body=await request.json();const ids=Array.isArray(body.orderedIds)?body.orderedIds.map(String):[];if(!ids.length)return NextResponse.json({error:"Kategori sırası boş."},{status:400});await reorderCategories(body.parentId?String(body.parentId):null,ids);return NextResponse.json({ok:true});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sıralama kaydedilemedi."},{status:400});}
}
