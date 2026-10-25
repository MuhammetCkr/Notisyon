"use client";
import { useState } from "react";

export function NewsletterForm(){
  const[email,setEmail]=useState(""),[consent,setConsent]=useState(false),[state,setState]=useState(""),[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setState("Kaydediliyor…");try{const response=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,consent,source:"footer"})}),body=await response.json();if(!response.ok)throw new Error(body.error||"Kayıt tamamlanamadı.");setState(body.message);setEmail("");setConsent(false);}catch(error){setState(error instanceof Error?error.message:"Kayıt tamamlanamadı.");}finally{setBusy(false)}}
  return <form className="npf-form" onSubmit={submit}><div className="npf-form-row"><label className="sr-only" htmlFor="footer-email">E-posta adresin</label><input id="footer-email" type="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="E-posta adresin" autoComplete="email"/><button type="submit" disabled={busy}>{busy?"KAYDEDİLİYOR…":"KAYDOL"}</button></div><label className="npf-permission"><input type="checkbox" required checked={consent} onChange={event=>setConsent(event.target.checked)}/><span>Üyelik koşullarını ve kişisel verilerimin korunmasını kabul ediyorum.</span></label>{state&&<p className="npf-form-state" role="status">{state}</p>}</form>;
}
