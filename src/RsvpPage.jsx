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
  const W=280, r=80, cx=140, cy=140;
  const chairCount = seats;
  const guestSlots = [];
  let idx=0;
  guests.forEach(g=>{ for(let i=0;i<(g.count||1);i++){ guestSlots.push({name:g.name,main:i===0,gender:g.gender}); idx++; } });

  const chairs = Array.from({length:chairCount}).map((_,i)=>{
    const angle=(2*Math.PI/chairCount)*i - Math.PI/2;
    const cr=10;
    const x=cx+(r+20)*Math.cos(angle);
    const y=cy+(r+20)*Math.sin(angle);
    const guest = guestSlots[i];
    // Ad pozisiyası — dairənin xaricində
    const tx=cx+(r+48)*Math.cos(angle);
    const ty=cy+(r+48)*Math.sin(angle);
    return { x, y, angle, guest, tx, ty };
  });

  const pct = seats>0?Math.round(filled/seats*100):0;
  const circumference = 2*Math.PI*r;
  const dash = (pct/100)*circumference;

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={W} height={W} style={{overflow:"visible"}}>
        <defs>
          <radialGradient id="tg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a1f08"/>
            <stop offset="100%" stopColor="#1a1200"/>
          </radialGradient>
        </defs>
        {/* Xarici dairə */}
        <circle cx={cx} cy={cy} r={r+32} fill="rgba(201,168,76,.04)" stroke="rgba(201,168,76,.12)" strokeWidth="1"/>
        {/* Progress ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(201,168,76,.12)" strokeWidth="8"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c9a84c" strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}/>
        {/* Oturacaqlar + adlar */}
        {chairs.map((c,i)=>{
          const sc = c.guest?(c.guest.gender==="kishi"?"#7aade8":c.guest.gender==="qadin"?"#e87aad":"#50c878"):"rgba(255,255,255,.1)";
          // Mətni düzgün istiqamətləndir
          const angleDeg = c.angle*180/Math.PI;
          const isRight = Math.cos(c.angle)>0.1;
          const isLeft = Math.cos(c.angle)<-0.1;
          const anchor = isRight?"start":isLeft?"end":"middle";
          const nameShort = c.guest?.main ? (c.guest.name.length>8?c.guest.name.slice(0,8)+"…":c.guest.name) : "";
          return(
            <g key={i}>
              <ellipse cx={c.x} cy={c.y} rx={11} ry={8}
                transform={`rotate(${angleDeg+90} ${c.x} ${c.y})`}
                fill={c.guest?sc+"33":"rgba(255,255,255,.06)"}
                stroke={c.guest?sc:"rgba(255,255,255,.1)"} strokeWidth="1.5"/>
              {nameShort&&(
                <text x={c.tx} y={c.ty+4} textAnchor={anchor}
                  fill={sc} fontSize="9.5" fontWeight="600" fontFamily="'DM Sans',sans-serif">
                  {nameShort}
                </text>
              )}
            </g>
          );
        })}
        {/* Masa */}
        <circle cx={cx} cy={cy} r={r-14} fill="url(#tg2)" stroke="rgba(201,168,76,.35)" strokeWidth="1.5"/>
        <text x={cx} y={cy-10} textAnchor="middle" fill="#c9a84c" fontSize="32" fontWeight="800" fontFamily="'Playfair Display',serif">{tableId}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(201,168,76,.45)" fontSize="11">{filled}/{seats}</text>
      </svg>
      <div style={{marginTop:6,fontSize:13,fontWeight:700,color:"#c9a84c",letterSpacing:1,textAlign:"center"}}>MASA № {tableId}{label?" — "+label:""}</div>
    </div>
  );
}


function QRCode({ value, size=160 }){
  // Sadə QR vizual — real QR API-dən istifadə edirik
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0e0a04&color=c9a84c&margin=2`;
  return <img src={url} alt="QR" style={{width:size,height:size,borderRadius:8,display:"block"}}/>;
}

function GiftSection({ rsvpCode, sbUrl, sbKey }){
  const [step, setStep] = useState("info"); // "info"|"form"|"qr"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [giftCode, setGiftCode] = useState(null);

  async function submitGift(){
    if(!name.trim()||!phone.trim()) return;
    setLoading(true);
    const code = "GIFT-"+Math.random().toString(36).slice(2,8).toUpperCase();
    try{
      await fetch(sbUrl+"/rest/v1/gifts",{
        method:"POST",
        headers:{apikey:sbKey,Authorization:"Bearer "+sbKey,"Content-Type":"application/json",Prefer:"return=representation"},
        body:JSON.stringify({rsvp_code:rsvpCode,guest_name:name.trim(),phone:phone.trim(),gift_code:code})
      });
      setGiftCode(code);
      setStep("qr");
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  return(
    <div style={{margin:"0 16px 16px",background:"rgba(201,168,76,.04)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,overflow:"hidden"}}>
      {/* Başlıq */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(201,168,76,.08)",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>🎁</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>Məclis sahibindən hədiyyə</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:1}}>Vanlav şirniyyat şəbəkəsindən tort hədiyyə</div>
        </div>
      </div>

      {step==="info"&&(
        <div style={{padding:"12px 16px"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:12}}>
            QR kodu şəbəkə mağazasında skan edin — hədiyyənizi əldə edin
          </div>
          <button onClick={()=>setStep("form")}
            style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            🎁 Hədiyyəmi al
          </button>
        </div>
      )}

      {step==="form"&&(
        <div style={{padding:"12px 16px"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:10}}>Ad və nömrənizi daxil edin:</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad"
            style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:8,color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:8}}/>
          <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:8,marginBottom:12,overflow:"hidden"}}>
            <span style={{padding:"0 10px",color:"rgba(201,168,76,.7)",fontSize:13,fontWeight:600,flexShrink:0}}>+994</span>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="XX XXX XX XX"
              style={{flex:1,padding:"9px 4px",background:"transparent",border:"none",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <button onClick={submitGift} disabled={loading||!name.trim()||!phone.trim()}
            style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:name.trim()&&phone.trim()?"rgba(201,168,76,.3)":"rgba(255,255,255,.05)",color:name.trim()&&phone.trim()?"#c9a84c":"rgba(255,255,255,.2)",fontSize:13,fontWeight:700,cursor:name.trim()&&phone.trim()?"pointer":"default"}}>
            {loading?"Yüklənir...":"✅ Təsdiq et"}
          </button>
        </div>
      )}

      {step==="qr"&&giftCode&&(
        <div style={{padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:12,lineHeight:1.6}}>
            Hədiyyə QR kodunuz hazırdır!<br/>
            <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>Vanlav şirniyyat şəbəkəsində skan etdirin</span>
          </div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
            <QRCode value={"GONAG-GIFT:"+giftCode} size={140}/>
          </div>
          <div style={{fontSize:10,color:"rgba(201,168,76,.5)",letterSpacing:2,fontFamily:"monospace"}}>{giftCode}</div>
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
  const [tebrikText, setTebrikText] = useState("Təəssüf ki gələ bilməyəcəyinizi bildirdiniz. Bizi sevindirsəydiniz çox xoş olardı. Hər halda ən xoş arzularımız sizinlədir! 🌹");

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
      <div style={{textAlign:"center",color:"#c9a84c",fontSize:14}}>🎊 Yüklənir...</div>
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

  const hallAddress = hall.address||(
    hallName.includes("Gülüstan")?"Şəhriyar küç. 2, Bakı":
    hallName.includes("Nərgiz")?"Nizami küç. 45, Bakı":
    hallName.includes("Grand Palace")?"İstiqlaliyyət küç. 12, Bakı":
    hallName.includes("Kristal")?"H.Cavid pr. 11, Bakı":
    hallName.includes("Şüvəlan")?"Şüvəlan, Bakı":""
  );
  const mapsQ = encodeURIComponent((fullHall||hallName)+" Bakı");

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a0700 0%,#12080e 50%,#070a12 100%)",fontFamily:"'DM Sans',sans-serif",color:"#f2e8d0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>

      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(201,168,76,.15)",background:"rgba(201,168,76,.04)",textAlign:"center"}}>
        <img src="data:image/png;base64,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" alt="GONAG" style={{height:42,width:42,objectFit:"contain"}}/>
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
          {evDate&&(
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:fullHall?"1px solid rgba(255,255,255,.06)":"none"}}>
              <span style={{fontSize:22}}>📅</span>
              <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{evDate}</span>
            </div>
          )}
          {fullHall&&(
            <div style={{padding:"14px 18px",borderBottom:(hallAddress||true)?"1px solid rgba(255,255,255,.06)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:hallAddress?6:0}}>
                <span style={{fontSize:22}}>🏛️</span>
                <span style={{fontSize:15,color:"#f2e8d0",fontWeight:500}}>{fullHall}</span>
              </div>
              {hallAddress&&<div style={{fontSize:12,color:"rgba(255,255,255,.4)",paddingLeft:34}}>📍 {hallAddress}</div>}
            </div>
          )}
          {/* Xəritə */}
          <div style={{display:"flex",gap:8,padding:"12px 16px"}}>
            <a href={"https://www.google.com/maps/search/?api=1&query="+mapsQ} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:10,background:"rgba(66,133,244,.15)",border:"1px solid rgba(66,133,244,.3)",color:"#6fa8ff",fontSize:12,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>
              🗺️ Google
            </a>
            <a href={"https://waze.com/ul?q="+mapsQ+"&navigate=yes"} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:10,background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.25)",color:"#50c878",fontSize:12,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>
              🚗 Waze
            </a>
            <a href={"https://yandex.com/maps/?text="+mapsQ} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 4px",borderRadius:10,background:"rgba(255,80,0,.1)",border:"1px solid rgba(255,80,0,.2)",color:"#ff7c4d",fontSize:12,fontWeight:600,textDecoration:"none",textAlign:"center",display:"block"}}>
              🗺️ Yandex
            </a>
          </div>
        </div>

        {/* Masa dairəsi */}
        <div style={{margin:"0 16px 16px",textAlign:"center",padding:"20px 0"}}>
          <TableCircle tableId={rsvp?.table_id} seats={tableData?.seats||10} guests={guests} label={tblLabel}/>
        </div>

        {/* Qonaqlar siyahısı */}
        <div style={{margin:"0 16px 16px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.5)",marginBottom:10,textAlign:"center",letterSpacing:1}}>Masadakı qonaqlar:</div>
          {guests.map((g,i)=>{
            const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<guests.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:sc+"22",border:"1px solid "+sc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:sc,flexShrink:0}}>{g.name[0]||"?"}</div>
                <div>
                  <div style={{fontSize:14,color:g.name===guestName?"#c9a84c":"#f2e8d0",fontWeight:g.name===guestName?700:400}}>
                    {g.name}{g.name===guestName&&<span style={{fontSize:10,color:"#c9a84c",marginLeft:6}}>← Siz</span>}
                  </div>
                  {(g.count>1||g.ushaqCount>0)&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{g.count>1?g.count+" nəfər":""}{g.ushaqCount>0?" + "+g.ushaqCount+" uşaq":""}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RSVP */}
        <div style={{margin:"0 16px 16px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,padding:"20px 16px"}}>
          {answered?(
            <div style={{textAlign:"center",padding:"8px"}}>
              <div style={{fontSize:36,marginBottom:8}}>{answer==="attending"?"🎉":"😔"}</div>
              <div style={{fontSize:14,fontWeight:600,color:answer==="attending"?"#50c878":"#ff8888"}}>
                {answer==="attending"?"Gəldim — təsdiq edildi!":"Gəlmirəm — qeyd edildi"}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:6}}>Cavabınız məclis sahibinə çatdırıldı</div>
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

        {/* Hədiyyə QR bölməsi */}
        <GiftSection rsvpCode={code} sbUrl={SB_URL} sbKey={SB_KEY}/>

        {/* Kart nömrəsi */}
        {cardNumber&&(
          <div style={{margin:"0 16px 16px",background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:13,color:"rgba(201,168,76,.7)",fontWeight:700,marginBottom:10}}>🎁 Hədiyyə ver</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12,lineHeight:1.6}}>İstəsəniz kart vasitəsilə hədiyyə göndərə bilərsiniz.</div>
            <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:4}}>Kart nömrəsi</div>
                <div style={{fontSize:16,fontWeight:800,color:"#c9a84c",letterSpacing:2,fontFamily:"monospace"}}>{cardNumber}</div>
              </div>
              <button onClick={copyCard}
                style={{padding:"9px 14px",borderRadius:9,border:"1px solid rgba(201,168,76,.4)",background:copied?"rgba(80,200,120,.2)":"rgba(201,168,76,.12)",color:copied?"#50c878":"#c9a84c",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                {copied?"✓ Kopyalandı":"📋 Kopyala"}
              </button>
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:24,color:"rgba(255,255,255,.15)",fontSize:11}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 200" style="height:18px;opacity:.4;width:auto"><defs><linearGradient id="gl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e8c96a"/><stop offset="50%" style="stop-color:#c9a84c"/><stop offset="100%" style="stop-color:#a07830"/></linearGradient><linearGradient id="gl2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#7aade8"/><stop offset="100%" style="stop-color:#4a7dc0"/></linearGradient></defs><text x="10" y="148" font-family="Georgia,serif" font-size="110" font-weight="700" fill="url(#gl1)" letter-spacing="-2">G</text><g transform="translate(178,98)"><circle cx="0" cy="0" r="42" fill="none" stroke="url(#gl1)" stroke-width="1.5" stroke-dasharray="7 5"/><circle cx="0" cy="0" r="35" fill="#0e0a04" stroke="url(#gl1)" stroke-width="1"/><circle cx="0" cy="0" r="26" fill="url(#gl2)" opacity="0.92"/><rect x="-12" y="-7" width="24" height="15" rx="2" fill="none" stroke="white" stroke-width="1.7"/><polyline points="-12,-7 0,3.5 12,-7" fill="none" stroke="white" stroke-width="1.7" stroke-linejoin="round"/><circle cx="0" cy="-42" r="2.8" fill="url(#gl1)"/><circle cx="0" cy="42" r="2.8" fill="url(#gl1)"/><circle cx="-42" cy="0" r="2.8" fill="url(#gl1)"/><circle cx="42" cy="0" r="2.8" fill="url(#gl1)"/><circle cx="-30" cy="-30" r="2" fill="url(#gl1)" opacity="0.6"/><circle cx="30" cy="-30" r="2" fill="url(#gl1)" opacity="0.6"/><circle cx="-30" cy="30" r="2" fill="url(#gl1)" opacity="0.6"/><circle cx="30" cy="30" r="2" fill="url(#gl1)" opacity="0.6"/></g><text x="232" y="148" font-family="Georgia,serif" font-size="110" font-weight="700" fill="url(#gl1)" letter-spacing="-2">NAG</text></svg>
          <span style={{margin:"0 8px"}}>·</span>
          Toy koordinasiya sistemi
        </div>
      </div>

      {/* Tebrik pəncərəsi — Gəlmirəm basanda */}
      {tebrikOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"flex-end"}}>
          <div style={{width:"100%",background:"#0e0a04",borderTop:"1px solid rgba(201,168,76,.3)",borderRadius:"20px 20px 0 0",padding:"20px 16px 40px"}}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)",margin:"0 auto 16px"}}/>
            <div style={{fontSize:14,color:"#c9a84c",fontWeight:700,marginBottom:4}}>💌 Tebrik mesajı</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:12}}>İstəsəniz toy sahibinə tebrik mesajı göndərin</div>
            <textarea value={tebrikText} onChange={e=>setTebrikText(e.target.value)} rows={4}
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.25)",borderRadius:10,padding:"10px 12px",color:"#f2e8d0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"none"}}/>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>setTebrikOpen(false)}
                style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(255,255,255,.4)",fontSize:12,cursor:"pointer"}}>
                Keç
              </button>
              <button onClick={()=>{
                const ownerPhone=(rsvp?.owner_phone||"").replace(/\D/g,"");
                if(ownerPhone) window.open("https://wa.me/"+ownerPhone+"?text="+encodeURIComponent(tebrikText),"_blank");
                else if(navigator.share) navigator.share({text:tebrikText}).catch(()=>{});
                else window.open("https://wa.me/?text="+encodeURIComponent(tebrikText),"_blank");
                setTebrikOpen(false);
              }} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(90deg,rgba(37,211,102,.5),rgba(37,211,102,.3))",color:"#25d366",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                📱 WhatsApp-da göndər
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
