"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const visitorKey="notisyon-visitor-id",sessionKey="notisyon-session-id";
const createId=()=>crypto.randomUUID().replaceAll("-","");

export function analyticsIdentity(){
  let visitor=localStorage.getItem(visitorKey);if(!visitor){visitor=createId();localStorage.setItem(visitorKey,visitor);}
  const now=Date.now();let session="";try{const stored=JSON.parse(sessionStorage.getItem(sessionKey)||"null");if(stored&&now-Number(stored.started)<30*60*1000)session=String(stored.id||"");}catch{}
  if(!session)session=createId();sessionStorage.setItem(sessionKey,JSON.stringify({id:session,started:now}));return {visitor,session};
}

export function trackStorefrontEvent(event_type:"page_view"|"product_view"|"add_to_cart"|"begin_checkout",details:Record<string,unknown>={}){
  try{const consent=JSON.parse(localStorage.getItem("notisyon-cookie-consent")||"null");if(consent?.preferences?.analytics!==true)return;const ids=analyticsIdentity();void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_type,visitor_id:ids.visitor,session_id:ids.session,...details}),keepalive:true});}catch{}
}

export function StorefrontAnalytics(){
  const pathname=usePathname();
  useEffect(()=>{if(pathname.startsWith("/admin"))return;const timer=window.setTimeout(()=>trackStorefrontEvent(pathname.startsWith("/urun/")?"product_view":pathname==="/odeme"?"begin_checkout":"page_view",{path:pathname}),0);return()=>window.clearTimeout(timer);},[pathname]);
  return null;
}
