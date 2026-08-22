import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dpvoluttxelwnqcfnsbh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368"
);

const NAV = [
  { id: "dashboard", label: "İcmal", icon: "📊" },
  { id: "users", label: "İstifadəçilər", icon: "👥" },
  { id: "events", label: "Məclislər", icon: "🎉" },
  { id: "guests", label: "Qonaq axtarışı", icon: "🔍" },
];

function StatCard({ label, value, icon, accent }){
  return (
    <div style={{flex:1,minWidth:150,padding:"20px 22px",borderRadius:18,
      background:"linear-gradient(155deg,rgba(255,255,255,.9),rgba(255,255,255,.65))",
      border:"1px solid rgba(255,255,255,.6)",boxShadow:"0 8px 24px -12px rgba(30,20,10,.15)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:11,color:"#6B6259",fontWeight:600,letterSpacing:.3}}>{label}</span>
        <span style={{fontSize:18,opacity:.7}}>{icon}</span>
      </div>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700,color:accent||"#211A16"}}>{value}</div>
    </div>
  );
}

function Th({ children }){
  return <th style={{textAlign:"left",padding:"10px 14px",fontSize:10.5,fontWeight:700,color:"#6B6259",letterSpacing:.4,textTransform:"uppercase",borderBottom:"1px solid rgba(150,120,80,.15)"}}>{children}</th>;
}
function Td({ children, style }){
  return <td style={{padding:"12px 14px",fontSize:13,color:"#211A16",borderBottom:"1px solid rgba(150,120,80,.08)",...style}}>{children}</td>;
}

export default function AdminPanel(){
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [data, setData] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s)=>setSession(s));
    return ()=>{ listener&&listener.subscription&&listener.subscription.unsubscribe(); };
  },[]);

  useEffect(()=>{
    if(!session) return;
    fetch("/api/admin-data", { headers: { Authorization: "Bearer " + session.access_token } })
      .then(r=>r.json())
      .then(j=>{
        if(j.ok) setData(j);
        else setLoadErr(j.error||"Naməlum xəta");
      })
      .catch(e=>setLoadErr(e.message));
  },[session]);

  async function doLogin(){
    if(!loginEmail.trim()||!loginPass.trim()){ setLoginErr("E-poçt və şifrə yazın"); return; }
    setLoginBusy(true); setLoginErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPass });
    if(error){ setLoginErr("Giriş uğursuz: " + error.message); setLoginBusy(false); return; }
    setSession(data.session);
    setLoginBusy(false);
  }

  const filteredUsers = useMemo(()=>{
    if(!data) return [];
    const q = search.trim().toLowerCase();
    if(!q) return data.users;
    return data.users.filter(u=>(u.email||"").toLowerCase().includes(q));
  },[data, search]);

  const filteredEvents = useMemo(()=>{
    if(!data) return [];
    const q = search.trim().toLowerCase();
    if(!q) return data.events;
    return data.events.filter(e=>(e.couple||"").toLowerCase().includes(q)||(e.hallName||"").toLowerCase().includes(q));
  },[data, search]);

  const filteredGuests = useMemo(()=>{
    if(!data) return [];
    const q = search.trim().toLowerCase();
    if(!q) return data.guests.slice(0,50);
    return data.guests.filter(g=>(g.name||"").toLowerCase().includes(q)||(g.phone||"").includes(q)).slice(0,100);
  },[data, search]);

  // ── Yüklənir ──
  if(!authChecked){
    return (
      <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#F5EFE0"}}>
        <div style={{width:32,height:32,border:"3px solid rgba(193,56,42,.2)",borderTopColor:"#C1382A",borderRadius:"50%",animation:"aload .8s linear infinite"}}/>
        <style>{"@keyframes aload{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  // ── Login ekranı ──
  if(!session){
    return (
      <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#1A1512,#2A211B)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:340}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:28,marginBottom:6}}>🔐</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#F5EEE0"}}>Admin Panel</div>
            <div style={{fontSize:12,color:"rgba(245,238,224,.5)",marginTop:4}}>GONAG.AZ idarəetmə paneli</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="Admin e-poçt"
              onKeyDown={e=>{if(e.key==="Enter")doLogin();}}
              style={{padding:"13px 15px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",color:"#F5EEE0",fontSize:14,outline:"none"}}/>
            <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="Şifrə"
              onKeyDown={e=>{if(e.key==="Enter")doLogin();}}
              style={{padding:"13px 15px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",color:"#F5EEE0",fontSize:14,outline:"none"}}/>
            {loginErr&&<div style={{fontSize:12,color:"#FF9B85",padding:"8px 12px",background:"rgba(193,56,42,.15)",borderRadius:10}}>{loginErr}</div>}
            <button onClick={doLogin} disabled={loginBusy}
              style={{padding:"14px",borderRadius:12,border:"none",cursor:"pointer",
                background:"linear-gradient(155deg,#D4AF5A,#B8923E)",color:"#1A1512",fontSize:14,fontWeight:800,opacity:loginBusy?.6:1,marginTop:4}}>
              {loginBusy?"Yoxlanılır...":"Daxil ol"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── İcazə yoxdursa ──
  if(loadErr){
    return (
      <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#F5EFE0",gap:12,padding:24,textAlign:"center"}}>
        <div style={{fontSize:32}}>⛔</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"#211A16"}}>Giriş rədd edildi</div>
        <div style={{fontSize:13,color:"#6B6259",maxWidth:320}}>{loadErr}</div>
        <button onClick={()=>{supabase.auth.signOut();window.location.reload();}}
          style={{marginTop:8,padding:"10px 20px",borderRadius:12,border:"1px solid rgba(193,56,42,.3)",background:"rgba(193,56,42,.1)",color:"#C1382A",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          Çıxış et
        </button>
      </div>
    );
  }

  if(!data){
    return (
      <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#F5EFE0"}}>
        <div style={{width:32,height:32,border:"3px solid rgba(193,56,42,.2)",borderTopColor:"#C1382A",borderRadius:"50%",animation:"aload .8s linear infinite"}}/>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,display:"flex",background:"#F7F1E4",fontFamily:"'Inter',sans-serif"}}>
      {/* Sidebar */}
      <div style={{width:220,flexShrink:0,background:"linear-gradient(180deg,#1A1512,#241C17)",display:"flex",flexDirection:"column",padding:"22px 14px"}}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:19,fontWeight:700,color:"#F5EEE0",padding:"0 10px",marginBottom:28}}>
          GONAG<span style={{color:"#D4AF5A"}}>.AZ</span>
          <div style={{fontSize:10,color:"rgba(245,238,224,.4)",fontWeight:400,marginTop:2}}>Admin Panel</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setTab(n.id);setSearch("");}}
              style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:12,border:"none",cursor:"pointer",textAlign:"left",
                background:tab===n.id?"rgba(212,175,90,.15)":"transparent",
                color:tab===n.id?"#D4AF5A":"rgba(245,238,224,.65)",fontSize:13,fontWeight:tab===n.id?700:500}}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div style={{padding:"0 10px 8px",fontSize:11,color:"rgba(245,238,224,.4)"}}>{session.user.email}</div>
        <button onClick={()=>supabase.auth.signOut()}
          style={{padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(245,238,224,.6)",fontSize:12,cursor:"pointer",textAlign:"left"}}>
          🚪 Çıxış
        </button>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflow:"auto",padding:"28px 32px"}}>
        {tab==="dashboard"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#211A16",marginBottom:20}}>İcmal</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:28}}>
              <StatCard label="ÜMUMİ İSTİFADƏÇİ" value={data.stats.totalUsers} icon="👥"/>
              <StatCard label="ÜMUMİ MƏCLİS" value={data.stats.totalEvents} icon="🎉"/>
              <StatCard label="BUGÜNKÜ QONAQ" value={data.stats.todayGuests} icon="✨" accent="#C1382A"/>
              <StatCard label="ÜMUMİ QONAQ" value={data.stats.totalGuests} icon="👤" accent="#4C9A6E"/>
            </div>
            <div style={{background:"rgba(255,255,255,.6)",borderRadius:18,padding:20,border:"1px solid rgba(255,255,255,.6)"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#211A16",marginBottom:14}}>Son yaradılan məclislər</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>Cütlük/Ad</Th><Th>Zal</Th><Th>Masa</Th><Th>Qonaq</Th><Th>Tarix</Th></tr></thead>
                <tbody>
                  {data.events.slice(0,8).map(e=>(
                    <tr key={e.id}>
                      <Td>{e.couple||"—"}</Td>
                      <Td>{e.hallName||"—"}</Td>
                      <Td>{e.tableCount}</Td>
                      <Td>{e.guestCount}</Td>
                      <Td style={{color:"#6B6259",fontSize:11}}>{(e.createdAt||"").slice(0,10)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab==="users"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#211A16",marginBottom:16}}>İstifadəçilər ({data.users.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 E-poçt üzrə axtar..."
              style={{width:"100%",maxWidth:360,padding:"11px 15px",borderRadius:12,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:13,outline:"none",marginBottom:16}}/>
            <div style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>E-poçt</Th><Th>Qeydiyyat</Th><Th>Son giriş</Th><Th>Məclis sayı</Th><Th>Ümumi qonaq</Th></tr></thead>
                <tbody>
                  {filteredUsers.map(u=>(
                    <tr key={u.id} onClick={()=>setExpandedUser(expandedUser===u.id?null:u.id)} style={{cursor:"pointer"}}>
                      <Td style={{fontWeight:600}}>{u.email}</Td>
                      <Td style={{color:"#6B6259",fontSize:11}}>{(u.created_at||"").slice(0,10)}</Td>
                      <Td style={{color:"#6B6259",fontSize:11}}>{u.last_sign_in_at?u.last_sign_in_at.slice(0,10):"—"}</Td>
                      <Td>{u.eventCount}</Td>
                      <Td style={{color:"#C1382A",fontWeight:700}}>{u.totalGuests}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {expandedUser&&(()=>{
              const evs = data.events.filter(e=>e.sessionId===expandedUser);
              const u = data.users.find(x=>x.id===expandedUser);
              return (
                <div style={{marginTop:16,padding:18,background:"rgba(212,175,90,.08)",borderRadius:16,border:"1px solid rgba(212,175,90,.25)"}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{u&&u.email} — məclisləri ({evs.length})</div>
                  {evs.map(e=>(
                    <div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(150,120,80,.1)",fontSize:12}}>
                      <span>{e.couple||e.type} — {e.hallName||"zal seçilməyib"}</span>
                      <span style={{color:"#6B6259"}}>{e.guestCount} qonaq · {e.tableCount} masa</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {tab==="events"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#211A16",marginBottom:16}}>Məclislər ({data.events.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cütlük adı və ya zal üzrə axtar..."
              style={{width:"100%",maxWidth:360,padding:"11px 15px",borderRadius:12,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:13,outline:"none",marginBottom:16}}/>
            <div style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>Cütlük/Ad</Th><Th>Növ</Th><Th>Zal</Th><Th>Masa</Th><Th>Qonaq</Th><Th>Status</Th><Th>Tarix</Th></tr></thead>
                <tbody>
                  {filteredEvents.map(e=>(
                    <tr key={e.id}>
                      <Td style={{fontWeight:600}}>{e.couple||"—"}</Td>
                      <Td>{e.type||"—"}</Td>
                      <Td>{e.hallName||"—"}</Td>
                      <Td>{e.tableCount}</Td>
                      <Td>{e.guestCount}</Td>
                      <Td><span style={{padding:"3px 9px",borderRadius:10,fontSize:10,fontWeight:700,
                        background:e.status==="done"?"rgba(76,154,110,.15)":"rgba(212,175,90,.15)",
                        color:e.status==="done"?"#4C9A6E":"#8A6B1E"}}>{e.status||"natamam"}</span></Td>
                      <Td style={{color:"#6B6259",fontSize:11}}>{(e.createdAt||"").slice(0,10)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab==="guests"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#211A16",marginBottom:16}}>Qonaq axtarışı</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Ad və ya telefon nömrəsi ilə axtarın..." autoFocus
              style={{width:"100%",maxWidth:420,padding:"13px 17px",borderRadius:14,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:14,outline:"none",marginBottom:16}}/>
            {!search&&<div style={{fontSize:12,color:"#6B6259",marginBottom:12}}>Son 50 qonaq göstərilir — axtarış üçün yazın</div>}
            <div style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>Ad</Th><Th>Telefon</Th><Th>Say</Th><Th>Masa</Th><Th>Məclis</Th><Th>Zal</Th></tr></thead>
                <tbody>
                  {filteredGuests.map((g,i)=>(
                    <tr key={i}>
                      <Td style={{fontWeight:600}}>{g.name}</Td>
                      <Td>{g.phone||"—"}</Td>
                      <Td>{g.count}</Td>
                      <Td>{g.tableId}</Td>
                      <Td>{g.couple||"—"}</Td>
                      <Td>{g.hallName||"—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
