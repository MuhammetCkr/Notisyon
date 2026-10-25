import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProduct,saveProduct } from "@/lib/catalog-store";
import { revalidatePath } from "next/cache";
export async function GET(_request:Request,{params}:RouteContext<"/api/admin/products/[id]">){if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});const {id}=await params;const product=await getProduct(id);return product?NextResponse.json(product):NextResponse.json({error:"Ürün bulunamadı"},{status:404});}
export async function PUT(request:Request,{params}:RouteContext<"/api/admin/products/[id]">){if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Yetkisiz"},{status:401});try{const {id}=await params;await saveProduct({...await request.json(),id});revalidatePath("/","layout");return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Kaydedilemedi"},{status:400});}}
