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

// İndeks App.jsx-dəki DEVETNAME_SHABLONLAR ilə eynidir — dəvətnamə önizləməsi üçün
const SHABLON_COLORS = [
  { bg:"#0a0700", accent:"#c9a84c", text:"#f2e8d0" },
  { bg:"#1a0a12", accent:"#e87aad", text:"#f9c7d8" },
  { bg:"#020d1a", accent:"#7aade8", text:"#b5d4f4" },
  { bg:"#faf8f2", accent:"#c9a84c", text:"#2a1f06" },
  { bg:"#f4f1eb", accent:"#6b7d5c", text:"#2b2f26" },
  { bg:"#faf4ef", accent:"#c0603f", text:"#3a2117" },
  { bg:"#111214", accent:"#d4af5a", text:"#f0efec" },
  { bg:"#eef1f4", accent:"#4d6a86", text:"#1e2a35" },
  { bg:"#f7efec", accent:"#b98a7a", text:"#3a2c26" },
  { bg:"#0c1410", accent:"#7fa88a", text:"#e7efe9" }
];

// ─── YENİ MASA GÖRÜNÜŞÜ — real PNG aktivlərlə (table.png, flowers.png, chair-empty.png, seat-man/woman/child.png) ───
// Bu komponent ayrıca stil sahəsindədir (işıqlı, #FCFAF6) — təşkilatçının ümumi zal sxeminə TƏSİR ETMİR.
const RSVP_ASSET = n => "/"+n+".png";

function buildSeatOwners(guests, n){
  // App.jsx-dəki FloorPlanView ilə EYNİ alqoritm: hər qonaq öz seatIdx-ində oturur,
  // seatIdx yoxdursa (köhnə data) ilk boş yerlərə ardıcıl yerləşdirilir.
  const seatOwner = new Array(n).fill(null);
  const needsFallback = [];
  guests.forEach((g,gi)=>{
    const uc = g.ushaqCount||0, sc = g.spouseCount||0;
    const parts = [];
    for(let i=0;i<(g.count||1);i++) parts.push({isUshaq:false,isSpouse:false});
    for(let i=0;i<sc;i++) parts.push({isUshaq:false,isSpouse:true});
    for(let i=0;i<uc;i++) parts.push({isUshaq:true,isSpouse:false});
    if(g.seatIdx!=null && g.seatIdx>=0 && g.seatIdx<n){
      let placed=0;
      for(let off=0; off<n && placed<parts.length; off++){
        const idx=(g.seatIdx+off)%n;
        if(seatOwner[idx]===null){ seatOwner[idx]={g,gi,...parts[placed]}; placed++; }
      }
      for(let k=placed;k<parts.length;k++) needsFallback.push({g,gi,...parts[k]});
    } else {
      parts.forEach(part=>needsFallback.push({g,gi,...part}));
    }
  });
  let fbPtr=0, overflow=0;
  needsFallback.forEach(item=>{
    while(fbPtr<n && seatOwner[fbPtr]!==null) fbPtr++;
    if(fbPtr<n){ seatOwner[fbPtr]=item; fbPtr++; } else overflow++;
  });
  return {seatOwner, overflow};
}

function effGender(item){
  if(!item) return null;
  if(item.isUshaq) return "ushaq";
  if(item.isSpouse) return item.g.gender==="kishi"?"qadin":item.g.gender==="qadin"?"kishi":"";
  return item.g.gender||"";
}

const SEAT_RATIO = { kishi:0.804, qadin:0.811, ushaq:0.871, empty:0.864 }; // w/h — orijinal PNG-lərin öz nisbəti (dartılmasın deyə)

function TableView({ tableId, seats, guests=[], label="", guestName="" }){
  if(!seats){
    return (
      <div style={{background:"#FCFAF6",borderRadius:20,padding:"30px 22px",textAlign:"center",fontFamily:"'Manrope',sans-serif"}}>
        <div style={{fontSize:28,marginBottom:10}}>🪑</div>
        <div style={{fontSize:13,color:"#292722",fontWeight:500}}>Masanız təşkilatçı tərəfindən təyin edildikdə burada görünəcək.</div>
      </div>
    );
  }

  const n = Math.min(seats, 16);
  const { seatOwner, overflow } = buildSeatOwners(guests, n);
  const filled = guests.reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0)+(g.spouseCount||0),0);

  const VB = 480, cx=240, cy=235, r=88;
  const arc = (2*Math.PI*r)/n;
  const seatW = Math.max(30, Math.min(58, arc*0.86));

  const seatsData = Array.from({length:n}).map((_,i)=>{
    const angle=(2*Math.PI/n)*i-Math.PI/2;
    const rot=(angle*180/Math.PI)+90;
    const sx=cx+r*Math.cos(angle), sy=cy+r*Math.sin(angle);
    const item=seatOwner[i];
    const gender=effGender(item);
    const known = gender==="kishi"||gender==="qadin"||gender==="ushaq";
    const ratio = known?SEAT_RATIO[gender]:SEAT_RATIO.empty;
    const seatH = seatW/ratio;
    const isMe = item && item.g.name && item.g.name===guestName;
    const isRight = Math.cos(angle)>0.2, isLeft = Math.cos(angle)<-0.2;
    const anchor = isRight?"start":isLeft?"end":"middle";
    const lr1 = r+seatH*0.62, lr2 = r+seatH*0.62+16, lr3 = lr2+4;
    const lx1=cx+lr1*Math.cos(angle), ly1=cy+lr1*Math.sin(angle);
    const lx2=cx+lr2*Math.cos(angle), ly2=cy+lr2*Math.sin(angle);
    const tx=cx+lr3*Math.cos(angle), ty=cy+lr3*Math.sin(angle);
    return {i,angle,rot,sx,sy,item,gender,known,seatH,isMe,anchor,lx1,ly1,lx2,ly2,tx,ty};
  });

  return (
    <div style={{background:"#FCFAF6",border:"1px solid #EDE6D8",borderRadius:20,padding:"22px 16px 18px",fontFamily:"'Manrope',sans-serif"}}>
      <div style={{textAlign:"center",fontFamily:"'Manrope',sans-serif",fontWeight:600,fontSize:12,letterSpacing:3,color:"#80653C",marginBottom:14,textTransform:"uppercase"}}>
        Sizin masanız
      </div>

      <svg viewBox={`0 0 ${VB} ${VB}`} style={{width:"100%",maxWidth:340,display:"block",margin:"0 auto",overflow:"visible"}}>
        <image href={RSVP_ASSET("table")} xlinkHref={RSVP_ASSET("table")} x={cx-84} y={cy-84} width={168} height={168} preserveAspectRatio="xMidYMid meet"/>
        <image href={RSVP_ASSET("flowers")} xlinkHref={RSVP_ASSET("flowers")} x={cx-27} y={cy+2} width={54} height={52} preserveAspectRatio="xMidYMid meet"/>
        <text x={cx} y={cy-16} textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontWeight="600" fontSize="30" fill="#80653C">{tableId}</text>

        {seatsData.map(sd=>(
          <g key={sd.i}>
            {sd.item&&(
              <>
                <line x1={sd.lx1} y1={sd.ly1} x2={sd.lx2} y2={sd.ly2} stroke="#C9A25E" strokeWidth="1"/>
                <text x={sd.tx} y={sd.ty} textAnchor={sd.anchor} dominantBaseline="middle"
                  fontFamily="'Manrope',sans-serif" fontSize="10.5" fontWeight="600" fill="#292722">
                  {sd.item.g.name||"Adsız"}
                </text>
                {sd.isMe&&(
                  <g transform={`translate(${sd.tx},${sd.ty+15})`}>
                    <rect x={-15} y={-8} width={30} height={14} rx={7} fill="#80653C"/>
                    <text x={0} y={2} textAnchor="middle" fontFamily="'Manrope',sans-serif" fontSize="8.5" fontWeight="700" fill="#FCFAF6">Siz</text>
                  </g>
                )}
              </>
            )}
          </g>
        ))}

        {seatsData.map(sd=>{
          const w=seatW, h=sd.seatH;
          return (
            <g key={"seat"+sd.i} transform={`translate(${sd.sx},${sd.sy}) rotate(${sd.rot})`}>
              {sd.item&&sd.known&&(
                <image href={RSVP_ASSET(sd.gender==="kishi"?"seat-man":sd.gender==="qadin"?"seat-woman":"seat-child")}
                  xlinkHref={RSVP_ASSET(sd.gender==="kishi"?"seat-man":sd.gender==="qadin"?"seat-woman":"seat-child")}
                  x={-w/2} y={-h/2} width={w} height={h} preserveAspectRatio="xMidYMid meet"/>
              )}
              {!sd.item&&(
                <image href={RSVP_ASSET("chair-empty")} xlinkHref={RSVP_ASSET("chair-empty")} x={-w/2} y={-h/2} width={w} height={h} opacity={0.55} preserveAspectRatio="xMidYMid meet"/>
              )}
              {sd.item&&!sd.known&&(
                <g transform={`rotate(${-sd.rot})`}>
                  <circle r={w*0.32} fill="#EFE7D8" stroke="#80653C" strokeOpacity="0.35" strokeWidth="2"/>
                  <text textAnchor="middle" dominantBaseline="central" fontFamily="'Manrope',sans-serif" fontWeight="700" fontSize={w*0.28} fill="#80653C">
                    {(sd.item.g.name||"?")[0].toUpperCase()}
                  </text>
                </g>
              )}
              {sd.isMe&&<circle r={w*0.54} fill="none" stroke="#80653C" strokeWidth="2"/>}
            </g>
          );
        })}
      </svg>

      <div style={{textAlign:"center",fontSize:11,color:"#797267",marginTop:10}}>{filled} / {seats} dolu{label?" · "+label:""}</div>
      {overflow>0&&(
        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(193,56,42,.08)",border:"1px solid rgba(193,56,42,.2)",borderRadius:10,fontSize:10.5,color:"#A02A1E",textAlign:"center"}}>
          ⚠️ Bu masaya {overflow} nəfər tutumdan artıq təyin edilib — təşkilatçı ilə əlaqə saxlayın.
        </div>
      )}
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
  const [inviteShablon, setInviteShablon] = useState(null);
  const [inviteMedia, setInviteMedia] = useState(null);

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
      const meta = (ev.tables&&ev.tables._meta)||{};
      setInviteShablon(meta.myInviteShablon!=null?meta.myInviteShablon:null);
      setInviteMedia(meta.myInviteMedia||null);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&family=Manrope:wght@400;500;600&family=Cormorant+Garamond:wght@600&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

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

        {/* Dəvətnamə önizləməsi — sistemin şablonu + istifadəçinin öz video/şəkli (varsa) */}
        {(inviteShablon!=null||inviteMedia)&&(
          <div style={{margin:"0 16px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {inviteShablon!=null&&SHABLON_COLORS[inviteShablon]&&(()=>{
              const S=SHABLON_COLORS[inviteShablon];
              return (
                <div style={{borderRadius:16,overflow:"hidden",border:"1px solid "+S.accent+"40",
                  background:"linear-gradient(155deg,"+S.bg+","+S.bg+"cc)",padding:"28px 20px",textAlign:"center"}}>
                  <div style={{fontSize:10,letterSpacing:3,color:S.accent,fontWeight:700,marginBottom:10}}>DƏVƏTNAMƏ</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:S.text,marginBottom:6}}>{evName}</div>
                  {evDate&&<div style={{fontSize:12,color:S.accent}}>{evDate}</div>}
                </div>
              );
            })()}
            {inviteMedia&&(
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(201,168,76,.25)"}}>
                {inviteMedia.type==="video"?(
                  <video src={inviteMedia.url} controls style={{width:"100%",display:"block"}}/>
                ):(
                  <img src={inviteMedia.url} style={{width:"100%",display:"block"}}/>
                )}
              </div>
            )}
          </div>
        )}

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
          <TableView tableId={tableData?.id||rsvp?.table_id} seats={tableData?.seats} guests={guests} label={tblLabel} guestName={guestName}/>
        </div>

        {/* Masa yoldaşlarınız */}
        <div style={{margin:"0 16px 16px",background:"#FCFAF6",border:"1px solid #EDE6D8",borderRadius:20,padding:"18px 16px",fontFamily:"'Manrope',sans-serif"}}>
          <div style={{fontSize:11,color:"#80653C",marginBottom:12,textAlign:"center",letterSpacing:2,fontWeight:600}}>MASA YOLDAŞLARINIZ</div>
          {guests.map((g,i)=>{
            const gender = g.gender||"";
            const known = gender==="kishi"||gender==="qadin";
            const isMe = g.name===guestName;
            const extras = [];
            if(g.count>1) extras.push(g.count+" nəfər");
            if(g.spouseCount>0) extras.push(g.spouseCount+" həyat yoldaşı");
            if(g.ushaqCount>0) extras.push(g.ushaqCount+" uşaq");
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<guests.length-1?"1px solid #F0EAE0":"none"}}>
                {known?(
                  <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:isMe?"2px solid #80653C":"1px solid #EDE6D8",background:"#F5F0E6"}}>
                    <img src={RSVP_ASSET(gender==="kishi"?"seat-man":"seat-woman")} alt="" style={{width:"140%",height:"140%",objectFit:"cover",marginLeft:"-20%",marginTop:"-14%"}}/>
                  </div>
                ):(
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#EFE7D8",border:isMe?"2px solid #80653C":"1px solid rgba(128,101,60,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#80653C",flexShrink:0}}>
                    {(g.name||"?")[0].toUpperCase()}
                  </div>
                )}
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:13,color:isMe?"#80653C":"#292722",fontWeight:isMe?700:500,overflowWrap:"anywhere"}}>
                    {g.name||"Adsız"}{isMe&&<span style={{fontSize:10,color:"#80653C",marginLeft:6,fontWeight:700}}>· Siz</span>}
                  </div>
                  {extras.length>0&&<div style={{fontSize:10.5,color:"#8A8578",marginTop:1}}>{extras.join(" · ")}</div>}
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
