// ═══ QONAQ — Premium animasiyalı dəvətnamə dizaynları ═══
// Eyni komponentlər 3 yerdə istifadə olunur: App.jsx (seçim qalereyası), RsvpPage.jsx (qonaq linki),
// InvitePage.jsx (masa doldurmaq üçün göndərilən link). Məlumat hamısında eynidir, yalnız dizayn dəyişir.
import { useEffect, useRef, useState } from "react";

export const INVITE_THEMES = [
  { id:"zerf",  ad:"Zərf",          sw:"#E8DBC2", desc:"Zərfə toxun — möhür sınır, kart çıxır" },
  { id:"perde", ad:"Saray pərdəsi", sw:"#6E1A27", desc:"Məxmər pərdələr açılır" },
  { id:"bot",   ad:"Botanika",      sw:"#9DB38E", desc:"Yarpaqlar böyüyür, ləçəklər düşür" },
  { id:"edit",  ad:"Editorial",     sw:"#151515", desc:"Jurnal üslubu, iri tipoqrafiya" },
  { id:"gece",  ad:"Ulduzlu gecə",  sw:"#1B2650", desc:"Parlayan ulduzlar, qızılı xətlər" },
];

// Köhnə şablon indeksləri (5–9) və boş dəyər avtomatik "Zərf"ə düşür
export function themeAt(i){
  const n = Number(i);
  return INVITE_THEMES[Number.isInteger(n) && n>=0 && n<INVITE_THEMES.length ? n : 0];
}

const ASSET = n => "/"+n+".png";

export const INVITE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,500&family=Pinyon+Script&display=swap');
.qi-stage{--f-ui:"Manrope",system-ui,-apple-system,sans-serif;--f-serif:"Cormorant Garamond",Georgia,serif;--f-didone:"Bodoni Moda",Didot,Georgia,serif;--f-script:"Pinyon Script","Snell Roundhand",cursive;
  position:relative;isolation:isolate;overflow:hidden;background:var(--bg);color:var(--ink);font-family:var(--f-ui)}
.qi-stage *{box-sizing:border-box}
.qi-full{min-height:100vh}
.qi-inv{position:relative;z-index:1;max-width:480px;margin:0 auto;padding:22px 16px 40px;display:flex;flex-direction:column;gap:14px}
.qi-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px 16px}
.qi-brand{text-align:center;font:600 11px var(--f-ui);letter-spacing:.42em;color:var(--accent);padding-left:.42em}
.qi-kicker{text-align:center;font:600 10.5px var(--f-ui);letter-spacing:.32em;color:var(--muted);text-transform:uppercase}
.qi-names{text-align:center;font-family:var(--f-display);color:var(--ink);line-height:1.02;margin:10px 0 8px;text-wrap:balance;font-weight:500;overflow-wrap:anywhere}
.qi-names .amp{color:var(--accent)}
.qi-greet{text-align:center;font-size:14px;color:var(--muted);margin:0}
.qi-greet b{color:var(--ink);font-weight:600}
.qi-date{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;font:500 12.5px var(--f-ui);letter-spacing:.14em;color:var(--accent);text-transform:uppercase;font-variant-numeric:tabular-nums;text-align:center}
.qi-date::before,.qi-date::after{content:"";height:1px;width:28px;flex:0 0 auto;background:var(--line-strong)}
.qi-venue{display:flex;gap:12px;margin-top:18px;align-items:flex-start}
.qi-ph{width:66px;height:66px;flex:0 0 auto;border-radius:14px;border:1px dashed var(--line-strong);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--muted);font-size:9.5px;background:var(--soft);overflow:hidden}
.qi-ph img{width:100%;height:100%;object-fit:cover}
.qi-venue h3{margin:2px 0 0;font:600 15px var(--f-ui);color:var(--ink)}
.qi-venue p{margin:3px 0 0;font-size:12px;color:var(--muted)}
.qi-maps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.qi-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:12px;border:1px solid var(--line);background:var(--soft);color:var(--ink);font:600 11.5px var(--f-ui);text-decoration:none;cursor:pointer}
.qi-media{padding:0;overflow:hidden}
.qi-media video,.qi-media img{width:100%;display:block;max-height:70vh;background:#000}
.qi-media .cap{padding:10px 14px;font:600 11px var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.qi-sech{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;gap:8px}
.qi-sech h2{margin:0;font-family:var(--f-display);font-weight:500;font-size:22px;color:var(--ink)}
.qi-sech h2 span{font-size:30px;color:var(--accent);margin-left:4px}
.qi-sech small{font:600 10.5px var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.qi-tbl svg{width:100%;max-width:380px;display:block;margin:0 auto;overflow:visible}
.qi-tbl text.nm{font:600 10.5px var(--f-ui);fill:var(--ink)}
.qi-tbl line{stroke:var(--line-strong)}
.qi-warn{margin-top:10px;padding:8px 12px;border-radius:10px;font-size:11px;text-align:center;color:#A02A1E;background:rgba(193,56,42,.1)}
.qi-mates{display:flex;flex-direction:column;margin-top:8px;border-top:1px solid var(--line)}
.qi-mate{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
.qi-mate:last-child{border-bottom:0}
.qi-num{width:20px;height:20px;border-radius:50%;background:var(--soft);color:var(--accent);font:700 10px var(--f-ui);display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-variant-numeric:tabular-nums}
.qi-av{width:32px;height:32px;border-radius:50%;overflow:hidden;flex:0 0 auto;border:1px solid var(--line);background:var(--soft)}
.qi-av.me{border:2px solid var(--accent)}
.qi-av img{width:150%;height:150%;object-fit:cover;margin:-12% 0 0 -25%;max-width:none}
.qi-mate .n{flex:1;min-width:0;font:500 13.5px var(--f-ui);color:var(--ink);overflow-wrap:anywhere}
.qi-mate .x{display:block;font-size:10.5px;color:var(--muted);margin-top:1px}
.qi-siz{font:700 9.5px var(--f-ui);color:var(--on-accent);background:var(--accent);padding:2px 8px;border-radius:99px;margin-left:6px;white-space:nowrap}
.qi-h{margin:0 0 12px;font:600 15px var(--f-ui);text-align:center;color:var(--ink)}
.qi-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.qi-yes,.qi-no{padding:13px 8px;border-radius:14px;font:700 12.5px var(--f-ui);cursor:pointer}
.qi-yes{background:var(--accent);color:var(--on-accent);border:0}
.qi-no{background:transparent;color:var(--ink);border:1px solid var(--line-strong)}
.qi-done{text-align:center;font:600 13px var(--f-ui);color:var(--accent);padding:6px 0}
.qi-input{width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--soft);color:var(--ink);font:400 14px var(--f-ui);outline:none}
.qi-foot{text-align:center;font-size:10.5px;color:var(--muted);letter-spacing:.08em}
.qi-stage button:focus-visible,.qi-stage a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.qi-reveal{animation:qiRise .9s cubic-bezier(.2,.7,.2,1) both}
.qi-d1{animation-delay:.15s}.qi-d2{animation-delay:.3s}.qi-d3{animation-delay:.45s}.qi-d4{animation-delay:.6s}.qi-d5{animation-delay:.75s}
@keyframes qiRise{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
.qi-seatIn{animation:qiFade .7s ease both}
@keyframes qiFade{from{opacity:0}to{opacity:1}}
.qi-overlay{position:absolute;inset:0;z-index:20}
.qi-gone{pointer-events:none;animation:qiOut .6s ease forwards}
@keyframes qiOut{to{opacity:0;visibility:hidden}}

/* 1. ZƏRF */
.t-zerf{--bg:#F7F2E8;--card:#FFFDF8;--soft:#F3ECDD;--ink:#2B241B;--muted:#857965;--accent:#9A7432;--on-accent:#fff;--line:#EADFCB;--line-strong:#D3C19C;--f-display:var(--f-serif)}
.t-zerf .qi-names{font-size:48px}
.t-zerf .qi-names .sc{font-family:var(--f-script);font-size:40px;display:block;margin:2px 0}
.qi-env{position:fixed;background:radial-gradient(120% 80% at 50% 20%,#FBF7EF,#EDE3CF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;cursor:pointer}
.qi-contained .qi-env{position:absolute}
.qi-contained .qi-overlay{bottom:auto;height:min(100%,680px)}
.qi-envbox{position:relative;width:270px;height:180px;perspective:900px}
.qi-envback{position:absolute;inset:0;background:#E8DBC2;border-radius:6px;box-shadow:0 20px 40px -18px rgba(90,60,20,.45)}
.qi-envcard{position:absolute;left:14px;right:14px;top:14px;height:150px;background:#FFFDF8;border-radius:4px;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 10px;font:500 22px "Cormorant Garamond",Georgia,serif;color:#2B241B;transition:transform 1s cubic-bezier(.3,.7,.2,1) .55s}
.qi-envfront{position:absolute;inset:0;border-radius:6px;background:linear-gradient(155deg,#F1E6D1 0 50%,#EADCC2 50%);clip-path:polygon(0 0,50% 58%,100% 0,100% 100%,0 100%)}
.qi-envflap{position:absolute;left:0;right:0;top:0;height:108px;background:#E3D3B4;clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .7s ease;z-index:3}
.qi-seal{position:absolute;left:50%;top:84px;width:50px;height:50px;margin-left:-25px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#B8463C,#7D1F1A);box-shadow:0 4px 10px rgba(80,20,10,.4),inset 0 -3px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font:italic 500 20px "Cormorant Garamond",Georgia,serif;color:#F2D9B5;z-index:4;transition:transform .5s ease,opacity .5s ease}
.qi-env.open .qi-seal{transform:scale(1.3) rotate(-20deg);opacity:0}
.qi-env.open .qi-envflap{transform:rotateX(180deg);z-index:0}
.qi-env.open .qi-envcard{transform:translateY(-120px)}
.qi-envhint{font:600 11px "Manrope",sans-serif;letter-spacing:.3em;color:#9A7432;animation:qiPulse 1.8s ease-in-out infinite}
@keyframes qiPulse{50%{opacity:.4}}

/* 2. PƏRDƏ */
.t-perde{--bg:#1A1013;--card:#24171B;--soft:#2E1E23;--ink:#F3E6D3;--muted:#B8A48E;--accent:#D4AF6A;--on-accent:#1A1013;--line:#3C2A2F;--line-strong:#6B5040;--f-display:var(--f-serif);background:radial-gradient(90% 50% at 50% 0%,#3A1E26 0,#1A1013 70%)}
.t-perde .qi-names{font-size:46px;font-style:italic;text-shadow:0 0 30px rgba(212,175,106,.25)}
.qi-curtain{position:fixed;display:flex}
.qi-contained .qi-curtain{position:absolute}
.qi-curtain i{flex:1;background:repeating-linear-gradient(90deg,#5E1622 0 18px,#7A1D2C 18px 30px,#4A101A 30px 44px);box-shadow:inset 0 -40px 60px rgba(0,0,0,.45)}
.qi-curtain i:first-child{transform-origin:left;animation:qiCl 1.8s cubic-bezier(.6,0,.2,1) .5s forwards}
.qi-curtain i:last-child{transform-origin:right;animation:qiCr 1.8s cubic-bezier(.6,0,.2,1) .5s forwards}
.qi-curtain::after{content:"";position:absolute;left:0;right:0;top:0;height:46px;background:repeating-linear-gradient(90deg,#8A2433 0 22px,#6E1A27 22px 44px);border-bottom:3px solid #C9A25E;border-radius:0 0 50% 50%/0 0 22px 22px;box-shadow:0 8px 16px rgba(0,0,0,.4)}
@keyframes qiCl{to{transform:translateX(-96%) scaleX(.35)}}
@keyframes qiCr{to{transform:translateX(96%) scaleX(.35)}}
.qi-spot{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(60% 30% at 50% 10%,rgba(255,220,150,.16),transparent 70%)}

/* 3. BOTANİKA */
.t-bot{--bg:#F4F1E9;--card:rgba(255,255,252,.88);--soft:#EBEFE3;--ink:#26302A;--muted:#6E7A6C;--accent:#5E7A5A;--on-accent:#fff;--line:#DDE3D3;--line-strong:#B9C6AD;--f-display:var(--f-serif)}
.t-bot .qi-names{font-size:50px}
.t-bot .qi-names .amp{font-family:var(--f-script);font-size:44px}
.qi-vines{position:absolute;left:0;right:0;top:0;height:min(100%,900px);z-index:0;pointer-events:none;width:100%}
.qi-vines .stem{fill:none;stroke:#7E9A72;stroke-width:1.6;stroke-dasharray:600;stroke-dashoffset:600;animation:qiDraw 2.6s ease forwards}
.qi-vines .leaf{fill:#9DB38E;opacity:.85;transform-box:fill-box;transform-origin:center;transform:scale(0);animation:qiLeaf .8s cubic-bezier(.34,1.5,.64,1) forwards}
.qi-vines .bud{fill:#FFFDF6;stroke:#D9CDB0;stroke-width:.8;transform-box:fill-box;transform-origin:center;transform:scale(0);animation:qiLeaf .9s cubic-bezier(.34,1.5,.64,1) forwards}
@keyframes qiDraw{to{stroke-dashoffset:0}}
@keyframes qiLeaf{to{transform:scale(1)}}
.qi-petal{position:absolute;top:-20px;width:10px;height:13px;border-radius:60% 0 60% 0;background:#F6E9E1;opacity:.9;z-index:2;pointer-events:none;animation:qiFall linear forwards}
@keyframes qiFall{to{transform:translate(var(--dx),760px) rotate(540deg);opacity:0}}

/* 4. EDİTORİAL */
.t-edit{--bg:#F3F1EC;--card:#FBFAF7;--soft:#ECE9E2;--ink:#151515;--muted:#6C6862;--accent:#151515;--on-accent:#F3F1EC;--line:#DEDAD2;--line-strong:#151515;--f-display:var(--f-didone)}
.t-edit .qi-card{border-radius:4px}
.t-edit .qi-names{font-size:60px;letter-spacing:-.02em;text-align:left;line-height:.94}
.t-edit .qi-names .amp{font-style:italic;color:#A88B5C;font-size:44px}
.t-edit .qi-kicker,.t-edit .qi-greet{text-align:left}
.t-edit .qi-date{justify-content:flex-start}
.t-edit .qi-date::before{display:none}
.t-edit .qi-brand{text-align:left;padding-left:0}
.t-edit .qi-btn,.t-edit .qi-yes,.t-edit .qi-no,.t-edit .qi-ph{border-radius:2px}
.qi-issue{display:flex;justify-content:space-between;font:600 10px var(--f-ui);letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid #151515;padding-bottom:8px;margin-bottom:6px}
.qi-wipe{position:fixed;background:#151515;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 20px;animation:qiWipe 1.1s cubic-bezier(.7,0,.2,1) .9s forwards}
.qi-contained .qi-wipe{position:absolute}
.qi-wipe span{font:italic 500 40px "Bodoni Moda",Didot,Georgia,serif;color:#F3F1EC;animation:qiWtext .9s ease both}
@keyframes qiWipe{to{clip-path:inset(0 0 100% 0);visibility:hidden}}
@keyframes qiWtext{from{opacity:0;letter-spacing:.3em}to{opacity:1;letter-spacing:0}}

/* 5. ULDUZLU GECƏ */
.t-gece{--bg:#0B1226;--card:rgba(20,30,58,.8);--soft:rgba(255,255,255,.06);--ink:#EEF0F8;--muted:#A3ABC6;--accent:#E3C27A;--on-accent:#0B1226;--line:rgba(227,194,122,.18);--line-strong:rgba(227,194,122,.45);--f-display:var(--f-serif);background:radial-gradient(100% 60% at 50% 0%,#1B2650,#0B1226 70%)}
.t-gece .qi-names{font-size:48px;font-style:italic;background:linear-gradient(180deg,#FFF3D6,#E3C27A);-webkit-background-clip:text;background-clip:text;color:transparent}
.t-gece .qi-names .amp{-webkit-text-fill-color:#E3C27A}
.t-gece .qi-card{backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.qi-sky{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
.qi-moon{position:absolute;right:26px;top:34px;width:46px;height:46px;border-radius:50%;box-shadow:-10px 6px 0 0 #F4E3B8;z-index:0;opacity:.9}

@media (prefers-reduced-motion:reduce){
  .qi-stage *,.qi-stage *::before,.qi-stage *::after{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}
}
`;

export function InviteStyles(){ return <style>{INVITE_CSS}</style>; }

// ── Fon effektləri (pərdə işığı, yarpaqlar, ulduzlar) ──
function Backdrop({ id }){
  const canvasRef = useRef(null);
  useEffect(()=>{
    if(id!=="gece" || !canvasRef.current) return;
    const c = canvasRef.current, ctx = c.getContext("2d"), host = c.parentElement;
    const dpr = window.devicePixelRatio||1;
    const size = ()=>{ c.width = host.clientWidth*dpr; c.height = host.clientHeight*dpr; };
    size();
    const stars = Array.from({length:160},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.3+.3,p:Math.random()*6.28,s:.6+Math.random()*1.6}));
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shoot=null, raf=0;
    const draw = ts=>{
      if(Math.abs(c.width-host.clientWidth*dpr)>2 || Math.abs(c.height-host.clientHeight*dpr)>2) size();
      ctx.clearRect(0,0,c.width,c.height);
      for(const s of stars){
        const a = still?.7:.35+.65*Math.abs(Math.sin(s.p+ts/1000*s.s));
        ctx.fillStyle = "rgba(255,244,214,"+a+")"; ctx.beginPath(); ctx.arc(s.x*c.width,s.y*c.height,s.r*dpr,0,6.28); ctx.fill();
      }
      if(!still){
        if(!shoot && Math.random()<.004) shoot={x:Math.random()*c.width*.6,y:Math.random()*Math.min(c.height,900*dpr)*.3,l:0};
        if(shoot){
          shoot.l+=14;
          const g=ctx.createLinearGradient(shoot.x,shoot.y,shoot.x+shoot.l,shoot.y+shoot.l*.4);
          g.addColorStop(0,"rgba(255,240,200,0)"); g.addColorStop(1,"rgba(255,240,200,.9)");
          ctx.strokeStyle=g; ctx.lineWidth=1.5*dpr; ctx.beginPath(); ctx.moveTo(shoot.x,shoot.y); ctx.lineTo(shoot.x+shoot.l,shoot.y+shoot.l*.4); ctx.stroke();
          if(shoot.l>260) shoot=null;
        }
        raf = requestAnimationFrame(draw);
      }
    };
    raf = requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(raf);
  },[id]);

  const [petals] = useState(()=>Array.from({length:14},()=>({left:Math.random()*100, dx:Math.random()*80-40, dur:5+Math.random()*4, delay:1+Math.random()*4})));

  if(id==="perde") return <div className="qi-spot" aria-hidden="true"/>;
  if(id==="gece") return <><canvas ref={canvasRef} className="qi-sky" aria-hidden="true"/><div className="qi-moon" aria-hidden="true"/></>;
  if(id==="bot"){
    const L=[[60,70,.3],[30,140,.6],[90,40,.9],[20,220,1.1],[340,90,.5],[370,40,.8],[350,170,1.2],[60,600,1.4],[340,620,1.6],[30,520,1.8]];
    return (
      <>
        <svg className="qi-vines" viewBox="0 0 400 700" preserveAspectRatio="none" aria-hidden="true">
          <path className="stem" d="M0 10 C80 60 40 140 110 30"/>
          <path className="stem" d="M0 260 C60 200 10 120 70 80" style={{animationDelay:".3s"}}/>
          <path className="stem" d="M400 0 C330 60 390 140 320 200" style={{animationDelay:".2s"}}/>
          <path className="stem" d="M0 700 C60 640 30 580 90 560" style={{animationDelay:".6s"}}/>
          <path className="stem" d="M400 700 C340 650 380 600 320 580" style={{animationDelay:".8s"}}/>
          {L.map(([x,y,d],i)=><ellipse key={i} className="leaf" cx={x} cy={y} rx="14" ry="7" transform={`rotate(${i*37} ${x} ${y})`} style={{animationDelay:d+"s"}}/>)}
          <circle className="bud" cx="110" cy="30" r="9" style={{animationDelay:"1.9s"}}/>
          <circle className="bud" cx="320" cy="200" r="8" style={{animationDelay:"2.1s"}}/>
          <circle className="bud" cx="90" cy="560" r="8" style={{animationDelay:"2.3s"}}/>
        </svg>
        {petals.map((p,i)=><i key={i} className="qi-petal" style={{left:p.left+"%","--dx":p.dx+"px",animationDuration:p.dur+"s",animationDelay:p.delay+"s"}}/>)}
      </>
    );
  }
  return null;
}

// ── Açılış animasiyası ──
function Intro({ id, title }){
  const [phase, setPhase] = useState("show"); // show → open → gone
  useEffect(()=>{
    if(id==="perde"){ const t=setTimeout(()=>setPhase("gone"),2300); return ()=>clearTimeout(t); }
    if(id==="edit"){ const t=setTimeout(()=>setPhase("gone"),2100); return ()=>clearTimeout(t); }
  },[id]);
  useEffect(()=>{
    if(phase!=="open") return;
    const t=setTimeout(()=>setPhase("gone"),1700); return ()=>clearTimeout(t);
  },[phase]);
  if(phase==="gone" && id!=="zerf") return null;

  if(id==="zerf"){
    const open=()=>{ if(phase==="show") setPhase("open"); };
    if(phase==="gone") return null;
    return (
      <div className={"qi-overlay qi-env"+(phase==="open"?" open":"")} role="button" tabIndex={0} aria-label="Zərfi aç"
        onClick={open} onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); } }}
        style={phase==="open"?{animation:"qiOut .6s ease 1.2s forwards"}:undefined}>
        <div className="qi-envbox">
          <div className="qi-envback"/>
          <div className="qi-envcard">{title}</div>
          <div className="qi-envfront"/>
          <div className="qi-envflap"/>
          <div className="qi-seal">Q</div>
        </div>
        <div className="qi-envhint">AÇMAQ ÜÇÜN TOXUNUN</div>
      </div>
    );
  }
  if(id==="perde") return <div className="qi-overlay qi-curtain" aria-hidden="true"><i/><i/></div>;
  if(id==="edit") return <div className="qi-overlay qi-wipe" aria-hidden="true"><span>{title}</span></div>;
  return null;
}

// ── Səhnə: tema sinfi + fon + açılış ──
// contained=true → seçim qalereyasındakı önizləmə (çərçivə içində); false → tam səhifə
export function InviteStage({ themeIndex, title, contained=false, replayKey=0, children }){
  const th = themeAt(themeIndex);
  return (
    <div key={th.id+"_"+replayKey} className={"qi-stage t-"+th.id+(contained?" qi-contained":" qi-full")}>
      <InviteStyles/>
      <Backdrop id={th.id}/>
      {children}
      <Intro id={th.id} title={title}/>
    </div>
  );
}

const PIN = <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.8.4.3 1 .3 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8Z"/><circle cx="12" cy="10" r="3.2" fill="#fff"/></svg>;
const WAZE = <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#05C1F1"/><circle cx="9" cy="11" r="1.4" fill="#1A1A2E"/><circle cx="15" cy="11" r="1.4" fill="#1A1A2E"/><path d="M8 15c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" stroke="#1A1A2E" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>;
const YDX = <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FC3F1D"/><text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Georgia,serif" fill="#fff">Y</text></svg>;

// ── Əsas dəvət kartı: adlar, salam, tarix, zal, xəritə ──
export function InviteHero({ themeIndex, kicker="Toy dəvətnaməsi", boy, girl, evName, greeting, date, hall, address, photoUrl, mapsQuery, issue }){
  const th = themeAt(themeIndex);
  const couple = boy&&girl;
  let names;
  if(!couple) names = evName||"Məclis";
  else if(th.id==="zerf") names = <>{boy}<span className="sc amp">&amp;</span>{girl}</>;
  else if(th.id==="edit") names = <>{boy}<br/><span className="amp">&amp;</span> {girl}</>;
  else names = <>{boy} <span className="amp">&amp;</span><br/>{girl}</>;
  const q = encodeURIComponent(mapsQuery||hall||"");
  return (
    <article className="qi-card qi-reveal qi-d1">
      {th.id==="edit"&&<div className="qi-issue"><span>{issue||"Dəvət"}</span><span>QONAQ</span></div>}
      <div className="qi-kicker">{kicker}</div>
      <h1 className="qi-names">{names}</h1>
      {greeting&&<p className="qi-greet">{greeting}</p>}
      {date&&<div className="qi-date">{date}</div>}
      {hall&&(
        <div className="qi-venue">
          <div className="qi-ph">
            {photoUrl?<img src={photoUrl} alt=""/>:(
              <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5-9 9"/></svg>Foto</>
            )}
          </div>
          <div style={{minWidth:0}}><h3>{hall}</h3><p>{address||"Ünvan əlavə olunacaq"}</p></div>
        </div>
      )}
      {hall&&(
        <div className="qi-maps">
          <a className="qi-btn" href={"https://www.google.com/maps/search/?api=1&query="+q} target="_blank" rel="noreferrer">{PIN}Google</a>
          <a className="qi-btn" href={"https://waze.com/ul?q="+q+"&navigate=yes"} target="_blank" rel="noreferrer">{WAZE}Waze</a>
          <a className="qi-btn" href={"https://yandex.com/maps/?text="+q} target="_blank" rel="noreferrer">{YDX}Yandex</a>
        </div>
      )}
    </article>
  );
}

// ── İstifadəçinin öz videosu / şəkli ──
export function InviteMedia({ media }){
  if(!media||!media.url) return null;
  return (
    <section className="qi-card qi-media qi-reveal qi-d2">
      {media.type==="video"
        ? <video src={media.url} controls playsInline preload="metadata"/>
        : <img src={media.url} alt=""/>}
    </section>
  );
}

// ── Masa: real oturacaq sırası + masa yoldaşları ──
export function buildSeatOwners(guests, n){
  const seatOwner = new Array(n).fill(null);
  const fallback = [];
  (guests||[]).forEach((g,gi)=>{
    const parts = [];
    for(let i=0;i<(g.count||1);i++) parts.push({isUshaq:false,isSpouse:false});
    for(let i=0;i<(g.spouseCount||0);i++) parts.push({isUshaq:false,isSpouse:true});
    for(let i=0;i<(g.ushaqCount||0);i++) parts.push({isUshaq:true,isSpouse:false});
    if(g.seatIdx!=null && g.seatIdx>=0 && g.seatIdx<n){
      let placed=0;
      for(let off=0; off<n && placed<parts.length; off++){
        const idx=(g.seatIdx+off)%n;
        if(seatOwner[idx]===null){ seatOwner[idx]={g,gi,...parts[placed]}; placed++; }
      }
      for(let k=placed;k<parts.length;k++) fallback.push({g,gi,...parts[k]});
    } else parts.forEach(p=>fallback.push({g,gi,...p}));
  });
  let ptr=0, overflow=0;
  fallback.forEach(item=>{
    while(ptr<n && seatOwner[ptr]!==null) ptr++;
    if(ptr<n){ seatOwner[ptr]=item; ptr++; } else overflow++;
  });
  return { seatOwner, overflow };
}
function effGender(item){
  if(!item) return null;
  if(item.isUshaq) return "ushaq";
  if(item.isSpouse) return item.g.gender==="qadin"?"kishi":"qadin";
  return item.g.gender||"kishi";
}
const SEAT_IMG = { kishi:"seat-man", qadin:"seat-woman", ushaq:"seat-child" };
const RATIO = { kishi:.804, qadin:.811, ushaq:.871, empty:.864 };

export function InviteTable({ tableId, seats, guests=[], guestName="" }){
  if(!seats){
    return (
      <section className="qi-card qi-reveal qi-d2" style={{textAlign:"center"}}>
        <div style={{fontSize:13,color:"var(--ink)",fontWeight:500}}>Masanız təşkilatçı tərəfindən təyin edildikdə burada görünəcək.</div>
      </section>
    );
  }
  const n = Math.min(seats,16);
  const { seatOwner, overflow } = buildSeatOwners(guests, n);
  const cx=240, cy=235, r=88;
  const seatW = Math.max(30, Math.min(56, (2*Math.PI*r)/n*.86));
  const data = seatOwner.map((item,i)=>{
    const a=(2*Math.PI/n)*i-Math.PI/2, rot=a*180/Math.PI+90;
    const g=effGender(item), h=seatW/(item?RATIO[g]:RATIO.empty);
    const isMe = !!(item && item.g.name && item.g.name===guestName && !item.isSpouse && !item.isUshaq);
    const first = item && (item.isSpouse||item.isUshaq) ? "" : (item ? (item.g.name||"").split(" ")[0] : "");
    const anchor = Math.cos(a)>.2?"start":Math.cos(a)<-.2?"end":"middle";
    const l1=r+h*.62, l2=l1+16, l3=l2+4;
    return {i,a,rot,sx:cx+r*Math.cos(a),sy:cy+r*Math.sin(a),item,g,h,isMe,first,anchor,l1,l2,l3};
  });
  return (
    <section className="qi-card qi-tbl qi-reveal qi-d2">
      <div className="qi-sech"><h2>Masa<span>{tableId}</span></h2><small>Sizin yeriniz</small></div>
      <svg viewBox={`${cx-205} ${cy-190} 410 380`} role="img" aria-label={"Masa "+tableId+", "+n+" yerlik"}>
        <image href={ASSET("table")} x={cx-84} y={cy-84} width="168" height="168"/>
        <image href={ASSET("flowers")} x={cx-26} y={cy+4} width="52" height="50"/>
        <text x={cx} y={cy-14} textAnchor="middle" style={{font:"500 32px var(--f-display)",fill:"#80653C"}}>{tableId}</text>
        {data.filter(d=>d.first).map(d=>(
          <g key={"l"+d.i}>
            <line x1={cx+d.l1*Math.cos(d.a)} y1={cy+d.l1*Math.sin(d.a)} x2={cx+d.l2*Math.cos(d.a)} y2={cy+d.l2*Math.sin(d.a)} strokeWidth="1"/>
            <text className="nm" x={cx+d.l3*Math.cos(d.a)} y={cy+d.l3*Math.sin(d.a)} textAnchor={d.anchor} dominantBaseline="middle">{d.first}</text>
            {d.isMe&&(
              <g transform={`translate(${cx+d.l3*Math.cos(d.a)},${cy+d.l3*Math.sin(d.a)+15})`}>
                <rect x="-15" y="-8" width="30" height="14" rx="7" style={{fill:"var(--accent)"}}/>
                <text x="0" y="2" textAnchor="middle" style={{font:"700 8.5px var(--f-ui)",fill:"var(--on-accent)"}}>Siz</text>
              </g>
            )}
          </g>
        ))}
        {data.map(d=>(
          <g key={"s"+d.i} transform={`translate(${d.sx},${d.sy}) rotate(${d.rot})`}>
            <image className="qi-seatIn" style={{animationDelay:(.9+d.i*.07)+"s"}} href={ASSET(d.item?SEAT_IMG[d.g]:"chair-empty")}
              x={-seatW/2} y={-d.h/2} width={seatW} height={d.h} opacity={d.item?1:.55}/>
            {d.isMe&&<circle r={seatW*.56} fill="none" style={{stroke:"var(--accent)"}} strokeWidth="2"/>}
          </g>
        ))}
      </svg>
      {overflow>0&&<div className="qi-warn">Bu masaya {overflow} nəfər tutumdan artıq təyin edilib — təşkilatçı ilə əlaqə saxlayın.</div>}
      {guests.length>0&&(
        <div className="qi-mates">
          {guests.map((g,i)=>{
            const isMe = g.name===guestName;
            const gen = g.gender==="qadin"?"qadin":g.gender==="ushaq"?"ushaq":"kishi";
            const ex=[];
            if(g.count>1) ex.push(g.count+" nəfər");
            if(g.spouseCount>0) ex.push("həyat yoldaşı ilə");
            if(g.ushaqCount>0) ex.push(g.ushaqCount+" uşaq");
            return (
              <div className="qi-mate" key={i}>
                <span className="qi-num">{g.seatIdx!=null?g.seatIdx+1:i+1}</span>
                <span className={"qi-av"+(isMe?" me":"")}><img src={ASSET(SEAT_IMG[gen])} alt=""/></span>
                <span className="n">{g.name||"Adsız"}{isMe&&<span className="qi-siz">Siz</span>}{ex.length>0&&<span className="x">{ex.join(" · ")}</span>}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Seçim qalereyası üçün nümunə məlumatla tam önizləmə ──
export function InviteDemo({ themeIndex, obData={}, hallName="", replayKey=0 }){
  const boy = obData.boy||"Orxan", girl = obData.girl||"Ceyhun";
  const sample = [
    {name:"Ziya Həsənov",gender:"kishi",seatIdx:0},
    {name:"Mesti Quliyeva",gender:"qadin",seatIdx:1},
    {name:"Tural Nağıyev",gender:"kishi",seatIdx:3},
    {name:"Günel Əsgərova",gender:"qadin",seatIdx:4},
    {name:"Rəşad Vəliyev",gender:"kishi",seatIdx:7},
  ];
  return (
    <InviteStage themeIndex={themeIndex} title={boy+" & "+girl} contained replayKey={replayKey}>
      <div className="qi-inv">
        <div className="qi-brand qi-reveal">QONAQ</div>
        <InviteHero themeIndex={themeIndex} boy={boy} girl={girl} greeting={<>Əziz <b>Ziya</b>, sizi toyumuza dəvət edirik.</>}
          date={obData.date||"30 Sentyabr 2026 · 18:00"} hall={hallName||"Zalın adı"} address="Bakı"/>
        <InviteTable tableId={22} seats={10} guests={sample} guestName="Ziya Həsənov"/>
        <section className="qi-card qi-reveal qi-d3">
          <h2 className="qi-h">Bizimlə olacaqsınız?</h2>
          <div className="qi-row"><button className="qi-yes" type="button">✓ İştirak edəcəyəm</button><button className="qi-no" type="button">Gələ bilməyəcəyəm</button></div>
        </section>
      </div>
    </InviteStage>
  );
}

// ── Qalereya kartı üçün kiçik statik önizləmə ──
export function InviteThumb({ themeIndex, boy="Orxan", girl="Ceyhun" }){
  const th = themeAt(themeIndex);
  return (
    <div className={"qi-stage t-"+th.id+" qi-contained"} style={{aspectRatio:"3/4",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:12,textAlign:"center"}}>
      <InviteStyles/>
      <div className="qi-kicker" style={{fontSize:8,position:"relative",zIndex:1}}>Dəvətnamə</div>
      <div className="qi-names" style={{fontSize:th.id==="edit"?26:24,margin:0,position:"relative",zIndex:1,textAlign:"center"}}>{boy}<br/><span className="amp" style={{fontSize:th.id==="edit"?20:"inherit"}}>&amp;</span> {girl}</div>
      <div style={{width:30,height:1,background:"var(--line-strong)",position:"relative",zIndex:1}}/>
      {th.id==="zerf"&&<div style={{width:22,height:22,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%,#B8463C,#7D1F1A)",position:"relative",zIndex:1}}/>}
      {th.id==="perde"&&<div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#5E1622 0 14%,transparent 14% 86%,#5E1622 86%)",opacity:.8}}/>}
      {th.id==="bot"&&<div style={{position:"absolute",left:-6,top:-6,width:50,height:50,borderRadius:"0 0 60% 0",background:"#9DB38E",opacity:.5}}/>}
      {th.id==="gece"&&<div style={{position:"absolute",inset:0,background:"radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 20%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 75%,#FFF3D6,transparent),radial-gradient(1px 1px at 85% 60%,#fff,transparent)"}}/>}
    </div>
  );
}
