import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { AdminShell } from '@/components/admin-shell';
import { AdminBlogManager } from '@/components/admin-blog-manager';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function BlogAdminPage(){await connection();if(!(await isAdminAuthenticated()))redirect('/admin-login');return <AdminShell active="/admin/blog" title="Rehber yönetimi" eyebrow="İÇERİK YÖNETİMİ"><AdminBlogManager/></AdminShell>}
