import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listBlogCategories,listBlogPosts,removeBlogResource,saveBlogCategory,saveBlogPost } from "@/lib/blog-store";
const denied=()=>NextResponse.json({error:'Yetkisiz'},{status:401});
export async function GET(){if(!(await isAdminAuthenticated()))return denied();return NextResponse.json({posts:await listBlogPosts(true),categories:await listBlogCategories()});}
export async function PUT(request:Request){if(!(await isAdminAuthenticated()))return denied();try{const body=await request.json();const result=body.resource==='category'?await saveBlogCategory(body):await saveBlogPost(body);revalidatePath('/blog','layout');return NextResponse.json(result);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'İşlem başarısız'},{status:400});}}
export async function DELETE(request:Request){if(!(await isAdminAuthenticated()))return denied();try{const url=new URL(request.url);await removeBlogResource(url.searchParams.get('resource')||'',url.searchParams.get('id')||'');revalidatePath('/blog','layout');return NextResponse.json({ok:true});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Silinemedi'},{status:400});}}
