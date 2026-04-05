import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, opts={}) {
  const res = await fetch(SB_URL+"/rest/v1/"+path, {
    ...opts,
    headers:{ apikey:SB_KEY, Authorization:"Bearer "+SB_KEY, "Content-Type":"application/json", ...(opts.headers||{}) }
  });
  if(!res.ok) return null;
  try{ return await res.json(); }catch{ return null; }
}

function TableCircle({ tableId, seats=10, guests=[], label="" }){
  const filled = guests.reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0),0);
  const W=320, r=82, cx=160, cy=160;

  // Hər qonaq + uşaqları ayrı slot kimi
  const guestSlots = [];
  guests.forEach(g=>{
    for(let i=0;i<(g.count||1);i++)
      guestSlots.push({name:i===0?g.name:"",main:i===0,gender:g.gender||"other"});
    for(let j=0;j<(g.ushaqCount||0);j++)
      guestSlots.push({name:"",main:false,gender:"ushaq"});
  });

  const chairs = Array.from({length:seats}).map((_,i)=>{
    const angle=(2*Math.PI/seats)*i-Math.PI/2;
    const fx=cx+(r+18)*Math.cos(angle), fy=cy+(r+18)*Math.sin(angle);
    const nx=cx+(r+36)*Math.cos(angle), ny=cy+(r+36)*Math.sin(angle);
    const lx=cx+(r+62)*Math.cos(angle), ly=cy+(r+62)*Math.sin(angle);
    const guest=guestSlots[i];
    const isRight=Math.cos(angle)>0.15, isLeft=Math.cos(angle)<-0.15;
    const anchor=isRight?"start":isLeft?"end":"middle";
    const sc=guest?(guest.gender==="kishi"?"#7aade8":guest.gender==="qadin"?"#e87aad":guest.gender==="ushaq"?"#f5d060":"#50c878"):"rgba(255,255,255,.15)";
    return {angle,fx,fy,nx,ny,lx,ly,anchor,sc,guest};
  });

  const pct=seats>0?Math.round(filled/seats*100):0;
  const circ=2*Math.PI*r;
  const dash=(pct/100)*circ;

  // SVG insan fiquru — baş + bədən + salamlayan əl
  function PersonFigure({cx:px, cy:py, angle, gender}){
    const color = gender==="kishi"?"#7aade8":gender==="qadin"?"#e87aad":gender==="ushaq"?"#f5d060":"#50c878";
    const s = gender==="ushaq" ? 5 : 7;
    const rot = (angle*180/Math.PI)+90;
    return(
      <g transform={`translate(${px},${py}) rotate(${rot})`}>
        <circle cx={0} cy={-s*1.8} r={s*0.55} fill={color} opacity={0.9}/>
        <line x1={0} y1={-s*1.2} x2={0} y2={0} stroke={color} strokeWidth={s*0.35} strokeLinecap="round"/>
        <line x1={0} y1={-s*0.8} x2={-s*0.8} y2={-s*0.2} stroke={color} strokeWidth={s*0.22} strokeLinecap="round"/>
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="0;-30;0;-30;0" dur="2s" repeatCount="indefinite"
            additive="sum"/>
          <line x1={0} y1={-s*0.8} x2={s*0.9} y2={-s*1.5} stroke={color} strokeWidth={s*0.22} strokeLinecap="round"/>
          <circle cx={s*0.9} cy={-s*1.5} r={s*0.18} fill={color} opacity={0.8}/>
        </g>
        <line x1={0} y1={0} x2={-s*0.45} y2={s*0.8} stroke={color} strokeWidth={s*0.22} strokeLinecap="round"/>
        <line x1={0} y1={0} x2={s*0.45} y2={s*0.8} stroke={color} strokeWidth={s*0.22} strokeLinecap="round"/>
      </g>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={W} height={W} style={{overflow:"visible"}}>
        <defs>
          <radialGradient id="tg4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a1f08"/>
            <stop offset="100%" stopColor="#1a1200"/>
          </radialGradient>
        </defs>

        {/* Progress ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(201,168,76,.1)" strokeWidth="6"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c9a84c" strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}/>

        {/* Masa */}
        <circle cx={cx} cy={cy} r={r-10} fill="url(#tg4)" stroke="rgba(201,168,76,.4)" strokeWidth="2"/>
        <text x={cx} y={cy-6} textAnchor="middle" fill="#c9a84c" fontSize="28" fontWeight="800" fontFamily="Georgia,serif">{tableId}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(201,168,76,.4)" fontSize="10">{filled}/{seats}</text>

        {/* Oturacaqlar + insan fiqurları + adlar */}
        {chairs.map((c,i)=>(
          <g key={i}>
            {/* Oturacaq */}
            <ellipse cx={c.fx} cy={c.fy} rx={10} ry={7}
              transform={`rotate(${c.angle*180/Math.PI+90} ${c.fx} ${c.fy})`}
              fill={c.guest?c.sc+"22":"rgba(255,255,255,.05)"}
              stroke={c.guest?c.sc:"rgba(255,255,255,.12)"} strokeWidth="1.5"/>

            {/* İnsan fiquru */}
            {c.guest&&<PersonFigure cx={c.nx} cy={c.ny} angle={c.angle} gender={c.guest.gender}/>}

            {/* Ad */}
            {c.guest?.name&&(
              <text x={c.lx} y={c.ly+3} textAnchor={c.anchor}
                fill={c.sc} fontSize="10" fontWeight="800" fontFamily="'DM Sans',sans-serif"
                stroke="#080604" strokeWidth="2" paintOrder="stroke">
                {c.guest.name.length>9?c.guest.name.slice(0,9)+"…":c.guest.name}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div style={{fontSize:12,fontWeight:700,color:"#c9a84c",letterSpacing:1,textAlign:"center",marginTop:4}}>
        MASA № {tableId}{label?" — "+label:""}
      </div>
    </div>
  );
}

function GiftSection({ rsvpCode }){
  const [step, setStep] = useState("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [giftCode, setGiftCode] = useState(null);

  async function submit(){
    if(!name.trim()||!phone.trim()) return;
    setLoading(true);
    const gc = "GIFT-"+Math.random().toString(36).slice(2,8).toUpperCase();
    try{
      await fetch(SB_URL+"/rest/v1/gifts",{
        method:"POST",
        headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json",Prefer:"return=representation"},
        body:JSON.stringify({rsvp_code:rsvpCode,guest_name:name.trim(),phone:"+994"+phone.trim(),gift_code:gc})
      });
      setGiftCode(gc);
      setStep("qr");
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  const inp = {width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:8,color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};

  return(
    <div style={{margin:"0 16px 16px",background:"rgba(201,168,76,.04)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>🎁 Məclis sahibindən hədiyyə</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2}}>Vanlav şirniyyat şəbəkəsindən tort hədiyyə</div>
      </div>
      {step==="info"&&(
        <div style={{padding:"12px 16px"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:12}}>QR kodu mağazada skan edin — hədiyyənizi əldə edin</div>
          <button onClick={()=>setStep("form")} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            🎁 Hədiyyəmi al
          </button>
        </div>
      )}
      {step==="form"&&(
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad" style={inp}/>
          <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:8,overflow:"hidden"}}>
            <span style={{padding:"0 10px",color:"rgba(201,168,76,.7)",fontSize:13,flexShrink:0}}>+994</span>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="XX XXX XX XX"
              style={{flex:1,padding:"9px 4px",background:"transparent",border:"none",color:"#f2e8d0",fontSize:13,outline:"none"}}/>
          </div>
          <button onClick={submit} disabled={loading||!name.trim()||!phone.trim()}
            style={{padding:"10px",borderRadius:10,border:"none",background:name.trim()&&phone.trim()?"rgba(201,168,76,.3)":"rgba(255,255,255,.05)",color:name.trim()&&phone.trim()?"#c9a84c":"rgba(255,255,255,.2)",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {loading?"Yüklənir...":"✅ Təsdiq et"}
          </button>
        </div>
      )}
      {step==="qr"&&giftCode&&(
        <div style={{padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:12}}>Hədiyyə QR kodunuz hazırdır!</div>
          <img src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GONAG-GIFT:"+giftCode+"&bgcolor=0e0a04&color=c9a84c&margin=2"}
            alt="QR" style={{width:150,height:150,borderRadius:8,display:"block",margin:"0 auto 10px"}}/>
          <div style={{fontSize:11,color:"rgba(201,168,76,.6)",fontFamily:"monospace",letterSpacing:2}}>{giftCode}</div>
        </div>
      )}
    </div>
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
  const [tebrikOpen, setTebrikOpen] = useState(false);
  const [tebrikText, setTebrikText] = useState("Təəssüf ki gələ bilməyəcəyinizi bildirdiniz. Ən xoş arzularımız sizinlədir! 🌹");

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
      method:"PATCH", headers:{Prefer:"return=representation"},
      body:JSON.stringify({status:resp, updated_at:new Date().toISOString()})
    });
    setAnswer(resp); setAnswered(true);
    if(resp==="not_attending") setTebrikOpen(true);
  }

  function copyCard(){
    try{ navigator.clipboard.writeText(cardNumber); }catch(e){}
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  if(status==="loading") return(
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#c9a84c",fontSize:14}}>🎊 Yüklənir...</div>
    </div>
  );

  if(status==="error") return(
    <div style={{minHeight:"100vh",background:"#080604",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <div style={{color:"#ff9999",fontSize:16,fontWeight:700}}>Link tapılmadı</div>
      </div>
    </div>
  );

  const meta = eventData?.tables?._meta||{};
  const obData = meta.obData||{};
  const hall = meta.hall||{};
  const evName = eventData?.couple||(obData.boy&&obData.girl?obData.boy+" & "+obData.girl:obData.name||"Məclis");
  const evDate = obData.date||"";
  const hallName = hall._venueName||(eventData?.hall_name||"");
  const hallZal = hall.name||"";
  const fullHall = hallName+(hallZal?" — "+hallZal:"");
  const cardNumber = eventData?.card_number||"";
  const guests = tableData?.guests||[];
  const guestName = rsvp?.guest_name||"";
  const tblLabel = tableData?.label||"";
  const hallAddress = hallName.includes("Gülüstan")?"Şəhriyar küç. 2, Bakı":
    hallName.includes("Nərgiz")?"Nizami küç. 45, Bakı":
    hallName.includes("Grand Palace")?"İstiqlaliyyət küç. 12, Bakı":
    hallName.includes("Kristal")?"H.Cavid pr. 11, Bakı":
    hallName.includes("Şüvəlan")?"Şüvəlan, Bakı":"";
  const mapsQ = encodeURIComponent((fullHall||hallName)+" Bakı");

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a0700 0%,#12080e 50%,#070a12 100%)",fontFamily:"'DM Sans',sans-serif",color:"#f2e8d0"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(201,168,76,.15)",background:"rgba(201,168,76,.04)",textAlign:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#c9a84c",letterSpacing:3}}>GONAG<span style={{fontStyle:"italic",color:"#f2e8d0"}}>.AZ</span></div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"20px 0 60px"}}>

        {/* Ad */}
        <div style={{textAlign:"center",padding:"20px 16px 16px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#c9a84c",marginBottom:8}}>{evName}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,.5)"}}>Hörmətli <span style={{color:"#f2e8d0",fontWeight:600}}>{guestName}</span>,</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:4}}>toy mərasiminə dəvət olunursunuz!</div>
        </div>

        {/* Tarix və Zal */}
        <div style={{margin:"0 16px 16px",background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,overflow:"hidden"}}>
          {evDate&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:fullHall?"1px solid rgba(255,255,255,.06)":"none"}}>
            <span style={{fontSize:20}}>📅</span>
            <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{evDate}</span>
          </div>}
          {fullHall&&<div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:hallAddress?6:0}}>
              <span style={{fontSize:20}}>🏛️</span>
              <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{fullHall}</span>
            </div>
            {hallAddress&&<div style={{fontSize:12,color:"rgba(255,255,255,.4)",paddingLeft:34}}>📍 {hallAddress}</div>}
          </div>}
          <div style={{display:"flex",gap:8,padding:"12px 16px"}}>
            <a href={"https://www.google.com/maps/search/?api=1&query="+mapsQ} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:9,background:"rgba(66,133,244,.15)",border:"1px solid rgba(66,133,244,.3)",color:"#6fa8ff",fontSize:11,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>🗺️ Google</a>
            <a href={"https://waze.com/ul?q="+mapsQ+"&navigate=yes"} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:9,background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.25)",color:"#50c878",fontSize:11,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>🚗 Waze</a>
            <a href={"https://yandex.com/maps/?text="+mapsQ} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:9,background:"rgba(255,80,0,.1)",border:"1px solid rgba(255,80,0,.2)",color:"#ff7c4d",fontSize:11,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>🗺️ Yandex</a>
          </div>
        </div>

        {/* Masa dairəsi */}
        <div style={{margin:"0 16px 16px",textAlign:"center",padding:"10px 0"}}>
          <TableCircle tableId={rsvp?.table_id} seats={tableData?.seats||10} guests={guests} label={tblLabel}/>
        </div>

        {/* Qonaqlar siyahısı */}
        <div style={{margin:"0 16px 16px"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:8,textAlign:"center",letterSpacing:1}}>Masadakı qonaqlar:</div>
          {guests.map((g,i)=>{
            const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<guests.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:sc+"22",border:"1px solid "+sc+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:sc,flexShrink:0}}>{g.name[0]||"?"}</div>
                <div>
                  <div style={{fontSize:13,color:g.name===guestName?"#c9a84c":"#f2e8d0",fontWeight:g.name===guestName?700:400}}>
                    {g.name}{g.name===guestName&&<span style={{fontSize:10,color:"#c9a84c",marginLeft:6}}>← Siz</span>}
                  </div>
                  {g.count>1&&<div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{g.count} nəfər</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RSVP */}
        <div style={{margin:"0 16px 16px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:11,color:"rgba(201,168,76,.5)",letterSpacing:2,marginBottom:14,textAlign:"center"}}>İŞTİRAK TƏSDİQİ</div>
          {answered?(
            <div style={{textAlign:"center",padding:"8px"}}>
              <div style={{fontSize:36,marginBottom:8}}>{answer==="attending"?"🎉":"😔"}</div>
              <div style={{fontSize:14,fontWeight:600,color:answer==="attending"?"#50c878":"#ff8888"}}>
                {answer==="attending"?"Gəldim — təsdiq edildi!":"Gəlmirəm — qeyd edildi"}
              </div>
            </div>
          ):(
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>respond("attending")}
                style={{padding:"9px 22px",borderRadius:10,border:"1px solid rgba(80,200,120,.4)",background:"rgba(80,200,120,.12)",color:"#50c878",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                ✅ Gəldim
              </button>
              <button onClick={()=>respond("not_attending")}
                style={{padding:"9px 22px",borderRadius:10,border:"1px solid rgba(255,80,80,.3)",background:"rgba(255,80,80,.08)",color:"#ff8888",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                ❌ Gəlmirəm
              </button>
            </div>
          )}
        </div>

        {/* Hədiyyə QR */}
        <GiftSection rsvpCode={code}/>

        {/* Kart */}
        {cardNumber&&(
          <div style={{margin:"0 16px 16px",background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:13,color:"rgba(201,168,76,.7)",fontWeight:700,marginBottom:10}}>💳 Kart nömrəsi</div>
            <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{fontSize:15,fontWeight:800,color:"#c9a84c",letterSpacing:2,fontFamily:"monospace"}}>{cardNumber}</div>
              <button onClick={copyCard} style={{padding:"8px 12px",borderRadius:8,border:"1px solid rgba(201,168,76,.4)",background:copied?"rgba(80,200,120,.2)":"rgba(201,168,76,.12)",color:copied?"#50c878":"#c9a84c",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                {copied?"✓":"📋 Kopyala"}
              </button>
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:20,color:"rgba(255,255,255,.15)",fontSize:11}}>
          GONAG.AZ · Toy koordinasiya sistemi
        </div>
      </div>

      {/* Tebrik pəncərəsi */}
      {tebrikOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"flex-end"}} onClick={()=>setTebrikOpen(false)}>
          <div style={{width:"100%",background:"#0e0a04",borderTop:"1px solid rgba(201,168,76,.3)",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)",margin:"0 auto 16px"}}/>
            <div style={{fontSize:14,fontWeight:700,color:"#c9a84c",marginBottom:12}}>💌 Tebrik göndər</div>
            <textarea value={tebrikText} onChange={e=>setTebrikText(e.target.value)} rows={4}
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.25)",borderRadius:10,padding:"10px 12px",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"none",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setTebrikOpen(false)} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(255,255,255,.4)",fontSize:12,cursor:"pointer"}}>Sonra</button>
              <button onClick={()=>{
                if(navigator.share) navigator.share({text:tebrikText}).catch(()=>{});
                else window.open("https://wa.me/?text="+encodeURIComponent(tebrikText),"_blank");
                setTebrikOpen(false);
              }} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"rgba(37,211,102,.2)",color:"#25d366",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                📱 Göndər
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
