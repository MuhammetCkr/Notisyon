import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getDb } from '@/lib/db';
import { SiteFooter } from '@/components/site-footer';
async function read(slug:string){const r=await getDb().query(`SELECT * FROM content_pages WHERE slug=$1 AND published=true`,[slug]);return r.rows[0]||null;}

export async function generateMetadata({params}:PageProps<'/sayfa/[slug]'>):Promise<Metadata>{await connection();const {slug}=await params;const page=await read(slug);return page?{title:page.seo_title||`${page.title} | Notisyon`,description:page.seo_description||undefined}:{};}
export default async function ContentPage({params}:PageProps<'/sayfa/[slug]'>){await connection();const {slug}=await params;const page=await read(slug);if(!page)notFound();return <main className="managed-content-page"><article><span>NOTİSYON</span><h1>{page.title}</h1><div dangerouslySetInnerHTML={{__html:page.content_html}}/></article><SiteFooter/></main>}
