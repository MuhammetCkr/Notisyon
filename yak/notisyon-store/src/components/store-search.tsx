"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
export function StoreSearch(){
 const[q,setQ]=useState(''),[open,setOpen]=useState(false),[suggestions,setSuggestions]=useState<string[]>([]),root=useRef<HTMLDivElement>(null);
 useEffect(()=>{const handler=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',handler);return()=>document.removeEventListener('mousedown',handler)},[]);
 useEffect(()=>{if(q.trim().length<2)return;const controller=new AbortController(),timer=window.setTimeout(()=>fetch(`/api/search?q=${encodeURIComponent(q)}`,{signal:controller.signal}).then(r=>r.json()).then(data=>setSuggestions(data.suggestions||[])).catch(()=>{}),220);return()=>{window.clearTimeout(timer);controller.abort()}},[q]);
 return <div className="store-search" ref={root}><form action="/arama"><label><span>⌕</span><input name="q" value={q} onChange={event=>{const value=event.target.value;setQ(value);if(value.trim().length<2)setSuggestions([]);setOpen(true)}} onFocus={()=>setOpen(true)} placeholder="Ürün, kategori veya rehber ara" aria-label="Mağazada ara"/><button>Ara</button></label></form>{open&&suggestions.length>0&&<div className="store-search-suggestions">{suggestions.map(item=><Link href={`/arama?q=${encodeURIComponent(item)}`} onClick={()=>setOpen(false)} key={item}>{item}<span>→</span></Link>)}</div>}</div>
}
