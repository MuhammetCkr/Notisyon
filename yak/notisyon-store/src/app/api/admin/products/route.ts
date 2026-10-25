import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteProduct,listProducts,saveProduct } from "@/lib/catalog-store";
import { revalidatePath } from "next/cache";
const unauthorized=()=>NextResponse.json({error:"Yetkisiz"},{status:401});
export async function GET(){if(!(await isAdminAuthenticated()))return unauthorized();return NextResponse.json(await listProducts());}
export async function POST(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();try{const body=await request.json();const id=await saveProduct(body);revalidatePath("/","layout");return NextResponse.json({id},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ürün kaydedilemedi"},{status:400});}}
export async function PUT(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();try{const body=await request.json();const id=await saveProduct(body);revalidatePath("/","layout");return NextResponse.json({id});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ürün kaydedilemedi"},{status:400});}}
export async function DELETE(request:Request){if(!(await isAdminAuthenticated()))return unauthorized();const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Kimlik eksik"},{status:400});await deleteProduct(id);return NextResponse.json({ok:true});}
