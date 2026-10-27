(()=>{
const $=(s,p=document)=>p.querySelector(s);
const state={site:"",types:[],rows:[],cfg:null};
const el={site:$("#siteUrl"),discover:$("#discoverBtn"),msg:$("#message"),cpt:$("#cptSelect"),ns:$("#restNamespace"),base:$("#restBase"),mode:$("#contentMode"),result:$("#resultMode"),scan:$("#scanBtn"),progress:$("#progress"),bar:$("#bar"),pt:$("#progressTitle"),pd:$("#progressText"),fmt:$("#exportFormat"),note:$("#exportNote"),download:$("#downloadBtn"),summary:$("#summary"),search:$("#search"),filter:$("#previewFilter"),total:$("#total"),has:$("#has"),none:$("#none"),empty:$("#empty"),wrap:$("#tableWrap"),tbody:$("#tbody"),theme:$("#themeToggle")};

function norm(v){const u=new URL(v.trim());if(!/^https?:$/.test(u.protocol))throw Error("Use an http:// or https:// URL.");u.hash="";u.search="";if(!u.pathname.endsWith("/"))u.pathname+="/";return u.href}
function valid(){try{norm(el.site.value);return true}catch{return false}}
function msg(t,c=""){el.msg.textContent=t;el.msg.className=t?`message ${c}`:"message hidden"}
function endpoint(site,ns,base){return new URL(`wp-json/${String(ns||"wp/v2").replace(/^\/+|\/+$/g,"")}/${String(base||"").replace(/^\/+|\/+$/g,"")}`,site).href}
async function get(url){const r=await fetch(url,{credentials:"omit",headers:{Accept:"application/json"}});if(!r.ok)throw Error(`HTTP ${r.status} requesting ${url}`);return{r,j:await r.json()}}
function strip(h){const d=new DOMParser().parseFromString(String(h||""),"text/html");return(d.body.textContent||"").replace(/\u00a0/g," ").replace(/\s+/g," ").trim()}
function metrics(h,mode){h=String(h||"").trim();const t=strip(h),words=t?t.split(/\s+/).length:0;let has=false;if(mode==="text")has=!!t;else if(mode==="markup")has=!!h.replace(/<!--[\s\S]*?-->/g,"").trim();else{const d=new DOMParser().parseFromString(h,"text/html");has=!!t||!!d.body.querySelector("img,video,audio,iframe,figure,table,svg,canvas,object,embed,form,blockquote,ul,ol")}return{has,words,chars:t.length,snippet:t.slice(0,240)}}
function decode(v){const x=document.createElement("textarea");x.innerHTML=v||"";return x.value}
function cfg(){const t=state.types.find(x=>x.slug===el.cpt.value);if(t)return{label:t.name,slug:t.slug,ns:t.rest_namespace||"wp/v2",base:t.rest_base||t.slug};if(valid()&&el.base.value.trim())return{label:el.base.value.trim(),slug:el.base.value.trim(),ns:el.ns.value.trim()||"wp/v2",base:el.base.value.trim()};return null}
function buttons(){el.discover.disabled=!valid();el.scan.disabled=!(valid()&&cfg())}

async function discover(){
 el.discover.disabled=true;el.cpt.disabled=true;el.scan.disabled=true;el.cpt.innerHTML="<option>Loading…</option>";msg("Checking WordPress REST API…");
 try{
  state.site=norm(el.site.value);const {j}=await get(new URL("wp-json/wp/v2/types",state.site).href);
  state.types=Object.entries(j||{}).map(([slug,d])=>({slug,name:d.name||slug,rest_base:d.rest_base||slug,rest_namespace:d.rest_namespace||"wp/v2"})).filter(x=>x.rest_base).sort((a,b)=>a.name.localeCompare(b.name));
  if(!state.types.length)throw Error("No REST-enabled post types found.");
  el.cpt.innerHTML='<option value="">Select a post type / CPT</option>';
  state.types.forEach(t=>{const o=document.createElement("option");o.value=t.slug;o.textContent=`${t.name} (${t.slug})`;el.cpt.append(o)});
  el.cpt.disabled=false;msg(`Found ${state.types.length} REST-enabled post types.`,"success");
 }catch(e){state.types=[];el.cpt.innerHTML="<option>Discovery failed — use Manual REST endpoint</option>";msg(`${e.message} You can still use the Manual REST endpoint if you know it.`,"error")}
 buttons()
}

function rowsForMode(){return el.result.value==="has"?state.rows.filter(r=>r.has):el.result.value==="none"?state.rows.filter(r=>!r.has):state.rows}
function visible(){
 let a=rowsForMode(),f=el.filter.value,q=el.search.value.trim().toLowerCase();
 if(f==="has")a=a.filter(r=>r.has);if(f==="none")a=a.filter(r=>!r.has);
 if(q)a=a.filter(r=>[r.id,r.title,r.slug,r.link,r.modified].join(" ").toLowerCase().includes(q));
 return a
}
function render(){
 el.tbody.innerHTML="";if(!state.rows.length){el.wrap.classList.add("hidden");el.empty.classList.remove("hidden");return}
 el.empty.classList.add("hidden");el.wrap.classList.remove("hidden");
 const frag=document.createDocumentFragment();
 visible().forEach(r=>{
  const tr=document.createElement("tr");
  const vals=[
   `<span class="pill ${r.has?"has":"none"}">${r.has?"HAS CONTENT":"NO CONTENT"}</span>`,
   r.id,esc(r.title||"(No title)"),esc(r.slug||""),r.words,r.chars,esc(r.modified||""),
   r.link?`<a class="preview" target="_blank" rel="noopener" href="${escAttr(r.link)}">Open Preview ↗</a>`:"—"
  ];
  vals.forEach((v,i)=>{const td=document.createElement("td");if(i===0||i===7)td.innerHTML=v;else td.innerHTML=v;tr.append(td)});
  frag.append(tr)
 });
 el.tbody.append(frag)
}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function escAttr(v){return esc(v).replace(/'/g,"&#39;")}
function stats(){
 const has=state.rows.filter(r=>r.has).length,none=state.rows.length-has;
 el.total.textContent=state.rows.length;el.has.textContent=has;el.none.textContent=none;
 el.summary.textContent=state.rows.length?`${state.rows.length} items scanned — ${has} with content, ${none} without content.`:"No scan yet."
}

async function scan(){
 const c=cfg();if(!c)return;state.cfg=c;state.rows=[];stats();render();el.download.disabled=true;el.scan.disabled=true;el.discover.disabled=true;el.progress.classList.remove("hidden");el.bar.style.width="2%";
 try{
  state.site=norm(el.site.value);const ep=endpoint(state.site,c.ns,c.base);let page=1,pages=1,total=0;const out=[];
  do{
   const u=new URL(ep);u.searchParams.set("per_page","100");u.searchParams.set("page",String(page));u.searchParams.set("_fields","id,slug,link,title,content,status,type,modified");
   el.pt.textContent=`Scanning page ${page}${pages>1?` of ${pages}`:""}…`;
   const {r,j}=await get(u.href);if(!Array.isArray(j))throw Error("Selected REST endpoint did not return a list.");
   if(page===1){pages=Math.max(1,Number(r.headers.get("X-WP-TotalPages"))||1);total=Number(r.headers.get("X-WP-Total"))||j.length}
   j.forEach(x=>{const m=metrics(x?.content?.rendered||"",el.mode.value);out.push({has:m.has,status:m.has?"Has Content":"No Content",id:x.id??"",title:decode(x?.title?.rendered||""),slug:x.slug||"",cpt:x.type||c.slug,post_status:x.status||"",words:m.words,chars:m.chars,modified:x.modified||"",link:x.link||"",snippet:m.snippet})});
   el.bar.style.width=`${Math.min(100,Math.round(page/pages*100))}%`;el.pd.textContent=`${out.length}${total?` of ${total}`:""} items received`;page++
  }while(page<=pages);
  state.rows=out;stats();render();el.bar.style.width="100%";el.pt.textContent="Scan complete";el.pd.textContent=`${out.length} items checked`;el.download.disabled=!out.length
 }catch(e){el.bar.style.width="0%";el.pt.textContent="Scan failed";el.pd.textContent=e.message}
 finally{buttons()}
}

const headers=["Content Status","ID","Title","Slug","CPT","Post Status","Word Count","Visible Character Count","Modified","Preview URL","Content Snippet"];
const arr=r=>[r.status,r.id,r.title,r.slug,r.cpt,r.post_status,r.words,r.chars,r.modified,r.link,r.snippet];
const csvq=v=>{const s=String(v??"");return/[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
const csv=rows=>"\uFEFF"+[headers.map(csvq).join(","),...rows.map(r=>arr(r).map(csvq).join(","))].join("\r\n");
function dl(name,blob){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function basename(){let h="wordpress-site";try{h=new URL(state.site||el.site.value).hostname}catch{}return`${h}-${(state.cfg?.slug||"cpt").replace(/[^a-z0-9_-]/gi,"-")}-content-audit`}

// tiny uncompressed ZIP writer for XLSX
const TE=new TextEncoder();
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^(0xedb88320&-(c&1))}return(c^0xffffffff)>>>0}
const u16=n=>new Uint8Array([n&255,(n>>>8)&255]),u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
function cat(ps){const n=ps.reduce((a,p)=>a+p.length,0),o=new Uint8Array(n);let k=0;for(const p of ps){o.set(p,k);k+=p.length}return o}
function zip(files){const lp=[],cp=[];let off=0;const d=new Date(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2),dt=((Math.max(1980,d.getFullYear())-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
 for(const f of files){const nb=TE.encode(f.name),db=typeof f.data==="string"?TE.encode(f.data):f.data,cr=crc32(db),l=cat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(tm),u16(dt),u32(cr),u32(db.length),u32(db.length),u16(nb.length),u16(0),nb,db]);lp.push(l);cp.push(cat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(tm),u16(dt),u32(cr),u32(db.length),u32(db.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off),nb]));off+=l.length}
 const L=cat(lp),C=cat(cp),E=cat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(C.length),u32(L.length),u16(0)]);
 return new Blob([L,C,E],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
}
function xe(v){return String(v??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function col(i){let n=i+1,s="";while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s}
function sheet(rows){const all=[headers,...rows.map(arr)];let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
 all.forEach((r,ri)=>{x+=`<row r="${ri+1}">`;r.forEach((v,ci)=>{const ref=col(ci)+(ri+1);if(ri&&typeof v==="number")x+=`<c r="${ref}" t="n"><v>${v}</v></c>`;else x+=`<c r="${ref}" t="inlineStr"${ri?'':' s="1"'}><is><t xml:space="preserve">${xe(v)}</t></is></c>`});x+="</row>"});x+="</sheetData>";x+=`<autoFilter ref="A1:${col(headers.length-1)}1"/></worksheet>`;return x}
function xlsx(sheets){
 const ss=sheets.filter(s=>s.rows.length||sheets.length===1),ov=ss.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ov}</Types>`;
 const rr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
 const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${ss.map((s,i)=>`<sheet name="${xe(s.name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`;
 const wr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${ss.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${ss.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const st=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const fs=[{name:"[Content_Types].xml",data:ct},{name:"_rels/.rels",data:rr},{name:"xl/workbook.xml",data:wb},{name:"xl/_rels/workbook.xml.rels",data:wr},{name:"xl/styles.xml",data:st}];ss.forEach((s,i)=>fs.push({name:`xl/worksheets/sheet${i+1}.xml`,data:sheet(s.rows)}));return zip(fs)
}
function exportNote(){if(el.result.value==="both"&&el.fmt.value==="xlsx")el.note.innerHTML='XLSX will contain separate <strong>Has Content</strong> and <strong>No Content</strong> sheets.';else if(el.result.value==="both"&&el.fmt.value==="csv")el.note.innerHTML='CSV cannot contain tabs. Two CSV files will be downloaded: <strong>Has Content</strong> and <strong>No Content</strong>.';else el.note.textContent=`The ${el.fmt.value.toUpperCase()} file will contain only the selected status.`}
function download(){
 const has=state.rows.filter(r=>r.has),none=state.rows.filter(r=>!r.has),b=basename(),m=el.result.value;
 if(el.fmt.value==="csv"){if(m==="both"){dl(`${b}-has-content.csv`,new Blob([csv(has)],{type:"text/csv;charset=utf-8"}));setTimeout(()=>dl(`${b}-no-content.csv`,new Blob([csv(none)],{type:"text/csv;charset=utf-8"})),300)}else{const rows=m==="has"?has:none;dl(`${b}-${m==="has"?"has-content":"no-content"}.csv`,new Blob([csv(rows)],{type:"text/csv;charset=utf-8"}))}return}
 const sheets=m==="both"?[{name:"Has Content",rows:has},{name:"No Content",rows:none}]:[{name:m==="has"?"Has Content":"No Content",rows:m==="has"?has:none}];dl(`${b}.xlsx`,xlsx(sheets))
}

el.site.addEventListener("input",buttons);el.discover.addEventListener("click",discover);
el.cpt.addEventListener("change",()=>{const t=state.types.find(x=>x.slug===el.cpt.value);if(t){el.ns.value=t.rest_namespace||"wp/v2";el.base.value=t.rest_base||t.slug}buttons()});
[el.ns,el.base].forEach(x=>x.addEventListener("input",buttons));
el.scan.addEventListener("click",scan);el.search.addEventListener("input",render);el.filter.addEventListener("change",render);el.result.addEventListener("change",()=>{render();exportNote()});el.fmt.addEventListener("change",exportNote);el.download.addEventListener("click",download);
el.theme.addEventListener("click",()=>{document.documentElement.classList.toggle("dark");localStorage.setItem("wpCptAuditTheme",document.documentElement.classList.contains("dark")?"dark":"light")});
if(localStorage.getItem("wpCptAuditTheme")==="dark"||(!localStorage.getItem("wpCptAuditTheme")&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark");
exportNote();buttons()
})();