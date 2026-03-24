import React, { useState, useEffect } from "react";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sb(path, opts) {
  var o = Object.assign({method:"GET"}, opts||{});
  o.headers = Object.assign({"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"}, o.headers||{});
  var r = await fetch(SB_URL+"/rest/v1/"+path, o);
  if(!r.ok) return null;
  try{ return await r.json(); }catch(e){ return null; }
}

export default function InvitePage({code}) {
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [data, setData] = useState(null);
  var [saved, setSaved] = useState(false);
  var [name, setName] = useState("");
  var [phone, setPhone] = useState("");
  var [tbl, setTbl] = useState(null);

  useEffect(function(){
    async function load(){
      var links = await sb("invite_links?code=eq."+encodeURIComponent(code)+"&limit=1");
      if(!links||!links.length){ setError("Link tapılmadı"); setLoading(false); return; }
      var link = links[0];
      var tids = (link.table_ids||[]).map(String);
      var evs = await sb("events?order=updated_at.desc&limit=1");
      if(!evs||!evs.length){ setError("Məclis tapılmadı"); setLoading(false); return; }
      var ev = evs[0];
      var td = ev.tables||{};
      var meta = (td._meta)||{};
      var allT = Array.isArray(td)?td:(td.rows||[]);
      var myT = tids.length>0 ? allT.filter(function(t){ return tids.indexOf(String(t.id))>=0; }) : allT;
      var d = {
        evName: (meta.obData&&meta.obData.boy&&meta.obData.girl)
          ? meta.obData.boy+" & "+meta.obData.girl
          : ((meta.obData&&(meta.obData.name||meta.obData.company))||"Məclis"),
        evDate: (meta.obData&&meta.obData.date)||"",
        hallName: ev.hall_name||"",
        tables: myT,
        eventId: ev.id
      };
      setData(d);
      if(myT.length===1) setTbl(myT[0]);
      setLoading(false);
    }
    load();
  }, [code]);

  async function save(){
    if(!name.trim()||!tbl||!data) return;
    var g = {id:Date.now(),name:name.trim(),phone:phone?"+994"+phone:"",count:1,invited:false};
    var evs = await sb("events?id=eq."+data.eventId+"&limit=1");
    if(!evs||!evs.length) return;
    var ev = evs[0];
    var td = ev.tables||{};
    var allT = Array.isArray(td)?td:(td.rows||[]);
    var upd = allT.map(function(t){
      if(String(t.id)===String(tbl.id)) return Object.assign({},t,{guests:(t.guests||[]).concat([g])});
      return t;
    });
    var newTd = Array.isArray(td)?upd:Object.assign({},td,{rows:upd});
    await sb("events?id=eq."+data.eventId, {
      method:"PATCH",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify({tables:newTd,updated_at:new Date().toISOString()})
    });
    setSaved(true);
  }

  var gold="#c9a84c";
  var bg="#080604";

  if(loading) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:gold,fontSize:16}}>Yüklənir...</div>
  );

  if(error) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#ff6666",fontSize:14,padding:24,textAlign:"center"}}>⚠️ {error}</div>
  );

  if(saved) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#f2e8d0",textAlign:"center",padding:24}}>
      <div style={{fontSize:60,marginBottom:16}}>🎉</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:22,color:gold,marginBottom:8}}>Təşəkkür edirik!</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,.6)"}}>{data.evName} məclisində görüşərik!</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,color:"#f2e8d0",paddingBottom:40}}>
      <div style={{background:"rgba(201,168,76,.08)",borderBottom:"1px solid rgba(201,168,76,.15)",padding:"16px 20px",textAlign:"center"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:22,color:gold,letterSpacing:3,marginBottom:4}}>GONAG.AZ</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:18,marginBottom:4}}>🎊 {data.evName}</div>
        {data.evDate?<div style={{fontSize:13,color:"rgba(201,168,76,.6)"}}>📅 {data.evDate}</div>:null}
        {data.hallName?<div style={{fontSize:13,color:"rgba(201,168,76,.6)",marginTop:2}}>📍 {data.hallName}</div>:null}
      </div>
      <div style={{padding:"20px 16px",maxWidth:480,margin:"0 auto"}}>
        <div style={{fontSize:13,color:"rgba(201,168,76,.6)",marginBottom:10,fontWeight:600}}>🪑 Masanız:</div>
        {data.tables.map(function(t){
          var sel = tbl&&String(tbl.id)===String(t.id);
          var sc = t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":gold;
          return (
            <div key={t.id} onClick={function(){setTbl(t);}}
              style={{background:sel?sc+"18":"rgba(255,255,255,.04)",border:"1.5px solid "+(sel?sc:"rgba(201,168,76,.2)"),borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:sc+"22",border:"2px solid "+sc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:sc}}>{t.id}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>Masa № {t.id}{t.label&&t.label!=="__extra__"?" — "+t.label:""}</div>
                  {t.side?<div style={{fontSize:11,color:sc,marginTop:2}}>{t.side}</div>:null}
                  <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>{(t.seats||10)} yer · {(t.guests||[]).length} qonaq</div>
                </div>
              </div>
              {(t.guests||[]).length>0?(
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:6}}>👥 Qonaqlar:</div>
                  {(t.guests||[]).map(function(g,i){
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(201,168,76,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:gold}}>{g.name[0]}</div>
                        <span style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{g.name}</span>
                      </div>
                    );
                  })}
                </div>
              ):null}
            </div>
          );
        })}
        {tbl?(
          <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:14,padding:"16px",marginTop:8}}>
            <div style={{fontSize:13,color:gold,fontWeight:700,marginBottom:12}}>➕ Adınızı əlavə edin</div>
            <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Adınız Soyadınız"
              style={{display:"block",width:"100%",boxSizing:"border-box",padding:"11px 14px",marginBottom:10,background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.3)",borderRadius:10,color:"#f2e8d0",fontSize:14,outline:"none"}}/>
            <button onClick={save} disabled={!name.trim()}
              style={{width:"100%",padding:"13px",borderRadius:12,border:"none",
                background:name.trim()?"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))":"rgba(255,255,255,.05)",
                color:name.trim()?"#f2e8d0":"rgba(255,255,255,.2)",fontSize:14,fontWeight:700,cursor:name.trim()?"pointer":"default"}}>
              ✅ Qeydiyyatı tamamla
            </button>
          </div>
        ):null}
      </div>
    </div>
  );
}
