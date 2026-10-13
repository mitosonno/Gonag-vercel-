import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InviteStage, InviteHero, InviteMedia, InviteTable, themeAt } from "./inviteThemes.jsx";

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

  const inp = {width:"100%",padding:"9px 12px",background:"var(--soft)",border:"1px solid var(--line)",borderRadius:10,color:"var(--ink)",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};

  return(
    <section className="qi-card qi-reveal qi-d4" style={{padding:0,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid var(--line)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--accent)",fontFamily:"'Manrope',sans-serif",display:"flex",alignItems:"center",gap:7}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-1.5-3-6-3-6 0s4.5 0 6 0Zm0 0c1.5-3 6-3 6 0s-4.5 0-6 0Z"/></svg>
          Məclis sahibindən hədiyyə
        </div>
        <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>Vanlav şirniyyat şəbəkəsindən tort hədiyyə</div>
      </div>
      {step==="info"&&(
        <div style={{padding:"14px 18px"}}>
          <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.7,marginBottom:12}}>QR kodu mağazada skan edin — hədiyyənizi əldə edin</div>
          <button onClick={()=>setStep("form")} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:"var(--soft)",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-1.5-3-6-3-6 0s4.5 0 6 0Zm0 0c1.5-3 6-3 6 0s-4.5 0-6 0Z"/></svg>
            Hədiyyəmi al
          </button>
        </div>
      )}
      {step==="form"&&(
        <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad" style={inp}/>
          <div style={{display:"flex",alignItems:"center",background:"var(--soft)",border:"1px solid var(--line)",borderRadius:10,overflow:"hidden"}}>
            <span style={{padding:"0 10px",color:"var(--accent)",fontSize:13,flexShrink:0}}>+994</span>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="XX XXX XX XX"
              style={{flex:1,padding:"9px 4px",background:"transparent",border:"none",color:"var(--ink)",fontSize:13,outline:"none"}}/>
          </div>
          <button onClick={submit} disabled={loading||!name.trim()||!phone.trim()}
            style={{padding:"11px",borderRadius:12,border:"none",background:name.trim()&&phone.trim()?"var(--accent)":"var(--soft)",color:name.trim()&&phone.trim()?"var(--on-accent)":"var(--muted)",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {loading?"Yüklənir...":"✓ Təsdiq et"}
          </button>
        </div>
      )}
      {step==="qr"&&giftCode&&(
        <div style={{padding:"18px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Hədiyyə QR kodunuz hazırdır!</div>
          <img src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GONAG-GIFT:"+giftCode+"&bgcolor=FCFAF6&color=80653C&margin=2"}
            alt="QR" style={{width:150,height:150,borderRadius:12,display:"block",margin:"0 auto 10px",border:"1px solid var(--line)",background:"#fff"}}/>
          <div style={{fontSize:11,color:"var(--accent)",fontFamily:"monospace",letterSpacing:2}}>{giftCode}</div>
        </div>
      )}
    </section>
  );
}

function ChairLoader(){
  const seats = 8;
  const [seatsIn, setSeatsIn] = useState(0);

  useEffect(()=>{
    let i = 0, dir = 1, timer;
    function tick(){
      i += dir;
      setSeatsIn(i);
      if(i>=seats){ dir=-1; timer=setTimeout(tick, 900); }
      else if(i<=0){ dir=1; timer=setTimeout(tick, 500); }
      else timer=setTimeout(tick, 110);
    }
    timer = setTimeout(tick, 500);
    return ()=>clearTimeout(timer);
  },[]);

  return (
    <div style={{minHeight:"100vh",background:"#FCFAF6",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{position:"relative",width:200,height:200}}>
        {Array.from({length:seats}).map((_,i)=>{
          const angle=(i/seats)*Math.PI*2-Math.PI/2;
          const inView = i<seatsIn;
          const finalX = 50+Math.cos(angle)*42, finalY = 50+Math.sin(angle)*42;
          const startX = 50+Math.cos(angle)*140, startY = 50+Math.sin(angle)*140;
          return (
            <div key={i} style={{
              position:"absolute",
              left:(inView?finalX:startX)+"%", top:(inView?finalY:startY)+"%",
              transform:`translate(-50%,-50%) rotate(${angle+Math.PI/2}rad)`,
              width:14,height:20,borderRadius:"3px 3px 6px 6px",
              background:"linear-gradient(180deg,#F0E9D8,#D8CFB5)",
              border:"0.5px solid rgba(150,120,60,.45)",
              opacity:inView?1:0,
              transition:"left .5s cubic-bezier(.34,1.3,.64,1), top .5s cubic-bezier(.34,1.3,.64,1), opacity .3s"
            }}/>
          );
        })}
        <div style={{
          position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
          width:seatsIn>0?86:0,height:seatsIn>0?86:0,borderRadius:"50%",
          background:"radial-gradient(circle at 35% 30%, #FFFFFF, #F5EFE2)",
          border:"2px solid #80653C",
          boxShadow:"0 8px 20px -6px rgba(60,40,20,.25), inset 0 1px 3px rgba(255,255,255,.85)",
          transition:"width .5s cubic-bezier(.34,1.3,.64,1), height .5s cubic-bezier(.34,1.3,.64,1)"
        }}/>
      </div>
      <div style={{color:"#80653C",fontSize:13,fontFamily:"'Manrope',sans-serif",fontWeight:500}}>Yüklənir...</div>
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

  if(status==="loading") return(<ChairLoader/>);

  if(status==="error") return(
    <div style={{minHeight:"100vh",background:"#FCFAF6",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <div style={{color:"#A02A1E",fontSize:16,fontWeight:700,fontFamily:"'Manrope',sans-serif"}}>Link tapılmadı</div>
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

  const coupleParts = evName.includes(" & ") ? evName.split(" & ") : null;

  const greeting = guestName ? <>Əziz <b>{guestName}</b>, sizi {obData.boy&&obData.girl?"toyumuza":"məclisimizə"} dəvət edirik.</> : null;
  const kicker = (eventData?.ev_type||obData.evType||"").includes("Nişan")?"Nişan dəvətnaməsi":(obData.boy&&obData.girl?"Toy dəvətnaməsi":"Dəvətnamə");

  return(
    <InviteStage themeIndex={inviteShablon} title={evName}>
      <div className="qi-inv">
        <div className="qi-brand qi-reveal">QONAQ</div>

        <InviteHero themeIndex={inviteShablon} kicker={kicker} boy={coupleParts?coupleParts[0]:""} girl={coupleParts?coupleParts[1]:""}
          evName={evName} greeting={greeting} date={evDate} hall={fullHall} address={hallAddress} photoUrl={hall.planImageUrl||""}
          mapsQuery={(fullHall||hallName)+" Bakı"} issue={tableData?.id?("Masa № "+tableData.id):"Dəvət"}/>

        <InviteMedia media={inviteMedia}/>

        <InviteTable tableId={tableData?.id||rsvp?.table_id} seats={tableData?.seats} guests={guests} guestName={guestName}/>

        <section className="qi-card qi-reveal qi-d3">
          <h2 className="qi-h">Bizimlə olacaqsınız?</h2>
          {answered?(
            <div className="qi-done">{answer==="attending"?"Təsdiq edildi — sizi gözləyirik!":"Qeyd edildi. Təşkilatçıya bildiriş gedəcək."}</div>
          ):(
            <div className="qi-row">
              <button type="button" className="qi-yes" onClick={()=>respond("attending")}>✓ İştirak edəcəyəm</button>
              <button type="button" className="qi-no" onClick={()=>respond("not_attending")}>Gələ bilməyəcəyəm</button>
            </div>
          )}
        </section>

        <GiftSection rsvpCode={code}/>

        {cardNumber&&(
          <section className="qi-card qi-reveal qi-d5">
            <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:10}}>Kart nömrəsi</div>
            <div style={{background:"var(--soft)",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{fontSize:15,fontWeight:700,color:"var(--ink)",letterSpacing:2,fontFamily:"monospace",minWidth:0,overflowWrap:"anywhere"}}>{cardNumber}</div>
              <button type="button" onClick={copyCard} style={{padding:"8px 12px",borderRadius:10,border:"1px solid var(--line)",background:"transparent",color:"var(--accent)",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                {copied?"✓ Kopyalandı":"Kopyala"}
              </button>
            </div>
          </section>
        )}

        <div className="qi-foot qi-reveal qi-d5">QONAQ · Məclis koordinasiya sistemi</div>
      </div>

      {tebrikOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(20,16,12,.55)",display:"flex",alignItems:"flex-end"}} onClick={()=>setTebrikOpen(false)}>
          <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"var(--bg)",borderTop:"1px solid var(--line)",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"var(--line)",margin:"0 auto 16px"}}/>
            <div style={{fontSize:14,fontWeight:700,color:"var(--accent)",marginBottom:12}}>Təbrik göndər</div>
            <textarea value={tebrikText} onChange={e=>setTebrikText(e.target.value)} rows={4} className="qi-input" style={{resize:"none",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <button type="button" onClick={()=>setTebrikOpen(false)} className="qi-no" style={{flex:1}}>Sonra</button>
              <button type="button" onClick={()=>{
                if(navigator.share) navigator.share({text:tebrikText}).catch(()=>{});
                else window.open("https://wa.me/?text="+encodeURIComponent(tebrikText),"_blank");
                setTebrikOpen(false);
              }} className="qi-yes" style={{flex:2}}>Göndər</button>
            </div>
          </div>
        </div>
      )}
    </InviteStage>
  );
}
