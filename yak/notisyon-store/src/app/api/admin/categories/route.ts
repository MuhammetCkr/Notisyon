import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createCategory,deleteCategory,listCategories,updateCategory } from "@/lib/catalog-store";
import { revalidatePath } from "next/cache";
const slugify=(value:string)=>value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const unauthorized=()=>NextResponse.json({error:"Yetkisiz"},{status:401});
export async function GET(){if(!(await isAdminAuthenticated()))return unauthorized();return NextResponse.json(await listCategories());}
export async function POST(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();try{const b=await request.json(),row=await createCategory({...b,name:String(b.name||"").trim(),slug:slugify(String(b.slug||b.name||"")),parent_id:b.parent_id||null});revalidatePath("/","layout");return NextResponse.json(row,{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Kategori eklenemedi"},{status:400});}}
export async function PUT(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();try{const b=await request.json(),row=await updateCategory({...b,id:String(b.id),name:String(b.name||"").trim(),slug:slugify(String(b.slug||b.name||"")),parent_id:b.parent_id||null});revalidatePath("/","layout");return NextResponse.json(row);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Kategori güncellenemedi"},{status:400});}}
export async function DELETE(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();const url=new URL(request.url),id=url.searchParams.get("id"),replacementId=url.searchParams.get("replacementId");if(!id)return NextResponse.json({error:"Kimlik eksik"},{status:400});await deleteCategory(id,replacementId);revalidatePath("/","layout");return NextResponse.json({ok:true});}
