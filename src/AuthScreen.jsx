import { useEffect, useRef, useState } from "react";

export default function AuthScreen({ supabase, onAuthenticated }){
  const [phase, setPhase] = useState("animating"); // animating -> form
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [seatsIn, setSeatsIn] = useState(0);

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

  async function submit(){
    if(!email.trim()||!password.trim()){ setErr("E-poçt və şifrə yazın"); return; }
    if(password.length<6){ setErr("Şifrə ən azı 6 simvol olmalıdır"); return; }
    setBusy(true); setErr("");
    try{
      if(mode==="login"){
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if(error) throw error;
        onAuthenticated(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if(error) throw error;
        if(data.session){
          onAuthenticated(data.session);
        } else {
          setErr("Qeydiyyat oldu! E-poçtunuza təsdiq linki göndərildi — onu açıb sonra giriş edin.");
          setMode("login");
        }
      }
    }catch(e){
      const msg = e.message||"";
      if(msg.includes("Invalid login")) setErr("E-poçt və ya şifrə səhvdir");
      else if(msg.includes("already registered")||msg.includes("already exists")) setErr("Bu e-poçt artıq qeydiyyatdan keçib — Giriş edin");
      else setErr(msg||"Xəta baş verdi");
    }
    setBusy(false);
  }

  const seats = 8;

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
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#211A16"}}>GONAG.AZ</div>
            <div style={{fontSize:12,color:"#6B6259",marginTop:4}}>Toy və məclis idarəetmə sistemi</div>
          </div>

          <div style={{display:"flex",gap:6,marginBottom:18,background:"rgba(255,255,255,.4)",borderRadius:14,padding:4}}>
            <button onClick={()=>{setMode("login");setErr("");}}
              style={{flex:1,padding:"10px",borderRadius:11,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
                background:mode==="login"?"linear-gradient(155deg,#5EB889,#3d8259)":"transparent",
                color:mode==="login"?"#fff":"#6B6259"}}>Giriş</button>
            <button onClick={()=>{setMode("signup");setErr("");}}
              style={{flex:1,padding:"10px",borderRadius:11,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
                background:mode==="signup"?"linear-gradient(155deg,#5EB889,#3d8259)":"transparent",
                color:mode==="signup"?"#fff":"#6B6259"}}>Qeydiyyat</button>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-poçt"
              style={{padding:"13px 15px",borderRadius:13,border:"1px solid rgba(255,255,255,.6)",background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",fontSize:14,outline:"none",color:"#211A16"}}/>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Şifrə"
              onKeyDown={e=>{if(e.key==="Enter")submit();}}
              style={{padding:"13px 15px",borderRadius:13,border:"1px solid rgba(255,255,255,.6)",background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",fontSize:14,outline:"none",color:"#211A16"}}/>

            {err&&<div style={{fontSize:12,color:err.includes("Qeydiyyat oldu")?"#4C9A6E":"#C1382A",padding:"8px 12px",background:err.includes("Qeydiyyat oldu")?"rgba(76,154,110,.1)":"rgba(193,56,42,.08)",borderRadius:10}}>{err}</div>}

            <button onClick={submit} disabled={busy}
              style={{padding:"14px",borderRadius:14,border:"none",cursor:busy?"default":"pointer",
                background:"linear-gradient(155deg,#5EB889,#3d8259)",color:"#fff",fontSize:14,fontWeight:800,
                opacity:busy?0.6:1,marginTop:4}}>
              {busy?"Gözləyin...":mode==="login"?"Giriş et":"Qeydiyyatdan keç"}
            </button>

            <div style={{textAlign:"center",fontSize:10,color:"rgba(33,26,22,.4)",marginTop:8}}>
              Tezliklə: Google və Apple ilə giriş
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
