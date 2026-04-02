import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, options={}) {
  const res = await fetch(SB_URL+"/rest/v1/"+path, {
    ...options,
    headers:{ apikey:SB_KEY, Authorization:"Bearer "+SB_KEY, "Content-Type":"application/json", Prefer:options.prefer||"", ...(options.headers||{}) }
  });
  if(!res.ok){ console.error(await res.text()); return null; }
  try{ return await res.json(); }catch{ return null; }
}

function occ(t){ return (t.guests||[]).reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0),0); }

function TableSVG({ table, size=78 }){
  const S=size, r=S/2, seats=table.seats||8, filled=occ(table);
  const pct=Math.min(1,filled/seats), isFull=filled>=seats, side=table.side||"";
  const sc=isFull?"#50c878":side==="Oğlan evi"?"#7aade8":side==="Qız evi"?"#e87aad":pct>0?"#f5d060":"#e8c060";
  const fillBg=isFull?"#0f3a20":side==="Oğlan evi"?"#1e3a55":side==="Qız evi"?"#4a1e35":"#3a2c0a";
  const chairR=r+S*0.18, chairW=Math.max(4,S*0.13), chairH=Math.max(3,S*0.09);
  const total=S+S*0.5, cx=total/2, cy=total/2;
  return (
    <svg width={total} height={total} style={{display:"block",overflow:"visible"}}>
      {Array.from({length:seats}).map((_,i)=>{
        const angle=(2*Math.PI/seats)*i-Math.PI/2;
        const sx=cx+chairR*Math.cos(angle), sy=cy+chairR*Math.sin(angle), f=i<filled;
        const cc=f?"#4ade80":side==="Oğlan evi"?"#93c5fd":side==="Qız evi"?"#f9a8d4":"#fcd34d";
        return <rect key={i} x={sx-chairW/2} y={sy-chairH/2} width={chairW} height={chairH} rx={Math.max(1,chairH*0.4)} fill={cc} opacity={f?0.95:0.3} transform={`rotate(${(angle*180/Math.PI)+90} ${sx} ${sy})`}/>;
      })}
      <circle cx={cx} cy={cy} r={r-2} fill={fillBg} stroke={sc} strokeWidth="2.5" style={{filter:`drop-shadow(0 0 4px ${sc}99)`}}/>
      <text x={cx} y={cy-4} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(10,S*0.24)} fontWeight="800" fill={sc}>{table.id}</text>
      <text x={cx} y={cy+S*0.14} textAnchor="middle" fontSize={Math.max(7,S*0.13)} fill="rgba(255,255,255,.45)">{filled}/{seats}</text>
    </svg>
  );
}

function GuestEditPopup({ guest, tableId, allTables, onSave, onDelete, onMove, onClose }){
  const [name,setName]=useState(guest.name||"");
  const [phone,setPhone]=useState((guest.phone||"").replace("+994",""));
  const [count,setCount]=useState(String(guest.count||1));
  const [ushaq,setUshaq]=useState(String(guest.ushaqCount||0));
  const [gender,setGender]=useState(guest.gender||"");
  const [moveTo,setMoveTo]=useState(""), [mode,setMode]=useState("edit");
  const inp={background:"rgba(255,255,255,.07)",border:"1px solid rgba(201,168,76,.25)",borderRadius:8,padding:"10px 12px",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{width:"100%",background:"#0e0a04",borderTop:"1px solid rgba(201,168,76,.25)",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)",margin:"0 auto 16px"}}/>
        {mode==="edit"?(
          <>
            <div style={{fontSize:13,color:"#c9a84c",fontWeight:700,marginBottom:14}}>✏️ Qonağı redaktə et</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              <input style={inp} placeholder="Ad Soyad" value={name} onChange={e=>setName(e.target.value)}/>
              <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,.07)",border:"1px solid rgba(201,168,76,.25)",borderRadius:8,overflow:"hidden"}}>
                <span style={{padding:"0 10px",color:"rgba(201,168,76,.8)",fontSize:13,fontWeight:600,flexShrink:0}}>+994</span>
                <input style={{flex:1,padding:"10px 4px",background:"transparent",border:"none",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit"}} placeholder="XX XXX XX XX" type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))}/>
              </div>
              <div style={{display:"flex",gap:6}}>
                {[["👨 Kişi","kishi","#7aade8"],["👩 Qadın","qadin","#e87aad"],["👶 Uşaq","ushaq","#f5d060"]].map(([l,v,c])=>(
                  <button key={v} onClick={()=>setGender(g=>g===v?"":v)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"1.5px solid "+(gender===v?c:"rgba(255,255,255,.08)"),background:gender===v?c+"22":"transparent",color:gender===v?c:"rgba(255,255,255,.3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                {[["Böyük","#c9a84c",count,setCount,1],["👧 Uşaq","#f5d060",ushaq,setUshaq,0]].map(([l,c,val,set,min])=>(
                  <div key={l} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.04)",border:"1px solid "+c+"33",borderRadius:8,padding:"6px 10px"}}>
                    <span style={{fontSize:10,color:c+"99"}}>{l}</span>
                    <button onClick={()=>set(v=>String(Math.max(min,parseInt(v)-1)))} style={{width:22,height:22,borderRadius:"50%",border:"none",background:c+"22",color:c,fontSize:14,cursor:"pointer",fontWeight:700}}>−</button>
                    <span style={{fontSize:14,fontWeight:800,color:c,minWidth:20,textAlign:"center"}}>{val}</span>
                    <button onClick={()=>set(v=>String(parseInt(v)+1))} style={{width:22,height:22,borderRadius:"50%",border:"none",background:c+"22",color:c,fontSize:14,cursor:"pointer",fontWeight:700}}>+</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>onSave({...guest,name:name.trim(),phone:phone.trim()?"+994"+phone.trim():"",count:parseInt(count)||1,ushaqCount:parseInt(ushaq)||0,gender})} style={{flex:2,padding:11,borderRadius:10,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ Saxla</button>
              <button onClick={()=>setMode("move")} style={{flex:1,padding:11,borderRadius:10,border:"1px solid rgba(122,173,232,.3)",background:"rgba(122,173,232,.08)",color:"#7aade8",fontSize:12,cursor:"pointer"}}>↔ Köçür</button>
              <button onClick={()=>onDelete(guest.id)} style={{padding:"11px 14px",borderRadius:10,border:"1px solid rgba(255,80,80,.3)",background:"rgba(255,80,80,.08)",color:"#ff8888",fontSize:14,cursor:"pointer"}}>🗑</button>
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:13,color:"#7aade8",fontWeight:700,marginBottom:12}}>↔ Hansı masaya köçürəsən?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14,maxHeight:200,overflowY:"auto"}}>
              {allTables.filter(t=>t.id!==tableId).map(t=>(
                <button key={t.id} onClick={()=>setMoveTo(String(t.id))} style={{padding:"10px 14px",borderRadius:10,textAlign:"left",border:moveTo===String(t.id)?"1px solid #7aade8":"1px solid rgba(255,255,255,.1)",background:moveTo===String(t.id)?"rgba(122,173,232,.15)":"transparent",color:"#f2e8d0",fontSize:13,cursor:"pointer"}}>
                  Masa {t.id}{t.label&&t.label!=="__extra__"?` — ${t.label}`:""} ({occ(t)}/{t.seats||8})
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{if(moveTo)onMove(guest.id,tableId,parseInt(moveTo));}} disabled={!moveTo} style={{flex:1,padding:11,borderRadius:10,border:"none",background:moveTo?"rgba(122,173,232,.2)":"rgba(255,255,255,.05)",color:moveTo?"#7aade8":"rgba(255,255,255,.2)",fontSize:13,fontWeight:700,cursor:moveTo?"pointer":"default"}}>↔ Köçür</button>
              <button onClick={()=>setMode("edit")} style={{padding:"11px 18px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,.3)",fontSize:12,cursor:"pointer"}}>Geri</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Dəvətnamə mətni — əsas sxemlə eyni şablon
function buildInviteMsg({ sender, senderTitle, guest, table, evName, evDate, hallName, senderMode, rsvpLink }){
  const tblLabel = table.label&&table.label!=="__extra__"?table.label:"";
  const guestLines = table.guests.map(g=>"  • "+g.name+(g.count>1?" ("+g.count+"n)":"")).join("\n");
  let msg = "🎊 *Dəvətnamə*\n━━━━━━━━━━━━━━\n\n";
  msg += "Hörmətli *"+(guest.name||"Qonaq")+"*,\n\n";
  msg += "*"+evName+"* mərasiminə dəvət olunursunuz!\n";
  if(evDate) msg += "📅 "+evDate+"\n";
  if(hallName) msg += "🏛️ "+hallName+"\n";
  msg += "\n━━━━━━━━━━━━━━\n🪑 *Masa № "+table.id+"*";
  if(tblLabel) msg += " — "+tblLabel;
  msg += "\n\n👥 *Masadakı qonaqlar:*\n"+guestLines+"\n\n";
  msg += "━━━━━━━━━━━━━━\n";
  if(rsvpLink) msg += "🔗 *Dəvətnamə linki:*\n"+rsvpLink+"\n\n";
  if(sender) msg += "Hörmətlə,\n*"+sender+(senderTitle?" "+senderTitle:"")+"*\n\n";
  msg += "✨ *GONAG.AZ*";
  return msg;
}

export default function InvitePage(){
  const { code }=useParams();
  const [status,setStatus]=useState("loading");
  const [inviteData,setInviteData]=useState(null);
  const [eventData,setEventData]=useState(null);
  const [tables,setTables]=useState([]);
  const [savedTables,setSavedTables]=useState(new Set());
  const [savingTable,setSavingTable]=useState(null);
  const [editPopup,setEditPopup]=useState(null);
  const [addForm,setAddForm]=useState(null);
  const [fName,setFName]=useState(""), [fPhone,setFPhone]=useState(""), [fCount,setFCount]=useState("1"), [fUshaq,setFUshaq]=useState("0"), [fGender,setFGender]=useState("");
  // Göndərmə panel
  const [sendPanel,setSendPanel]=useState(false);
  const [sendStep,setSendStep]=useState("tables"); // "tables"|"shablon"|"confirm"
  const [senderName,setSenderName]=useState("");
  const [senderTitle,setSenderTitle]=useState("xanım");
  const [selectedTables,setSelectedTables]=useState(new Set());
  const [selectedShablon,setSelectedShablon]=useState(null);
  const SHABLONLAR=[
    {id:"klassik",ad:"Qızılı Klassik",bg:"#1a1200",accent:"#c9a84c"},
    {id:"romantik",ad:"Romantik",bg:"#1a0a0a",accent:"#e87aad"},
    {id:"goy",ad:"Göy Zümrüd",bg:"#0a1220",accent:"#7aade8"},
    {id:"ag",ad:"Ağ Zərif",bg:"#f5f0e8",accent:"#8b7355"},
  ];

  useEffect(()=>{ if(code) loadInvite(); else setStatus("error"); },[code]);

  async function loadInvite(){
    setStatus("loading");
    try{
      const links=await sbFetch("invite_links?code=eq."+encodeURIComponent(code)+"&limit=1");
      if(!links||!links.length){ setStatus("error"); return; }
      const link=links[0]; setInviteData(link);
      const events=await sbFetch("events?session_id=eq."+encodeURIComponent(link.session_id)+"&order=created_at.desc&limit=1");
      if(!events||!events.length){ setStatus("error"); return; }
      const ev=events[0]; setEventData(ev);
      const allRows=(ev.tables&&ev.tables.rows)?ev.tables.rows:[];
      const tblIds=link.table_ids||[];
      const myTables=allRows.filter(t=>tblIds.includes(t.id)).sort((a,b)=>a.id-b.id).map(t=>({...t,guests:(t.guests||[]).map(g=>({...g}))}));
      setTables(myTables);
      setSelectedTables(new Set(myTables.map(t=>t.id)));
      setStatus("ready");
    }catch(e){ console.error(e); setStatus("error"); }
  }

  function addGuest(){
    if(!fName.trim()||!addForm) return;
    const newG={id:"inv_"+Date.now()+Math.random(),name:fName.trim(),phone:fPhone.trim()?"+994"+fPhone.trim():"",count:parseInt(fCount)||1,ushaqCount:parseInt(fUshaq)||0,gender:fGender,invited:false};
    setTables(prev=>prev.map(t=>t.id!==addForm.tableId?t:{...t,guests:[...t.guests,newG]}));
    setAddForm(null); setFName(""); setFPhone(""); setFCount("1"); setFUshaq("0"); setFGender("");
  }
  function saveGuestEdit(updated){ setTables(prev=>prev.map(t=>t.id!==editPopup.tableId?t:{...t,guests:t.guests.map(g=>g.id===updated.id?updated:g)})); setEditPopup(null); }
  function deleteGuest(gId){ setTables(prev=>prev.map(t=>t.id!==editPopup.tableId?t:{...t,guests:t.guests.filter(g=>g.id!==gId)})); setEditPopup(null); }
  function moveGuest(gId,fromId,toId){
    setTables(prev=>{ const g=prev.find(t=>t.id===fromId)?.guests.find(g=>g.id===gId); if(!g) return prev; return prev.map(t=>{ if(t.id===fromId)return{...t,guests:t.guests.filter(x=>x.id!==gId)}; if(t.id===toId)return{...t,guests:[...t.guests,{...g}]}; return t; }); });
    setEditPopup(null);
  }

  async function saveTable(tblId){
    if(!eventData) return;
    setSavingTable(tblId);
    try{
      const allRows=(eventData.tables&&eventData.tables.rows)?[...eventData.tables.rows]:[];
      const myT=tables.find(t=>t.id===tblId);
      const updatedRows=allRows.map(t=>t.id===tblId?{...t,guests:myT.guests}:t);
      const newTablesObj={...(eventData.tables||{}),rows:updatedRows};
      await sbFetch("events?id=eq."+eventData.id,{method:"PATCH",prefer:"return=representation",body:JSON.stringify({tables:newTablesObj,updated_at:new Date().toISOString()})});
      setEventData(prev=>({...prev,tables:newTablesObj}));
      setSavedTables(prev=>new Set([...prev,tblId]));
    }catch(e){ console.error(e); }
    setSavingTable(null);
  }

  async function sendInvites(){
    const ev=eventData;
    const evName=(ev?.couple)||(ev?.tables?._meta?.obData?.boy&&ev?.tables?._meta?.obData?.girl?ev.tables._meta.obData.boy+" & "+ev.tables._meta.obData.girl:"Məclis");
    const evDate=ev?.tables?._meta?.obData?.date||"";
    const hallName=(ev?.hall_name)||(ev?.tables?._meta?.hall?(ev.tables._meta.hall._venueName||"")+(ev.tables._meta.hall.name?" — "+ev.tables._meta.hall.name:""):"");
    const baseUrl=window.location.origin;
    const selTbls=tables.filter(t=>selectedTables.has(t.id));
    for(const tbl of selTbls){
      for(const g of (tbl.guests||[])){
        const phone=(g.phone||"").replace(/\D/g,"");
        if(!phone) continue;
        // RSVP link yarat
        const code=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
        await fetch("https://dpvoluttxelwnqcfnsbh.supabase.co/rest/v1/rsvp",{
          method:"POST",
          headers:{apikey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368",Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368","Content-Type":"application/json",Prefer:"return=representation"},
          body:JSON.stringify({code,session_id:ev?.session_id||"gonag_user_main",table_id:tbl.id,guest_name:g.name,guest_phone:g.phone||""})
        });
        const rsvpLink=baseUrl+"/rsvp/"+code;
        const msg=buildInviteMsg({sender:senderName,senderTitle,guest:g,table:tbl,evName,evDate,hallName,rsvpLink});
        await new Promise(r=>setTimeout(r,500));
        if(navigator.share){
          try{ await navigator.share({text:msg}); }catch(e){}
        } else {
          window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
        }
      }
    }
    setSendPanel(false); setSendStep("tables");
  }

  const totalGuests=tables.reduce((s,t)=>s+t.guests.length,0);
  const evName=(eventData?.couple)||"Məclis";

  if(status==="loading") return <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>🎊</div><div style={{color:"#c9a84c",fontSize:14,fontWeight:600}}>Yüklənir...</div></div></div>;
  if(status==="error") return <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>😕</div><div style={{color:"#ff9999",fontSize:16,fontWeight:700,marginBottom:8}}>Link tapılmadı</div><div style={{color:"rgba(255,255,255,.4)",fontSize:13}}>Dəvəti göndərən şəxslə əlaqə saxlayın.</div></div></div>;

  return (
    <div style={{minHeight:"100vh",background:"#080604",fontFamily:"'DM Sans',sans-serif",color:"#f2e8d0"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#1a1208}`}</style>

      <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(201,168,76,.12)",background:"rgba(201,168,76,.04)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#c9a84c",letterSpacing:2}}>GONAG<span style={{color:"#f2e8d0",fontStyle:"italic"}}>.AZ</span></div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginTop:2}}>🎊 {evName} — {tables.length} masa dəvəti</div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"16px 14px 160px"}}>
        {tables.map(t=>{
          const filled=occ(t), seats=t.seats||8, isFull=filled>=seats;
          const isSaved=savedTables.has(t.id), isSaving=savingTable===t.id;
          const sc=t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":"#c9a84c";
          return (
            <div key={t.id} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${isFull?"rgba(80,200,120,.4)":"rgba(201,168,76,.15)"}`,borderRadius:16,marginBottom:20,transition:"border-color .4s"}}>
              <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",gap:14,borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                <TableSVG table={t} size={78}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:16,fontWeight:800,color:isFull?"#50c878":sc}}>Masa {t.id}</span>
                    {t.label&&t.label!=="__extra__"&&<span style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>{t.label}</span>}
                    {isFull&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:"rgba(80,200,120,.18)",color:"#50c878",fontWeight:700}}>✓ Dolu</span>}
                  </div>
                  {t.side&&<div style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:sc+"22",color:sc,display:"inline-block",marginBottom:4}}>{t.side}</div>}
                  <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{filled}/{seats} nəfər</div>
                </div>
              </div>

              <div style={{padding:"8px 14px"}}>
                {t.guests.length===0&&<div style={{fontSize:12,color:"rgba(255,255,255,.22)",padding:"10px 0",textAlign:"center"}}>Hələ qonaq əlavə edilməyib</div>}
                {t.guests.map((g,gi)=>{
                  const gSc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
                  return (
                    <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:gi<t.guests.length-1?"1px solid rgba(255,255,255,.05)":"none"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:gSc+"22",border:"1px solid "+gSc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:gSc}}>{g.name[0]||"?"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#f2e8d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{g.count||1} böyük{g.ushaqCount>0?` + ${g.ushaqCount} uşaq`:""}{g.phone&&` · ${g.phone}`}</div>
                      </div>
                      <button onClick={()=>setEditPopup({guest:g,tableId:t.id})} style={{width:30,height:30,borderRadius:8,flexShrink:0,border:"1px solid rgba(201,168,76,.18)",background:"rgba(201,168,76,.06)",color:"rgba(201,168,76,.7)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                    </div>
                  );
                })}
                {filled<seats&&(
                  <button onClick={()=>setAddForm({tableId:t.id})} style={{width:"100%",marginTop:10,padding:"9px",borderRadius:9,border:"1px dashed rgba(201,168,76,.3)",background:"transparent",color:"rgba(201,168,76,.6)",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Qonaq əlavə et</button>
                )}
              </div>

              <div style={{padding:"8px 14px 14px"}}>
                <button onClick={()=>saveTable(t.id)} disabled={isSaving||t.guests.length===0} style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:isSaved?"rgba(80,200,120,.18)":t.guests.length===0?"rgba(255,255,255,.03)":"rgba(201,168,76,.16)",color:isSaved?"#50c878":t.guests.length===0?"rgba(255,255,255,.18)":"#c9a84c",fontSize:12,fontWeight:700,cursor:isSaving||t.guests.length===0?"default":"pointer",transition:"all .3s"}}>
                  {isSaving?"⏳ Saxlanılır...":isSaved?"✅ Saxlanıldı — Yenidən saxla":"💾 Bu Masanı Yadda Saxla"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalGuests>0&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px 28px",background:"rgba(8,6,4,.97)",borderTop:"1px solid rgba(201,168,76,.15)"}}>
          <button onClick={()=>{setSendPanel(true);setSendStep("tables");}} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(90deg,rgba(37,211,102,.4),rgba(37,211,102,.2))",color:"#25d366",fontSize:14,fontWeight:800,cursor:"pointer"}}>
            📱 Dəvət göndər
          </button>
        </div>
      )}

      {/* Göndərmə paneli — tam ekran, addım-addım */}
      {sendPanel&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"#080604",display:"flex",flexDirection:"column"}}>
          {/* Header */}
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(201,168,76,.15)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{fontFamily:"'Playfair Display',serif",color:"#c9a84c",fontSize:15}}>
              {sendStep==="tables"?"📨 Masa seç":sendStep==="shablon"?"✨ Şablon seç":"✅ Təsdiq et"}
            </div>
            <button onClick={()=>{setSendPanel(false);setSendStep("tables");}} style={{background:"none",border:"none",color:"#9a8060",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>

          {/* STEP 1: Masalar SVG */}
          {sendStep==="tables"&&(
            <>
              <div style={{padding:"8px 14px",borderBottom:"1px solid rgba(201,168,76,.06)",display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>setSelectedTables(new Set(tables.map(t=>t.id)))}
                  style={{padding:"5px 12px",borderRadius:16,border:"1px solid rgba(201,168,76,.35)",background:"rgba(201,168,76,.08)",color:"#c9a84c",fontSize:11,cursor:"pointer"}}>✓ Hamısı</button>
                <button onClick={()=>setSelectedTables(new Set())}
                  style={{padding:"5px 12px",borderRadius:16,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(255,255,255,.35)",fontSize:11,cursor:"pointer"}}>Ləğv</button>
                <span style={{marginLeft:"auto",fontSize:11,color:"rgba(201,168,76,.5)",alignSelf:"center"}}>{selectedTables.size}/{tables.length} seçildi</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"14px 12px"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center"}}>
                  {tables.map(t=>{
                    const sel=selectedTables.has(t.id);
                    const allSent=(t.guests||[]).every(g=>g.invited);
                    return(
                      <div key={t.id} onClick={()=>setSelectedTables(prev=>{ const s=new Set(prev); sel?s.delete(t.id):s.add(t.id); return s; })}
                        style={{position:"relative",cursor:"pointer",width:"calc(25% - 10px)",minWidth:70,display:"flex",flexDirection:"column",alignItems:"center",opacity:allSent?.5:1}}>
                        <TableSVG table={t} size={66}/>
                        {sel&&<div style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:"50%",background:"#50c878",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>✓</div>}
                        <div style={{textAlign:"center",marginTop:3,fontSize:9,color:sel?"#c9a84c":"rgba(255,255,255,.3)",fontWeight:700}}>Masa {t.id}</div>
                        <div style={{textAlign:"center",fontSize:7,color:allSent?"rgba(80,200,120,.5)":"rgba(255,180,50,.5)",marginTop:1}}>{allSent?"Göndərilib ✓":"Göndərilməyib"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{padding:"10px 14px 28px",flexShrink:0,borderTop:"1px solid rgba(201,168,76,.06)"}}>
                <button onClick={()=>selectedTables.size>0&&setSendStep("shablon")} disabled={selectedTables.size===0}
                  style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:selectedTables.size>0?"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))":"rgba(255,255,255,.05)",color:selectedTables.size>0?"#0a0700":"rgba(255,255,255,.2)",fontSize:13,fontWeight:800,cursor:selectedTables.size>0?"pointer":"default"}}>
                  Şablon seç → ({selectedTables.size} masa)
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Şablon + Kimdən */}
          {sendStep==="shablon"&&(
            <>
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:12}}>Dəvətnamə şablonu:</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                  {SHABLONLAR.map(s=>(
                    <div key={s.id} onClick={()=>setSelectedShablon(s)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:"1.5px solid "+(selectedShablon?.id===s.id?s.accent:"rgba(255,255,255,.1)"),background:selectedShablon?.id===s.id?"rgba(201,168,76,.06)":"rgba(255,255,255,.02)",cursor:"pointer"}}>
                      <div style={{width:36,height:50,borderRadius:6,background:s.bg,border:"1px solid "+s.accent+"44",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎊</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:s.accent}}>{s.ad}</div>
                      </div>
                      {selectedShablon?.id===s.id&&<div style={{color:"#50c878",fontSize:16}}>✓</div>}
                    </div>
                  ))}
                </div>

                <div style={{fontSize:11,color:"rgba(201,168,76,.6)",fontWeight:700,marginBottom:8}}>✍️ Kimdən göndərilsin?</div>
                <input value={senderName} onChange={e=>setSenderName(e.target.value)}
                  placeholder="Adınızı yazın (məs: Aytən, Oğlan evi...)"
                  style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:9,color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  {[["xanım","👩"],["müəllim","👨"],["bəy","🤵"]].map(([t,e])=>(
                    <button key={t} onClick={()=>setSenderTitle(t)}
                      style={{flex:1,padding:"7px 4px",borderRadius:8,border:"1.5px solid "+(senderTitle===t?"rgba(201,168,76,.6)":"rgba(255,255,255,.1)"),background:senderTitle===t?"rgba(201,168,76,.12)":"transparent",color:senderTitle===t?"#c9a84c":"rgba(255,255,255,.35)",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      {e} {t}
                    </button>
                  ))}
                </div>
                {senderName&&<div style={{padding:"8px 12px",background:"rgba(255,255,255,.04)",borderRadius:8,fontSize:12,color:"rgba(255,255,255,.5)",fontStyle:"italic",marginBottom:8}}>
                  "Hörmətlə, {senderName} {senderTitle}"
                </div>}
              </div>
              <div style={{padding:"10px 14px 28px",flexShrink:0,display:"flex",gap:8}}>
                <button onClick={()=>setSendStep("tables")} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(255,255,255,.4)",fontSize:12,cursor:"pointer"}}>← Geri</button>
                <button onClick={()=>setSendStep("confirm")}
                  style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:13,fontWeight:700,cursor:"pointer"}}>Təsdiq →</button>
              </div>
            </>
          )}

          {/* STEP 3: Təsdiq */}
          {sendStep==="confirm"&&(
            <>
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
                <div style={{fontSize:48,marginBottom:16}}>📨</div>
                <div style={{fontSize:16,fontWeight:700,color:"#f2e8d0",marginBottom:8,textAlign:"center"}}>{selectedTables.size} masa üçün dəvətnamə göndərilsin?</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.35)",textAlign:"center",lineHeight:1.7,marginBottom:16}}>
                  {tables.filter(t=>selectedTables.has(t.id)).flatMap(t=>t.guests).filter(g=>(g.phone||"").replace(/\D/g,"").length>=7).length} nömrəli qonağa
                  {senderName&&" · "+senderName+" "+senderTitle}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
                  {tables.filter(t=>selectedTables.has(t.id)).map(t=>(
                    <div key={t.id} style={{padding:"4px 12px",borderRadius:20,background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.25)",color:"#c9a84c",fontSize:11}}>Masa {t.id}</div>
                  ))}
                </div>
              </div>
              <div style={{padding:"10px 14px 36px",flexShrink:0,display:"flex",gap:10}}>
                <button onClick={()=>setSendStep("shablon")} style={{flex:1,padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(255,255,255,.4)",fontSize:13,cursor:"pointer"}}>← Geri</button>
                <button onClick={sendInvites}
                  style={{flex:2,padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(90deg,rgba(37,211,102,.5),rgba(37,211,102,.3))",color:"#25d366",fontSize:14,fontWeight:800,cursor:"pointer"}}>
                  ✅ Bəli, göndər!
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Qonaq əlavə etmə formu */}
      {addForm&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)"}} onClick={()=>setAddForm(null)}>
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#0e0a04",borderTop:"1px solid rgba(201,168,76,.3)",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)",margin:"0 auto 16px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>Masa {addForm.tableId} — Qonaq əlavə et</span>
              <button onClick={()=>setAddForm(null)} style={{background:"none",border:"none",color:"#9a8060",fontSize:18,cursor:"pointer"}}>✕</button>
            </div>
            <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="Ad Soyad"
              style={{display:"block",width:"100%",marginBottom:8,padding:"10px 12px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(201,168,76,.3)",borderRadius:8,color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,.07)",border:"1px solid rgba(201,168,76,.25)",borderRadius:8,marginBottom:8,overflow:"hidden"}}>
              <span style={{padding:"0 10px",color:"rgba(201,168,76,.8)",fontSize:13,fontWeight:600,flexShrink:0}}>+994</span>
              <input type="tel" value={fPhone} onChange={e=>setFPhone(e.target.value.replace(/\D/g,""))} placeholder="XX XXX XX XX"
                style={{flex:1,padding:"10px 4px",background:"transparent",border:"none",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {[["👨 Kişi","kishi","#7aade8"],["👩 Qadın","qadin","#e87aad"],["👶 Uşaq","ushaq","#f5d060"]].map(([l,v,c])=>(
                <button key={v} onClick={()=>setFGender(g=>g===v?"":v)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"1.5px solid "+(fGender===v?c:"rgba(255,255,255,.08)"),background:fGender===v?c+"22":"transparent",color:fGender===v?c:"rgba(255,255,255,.3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[["Böyük","#c9a84c",fCount,setFCount,1],["👧 Uşaq","#f5d060",fUshaq,setFUshaq,0]].map(([l,c,val,set,min])=>(
                <div key={l} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.04)",border:"1px solid "+c+"33",borderRadius:8,padding:"6px 10px"}}>
                  <span style={{fontSize:10,color:c+"99"}}>{l}</span>
                  <button onClick={()=>set(v=>String(Math.max(min,parseInt(v)-1)))} style={{width:22,height:22,borderRadius:"50%",border:"none",background:c+"22",color:c,fontSize:14,cursor:"pointer",fontWeight:700}}>−</button>
                  <span style={{fontSize:14,fontWeight:800,color:c,minWidth:20,textAlign:"center"}}>{val}</span>
                  <button onClick={()=>set(v=>String(parseInt(v)+1))} style={{width:22,height:22,borderRadius:"50%",border:"none",background:c+"22",color:c,fontSize:14,cursor:"pointer",fontWeight:700}}>+</button>
                </div>
              ))}
            </div>
            <button onClick={addGuest} disabled={!fName.trim()} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:fName.trim()?"linear-gradient(90deg,rgba(80,200,120,.5),rgba(80,200,120,.3))":"rgba(255,255,255,.05)",color:fName.trim()?"#50c878":"rgba(255,255,255,.2)",fontSize:13,fontWeight:800,cursor:fName.trim()?"pointer":"default"}}>✅ Əlavə et</button>
          </div>
        </div>
      )}

      {editPopup&&(
        <GuestEditPopup guest={editPopup.guest} tableId={editPopup.tableId} allTables={tables}
          onSave={saveGuestEdit} onDelete={deleteGuest} onMove={moveGuest} onClose={()=>setEditPopup(null)}/>
      )}
    </div>
  );
}
