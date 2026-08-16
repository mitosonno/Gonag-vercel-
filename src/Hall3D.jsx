import { useMemo } from "react";

// Zonalara görə rəng/ikon
const ZONE_STYLE = {
  danceFloor: { bg: "linear-gradient(155deg,#F9DCE3,#F3C4D0)", border: "#E8A8BA", icon: "💃", label: "RƏQS MEYDANI" },
  brideGroom: { bg: "linear-gradient(155deg,#FFF7E0,#FDECC0)", border: "#D4AF5A", icon: "👰", label: "BƏY VƏ GƏLİN" },
  stage:      { bg: "linear-gradient(155deg,#DCEBF9,#C4DDF3)", border: "#A8C7E8", icon: "🎵", label: "MUSİQİÇİLƏR" },
  entrance:   { bg: "linear-gradient(155deg,#E8F3E4,#D4EACB)", border: "#9FCB8A", icon: "🚪", label: "GİRİŞ" },
};

function occOf(t){
  return (t.guests||[]).reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0),0);
}

export default function Hall3D({ hall, tables, onClose }){
  const wallPaths = useMemo(()=>{
    if(!hall || !hall._wallEdges || !hall._wallPath) return [];
    return hall._wallEdges.map(ed=>{
      const a = hall._wallPath.find(p=>p.id===ed.from);
      const b = hall._wallPath.find(p=>p.id===ed.to);
      if(!a||!b) return null;
      return {id:ed.id, x1:a.x, y1:a.y, x2:b.x, y2:b.y};
    }).filter(Boolean);
  }, [hall]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"linear-gradient(160deg,#F7F1E4 0%,#EDE3CC 100%)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
        background:"#FFFFFF",borderBottom:"1px solid #E7E1D6",flexShrink:0}}>
        <span style={{fontWeight:700,fontSize:14,color:"#211A16",fontFamily:"'Fraunces',serif"}}>🎨 Real Görünüş</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#6B6259",cursor:"pointer"}}>✕</button>
      </div>

      <div style={{flex:1,overflow:"auto",padding:16,display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
        <div style={{position:"relative",width:"100%",maxWidth:520,aspectRatio:"1/1.15",
          background:"radial-gradient(ellipse at 50% 0%, #FFFDF7, #F5EFE0 60%, #EEE4CC)",
          borderRadius:20,boxShadow:"0 20px 50px -15px rgba(120,90,40,.35), inset 0 0 0 1px rgba(212,175,90,.25)",
          overflow:"hidden"}}>

          <svg width="100%" height="100%" viewBox="0 0 100 115" style={{position:"absolute",inset:0}}>
            <defs>
              <pattern id="floorGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(180,150,90,.12)" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100" height="115" fill="url(#floorGrid)"/>

            {wallPaths.map(w=>(
              <g key={w.id}>
                <line x1={w.x1} y1={w.y1*1.15} x2={w.x2} y2={w.y2*1.15} stroke="#C9A25E" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1={w.x1} y1={w.y1*1.15} x2={w.x2} y2={w.y2*1.15} stroke="#FFF9EC" strokeWidth="0.5" strokeLinecap="round"/>
              </g>
            ))}
            {hall&&hall._wallPath&&hall._wallPath.map(p=>(
              <circle key={p.id} cx={p.x} cy={p.y*1.15} r="0.9" fill="#C9A25E" opacity="0.6"/>
            ))}

            {hall&&hall._columns&&hall._columns.map((c,i)=>(
              <g key={i}>
                <circle cx={c.xPct} cy={c.yPct*1.15} r="1.6" fill="#E8DCC0" stroke="#B8A06A" strokeWidth="0.3"/>
              </g>
            ))}
          </svg>

          {hall&&hall._hallElements&&hall._hallElements.map((el,i)=>{
            const style = ZONE_STYLE[el.type] || ZONE_STYLE.entrance;
            return (
              <div key={i} style={{
                position:"absolute",
                left:el.xPct+"%", top:el.yPct+"%",
                width:el.w+"%", height:(el.h*0.87)+"%",
                transform:"translate(-50%,-50%)",
                background:style.bg, border:"1px solid "+style.border,
                borderRadius:14, display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                boxShadow:"0 3px 10px -4px rgba(120,90,40,.25), inset 0 1px 0 rgba(255,255,255,.6)",
                gap:2
              }}>
                <span style={{fontSize:"clamp(12px,3vw,18px)"}}>{style.icon}</span>
                <span style={{fontSize:"clamp(6px,1.4vw,8px)",fontWeight:700,color:"#6B5A3A",letterSpacing:0.3}}>{style.label}</span>
              </div>
            );
          })}

          {(tables||[]).map(t=>{
            if(!t.pos) return null;
            const oc = occOf(t);
            const full = oc>=t.seats;
            const partial = oc>0 && !full;
            const statusColor = full?"#C1382A":partial?"#D4AF5A":"#8FBF9A";
            const isVip = (t.label||"").toLowerCase().includes("vip");
            const seats = t.seats||8;
            const size = Math.max(9, Math.min(15, 60/Math.sqrt(tables.length||1)));

            return (
              <div key={t.id} style={{
                position:"absolute",
                left:t.pos.xPct+"%", top:t.pos.yPct+"%",
                transform:"translate(-50%,-50%)",
                display:"flex",flexDirection:"column",alignItems:"center"
              }}>
                <div style={{position:"relative",width:size+"vw",maxWidth:74,height:size+"vw",maxHeight:74}}>
                  {Array.from({length:seats}).map((_,i)=>{
                    const angle=(i/seats)*Math.PI*2 - Math.PI/2;
                    const cx=50+Math.cos(angle)*38, cy=50+Math.sin(angle)*38;
                    return (
                      <div key={i} style={{
                        position:"absolute",left:cx+"%",top:cy+"%",transform:`translate(-50%,-50%) rotate(${angle+Math.PI/2}rad)`,
                        width:"16%",height:"22%",borderRadius:"3px 3px 6px 6px",
                        background:isVip?"linear-gradient(180deg,#F3E2B0,#D4AF5A)":"linear-gradient(180deg,#EDE6D5,#D8CFB5)",
                        border:"0.5px solid rgba(150,120,60,.4)"
                      }}/>
                    );
                  })}
                  <div style={{
                    position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
                    width:"62%",height:"62%",borderRadius:"50%",
                    background:"radial-gradient(circle at 35% 30%, #FFFFFF, #F5EFE2)",
                    border:"1.5px solid "+(isVip?"#D4AF5A":"#C9A25E"),
                    boxShadow:"0 4px 10px -3px rgba(120,90,40,.35), inset 0 1px 3px rgba(255,255,255,.8)",
                    display:"flex",alignItems:"center",justifyContent:"center"
                  }}>
                    <div style={{
                      width:"58%",height:"58%",borderRadius:"50%",
                      background:isVip?"linear-gradient(155deg,#D4AF5A,#B8923E)":"linear-gradient(155deg,#3D2E1F,#211A16)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#FFF9EC",fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(8px,1.8vw,12px)"
                    }}>
                      {t.id}
                    </div>
                  </div>
                </div>
                <div style={{marginTop:2,width:"70%",height:3,borderRadius:2,overflow:"hidden",background:"rgba(150,120,60,.15)",display:"flex"}}>
                  <div style={{width:(Math.min(100,oc/t.seats*100))+"%",background:statusColor}}/>
                </div>
                <div style={{fontSize:"clamp(6px,1.3vw,8px)",fontWeight:700,color:"#6B5A3A",marginTop:1,whiteSpace:"nowrap"}}>
                  {oc}/{t.seats}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{padding:"8px 16px",display:"flex",gap:14,justifyContent:"center",background:"#FFFFFF",borderTop:"1px solid #E7E1D6",flexShrink:0,flexWrap:"wrap"}}>
        {[["#8FBF9A","Boş"],["#D4AF5A","Qismən dolu"],["#C1382A","Dolu"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
            <span style={{fontSize:10,color:"#6B6259"}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
