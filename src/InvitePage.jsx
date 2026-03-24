import React, { useState, useEffect } from "react";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, opts) {
  opts = opts || {};
  const res = await fetch(SB_URL + "/rest/v1/" + path, Object.assign({}, opts, {
    headers: Object.assign({"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"}, opts.headers||{})
  }));
  if (!res.ok) return null;
  try { return await res.json(); } catch(e) { return null; }
}

export default function InvitePage({ code }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(function() {
    async function load() {
      try {
        var links = await sbFetch("invite_links?code=eq."+encodeURIComponent(code)+"&limit=1");
        if (!links || links.length === 0) { setError("Bu dəvətnamə linki tapılmadı."); setLoading(false); return; }
        var link = links[0];
        var tableIds = link.table_ids || [];

        // 1. event_id ile tap
        var ev = null;
        if (link.event_id) {
          var r1 = await sbFetch("events?id=eq."+encodeURIComponent(link.event_id)+"&limit=1");
          if (r1 && r1.length > 0) ev = r1[0];
        }
        // 2. session_id ile tap
        if (!ev) {
          var sid = link.session_id || "gonag_user_main";
          var r2 = await sbFetch("events?session_id=eq."+encodeURIComponent(sid)+"&order=updated_at.desc&limit=1");
          if (r2 && r2.length > 0) ev = r2[0];
        }
        // 3. son event-i tap
        if (!ev) {
          var r3 = await sbFetch("events?order=created_at.desc&limit=1");
          if (r3 && r3.length > 0) ev = r3[0];
        }
        if (!ev) { setError("Məclis tapılmadı."); setLoading(false); return; }

        var tblData = ev.tables || {};
        var meta = tblData._meta || {};
        var allTables = Array.isArray(tblData) ? tblData : (tblData.rows || []);
        var myTables = tableIds.length > 0
          ? allTables.filter(function(t){ return tableIds.map(String).indexOf(String(t.id)) >= 0; })
          : allTables;

        setData({
          link: link, ev: ev,
          evName: (meta.obData&&meta.obData.boy&&meta.obData.girl) ? meta.obData.boy+" & "+meta.obData.girl : (meta.obData&&(meta.obData.name||meta.obData.company)) || "Məclis",
          evDate: (meta.obData&&meta.obData.date) || "",
          hallName: ev.hall_name || "",
          tables: myTables,
          allTables: allTables,
          eventId: ev.id
        });
        if (myTables.length === 1) setSelectedTable(myTables[0]);
      } catch(e) { setError("Xəta: "+e.message); }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleSave() {
    if (!guestName.trim() || !selectedTable) return;
    var newGuest = { id: Date.now()+Math.random(), name: guestName.trim(), phone: guestPhone.trim()?"+994"+guestPhone.trim():"", count:1, invited:false };
    var evRows = await sbFetch("events?id=eq."+data.eventId+"&limit=1");
    if (!evRows||!evRows.length) return;
    var ev = evRows[0];
    var tblData = ev.tables||{};
    var allTbls = Array.isArray(tblData)?tblData:(tblData.rows||[]);
    var updated = allTbls.map(function(t){ return String(t.id)===String(selectedTable.id)?Object.assign({},t,{guests:(t.guests||[]).concat([newGuest])}):t; });
    var newTblData = Array.isArray(tblData)?updated:Object.assign({},tblData,{rows:updated});
    await sbFetch("events?id=eq."+data.eventId, {method:"PATCH", headers:{"Prefer":"return=representation"}, body:JSON.stringify({tables:newTblData,updated_at:new Date().toISOString()})});
    setSaved(true);
  }

  var gold="#c9a84c", bg="#080604";
  if (loading) return React.createElement("div",{style:{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:gold,fontSize:16}},"Yüklənir...");
  if (error) return React.createElement("div",{style:{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#ff6666",fontSize:14,textAlign:"center",padding:24}},"\u26A0\uFE0F "+error);
  if (saved) return React.createElement("div",{style:{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#f2e8d0",textAlign:"center",padding:24}},
    React.createElement("div",{style:{fontSize:60,marginBottom:16}},"\uD83C\uDF89"),
    React.createElement("div",{style:{fontFamily:"Georgia,serif",fontSize:22,color:gold,marginBottom:8}},"Təşəkkür edirik!"),
    React.createElement("div",{style:{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.7}},data.evName+" məclisində görüşərik!")
  );

  return React.createElement("div",{style:{minHeight:"100vh",background:bg,color:"#f2e8d0",paddingBottom:40}},
    React.createElement("div",{style:{background:"rgba(201,168,76,.08)",borderBottom:"1px solid rgba(201,168,76,.15)",padding:"16px 20px",textAlign:"center"}},
      React.createElement("div",{style:{fontFamily:"Georgia,serif",fontSize:22,color:gold,letterSpacing:3,marginBottom:4}},"GONAG.AZ"),
      React.createElement("div",{style:{fontFamily:"Georgia,serif",fontSize:18,color:"#f2e8d0",marginBottom:4}},"\uD83C\uDF8A "+data.evName),
      data.evDate&&React.createElement("div",{style:{fontSize:13,color:"rgba(201,168,76,.6)"}},"\uD83D\uDCC5 "+data.evDate),
      data.hallName&&React.createElement("div",{style:{fontSize:13,color:"rgba(201,168,76,.6)",marginTop:2}},"\uD83D\uDCCD "+data.hallName)
    ),
    React.createElement("div",{style:{padding:"20px 16px",maxWidth:480,margin:"0 auto"}},
      React.createElement("div",{style:{marginBottom:20}},
        React.createElement("div",{style:{fontSize:13,color:"rgba(201,168,76,.6)",marginBottom:10,fontWeight:600}},"\uD83E\uDE91 Sizin masa"+(data.tables.length>1?"larınız":"nız")+":"),
        data.tables.map(function(t){
          var isSel=selectedTable&&String(selectedTable.id)===String(t.id);
          var sc=t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":gold;
          return React.createElement("div",{key:t.id,onClick:function(){setSelectedTable(t);},style:{background:isSel?sc+"18":"rgba(255,255,255,.04)",border:"1.5px solid "+(isSel?sc:"rgba(201,168,76,.2)"),borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer"}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
              React.createElement("div",{style:{width:44,height:44,borderRadius:12,background:sc+"22",border:"2px solid "+sc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:sc}},t.id),
              React.createElement("div",null,
                React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#f2e8d0"}},"Masa № "+t.id+(t.label&&t.label!=="__extra__"?" — "+t.label:"")),
                t.side&&React.createElement("div",{style:{fontSize:11,color:sc,marginTop:2}},t.side),
                React.createElement("div",{style:{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}},(t.seats||10)+" yer · "+(t.guests||[]).length+" qonaq")
              )
            ),
            (t.guests||[]).length>0&&React.createElement("div",{style:{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"}},
              React.createElement("div",{style:{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:6}},"\uD83D\uDC65 Masadakı qonaqlar:"),
              (t.guests||[]).map(function(g,i){return React.createElement("div",{key:i,style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
                React.createElement("div",{style:{width:24,height:24,borderRadius:"50%",background:"rgba(201,168,76,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:gold}},g.name[0]),
                React.createElement("span",{style:{fontSize:12,color:"rgba(255,255,255,.7)"}},g.name)
              );})
            )
          );
        })
      ),
      selectedTable&&React.createElement("div",{style:{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:14,padding:"16px"}},
        React.createElement("div",{style:{fontSize:13,color:gold,fontWeight:700,marginBottom:12}},"\u2795 Adınızı əlavə edin — Masa № "+selectedTable.id),
        React.createElement("input",{value:guestName,onChange:function(e){setGuestName(e.target.value);},placeholder:"Adınız Soyadınız",style:{display:"block",width:"100%",boxSizing:"border-box",padding:"11px 14px",marginBottom:10,background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.3)",borderRadius:10,color:"#f2e8d0",fontSize:14,outline:"none"}}),
        React.createElement("div",{style:{display:"flex",alignItems:"center",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.25)",borderRadius:10,marginBottom:14,overflow:"hidden"}},
          React.createElement("span",{style:{padding:"0 10px",fontSize:13,color:gold,fontWeight:600}},"+994"),
          React.createElement("input",{value:guestPhone,onChange:function(e){setGuestPhone(e.target.value.replace(/\D/g,""));},placeholder:"XX XXX XX XX",type:"tel",style:{flex:1,padding:"11px 8px",background:"transparent",border:"none",color:"#f2e8d0",fontSize:13,outline:"none"}})
        ),
        React.createElement("button",{onClick:handleSave,disabled:!guestName.trim(),style:{width:"100%",padding:"13px",borderRadius:12,border:"none",background:guestName.trim()?"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))":"rgba(255,255,255,.05)",color:guestName.trim()?"#f2e8d0":"rgba(255,255,255,.2)",fontSize:14,fontWeight:700,cursor:guestName.trim()?"pointer":"default"}},"\u2705 Qeydiyyatı tamamla")
      )
    )
  );
}
