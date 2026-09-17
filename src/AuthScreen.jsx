import { useEffect, useState } from "react";

export default function AuthScreen({ supabase, onAuthenticated }){
  const [phase, setPhase] = useState("animating"); // animating -> form
  const [step, setStep] = useState("phone"); // phone -> otp
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [seatsIn, setSeatsIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  useEffect(()=>{
    const seatCount = 8;
    let i = 0;
    const iv = setInterval(()=>{
      i++;
      setSeatsIn(i);
      if(i>=seatCount){
        clearInterval(iv);
        setTimeout(()=>setPhase("form"), 450);
      }
    }, 110);
    return ()=>clearInterval(iv);
  },[]);

  useEffect(()=>{
    if(resendIn<=0) return;
    const t = setTimeout(()=>setResendIn(r=>r-1), 1000);
    return ()=>clearTimeout(t);
  },[resendIn]);

  function fullPhone(){
    const digits = phone.replace(/\D/g,"");
    return "+994"+digits;
  }

  async function signInWithGoogle(){
    setBusy(true); setErr("");
    try{
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if(error) throw error;
      // Uğurlu olduqda brauzer Google-a yönləndirilir, geri qayıdanda
      // App.jsx-dəki onAuthStateChange dinləyicisi sessiyanı özü tutacaq.
    }catch(e){
      setErr(e.message||"Google ilə giriş alınmadı");
      setBusy(false);
    }
  }

  async function sendCode(){
    if(!name.trim()){ setErr("Adınızı yazın"); return; }
    const digits = phone.replace(/\D/g,"");
    if(digits.length<9){ setErr("Düzgün nömrə yazın (məs: 50 123 45 67)"); return; }
    setBusy(true); setErr("");
    try{
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone(),
        options: { data: { full_name: name.trim() } }
      });
      if(error) throw error;
      setStep("otp");
      setResendIn(45);
    }catch(e){
      setErr(e.message||"Kod göndərilmədi");
    }
    setBusy(false);
  }

  async function verifyCode(){
    if(code.replace(/\D/g,"").length<6){ setErr("6 rəqəmli kodu tam yazın"); return; }
    setBusy(true); setErr("");
    try{
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhone(), token: code.trim(), type: "sms" });
      if(error) throw error;
      // Mövcud istifadəçidə ad boşdursa (əvvəllər OTP-siz yaranıbsa), indi əlavə edək.
      if(name.trim() && !(data.user&&data.user.user_metadata&&data.user.user_metadata.full_name)){
        await supabase.auth.updateUser({ data: { full_name: name.trim() } }).catch(()=>{});
      }
      onAuthenticated(data.session);
    }catch(e){
      const msg = e.message||"";
      if(msg.toLowerCase().includes("expired")) setErr("Kodun vaxtı bitib — yenidən göndərin");
      else if(msg.toLowerCase().includes("invalid")) setErr("Kod səhvdir");
      else setErr(msg||"Xəta baş verdi");
    }
    setBusy(false);
  }

  const seats = 8;
  const inp = {padding:"13px 15px",borderRadius:13,border:"1px solid rgba(255,255,255,.6)",background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",fontSize:14,outline:"none",color:"#211A16"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,
      background:"radial-gradient(ellipse at 50% 0%, #FFFDF7, #F5EFE0 60%, #EEE4CC)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>

      {phase==="animating"&&(
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
                background:"linear-gradient(180deg,#EDE6D5,#D8CFB5)",
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
            border:"2px solid #C9A25E",
            boxShadow:"0 8px 20px -6px rgba(60,40,20,.35), inset 0 1px 3px rgba(255,255,255,.85)",
            transition:"width .5s cubic-bezier(.34,1.3,.64,1), height .5s cubic-bezier(.34,1.3,.64,1)"
          }}/>
        </div>
      )}

      {phase==="form"&&(
        <div style={{width:"100%",maxWidth:340,animation:"authFadeIn .4s ease"}}>
          <style>{"@keyframes authFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}"}</style>
          <div style={{textAlign:"center",marginBottom:26}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#211A16"}}>QONAQ</div>
            <div style={{fontSize:12,color:"#6B6259",marginTop:4}}>Toy və məclis idarəetmə sistemi</div>
          </div>

          {step==="phone"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={signInWithGoogle} disabled={busy}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"13px",
                  borderRadius:13,border:"1px solid rgba(255,255,255,.7)",background:"#FFFFFF",cursor:busy?"default":"pointer",
                  fontSize:14,fontWeight:600,color:"#211A16",opacity:busy?0.6:1}}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.3 7.3 24 12 24Z"/><path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10.1 0 12s.5 3.8 1.4 5.5l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.3 0 3.3 2.7 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"/></svg>
                Google ilə davam et
              </button>

              <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0"}}>
                <div style={{flex:1,height:1,background:"rgba(33,26,22,.12)"}}/>
                <span style={{fontSize:11,color:"rgba(33,26,22,.4)"}}>və ya</span>
                <div style={{flex:1,height:1,background:"rgba(33,26,22,.12)"}}/>
              </div>

              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Adınız və soyadınız"
                style={inp}/>

              <div style={{display:"flex",alignItems:"center",borderRadius:13,border:"1px solid rgba(255,255,255,.6)",background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",overflow:"hidden"}}>
                <span style={{padding:"0 12px",fontSize:14,color:"#6B6259",flexShrink:0}}>+994</span>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/[^\d\s]/g,""))}
                  placeholder="50 123 45 67" onKeyDown={e=>{if(e.key==="Enter")sendCode();}}
                  style={{flex:1,padding:"13px 15px 13px 0",border:"none",background:"transparent",fontSize:14,outline:"none",color:"#211A16"}}/>
              </div>

              {err&&<div style={{fontSize:12,color:"#C1382A",padding:"8px 12px",background:"rgba(193,56,42,.08)",borderRadius:10}}>{err}</div>}

              <button onClick={sendCode} disabled={busy}
                style={{padding:"14px",borderRadius:14,border:"none",cursor:busy?"default":"pointer",
                  background:"linear-gradient(155deg,#5EB889,#3d8259)",color:"#fff",fontSize:14,fontWeight:800,
                  opacity:busy?0.6:1,marginTop:4}}>
                {busy?"Göndərilir...":"Kod göndər"}
              </button>

              <div style={{textAlign:"center",fontSize:10,color:"rgba(33,26,22,.4)",marginTop:6}}>
                Nömrənizə SMS ilə 6 rəqəmli təsdiq kodu gələcək
              </div>
            </div>
          )}

          {step==="otp"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:13,color:"#6B6259",textAlign:"center",marginBottom:4}}>
                <b style={{color:"#211A16"}}>+994 {phone}</b> nömrəsinə göndərilən kodu daxil edin
              </div>
              <input type="tel" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="• • • • • •" onKeyDown={e=>{if(e.key==="Enter")verifyCode();}}
                style={{...inp,textAlign:"center",fontSize:22,letterSpacing:8,fontWeight:700}}/>

              {err&&<div style={{fontSize:12,color:"#C1382A",padding:"8px 12px",background:"rgba(193,56,42,.08)",borderRadius:10}}>{err}</div>}

              <button onClick={verifyCode} disabled={busy}
                style={{padding:"14px",borderRadius:14,border:"none",cursor:busy?"default":"pointer",
                  background:"linear-gradient(155deg,#5EB889,#3d8259)",color:"#fff",fontSize:14,fontWeight:800,
                  opacity:busy?0.6:1,marginTop:4}}>
                {busy?"Yoxlanılır...":"Təsdiqlə və daxil ol"}
              </button>

              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <button onClick={()=>{setStep("phone");setCode("");setErr("");}}
                  style={{background:"none",border:"none",color:"#6B6259",fontSize:12,cursor:"pointer",padding:0}}>
                  ← Nömrəni dəyiş
                </button>
                <button onClick={sendCode} disabled={resendIn>0||busy}
                  style={{background:"none",border:"none",color:resendIn>0?"rgba(33,26,22,.3)":"#3d8259",fontSize:12,cursor:resendIn>0?"default":"pointer",padding:0,fontWeight:700}}>
                  {resendIn>0?`Yenidən göndər (${resendIn}s)`:"Kodu yenidən göndər"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
