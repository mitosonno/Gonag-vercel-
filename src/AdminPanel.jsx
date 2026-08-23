import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

const supabase = createClient(SB_URL, SB_KEY);

// Admin panelin öz sessiyası ilə işləyən sbFetch — Zal Builder buradan istifadə edir
let _adminAccessToken = null;
async function sbFetch(path, options={}){
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + (_adminAccessToken || SB_KEY),
      "Content-Type": "application/json",
      "Prefer": options.prefer||"",
      ...(options.headers||{})
    }
  });
  if(!res.ok){ const e=await res.text(); console.error("SB error:",e); return null; }
  try{ return await res.json(); }catch{return null;}
}

const NAV = [
  { id: "dashboard", label: "İcmal", icon: "📊" },
  { id: "users", label: "İstifadəçilər", icon: "👥" },
  { id: "events", label: "Məclislər", icon: "🎉" },
  { id: "guests", label: "Qonaqlar", icon: "🔍" },
  { id: "halls", label: "Zal Builder", icon: "🛠" },
];

function useIsMobile(){
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(()=>{
    function onResize(){ setW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return ()=>window.removeEventListener("resize", onResize);
  },[]);
  return w <= 860;
}

function StatCard({ label, value, icon, accent, mobile }){
  return (
    <div style={{padding: mobile?"14px 14px":"20px 22px",borderRadius: mobile?14:18,
      background:"linear-gradient(155deg,rgba(255,255,255,.95),rgba(255,255,255,.75))",
      border:"1px solid rgba(255,255,255,.6)",boxShadow:"0 6px 18px -10px rgba(30,20,10,.18)",
      minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:mobile?6:10}}>
        <span style={{fontSize:mobile?9.5:11,color:"#6B6259",fontWeight:700,letterSpacing:.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
        <span style={{fontSize:mobile?14:18,opacity:.7,flexShrink:0,marginLeft:4}}>{icon}</span>
      </div>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:mobile?24:32,fontWeight:700,color:accent||"#211A16"}}>{value}</div>
    </div>
  );
}

// Cədvəl sətri — mobil kart, desktop cədvəl sətri kimi işləyə bilən universal komponent
function DataRow({ fields, mobile, onClick, accentField }){
  if(mobile){
    return (
      <div onClick={onClick} style={{padding:"13px 15px",borderRadius:14,background:"rgba(255,255,255,.55)",
        border:"1px solid rgba(255,255,255,.5)",marginBottom:8,cursor:onClick?"pointer":"default"}}>
        {fields.map((f,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:i>0?"6px 0 0":"0",borderTop:i>0?"1px solid rgba(150,120,80,.08)":"none",marginTop:i>0?6:0}}>
            <span style={{fontSize:10,color:"#6B6259",fontWeight:600}}>{f.label}</span>
            <span style={{fontSize:13,color:f.accent?"#C1382A":"#211A16",fontWeight:f.bold?700:500,textAlign:"right"}}>{f.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null; // desktop halında ayrıca <tr> yazılır (aşağıda)
}

function Th({ children }){
  return <th style={{textAlign:"left",padding:"10px 14px",fontSize:10.5,fontWeight:700,color:"#6B6259",letterSpacing:.4,textTransform:"uppercase",borderBottom:"1px solid rgba(150,120,80,.15)",whiteSpace:"nowrap"}}>{children}</th>;
}
function Td({ children, style }){
  return <td style={{padding:"12px 14px",fontSize:13,color:"#211A16",borderBottom:"1px solid rgba(150,120,80,.08)",whiteSpace:"nowrap",...style}}>{children}</td>;
}

function HallBuilderPanel({ onClose, onSaved, currentUserId, isAdmin, editHall }){
  const [venueName, setVenueName] = useState(editHall?editHall.venue_name||"":"");
  const [hallName, setHallName] = useState(editHall?editHall.name||"":"");
  const [capacity, setCapacity] = useState(editHall?String(editHall.capacity||150):"150");
  const [photoUrl, setPhotoUrl] = useState(editHall?editHall.photo_url||null:null);
  const [mode, setMode] = useState("wall");
  const [wallPoints, setWallPoints] = useState(editHall?(editHall.wall_path||[]):[]); // [{id,x,y}]
  const [wallEdges, setWallEdges] = useState(editHall?(editHall.wall_edges||[]):[]); // [{id,from,to}]
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [zones, setZones] = useState(editHall?((editHall.elements||[]).map((z,i)=>({id:Date.now()+i,x:z.xPct,y:z.yPct,w:z.w,h:z.h,label:z.label,type:z.type}))):[]);
  const [tables, setTables] = useState(editHall?((editHall.layout||[]).map(t=>({id:t.id,x:t.xPct,y:t.yPct,seats:t.seats,label:t.label||""}))):[]);
  const [columns, setColumns] = useState(editHall?((editHall.columns||[]).map(c=>({id:c.id,x:c.xPct,y:c.yPct}))):[]);
  const [tableEditId, setTableEditId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(editHall?editHall.video_url||"":"");
  const [mapsUrl, setMapsUrl] = useState(editHall?editHall.maps_url||"":"");
  const [contactPhone, setContactPhone] = useState(editHall?editHall.contact_phone||"":"");
  const [makePublic, setMakePublic] = useState(editHall?!!editHall.is_public:false);
  const [snapOn, setSnapOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneLabelInput, setZoneLabelInput] = useState(null);
  const [existingVenues, setExistingVenues] = useState([]); // [{name, halls:[names]}]
  const [showExistingVenues, setShowExistingVenues] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(!!editHall);
  useEffect(function(){
    sbFetch("halls?select=name,venue_name&order=venue_name").then(rows=>{
      if(!rows) return;
      const byV = {};
      rows.forEach(h=>{
        if(!h.venue_name) return;
        if(!byV[h.venue_name]) byV[h.venue_name]=[];
        byV[h.venue_name].push(h.name);
      });
      setExistingVenues(Object.entries(byV).map(([name,halls])=>({name,halls})));
    });
  },[]);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  function handlePhotoUpload(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleVideoUpload(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(file.size > 10*1024*1024){
      alert("⚠️ Video çox böyükdür (maks. 10MB). Zəhmət olmasa daha kiçik/qısa video seçin, ya da telefon quraşdırmalarından sıxışdırın.");
      e.target.value="";
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setVideoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function ptFromEvent(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0,Math.min(100, Math.round(((cx-rect.left)/rect.width)*1000)/10));
    const y = Math.max(0,Math.min(100, Math.round(((cy-rect.top)/rect.height)*1000)/10));
    return {x,y};
  }

  function canvasClick(e){
    if(movedRef.current){ movedRef.current=false; return; }
    if(!canvasRef.current) return;
    const raw = ptFromEvent(e);
    if(mode==="wall"){
      // Boş yerə klik — sərbəst, birləşməmiş nöqtə əlavə edir
      const id = wallPoints.length? Math.max(...wallPoints.map(p=>p.id))+1 : 1;
      setWallPoints(p=>[...p,{id,x:raw.x,y:raw.y}]);
    }
    else if(mode==="zone"){ setZoneLabelInput(raw); }
    else if(mode==="table"){
      const id = tables.length? Math.max(...tables.map(t=>t.id))+1 : 1;
      setTables(t=>[...t,{id,x:raw.x,y:raw.y,seats:8,label:""}]);
      setTableEditId(id);
    }
    else if(mode==="column"){
      const id = columns.length? Math.max(...columns.map(c=>c.id))+1 : 1;
      setColumns(c=>[...c,{id,x:raw.x,y:raw.y}]);
    }
  }

  // Nöqtəyə toxunulanda — ilk toxunma seçir, ikinci toxunma xətt çəkib birləşdirir
  function pointTap(id){
    if(mode!=="wall") return;
    if(selectedPoint===null){ setSelectedPoint(id); return; }
    if(selectedPoint===id){ setSelectedPoint(null); return; }
    const exists = wallEdges.some(ed=>(ed.from===selectedPoint&&ed.to===id)||(ed.from===id&&ed.to===selectedPoint));
    if(!exists){
      const a = wallPoints.find(p=>p.id===selectedPoint), b = wallPoints.find(p=>p.id===id);
      let x2=b.x, y2=b.y;
      if(a && snapOn){
        const dx=b.x-a.x, dy=b.y-a.y, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>=1.5){
          let angle=Math.atan2(dy,dx); const step=Math.PI/12;
          angle=Math.round(angle/step)*step;
          x2=Math.max(0,Math.min(100,a.x+dist*Math.cos(angle)));
          y2=Math.max(0,Math.min(100,a.y+dist*Math.sin(angle)));
          setWallPoints(p=>p.map(pt=>pt.id===id?{...pt,x:x2,y:y2}:pt));
        }
      }
      setWallEdges(edges=>[...edges,{id:Date.now(),from:selectedPoint,to:id}]);
    }
    setSelectedPoint(null);
  }

  function addZone(label, type){
    if(!zoneLabelInput) return;
    setZones(z=>[...z,{id:Date.now(),x:zoneLabelInput.x,y:zoneLabelInput.y,w:22,h:9,label,type}]);
    setZoneLabelInput(null);
  }

  function dragStart(kind,id,e){
    e.stopPropagation();
    dragRef.current = {kind,id};
  }
  function dragMove(e){
    if(!dragRef.current || !canvasRef.current) return;
    movedRef.current = true;
    const {x,y} = ptFromEvent(e);
    const {kind,id} = dragRef.current;
    if(kind==="wall") setWallPoints(p=>p.map(pt=>pt.id===id?{...pt,x,y}:pt));
    if(kind==="zone") setZones(z=>z.map(zz=>zz.id===id?{...zz,x,y}:zz));
    if(kind==="table") setTables(t=>t.map(tt=>tt.id===id?{...tt,x,y}:tt));
    if(kind==="column") setColumns(c=>c.map(cc=>cc.id===id?{...cc,x,y}:cc));
  }
  function dragEnd(){ dragRef.current=null; }

  async function saveHall(){
    if(!venueName.trim()||!hallName.trim()){ alert("Restoran və zal adını yazın 🙏"); return; }
    if(wallEdges.length<3){ alert("Ən azı 3 divar xətti çəkin (nöqtələri bir-birinə toxunub birləşdirin) 🙏"); return; }
    if(tables.length<1){ alert("Ən azı 1 masa qeyd edin 🙏 (Masa rejiminə keçib kətana klikləyin)"); return; }
    setSaving(true);
    try{
      let venueId = null;
      const existing = await sbFetch("venues?name=eq."+encodeURIComponent(venueName.trim()));
      if(existing && existing[0]) venueId = existing[0].id;
      else {
        const created = await sbFetch("venues",{method:"POST",prefer:"return=representation",headers:{"Prefer":"return=representation"},body:JSON.stringify({name:venueName.trim()})});
        venueId = created && created[0] && created[0].id;
      }
      const layout = tables.map(t=>({id:t.id,xPct:t.x,yPct:t.y,seats:t.seats,label:t.label||""}));
      const elements = zones.map(z=>({type:z.type,xPct:z.x,yPct:z.y,w:z.w,h:z.h,label:z.label}));
      const columnsData = columns.map(c=>({id:c.id,xPct:c.x,yPct:c.y}));
      const payload = {
        venue_id:venueId, venue_name:venueName.trim(), name:hallName.trim(),
        capacity:parseInt(capacity)||150, layout:layout, elements:elements,
        wall_path:wallPoints, wall_edges:wallEdges, columns:columnsData, photo_url:photoUrl||null, video_url:videoUrl.trim()||null, has_layout:true,
        maps_url:mapsUrl.trim()||null, contact_phone:contactPhone.trim()||null
      };
      let createdHall;
      if(editHall){
        // Redaktə — service-role vasitəsilə yenilə (sahiblərindən asılı olmayaraq)
        await fetch("/api/admin-halls?id="+editHall.id,{
          method:"PATCH",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+_adminAccessToken},
          body:JSON.stringify({...payload, is_public:isAdmin?makePublic:editHall.is_public})
        });
        createdHall = [{...editHall, ...payload}];
      } else {
        createdHall = await sbFetch("halls",{method:"POST",prefer:"return=representation",headers:{"Prefer":"return=representation"},body:JSON.stringify({
          ...payload, created_by:currentUserId||null, is_public:isAdmin?makePublic:false
        })});
      }
      alert(editHall?"✅ Zal yeniləndi!":"✅ Zal saxlanıldı! İndi restoran siyahısında görünəcək.");
      if(onSaved) onSaved(createdHall && createdHall[0]);
      onClose();
    }catch(e){ alert("Xəta baş verdi, yenidən cəhd edin."); }
    setSaving(false);
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,
      background:"radial-gradient(circle at 15% 8%,rgba(255,235,210,.9),transparent 40%),linear-gradient(160deg,#F5EEE0 0%,#E9DFC8 45%,#DED0AE 100%)",
      display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
        background:"linear-gradient(155deg,rgba(255,255,255,.65),rgba(255,255,255,.3))",backdropFilter:"blur(18px)",borderBottom:"1px solid rgba(255,255,255,.4)"}}>
        <span style={{fontWeight:700,fontSize:14,color:"#211A16"}}>🛠 Zal Builder</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#6B6259",cursor:"pointer"}}>✕</button>
      </div>

      <div style={{padding:"8px 14px 0",display:"flex",justifyContent:"center",alignItems:"center",flexShrink:0}}>
        <button onClick={()=>setInfoCollapsed(c=>!c)}
          style={{fontSize:11.5,fontWeight:700,
            color:infoCollapsed?"#8A6B1E":"#6B6259",
            background:infoCollapsed?"linear-gradient(155deg,rgba(212,175,90,.22),rgba(212,175,90,.1))":"rgba(255,255,255,.4)",
            border:"1px solid "+(infoCollapsed?"rgba(212,175,90,.5)":"rgba(255,255,255,.5)"),
            borderRadius:14,cursor:"pointer",padding:"8px 16px",display:"flex",alignItems:"center",gap:6,
            boxShadow:infoCollapsed?"0 2px 8px -2px rgba(212,175,90,.35)":"none"}}>
          {infoCollapsed?"✏️ Ad/Şəkil/Video — açmaq üçün toxun":"▲ Gizlət — kətana daha çox yer aç"}
        </button>
      </div>
      {!infoCollapsed&&(
      <div style={{padding:"6px 14px 0",display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
        <div style={{display:"flex",gap:6}}>
          <input value={venueName} onChange={e=>setVenueName(e.target.value)} placeholder="Restoran adı"
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(8px)",fontSize:12,outline:"none",color:"#211A16"}}/>
          <input value={hallName} onChange={e=>setHallName(e.target.value)} placeholder="Zal adı"
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(8px)",fontSize:12,outline:"none",color:"#211A16"}}/>
          <input value={capacity} onChange={e=>setCapacity(e.target.value)} placeholder="Tutum" type="number"
            style={{width:74,padding:"9px 8px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(8px)",fontSize:12,outline:"none",color:"#211A16"}}/>
        </div>
        {existingVenues.length>0&&!venueName.trim()&&(
          <button onClick={()=>setShowExistingVenues(s=>!s)}
            style={{alignSelf:"flex-start",fontSize:9.5,color:"#5B84B0",background:"none",border:"none",cursor:"pointer",padding:"2px 0",textDecoration:"underline"}}>
            {showExistingVenues?"▲ Gizlət":"▾ Mövcud restoranlardan seç ("+existingVenues.length+")"}
          </button>
        )}
        {existingVenues.length>0&&showExistingVenues&&!venueName.trim()&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {existingVenues.map(v=>(
              <button key={v.name} onClick={()=>{setVenueName(v.name);setShowExistingVenues(false);}}
                style={{padding:"4px 10px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",
                  background:"rgba(255,255,255,.3)",backdropFilter:"blur(6px)",
                  color:"#6B6259",fontSize:9.5,cursor:"pointer",whiteSpace:"nowrap"}}>
                {v.name} ({v.halls.length})
              </button>
            ))}
          </div>
        )}
        {venueName.trim() && existingVenues.find(v=>v.name.toLowerCase()===venueName.trim().toLowerCase()) && (
          <div style={{fontSize:9.5,color:"rgba(76,154,110,.9)",background:"rgba(76,154,110,.1)",padding:"6px 10px",borderRadius:10}}>
            Bu restoranda artıq: {existingVenues.find(v=>v.name.toLowerCase()===venueName.trim().toLowerCase()).halls.join(", ")} — yeni zal əlavə edirsiniz
          </div>
        )}
        {photoUrl ? (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.3)"}}>
            <img src={photoUrl} style={{width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
            <div style={{flex:1,fontSize:10,color:"rgba(33,26,22,.6)"}}>Zal şəkli (yalnız məlumat üçün — fon deyil)</div>
            <label style={{padding:"6px 10px",borderRadius:10,background:"rgba(91,132,176,.14)",color:"#5B84B0",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              Dəyiş
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
            </label>
            <button onClick={()=>setPhotoUrl(null)} style={{padding:"6px 10px",borderRadius:10,background:"rgba(193,56,42,.12)",color:"#C1382A",fontSize:10,fontWeight:700,border:"none",cursor:"pointer"}}>Sil</button>
          </div>
        ) : (
          <label style={{padding:"9px 12px",borderRadius:12,border:"1px dashed rgba(150,120,80,.4)",background:"rgba(255,255,255,.3)",fontSize:11,color:"#6B6259",textAlign:"center",cursor:"pointer"}}>
            📷 Zalın şəklini yüklə (yalnız məlumat üçün, istəyə bağlı)
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
          </label>
        )}
        {videoUrl ? (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.3)"}}>
            <video src={videoUrl} style={{width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0}} muted/>
            <div style={{flex:1,fontSize:10,color:"rgba(33,26,22,.6)"}}>Zalın videosu yüklənib</div>
            <label style={{padding:"6px 10px",borderRadius:10,background:"rgba(91,132,176,.14)",color:"#5B84B0",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              Dəyiş
              <input type="file" accept="video/*" onChange={handleVideoUpload} style={{display:"none"}}/>
            </label>
            <button onClick={()=>setVideoUrl("")} style={{padding:"6px 10px",borderRadius:10,background:"rgba(193,56,42,.12)",color:"#C1382A",fontSize:10,fontWeight:700,border:"none",cursor:"pointer"}}>Sil</button>
          </div>
        ) : (
          <label style={{padding:"9px 12px",borderRadius:12,border:"1px dashed rgba(150,120,80,.4)",background:"rgba(255,255,255,.3)",fontSize:11,color:"#6B6259",textAlign:"center",cursor:"pointer"}}>
            🎥 Zalın real videosunu yüklə (maks. 10MB, istəyə bağlı)
            <input type="file" accept="video/*" onChange={handleVideoUpload} style={{display:"none"}}/>
          </label>
        )}

        <input value={mapsUrl} onChange={e=>setMapsUrl(e.target.value)} placeholder="📍 Google Maps linki (istəyə bağlı — qonaqlar üçün SMS-də göndərilir)"
          style={{padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(8px)",fontSize:11,outline:"none",color:"#211A16"}}/>
        <input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="📞 Zalın əlaqə nömrəsi (istəyə bağlı)"
          style={{padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(8px)",fontSize:11,outline:"none",color:"#211A16"}}/>

        {isAdmin&&(
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:12,background:"rgba(212,175,90,.1)",border:"1px solid rgba(212,175,90,.3)",cursor:"pointer"}}>
            <input type="checkbox" checked={makePublic} onChange={e=>setMakePublic(e.target.checked)} style={{width:16,height:16,accentColor:"#D4AF5A"}}/>
            <span style={{fontSize:11,color:"#8A6B1E",fontWeight:600}}>🌐 Bunu bütün istifadəçilər üçün ümumi et (rəsmi zal)</span>
          </label>
        )}
        {!isAdmin&&(
          <div style={{fontSize:9.5,color:"rgba(33,26,22,.4)",padding:"0 4px"}}>
            🔒 Bu zal yalnız sizin hesabınızda görünəcək
          </div>
        )}
      </div>
      )}
      <div style={{padding:"0 14px",display:"flex",gap:6,flexShrink:0}}>
        {[["wall","🧱 Divar"],["column","🟤 Sütun"],["zone","🏷 Zona"],["table","🪑 Masa"]].map(([m,l])=>(
          <button key={m} onClick={()=>setMode(m)}
            style={{flex:1,padding:"9px 4px",borderRadius:12,border:"1px solid "+(mode===m?"rgba(193,56,42,.5)":"rgba(255,255,255,.5)"),
              background:mode===m?"rgba(193,56,42,.16)":"rgba(255,255,255,.35)",backdropFilter:"blur(6px)",
              color:mode===m?"#C1382A":"#6B6259",fontSize:10,fontWeight:700,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      <div style={{padding:"7px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{fontSize:10,color:"#6B6259",flex:1}}>
          {mode==="wall"&&"Boş yerə klikləyib nöqtə qoyun. 2 nöqtəyə ardıcıl toxunub birləşdirin (yaşıl=seçili). Səhv nöqtəni seçib üstündəki 🗑 ilə silin"}
          {mode==="column"&&"Sütunun yerinə klikləyin — divardan ayrı, öz nişanı ilə görünür"}
          {mode==="zone"&&"Kətanə klikləyin — zona növünü seçəcəksiniz (Səhnə, Rəqs meydanı və s.)"}
          {mode==="table"&&"Kətanə klikləyin — masa əlavə olunacaq, sonra sürüşdürüb yerini düzəldin"}
        </div>
        {mode==="wall"&&(
          <button onClick={()=>setSnapOn(s=>!s)} style={{flexShrink:0,marginLeft:8,padding:"4px 9px",borderRadius:10,
            border:"1px solid "+(snapOn?"rgba(76,154,110,.5)":"rgba(255,255,255,.5)"),
            background:snapOn?"rgba(76,154,110,.18)":"rgba(255,255,255,.3)",
            color:snapOn?"#4C9A6E":"#6B6259",fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            {snapOn?"✓ Düzləşdirmə AÇIQ":"Düzləşdirmə BAĞLI"}
          </button>
        )}
      </div>

      <div ref={canvasRef} onClick={canvasClick}
        onTouchMove={dragMove} onTouchEnd={dragEnd}
        onMouseMove={dragMove} onMouseUp={dragEnd}
        style={{flex:1,margin:"6px 14px",borderRadius:20,position:"relative",overflow:"hidden",
        backgroundColor:"rgba(255,255,255,.4)",
        border:"1px solid rgba(255,255,255,.5)",cursor:"crosshair",touchAction:"none"}}>

        {wallEdges.length>0 && (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:"absolute",inset:0,pointerEvents:"none"}}>
            {wallEdges.map(ed=>{
              const a = wallPoints.find(p=>p.id===ed.from), b = wallPoints.find(p=>p.id===ed.to);
              if(!a||!b) return null;
              return <line key={ed.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#C1382A" strokeWidth="0.7"/>;
            })}
          </svg>
        )}
        {wallPoints.map((p)=>(
          <div key={p.id} style={{position:"absolute",left:p.x+"%",top:p.y+"%",transform:"translate(-50%,-50%)",zIndex:5}}>
            <div
              onTouchStart={e=>dragStart("wall",p.id,e)} onMouseDown={e=>dragStart("wall",p.id,e)}
              onClick={e=>{ e.stopPropagation(); const wasMoved=movedRef.current; movedRef.current=false; if(!wasMoved) pointTap(p.id); }}
              style={{
              width:selectedPoint===p.id?20:16,height:selectedPoint===p.id?20:16,borderRadius:"50%",
              background:selectedPoint===p.id?"#4C9A6E":"#C1382A",
              border:"2px solid #fff",cursor:"grab",
              boxShadow:selectedPoint===p.id?"0 0 0 4px rgba(76,154,110,.3), 0 2px 5px rgba(0,0,0,.3)":"0 2px 5px rgba(0,0,0,.3)",
              transition:"width .15s,height .15s"}}/>
            {selectedPoint===p.id&&(
              <button onClick={e=>{
                  e.stopPropagation();
                  setWallEdges(edges=>edges.filter(ed=>ed.from!==p.id&&ed.to!==p.id));
                  setWallPoints(pts=>pts.filter(x=>x.id!==p.id));
                  setSelectedPoint(null);
                }}
                style={{position:"absolute",top:-26,left:"50%",transform:"translateX(-50%)",
                width:22,height:22,borderRadius:"50%",background:"#C1382A",color:"#fff",border:"2px solid #fff",
                fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                boxShadow:"0 2px 6px rgba(0,0,0,.35)",zIndex:9}}>🗑</button>
            )}
          </div>
        ))}

        {zones.map(z=>(
          <div key={z.id}
            onTouchStart={e=>dragStart("zone",z.id,e)} onMouseDown={e=>dragStart("zone",z.id,e)}
            style={{position:"absolute",left:z.x+"%",top:z.y+"%",transform:"translate(-50%,-50%)",
            padding:"5px 10px",borderRadius:10,background:"rgba(91,132,176,.28)",border:"1px solid #5B84B0",
            fontSize:9,fontWeight:700,color:"#2E4A66",cursor:"grab",whiteSpace:"nowrap",zIndex:6}}>
            {z.label}
            <span onClick={e=>{e.stopPropagation();setZones(zz=>zz.filter(x=>x.id!==z.id));}}
              style={{marginLeft:6,color:"#C1382A",cursor:"pointer",fontWeight:900}}>✕</span>
          </div>
        ))}

        {tables.map(t=>(
          <div key={t.id}
            onTouchStart={e=>dragStart("table",t.id,e)} onMouseDown={e=>dragStart("table",t.id,e)}
            onClick={e=>{ e.stopPropagation(); const wasMoved=movedRef.current; movedRef.current=false; if(!wasMoved) setTableEditId(t.id); }}
            style={{position:"absolute",left:t.x+"%",top:t.y+"%",transform:"translate(-50%,-50%)",
            width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"2px solid #D4AF5A",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#8A6B1E",
            cursor:"grab",zIndex:6,boxShadow:"0 2px 6px rgba(0,0,0,.2)"}}>
            <span style={{fontSize:10,fontWeight:800,lineHeight:1}}>{t.id}</span>
            <span style={{fontSize:7,fontWeight:600,opacity:.75,lineHeight:1,marginTop:1}}>{t.seats}n</span>
            <span onClick={e=>{e.stopPropagation();setTables(tt=>tt.filter(x=>x.id!==t.id));}}
              style={{position:"absolute",top:-7,right:-7,width:17,height:17,borderRadius:"50%",background:"#C1382A",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</span>
          </div>
        ))}

        {columns.map(c=>(
          <div key={c.id}
            onTouchStart={e=>dragStart("column",c.id,e)} onMouseDown={e=>dragStart("column",c.id,e)}
            style={{position:"absolute",left:c.x+"%",top:c.y+"%",transform:"translate(-50%,-50%)",
            width:16,height:16,borderRadius:4,background:"repeating-linear-gradient(45deg,#8A7A6E,#8A7A6E 2px,#B8AC9C 2px,#B8AC9C 4px)",
            border:"1.5px solid #5A4E45",cursor:"grab",zIndex:7,boxShadow:"0 2px 5px rgba(0,0,0,.25)"}}>
            <span onClick={e=>{e.stopPropagation();setColumns(cc=>cc.filter(x=>x.id!==c.id));}}
              style={{position:"absolute",top:-8,right:-8,width:15,height:15,borderRadius:"50%",background:"#C1382A",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</span>
          </div>
        ))}
      </div>

      {zoneLabelInput && (
        <div style={{position:"fixed",inset:0,background:"rgba(33,26,22,.45)",backdropFilter:"blur(6px)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setZoneLabelInput(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(155deg,rgba(255,255,255,.9),rgba(255,255,255,.7))",backdropFilter:"blur(20px)",borderRadius:20,padding:18,width:"100%",maxWidth:280,border:"1px solid rgba(255,255,255,.6)"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:"#211A16"}}>Zona növü seçin</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[["🎭 Səhnə","stage"],["💃 Rəqs meydanı","danceFloor"],["🎸 Musiqiçilər","stage"],["🚪 Giriş","entrance"],["🍽️ Mətbəx","entrance"],["📸 Foto zona","entrance"],["👰 Bəy&Gəlin","brideGroom"]].map(([lbl,type])=>(
                <button key={lbl} onClick={()=>addZone(lbl,type)}
                  style={{padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer",textAlign:"left",color:"#211A16"}}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tableEditId!==null && (()=>{
        const t = tables.find(x=>x.id===tableEditId);
        if(!t) return null;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(33,26,22,.45)",backdropFilter:"blur(6px)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setTableEditId(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(155deg,rgba(255,255,255,.9),rgba(255,255,255,.7))",backdropFilter:"blur(20px)",borderRadius:20,padding:18,width:"100%",maxWidth:280,border:"1px solid rgba(255,255,255,.6)"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:"#211A16"}}>Masa {t.id}</div>
              <div style={{fontSize:10,color:"rgba(33,26,22,.5)",marginBottom:12}}>Masada neçə nəfər oturacaq?</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,marginBottom:12}}>
                {[6,8,10,12].map(n=>(
                  <button key={n} onClick={()=>setTables(tt=>tt.map(x=>x.id===t.id?{...x,seats:n}:x))}
                    style={{padding:"10px 0",borderRadius:12,border:"1px solid "+(t.seats===n?"rgba(193,56,42,.5)":"rgba(255,255,255,.5)"),
                      background:t.seats===n?"rgba(193,56,42,.14)":"rgba(255,255,255,.5)",
                      color:t.seats===n?"#C1382A":"#211A16",fontSize:13,fontWeight:700,cursor:"pointer"}}>{n}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:11,color:"rgba(33,26,22,.5)"}}>Digər:</span>
                <input type="number" value={t.seats} onChange={e=>{
                  const v=parseInt(e.target.value)||1;
                  setTables(tt=>tt.map(x=>x.id===t.id?{...x,seats:v}:x));
                }} style={{width:60,padding:"6px 9px",borderRadius:10,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",fontSize:12,outline:"none",color:"#211A16"}}/>
              </div>
              <input value={t.label} onChange={e=>setTables(tt=>tt.map(x=>x.id===t.id?{...x,label:e.target.value}:x))}
                placeholder="Masa adı (istəyə bağlı, məs: VIP)"
                style={{width:"100%",padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.5)",fontSize:12,outline:"none",color:"#211A16",boxSizing:"border-box",marginBottom:12}}/>
              <button onClick={()=>setTableEditId(null)}
                style={{width:"100%",padding:"11px",borderRadius:14,border:"none",background:"linear-gradient(155deg,#5EB889,#3d8259)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Tamam</button>
            </div>
          </div>
        );
      })()}

      <div style={{padding:"10px 14px 24px",flexShrink:0,display:"flex",gap:6}}>
        <button onClick={()=>{
          if(mode==="wall"){
            if(wallEdges.length>0) setWallEdges(ed=>ed.slice(0,-1));
            else setWallPoints(p=>p.slice(0,-1));
          }
          else if(mode==="column") setColumns(c=>c.slice(0,-1));
          else if(mode==="zone") setZones(z=>z.slice(0,-1));
          else if(mode==="table") setTables(t=>t.slice(0,-1));
        }}
          style={{padding:"12px 10px",borderRadius:16,border:"1px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.35)",backdropFilter:"blur(8px)",color:"#6B6259",fontSize:10.5,cursor:"pointer",whiteSpace:"nowrap"}}>↺ Sonuncu</button>
        <button onClick={()=>{
          if(!confirm("Bütün zal (divarlar, sütunlar, zonalar, masalar) sıfırlansın?")) return;
          setWallPoints([]); setWallEdges([]); setSelectedPoint(null); setColumns([]); setZones([]); setTables([]); setPhotoUrl(null);
        }}
          style={{padding:"12px 10px",borderRadius:16,border:"1px solid rgba(193,56,42,.35)",background:"rgba(193,56,42,.1)",backdropFilter:"blur(8px)",color:"#C1382A",fontSize:10.5,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>🗑 Sıfırla</button>
        <button onClick={saveHall} disabled={saving}
          style={{flex:1,padding:"13px",borderRadius:16,border:"1px solid rgba(255,255,255,.4)",
            background:"linear-gradient(155deg,#5EB889,#3d8259)",backdropFilter:"blur(8px)",
            color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 16px -6px rgba(76,154,110,.5)"}}>
          {saving?"Saxlanılır...":"✓ Zalı saxla"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel(){
  const isMobile = useIsMobile();
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
  const [hallBuilderOpen, setHallBuilderOpen] = useState(false);
  const [managedHalls, setManagedHalls] = useState([]);
  const [hallsLoading, setHallsLoading] = useState(false);
  const [editingHall, setEditingHall] = useState(null);

  function loadManagedHalls(){
    if(!session) return;
    setHallsLoading(true);
    fetch("/api/admin-halls", { headers: { Authorization: "Bearer " + session.access_token } })
      .then(r=>r.json())
      .then(j=>{ if(j.ok) setManagedHalls(j.halls); })
      .finally(()=>setHallsLoading(false));
  }

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

  const GLOBAL_CSS = `
    *{box-sizing:border-box;}
    ::-webkit-scrollbar{height:6px;width:6px;}
    ::-webkit-scrollbar-thumb{background:rgba(150,120,80,.25);border-radius:3px;}
    .admin-scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    @media (max-width:860px){
      .admin-stat-grid{grid-template-columns:repeat(2,1fr)!important;}
    }
  `;

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
        <style>{"@keyframes aload{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:isMobile?"column":"row",background:"#F7F1E4",fontFamily:"'Inter',sans-serif"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Desktop sidebar */}
      {!isMobile&&(
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
          <div style={{padding:"0 10px 8px",fontSize:11,color:"rgba(245,238,224,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.email}</div>
          <button onClick={()=>supabase.auth.signOut()}
            style={{padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"rgba(245,238,224,.6)",fontSize:12,cursor:"pointer",textAlign:"left"}}>
            🚪 Çıxış
          </button>
        </div>
      )}

      {/* Mobile top bar */}
      {isMobile&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
          background:"linear-gradient(180deg,#1A1512,#241C17)",flexShrink:0}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"#F5EEE0"}}>
            GONAG<span style={{color:"#D4AF5A"}}>.AZ</span>
          </div>
          <button onClick={()=>supabase.auth.signOut()}
            style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"transparent",color:"rgba(245,238,224,.65)",fontSize:11,cursor:"pointer"}}>
            🚪 Çıxış
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{flex:1,overflow:"auto",padding:isMobile?"16px 14px 90px":"28px 32px",minWidth:0}}>
        {tab==="dashboard"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?19:24,fontWeight:700,color:"#211A16",marginBottom:isMobile?14:20}}>İcmal</div>
            <div className="admin-stat-grid" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?20:28}}>
              <StatCard label="İSTİFADƏÇİ" value={data.stats.totalUsers} icon="👥" mobile={isMobile}/>
              <StatCard label="MƏCLİS" value={data.stats.totalEvents} icon="🎉" mobile={isMobile}/>
              <StatCard label="BUGÜN" value={data.stats.todayGuests} icon="✨" accent="#C1382A" mobile={isMobile}/>
              <StatCard label="ÜMUMİ QONAQ" value={data.stats.totalGuests} icon="👤" accent="#4C9A6E" mobile={isMobile}/>
            </div>
            <div style={{background:"rgba(255,255,255,.6)",borderRadius:isMobile?14:18,padding:isMobile?14:20,border:"1px solid rgba(255,255,255,.6)"}}>
              <div style={{fontSize:isMobile?13:14,fontWeight:700,color:"#211A16",marginBottom:14}}>Son yaradılan məclislər</div>
              {isMobile?(
                data.events.slice(0,8).map(e=>(
                  <DataRow key={e.id} mobile fields={[
                    {label:"Cütlük/Ad",value:e.couple||"—",bold:true},
                    {label:"Zal",value:e.hallName||"—"},
                    {label:"Masa/Qonaq",value:e.tableCount+" / "+e.guestCount},
                    {label:"Tarix",value:(e.createdAt||"").slice(0,10)},
                  ]}/>
                ))
              ):(
                <div className="admin-scroll-x">
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
              )}
            </div>
          </>
        )}

        {tab==="users"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?19:24,fontWeight:700,color:"#211A16",marginBottom:14}}>İstifadəçilər ({data.users.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 E-poçt üzrə axtar..."
              style={{width:"100%",maxWidth:isMobile?"100%":360,padding:"11px 15px",borderRadius:12,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:13,outline:"none",marginBottom:14}}/>

            {isMobile?(
              filteredUsers.map(u=>(
                <div key={u.id}>
                  <DataRow mobile onClick={()=>setExpandedUser(expandedUser===u.id?null:u.id)} fields={[
                    {label:"E-poçt",value:u.email,bold:true},
                    {label:"Qeydiyyat",value:(u.created_at||"").slice(0,10)},
                    {label:"Məclis",value:u.eventCount},
                    {label:"Qonaq",value:u.totalGuests,accent:true,bold:true},
                  ]}/>
                </div>
              ))
            ):(
              <div className="admin-scroll-x" style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)"}}>
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
            )}

            {expandedUser&&(()=>{
              const evs = data.events.filter(e=>e.sessionId===expandedUser);
              const u = data.users.find(x=>x.id===expandedUser);
              return (
                <div style={{marginTop:14,padding:16,background:"rgba(212,175,90,.08)",borderRadius:16,border:"1px solid rgba(212,175,90,.25)"}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:10,wordBreak:"break-all"}}>{u&&u.email} — məclisləri ({evs.length})</div>
                  {evs.map(e=>(
                    <div key={e.id} style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:4,padding:"8px 0",borderBottom:"1px solid rgba(150,120,80,.1)",fontSize:12}}>
                      <span>{e.couple||e.type} — {e.hallName||"zal seçilməyib"}</span>
                      <span style={{color:"#6B6259"}}>{e.guestCount} qonaq · {e.tableCount} masa</span>
                    </div>
                  ))}
                  {evs.length===0&&<div style={{fontSize:12,color:"#6B6259"}}>Hələ məclis yaratmayıb</div>}
                </div>
              );
            })()}
          </>
        )}

        {tab==="events"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?19:24,fontWeight:700,color:"#211A16",marginBottom:14}}>Məclislər ({data.events.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cütlük adı və ya zal üzrə axtar..."
              style={{width:"100%",maxWidth:isMobile?"100%":360,padding:"11px 15px",borderRadius:12,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:13,outline:"none",marginBottom:14}}/>

            {isMobile?(
              filteredEvents.map(e=>(
                <DataRow key={e.id} mobile fields={[
                  {label:"Cütlük/Ad",value:e.couple||"—",bold:true},
                  {label:"Növ",value:e.type||"—"},
                  {label:"Zal",value:e.hallName||"—"},
                  {label:"Masa/Qonaq",value:e.tableCount+" / "+e.guestCount},
                  {label:"Status",value:e.status||"natamam"},
                  {label:"Tarix",value:(e.createdAt||"").slice(0,10)},
                ]}/>
              ))
            ):(
              <div className="admin-scroll-x" style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)"}}>
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
            )}
          </>
        )}

        {tab==="guests"&&(
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?19:24,fontWeight:700,color:"#211A16",marginBottom:14}}>Qonaq axtarışı</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Ad və ya telefon nömrəsi..."
              style={{width:"100%",maxWidth:isMobile?"100%":420,padding:"13px 17px",borderRadius:14,border:"1px solid rgba(150,120,80,.2)",background:"#fff",fontSize:14,outline:"none",marginBottom:14}}/>
            {!search&&<div style={{fontSize:12,color:"#6B6259",marginBottom:12}}>Son 50 qonaq göstərilir — axtarış üçün yazın</div>}

            {isMobile?(
              filteredGuests.map((g,i)=>(
                <DataRow key={i} mobile fields={[
                  {label:"Ad",value:g.name,bold:true},
                  {label:"Telefon",value:g.phone||"—"},
                  {label:"Say/Masa",value:g.count+" nəfər / Masa "+g.tableId},
                  {label:"Məclis",value:g.couple||"—"},
                  {label:"Zal",value:g.hallName||"—"},
                ]}/>
              ))
            ):(
              <div className="admin-scroll-x" style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)"}}>
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
            )}
          </>
        )}

        {tab==="halls"&&(()=>{
          if(managedHalls.length===0 && !hallsLoading) loadManagedHalls();
          return (
          <>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?19:24,fontWeight:700,color:"#211A16",marginBottom:6}}>Zal Builder</div>
            <div style={{fontSize:12,color:"#6B6259",marginBottom:16}}>
              Bura yaratdığınız zallar <b>bütün istifadəçilər üçün ictimai</b> olacaq (aşağıdakı işarəni seçsəniz), ya da yalnız sizin admin hesabınızda qalacaq.
            </div>
            <button onClick={()=>{ _adminAccessToken = session.access_token; setEditingHall(null); setHallBuilderOpen(true); }}
              style={{padding:"18px 20px",borderRadius:18,border:"1px solid rgba(76,154,110,.35)",
                background:"linear-gradient(155deg,rgba(76,154,110,.14),rgba(76,154,110,.04))",cursor:"pointer",textAlign:"left",color:"#211A16",marginBottom:20}}>
              <div style={{fontSize:22,marginBottom:6}}>🛠</div>
              <div style={{fontSize:14,fontWeight:700,color:"#4C9A6E"}}>Yeni zal qur</div>
              <div style={{fontSize:11,color:"rgba(33,26,22,.55)"}}>Divar, masa, zona quraşdırıb ictimai/məxfi saxlayın</div>
            </button>

            <div style={{fontSize:13,fontWeight:700,color:"#211A16",marginBottom:10}}>Bütün zallar ({managedHalls.length}) {hallsLoading&&"— yüklənir..."}</div>
            {isMobile?(
              managedHalls.map(h=>(
                <div key={h.id} style={{padding:"13px 15px",borderRadius:14,background:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.5)",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{h.venue_name} — {h.name}</div>
                      <div style={{fontSize:10,color:"#6B6259"}}>{h.ownerEmail} · {h.capacity} nəfər</div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:8,
                      background:h.is_public?"rgba(76,154,110,.15)":"rgba(150,120,80,.12)",
                      color:h.is_public?"#4C9A6E":"#6B6259"}}>{h.is_public?"İctimai":"Məxfi"}</span>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={async()=>{
                        await fetch("/api/admin-halls?id="+h.id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({is_public:!h.is_public})});
                        setManagedHalls(hs=>hs.map(x=>x.id===h.id?{...x,is_public:!x.is_public}:x));
                      }}
                      style={{flex:1,padding:"7px",borderRadius:9,border:"1px solid rgba(91,132,176,.3)",background:"rgba(91,132,176,.1)",color:"#5B84B0",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                      {h.is_public?"Gizlət":"Göstər"}
                    </button>
                    <button onClick={async()=>{
                        _adminAccessToken = session.access_token;
                        const r = await fetch("/api/admin-halls?id="+h.id,{headers:{Authorization:"Bearer "+session.access_token}});
                        const j = await r.json();
                        if(j.ok&&j.hall){ setEditingHall(j.hall); setHallBuilderOpen(true); }
                      }}
                      style={{flex:1,padding:"7px",borderRadius:9,border:"1px solid rgba(212,175,90,.35)",background:"rgba(212,175,90,.1)",color:"#8A6B1E",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                      Redaktə
                    </button>
                    <button onClick={async()=>{
                        if(!confirm("Bu zal silinsin? Geri qaytarıla bilməz.")) return;
                        await fetch("/api/admin-halls?id="+h.id,{method:"DELETE",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({id:h.id})});
                        setManagedHalls(hs=>hs.filter(x=>x.id!==h.id));
                      }}
                      style={{flex:1,padding:"7px",borderRadius:9,border:"1px solid rgba(193,56,42,.3)",background:"rgba(193,56,42,.08)",color:"#C1382A",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                      Sil
                    </button>
                  </div>
                </div>
              ))
            ):(
              <div className="admin-scroll-x" style={{background:"rgba(255,255,255,.6)",borderRadius:18,border:"1px solid rgba(255,255,255,.6)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><Th>Restoran</Th><Th>Zal</Th><Th>Sahib</Th><Th>Tutum</Th><Th>Status</Th><Th>Əməliyyat</Th></tr></thead>
                  <tbody>
                    {managedHalls.map(h=>(
                      <tr key={h.id}>
                        <Td style={{fontWeight:600}}>{h.venue_name}</Td>
                        <Td>{h.name}</Td>
                        <Td style={{fontSize:11,color:"#6B6259"}}>{h.ownerEmail}</Td>
                        <Td>{h.capacity}</Td>
                        <Td>
                          <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:10,
                            background:h.is_public?"rgba(76,154,110,.15)":"rgba(150,120,80,.12)",
                            color:h.is_public?"#4C9A6E":"#6B6259"}}>{h.is_public?"İctimai":"Məxfi"}</span>
                        </Td>
                        <Td>
                          <div style={{display:"flex",gap:5}}>
                            <button onClick={async()=>{
                                await fetch("/api/admin-halls?id="+h.id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({is_public:!h.is_public})});
                                setManagedHalls(hs=>hs.map(x=>x.id===h.id?{...x,is_public:!x.is_public}:x));
                              }}
                              style={{padding:"5px 9px",borderRadius:8,border:"1px solid rgba(91,132,176,.3)",background:"rgba(91,132,176,.1)",color:"#5B84B0",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                              {h.is_public?"Gizlət":"Göstər"}
                            </button>
                            <button onClick={async()=>{
                                _adminAccessToken = session.access_token;
                                const r = await fetch("/api/admin-halls?id="+h.id,{headers:{Authorization:"Bearer "+session.access_token}});
                                const j = await r.json();
                                if(j.ok&&j.hall){ setEditingHall(j.hall); setHallBuilderOpen(true); }
                              }}
                              style={{padding:"5px 9px",borderRadius:8,border:"1px solid rgba(212,175,90,.35)",background:"rgba(212,175,90,.1)",color:"#8A6B1E",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                              Redaktə
                            </button>
                            <button onClick={async()=>{
                                if(!confirm("Bu zal silinsin? Geri qaytarıla bilməz.")) return;
                                await fetch("/api/admin-halls?id="+h.id,{method:"DELETE",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({id:h.id})});
                                setManagedHalls(hs=>hs.filter(x=>x.id!==h.id));
                              }}
                              style={{padding:"5px 9px",borderRadius:8,border:"1px solid rgba(193,56,42,.3)",background:"rgba(193,56,42,.08)",color:"#C1382A",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                              Sil
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
          );
        })()}
      </div>

      {hallBuilderOpen&&(
        <HallBuilderPanel
          currentUserId={session&&session.user?session.user.id:null}
          isAdmin={true}
          editHall={editingHall}
          onClose={()=>{ setHallBuilderOpen(false); setEditingHall(null); }}
          onSaved={()=>{ setHallBuilderOpen(false); setEditingHall(null); setManagedHalls([]); }}
        />
      )}

      {/* Mobile bottom nav */}
      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",
          background:"linear-gradient(0deg,#1A1512,#241C17)",padding:"8px 6px calc(8px + env(safe-area-inset-bottom))",
          boxShadow:"0 -4px 20px rgba(0,0,0,.25)",zIndex:10}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setTab(n.id);setSearch("");}}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 2px",
                border:"none",background:"transparent",cursor:"pointer"}}>
              <span style={{fontSize:17,opacity:tab===n.id?1:.5}}>{n.icon}</span>
              <span style={{fontSize:9,fontWeight:tab===n.id?700:500,color:tab===n.id?"#D4AF5A":"rgba(245,238,224,.5)"}}>{n.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
