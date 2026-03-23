import React, { useState, useEffect } from "react";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, options = {}) {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export default function InvitePage({ code }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // invite_links-den code ile tap
        const links = await sbFetch("invite_links?code=eq." + encodeURIComponent(code) + "&limit=1");
        if (!links || links.length === 0) {
          setError("Bu dəvətnamə linki tapılmadı.");
          setLoading(false);
          return;
        }
        const link = links[0];
        const tableIds = link.table_ids || [];

        // event_id varsa onunla tap, yoxsa session_id ile en son event-i tap
        let ev = null;
        if (link.event_id) {
          const evRows = await sbFetch("events?id=eq." + link.event_id + "&limit=1");
          if (evRows && evRows.length > 0) ev = evRows[0];
        }
        if (!ev) {
          // event_id yoxdur - session_id ile en son toy eventin tap
          const evRows = await sbFetch("events?session_id=eq.gonag_user_main&order=created_at.desc&limit=1");
          if (evRows && evRows.length > 0) ev = evRows[0];
        }
        if (!ev) {
          setError("Məclis məlumatları tapılmadı.");
          setLoading(false);
          return;
        }

        const tblData = ev.tables || {};
        const meta = tblData._meta || {};
        const allTables = Array.isArray(tblData) ? tblData : (tblData.rows || []);
        const myTables = tableIds.length > 0
          ? allTables.filter(t => tableIds.map(String).includes(String(t.id)))
          : allTables;

        setData({
          link, ev,
          evName: meta.obData?.boy && meta.obData?.girl
            ? meta.obData.boy + " & " + meta.obData.girl
            : (meta.obData?.name || meta.obData?.company || "Məclis"),
          evDate: meta.obData?.date || "",
          hallName: ev.hall_name || "",
          hallAddr: meta.hall?.address || "",
          hallMaps: meta.hall?.mapsUrl || "",
          tables: myTables,
          allTables,
          eventId: ev.id,
        });
        if (myTables.length === 1) setSelectedTable(myTables[0]);
      } catch (e) {
        setError("Xəta baş verdi: " + e.message);
      }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleSave() {
    if (!guestName.trim() || !selectedTable) return;
    const newGuest = {
      id: Date.now() + Math.random(),
      name: guestName.trim(),
      phone: guestPhone.trim() ? "+994" + guestPhone.trim() : "",
      count: 1,
      invited: false
    };
    const evRows = await sbFetch("events?id=eq." + data.eventId + "&limit=1");
    if (!evRows || evRows.length === 0) return;
    const ev = evRows[0];
    const tblData = ev.tables || {};
    const allTables = Array.isArray(tblData) ? tblData : (tblData.rows || []);
    const updatedTables = allTables.map(t =>
      String(t.id) === String(selectedTable.id)
        ? { ...t, guests: [...(t.guests || []), newGuest] }
        : t
    );
    const updatedTblData = Array.isArray(tblData)
      ? updatedTables
      : { ...tblData, rows: updatedTables };
    await sbFetch("events?id=eq." + data.eventId, {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ tables: updatedTblData, updated_at: new Date().toISOString() })
    });
    setSaved(true);
  }

  const gold = "#c9a84c";
  const bg = "#080604";

  if (loading) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"sans-serif",color:gold,fontSize:16}}>
      Yüklənir...
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"sans-serif",color:"#ff6666",
      fontSize:14,textAlign:"center",padding:24}}>
      ⚠️ {error}
    </div>
  );

  if (saved) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",
      color:"#f2e8d0",textAlign:"center",padding:24}}>
      <div style={{fontSize:60,marginBottom:16}}>🎉</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:22,color:gold,marginBottom:8}}>Təşəkkür edirik!</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.7}}>
        Adınız məclisə əlavə olundu.<br/>{data.evName} məclisində görüşərik!
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"sans-serif",color:"#f2e8d0",paddingBottom:40}}>
      <div style={{background:"rgba(201,168,76,.08)",borderBottom:"1px solid rgba(201,168,76,.15)",
        padding:"16px 20px",textAlign:"center"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:22,color:gold,letterSpacing:3,marginBottom:4}}>GONAG.AZ</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#f2e8d0",marginBottom:4}}>🎊 {data.evName}</div>
        {data.evDate && <div style={{fontSize:13,color:"rgba(201,168,76,.6)"}}>📅 {data.evDate}</div>}
        {data.hallName && <div style={{fontSize:13,color:"rgba(201,168,76,.6)",marginTop:2}}>📍 {data.hallName}</div>}
      </div>

      <div style={{padding:"20px 16px",maxWidth:480,margin:"0 auto"}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,color:"rgba(201,168,76,.6)",marginBottom:10,fontWeight:600}}>
            🪑 Sizin masa{data.tables.length > 1 ? "larınız" : "nız"}:
          </div>
          {data.tables.map(t => {
            const isSel = selectedTable && String(selectedTable.id) === String(t.id);
            const sc = t.side === "Oğlan evi" ? "#7aade8" : t.side === "Qız evi" ? "#e87aad" : gold;
            return (
              <div key={t.id} onClick={() => setSelectedTable(t)}
                style={{background:isSel?sc+"18":"rgba(255,255,255,.04)",
                  border:"1.5px solid "+(isSel?sc:"rgba(201,168,76,.2)"),
                  borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:sc+"22",
                    border:"2px solid "+sc,display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:18,fontWeight:800,color:sc}}>
                    {t.id}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#f2e8d0"}}>
                      Masa № {t.id}{t.label && t.label !== "__extra__" ? " — " + t.label : ""}
                    </div>
                    {t.side && <div style={{fontSize:11,color:sc,marginTop:2}}>{t.side}</div>}
                    <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>
                      {t.seats || 10} yer · {(t.guests || []).length} qonaq
                    </div>
                  </div>
                </div>
                {(t.guests || []).length > 0 && (
                  <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                    <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:6}}>👥 Masadakı qonaqlar:</div>
                    {t.guests.map((g, i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(201,168,76,.15)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:gold}}>
                          {g.name[0]}
                        </div>
                        <span style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{g.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedTable && (
          <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",
            borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:13,color:gold,fontWeight:700,marginBottom:12}}>
              ➕ Adınızı əlavə edin — Masa № {selectedTable.id}
            </div>
            <input value={guestName} onChange={e => setGuestName(e.target.value)}
              placeholder="Adınız Soyadınız"
              style={{display:"block",width:"100%",boxSizing:"border-box",
                padding:"11px 14px",marginBottom:10,background:"rgba(255,255,255,.06)",
                border:"1px solid rgba(201,168,76,.3)",borderRadius:10,
                color:"#f2e8d0",fontSize:14,outline:"none"}}/>
            <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,.06)",
              border:"1px solid rgba(201,168,76,.25)",borderRadius:10,marginBottom:14,overflow:"hidden"}}>
              <span style={{padding:"0 10px",fontSize:13,color:gold,fontWeight:600}}>+994</span>
              <input value={guestPhone} onChange={e => setGuestPhone(e.target.value.replace(/\D/g,""))}
                placeholder="XX XXX XX XX" type="tel"
                style={{flex:1,padding:"11px 8px",background:"transparent",border:"none",
                  color:"#f2e8d0",fontSize:13,outline:"none"}}/>
            </div>
            <button onClick={handleSave} disabled={!guestName.trim()}
              style={{width:"100%",padding:"13px",borderRadius:12,border:"none",
                background:guestName.trim()?"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))":"rgba(255,255,255,.05)",
                color:guestName.trim()?"#f2e8d0":"rgba(255,255,255,.2)",
                fontSize:14,fontWeight:700,cursor:guestName.trim()?"pointer":"default"}}>
              ✅ Qeydiyyatı tamamla
            </button>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:24,fontSize:10,color:"rgba(255,255,255,.15)"}}>
          GONAG.AZ — Məclis idarəetmə sistemi
        </div>
      </div>
    </div>
  );
}
