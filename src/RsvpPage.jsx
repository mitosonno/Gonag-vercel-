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

function TableCircle({ tableId, seats=10, guests=[] }){
  const filled = guests.reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0),0);
  const W=160, r=55, cx=80, cy=80;
  const chairs = Array.from({length:seats}).map((_,i)=>{
    const angle=(2*Math.PI/seats)*i-Math.PI/2;
    const cr=r+18, sx=cx+cr*Math.cos(angle), sy=cy+cr*Math.sin(angle);
    const f=i<Math.min(filled,seats);
    return <rect key={i} x={sx-8} y={sy-5} width={16} height={10} rx={3}
      fill={f?"#50c878":"rgba(201,168,76,.25)"}
      transform={`rotate(${angle*180/Math.PI+90} ${sx} ${sy})`}/>;
  });
  return (
    <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{display:"block",margin:"0 auto"}}>
      {chairs}
      <ellipse cx={cx} cy={cy+8} rx={r-2} ry={10} fill="rgba(0,0,0,.3)"/>
      <circle cx={cx} cy={cy} r={r} fill="#1a1206" stroke="#c9a84c" strokeWidth={2.5}
        style={{filter:"drop-shadow(0 0 8px rgba(201,168,76,.4))"}}/>
      <text x={cx} y={cy-4} textAnchor="middle" dominantBaseline="middle"
        fontSize={28} fontWeight="800" fill="#c9a84c">{tableId}</text>
      <text x={cx} y={cy+22} textAnchor="middle"
        fontSize={13} fill="rgba(255,255,255,.4)">{filled}/{seats}</text>
    </svg>
  );
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
      const r = rows[0]; setRsvp(r);
      if(r.status!=="pending"){ setAnswered(true); setAnswer(r.status); }
      const evs = await sbFetch("events?session_id=eq."+encodeURIComponent(r.session_id)+"&order=created_at.desc&limit=1");
      if(!evs||!evs.length){ setStatus("error"); return; }
      const ev = evs[0]; setEventData(ev);
      const allRows=(ev.tables&&ev.tables.rows)||[];
      const tbl=allRows.find(t=>t.id===r.table_id);
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
    const card=eventData?.card_number||"";
    try{ navigator.clipboard.writeText(card); }catch(e){}
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  if(status==="loading") return(
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🎊</div><div style={{color:"#c9a84c",fontSize:14}}>Yüklənir...</div></div>
    </div>
  );
  if(status==="error") return(
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>😕</div><div style={{color:"#ff9999",fontSize:16,fontWeight:700}}>Link tapılmadı</div></div>
    </div>
  );

  const meta = eventData?.tables?._meta||{};
  const obData = meta.obData||{};
  const hall = meta.hall||{};
  const evName = eventData?.couple||(obData.boy&&obData.girl?obData.boy+" & "+obData.girl:obData.name||obData.company||"Məclis");
  const evDate = obData.date||"";
  const hallName = hall._venueName||(eventData?.hall_name||"");
  const hallZal = hall.name||"";
  const fullHall = hallName+(hallZal?" — "+hallZal:"");
  const cardNumber = eventData?.card_number||"";
  const guests = tableData?.guests||[];
  const guestName = rsvp?.guest_name||"";

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a0700 0%,#12080e 50%,#070a12 100%)",fontFamily:"'DM Sans',sans-serif",color:"#f2e8d0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .shine{position:relative;overflow:hidden}
        .shine::after{content:'';position:absolute;top:-50%;left:-60%;width:40%;height:200%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.08) 50%,transparent 60%);animation:shine 4s ease infinite}
        @keyframes shine{0%,100%{left:-60%}50%{left:120%}}
      `}</style>

      {/* Header */}
      <div style={{padding:"16px 0 12px",textAlign:"center",borderBottom:"1px solid rgba(201,168,76,.1)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#c9a84c",letterSpacing:4}}>
          GONAG<span style={{color:"#f2e8d0",fontStyle:"italic"}}>.AZ</span>
        </div>
      </div>

      {/* Ornament top */}
      <div style={{textAlign:"center",padding:"28px 16px 0",color:"rgba(201,168,76,.4)",fontSize:13,letterSpacing:4}}>
        ✦ &nbsp; DƏVƏTNAMƏ &nbsp; ✦
      </div>

      {/* Couple name */}
      <div style={{textAlign:"center",padding:"12px 24px 4px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,color:"#f2e8d0",
          textShadow:"0 0 40px rgba(201,168,76,.3)",lineHeight:1.2}}>{evName}</div>
      </div>

      {/* Divider */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 32px"}}>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,.4))"}}/>
        <div style={{color:"rgba(201,168,76,.6)",fontSize:11}}>✦</div>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(201,168,76,.4),transparent)"}}/>
      </div>

      {/* Greeting */}
      <div style={{textAlign:"center",padding:"0 24px 20px"}}>
        <div style={{fontSize:15,color:"rgba(255,255,255,.5)"}}>Hörmətli</div>
        <div style={{fontSize:22,fontWeight:700,color:"#e8cc78",margin:"4px 0"}}>{guestName}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.4)"}}>toy mərasiminə dəvət olunursunuz</div>
      </div>

      {/* Date & Hall */}
      <div style={{margin:"0 16px 20px",background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,overflow:"hidden"}} className="shine">
        {evDate&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:fullHall?"1px solid rgba(255,255,255,.05)":"none"}}>
          <span style={{fontSize:20}}>📅</span>
          <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{evDate}</span>
        </div>}
        {fullHall&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
          <span style={{fontSize:20}}>🏛️</span>
          <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{fullHall}</span>
        </div>}
      </div>

      {/* Table */}
      <div style={{margin:"0 16px 20px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,padding:"20px 16px",textAlign:"center"}}>
        <div style={{fontSize:11,color:"rgba(201,168,76,.5)",letterSpacing:2,marginBottom:16}}>MASA MƏLUMATI</div>
        <TableCircle tableId={rsvp?.table_id} seats={tableData?.seats||10} guests={guests}/>
        <div style={{fontSize:11,color:"rgba(201,168,76,.5)",letterSpacing:2,marginTop:14,marginBottom:14}}>MASADAKI QONAQLAR</div>
        {guests.map((g,i)=>{
          const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
          const isMe=g.name===guestName;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,
              background:isMe?"rgba(201,168,76,.08)":"transparent",marginBottom:4,
              border:isMe?"1px solid rgba(201,168,76,.2)":"1px solid transparent"}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:sc+"22",border:"1px solid "+sc+"44",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:sc}}>
                {g.name[0]||"?"}
              </div>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontSize:14,fontWeight:isMe?700:400,color:"#f2e8d0"}}>
                  {g.name}{isMe&&<span style={{fontSize:10,color:"#c9a84c",marginLeft:8,background:"rgba(201,168,76,.15)",padding:"1px 6px",borderRadius:8}}>Siz</span>}
                </div>
                {(g.count>1||g.ushaqCount>0)&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>
                  {g.count>1?g.count+" böyük":""}{g.ushaqCount>0?" + "+g.ushaqCount+" uşaq":""}
                </div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* RSVP */}
      <div style={{margin:"0 16px 20px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,padding:"20px 16px"}}>
        <div style={{fontSize:11,color:"rgba(201,168,76,.5)",letterSpacing:2,marginBottom:16,textAlign:"center"}}>İŞTİRAK TƏSDİQİ</div>
        {answered?(
          <div style={{textAlign:"center",padding:"12px"}}>
            <div style={{fontSize:48,marginBottom:10}}>{answer==="attending"?"🎉":"😔"}</div>
            <div style={{fontSize:16,fontWeight:700,color:answer==="attending"?"#50c878":"#ff8888"}}>
              {answer==="attending"?"Təsdiq edildi!":"Qeyd edildi"}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.3)",marginTop:8}}>Cavabınız məclis sahibinə çatdırıldı</div>
          </div>
        ):(
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>respond("attending")} style={{flex:1,padding:"20px 8px",borderRadius:14,border:"none",
              background:"linear-gradient(135deg,rgba(80,200,120,.5),rgba(80,200,120,.25))",
              color:"#50c878",fontSize:32,cursor:"pointer",transition:"all .2s"}}>
              ✅
            </button>
            <button onClick={()=>respond("not_attending")} style={{flex:1,padding:"20px 8px",borderRadius:14,
              border:"1px solid rgba(255,80,80,.3)",background:"rgba(255,80,80,.08)",
              color:"#ff8888",fontSize:32,cursor:"pointer"}}>
              ❌
            </button>
          </div>
        )}
      </div>

      {/* Hədiyyə */}
      {cardNumber&&(
        <div style={{margin:"0 16px 32px",background:"linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))",
          border:"1px solid rgba(201,168,76,.25)",borderRadius:16,padding:"20px 16px"}}>
          <div style={{fontSize:11,color:"rgba(201,168,76,.5)",letterSpacing:2,marginBottom:12,textAlign:"center"}}>HƏDİYYƏ VER</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:14,textAlign:"center",lineHeight:1.6}}>
            İstəsəniz kart vasitəsilə hədiyyə göndərə bilərsiniz
          </div>
          <div style={{background:"rgba(0,0,0,.4)",borderRadius:12,padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div>
              <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:4}}>Kart nömrəsi</div>
              <div style={{fontSize:17,fontWeight:800,color:"#c9a84c",letterSpacing:3,fontFamily:"monospace"}}>{cardNumber}</div>
            </div>
            <button onClick={copyCard} style={{padding:"9px 16px",borderRadius:10,flexShrink:0,
              border:"1px solid rgba(201,168,76,.4)",
              background:copied?"rgba(80,200,120,.2)":"rgba(201,168,76,.12)",
              color:copied?"#50c878":"#c9a84c",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
              {copied?"✓ Kopyalandı":"📋 Kopyala"}
            </button>
          </div>
        </div>
      )}

      {/* Footer ornament */}
      <div style={{textAlign:"center",padding:"0 16px 40px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,.3))"}}/>
          <div style={{color:"rgba(201,168,76,.4)",fontSize:11,letterSpacing:3}}>✦ GONAG.AZ ✦</div>
          <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(201,168,76,.3),transparent)"}}/>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>Toy koordinasiya sistemi</div>
      </div>
    </div>
  );
}
