import { getDb } from "@/lib/db";

export type BlogCategory={id:string;name:string;slug:string;description:string|null;created_at:string;updated_at:string};
export type BlogPost={id:string;category_id:string|null;category_name:string|null;category_slug:string|null;title:string;slug:string;excerpt:string;content_html:string;cover_image:string|null;cover_alt:string|null;author:string;seo_title:string|null;seo_description:string|null;seo_keywords:string|null;canonical_url:string|null;indexable:boolean;follow_links:boolean;published:boolean;featured:boolean;published_at:string|null;created_at:string;updated_at:string};

const postSelect=`SELECT p.*,c.name category_name,c.slug category_slug FROM blog_posts p LEFT JOIN blog_categories c ON c.id=p.category_id`;

export async function listBlogCategories(){return (await getDb().query<BlogCategory>(`SELECT * FROM blog_categories ORDER BY name`)).rows;}
export async function saveBlogCategory(body:Record<string,unknown>){
 const values=[String(body.name||''),String(body.slug||''),body.description||null];
 if(body.id)return (await getDb().query(`UPDATE blog_categories SET name=$2,slug=$3,description=$4,updated_at=now() WHERE id=$1 RETURNING *`,[body.id,...values])).rows[0];
 return (await getDb().query(`INSERT INTO blog_categories(name,slug,description) VALUES($1,$2,$3) RETURNING *`,values)).rows[0];
}
export async function listBlogPosts(admin=false){return (await getDb().query<BlogPost>(`${postSelect} ${admin?'':'WHERE p.published=true AND COALESCE(p.published_at,now())<=now()'} ORDER BY p.featured DESC,COALESCE(p.published_at,p.created_at) DESC`)).rows;}
export async function getBlogPost(idOrSlug:string,admin=false){return (await getDb().query<BlogPost>(`${postSelect} WHERE (p.id::text=$1 OR p.slug=$1) ${admin?'':'AND p.published=true AND COALESCE(p.published_at,now())<=now()'} LIMIT 1`,[idOrSlug])).rows[0]||null;}
export async function saveBlogPost(body:Record<string,unknown>){
 const values=[body.category_id||null,String(body.title||''),String(body.slug||''),String(body.excerpt||''),String(body.content_html||''),body.cover_image||null,body.cover_alt||null,String(body.author||'Notisyon'),body.seo_title||null,body.seo_description||null,body.seo_keywords||null,body.canonical_url||null,body.indexable!==false,body.follow_links!==false,!!body.published,!!body.featured,body.published_at||null];
 if(body.id)return (await getDb().query(`UPDATE blog_posts SET category_id=$2,title=$3,slug=$4,excerpt=$5,content_html=$6,cover_image=$7,cover_alt=$8,author=$9,seo_title=$10,seo_description=$11,seo_keywords=$12,canonical_url=$13,indexable=$14,follow_links=$15,published=$16,featured=$17,published_at=CASE WHEN $16 AND $18::timestamptz IS NULL THEN COALESCE(published_at,now()) ELSE $18::timestamptz END,updated_at=now() WHERE id=$1 RETURNING *`,[body.id,...values])).rows[0];
 return (await getDb().query(`INSERT INTO blog_posts(category_id,title,slug,excerpt,content_html,cover_image,cover_alt,author,seo_title,seo_description,seo_keywords,canonical_url,indexable,follow_links,published,featured,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CASE WHEN $15 AND $17::timestamptz IS NULL THEN now() ELSE $17::timestamptz END) RETURNING *`,values)).rows[0];
}
export async function removeBlogResource(resource:string,id:string){const table=resource==='blog-posts'?'blog_posts':resource==='blog-categories'?'blog_categories':null;if(!table)throw new Error('Geçersiz kaynak');await getDb().query(`DELETE FROM ${table} WHERE id=$1`,[id]);}
