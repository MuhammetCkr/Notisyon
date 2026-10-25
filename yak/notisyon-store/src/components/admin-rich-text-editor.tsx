"use client";

import { useEffect,useRef,useState } from "react";

const buttons=[
 ["B","Kalın","bold"],["I","İtalik","italic"],["U","Altı çizili","underline"],["S","Üstü çizili","strikeThrough"],
 ["x₂","Alt simge","subscript"],["x²","Üst simge","superscript"],["⌫","Biçimi temizle","removeFormat"],
 ["1.","Numaralı liste","insertOrderedList"],["•","Madde listesi","insertUnorderedList"],["⇤","Girintiyi azalt","outdent"],["⇥","Girintiyi artır","indent"],
 ["❞","Alıntı","formatBlock:blockquote"],["≡←","Sola hizala","justifyLeft"],["≡","Ortala","justifyCenter"],["→≡","Sağa hizala","justifyRight"],["▤","İki yana yasla","justifyFull"],
 ["↶","Geri al","undo"],["↷","İleri al","redo"],["―","Yatay çizgi","insertHorizontalRule"],
] as const;

export function AdminRichTextEditor({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const editor=useRef<HTMLDivElement>(null),[source,setSource]=useState(false);
 useEffect(()=>{const safeValue=sanitizePreview(value);if(!source&&editor.current&&editor.current.innerHTML!==safeValue)editor.current.innerHTML=safeValue;},[value,source]);
 function command(spec:string,arg?:string){const [name,preset]=spec.split(":");editor.current?.focus();document.execCommand(name,false,arg||preset);if(editor.current)onChange(editor.current.innerHTML);}
 function promptCommand(kind:"link"|"image"){const answer=window.prompt(kind==="link"?"Bağlantı adresi":"Görsel adresi","https://");if(answer)command(kind==="link"?"createLink":"insertImage",answer);}
 function table(){const rows=Math.min(10,Math.max(1,Number(window.prompt("Satır sayısı","3"))||0)),cols=Math.min(8,Math.max(1,Number(window.prompt("Sütun sayısı","3"))||0));if(!rows||!cols)return;const html=`<table><tbody>${Array.from({length:rows},()=>`<tr>${Array.from({length:cols},()=>"<td>&nbsp;</td>").join("")}</tr>`).join("")}</tbody></table><p><br></p>`;command("insertHTML",html);}
 const words=value.replace(/<[^>]*>/g," ").trim().split(/\s+/).filter(Boolean).length;
 return <section className="admin-rich-editor"><header><div><span>ZENGİN İÇERİK EDİTÖRÜ</span><h3>{label}</h3></div><p>Metni görünüm üzerinde düzenleyin veya Kaynak ile HTML koduna geçin.</p></header><div className="admin-editor-toolbar" role="toolbar" aria-label={`${label} araçları`}>
  <div className="admin-editor-row">{buttons.slice(0,7).map(([text,title,cmd])=><button type="button" title={title} onMouseDown={e=>e.preventDefault()} onClick={()=>command(cmd)} key={title}>{text}</button>)}<select title="Paragraf biçimi" defaultValue="p" onChange={e=>command("formatBlock",e.target.value)}><option value="p">Biçem</option><option value="h1">Başlık 1</option><option value="h2">Başlık 2</option><option value="h3">Başlık 3</option><option value="blockquote">Alıntı</option><option value="pre">Kod</option></select><select title="Yazı tipi" defaultValue="Arial" onChange={e=>command("fontName",e.target.value)}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Times New Roman</option><option>Courier New</option></select><select title="Yazı boyutu" defaultValue="3" onChange={e=>command("fontSize",e.target.value)}><option value="1">10 px</option><option value="2">12 px</option><option value="3">14 px</option><option value="4">18 px</option><option value="5">24 px</option><option value="6">32 px</option></select><label title="Yazı rengi" className="admin-color">A<input type="color" onChange={e=>command("foreColor",e.target.value)}/></label><label title="Arka plan rengi" className="admin-color filled">A<input type="color" onChange={e=>command("hiliteColor",e.target.value)}/></label></div>
  <div className="admin-editor-row">{buttons.slice(7).map(([text,title,cmd])=><button type="button" title={title} onMouseDown={e=>e.preventDefault()} onClick={()=>command(cmd)} key={title}>{text}</button>)}<button type="button" title="Bağlantı ekle" onClick={()=>promptCommand("link")}>🔗</button><button type="button" title="Bağlantıyı kaldır" onClick={()=>command("unlink")}>⛓×</button><button type="button" title="Görsel ekle" onClick={()=>promptCommand("image")}>▧</button><button type="button" title="Tablo ekle" onClick={table}>▦</button><button type="button" title="Tümünü seç" onClick={()=>command("selectAll")}>▣</button><button type="button" className={source?"admin-source-toggle active":"admin-source-toggle"} onClick={()=>setSource(!source)}>〈/〉 {source?"Görsel":"Kaynak"}</button></div>
 </div>{source?<textarea className="admin-editor-source" value={value} onChange={e=>onChange(e.target.value)} spellCheck={false}/>:<div ref={editor} className="admin-editor-canvas" contentEditable suppressContentEditableWarning onClick={event=>{if((event.target as HTMLElement).closest("a"))event.preventDefault();}} onInput={e=>onChange(e.currentTarget.innerHTML)} data-placeholder="Metninizi buraya yazın…"/>}<footer><span>{words} kelime</span><span>HTML otomatik oluşturulur</span></footer></section>;
}

function sanitizePreview(html:string){
 const parsed=new DOMParser().parseFromString(html,"text/html");
 parsed.querySelectorAll("script,iframe,object,embed,link,meta").forEach(node=>node.remove());
 parsed.body.querySelectorAll("*").forEach(node=>[...node.attributes].forEach(attribute=>{if(attribute.name.toLowerCase().startsWith("on"))node.removeAttribute(attribute.name);}));
 return parsed.body.innerHTML;
}
