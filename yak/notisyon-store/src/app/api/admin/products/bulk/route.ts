import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { bulkUpdateProducts,type ProductBulkAction } from "@/lib/catalog-store";

const actions=new Set<ProductBulkAction>(["publish","unpublish","archive","unarchive","delete","category","stock","price"]);
export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});
  try{const body=await request.json();const ids=Array.isArray(body.ids)?body.ids.map(String):[],action=String(body.action) as ProductBulkAction;if(!ids.length)return NextResponse.json({error:"En az bir ürün seçin."},{status:400});if(!actions.has(action))return NextResponse.json({error:"Geçersiz toplu işlem."},{status:400});const affected=await bulkUpdateProducts(ids,action,body.value);revalidatePath("/","layout");return NextResponse.json({ok:true,affected});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Toplu işlem başarısız."},{status:400});}
}
