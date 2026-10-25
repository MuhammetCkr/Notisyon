import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readAdminSession } from "@/lib/admin-user-store";

function permissionForPath(path:string,request:NextRequest){
  const clean=path.replace(/^\/api\/admin|^\/admin/,'').split('/').filter(Boolean),first=clean[0]||'dashboard',second=clean[1]||'';
  const modulePermissions:Record<string,string>={newsletter:'campaigns',inventory:'inventory',suppliers:'catalog',tags:'catalog','order-stages':'orders',pos:'orders','customer-groups':'customers',membership:'customers','gift-cards':'campaigns',loyalty:'customers',search:'content',banners:'content',popups:'content','message-templates':'content',automation:'notifications',notifications:'notifications',audit:'reports',feeds:'integrations','shipping-integrations':'integrations',shipping:'settings',payments:'settings',tax:'settings',cookies:'settings',localization:'settings',currency:'settings',legal:'settings',contracts:'content','invoice-design':'content',team:'settings'};
  if(first==='control'){const moduleName=second||request.nextUrl.searchParams.get('module')||'';return modulePermissions[moduleName]||'settings'}
  if(first==='entities'){const moduleName=request.nextUrl.searchParams.get('module')||'';return modulePermissions[moduleName]||'settings'}
  return ({dashboard:'dashboard',products:'products',categories:'categories',brands:'catalog',orders:'orders',customers:'customers',campaigns:'campaigns',blog:'blog',pages:'pages',theme:'theme',blocks:'theme',files:'files',forms:'forms',reviews:'content',seo:'seo',reports:'reports',integrations:'integrations',automations:'notifications',notifications:'notifications',pos:'orders',search:'content',team:'settings',uploads:'files',entities:'dashboard',operations:'dashboard'} as Record<string,string>)[first]||'dashboard';
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if(path.startsWith('/admin')||path.startsWith('/api/admin')){
    const cookie=request.cookies.get('notisyon_admin')?.value;
    if(cookie?.startsWith('db.')){try{const user=await readAdminSession(cookie),permissions=Array.isArray(user?.permissions)?user.permissions:[],needed=permissionForPath(path,request);if(!user||(!permissions.includes('*')&&!permissions.includes(needed))){if(path.startsWith('/api/'))return NextResponse.json({error:'Bu işlem için yetkiniz yok.'},{status:403});return NextResponse.redirect(new URL('/admin?access=denied',request.url));}}catch{if(path.startsWith('/api/'))return NextResponse.json({error:'Yetki doğrulanamadı.'},{status:503});}}
    return NextResponse.next();
  }
  try {
    const redirect = (await getDb().query(`SELECT to_path,status_code FROM redirects WHERE from_path=$1`, [path])).rows[0];
    if (redirect) {
      const target = new URL(String(redirect.to_path), request.url);
      return NextResponse.redirect(target, Number(redirect.status_code) === 302 ? 302 : 301);
    }
  } catch { /* Veritabanı geçici olarak kapalıysa mağaza yönlendirmesiz çalışmaya devam eder. */ }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*","/api/admin/:path*","/((?!api|admin|admin-login|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)"] };
