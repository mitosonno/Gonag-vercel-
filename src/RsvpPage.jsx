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

export default function RsvpPage(){
  const { code } = useParams();
  const [status, setStatus] = useState("loading");
  const [rsvp, setRsvp] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{ if(code) load(); else setStatus("error"); },[code]);

  async function load(){
    try{
      const rows = await sbFetch("rsvp?code=eq."+encodeURIComponent(code)+"&limit=1");
      if(!rows||!rows.length){ setStatus("error"); return; }
      const r = rows[0];
      setRsvp(r);
      if(r.status!=="pending"){ setAnswered(true); setAnswer(r.status); }

      const evs = await sbFetch("events?session_id=eq."+encodeURIComponent(r.session_id)+"&order=created_at.desc&limit=1");
      if(!evs||!evs.length){ setStatus("error"); return; }
      const ev = evs[0];
      setEventData(ev);

      const allRows = (ev.tables&&ev.tables.rows)||[];
      const tbl = allRows.find(t=>t.id===r.table_id);
      setTableData(tbl);
      setStatus("ready");
    }catch(e){ console.error(e); setStatus("error"); }
  }

  async function respond(resp){
    if(answered) return;
    await sbFetch("rsvp?code=eq."+encodeURIComponent(code),{
      method:"PATCH", prefer:"return=representation",
      body:JSON.stringify({status:resp, updated_at:new Date().toISOString()})
    });
    setAnswer(resp); setAnswered(true);
  }

  function copyCard(){
    const card = eventData?.card_number||"";
    try{ navigator.clipboard.writeText(card); }catch(e){}
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  if(status==="loading") return (
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🎊</div><div style={{color:"#c9a84c",fontSize:14}}>Yüklənir...</div></div>
    </div>
  );
  if(status==="error") return (
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>😕</div><div style={{color:"#ff9999",fontSize:16,fontWeight:700}}>Link tapılmadı</div></div>
    </div>
  );

  const ev = eventData;
  const evName = ev?.couple || ev?.tables?._meta?.obData?.boy&&ev?.tables?._meta?.obData?.girl ? ev.tables._meta.obData.boy+" & "+ev.tables._meta.obData.girl : "Məclis";
  const evDate = ev?.tables?._meta?.obData?.date||"";
  const hallName = ev?.hall_name||(ev?.tables?._meta?.hall?.name?ev.tables._meta.hall._venueName+" — "+ev.tables._meta.hall.name:"")||"";
  const hallMaps = ev?.tables?._meta?.hall?.mapsUrl||"";
  const cardNumber = ev?.card_number||"";
  const guests = tableData?.guests||[];
  const tblId = rsvp?.table_id;
  const guestName = rsvp?.guest_name||"";

  return (
    <div style={{minHeight:"100vh",background:"#080604",fontFamily:"'DM Sans',sans-serif",color:"#f2e8d0"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(201,168,76,.12)",background:"rgba(201,168,76,.04)",textAlign:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#c9a84c",letterSpacing:3}}>GONAG<span style={{color:"#f2e8d0",fontStyle:"italic"}}>.AZ</span></div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px 60px"}}>

        {/* Greeting */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:28,marginBottom:8}}>🎊</div>
          <div style={{fontSize:22,fontWeight:700,color:"#c9a84c",fontFamily:"'Playfair Display',serif",marginBottom:6}}>{evName}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,.5)"}}>Hörmətli <span style={{color:"#f2e8d0",fontWeight:600}}>{guestName}</span>,</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:4}}>toy mərasiminə dəvət olunursunuz!</div>
        </div>

        {/* Məclis məlumatı */}
        <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.15)",borderRadius:14,padding:"16px",marginBottom:16}}>
          {evDate&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
            <span style={{fontSize:18}}>📅</span>
            <span style={{fontSize:14,color:"#f2e8d0"}}>{evDate}</span>
          </div>}
          {hallName&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:hallMaps?"1px solid rgba(255,255,255,.05)":"none"}}>
            <span style={{fontSize:18}}>🏛️</span>
            <span style={{fontSize:14,color:"#f2e8d0"}}>{hallName}</span>
          </div>}
          {hallMaps&&<div style={{padding:"8px 0"}}>
            <a href={hallMaps} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",gap:10,color:"#7aade8",fontSize:13,textDecoration:"none"}}>
              <span style={{fontSize:18}}>🗺️</span>
              <span style={{borderBottom:"1px solid rgba(122,173,232,.4)"}}>Xəritədə bax</span>
            </a>
          </div>}
        </div>

        {/* Masa məlumatı */}
        <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,color:"rgba(201,168,76,.6)",fontWeight:700,marginBottom:12}}>🪑 Masa məlumatı</div>
          <div style={{fontSize:20,fontWeight:800,color:"#c9a84c",marginBottom:10}}>Masa № {tblId}</div>
          {guests.length>0&&(
            <>
              <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:8}}>Masadakı qonaqlar:</div>
              {guests.map((g,i)=>{
                const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<guests.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:sc+"22",border:"1px solid "+sc+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:sc,flexShrink:0}}>{g.name[0]||"?"}</div>
                    <div>
                      <div style={{fontSize:13,color:"#f2e8d0",fontWeight:g.name===guestName?700:400}}>{g.name}{g.name===guestName&&<span style={{fontSize:10,color:"#c9a84c",marginLeft:6}}>← Siz</span>}</div>
                      {g.count>1&&<div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{g.count} nəfər{g.ushaqCount>0?" + "+g.ushaqCount+" uşaq":""}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Gəlirəm / Gəlmirəm */}
        <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,color:"rgba(201,168,76,.6)",fontWeight:700,marginBottom:14}}>📋 İştirak təsdiqi</div>
          {answered?(
            <div style={{textAlign:"center",padding:"12px"}}>
              <div style={{fontSize:32,marginBottom:8}}>{answer==="attending"?"🎉":"😔"}</div>
              <div style={{fontSize:16,fontWeight:700,color:answer==="attending"?"#50c878":"#ff8888"}}>
                {answer==="attending"?"Gəlirəm — təsdiq edildi!":"Gəlmirəm — qeyd edildi"}
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.3)",marginTop:6}}>Cavabınız sahibə çatdırıldı</div>
            </div>
          ):(
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>respond("attending")}
                style={{flex:1,padding:"16px",borderRadius:12,border:"none",background:"linear-gradient(135deg,rgba(80,200,120,.4),rgba(80,200,120,.2))",color:"#50c878",fontSize:15,fontWeight:800,cursor:"pointer"}}>
                ✅ Gəlirəm
              </button>
              <button onClick={()=>respond("not_attending")}
                style={{flex:1,padding:"16px",borderRadius:12,border:"1px solid rgba(255,80,80,.3)",background:"rgba(255,80,80,.08)",color:"#ff8888",fontSize:15,fontWeight:800,cursor:"pointer"}}>
                ❌ Gəlmirəm
              </button>
            </div>
          )}
        </div>

        {/* Hədiyyə ver */}
        {cardNumber&&(
          <div style={{background:"linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.04))",border:"1px solid rgba(201,168,76,.25)",borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:13,color:"rgba(201,168,76,.6)",fontWeight:700,marginBottom:10}}>🎁 Hədiyyə ver</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12,lineHeight:1.6}}>
              İstəsəniz kart vasitəsilə hədiyyə göndərə bilərsiniz. Kart nömrəsini kopyalayın.
            </div>
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:4}}>Kart nömrəsi</div>
                <div style={{fontSize:16,fontWeight:800,color:"#c9a84c",letterSpacing:2,fontFamily:"monospace"}}>{cardNumber}</div>
              </div>
              <button onClick={copyCard}
                style={{padding:"8px 14px",borderRadius:8,border:"1px solid rgba(201,168,76,.4)",background:copied?"rgba(80,200,120,.2)":"rgba(201,168,76,.12)",color:copied?"#50c878":"#c9a84c",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,transition:"all .2s"}}>
                {copied?"✓ Kopyalandı":"📋 Kopyala"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",marginTop:32,color:"rgba(255,255,255,.2)",fontSize:11}}>
          <span style={{fontFamily:"'Playfair Display',serif",color:"rgba(201,168,76,.35)"}}>GONAG.AZ</span>
          <span style={{margin:"0 8px"}}>·</span>
          Toy koordinasiya sistemi
        </div>
      </div>
    </div>
  );
}
