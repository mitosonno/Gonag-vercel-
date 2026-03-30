import { useState, useRef, useEffect } from "react";

const RESTAURANTS = [
  { id:0, name:"Gülüstan Sarayı", address:"Şəhriyar küç. 2, Bakı", halls:[{id:1,name:"Böyük Zal",cap:200,hasLayout:true},{id:2,name:"Kiçik Zal",cap:160,hasLayout:true}] },
  { id:1, name:"Nərgiz Şadlıq Sarayı", address:"Nizami küç. 45, Bakı",halls:[{id:101,name:"Qızıl Zal",cap:300},{id:102,name:"Gümüş Zal",cap:150}] },
  { id:2, name:"Grand Palace", address:"İstiqlaliyyət küç. 12, Bakı",halls:[{id:201,name:"Böyük Zal",cap:400},{id:202,name:"VIP Zal",cap:80}] },
  { id:3, name:"Kristal Saray", address:"H.Cavid pr. 11, Bakı",halls:[{id:301,name:"Böyük Zal",cap:500},{id:302,name:"Kiçik Zal",cap:120}] },
  { id:4, name:"Şüvəlan Park", address:"Şüvəlan, Bakı",halls:[{id:401,name:"Açıq Zal",cap:600},{id:402,name:"Qapalı Zal",cap:200}] },
];

const SYS = `Sən Guliyasan — GONAG.AZ-ın baş event koordinatoru və sales menecerisiən. 30 illik Azərbaycan toy, nişan, ad günü və korporativ məclis təşkili təcrübənə maliksin. Sən həm peşəkar sales host, həm də GONAG.AZ sisteminin tam ekspertisən.

ŞƏXSİYYƏTİN:
- Mehriban, professional, inamlı
- Azərbaycanca danış, qısa və konkret cavablar ver (max 2-3 cümlə)
- Müştərini dinlə, ehtiyacını anla, uyğun həll təklif et
- Həmişə növbəti addımı təklif et ("İndi zal seçək?", "Masaları qurum?")

AZƏRBAYCAN MƏCLİS BİLİYİ:
- Toy: Oğlan evi (sağ tərəf) + Qız evi (sol tərəf) — 60/40 nisbəti
- VIP masa: Bəy-gəlin cütünün qarşısında, mərkəzdə
- Rəqs meydanı: Zal mərkəzində, masalar ətrafında
- Nişan: Daha kiçik, 50-80 nəfər, intimdaha
- Ad günü: Yaşa görə dekor, tort mərasimi
- Korporativ: Sıralar, proyektor, mikrofon lazımdır
- Orta Bakı toyu: 150-300 nəfər, 15-25 masa
- Masa başına: 8-12 nəfər optimal
- Adam başına büdcə: 80-150 AZN (restoran + tort + musiqi)

BAKI RESTORANLAR BİLİYİ:
- Gülüstan Sarayı: Böyük Zal 300 nəfər, Kiçik Zal 160 nəfər — mərkəzi, prestijli
- Nərgiz Şadlıq Sarayı: 300-450 nəfər — Nizami küç, əla servis
- Grand Palace: 400+ nəfər — böyük məclislər üçün
- Kristal Saray: 500 nəfər — H.Cavid pr, geniş park
- Şüvəlan Park: 600 nəfər — açıq hava + qapalı, şəhər kənarı

GONAG.AZ SİSTEMİ (tam bilirsən):
- Məclis növü seç → Bəy/Gəlin adı → Tarix → Restoran → Masa planı
- Masa sxemi: yumru masalar, stullar, real koordinatlar
- Qonaq əlavə et: masa üzərinə klik → ad, nömrə, say
- Yönəlt: masaları başqasına tap ver → WhatsApp link
- Dəvətnamə: WhatsApp vasitəsilə göndər
- Long-press: masaları seç → Yönəlt kodu yarat
- Hazır plan: Gülüstan Sarayı üçün real koordinatlar var

SATIŞ (SALES) BACARIQLAR:
- Müştəri "bilmirəm" deyəndə → seçənəklər təklif et
- Qonaq sayı sorduqda → büdcə hesabla: "150 nəfər × 100 AZN = 15,000 AZN"  
- Restoran müqayisəsi: tutum, qiymət, məkan üstünlüklərini izah et
- Checklist xatırlat: masa planı → qonaq siyahısı → dəvətnamə → yönəltmə
- Xidmət satışı: "GONAG ilə bütün bu işi 10 dəqiqəyə edə bilərsiniz"

AKTİV ƏMRLƏR (cavabın SONUNA əlavə et):
[OPEN_SCHEMA] — masa sxemini aç
[OPEN_REST] — restoran axtarışını aç
[OPEN_INVITE] — dəvətnamə panelini aç
[OPEN_TABLE:ID] — tək masanı seç və aç
[OPEN_MECLIS:ID_ya_ad] — yadda saxlanmış məclisi aç
[ADD_GUEST_PANEL:MasaID] — qonaq əlavə etmə formasını aç (istifadəçi özü doldurur)
[ADD_GUEST:MasaID:Ad:Say] — qonaq əlavə et (agent özü əlavə edir)
[SHOW_STATS] — statistika göstər

Misal: "masa sxemini göstər" → qısa cavab + [OPEN_SCHEMA]
Misal: "Masa 5-ə qonaq əlavə et" → cavab + [OPEN_SCHEMA] + [ADD_GUEST_PANEL:5]
Misal: "Leyla Mehdi məclisini aç" → cavab + [OPEN_MECLIS:Leyla]
Misal: "Masa 5-ə Əli əlavə et 3 nəfər" → cavab + [ADD_GUEST:5:Əli:3]
Misal: "150 nəfər üçün nə tövsiyə edərsən?" → Gülüstan/Nərgiz müqayisəsi + büdcə hesabı`;

function occ(t){ return (t.guests||[]).reduce((s,g)=>{ const uc=g.ushaqCount||0; return s+(g.count||1)+uc; },0); }

function printAll(tables, obData, hall){
  const evName = (obData&&obData.boy&&obData.girl) ? (obData.boy+" & "+obData.girl)
    : ((obData&&obData.name)||(obData&&obData.company)||"Məclis");
  const evDate = (obData&&obData.date)||"";
  const hallName = (hall&&hall.name)||"";
  const totG = tables.reduce(function(s,t){return s+(t.guests||[]).reduce(function(ss,g){return ss+(g.count||1);},0);},0);

  // Masa sxemi SVG
  function masaSxemi(){
    var cols=6, rows=Math.ceil(tables.length/cols);
    var cellW=100, cellH=80, pad=20;
    var svgW=cols*cellW+pad*2, svgH=rows*cellH+pad*2;
    var cells="";
    tables.forEach(function(t,i){
      var col=i%cols, row=Math.floor(i/cols);
      var x=pad+col*cellW+cellW/2, y=pad+row*cellH+cellH/2;
      var r=28;
      var filled=occ(t), total=t.seats||10;
      var pct=Math.min(1,filled/total);
      var sc=t.side==="Oğlan evi"?"#4a7aaa":t.side==="Qız evi"?"#aa4a7a":pct>=1?"#3a8a48":"#8a6a30";
      var bg=t.side==="Oğlan evi"?"#e8f0f8":t.side==="Qız evi"?"#f8e8f0":pct>=1?"#e8f5ec":"#f8f3ea";
      // Stullar
      var chairs="";
      for(var j=0;j<Math.min(total,12);j++){
        var a=(2*Math.PI/Math.min(total,12))*j-Math.PI/2;
        var sx=x+(r+10)*Math.cos(a), sy=y+(r+10)*Math.sin(a);
        var cf=j<filled?sc:"#ccc";
        chairs+='<circle cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="4" fill="'+cf+'" opacity="0.8"/>';
      }
      cells+=chairs;
      cells+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+bg+'" stroke="'+sc+'" stroke-width="2"/>';
      cells+='<text x="'+x+'" y="'+(y-5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+sc+'">'+t.id+'</text>';
      cells+='<text x="'+x+'" y="'+(y+8)+'" text-anchor="middle" font-size="9" fill="#666">'+filled+'/'+total+'</text>';
      if(t.label&&t.label!=="__extra__"){
        cells+='<text x="'+x+'" y="'+(y+r+14)+'" text-anchor="middle" font-size="8" fill="#888">'+t.label.substring(0,8)+'</text>';
      }
    });
    return '<svg width="'+svgW+'" height="'+svgH+'" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">'+cells+'</svg>';
  }

  // Qonaq siyahısı cədvəli
  var rows2="";
  tables.forEach(function(t){
    var guests=t.guests||[];
    guests.forEach(function(g){
      var sc=t.side==="Oğlan evi"?"#1a4a7a":t.side==="Qız evi"?"#7a1a4a":"#5a3a10";
      rows2+="<tr><td>"+g.name+"</td>"
        +"<td style='text-align:center;font-weight:700;color:"+sc+"'>"+t.id+"</td>"
        +"<td>"+(t.label&&t.label!=="__extra__"?t.label:"")+"</td>"
        +"<td style='color:#666'>"+(t.side||"")+"</td>"
        +"<td style='text-align:center'>"+(g.count||1)+(g.ushaqCount>0?" + "+g.ushaqCount+" uşaq":"")+"</td>"
        +"<td style='color:#888'>"+(g.phone||"—")+"</td>"
        +"<td style='text-align:center'>"+(g.invited?"✓":"")+"</td>"
        +"</tr>";
    });
  });

  var html="<!DOCTYPE html><html><head><meta charset='utf-8'>"
    +"<title>"+evName+"</title>"
    +"<style>*{margin:0;padding:0;box-sizing:border-box}"
    +"body{font-family:Georgia,serif;padding:24px;color:#1a1208;background:#fffef8}"
    +"h1{font-size:24px;color:#8a6030;margin-bottom:4px;text-align:center}"
    +".sub{text-align:center;color:#999;font-size:13px;margin-bottom:24px}"
    +"h2{font-size:16px;color:#8a6030;margin:20px 0 10px;padding-bottom:6px;border-bottom:2px solid #c9a84c}"
    +".stats{display:flex;gap:20px;margin-bottom:20px}"
    +".stat{background:#f5edd0;border-radius:8px;padding:10px 16px;text-align:center}"
    +".stat-n{font-size:22px;font-weight:800;color:#8a6030}"
    +".stat-l{font-size:11px;color:#999;margin-top:2px}"
    +"table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}"
    +"th{padding:8px 10px;text-align:left;background:#f5edd0;color:#8a6030;font-weight:700;border-bottom:2px solid #c9a84c}"
    +"td{padding:7px 10px;border-bottom:1px solid #e8dcc8}"
    +"tr:nth-child(even){background:#faf5ee}"
    +".footer{margin-top:20px;text-align:center;font-size:10px;color:#bbb;padding-top:12px;border-top:1px solid #e8dcc8}"
    +"@media print{body{padding:16px}.no-print{display:none}}"
    +"</style></head><body>"
    +"<h1>"+evName+"</h1>"
    +"<div class='sub'>"+(evDate?evDate+" · ":"")+hallName+" · "+tables.length+" masa · "+totG+" qonaq</div>"
    +"<div class='stats'>"
    +"<div class='stat'><div class='stat-n'>"+tables.length+"</div><div class='stat-l'>Masa</div></div>"
    +"<div class='stat'><div class='stat-n'>"+totG+"</div><div class='stat-l'>Qonaq</div></div>"
    +"<div class='stat'><div class='stat-n'>"+tables.flatMap(function(t){return t.guests;}).filter(function(g){return g.invited;}).length+"</div><div class='stat-l'>Dəvət göndərildi</div></div>"
    +"<div class='stat'><div class='stat-n'>"+tables.flatMap(function(t){return t.guests;}).filter(function(g){return !g.invited;}).length+"</div><div class='stat-l'>Gözləyir</div></div>"
    +"</div>"
    +"<h2>🗺️ Zal Sxemi</h2>"
    +masaSxemi()
    +"<h2>👥 Qonaq Siyahısı</h2>"
    +"<table><thead><tr>"
    +"<th>Ad Soyad</th><th style='text-align:center'>Masa №</th><th>Masa adı</th>"
    +"<th>Tərəf</th><th style='text-align:center'>Say</th><th>Telefon</th><th style='text-align:center'>Dəvət</th>"
    +"</tr></thead><tbody>"+rows2+"</tbody></table>"
    +"<div class='footer'>GONAG.AZ — "+new Date().toLocaleDateString("az-AZ")+"</div>"
    +"</body></html>";

  var w=window.open("","_blank","width=1000,height=800");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function(){w.print();},600);
}

// ── SUPABASE ──────────────────────────────────
const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, options={}){
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      "Prefer": options.prefer||"",
      ...(options.headers||{})
    }
  });
  if(!res.ok){ const e=await res.text(); console.error("SB error:",e); return null; }
  try{ return await res.json(); }catch{return null;}
}

async function sbSaveEvent(ev){
  if(!ev||!ev.id) return;
  const tablesWithMeta = {
    _meta: {
      evType: ev.evType||"",
      obStep: ev.obStep||"",
      obData: ev.obData||{},
      hall: ev.hall||null,
      msgs: (ev.msgs||[]).slice(-10),
      hist: (ev.hist||[]).slice(-10),
      totalGuests: ev.totalGuests||0,
      savedAt: ev.savedAt||Date.now()
    },
    rows: ev.tables||[]
  };
  const body = {
    session_id: ev.sessionId||"gonag_user_main",
    type: ev.evType||ev.type||"",
    couple: ev.obData?.boy&&ev.obData?.girl ? ev.obData.boy+" & "+ev.obData.girl : ev.obData?.name||ev.obData?.company||"",
    date: ev.obData?.date||"",
    hall_name: ev.hall?.name||ev.hallName||"",
    hall_total: ev.hall?.totalGuests||ev.hallTotal||0,
    hall_seats: ev.hall?.seatsPerTable||ev.hallSeats||0,
    tables: tablesWithMeta,
    status: ev.status||"natamam"
  };
  if(ev.dbId){
    const res = await sbFetch("events?id=eq."+ev.dbId, {
      method:"PATCH", prefer:"return=representation",
      body: JSON.stringify({...body, updated_at: new Date().toISOString()})
    });
    return ev.dbId; // PATCH-də eyni dbId qaytar
  } else {
    const res = await sbFetch("events", {
      method:"POST", prefer:"return=representation",
      headers:{"Prefer":"return=representation"},
      body: JSON.stringify(body)
    });
    return res&&res[0]?res[0].id:null;
  }
}

async function sbLoadEvents(sessionId){
  return await sbFetch("events?session_id=eq."+encodeURIComponent(sessionId)+"&order=created_at.desc") || [];
}

async function sbDeleteEvent(dbId){
  await sbFetch("events?id=eq."+dbId, {method:"DELETE"});
}

async function sbGetVenues(){
  return await sbFetch("venues?order=name") || [];
}

async function sbGetHalls(venueId){
  return await sbFetch("halls?venue_id=eq."+venueId+"&order=name") || [];
}

async function sbSearchVenues(query){
  return await sbFetch("venues?name=ilike.*"+encodeURIComponent(query)+"*&order=name&limit=5") || [];
}

// Gülüstan Sarayı — Böyük Zal planı (real floor plan koordinatları)
const DEMO_HALL = {
  id: "demo_1",
  name: "Böyük Zal",
  venue_name: "Gülüstan Sarayı",
  capacity: 300,
  // Şəkil: real zal planı üzərindən götürülmüş koordinatlar
  imageUrl: "data:image/jpeg;base64,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0/78/wD16PIvP+fxf+/I/wAatUUAVfIvP+f0f9+R/jR5F3/z+f8AkIVaooAq/Z7v/n9/8hCoxY3AnaYXrb2UKf3S9ASf61eooAq/Z7v/AJ/j/wB+lo+z3X/P63/ftatUUAVfs91/z/N/37Wj7Pdf8/z/APftf8KtUUAVfs11/wA/z/8Aftf8KX7Pcf8AP7J/37T/AAqzRQBW+z3H/P7J/wB8J/hR9muP+f6X/vhP8Ks0UAVvs1x/z/S/98J/hSfZrj/n+l/74T/CrVFAFX7Lcf8AP/N/3wn+FH2W4/5/5v8AvhP8KtUUAVPslx/z/wA//fCf/E0fZJ/+f+f/AL5T/wCJq3RQBVFrODzfTn/gKf8AxNRxJd2zzBY1mV33B2k2noOwHtV6igClFDdm4mmYxw7wo2/f6e/FTeXdf8/Ef/fr/wCvU9FAEHl3X/Pwn/fr/wCvR5dz/wA/Cf8Afr/69T0UAQeXdf8APwn/AH6/+vR5d1/z8R/9+v8A69T0UAQeXdf8/Ef/AH6/+vR5d1/z8R/9+v8A69T0UAVZ7a4uLeSF7hAsilSRFzg/jTliuVUKJ4+Bj/Vf/XqxRQBBsuv+e8f/AH6P/wAVRsuv+e8f/fo//FVPRQBB5d1/z8R/9+j/APFUeXdf8/Ef/fr/AOyqeigCHZc/894/+/R/+KpNlz/z3j/79H/Gp6KAK7QTSFPMmQqrBsCPGcfjViiigAooooAKKKKACq6wzoCEnULkkAx56nPrViigCHZc/wDPdP8Av1/9ejZc/wDPdP8Av1/9epqKAIfLuf8Anun/AH6/+vUE0Vwbq3PnJxu58vpx9au0UAQeXc/894/+/X/16PLuf+e8f/fr/wCvU9FAEHl3P/PeP/v1/wDXo8u5/wCfiP8A79f/AF6nooAg8u5/5+I/+/X/ANeoDFc/bkPnJnymGfK9x71eooAg8u5/5+E/79f/AF6PLuf+fhP+/X/16nooAg8u5/5+E/79f/Xo8u5/5+E/79f/AF6nooAg8u5/5+E/79f/AF6PLuf+fhP+/X/16nooAg8u5/5+E/79f/Xo8u5/5+E/79f/AF6nooAg8u5/5+E/79f/AF6PLuf+fhP+/X/16nooAg8u5/5+E/79f/Xo8u5/5+E/79f/AF6nooAg8u5/5+E/79f/AF6PLuf+fhf+/f8A9ep6KAIoYWSR5JJN7OAOFxjGf8aloooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9k=",
  layout: [
    {id:1,  xPct:9,  yPct:13, seats:8,  label:""},
    {id:2,  xPct:18, yPct:13, seats:8,  label:""},
    {id:3,  xPct:9,  yPct:27, seats:8,  label:""},
    {id:4,  xPct:18, yPct:27, seats:8,  label:""},
    {id:5,  xPct:33, yPct:13, seats:8,  label:""},
    {id:6,  xPct:43, yPct:13, seats:8,  label:""},
    {id:7,  xPct:33, yPct:25, seats:8,  label:""},
    {id:8,  xPct:43, yPct:25, seats:8,  label:""},
    {id:9,  xPct:68, yPct:11, seats:20, label:"VIP"},
    {id:10, xPct:88, yPct:14, seats:12, label:""},
    {id:11, xPct:68, yPct:28, seats:12, label:""},
    {id:12, xPct:80, yPct:28, seats:12, label:""},
    {id:13, xPct:88, yPct:32, seats:12, label:""},
    {id:14, xPct:53, yPct:43, seats:16, label:""},
    {id:15, xPct:76, yPct:43, seats:10, label:""},
    {id:16, xPct:88, yPct:50, seats:12, label:""},
    {id:17, xPct:10, yPct:52, seats:10, label:""},
    {id:18, xPct:22, yPct:52, seats:10, label:""},
    {id:19, xPct:43, yPct:57, seats:8,  label:""},
    {id:20, xPct:54, yPct:57, seats:8,  label:""},
    {id:21, xPct:65, yPct:57, seats:8,  label:""},
    {id:22, xPct:76, yPct:57, seats:8,  label:""},
    {id:23, xPct:88, yPct:62, seats:8,  label:""},
    {id:24, xPct:10, yPct:75, seats:10, label:""},
    {id:25, xPct:22, yPct:75, seats:10, label:""},
    {id:26, xPct:10, yPct:88, seats:4,  label:""},
    {id:27, xPct:20, yPct:88, seats:4,  label:""},
    {id:28, xPct:43, yPct:78, seats:14, label:""},
    {id:29, xPct:56, yPct:80, seats:14, label:""},
    {id:30, xPct:88, yPct:78, seats:14, label:""},
  ]
};

// ─────────────────────────────────────────────
// Gülüstan Sarayı — Kiçik Zal
// canvasH=380px (16 masa). S≈27px, totalSvgSize≈40px.
// 4mm boşluq ≈ 15px → yPct fərqi ≥ (40+15)/380*100 ≈ 15%
// Sol zona: xPct 9 və 22  (sağ kənar: 22+stulR≈28%)
// Sağ zona: xPct 78 və 91 (sol kənar: 78-stulR≈72%)
// Dance Floor: xPct:50, w:38% → sol kənar 31%, sağ kənar 69% — heç bir masaya toxunmur
const DEMO_HALL_2 = {
  id: "demo_2",
  name: "Kiçik Zal",
  venue_name: "Gülüstan Sarayı",
  capacity: 160,
  elements: [
    { type:"brideGroom", xPct:50, yPct:5,  w:30, h:8,  label:"Bəy & Gəlin"  },
    { type:"danceFloor", xPct:50, yPct:50, w:38, h:24, label:"Rəqs meydanı" },
    { type:"stage",      xPct:8,  yPct:84, w:18, h:9,  label:"Musiqiçilər"  },
    { type:"entrance",   xPct:50, yPct:93, w:22, h:7,  label:"Giriş"        },
  ],
  layout: [
    // Sol sütun 1 (xPct=9)  — yPct: 16, 32, 55, 71  fərq=16
    {id:1,  xPct:9,  yPct:16, seats:8, label:""},
    {id:2,  xPct:9,  yPct:32, seats:8, label:""},
    {id:3,  xPct:9,  yPct:55, seats:8, label:""},
    {id:4,  xPct:9,  yPct:71, seats:8, label:""},
    // Sol sütun 2 (xPct=22) — eyni yPct sıra
    {id:5,  xPct:22, yPct:16, seats:8, label:""},
    {id:6,  xPct:22, yPct:32, seats:8, label:""},
    {id:7,  xPct:22, yPct:55, seats:8, label:""},
    {id:8,  xPct:22, yPct:71, seats:8, label:""},
    // Sağ sütun 1 (xPct=78)
    {id:9,  xPct:78, yPct:16, seats:8, label:""},
    {id:10, xPct:78, yPct:32, seats:8, label:""},
    {id:11, xPct:78, yPct:55, seats:8, label:""},
    {id:12, xPct:78, yPct:71, seats:8, label:""},
    // Sağ sütun 2 (xPct=91)
    {id:13, xPct:91, yPct:16, seats:8, label:""},
    {id:14, xPct:91, yPct:32, seats:8, label:""},
    {id:15, xPct:91, yPct:55, seats:8, label:""},
    {id:16, xPct:91, yPct:71, seats:8, label:""},
  ]
};

// ─────────────────────────────────────────────
function sideColor(s){ return s==="Oğlan evi"?"#7aade8":s==="Qız evi"?"#e87aad":"#c9a84c"; }
function sideBg(s){ return s==="Oğlan evi"?"rgba(122,173,232,.18)":s==="Qız evi"?"rgba(232,122,173,.18)":"rgba(201,168,76,.12)"; }

function parseLine(line){
  const parts = line.split(/[,|;]+/).map(s=>s.trim()).filter(Boolean);
  if(!parts[0]) return null;
  return { name:parts[0], phone:parts[1]||"", count:parseInt(parts[2])||1 };
}

function TableSVG({ table, size=120, clickable=false, onGuestClick, onSlotClick }){
  const guests = table.guests||[];
  const n = Math.min(table.seats||10, 16);
  const r = (size/2)*0.52, cx = size/2, cy = size/2;

  // Build slots: adults + children
  const slots = [];
  guests.forEach(g=>{
    const uc = g.ushaqCount||0;
    for(let i=0;i<(g.count||1);i++) slots.push({g, isUshaq:false});
    for(let i=0;i<uc;i++) slots.push({g, isUshaq:true});
  });

  const totalOcc = occ(table);  // use occ() which includes ushaqCount
  const full = totalOcc >= table.seats;
  const pct = Math.min(1, totalOcc / (table.seats||1));
  const slotR = size>100 ? 10 : 7;

  // Ring color based on fill level
  const tc = full ? "#50c878" : pct > 0.7 ? "#f5a623" : pct > 0 ? "#c9a84c" : "rgba(201,168,76,.35)";

  function slotColor(g, isUshaq){
    if(isUshaq) return "#f5d060";
    if(g.gender==="kishi") return "#7aade8";
    if(g.gender==="qadin") return "#e87aad";
    return sideColor(g.side||"Ümumi");
  }
  function avatarEmoji(g, isUshaq){
    return isUshaq ? "👧" : g.gender==="kishi" ? "👨" : g.gender==="qadin" ? "👩" : null;
  }

  return (
    <svg width={size} height={size} style={{display:"block",margin:"0 auto"}}>
      {/* Background fill indicator arc */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(201,168,76,.04)" stroke="rgba(201,168,76,.12)" strokeWidth="1"/>
      {pct>0&&(
        <circle cx={cx} cy={cy} r={r}
          fill="none"
          stroke={tc}
          strokeWidth={size>100?"3":"2"}
          strokeDasharray={2*Math.PI*r}
          strokeDashoffset={2*Math.PI*r*(1-pct)}
          strokeLinecap="round"
          transform={"rotate(-90 "+cx+" "+cy+")"}
          opacity="0.8"
        />
      )}
      {/* Slot circles */}
      {Array.from({length:n}).map((_,i)=>{
        const a = (i/n)*Math.PI*2 - Math.PI/2;
        const sx = cx+r*Math.cos(a), sy = cy+r*Math.sin(a);
        const slot = slots[i];
        const isEmpty = !slot;
        const g = slot&&slot.g;
        const isUshaq = slot&&slot.isUshaq;
        const sc = g ? slotColor(g, isUshaq) : "rgba(201,168,76,.3)";
        const emoji = g ? avatarEmoji(g, isUshaq) : null;
        return (
          <g key={i} style={{cursor:clickable?"pointer":"default"}} onClick={()=>{
            if(!clickable) return;
            if(isEmpty && onSlotClick) onSlotClick(i);
            else if(g && onGuestClick) onGuestClick(g);
          }}>
            <circle cx={sx} cy={sy} r={slotR}
              fill={isEmpty ? "rgba(8,6,4,.6)" : sc+"33"}
              stroke={sc}
              strokeWidth={isEmpty?"1":"1.8"}
              opacity={isEmpty?0.5:1}
            />
            {isEmpty&&<text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="rgba(201,168,76,.4)" fontWeight="700">+</text>}
            {g&&!isUshaq&&<text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize={slotR*1.1}>{g.gender==="qadin"?"👩":"👨"}</text>}
            {g&&isUshaq&&<text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize={slotR*1.1}>👧</text>}
            {g&&(()=>{
              const ndx=sx-cx, ndy=sy-cy, nd=Math.sqrt(ndx*ndx+ndy*ndy)||1;
              const tx=sx+(ndx/nd)*(slotR+9), ty=sy+(ndy/nd)*(slotR+9);
              const name=g.name.split(" ")[0].substring(0,7);
              return <text key={"lbl"} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#f2e8d0" fontWeight="700"
                style={{textShadow:"0 1px 3px #000"}}>{name}</text>;
            })()}
          </g>
        );
      })}
      {/* Center label */}
      <text x={cx} y={cy-(size>100?6:4)} textAnchor="middle" dominantBaseline="middle"
        fontSize={size>100?11:8} fill={tc} fontWeight="800">
        {table.label==="__extra__"?"Extra":table.label?table.label.substring(0,8):String(table.id)}
      </text>
      <text x={cx} y={cy+(size>100?10:7)} textAnchor="middle" dominantBaseline="middle"
        fontSize={size>100?9:6} fill={full?"#50c878":"rgba(201,168,76,.6)"}>
        {totalOcc}/{table.seats}
      </text>
    </svg>
  );
}

function domSide(t){
  const g=t.guests||[], cnt={};
  g.forEach(x=>{cnt[x.side]=(cnt[x.side]||0)+(x.count||1);});
  return (Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]||["",""])[0]||"";
}


// ─── DEFAULT HALL LAYOUTS ──────────────────────────────────
const HALL_LAYOUTS = {
  default: {
    bg: null,elements: [
      { type:"stage", x:30, y:1, w:40, h:6, label:"🎭 Səhnə" },
      { type:"door",  x:40, y:93, w:20, h:5, label:"🚪 Giriş" },
      { type:"bar",   x:1,  y:1, w:6,  h:8, label:"🍾 Bar" },
    ],
    // default table positions for 20 tables (x%, y% of container)
    tables: [
      {id:1,x:20,y:20},{id:2,x:35,y:20},{id:3,x:50,y:20},{id:4,x:65,y:20},{id:5,x:80,y:20},
      {id:6,x:20,y:38},{id:7,x:35,y:38},{id:8,x:50,y:38},{id:9,x:65,y:38},{id:10,x:80,y:38},
      {id:11,x:20,y:55},{id:12,x:35,y:55},{id:13,x:50,y:55},{id:14,x:65,y:55},{id:15,x:80,y:55},
      {id:16,x:20,y:72},{id:17,x:35,y:72},{id:18,x:50,y:72},{id:19,x:65,y:72},{id:20,x:80,y:72},
      {id:21,x:15,y:82},{id:22,x:28,y:82},{id:23,x:41,y:82},{id:24,x:54,y:82},{id:25,x:67,y:82},{id:26,x:80,y:82},
      {id:27,x:15,y:91},{id:28,x:28,y:91},{id:29,x:41,y:91},{id:30,x:54,y:91},{id:31,x:67,y:91},{id:32,x:80,y:91},
      {id:33,x:15,y:100},{id:34,x:28,y:100},{id:35,x:41,y:100},{id:36,x:54,y:100},{id:37,x:67,y:100},{id:38,x:80,y:100},
      {id:39,x:15,y:109},{id:40,x:28,y:109},{id:41,x:41,y:109},{id:42,x:54,y:109},{id:43,x:67,y:109},{id:44,x:80,y:109},
      {id:45,x:15,y:118},{id:46,x:28,y:118},{id:47,x:41,y:118},{id:48,x:54,y:118},{id:49,x:67,y:118},{id:50,x:80,y:118},
    ]
  }
};


function FpTablePopup({ t, posY, onClose, onSaveLabel, onSaveSide, onExtra }){
  const [nm, setNm] = useState(t.label&&t.label!=="__extra__"?t.label:"");
  const [side, setSide] = useState(t.side||"");
  const isEx = t.label==="__extra__";
  const gold = "#c9a84c";
  const nmRef = useRef(nm);
  useEffect(()=>{ nmRef.current=nm; },[nm]);

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:9999,
      background:"rgba(0,0,0,.72)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"20px"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:320,
        background:"linear-gradient(160deg,#1e1608,#120e04)",
        border:"1.5px solid rgba(201,168,76,.45)",
        borderRadius:18,
        padding:"20px 18px 22px",
        boxShadow:"0 16px 60px rgba(0,0,0,.95)"
      }}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:gold,fontFamily:"'Playfair Display',serif"}}>
              Masa {t.id}
            </div>
            {t.label&&t.label!=="__extra__"&&(
              <div style={{fontSize:11,color:"rgba(201,168,76,.45)",marginTop:2}}>{t.label}</div>
            )}
          </div>
          <button onClick={onClose} style={{
            width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,.1)",
            background:"rgba(255,255,255,.06)",color:"#9a8060",fontSize:14,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"
          }}>✕</button>
        </div>

        {/* Ad input */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(201,168,76,.5)",letterSpacing:1,marginBottom:6}}>
            MASA ADI
          </div>
          <input
            value={nm}
            onChange={e=>setNm(e.target.value)}
            placeholder="Məs: VIP, Ailə, Oğlan 1..."
            autoFocus
            onKeyDown={e=>{ if(e.key==="Enter"){ if(nm.trim()) onSaveLabel(nm.trim()); onClose(); }}}
            style={{
              display:"block",width:"100%",boxSizing:"border-box",
              padding:"11px 14px",
              background:"rgba(255,255,255,.07)",
              border:"1.5px solid rgba(201,168,76,.3)",
              borderRadius:11,color:"#f2e8d0",fontSize:14,
              outline:"none",fontFamily:"'DM Sans',sans-serif",
              transition:"border-color .2s"
            }}
            onFocus={e=>e.target.style.borderColor="rgba(201,168,76,.7)"}
            onBlur={e=>e.target.style.borderColor="rgba(201,168,76,.3)"}
          />
        </div>

        {/* Tərəf seçimi */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(201,168,76,.5)",letterSpacing:1,marginBottom:6}}>
            TƏRƏFİ
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[
              ["Oğlan evi","#7aade8","👦"],
              ["Qız evi","#e87aad","👧"],
              ["Ümumi","#c9a84c","🤝"],
              ["Extra","#b57aff","⊕"]
            ].map(([s,sc,ic])=>{
              const active = s==="Extra" ? isEx : side===s;
              return (
                <button key={s} onClick={()=>{
                    if(s==="Extra"){ onExtra(); onClose(); return; }
                    const newSide = side===s?"":s;
                    setSide(newSide);
                    if(nmRef.current.trim()) onSaveLabel(nmRef.current.trim());
                    onSaveSide(newSide);
                  }}
                  style={{
                    padding:"10px 8px",borderRadius:10,fontSize:12,fontWeight:active?700:500,
                    cursor:"pointer",
                    border:"1.5px solid "+(active?sc:sc+"33"),
                    background:active?sc+"22":"rgba(255,255,255,.03)",
                    color:active?sc:"rgba(255,255,255,.4)",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                    transition:"all .15s"
                  }}>
                  <span>{ic}</span>
                  <span>{s}</span>
                  {active&&<span style={{marginLeft:2,fontSize:10}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* OK button */}
        <button
          onClick={()=>{ if(nm.trim()) onSaveLabel(nm.trim()); onClose(); }}
          style={{
            display:"block",width:"100%",padding:"13px",
            borderRadius:12,border:"2px solid "+gold,
            background:"linear-gradient(90deg,rgba(201,168,76,.25),rgba(201,168,76,.15))",
            color:gold,fontSize:15,fontWeight:800,
            cursor:"pointer",letterSpacing:0.5,
            fontFamily:"'DM Sans',sans-serif"
          }}
        >
          ✓ Saxla
        </button>
      </div>
    </div>
  );
}

function HallPlanSVG({ hallName, venueName, width, height }){
  const W = width || 320;
  const H = height || 360;
  const isGulistan = venueName==="Gülüstan Sarayı" && hallName==="Böyük Zal";

  if(!isGulistan) return null;

  return (
    <svg width={W} height={H} style={{position:"absolute",top:0,left:0,pointerEvents:"none",zIndex:1}}>
      {/* Zal divarları */}
      <rect x={8} y={8} width={W-16} height={H-16} rx={14}
        fill="rgba(30,20,8,0.75)" stroke="rgba(201,168,76,.5)" strokeWidth="2"/>

      {/* SƏHNƏ - yuxarıda */}
      <rect x={W*0.15} y={16} width={W*0.7} height={H*0.09} rx={6}
        fill="rgba(201,168,76,.12)" stroke="rgba(201,168,76,.5)" strokeWidth="1.5"/>
      <text x={W/2} y={16+H*0.045} textAnchor="middle" dominantBaseline="middle"
        fontSize="10" fill="rgba(201,168,76,.7)" fontWeight="700" letterSpacing="2">🎭 SƏHNƏ</text>

      {/* GİRİŞ - aşağıda */}
      <rect x={W*0.35} y={H-30} width={W*0.3} height={20} rx={5}
        fill="rgba(80,200,120,.1)" stroke="rgba(80,200,120,.4)" strokeWidth="1.5"/>
      <text x={W/2} y={H-20} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="rgba(80,200,120,.7)" fontWeight="700">🚪 GİRİŞ</text>

      {/* Sol divar bəzəyi */}
      <line x1={22} y1={H*0.2} x2={22} y2={H*0.85} stroke="rgba(201,168,76,.1)" strokeWidth="1" strokeDasharray="4,6"/>
      {/* Sağ divar bəzəyi */}
      <line x1={W-22} y1={H*0.2} x2={W-22} y2={H*0.85} stroke="rgba(201,168,76,.1)" strokeWidth="1" strokeDasharray="4,6"/>

      {/* Orta xətt (dekorativ) */}
      <line x1={W/2} y1={H*0.18} x2={W/2} y2={H*0.88}
        stroke="rgba(201,168,76,.06)" strokeWidth="1" strokeDasharray="3,8"/>

      {/* Künc dekorları */}
      {[[20,20],[W-20,20],[20,H-20],[W-20,H-20]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={4} fill="none" stroke="rgba(201,168,76,.2)" strokeWidth="1"/>
      ))}

      {/* Zal adı */}
      <text x={W-14} y={H*0.5} textAnchor="middle" dominantBaseline="middle"
        fontSize="7" fill="rgba(201,168,76,.15)" fontWeight="700" letterSpacing="1"
        transform={"rotate(90,"+(W-14)+","+(H*0.5)+")"}
        style={{userSelect:"none"}}>GÜLÜSTAN SARAYI — BÖYÜK ZAL</text>
    </svg>
  );
}

function FloorPlanView({ tables, expandedId, onTableClick, onPositionChange, hall, editMode, onLabelSide, layoutMode, onAddTable }){
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const pinchRef = useRef({active:false});
  const panRef = useRef({active:false});
  const nodeRefs = useRef({});
  const [positions, setPositions] = useState({});
  const [fpPopup, setFpPopup] = useState(null); // tblId
  const [fpPopupTbl, setFpPopupTbl] = useState(null); // actual table object
  const [longPressSelected, setLongPressSelected] = useState(new Set());
  const [showLongPressPanel, setShowLongPressPanel] = useState(false);
  const [longPressResult, setLongPressResult] = useState(null);
  const longPressTimer = useRef(null);
  const [zoom, setZoom] = useState(0.6);
  const [elemPos, setElemPos] = useState({sehne:{x:10,y:2},giris:{x:30,y:88}});
  const drag = useRef(null);
  const pinch = useRef(null);
  const [gridH, setGridH] = useState(300);
  const [pulseId, setPulseId] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const STAGE_H = 48;

  // Native pinch zoom — React bypass, 60fps
  useEffect(function(){
    var wrapper=wrapperRef.current;
    var inner=containerRef.current;
    if(!wrapper||!inner) return;

    function applyT(z,x,y){
      inner.style.transform="translate("+x+"px,"+y+"px) scale("+z+")";
    }

    function onTS(e){
      if(editMode) return;
      if(e.touches.length===2){
        e.preventDefault();
        // Zoom başladı — long press iptal et
        if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}
        var a=e.touches[0], b=e.touches[1];
        pinchRef.current={
          active:true,
          d0:Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY),
          z0:zoomRef.current,
          px0:panXRef.current,
          py0:panYRef.current,
          lz:zoomRef.current
        };
        panRef.current={active:false};
      } else if(e.touches.length===1){
        pinchRef.current={active:false};
        if(zoomRef.current>1.05){
          e.preventDefault();
          panRef.current={
            active:true,
            cx0:e.touches[0].clientX,
            cy0:e.touches[0].clientY,
            px0:panXRef.current,
            py0:panYRef.current,
            lx:panXRef.current,
            ly:panYRef.current
          };
        } else {
          panRef.current={active:false};
        }
      }
    }

    function onTM(e){
      if(editMode) return;
      if(e.touches.length===2&&pinchRef.current.active){
        e.preventDefault();
        var a=e.touches[0], b=e.touches[1];
        var d=Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
        var nz=Math.min(4, Math.max(1, pinchRef.current.z0*(d/pinchRef.current.d0)));
        pinchRef.current.lz=nz;
        applyT(nz, pinchRef.current.px0, pinchRef.current.py0);
      } else if(e.touches.length===1&&panRef.current.active){
        e.preventDefault();
        var raw_nx=panRef.current.px0+(e.touches[0].clientX-panRef.current.cx0);
        var raw_ny=panRef.current.py0+(e.touches[0].clientY-panRef.current.cy0);
        // Pan limiti — zoom artdıqca daha çox hərəkət edə bilər
        var cz=zoomRef.current;
        var ww=wrapper.offsetWidth||320;
        var wh=wrapper.offsetHeight||400;
        var maxX=(ww*(cz-1))/2;
        var maxY=(wh*(cz-1))/2;
        var nx=Math.max(-maxX, Math.min(maxX, raw_nx));
        var ny=Math.max(-maxY, Math.min(maxY, raw_ny));
        panRef.current.lx=nx;
        panRef.current.ly=ny;
        applyT(cz, nx, ny);
      }
    }

    function onTE(e){
      if(pinchRef.current.active){
        var fz=+(pinchRef.current.lz.toFixed(2));
        zoomRef.current=fz;
        // Pan limitlərini zoom-a görə düzəlt
        var ww2=wrapper.offsetWidth||320;
        var wh2=wrapper.offsetHeight||400;
        var maxX2=(ww2*(fz-1))/2;
        var maxY2=(wh2*(fz-1))/2;
        var cx=Math.max(-maxX2, Math.min(maxX2, pinchRef.current.px0));
        var cy=Math.max(-maxY2, Math.min(maxY2, pinchRef.current.py0));
        panXRef.current=cx;
        panYRef.current=cy;
        applyT(fz, cx, cy);
        setZoom(fz);
        pinchRef.current={active:false};
        panRef.current={active:false};
        return;
      }
      if(panRef.current.active){
        panXRef.current=panRef.current.lx;
        panYRef.current=panRef.current.ly;
        applyT(zoomRef.current, panXRef.current, panYRef.current);
        panRef.current={active:false};
      }
    }

    wrapper.addEventListener("touchstart", onTS, {passive:false});
    wrapper.addEventListener("touchmove", onTM, {passive:false});
    wrapper.addEventListener("touchend", onTE, {passive:false});
    wrapper.addEventListener("touchcancel", onTE, {passive:false});
    return function(){
      wrapper.removeEventListener("touchstart", onTS);
      wrapper.removeEventListener("touchmove", onTM);
      wrapper.removeEventListener("touchend", onTE);
      wrapper.removeEventListener("touchcancel", onTE);
    };
  }, [editMode]);

  // Canvas height based on table count
  const tblCount = tables.length;
  const canvasH = tblCount<=16 ? 380 : tblCount<=30 ? 480 : tblCount<=50 ? 580 : tblCount<=100 ? 700 : 860;

  function calcGrid(tbls){
    const n=tbls.length;
    const W=containerRef.current?containerRef.current.offsetWidth:320;
    const H=canvasH;

    // Hall layout (xPct/yPct)
    const hasLayout = tbls.length>0 && tbls[0].pos && tbls[0].pos.xPct!=null;
    if(hasLayout){
      const pos={};
      tbls.forEach(t=>{
        pos[t.id]={xPx:(t.pos.xPct/100)*W, yPx:(t.pos.yPct/100)*H};
      });
      return {pos};
    }

    // Zal daxili padding — masalar kənara çıxmasın
    const PAD = 28; // kənar boşluq px
    const TOP_PAD = H*0.10 + PAD; // Səhnə üçün yer + padding
    const BOT_PAD = H*0.08 + PAD; // Giriş üçün yer + padding

    const usableW = W - PAD*2;
    const usableH = H - TOP_PAD - BOT_PAD;

    // Optimal cols/rows nisbəti: zal nisbətinə uyğun
    const aspect = usableW / usableH; // zal en/hündürlük nisbəti
    let bestCols = 1, bestRows = n;
    let bestScore = Infinity;
    for(let c=1; c<=Math.min(n,15); c++){
      const r = Math.ceil(n/c);
      const gridAspect = c/r;
      const score = Math.abs(gridAspect - aspect);
      if(score < bestScore){ bestScore=score; bestCols=c; bestRows=r; }
    }

    const cellW = usableW / bestCols;
    const cellH = usableH / bestRows;

    const pos={};
    tbls.forEach((t,i)=>{
      const col=i%bestCols, row=Math.floor(i/bestCols);
      pos[t.id]={
        xPx: PAD + col*cellW + cellW/2,
        yPx: TOP_PAD + row*cellH + cellH/2
      };
    });
    return {pos};
  }

  useEffect(()=>{
    if(tables.length>0){
      setTimeout(()=>{
        const {pos}=calcGrid(tables);
        setPositions(prev=>{
          const next={...pos};
          Object.keys(prev).forEach(id=>{if(next[id])next[id]=prev[id];});
          return next;
        });
      },50);
      setShowHint(true);
      setTimeout(()=>setShowHint(false),1800);
    }
  },[tables.length, canvasH]);

  function handleTblClick(id){
    if(editMode) return; // editMode-da yalnız sürüşdürmə
    setFpPopup(null); // popup bağla
    setPulseId(id);
    setTimeout(()=>setPulseId(null),700);
    if(onTableClick) onTableClick(id);
  }

  if(tables.length===0) return null;
  const n = tables.length;
  const W = containerRef.current?.offsetWidth||320;
  const hasHallElements = !!(hall && hall._hallElements && hall._hallElements.length > 0);
  let S;
  if(hasHallElements){
    // Kiçik Zal: sabit kiçik ölçü. W~360px → S=28. Masa totalSvgSize=S*1.5≈42px.
    // xPct fərqi 13% → 13/100*360=47px > 42px ✓ (sütunlar arası boşluq var)
    // yPct fərqi 16% → 16/100*380=61px > 42+15=57px ✓ (4mm boşluq)
    S = Math.round(Math.min(30, Math.max(18, W * 0.078)));
  } else {
    const usableArea = (W - 56) * (canvasH * 0.82);
    const cellArea = usableArea / n;
    const autoS = Math.min(64, Math.max(16, Math.sqrt(cellArea) * 0.65));
    S = Math.round(autoS);
  }

  return (
    <div style={{position:"relative",width:"100%"}}>
      {/* Zoom controls */}
      <div style={{position:"absolute",top:4,right:4,zIndex:40,display:"flex",gap:1,alignItems:"center",
        background:"rgba(0,0,0,.45)",borderRadius:5,padding:"2px 4px",pointerEvents:"auto"}}>
        <span style={{fontSize:8,color:"rgba(201,168,76,.45)",minWidth:22,textAlign:"center"}}>{Math.round(zoom*100)+"%"}</span>
        <button onClick={function(){
          zoomRef.current=1; panXRef.current=0; panYRef.current=0;
          setZoom(1);
          if(containerRef.current) containerRef.current.style.transform="translate(0px,0px) scale(1)";
        }} style={{width:20,height:16,borderRadius:3,border:"none",background:"transparent",color:"rgba(201,168,76,.5)",fontSize:9,cursor:"pointer",padding:0,lineHeight:1}}>↺</button>
      </div>

      {/* Outer wrapper — sabit, overflow hidden */}
      <div ref={wrapperRef} style={{
        width:"100%", height:canvasH+"px",
        position:"relative", overflow:"hidden",
        borderRadius:14, border:"2px solid rgba(201,168,76,.25)",
        background:"linear-gradient(160deg,#0a0800,#120f02)",
        boxShadow:"inset 0 0 40px rgba(0,0,0,.4), inset 0 0 0 10px rgba(201,168,76,.04)",
        touchAction:"pan-y", userSelect:"none"
      }}>
        {/* Inner canvas — scale+pan burada */}
        <div
          ref={containerRef}
          style={{
            width:"100%",
            height: canvasH+"px",
            position:"absolute",
            top:0, left:0,
            transformOrigin:"center center",
            transform:"translate(0px,0px) scale(1)"
          }}>

          {/* Photo background (variant 2) */}
          {layoutMode==="photo"&&hall&&hall.photoUrl&&(
            <img src={hall.photoUrl}
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",
                objectFit:"cover",opacity:0.4,borderRadius:14,pointerEvents:"none",zIndex:0}}/>
          )}



          {/* Custom mode: add table button */}
          {layoutMode==="custom"&&editMode&&onAddTable&&(
            <button onClick={onAddTable}
              style={{position:"absolute",top:6,left:6,zIndex:30,
                padding:"3px 8px",borderRadius:6,border:"1px solid rgba(201,168,76,.35)",
                background:"rgba(201,168,76,.1)",color:"rgba(201,168,76,.8)",fontSize:9,
                fontWeight:700,cursor:"pointer"}}>
              + Masa
            </button>
          )}

            {/* SƏHNƏ — yalnız _hallElements olmadıqda */}
            {!hasHallElements&&(()=>{const ep=elemPos.sehne; return (
              <div
                onTouchStart={e=>{if(!editMode)return;e.stopPropagation();drag.current={type:"elem",id:"sehne",sx:e.touches[0].clientX,sy:e.touches[0].clientY,ex:ep.x,ey:ep.y};}}
                onTouchMove={e=>{
                  const dr=drag.current;
                  if(!dr||dr.type!=="elem"||dr.id!=="sehne")return;
                  e.stopPropagation();
                  const rect=containerRef.current.getBoundingClientRect();
                  const x=Math.max(0,Math.min(75,(e.touches[0].clientX-rect.left)/rect.width*100));
                  const y=Math.max(0,Math.min(20,(e.touches[0].clientY-rect.top)/canvasH*100));
                  setElemPos(p=>({...p,sehne:{x,y}}));
                }}
                onTouchEnd={()=>{drag.current=null;}}
                style={{position:"absolute",left:"2%",top:"0.5%",width:"96%",height:"16px",
                  background:"rgba(201,168,76,.03)",
                  border:"1px solid rgba(201,168,76,.1)",borderRadius:3,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:editMode?"grab":"default",touchAction:editMode?"none":"auto",userSelect:"none",zIndex:3}}>
                {editMode&&<span style={{fontSize:7,color:"rgba(201,168,76,.3)",letterSpacing:2}}>SƏHNƏ ✥</span>}
              </div>
            );})()}

            {/* GİRİŞ — yalnız _hallElements olmadıqda */}
            {!hasHallElements&&(()=>{const ep=elemPos.giris; return (
              <div
                onTouchStart={e=>{if(!editMode)return;e.stopPropagation();drag.current={type:"elem",id:"giris"};}}
                onTouchMove={e=>{
                  const dr=drag.current;
                  if(!dr||dr.type!=="elem"||dr.id!=="giris")return;
                  e.stopPropagation();
                  const rect=containerRef.current.getBoundingClientRect();
                  const x=Math.max(0,Math.min(75,(e.touches[0].clientX-rect.left)/rect.width*100));
                  const y=Math.max(70,Math.min(95,(e.touches[0].clientY-rect.top)/canvasH*100));
                  setElemPos(p=>({...p,giris:{x,y}}));
                }}
                onTouchEnd={()=>{drag.current=null;}}
                style={{position:"absolute",left:"35%",top:"93%",width:"30%",height:"5%",
                  background:"linear-gradient(0deg,rgba(80,200,120,.12),rgba(80,200,120,.04))",
                  border:"1px solid rgba(80,200,120,.3)",borderRadius:6,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:9,fontWeight:700,color:"rgba(80,200,120,.5)",letterSpacing:1,
                  cursor:editMode?"grab":"default",touchAction:editMode?"none":"auto",userSelect:"none",zIndex:3}}>
                🚪 Giriş{editMode&&<span style={{marginLeft:4,fontSize:8,opacity:0.4}}>✥</span>}
              </div>
            );})()}

            {/* Kiçik Zal elementləri */}
            {hasHallElements&&hall._hallElements.map(function(el,idx){
              var isDF=el.type==="danceFloor", isBG=el.type==="brideGroom",
                  isStage=el.type==="stage", isEnt=el.type==="entrance";
              return (
                <div key={idx} style={{
                  position:"absolute",
                  left:el.xPct+"%", top:el.yPct+"%",
                  width:el.w+"%", height:el.h+"%",
                  transform:"translate(-50%,-50%)",
                  background:isDF?"rgba(130,50,90,.15)":isBG?"rgba(201,168,76,.06)":isStage?"rgba(70,110,190,.07)":"rgba(70,190,110,.07)",
                  border:isDF?"1.5px dashed rgba(200,100,150,.45)":isBG?"1px solid rgba(201,168,76,.3)":isStage?"1px solid rgba(100,140,220,.25)":"1px solid rgba(70,190,110,.3)",
                  borderRadius:isDF?10:8,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
                  zIndex:2,pointerEvents:"none",userSelect:"none"
                }}>
                  <span style={{fontSize:isDF?16:11,lineHeight:1}}>{isDF?"💃":isBG?"👰":isStage?"🎸":"🚪"}</span>
                  <span style={{fontSize:8,fontWeight:700,letterSpacing:0.5,lineHeight:1,
                    color:isDF?"rgba(220,130,165,.8)":isBG?"rgba(255,210,100,.8)":isStage?"rgba(130,175,240,.7)":"rgba(70,190,110,.7)"
                  }}>{el.label}</span>
                </div>
              );
            })}

            {/* Masalar */}
            {tables.map(t=>{
              const p=positions[t.id];
              if(!p) return null;
              const oc=occ(t);
              const fu=oc>=t.seats;
              const pct=Math.min(1,oc/(t.seats||1));
              const isExtra=t.label==="__extra__";
              const fpOpen=fpPopup===t.id;
              const side=t.side||"";
              const tc=fu?"#50c878":isExtra?"#b57aff":side==="Oğlan evi"?"#7aade8":side==="Qız evi"?"#e87aad":"#c9a84c";
              const allInvited=t.guests.length>0&&t.guests.every(g=>g.invited);

              return (
                <div key={t.id}
                  ref={el=>{if(el)nodeRefs.current[t.id]=el;}}
                  onTouchStart={e=>{
                    e.stopPropagation();
                    const rect=containerRef.current.getBoundingClientRect();
                    const touchX=(e.touches[0].clientX-rect.left)/zoom;
                    const touchY=(e.touches[0].clientY-rect.top)/zoom;
                    const node=nodeRefs.current[t.id];
                    const curX=parseFloat(node?.style.left||p.xPx);
                    const curY=parseFloat(node?.style.top||p.yPx);
                    drag.current={
                      type:"table",id:t.id,moved:false,
                      sx:e.touches[0].clientX,sy:e.touches[0].clientY,
                      offX:touchX-curX, offY:touchY-curY
                    };
                    // Long press — yalnız 1 barmaq, zoom yoxdursa
                    if(!editMode && e.touches.length===1 && zoomRef.current<=1.05){
                      longPressTimer.current=setTimeout(function(){
                        setLongPressSelected(function(prev){
                          var s=new Set(prev);
                          if(s.has(t.id)) s.delete(t.id); else s.add(t.id);
                          return s;
                        });
                        setShowLongPressPanel(true);
                        setLongPressResult(null);
                        drag.current=null;
                      },600);
                    }
                  }}
                  onTouchMove={e=>{
                    // 2 barmaq — zoom, long press iptal et
                    if(e.touches.length>=2){
                      if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}
                      return;
                    }
                    const dr=drag.current;
                    if(!dr||dr.id!==t.id)return;
                    const dx=Math.abs(e.touches[0].clientX-dr.sx);
                    const dy=Math.abs(e.touches[0].clientY-dr.sy);
                    if(dx>6||dy>6){
                      dr.moved=true;
                      if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}
                    }
                    if(editMode && dr.moved){
                      e.preventDefault();
                      e.stopPropagation();
                      const rect=containerRef.current.getBoundingClientRect();
                      const xPx=(e.touches[0].clientX-rect.left)/zoom - dr.offX;
                      const yPx=(e.touches[0].clientY-rect.top)/zoom - dr.offY;
                      const node=nodeRefs.current[t.id];
                      if(node){node.style.left=xPx+"px";node.style.top=yPx+"px";}
                    }
                  }}
                  onTouchEnd={e=>{
                    if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}
                    const dr=drag.current; drag.current=null;
                    if(!dr||dr.id!==t.id)return;
                    if(editMode && dr.moved){
                      const node=nodeRefs.current[t.id];
                      if(node){
                        const xPx=parseFloat(node.style.left),yPx=parseFloat(node.style.top);
                        setPositions(p=>({...p,[t.id]:{xPx,yPx}}));
                        if(onPositionChange)onPositionChange(t.id,{xPx,yPx});
                      }
                    } else if(!dr.moved){
                      handleTblClick(t.id);
                    }
                  }}
                  onClick={e=>{e.stopPropagation();if(!('ontouchstart' in window))handleTblClick(t.id);}}
                  style={{position:"absolute",left:p.xPx+"px",top:p.yPx+"px",
                    transform:"translate(-50%,-50%)",zIndex:fpOpen?15:longPressSelected.has(t.id)?10:5,
                    touchAction:editMode?"none":"auto",cursor:editMode?"grab":"pointer",
                    opacity:allInvited?0.45:1,transition:"opacity .3s"}}
                  className={pulseId===t.id?"tpulse":longPressSelected.has(t.id)?"lp-selected":""}>

                  {/* Masa nömrəsi — üstündə */}
                  <div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",
                    fontSize:hasHallElements?Math.max(11,S*0.38):Math.max(8,S*0.18),
                    fontWeight:700,
                    color:hasHallElements?"rgba(255,225,130,1)":"rgba(201,168,76,.9)",
                    textShadow:hasHallElements?"0 1px 4px rgba(0,0,0,.9)":"none",
                    whiteSpace:"nowrap",pointerEvents:"none",lineHeight:1.2}}>
                    {isExtra?"":t.id}
                  </div>

                  {(()=>{
                    const r = S/2;
                    const chairR = r + S*0.18; // stulların mərkəzdən məsafəsi
                    const chairW = Math.max(4, S*0.13);
                    const chairH = Math.max(3, S*0.09);
                    const seats = t.seats||8;
                    // İndikator rəngi: 0%=qızıl, 50%=narıncı, 100%=yaşıl
                    const indColor = fu?"#50c878":pct>0.5?"#f5a623":pct>0?"#f5d060":"#e8c060";
                    const strokeColor = longPressSelected.has(t.id)?"#ff4444":fpOpen?"#fff":fu?"#50c878":side==="Oğlan evi"?"#7aade8":side==="Qız evi"?"#e87aad":indColor;
                    const fillBg = longPressSelected.has(t.id)?"#3a0a0a":side==="Oğlan evi"?"#1e3a55":side==="Qız evi"?"#4a1e35":fu?"#0f3a20":"#3a2c0a";
                    const totalSvgSize = S + S*0.5;
                    const cx = totalSvgSize/2;
                    const cy = totalSvgSize/2;
                    return (
                      <svg width={totalSvgSize} height={totalSvgSize} style={{display:"block",pointerEvents:"none",overflow:"visible"}}>
                        {/* Stullar */}
                        {Array.from({length:seats}).map((_,i)=>{
                          const angle = (2*Math.PI/seats)*i - Math.PI/2;
                          const sx = cx + chairR*Math.cos(angle);
                          const sy = cy + chairR*Math.sin(angle);
                          const filled = i < oc;
                          const chairColor = filled ? "#4ade80" : (side==="Oğlan evi"?"#93c5fd":side==="Qız evi"?"#f9a8d4":"#fcd34d");
                          return (
                            <rect key={i}
                              x={sx - chairW/2} y={sy - chairH/2}
                              width={chairW} height={chairH}
                              rx={Math.max(1,chairH*0.4)}
                              fill={chairColor}
                              opacity={filled?0.95:0.3}
                              transform={`rotate(${(angle*180/Math.PI)+90} ${sx} ${sy})`}
                            />
                          );
                        })}
                        {/* Masa dairəsi */}
                        <circle cx={cx} cy={cy} r={r-2} fill={fillBg} stroke={strokeColor} strokeWidth="2.5"
                          style={{filter:"drop-shadow(0 0 3px "+strokeColor+"88)"}}/>
                        {/* Qonaq sayı — ağ, görünür */}
                        <text x={cx} y={side&&side!=="Ümumi"?cy-S*0.1:cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={S*0.28} fontWeight="700"
                          fill="#ffffff">
                          {isExtra?"E":oc}
                        </text>
                        {/* Tərəf yazısı */}
                        {side&&side!=="Ümumi"&&(
                          <text x={cx} y={cy+S*0.2} textAnchor="middle" dominantBaseline="middle"
                            fontSize={Math.max(8,S*0.14)} fontWeight="600"
                            fill={side==="Oğlan evi"?"#7aade8":"#e87aad"}>
                            {side==="Oğlan evi"?"Oğlan":"Qız"}
                          </text>
                        )}
                      </svg>
                    );
                  })()}

                  {/* Masa adı — altında */}
                  {t.label&&t.label!=="__extra__"&&(
                    <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",
                      fontSize:Math.max(7,S*0.16),fontWeight:600,
                      color:side==="Oğlan evi"?"#7aade8":side==="Qız evi"?"#e87aad":"rgba(201,168,76,.8)",
                      whiteSpace:"nowrap",pointerEvents:"none",lineHeight:1.2,marginTop:2}}>
                      {t.label}
                    </div>
                  )}

                  {!editMode&&<div
                    id={t.id===tables[0]?.id?"schema-edit-pencil":undefined}
                    onClick={e=>{e.stopPropagation(); setFpPopupTbl(t); setFpPopup(p=>p===t.id?null:t.id);}}
                    style={{position:"absolute",top:-6,right:-6,
                      width:Math.max(16,20/zoom),height:Math.max(16,20/zoom),
                      borderRadius:"50%",
                      background:"rgba(201,168,76,.9)",color:"#080604",
                      fontSize:Math.max(9,11/zoom),display:"flex",
                      alignItems:"center",justifyContent:"center",zIndex:12,cursor:"pointer",
                      boxShadow:"0 1px 4px rgba(0,0,0,.6)",
                      touchAction:"manipulation"}}>✏</div>}
                  {showHint&&tables[0]&&tables[0].id===t.id&&(
                    <div className="finger" style={{position:"absolute",top:0,left:"50%",
                      fontSize:22,zIndex:20,pointerEvents:"none",lineHeight:1}}>👆</div>
                  )}
                </div>
              );
            })}

          {/* Legend */}
          <div style={{position:"absolute",bottom:4,left:6,display:"flex",gap:5,flexWrap:"wrap",pointerEvents:"none"}}>
            {[["#7aade8","Oğlan"],["#e87aad","Qız"],["#50c878","Dolu"],["#b57aff","Extra"],["#ff4444","Yönəlt"]].map(([c,l])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:2,fontSize:7,color:"rgba(255,255,255,.4)"}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:c,display:"inline-block"}}/>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* LONG PRESS PANEL — fixed overlay, overflow:hidden-dən təsirlənmir */}
      {showLongPressPanel&&longPressSelected.size>0&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:300,
          background:"rgba(8,6,4,.97)",borderTop:"1px solid rgba(255,60,60,.3)",
          borderRadius:"16px 16px 0 0",padding:"16px 16px 32px",
          boxShadow:"0 -4px 24px rgba(0,0,0,.6)"}}>
          {longPressResult?(
            <div>
              <div style={{fontSize:12,color:"#ff6666",fontWeight:700,marginBottom:8}}>✅ Yönəltmə kodu hazırdır!</div>
              <div style={{background:"rgba(0,0,0,.5)",borderRadius:10,padding:"10px",textAlign:"center",marginBottom:10}}>
                <div style={{fontSize:24,fontWeight:900,color:"#ff9999",letterSpacing:4,fontFamily:"monospace"}}>{longPressResult.code}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:3}}>{longPressResult.tblIds.length} masa · bu kodu WhatsApp-la göndər</div>
              </div>
              <div style={{fontSize:10,color:"rgba(255,200,200,.6)",marginBottom:10,lineHeight:1.5}}>
                {"Həmin adam GONAG.AZ-da \"Yönəlt kodunu daxil et\" bölməsindən "+longPressResult.code+" yazır → yalnız bu masaları görür → doldurur → data sxeminizə əlavə olunur."}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){
                  var msg="🎊 Sizi məclisimizin masa sxeminə dəvət edirəm!\n\nAşağıdakı linkə basın — masanızı görəcək və adınızı əlavə edəcəksiniz:\n\n👉 https://gonag-vercel.vercel.app/invite/"+longPressResult.code+"\n\nTəşəkkür edirik! 🙏";
                  window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");
                }} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"rgba(37,211,102,.2)",color:"#25d366",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  📱 WhatsApp
                </button>
                <button onClick={function(){
                  try{navigator.clipboard.writeText(longPressResult.code);}catch(e){}
                  alert("Kod kopyalandı: "+longPressResult.code);
                }} style={{padding:"9px 12px",borderRadius:9,border:"1px solid rgba(255,100,100,.3)",background:"transparent",color:"#ff9999",fontSize:11,cursor:"pointer"}}>
                  📋
                </button>
                <button onClick={function(){setShowLongPressPanel(false);setLongPressSelected(new Set());setLongPressResult(null);}}
                  style={{padding:"9px 10px",borderRadius:9,border:"none",background:"transparent",color:"rgba(255,255,255,.3)",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:12,color:"#ff9999",fontWeight:700}}>
                  {"🔴 "+longPressSelected.size+" masa seçildi — diger şəxsə yönəlt"}
                </div>
                <button onClick={function(){setLongPressSelected(new Set());setShowLongPressPanel(false);}}
                  style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                {Array.from(longPressSelected).map(function(id){
                  var tbl=tables.find(function(t){return t.id===id;});
                  return (
                    <span key={id} style={{padding:"3px 8px",borderRadius:6,background:"rgba(255,60,60,.2)",
                      border:"1px solid rgba(255,60,60,.4)",color:"#ff9999",fontSize:10,fontWeight:600}}>
                      {"№"+id+(tbl&&tbl.label&&tbl.label!=="__extra__"?" "+tbl.label:"")}
                    </span>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:"rgba(255,200,200,.5)",marginBottom:10,lineHeight:1.5}}>
                Bu masalar üçün xüsusi kod yaranacaq. Həmin kod ilə başqa şəxs yalnız bu masaları dolduracaq.
              </div>
              <button onClick={function(){
                var code="G"+Math.random().toString(36).substring(2,5).toUpperCase()+Math.random().toString(36).substring(2,4).toUpperCase();
                var tblIds=Array.from(longPressSelected);
                setLongPressResult({code:code,tblIds:tblIds});
                try{
                  fetch("https://dpvoluttxelwnqcfnsbh.supabase.co/rest/v1/invite_links",{
                    method:"POST",
                    headers:{"apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368","Content-Type":"application/json","Prefer":"return=representation"},
                    body:JSON.stringify({code:code,session_id:"gonag_user_main",table_ids:tblIds,status:"active"})
                  }).catch(function(){});
                }catch(e){}
              }} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",
                background:"linear-gradient(90deg,rgba(255,60,60,.4),rgba(255,60,60,.2))",
                color:"#ffaaaa",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {"🔴 "+longPressSelected.size+" masa üçün kod yarat → Göndər"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FpTablePopup — rendered OUTSIDE canvas so it's never clipped */}
      {fpPopup&&fpPopupTbl&&!editMode&&onLabelSide&&(()=>{
        const liveTbl = tables.find(x=>x.id===fpPopupTbl.id)||fpPopupTbl;
        return (
          <FpTablePopup
            key={liveTbl.id}
            t={liveTbl}
            posY={0}
            onClose={()=>{ setFpPopup(null); setFpPopupTbl(null); }}
            onSaveLabel={lbl=>{
              onLabelSide(liveTbl.id, lbl, liveTbl.side||"");
              setFpPopupTbl(p=>({...p, label:lbl}));
            }}
            onSaveSide={s=>{
              onLabelSide(liveTbl.id, fpPopupTbl.label||liveTbl.label||"", s);
              setFpPopupTbl(p=>({...p, side:s}));
            }}
            onExtra={()=>{
              onLabelSide(liveTbl.id, liveTbl.label==="__extra__"?"":"__extra__", liveTbl.side||"");
              setFpPopup(null); setFpPopupTbl(null);
            }}
          />
        );
      })()}
    </div>
  );
}

function GuestPopup({ popup, exTbl, tables, onMove, onDelete, onEdit, onClose, popupMove, popupMoveTgt, setPopupMove, setPopupMoveTgt }){
  const [mode, setMode] = useState("menu"); // "menu"|"move"|"edit"|"conflict"
  const [conflictTbl, setConflictTbl] = useState(null); // target table when full
  const [eName,setEName]=useState("");
  const [ePhone,setEPhone]=useState("");
  const [eCount,setECount]=useState("1");

  if(!popup || !exTbl) return null;
  const g = ((exTbl&&exTbl.guests)||[]).find(x=>x.id===popup.id);
  if(!g) return null;
  const sc=sideColor(g.side||"Umumi"), sbg=sideBg(g.side||"Umumi");

  function startEdit(){ setEName(g.name); setEPhone(g.phone||""); setECount(String(g.count||1)); setMode("edit"); }
  function saveEdit(){ if(!eName.trim()) return; onEdit(g.id,exTbl.id,{name:eName.trim(),phone:ePhone.trim(),count:parseInt(eCount)||1}); onClose(); }

  return (
    <div style={{position:"relative",margin:"10px 0",background:"linear-gradient(145deg,#201a10,#141008)",border:"1.5px solid rgba(245,208,96,.45)",borderRadius:14,padding:"13px 15px",zIndex:30,minWidth:230,boxShadow:"0 10px 40px rgba(0,0,0,.7)"}}>
      <button onClick={onClose}
        style={{position:"absolute",top:7,right:8,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.07)",color:"#9a8060",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>

      {/* Guest header */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:sc+"22",border:"1.5px solid "+sc+"66",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:sc}}>{g.name[0]}</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#f2e8d0"}}>{g.name}</div>
          <div style={{fontSize:10,marginTop:2,display:"flex",alignItems:"center",gap:5}}>
            <span style={{padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:700,background:sbg,color:sc}}>{g.side||"Umumi"}</span>
            {g.phone&&<span style={{color:"rgba(201,168,76,.45)"}}>{g.phone}</span>}
            <span style={{color:"rgba(201,168,76,.4)"}}>{g.count||1} nəfər</span>
          </div>
        </div>
      </div>

      {/* MENU mode */}
      {mode==="menu" && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={startEdit}
            style={{flex:1,padding:"8px 0",borderRadius:9,border:"1px solid rgba(122,173,232,.3)",background:"rgba(122,173,232,.08)",color:"#7aade8",fontSize:12,fontWeight:600,cursor:"pointer"}}>✏️ Redaktə</button>
          <button onClick={()=>{setMode("move");setPopupMoveTgt("");}} style={{flex:1,padding:"8px 0",borderRadius:9,border:"1px solid rgba(201,168,76,.28)",background:"rgba(201,168,76,.09)",color:"#c9a84c",fontSize:12,fontWeight:600,cursor:"pointer"}}>↔ Köçür</button>
          <button onClick={()=>{onDelete(g.id,exTbl.id);onClose();}} style={{flex:"0 0 100%",padding:"8px 0",borderRadius:9,border:"1px solid rgba(220,80,80,.22)",background:"rgba(220,80,80,.08)",color:"rgba(220,80,80,.75)",fontSize:12,fontWeight:600,cursor:"pointer"}}>✕ Sil</button>
        </div>
      )}

      {/* EDIT mode */}
      {mode==="edit" && (
        <div>
          <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:7,fontWeight:700,letterSpacing:.8}}>MELUMATLARı DEYİŞ</div>
          <input value={eName} onChange={e=>setEName(e.target.value)} placeholder="Adı Soyadı" autoFocus
            onKeyDown={e=>e.key==="Enter"&&document.getElementById("ep-inp")&&document.getElementById("ep-inp").focus()} style={{width:"100%",marginBottom:6,padding:"8px 11px",boxSizing:"border-box",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.3)",borderRadius:9,color:"#f2e8d0",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
          <input id="ep-inp" value={ePhone} onChange={e=>setEPhone(e.target.value)} placeholder="Mobil nömrə"
            onKeyDown={e=>e.key==="Enter"&&document.getElementById("ec-inp")&&document.getElementById("ec-inp").focus()} style={{width:"100%",marginBottom:6,padding:"8px 11px",boxSizing:"border-box",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.25)",borderRadius:9,color:"#f2e8d0",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
          <div style={{display:"flex",gap:6,marginBottom:2}}>
            <input id="ec-inp" type="number" min="1" max="20" value={eCount} onChange={e=>setECount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit()} style={{width:52,padding:"8px 6px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.25)",borderRadius:9,color:"#f2e8d0",fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/>
            <button onClick={saveEdit}
              style={{flex:1,padding:"8px",borderRadius:9,border:"none",background:"rgba(80,200,120,.22)",color:"#78e896",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Saxla</button>
            <button onClick={()=>setMode("menu")} style={{padding:"8px 11px",borderRadius:9,border:"1px solid rgba(201,168,76,.15)",background:"transparent",color:"#9a8060",fontSize:12,cursor:"pointer"}}>Geri</button>
          </div>
        </div>
      )}

      {/* CONFLICT mode */}
      {mode==="conflict" && conflictTbl && (
        <div>
          <div style={{fontSize:12,color:"#e8b87a",marginBottom:10,lineHeight:1.5}}>
            ⚠️ Masa <strong style={{color:"#f2e8d0"}}>{conflictTbl.label||conflictTbl.id}</strong> doludur!<br/>
            <span style={{fontSize:11,color:"rgba(201,168,76,.6)"}}>
              {((conflictTbl&&conflictTbl.guests)||[]).reduce((s,x)=>s+(x.count||1),0)}/{conflictTbl.seats} yer tutulub
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <button onClick={()=>{
              // Swap: move first guest of target back to source, then move our guest
              const swapG = (conflictTbl&&conflictTbl.guests&&conflictTbl.guests[0]);
              if(swapG) onMove(swapG.id, conflictTbl.id, exTbl.id);
              onMove(g.id, exTbl.id, conflictTbl.id);
              onClose();
            }} style={{padding:"9px",borderRadius:9,border:"1px solid rgba(232,184,122,.4)",background:"rgba(232,184,122,.1)",color:"#e8b87a",fontSize:12,cursor:"pointer",fontWeight:600,textAlign:"left"}}>
              🔄 Əvəzləşdir — <span style={{opacity:.7,fontSize:11}}>{(conflictTbl&&conflictTbl.guests&&conflictTbl.guests[0]&&conflictTbl.guests[0].name)||"?"} geri qayıtsın</span>
            </button>
            <button onClick={()=>{
              // Expand seats and move
              onMove(g.id, exTbl.id, conflictTbl.id, true); // true = force expand
              onClose();
            }} style={{padding:"9px",borderRadius:9,border:"1px solid rgba(80,200,120,.35)",background:"rgba(80,200,120,.08)",color:"#78e896",fontSize:12,cursor:"pointer",fontWeight:600,textAlign:"left"}}>
              ➕ Masa yerini artır — köçür
            </button>
            <button onClick={()=>setMode("move")} style={{padding:"7px",borderRadius:9,border:"1px solid rgba(201,168,76,.15)",background:"transparent",color:"#9a8060",fontSize:12,cursor:"pointer"}}>← Geri</button>
          </div>
        </div>
      )}

      {/* MOVE mode */}
      {mode==="move" && (
        <div>
          <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginBottom:6}}>Hansı masaya köçürülsün?</div>
          <div style={{display:"flex",gap:5}}>
            <input type="number" min={1} max={tables.length} value={popupMoveTgt}
              onChange={e=>setPopupMoveTgt(e.target.value)} placeholder="Masa №" autoFocus
              onKeyDown={e=>{if(e.key==="Enter"){
                const n=+popupMoveTgt;
                if(!n||n===exTbl.id) return;
                const tgt=tables.find(t=>t.id===n);
                if(!tgt) return;
                const tgtOcc=tgt.guests.reduce((s,g)=>s+(g.count||1),0);
                const guestCount=g.count||1;
                if(tgtOcc+guestCount>tgt.seats){ setConflictTbl(tgt); setMode("conflict"); }
                else { onMove(g.id,exTbl.id,n); onClose(); }
              }}} style={{flex:1,padding:"8px 10px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(201,168,76,.32)",borderRadius:9,color:"#f2e8d0",fontSize:15,fontWeight:700,outline:"none",textAlign:"center"}}/>
            <button
              style={{padding:"8px 14px",borderRadius:9,border:"none",background:"rgba(80,200,120,.22)",color:"#78e896",fontSize:14,cursor:"pointer",fontWeight:700}} onClick={()=>{
                const n=+popupMoveTgt;
                if(!n||n===exTbl.id) return;
                const tgt=tables.find(function(t){return t.id===n;});
                if(!tgt) return;
                const tgtOcc=tgt.guests.reduce(function(s,g){return s+(g.count||1);},0);
                const guestCount=g.count||1;
                if(tgtOcc+guestCount>tgt.seats){
                  setConflictTbl(tgt); setMode("conflict");
                } else {
                  onMove(g.id,exTbl.id,n); onClose();
                }
              }}>✓</button>
            <button onClick={()=>setMode("menu")} style={{padding:"8px 10px",borderRadius:9,border:"none",background:"rgba(255,255,255,.06)",color:"#9a8060",fontSize:13,cursor:"pointer"}}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SchemaDrawer({ tables, activeTable, agentSlotTable, onAgentSlotClear, onTableClick, onMove, onDelete, onEdit, onLabel, onAddGuest, hall, pct, onPositionChange, onSave, layoutMode, onAddTable }){
  const [expandedId, setExpandedId] = useState(activeTable||null);
  const [editLbl, setEditLbl] = useState(false);
  const [lblVal, setLblVal] = useState("");
  const [popup, setPopup] = useState(null);
  const [popupMove, setPopupMove] = useState(false);
  const [popupMoveTgt, setPopupMoveTgt] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [shareSelected, setShareSelected] = useState(new Set());
  const [shareResult, setShareResult] = useState(null);
  const [slotInput, setSlotInput] = useState(null);
  const [slotName, setSlotName] = useState("");
  const [slotPhone, setSlotPhone] = useState("");
  const [slotCount, setSlotCount] = useState("1");
  const [slotGender, setSlotGender] = useState("");
  const [slotExtras, setSlotExtras] = useState([]);
  const slotRef = useRef(null);
  const guestPanelRef = useRef(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(function(){
    if(activeTable){ setExpandedId(activeTable); setPopup(null); setEditLbl(false); }
  },[activeTable]);

  // Agent tərəfindən masa seçildikcə slot formu avtomatik aç
  useEffect(function(){
    if(agentSlotTable){
      setExpandedId(agentSlotTable);
      setPopup(null);
      setEditLbl(false);
      setTimeout(()=>{ setSlotInput({slotIdx:0}); },300);
      if(onAgentSlotClear) onAgentSlotClear();
    }
  },[agentSlotTable]);

  useEffect(function(){
    if(expandedId && guestPanelRef.current){
      setTimeout(()=>{
        if(guestPanelRef.current){
          guestPanelRef.current.scrollIntoView({behavior:"smooth",block:"nearest"});
        }
      },200);
    }
  },[expandedId]);



  const exTbl = tables.find(function(t){return t.id===expandedId;});

  function clickTable(id){
    if(expandedId===id){ setExpandedId(null); setPopup(null); setEditLbl(false); }
    else{ setExpandedId(id); setPopup(null); setSlotInput(null); setEditLbl(false); setLblVal((tables.find(t=>t.id===id)||{label:""}).label||""); }
    if(onTableClick) onTableClick(id);
  }

  function guestClick(g){
    setPopup(function(p){return p&&p.id===g.id?null:Object.assign({},g);});
    setPopupMove(false); setPopupMoveTgt("");
  }

  return (
    <div style={{minHeight:0}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#c9a84c",fontWeight:700}}>{hall&&hall.name||"Sxem"}</div>
          <div style={{fontSize:10,color:"rgba(201,168,76,.5)",marginTop:2}}>
            {hall&&hall.totalGuests&&<span style={{marginRight:6}}>{hall.totalGuests} nəfər</span>}
            {tables.length} masa · {pct||0}% dolu
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={function(){setShareMode(function(s){return !s;}); setShareResult(null); setShareSelected(new Set());}}
            style={{padding:"6px 10px",borderRadius:9,
              border:"1px solid "+(shareMode?"rgba(122,173,232,.5)":"rgba(201,168,76,.25)"),
              background:shareMode?"rgba(122,173,232,.12)":"transparent",
              color:shareMode?"#7aade8":"#9a8060",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            📤 Yönəlt
          </button>
          <button id="schema-edit-btn" onClick={()=>setEditMode(e=>!e)} style={{padding:"6px 12px",borderRadius:9,border:"1px solid "+(editMode?"rgba(80,200,120,.45)":"rgba(201,168,76,.3)"),background:editMode?"rgba(80,200,120,.12)":"transparent",color:editMode?"#78e896":"#9a8060",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {editMode?"✓ Bitir":"✏️ Düzəlt"}
          </button>
        </div>
      </div>

      {/* YÖNƏLT PANEL */}
      {shareMode&&(
        <div style={{background:"rgba(122,173,232,.06)",border:"1px solid rgba(122,173,232,.2)",
          borderRadius:12,padding:"12px",marginBottom:10}}>
          {shareResult?(
            <div>
              <div style={{fontSize:12,color:"#7aade8",fontWeight:700,marginBottom:8}}>✅ Yönəltmə kodu hazırdır!</div>
              <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:"12px",textAlign:"center",marginBottom:10}}>
                <div style={{fontSize:26,fontWeight:900,color:"#f5d060",letterSpacing:4,fontFamily:"monospace"}}>{shareResult.code}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:4}}>{shareResult.tblIds.length} masa · bu kodu WhatsApp-la göndər</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){
                  var msg="Zəhmət olmasa GONAG.AZ-ı aç, Yönəlt kodunu daxil et: "+shareResult.code+". Masaları sən doldur! 🙏";
                  window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");
                }} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:"rgba(37,211,102,.2)",color:"#25d366",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  📱 WhatsApp
                </button>
                <button onClick={function(){
                  try{navigator.clipboard.writeText(shareResult.code);}catch(e){}
                  alert("Kod kopyalandı: "+shareResult.code);
                }} style={{padding:"8px 10px",borderRadius:8,border:"1px solid rgba(201,168,76,.3)",background:"transparent",color:"#c9a84c",fontSize:11,cursor:"pointer"}}>
                  📋
                </button>
                <button onClick={function(){setShareResult(null);setShareSelected(new Set());setShareMode(false);}}
                  style={{padding:"8px 10px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,.3)",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ):(
            <div>
              <div style={{fontSize:11,color:"#7aade8",fontWeight:700,marginBottom:8}}>📤 Yönəltmək üçün masaları seç:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                <button onClick={function(){
                  var allIds=new Set(tables.map(function(t){return t.id;}));
                  var allSel=tables.every(function(t){return shareSelected.has(t.id);});
                  setShareSelected(allSel?new Set():allIds);
                }} style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",
                  border:"1px solid rgba(122,173,232,.4)",
                  background:tables.every(function(t){return shareSelected.has(t.id);})?"rgba(122,173,232,.2)":"transparent",
                  color:"#7aade8"}}>
                  {tables.every(function(t){return shareSelected.has(t.id);})?"✓ Hamısı":"Hamısını seç"}
                </button>
                {tables.map(function(t){
                  var isSel=shareSelected.has(t.id);
                  var sc=t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":"rgba(201,168,76,.8)";
                  return (
                    <button key={t.id} onClick={function(){
                      setShareSelected(function(prev){
                        var s=new Set(prev);
                        if(s.has(t.id)) s.delete(t.id); else s.add(t.id);
                        return s;
                      });
                    }} style={{padding:"4px 9px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",
                      border:"1px solid "+(isSel?sc:sc+"44"),
                      background:isSel?sc+"22":"transparent",color:isSel?sc:sc+"66"}}>
                      №{t.id}{t.label&&t.label!=="__extra__"?" "+t.label.substring(0,5):""}
                    </button>
                  );
                })}
              </div>
              {shareSelected.size>0&&(
                <button onClick={function(){
                  var code="G"+Math.random().toString(36).substring(2,6).toUpperCase()+Math.random().toString(36).substring(2,4).toUpperCase();
                  var tblIds=Array.from(shareSelected);
                  setShareResult({code:code,tblIds:tblIds});
                  try{
                    fetch("https://dpvoluttxelwnqcfnsbh.supabase.co/rest/v1/share_tasks",{
                      method:"POST",
                      headers:{"apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368","Content-Type":"application/json"},
                      body:JSON.stringify({code:code,table_ids:tblIds,status:"active",created_at:new Date().toISOString()})
                    }).catch(function(){});
                  }catch(e){}
                }} style={{width:"100%",padding:"9px",borderRadius:10,border:"none",
                  background:"linear-gradient(90deg,rgba(122,173,232,.4),rgba(122,173,232,.2))",
                  color:"#7aade8",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {"📤 "+shareSelected.size+" masa üçün kod yarat"}
                </button>
              )}
              <button onClick={function(){setShareMode(false);setShareSelected(new Set());}}
                style={{width:"100%",marginTop:5,padding:"6px",borderRadius:8,border:"none",
                  background:"transparent",color:"rgba(255,255,255,.25)",fontSize:10,cursor:"pointer"}}>
                Ləğv et
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2,marginBottom:12,overflow:"hidden"}}>
        <div style={{height:"100%",width:(pct||0)+"%",background:"linear-gradient(90deg,#c9a84c,#f5d060)",borderRadius:2}}/>
      </div>

      {/* Floor plan - always visible */}
      <FloorPlanView
        tables={tables}
        expandedId={editMode?null:expandedId}
        onTableClick={editMode?()=>{}:clickTable}
        onPositionChange={onPositionChange}
        hall={hall}
        editMode={editMode}
        layoutMode={layoutMode}
        onAddTable={onAddTable}
        onLabelSide={(id,lbl,side,extra)=>{
          if(extra){
            const tbl=tables.find(x=>x.id===id);
            const wasExtra=tbl&&tbl.label==="__extra__";
            onLabel(id,wasExtra?"":"__extra__",tbl&&tbl.side||"");
          } else {
            onLabel(id,lbl,side);
          }
        }}
      />

      {/* Expanded table panel */}
      {exTbl&&(
        <div ref={guestPanelRef} style={{marginTop:10,background:"linear-gradient(145deg,rgba(245,208,96,.07),rgba(201,168,76,.03))",border:"1.5px solid rgba(245,208,96,.3)",borderRadius:18,padding:14}}>

          {/* Table header */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            {editLbl&&(
              <div style={{display:"flex",gap:5,flex:1,alignItems:"center"}}>
                <input value={lblVal} onChange={e=>setLblVal(e.target.value)} autoFocus
                  onKeyDown={e=>{if(e.key==="Enter"){onLabel(expandedId,lblVal);setEditLbl(false);}}} placeholder="Masanın adı..."
                  style={{flex:1,padding:"6px 10px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(245,208,96,.4)",borderRadius:9,color:"#f2e8d0",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
                <button onClick={()=>{onLabel(expandedId,lblVal);setEditLbl(false);}} style={{padding:"6px 12px",borderRadius:9,border:"none",background:"rgba(80,200,120,.22)",color:"#78e896",fontSize:13,cursor:"pointer",fontWeight:700}}>✓</button>
                <button onClick={()=>setEditLbl(false)} style={{padding:"6px 10px",borderRadius:9,border:"none",background:"rgba(255,255,255,.06)",color:"#9a8060",fontSize:13,cursor:"pointer"}}>✕</button>
              </div>
            )}
            {!editLbl&&(
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:((exTbl&&exTbl.guests)||[]).reduce((s,g)=>s+(g.count||1),0)>=exTbl.seats?"#50c878":"#f5d060"}}>
                      {exTbl.label==="__extra__"?"⊕ Extra Masa":exTbl.label||"Masa "+expandedId}
                    </span>
                    <button onClick={()=>{
                      if(onSave) onSave();
                      setSavedFlash(true);
                      setTimeout(()=>setSavedFlash(false),1500);
                    }} style={{padding:"4px 9px",borderRadius:8,border:"1px solid "+(savedFlash?"rgba(80,200,120,.5)":"rgba(201,168,76,.3)"),background:savedFlash?"rgba(80,200,120,.15)":"rgba(201,168,76,.08)",color:savedFlash?"#50c878":"#c9a84c",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .3s"}}>
                      {savedFlash?"✅ Saxlandı":"💾 Yadda saxla"}
                    </button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                    <span style={{fontSize:10,color:"rgba(201,168,76,.4)"}}>
                      {((exTbl&&exTbl.guests)||[]).reduce((s,g)=>s+(g.count||1),0)}/{exTbl.seats} nəfər
                    </span>
                  </div>
                </div>
                <button onClick={()=>{setExpandedId(null);setPopup(null);}} style={{width:26,height:26,borderRadius:"50%",border:"1px solid rgba(201,168,76,.2)",background:"rgba(201,168,76,.07)",color:"#c9a84c",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
            )}
          </div>

          {/* TableSVG */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <TableSVG table={exTbl} size={Math.min(200,(typeof window!=="undefined"?window.innerWidth:300)-80)} clickable={true}
              onGuestClick={guestClick}
              onSlotClick={(idx)=>{
                setSlotInput({slotIdx:idx});
                setSlotName(""); setSlotCount("1");
                setSlotGender(""); setSlotExtras([]);
                setTimeout(()=>slotRef.current&&slotRef.current.focus(),60);
              }}/>
          </div>

          {slotInput&&(
            <div style={{marginTop:8,background:"rgba(20,14,4,.97)",border:"1px solid rgba(201,168,76,.3)",borderRadius:12,padding:"10px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:700,color:"#c9a84c"}}>{"Masa "+expandedId+" — Qonaq əlavə et"}</span>
                <button onClick={()=>{setSlotInput(null);setSlotName("");setSlotPhone("");setSlotCount("1");setSlotGender("");setSlotExtras([]);}}
                  style={{background:"none",border:"none",color:"#9a8060",fontSize:14,cursor:"pointer",padding:"0 2px"}}>✕</button>
              </div>

              {/* Ad Soyad */}
              <input ref={slotRef} value={slotName} onChange={e=>setSlotName(e.target.value)}
                placeholder="Ad Soyad"
                style={{display:"block",width:"100%",boxSizing:"border-box",padding:"7px 10px",marginBottom:7,
                  background:"rgba(255,255,255,.07)",border:"1px solid rgba(201,168,76,.3)",
                  borderRadius:8,color:"#f2e8d0",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>

              {/* Telefon nömrəsi */}
              <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
                <div style={{flex:1,display:"flex",alignItems:"center",background:"rgba(255,255,255,.07)",
                  border:"1px solid rgba(201,168,76,.25)",borderRadius:8,overflow:"hidden"}}>
                  <span style={{padding:"0 7px",fontSize:12,color:"rgba(201,168,76,.7)",flexShrink:0,fontWeight:600}}>+994</span>
                  <input
                    type="tel"
                    value={slotPhone}
                    onChange={e=>{
                      const v=e.target.value.replace(/[^\d\s\-]/g,"");
                      setSlotPhone(v);
                    }}
                    placeholder="XX XXX XX XX"
                    inputMode="tel"
                    style={{flex:1,padding:"7px 4px",background:"transparent",border:"none",
                      color:"#f2e8d0",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif",minWidth:0}}/>
                  {slotPhone&&(
                    <button onClick={()=>setSlotPhone("")}
                      style={{background:"none",border:"none",color:"rgba(201,168,76,.4)",fontSize:11,cursor:"pointer",padding:"0 7px",flexShrink:0}}>✕</button>
                  )}
                </div>
                {/* Kontakt düyməsi — tezliklə app versiyada aktiv olacaq */}
                <button
                  onClick={()=>alert("📱 Bu funksiya tezliklə GONAG.AZ tətbiqində aktiv olacaq!")}
                  title="Kontaktlardan seç — tezliklə"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",
                    width:36,height:36,flexShrink:0,borderRadius:8,
                    background:"rgba(201,168,76,.07)",border:"1px solid rgba(201,168,76,.2)",
                    fontSize:16,cursor:"pointer",opacity:0.6}}>
                  👤
                </button>
              </div>
              <div style={{fontSize:9,color:"rgba(201,168,76,.35)",marginBottom:7,paddingLeft:2}}>
                İstəyə bağlı — WhatsApp dəvəti üçün lazımdır
              </div>

              <div style={{display:"flex",gap:6,marginBottom:7}}>
                {[["👨 Kişi","kishi","#7aade8"],["👩 Qadın","qadin","#e87aad"]].map(([lbl,val,sc])=>(
                  <button key={val} onClick={()=>setSlotGender(g=>g===val?"":val)}
                    style={{flex:1,padding:"5px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",
                      border:"1.5px solid "+(slotGender===val?sc:"rgba(255,255,255,.08)"),
                      background:slotGender===val?sc+"22":"rgba(255,255,255,.03)",
                      color:slotGender===val?sc:"rgba(255,255,255,.3)"}}>
                    {lbl}
                  </button>
                ))}
              </div>

              <div style={{display:"flex",gap:6,marginBottom:8}}>
                {[["Böyük","#c9a84c",slotCount,
                  ()=>setSlotCount(c=>String(Math.max(1,parseInt(c||1)-1))),
                  ()=>setSlotCount(c=>String(parseInt(c||1)+1))
                ],["👧 Uşaq","#f5d060",
                  String((slotExtras.find(x=>x.type==="usher")||{count:0}).count),
                  ()=>setSlotExtras(xs=>{const n=Math.max(0,((xs.find(x=>x.type==="usher")||{count:0}).count)-1);return n===0?[]:[{type:"usher",count:n}];}),
                  ()=>setSlotExtras(xs=>{const n=((xs.find(x=>x.type==="usher")||{count:0}).count)+1;return [{type:"usher",count:n}];})
                ]].map(([lbl,sc,val,dec,inc])=>(
                  <div key={lbl} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:"rgba(255,255,255,.04)",border:"1px solid "+sc+"33",borderRadius:7,padding:"5px 8px"}}>
                    <span style={{fontSize:9,color:sc+"88"}}>{lbl}</span>
                    <button onClick={dec} style={{width:20,height:20,borderRadius:"50%",border:"none",background:sc+"22",color:sc,fontSize:14,cursor:"pointer",fontWeight:700,lineHeight:"20px",textAlign:"center",padding:0}}>−</button>
                    <span style={{fontSize:13,fontWeight:800,color:sc,minWidth:16,textAlign:"center"}}>{val}</span>
                    <button onClick={inc} style={{width:20,height:20,borderRadius:"50%",border:"none",background:sc+"22",color:sc,fontSize:14,cursor:"pointer",fontWeight:700,lineHeight:"20px",textAlign:"center",padding:0}}>+</button>
                  </div>
                ))}
              </div>

              <button onClick={()=>{
                if(!slotName.trim()) return;
                const uc=(slotExtras.find(x=>x.type==="usher")||{count:0}).count;
                const addCount=(parseInt(slotCount)||1)+uc;
                const curOcc=occ(exTbl);
                if(curOcc+addCount > exTbl.seats){
                  alert(`⚠️ Masa doludur!\n\nBu masada ${exTbl.seats} yer var, hazırda ${curOcc} dolu.\n${addCount} nəfər əlavə etmək mümkün deyil.\n\nNövbəti masanı doldurun.`);
                  return;
                }
                onAddGuest(exTbl.id,{name:slotName.trim(),phone:slotPhone.trim()?("+994"+slotPhone.trim()):"",count:parseInt(slotCount)||1,gender:slotGender,ushaqCount:uc,extras:[],side:exTbl.side||""});
                setSlotInput(null);setSlotName("");setSlotPhone("");setSlotCount("1");setSlotGender("");setSlotExtras([]);
              }} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",
                background:"linear-gradient(90deg,rgba(80,200,120,.45),rgba(80,200,120,.25))",
                color:"#78e896",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                ✓ Əlavə et
              </button>
            </div>
          )}

          {popup&&(
              <GuestPopup
                popup={popup} exTbl={exTbl} tables={tables}
                onMove={onMove} onDelete={onDelete} onEdit={onEdit} onClose={()=>setPopup(null)} popupMove={popupMove} popupMoveTgt={popupMoveTgt}
                setPopupMove={setPopupMove} setPopupMoveTgt={setPopupMoveTgt}
              />
            )}

          {/* Guest list */}
          {((exTbl&&exTbl.guests&&exTbl.guests.length||0)||0)>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8,maxHeight:160,overflowY:"auto"}}>
              {((exTbl&&exTbl.guests)||[]).map(g=>{
                const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"#c9a84c";
                return (
                  <div key={g.id} onClick={()=>guestClick(g)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(201,168,76,.04)",border:"1px solid rgba(201,168,76,.08)",borderRadius:8,cursor:"pointer"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:sc+"22",border:"1px solid "+sc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:sc}}>{g.name[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#f2e8d0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                      <div style={{fontSize:9,color:"rgba(201,168,76,.5)",marginTop:1}}>
                        {g.count>1&&g.count+" nəfər"}{g.side&&" · "+g.side}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RestCard({ rest, onPick }){
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:"1px solid rgba(201,168,76,.2)",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"#c9a84c",fontWeight:700,fontSize:14}}>🏛️ {rest.name}</div>
          <div style={{color:"rgba(201,168,76,.5)",fontSize:11,marginTop:2}}>{rest.city} · {(rest.halls&&rest.halls.length)||0} zal</div>
        </div>
        <span style={{color:"rgba(201,168,76,.4)",fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid rgba(201,168,76,.1)",padding:"8px 14px"}}>
          {(rest.halls||[]).map(h=>(
            <div key={h.id} onClick={()=>onPick(rest,h)} style={{padding:"8px 10px",borderRadius:8,marginBottom:6,cursor:"pointer",
              background:h.hasLayout?"rgba(80,200,120,.08)":"rgba(201,168,76,.07)",
              border:"1px solid "+(h.hasLayout?"rgba(80,200,120,.25)":"rgba(201,168,76,.15)")}}>
              <div style={{color:"#f2e8d0",fontSize:13,fontWeight:600}}>
                {h.name}
                {h.hasLayout&&<span style={{marginLeft:6,fontSize:10,color:"#50c878",fontWeight:700}}>🗺️ Hazır plan</span>}
              </div>
              <div style={{color:"rgba(201,168,76,.5)",fontSize:11,marginTop:2}}>{h.cap||h.capacity} nəfər</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function Bar({val,tot,color}){
  const w = tot>0?Math.round(val/tot*100):0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
      <div style={{flex:1,height:6,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:w+"%",background:color,borderRadius:3,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,color:"rgba(242,232,208,.6)",minWidth:28,textAlign:"right"}}>{val}</div>
    </div>
  );
}

function StatsPanel({ tables, ev, onClose }){
  const guests = tables.flatMap(t=>t.guests);
  const total = guests.reduce((s,g)=>s+(g.count||1),0);
  const seats = tables.reduce((s,t)=>s+t.seats,0);
  const kishi = guests.filter(g=>g.gender==="kishi").reduce((s,g)=>s+(g.count||1),0);
  const qadin = guests.filter(g=>g.gender==="qadin").reduce((s,g)=>s+(g.count||1),0);
  const ushaq = guests.flatMap(g=>g.extras||[]).filter(x=>x.type==="usher").reduce((s,x)=>s+(x.count||1),0);
  const neutral = total - kishi - qadin;
  const pct = seats>0 ? Math.round(total/seats*100) : 0;

  const gelecek = guests.filter(g=>g.rsvp==="yes").reduce((s,g)=>s+(g.count||1),0);
  const gelmir = guests.filter(g=>g.rsvp==="no").reduce((s,g)=>s+(g.count||1),0);
  const cavabsiz = total - gelecek - gelmir;

  const oglan = guests.filter(g=>g.side==="Oğlan evi").reduce((s,g)=>s+(g.count||1),0);
  const qiz = guests.filter(g=>g.side==="Qız evi").reduce((s,g)=>s+(g.count||1),0);
  const umumi = guests.filter(g=>!g.side||g.side==="Ümumi").reduce((s,g)=>s+(g.count||1),0);

  const fullTables = tables.filter(t=>t.guests.reduce((s,g)=>s+(g.count||1),0)>=t.seats).length;

  return (
    <div style={{position:"fixed",inset:0,zIndex:120,background:"rgba(0,0,0,.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",overflowY:"auto"}}>
      <div style={{maxWidth:480,margin:"0 auto",padding:"16px 14px 48px"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",letterSpacing:.5}}>Statistika</div>
            {ev&&ev.name&&<div style={{fontSize:12,color:"rgba(255,255,255,.45)",marginTop:2}}>{ev.name}{ev.date?" · "+ev.date:""}</div>}
          </div>
          <button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>✕</button>
        </div>

        {/* KPI kartlar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {ic:"👥",val:total,lbl:"Ümumi qonaq",color:"#c9a84c",bg:"rgba(201,168,76,.12)"},
            {ic:"🪑",val:seats,lbl:"Cəmi yer",color:"#7aade8",bg:"rgba(122,173,232,.12)"},
            {ic:"🗓️",val:tables.length,lbl:"Masa sayı",color:"#e87aad",bg:"rgba(232,122,173,.12)"},
            {ic:"📊",val:pct+"%",lbl:"Dolulug",color:pct>85?"#e87a7a":pct>50?"#c9a84c":"#50c878",bg:pct>85?"rgba(232,122,122,.12)":pct>50?"rgba(201,168,76,.12)":"rgba(80,200,120,.12)"},
          ].map(({ic,val,lbl,color,bg})=>(
            <div key={lbl} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"14px 16px",backdropFilter:"blur(10px)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:6,fontWeight:500}}>{ic} {lbl}</div>
              <div style={{fontSize:28,fontWeight:800,color:color,lineHeight:1}}>{val}</div>
            </div>
          ))}
        </div>

        {/* RSVP */}
        <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",marginBottom:12,backdropFilter:"blur(10px)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:1.5,marginBottom:14}}>RSVP — CAVABLAR</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {[
              {ic:"✅",val:gelecek,lbl:"Gələcək",c:"#50c878",bg:"rgba(80,200,120,.15)"},
              {ic:"❌",val:gelmir,lbl:"Gəlmir",c:"#e87a7a",bg:"rgba(232,122,122,.15)"},
              {ic:"⏳",val:cavabsiz,lbl:"Cavabsız",c:"rgba(255,255,255,.4)",bg:"rgba(255,255,255,.06)"},
            ].map(({ic,val,lbl,c,bg})=>(
              <div key={lbl} style={{flex:1,background:bg,border:"1px solid "+c+"33",borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:18}}>{ic}</div>
                <div style={{fontSize:22,fontWeight:800,color:c,lineHeight:1.1}}>{val}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.35)",marginTop:3}}>{lbl}</div>
              </div>
            ))}
          </div>
          {total>0&&(
            <div style={{height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",display:"flex"}}>
              <div style={{width:(gelecek/total*100)+"%",background:"linear-gradient(90deg,#50c878,#78e896)",borderRadius:4,transition:"width .5s"}}/>
              <div style={{width:(gelmir/total*100)+"%",background:"linear-gradient(90deg,#e87a7a,#ff9a9a)",transition:"width .5s"}}/>
              <div style={{flex:1,background:"rgba(255,255,255,.04)"}}/>
            </div>
          )}
        </div>

        {/* Cins */}
        <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",marginBottom:12,backdropFilter:"blur(10px)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:1.5,marginBottom:14}}>CİNS BÖLGÜSÜ</div>
          {[
            {ic:"👨",lbl:"Kişi",val:kishi,c:"#7aade8"},
            {ic:"👩",lbl:"Qadın",val:qadin,c:"#e87aad"},
            {ic:"👧",lbl:"Uşaq",val:ushaq,c:"#f5d060"},
            {ic:"❓",lbl:"Bilinmir",val:neutral,c:"rgba(255,255,255,.3)"},
          ].filter(x=>x.val>0||x.lbl==="Kişi"||x.lbl==="Qadın").map(({ic,lbl,val,c})=>(
            <div key={lbl} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:500}}>{ic} {lbl}</span>
                <span style={{fontSize:13,fontWeight:700,color:c}}>{val}</span>
              </div>
              <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:total>0?(val/total*100)+"%":"0%",background:c,borderRadius:3,transition:"width .6s ease"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Tərəf bölgüsü */}
        {(oglan>0||qiz>0)&&(
          <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",marginBottom:12,backdropFilter:"blur(10px)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:1.5,marginBottom:14}}>TƏRƏF BÖLGÜSÜ</div>
            <div style={{display:"flex",gap:8}}>
              {[
                {lbl:"Oğlan evi",val:oglan,c:"#7aade8",bg:"rgba(122,173,232,.15)"},
                {lbl:"Qız evi",val:qiz,c:"#e87aad",bg:"rgba(232,122,173,.15)"},
                {lbl:"Ümumi",val:umumi,c:"#c9a84c",bg:"rgba(201,168,76,.12)"},
              ].map(({lbl,val,c,bg})=>(
                <div key={lbl} style={{flex:1,background:bg,border:"1px solid "+c+"33",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:800,color:c}}>{val}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:2}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Masa üzrə */}
        <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",backdropFilter:"blur(10px)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:1.5}}>MASA ÜZRƏ</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{fullTables}/{tables.length} dolu</div>
          </div>
          {tables.map(t=>{
            const tg = t.guests.reduce((s,g)=>s+(g.count||1),0);
            const tw = t.seats>0 ? Math.round(tg/t.seats*100) : 0;
            const tc = tw>=100?"#e87a7a":tw>=70?"#c9a84c":"#50c878";
            return (
              <div key={t.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:500}}>
                    #{t.id}{t.label&&t.label!=="__extra__"?" — "+t.label:""}
                    {t.side&&<span style={{marginLeft:6,fontSize:9,color:t.side==="Oğlan evi"?"#7aade8":"#e87aad"}}>{t.side}</span>}
                  </span>
                  <span style={{fontSize:11,fontWeight:700,color:tc}}>{tg}/{t.seats}</span>
                </div>
                <div style={{height:5,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:Math.min(tw,100)+"%",background:tc,borderRadius:3,transition:"width .4s"}}/>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function MeclislerimPanel({ events, onSelect, onDelete, onClose, onNewEvent }){
  const [confirmId, setConfirmId] = useState(null);
  if(!events||events.length===0) return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"linear-gradient(145deg,#1a1208,#0f0a04)",border:"1px solid rgba(201,168,76,.25)",borderRadius:20,padding:"32px 24px",textAlign:"center",maxWidth:320,width:"90%"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:40,marginBottom:12}}>🎊</div>
        <div style={{fontSize:16,fontWeight:700,color:"#c9a84c",marginBottom:8}}>Hələ məclis yoxdur</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginBottom:20}}>Guliya ilə yeni məclis yaradın</div>
        <button onClick={onClose} style={{padding:"10px 28px",borderRadius:12,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:13,fontWeight:700,cursor:"pointer"}}>Bağla</button>
      </div>
    </div>
  );

  const statusColor = s => s==="tamamlandi"?"#50c878":s==="devetname"?"#7aade8":"#e8b87a";
  const statusLabel = s => s==="tamamlandi"?"✅ Tamamlandı":s==="devetname"?"📨 Dəvətnamə göndərildi":"⏳ Natamam";
  const typeIcon = t => t==="toy"?"💍":t==="nishan"?"💫":t==="adgunu"?"🎂":"🏢";

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}} onClick={onClose}>
      <div style={{position:"absolute",left:0,right:0,bottom:0,maxHeight:"88vh",background:"linear-gradient(180deg,#1a1208,#0a0603)",borderTop:"1px solid rgba(201,168,76,.2)",borderRadius:"20px 20px 0 0",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>

        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)"}}/>
        </div>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 18px 14px"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#c9a84c",fontWeight:700}}>Məclislərim</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:2}}>{events.length} məclis</div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:15,cursor:"pointer"}}>✕</button>
        </div>

        {/* List */}
        <div style={{flex:1,overflowY:"auto",padding:"0 14px 16px",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
          {events.map((ev,i)=>(
            <div key={ev.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,padding:"14px 16px",marginBottom:10,position:"relative"}}>

              {/* Status badge */}
              <div style={{position:"absolute",top:12,right:12,fontSize:10,fontWeight:700,color:statusColor(ev.status),background:statusColor(ev.status)+"18",border:"1px solid "+statusColor(ev.status)+"44",borderRadius:20,padding:"3px 8px"}}>
                {statusLabel(ev.status)}
              </div>

              {/* Event info */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,paddingRight:90}}>
                <div style={{fontSize:28}}>{typeIcon(ev.evType)}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#f2e8d0"}}>
                    {ev.evType==="toy"&&ev.obData&&ev.obData.boy?(ev.obData.boy+" & "+(ev.obData.girl||"...")):""}
                    {ev.evType==="toy"&&(!ev.obData||!ev.obData.boy)?"💍 Toy — davam edir":""}
                    {ev.evType==="nishan"&&ev.obData&&ev.obData.boy?(ev.obData.boy+" & "+(ev.obData.girl||"...")):""}
                    {ev.evType==="nishan"&&(!ev.obData||!ev.obData.boy)?"💫 Nişan — davam edir":""}
                    {ev.evType==="adgunu"&&ev.obData&&ev.obData.name?ev.obData.name:""}
                    {ev.evType==="adgunu"&&(!ev.obData||!ev.obData.name)?"🎂 Ad günü — davam edir":""}
                    {ev.evType==="korporativ"&&ev.obData&&ev.obData.company?ev.obData.company:""}
                    {ev.evType==="korporativ"&&(!ev.obData||!ev.obData.company)?"🏢 Korporativ — davam edir":""}
                    {!ev.evType&&"⏳ Başlanmamış məclis"}
                  </div>
                  <div style={{fontSize:11,color:"rgba(201,168,76,.5)",marginTop:2}}>
                    {ev.obData&&ev.obData.date&&<span>{ev.obData.date} · </span>}
                    {ev.hall&&ev.hall.name&&<span>{ev.hall.name} · </span>}
                    {ev.tables&&ev.tables.length>0&&<span>{ev.tables.length} masa · </span>}
                    {ev.totalGuests>0&&<span>{ev.totalGuests} qonaq</span>}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {ev.tables&&ev.tables.length>0&&(()=>{
                const filled = ev.tables.reduce((s,t)=>s+t.guests.reduce((ss,g)=>ss+(g.count||1),0),0);
                const cap = ev.tables.reduce((s,t)=>s+t.seats,0);
                const pct = cap>0?Math.round(filled/cap*100):0;
                return (
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>Masa dolulugu</span>
                      <span style={{fontSize:10,color:"#c9a84c",fontWeight:700}}>{filled}/{cap} · {pct}%</span>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:pct>=100?"#50c878":"linear-gradient(90deg,#c9a84c,#f5d060)",borderRadius:3}}/>
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>onSelect(ev)}
                  style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:"rgba(201,168,76,.2)",color:"#c9a84c",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  ▶ Davam et
                </button>
                {confirmId===ev.id?(
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <button onClick={()=>{onDelete(ev.id, ev.dbId);setConfirmId(null);}}
                      style={{padding:"6px 10px",borderRadius:8,border:"none",background:"rgba(220,80,80,.3)",color:"#ff6b6b",fontSize:11,fontWeight:700,cursor:"pointer"}}>Hə, sil</button>
                    <button onClick={()=>setConfirmId(null)}
                      style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(201,168,76,.2)",background:"transparent",color:"#9a8060",fontSize:11,cursor:"pointer"}}>Yox</button>
                  </div>
                ):(
                  <button onClick={()=>setConfirmId(ev.id)}
                    style={{width:38,height:38,borderRadius:10,border:"1px solid rgba(220,80,80,.25)",background:"rgba(220,80,80,.08)",color:"rgba(220,80,80,.6)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Sabit alt düymə */}
        <div style={{padding:"10px 14px 28px",borderTop:"1px solid rgba(201,168,76,.1)",flexShrink:0}}>
          <button onClick={()=>{onClose();if(onNewEvent)onNewEvent();}}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"1.5px solid rgba(201,168,76,.4)",
              background:"rgba(201,168,76,.12)",color:"#c9a84c",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            ✨ Yeni Məclis Yarat
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ DƏVƏTNAMƏ PNG SİSTEMİ — 4 şablon ═══
const DEVETNAME_SHABLONLAR = [
  { id:"qizili", ad:"Qızılı Klassik", bg:"#0a0700", accent:"#c9a84c", text:"#f2e8d0", sub:"rgba(242,232,208,.6)", tableBg:"#0e0a04" },
  { id:"romantik", ad:"Romantik", bg:"#1a0a12", accent:"#e87aad", text:"#f9c7d8", sub:"rgba(249,199,216,.65)", tableBg:"#0e0a04" },
  { id:"goy", ad:"Göy Zümrüd", bg:"#020d1a", accent:"#7aade8", text:"#b5d4f4", sub:"rgba(181,212,244,.65)", tableBg:"#0e0a04" },
  { id:"ag", ad:"Ağ Zərif", bg:"#faf8f2", accent:"#c9a84c", text:"#2a1f06", sub:"rgba(42,31,6,.65)", tableBg:"#fff8e8" }
];

function drawDevetnamePNG({canvas, shablon, tbl, obData, hallName, guestName}){
  const W=800, H=1200;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");
  const S=shablon;
  const isLight=S.id==="ag";
  ctx.fillStyle=S.bg; ctx.fillRect(0,0,W,H);
  if(!isLight){
    for(let i=0;i<50;i++){
      ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.25+0.05})`;
      ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*(H*0.35), Math.random()*1.5+0.3, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.strokeStyle=S.accent; ctx.lineWidth=2; ctx.strokeRect(20,20,W-40,H-40);
  ctx.lineWidth=0.8; ctx.globalAlpha=0.35; ctx.strokeRect(30,30,W-60,H-60); ctx.globalAlpha=1;
  [[42,42],[W-42,42],[42,H-42],[W-42,H-42]].forEach(([x,y])=>{ ctx.fillStyle=S.accent; ctx.font="20px serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("✦",x,y); });
  ctx.fillStyle=S.accent; ctx.font="bold 30px serif"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  ctx.fillText("✦  DƏVƏTNAMƏ  ✦", W/2, 106);
  const evName=(obData&&obData.boy&&obData.girl)?obData.boy+" & "+obData.girl:(obData&&obData.name?obData.name:obData&&obData.company?obData.company:"Məclis");
  ctx.fillStyle=S.text; ctx.font="bold 54px serif"; ctx.fillText(evName, W/2, 180);
  ctx.strokeStyle=S.accent; ctx.lineWidth=1; ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(100,196); ctx.lineTo(W-100,196); ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle=S.sub; ctx.font="22px sans-serif";
  if(guestName) ctx.fillText("Hörmətli "+guestName+",", W/2, 240);
  else ctx.fillText("Hörmətli dostlar,", W/2, 240);
  ctx.fillText("toy mərasiminə dəvət olunursunuz!", W/2, 270);
  ctx.fillStyle=S.accent; ctx.font="bold 24px sans-serif";
  if(obData&&obData.date) ctx.fillText("📅  "+obData.date, W/2, 316);
  if(hallName) ctx.fillText("🏛️  "+hallName, W/2, 350);
  ctx.strokeStyle=S.accent; ctx.lineWidth=0.8; ctx.globalAlpha=0.25;
  ctx.beginPath(); ctx.moveTo(100,372); ctx.lineTo(W-100,372); ctx.stroke(); ctx.globalAlpha=1;
  // 3D masa
  const cx=W/2, cy=555, r=88;
  const seats=tbl.seats||8, filled=(tbl.guests||[]).reduce((s,g)=>s+(g.count||1)+(g.ushaqCount||0),0);
  for(let i=0;i<seats;i++){
    const angle=(2*Math.PI/seats)*i-Math.PI/2;
    const cr=r+24; const sx=cx+cr*Math.cos(angle), sy=cy+cr*Math.sin(angle);
    ctx.fillStyle=i<Math.min(filled,seats)?"#4ade80":(isLight?"rgba(0,0,0,.15)":"rgba(255,255,255,.15)");
    ctx.save(); ctx.translate(sx,sy); ctx.rotate(angle+Math.PI/2);
    ctx.beginPath(); ctx.rect(-9,-6,18,12); ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.ellipse(cx+8,cy+r+12,r*0.88,14,0,0,Math.PI*2);
  ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,cy+10,r,16,0,0,Math.PI);
  ctx.fillStyle=isLight?"#c9941a":"#7a5c10"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle=S.tableBg; ctx.fill();
  ctx.strokeStyle=S.accent; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=S.accent; ctx.font="bold 56px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(String(tbl.id), cx, cy-4);
  ctx.font="16px sans-serif"; ctx.fillStyle=isLight?"rgba(42,31,6,.45)":"rgba(255,255,255,.3)";
  ctx.fillText(filled+"/"+seats, cx, cy+36); ctx.textBaseline="alphabetic";
  // Masa məlumatı
  ctx.fillStyle=S.accent; ctx.font="bold 22px sans-serif"; ctx.textAlign="center";
  const masaLabel="MASA № "+tbl.id+(tbl.label&&tbl.label!=="__extra__"?" — "+tbl.label:"");
  ctx.fillText(masaLabel, W/2, 688);
  ctx.strokeStyle=S.accent; ctx.lineWidth=0.8; ctx.globalAlpha=0.25;
  ctx.beginPath(); ctx.moveTo(100,702); ctx.lineTo(W-100,702); ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle=S.text; ctx.font="bold 20px sans-serif";
  ctx.fillText("Masadakı qonaqlar:", W/2, 738);
  const guests=tbl.guests||[];
  guests.slice(0,9).forEach((g,i)=>{
    const icon=g.gender==="kishi"?"👨":g.gender==="qadin"?"👩":"👤";
    ctx.fillStyle=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":S.sub;
    ctx.font="18px sans-serif";
    ctx.fillText(icon+"  "+g.name+(g.count>1?" ("+g.count+"n)":"")+(g.ushaqCount>0?" +"+g.ushaqCount+"u":""), W/2, 776+i*40);
  });
  if(guests.length>9){ ctx.fillStyle=S.sub; ctx.font="15px sans-serif"; ctx.fillText("+ "+(guests.length-9)+" nəfər daha...", W/2, 776+9*40); }
  ctx.strokeStyle=S.accent; ctx.lineWidth=0.8; ctx.globalAlpha=0.35;
  ctx.beginPath(); ctx.moveTo(100,H-68); ctx.lineTo(W-100,H-68); ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle=S.accent; ctx.font="bold 22px serif"; ctx.fillText("✦  GONAG.AZ  ✦", W/2, H-34);
}

function DevetnamePNGPanel({ tbl, allTables, obData, hallName, onClose }){
  const tables2use = allTables && allTables.length>0 ? allTables.filter(t=>(t.guests||[]).length>0) : (tbl?[tbl]:[]);
  const [activeTblIdx, setActiveTblIdx] = useState(0);
  const activeTbl = tables2use[activeTblIdx] || tbl;
  const guests = (activeTbl&&activeTbl.guests)||[];
  const [shablon, setShablon] = useState(DEVETNAME_SHABLONLAR[0]);
  const [selIdx, setSelIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const canvasRef = useRef(null);
  const previewGuest = guests[selIdx] || null;

  useEffect(()=>{ setSelIdx(0); },[activeTblIdx]);

  useEffect(()=>{
    if(canvasRef.current && activeTbl){
      drawDevetnamePNG({canvas:canvasRef.current, shablon, tbl:activeTbl, obData, hallName, guestName:previewGuest?previewGuest.name:""});
    }
  },[shablon, selIdx, activeTblIdx, obData, hallName]);

  function makeCanvas(gName, t){
    const c=document.createElement("canvas");
    drawDevetnamePNG({canvas:c, shablon, tbl:t||activeTbl, obData, hallName, guestName:gName});
    return c;
  }
  function downloadOne(g, t){
    const c=makeCanvas(g.name, t);
    const a=document.createElement("a");
    a.download="devetname-masa"+(t||activeTbl).id+"-"+g.name.replace(/\s/g,"")+".png";
    a.href=c.toDataURL("image/png"); a.click();
  }
  async function sendAllWA(){
    const withPhone=guests.filter(g=>(g.phone||"").replace(/\D/g,"").length>=7);
    if(!withPhone.length){ alert("Nömrəsi olan qonaq yoxdur!"); return; }
    setSending(true); setSentCount(0);
    const evName=(obData&&obData.boy&&obData.girl)?obData.boy+" & "+obData.girl:(obData&&obData.name?obData.name:"Məclis");
    const gList=guests.map(g=>"  • "+g.name+(g.count>1?" ("+g.count+"n)":"")).join("\n");
    for(let i=0;i<withPhone.length;i++){
      const g=withPhone[i];
      const c=makeCanvas(g.name);
      const a=document.createElement("a"); a.download="devetname-masa"+activeTbl.id+"-"+g.name.replace(/\s/g,"")+".png";
      a.href=c.toDataURL("image/png"); a.click();
      const phone=(g.phone||"").replace(/\D/g,"");
      const msg="🎊 *Dəvətnamə*\n━━━━━━━━━━━━━━\n\nHörmətli *"+g.name+"*,\n\n*"+evName+"* mərasiminə dəvət olunursunuz!\n📅 "+(obData&&obData.date?obData.date:"")+(hallName?"\n🏛️ "+hallName:"")+"\n\n━━━━━━━━━━━━━━\n🪑 *Masa № "+activeTbl.id+"*\n\n👥 *Masadakı qonaqlar:*\n"+gList+"\n\n━━━━━━━━━━━━━━\n✨ *GONAG.AZ*\n\n_(Dəvətnamə şəkli yuxarıda 👆)_";
      await new Promise(r=>setTimeout(r,600));
      window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
      setSentCount(i+1);
    }
    setSending(false);
  }
  function sendOneWA(g){
    downloadOne(g);
    const evName=(obData&&obData.boy&&obData.girl)?obData.boy+" & "+obData.girl:(obData&&obData.name?obData.name:"Məclis");
    const gList=guests.map(x=>"  • "+x.name+(x.count>1?" ("+x.count+"n)":"")).join("\n");
    const phone=(g.phone||"").replace(/\D/g,"");
    const msg="🎊 *Dəvətnamə*\n━━━━━━━━━━━━━━\n\nHörmətli *"+g.name+"*,\n\n*"+evName+"* mərasiminə dəvət olunursunuz!\n📅 "+(obData&&obData.date?obData.date:"")+(hallName?"\n🏛️ "+hallName:"")+"\n\n━━━━━━━━━━━━━━\n🪑 *Masa № "+activeTbl.id+"*\n\n👥 *Masadakı qonaqlar:*\n"+gList+"\n\n━━━━━━━━━━━━━━\n✨ *GONAG.AZ*\n\n_(Dəvətnamə şəkli yuxarıda 👆)_";
    if(phone) setTimeout(()=>window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank"),500);
    else setTimeout(()=>window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank"),500);
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.97)",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"#0a0700",borderBottom:"1px solid rgba(201,168,76,.2)",padding:"11px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:700,color:"#c9a84c"}}>🎊 Dəvətnamə PNG</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#9a8060",fontSize:20,cursor:"pointer"}}>✕</button>
      </div>

      {/* Şablon seçimi */}
      <div style={{padding:"8px 14px",background:"#0a0700",borderBottom:"1px solid rgba(201,168,76,.08)",flexShrink:0}}>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {DEVETNAME_SHABLONLAR.map(s=>(
            <button key={s.id} onClick={()=>setShablon(s)}
              style={{padding:"5px 11px",borderRadius:18,border:"1px solid "+(shablon.id===s.id?s.accent:"rgba(255,255,255,.12)"),background:shablon.id===s.id?"rgba(201,168,76,.1)":"transparent",color:shablon.id===s.id?s.accent:"rgba(255,255,255,.3)",fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {s.ad}
            </button>
          ))}
        </div>
      </div>

      {/* Masa seçimi */}
      {tables2use.length>1&&(
        <div style={{padding:"6px 14px",background:"rgba(201,168,76,.03)",borderBottom:"1px solid rgba(201,168,76,.08)",flexShrink:0}}>
          <div style={{display:"flex",gap:5,overflowX:"auto"}}>
            {tables2use.map((t,i)=>(
              <button key={t.id} onClick={()=>setActiveTblIdx(i)}
                style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+(activeTblIdx===i?"rgba(201,168,76,.6)":"rgba(255,255,255,.1)"),background:activeTblIdx===i?"rgba(201,168,76,.15)":"transparent",color:activeTblIdx===i?"#c9a84c":"rgba(255,255,255,.35)",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                Masa {t.id} ({(t.guests||[]).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ana hissə: qonaq siyahısı + preview */}
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
        {/* Sol — qonaq siyahısı */}
        <div style={{width:"40%",borderRight:"1px solid rgba(201,168,76,.08)",overflowY:"auto",background:"#070502"}}>
          <div style={{padding:"7px 10px",fontSize:9,color:"rgba(255,255,255,.25)"}}>Preview üçün seç:</div>
          {guests.length===0&&<div style={{padding:"16px",fontSize:12,color:"rgba(255,255,255,.3)",textAlign:"center"}}>Qonaq yoxdur</div>}
          {guests.map((g,i)=>{
            const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"#c9a84c";
            const hasPhone=!!(g.phone||"").replace(/\D/g,"");
            return (
              <div key={g.id||i} onClick={()=>setSelIdx(i)}
                style={{padding:"9px 10px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,.04)",background:selIdx===i?"rgba(201,168,76,.1)":"transparent"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:sc+"22",border:"1px solid "+sc+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:sc,flexShrink:0}}>{g.name[0]||"?"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#f2e8d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                    <div style={{fontSize:9,color:hasPhone?"rgba(37,211,102,.5)":"rgba(255,80,80,.4)"}}>{hasPhone?"📱":"yox"}</div>
                  </div>
                </div>
                {selIdx===i&&(
                  <div style={{display:"flex",gap:4,marginTop:7}}>
                    <button onClick={e=>{e.stopPropagation();downloadOne(g);}} style={{flex:1,padding:"5px",borderRadius:6,border:"1px solid rgba(201,168,76,.3)",background:"rgba(201,168,76,.08)",color:"#c9a84c",fontSize:9,fontWeight:700,cursor:"pointer"}}>⬇️ PNG</button>
                    <button onClick={e=>{e.stopPropagation();sendOneWA(g);}} style={{flex:1,padding:"5px",borderRadius:6,border:"none",background:"rgba(37,211,102,.2)",color:"#25d366",fontSize:9,fontWeight:700,cursor:"pointer"}}>📱 WA</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sağ — canvas preview */}
        <div style={{flex:1,overflowY:"auto",background:"#060402",display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"10px 6px"}}>
          <canvas ref={canvasRef} style={{width:"100%",maxWidth:260,borderRadius:10,display:"block"}}/>
        </div>
      </div>

      {/* Footer — hamısına göndər */}
      <div style={{padding:"10px 14px 30px",background:"#0a0700",borderTop:"1px solid rgba(201,168,76,.1)",flexShrink:0}}>
        {sending?(
          <div style={{textAlign:"center",padding:"10px"}}>
            <div style={{fontSize:13,color:"#25d366",fontWeight:700}}>📤 {sentCount}/{guests.filter(g=>(g.phone||"").replace(/\D/g,"").length>=7).length} göndərilir...</div>
          </div>
        ):(
          <button onClick={sendAllWA}
            style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:"linear-gradient(90deg,rgba(37,211,102,.5),rgba(37,211,102,.25))",color:"#25d366",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            📱 Masa {activeTbl&&activeTbl.id}-in hamısına göndər ({guests.filter(g=>(g.phone||"").replace(/\D/g,"").length>=7).length} nömrə)
          </button>
        )}
      </div>
    </div>
  );
}

function MasaDevetCard({ tbl, ev, hall, setDevetPNGOpen }){
  const [shareOpen, setShareOpen] = useState(false);
  const gold = "#c9a84c";
  const evName = (ev&&ev.name)||"Toy";
  const evDate = (ev&&ev.date)||"";
  const hallName = hall&&hall.name?hall.name:"";
  const NL = "\n";
  const guests = tbl.guests||[];
  const gList = guests.map(g=>"-  "+g.name+(g.count>1?" ("+g.count+" nəfər)":"")).join(NL);
  const msg =
    "Hörmətli dostlar,"+NL+NL+
    evName+" mərasiminə dəvət olunursunuz!"+NL+
    "Tarix: "+evDate+(hallName?NL+"Yer: "+hallName:"")+NL+NL+
    "Masa: "+(tbl.label&&tbl.label!=="__extra__"?tbl.label:tbl.id)+NL+NL+
    "Masanızdakı qonaqlar:"+NL+gList+NL+NL+
    "GONAG.AZ";

  function shareWA(){ window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank"); }
  function shareTG(){ window.open("https://t.me/share/url?url=&text="+encodeURIComponent(msg),"_blank"); }
  function copyMsg(){ try{ navigator.clipboard.writeText(msg); }catch(e){} }

  return (
    <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:14,padding:"12px 14px",marginTop:8,marginBottom:4}}>
      {/* Mini SVG sxem */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <TableSVG table={tbl} size={72}/>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:gold}}>
            {"Masa "+(tbl.label&&tbl.label!=="__extra__"?tbl.label:tbl.id)}
          </div>
          <div style={{fontSize:11,color:"rgba(201,168,76,.5)",marginTop:2}}>
            {guests.reduce((s,g)=>s+(g.count||1),0)+" nəfər"}
          </div>
        </div>
      </div>
      {/* Qonaq siyahısı */}
      <div style={{marginBottom:10}}>
        {guests.map((g,gi)=>{
          const sc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":gold;
          return (
            <div key={gi} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
              <span style={{fontSize:13}}>{g.gender==="kishi"?"👨":g.gender==="qadin"?"👩":"👤"}</span>
              <span style={{fontSize:12,color:"#f2e8d0",flex:1}}>{g.name}</span>
              {g.count>1&&<span style={{fontSize:10,color:"rgba(201,168,76,.5)"}}>{g.count+" nəfər"}</span>}
            </div>
          );
        })}
      </div>
      {/* Göndər düymələri */}
      {!shareOpen?(
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShareOpen(true)}
            style={{flex:2,padding:"9px",borderRadius:10,border:"none",background:"linear-gradient(90deg,rgba(37,211,102,.3),rgba(37,211,102,.15))",color:"#25d366",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            📤 Dəvət Göndər
          </button>
          <button onClick={()=>{ if(typeof setDevetPNGOpen==="function") setDevetPNGOpen({tbl}); }}
            style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(201,168,76,.35)",background:"rgba(201,168,76,.08)",color:"#c9a84c",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            🎊 PNG
          </button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <button onClick={shareWA} style={{padding:"9px",borderRadius:10,border:"none",background:"rgba(37,211,102,.2)",color:"#25d366",fontSize:12,fontWeight:700,cursor:"pointer"}}>📱 WhatsApp</button>
          <button onClick={shareTG} style={{padding:"9px",borderRadius:10,border:"none",background:"rgba(41,182,246,.15)",color:"#29b6f6",fontSize:12,fontWeight:700,cursor:"pointer"}}>✈️ Telegram</button>
          <button onClick={copyMsg} style={{padding:"8px",borderRadius:10,border:"1px solid rgba(201,168,76,.3)",background:"rgba(201,168,76,.08)",color:gold,fontSize:12,fontWeight:600,cursor:"pointer"}}>📋 Kopyala</button>
        </div>
      )}
    </div>
  );
}


export default function App(){
  // ── Məclislərim ──
  const [savedEvents, setSavedEvents] = useState([]);
  const savedEventsRef = useRef([]);
  useEffect(()=>{ savedEventsRef.current=savedEvents; },[savedEvents]);
  const [sessionId] = useState(()=>{
    // Sabit ID — mobil və PC eyni məlumatı görür
    return "gonag_user_main";
  });
  const [meclisOpen, setMeclisOpen] = useState(false);
  const [currentEvId, setCurrentEvId] = useState(null);

  const [msgs, setMsgs] = useState([{
    role:"agent",text:"Salam! 👋 GONAG.AZ-a xoş gəlmisiniz!\n\nMən Guliya — məclis koordinatorunuzam. 🎊\n\nHansı məclis üçün planlaşdırırsınız?",qrs:["💍 Toy","💫 Nişan","🎂 Ad günü","🏢 Korporativ"]
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRecogRef = useRef(null);
  const voiceActiveRef = useRef(false);
  const [hist, setHist] = useState([]);
  const [ev, setEv] = useState({});
  const [evType, setEvType] = useState("");
  // Onboarding state machine — tamamilə client-side
  // steps: "type"|"toy_boy"|"toy_girl"|"toy_date"
  //        "nishan_boy"|"nishan_girl"|"nishan_date"|"nishan_ring"
  //        "adgunu_name"|"adgunu_age"|"adgunu_date"|"adgunu_surprise"
  //        "korp_company"|"korp_topic"|"korp_date"
  //        "restoran"|"done"
  const [obStep, setObStep] = useState("type");
  const [obData, setObData] = useState({});
  const [tables, setTables] = useState([]);
  const [layoutMode, setLayoutMode] = useState(null); // "ready"|"photo"|"custom"
  const [layoutPickOpen, setLayoutPickOpen] = useState(false);
  const [realPhotoOpen, setRealPhotoOpen] = useState(false);
  const [hall, setHall] = useState(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [devetPNGOpen, setDevetPNGOpen] = useState(null); // {tbl}
  const [schemaTutStep, setSchemaTutStep] = useState(0); // 0=not shown, 1,2,3=steps, -1=done
  const [devetData, setDevetData] = useState({metn:"", media:null});
  const [schemaDoneConfirm, setSchemaDoneConfirm] = useState(false);
  const [schemaChanged, setSchemaChanged] = useState(false);
  const [schemaUnsaved, setSchemaUnsaved] = useState(false);
  const [schemaEmptyExit, setSchemaEmptyExit] = useState(false);
  function tryCloseSchema(){
    const totGuests=tabRef.current.reduce(function(s,t){return s+t.guests.length;},0);
    if(totGuests===0){
      // Heç kim yoxdur — boş çıxmaq istəyir
      setSchemaEmptyExit(true);
    } else if(schemaChanged){
      // Qonaqlar var amma saxlanmayıb
      setSchemaUnsaved(true);
    } else {
      setSchemaOpen(false);
    }
  }
  const [statsOpen, setStatsOpen] = useState(false);
  const [fillMode, setFillMode] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [agentSlotTable, setAgentSlotTable] = useState(null); // agent tərəfindən açılan slot
  const [restOpen, setRestOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [invitedDrawerOpen, setInvitedDrawerOpen] = useState(false);
  const [notInvitedDrawerOpen, setNotInvitedDrawerOpen] = useState(false);
  const [glog, setGlog] = useState([]);
  const endRef = useRef(null);
  const inpRef = useRef(null);
  const evRef = useRef(ev);
  const tabRef = useRef(tables);
  useEffect(()=>{ evRef.current=ev; },[ev]);
  useEffect(()=>{ tabRef.current=tables; },[tables]);
  useEffect(()=>{ endRef.current&&endRef.current.scrollIntoView({behavior:"smooth"}); },[msgs]);

  // Auto-save hər dəfə masalar dəyişəndə — yalnız aktiv məclis varsa
  const saveTimerRef = useRef(null);
  useEffect(()=>{
    if(!currentEvId) return; // aktiv məclis yoxdursa save etmə
    if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(()=>{
      saveCurrentEvent({tables:tabRef.current});
    }, 1500);
    return ()=>clearTimeout(saveTimerRef.current);
  },[tables, hall, obData, evType, currentEvId]);

  useEffect(()=>{
    // Əvvəlcə localStorage-dən yüklə — dərhal görünür
    function loadFromStorage(sbRows){
      try{
        var stored=null;
        try{ stored=window.storage?null:null; }catch(e){}
        // window.storage async-dir, birbaşa localStorage
        var raw=localStorage.getItem("gonag_events_v2");
        if(raw){
          var local=JSON.parse(raw);
          if(local&&local.length>0){
            // Supabase rows varsa onları üstün tut, yoxsa local
            if(sbRows&&sbRows.length>0){
              setSavedEvents(sbRows);
            } else {
              setSavedEvents(local);
            }
            return;
          }
        }
      }catch(e){}
      if(sbRows&&sbRows.length>0) setSavedEvents(sbRows);
    }

    // window.storage (artifact persistent storage) yoxla
    var storageLoaded=false;
    try{
      window.storage.get("gonag_events_v2").then(function(res){
        if(res&&res.value){
          try{
            var evs=JSON.parse(res.value);
            if(evs&&evs.length>0){
              setSavedEvents(evs);
              storageLoaded=true;
            }
          }catch(e){}
        }
      }).catch(function(){});
    }catch(e){}

    // Supabase-dən yüklə
    sbLoadEvents(sessionId).then(rows=>{
      if(rows&&rows.length>0){
        const evs = rows.map(r=>{
          const tblData = r.tables||{};
          const meta = tblData._meta||{};
          const actualTables = Array.isArray(tblData) ? tblData : (tblData.rows||[]);
          return {
            id: r.id+"",
            dbId: r.id,
            sessionId: r.session_id,
            evType: meta.evType||r.type||"",
            obStep: meta.obStep||"done",
            obData: meta.obData||{},
            hall: meta.hall||null,
            msgs: meta.msgs||[],
            hist: meta.hist||[],
            tables: actualTables,
            status: r.status||"natamam",
            totalGuests: meta.totalGuests||0,
            hallName: r.hall_name,
            hallTotal: r.hall_total,
            hallSeats: r.hall_seats,
          };
        });
        setSavedEvents(evs);
        // localStorage-i də güncəllə
        try{ localStorage.setItem("gonag_events_v2", JSON.stringify(evs.slice(0,20))); }catch(e){}
        try{ window.storage.set("gonag_events_v2", JSON.stringify(evs.slice(0,20))); }catch(e){}
      } else {
        // Supabase boşdur, localStorage-dən yüklə
        if(!storageLoaded) loadFromStorage(null);
      }
    }).catch(function(){
      if(!storageLoaded) loadFromStorage(null);
    });
  },[]);

  // Auto-save current event
  function saveCurrentEvent(overrides={}){
    const curEvType = overrides.evType||evType;
    if(!currentEvId && !curEvType) return;
    const evId = currentEvId || ("ev_"+Date.now());
    if(!currentEvId) setCurrentEvId(evId);

    const snap = {
      id: evId,
      evType: overrides.evType||evType,
      obData: overrides.obData||obData,
      obStep: overrides.obStep||obStep,
      ev: overrides.ev||ev,
      hall: overrides.hall||hall,
      tables: overrides.tables||tabRef.current,
      msgs: overrides.msgs||(msgs.slice(-20)),
      hist: overrides.hist||hist.slice(-20),
      totalGuests: (overrides.tables||tabRef.current).reduce((s,t)=>s+t.guests.reduce((ss,g)=>ss+(g.count||1),0),0),
      status: overrides.status||"natamam",
      savedAt: Date.now(),
    };

    // dbId-ni ref-dən al — closure bug olmur
    const existingDbId = (savedEventsRef.current.find(e=>e.id===evId))?.dbId||null;
    snap.dbId = existingDbId;

    const newEvents = [snap, ...(savedEventsRef.current.filter(e=>e.id!==evId))];
    setSavedEvents(newEvents);

    // localStorage-ə saxla — həmişə işləyir
    try{
      window.storage.set("gonag_events_v2", JSON.stringify(newEvents.slice(0,20)));
    }catch(e){
      try{ localStorage.setItem("gonag_events_v2", JSON.stringify(newEvents.slice(0,20))); }catch(e2){}
    }

    // Supabase-ə saxla
    sbSaveEvent({...snap, dbId:existingDbId, sessionId}).then(returnedId=>{
      if(returnedId){
        const finalId = returnedId;
        setSavedEvents(prev=>prev.map(e=>e.id===evId?{...e,dbId:finalId}:e));
        // ref-i də güncəllə
        const idx = savedEventsRef.current.findIndex(e=>e.id===evId);
        if(idx>=0) savedEventsRef.current[idx]={...savedEventsRef.current[idx],dbId:finalId};
        else savedEventsRef.current=[{...snap,dbId:finalId},...savedEventsRef.current];
      }
    });
    return evId;
  }

  function loadEvent(ev_snap){
    // Aktiv məclisi əvvəlcə saxla
    if(currentEvId) saveCurrentEvent({status:"natamam"});
    setCurrentEvId(ev_snap.id);
    setEvType(ev_snap.evType||"");
    setObData(ev_snap.obData||{});
    setObStep(ev_snap.obStep||"done");
    setEv(ev_snap.ev||{});
    setHall(ev_snap.hall||null);
    setTables(ev_snap.tables||[]);
    setMsgs(ev_snap.msgs||[{role:"agent",text:"Məclis yükləndi! Davam edə bilərsiniz. 👇",qrs:[]}]);
    setHist(ev_snap.hist||[]);
    if(ev_snap.tables&&ev_snap.tables.length>0) setSchemaOpen(true);
    setMeclisOpen(false);
  }

  function deleteEvent(evId){
    setSavedEvents(prev=>{
      const ev = prev.find(e=>e.id===evId);
      if(ev&&ev.dbId) sbDeleteEvent(ev.dbId);
      return prev.filter(e=>e.id!==evId);
    });
    // Əgər silinən aktiv məclisdirsə — sxemi təmizlə
    if(currentEvId===evId){
      setTables([]);
      setHall(null);
      setLayoutMode(null);
      setCurrentEvId(null);
      setObStep("type");
      setObData({});
      setHist([]);
    }
  }

  const totG = tables.reduce((s,t)=>s+(t.guests||[]).length, 0);
  const totP = tables.reduce((s,t)=>s+(t.guests||[]).reduce((ss,g)=>ss+(g.count||1),0),0);
  const totCap = tables.reduce((s,t)=>s+t.seats,0);
  const pct = totCap>0 ? Math.round(totP/totCap*100) : 0;
  const hasS = hall && tables.length>0;

  function parseCmd(raw){
    let text = raw;
    const qrs=[], adds=[], labels=[];
    let newEv=null, focN=null;
    text = text.replace(/\[QR:([^\]]+)\]/g,(_,a)=>{ (a.match(/"([^"]+)"/g)||[]).forEach(x=>qrs.push(x.slice(1,-1))); return ""; });
    text = text.replace(/\[EV:([^\]]+)\]/g,(_,a)=>{ const o={}; (a.match(/(\w+)=(?:"([^"]*)"|(\d+))/g)||[]).forEach(p=>{ const[k,v]=p.split("="); o[k]=v.startsWith('"')?v.slice(1,-1):parseInt(v); }); newEv=o; return ""; });
    text = text.replace(/\[ADD:([^\]]+)\]/g,(_,a)=>{ const o={}; (a.match(/(\w+)=(?:"([^"]*)"|(\d+))/g)||[]).forEach(p=>{ const[k,v]=p.split("="); o[k]=v.startsWith('"')?v.slice(1,-1):parseInt(v); }); adds.push(o); return ""; });
    text = text.replace(/\[LABEL:([^\]]+)\]/g,(_,a)=>{ const o={}; (a.match(/(\w+)=(?:"([^"]*)"|(\d+))/g)||[]).forEach(p=>{ const[k,v]=p.split("="); o[k]=v.startsWith('"')?v.slice(1,-1):parseInt(v); }); if(o.tbl&&o.label) labels.push(o); return ""; });
    text = text.replace(/\[FOCUS:(\d+)\]/g,(_,n)=>{ focN=parseInt(n); return ""; });
    return { text:text.trim(), qrs, adds, newEv, focN, labels };
  }

  function applyGuests(wid, cur){
    const next = cur.map(t=>({...t,guests:[...t.guests]}));
    wid.forEach(g=>{ const t=next.find(x=>x.id===g.tbl); if(t) t.guests.push(g); });
    return next;
  }

  function setGuestRsvp(gId, tblId, rsvpVal){
    setTables(ts=>ts.map(t=>t.id===tblId?{...t,guests:t.guests.map(g=>g.id===gId?{...g,rsvp:rsvpVal}:g)}:t));
    setGlog(gl=>gl.map(g=>g.id===gId?{...g,rsvp:rsvpVal}:g));
  }

  function moveGuest(gId, fromId, toId, forceExpand){
    setTables(ts=>{
      const next = ts.map(t=>({...t,guests:[...t.guests]}));
      const from = next.find(t=>t.id===fromId);
      const to = next.find(t=>t.id===toId);
      if(!from||!to) return ts;
      const idx = from.guests.findIndex(g=>g.id===gId);
      if(idx<0) return ts;
      const [g] = from.guests.splice(idx,1);
      to.guests.push({...g,tbl:toId,tableId:toId});
      if(forceExpand){
        const newOcc = to.guests.reduce((s,x)=>s+(x.count||1),0);
        if(newOcc > to.seats) to.seats = newOcc;
      }
      return next;
    });
    setSchemaChanged(true);
  }

  function deleteGuest(gId, fromId){
    setTables(ts=>ts.map(t=>t.id===fromId?{...t,guests:t.guests.filter(g=>g.id!==gId)}:t));
    setGlog(gl=>gl.filter(g=>g.id!==gId));
    setSchemaChanged(true);
  }

  function editGuest(gId, fromId, updates){
    setTables(ts=>ts.map(t=>t.id===fromId?{...t,guests:t.guests.map(g=>g.id===gId?{...g,...updates}:g)}:t));
    setGlog(gl=>gl.map(g=>g.id===gId?{...g,...updates}:g));
    setSchemaChanged(true);
  }

  function setTableLabel(tblId, label, side){
    setTables(ts=>ts.map(t=>t.id===tblId?{...t,label:label!==undefined?label:t.label,side:side!==undefined?side:t.side}:t));
  }

  function pickHall(rest, hallObj){
    const h = {...hallObj, _step:"total", _venueName:rest.name};
    setHall(h);
    setRestOpen(false);
    setLayoutMode(null);
    setLayoutPickOpen({hall:h}); // pass hall directly, don't rely on state
  }

  function confirmLayoutMode(mode, photoUrl, hallObj){
    setLayoutPickOpen(false);
    setLayoutMode(mode);
    const h = hallObj || hall;
    const isGulistan = h._venueName==="Gülüstan Sarayı" && h.name==="Böyük Zal";
    const isGulistan2 = h._venueName==="Gülüstan Sarayı" && h.name==="Kiçik Zal";

    if(mode==="ready" && isGulistan){
      const demoTables = DEMO_HALL.layout.map(t=>({
        id:t.id, seats:t.seats, label:t.label||"", side:t.side||"",
        guests:[], pos:{xPct:t.xPct, yPct:t.yPct}
      }));
      setTables(demoTables);
      if(DEMO_HALL.imageUrl) setHall(prev=>({...prev, planImageUrl:DEMO_HALL.imageUrl}));
    } else if(mode==="ready" && isGulistan2){
      const demoTables = DEMO_HALL_2.layout.map(t=>({
        id:t.id, seats:t.seats, label:t.label||"", side:t.side||"",
        guests:[], pos:{xPct:t.xPct, yPct:t.yPct}
      }));
      setTables(demoTables);
      setHall(prev=>({...prev, _hallElements: DEMO_HALL_2.elements}));
    } else if(mode==="photo" && photoUrl){
      setHall(prev=>({...prev, photoUrl}));
      setTables([]);
    } else {
      setTables([]);
    }

    const evLabel = evType==="nishan"?"Nişana":evType==="adgunu"?"Tədbirə":evType==="korporativ"?"Tədbirə":"Toya";
    const modeMsg = mode==="ready"?"🗺️ Hazır plan yükləndi!":mode==="photo"?"📸 Zal şəkli yükləndi!":"⬜ Boş sxem — masaları özünüz əlavə edin.";
    const msg = `✅ ${h._venueName} — ${h.name} seçildi!

${modeMsg}

${evLabel} ümumilikdə neçə nəfər gələcək? Rəqəm yazın:`;
    setMsgs(m=>[...m,{role:"agent",text:msg,qrs:[]}]);
    setHist(hh=>[...hh,{role:"assistant",content:msg}]);
  }

  function confirmTotal(total){
    setHall(h=>({...h, totalGuests:total, _step:"seats"}));
    const msg = `${total} nəfər qeyd edildi.\n\nBir stolda neçə nəfər planlaşdırırsınız?`;
    const qrs = ["6","8","10","12","Digər"];
    setMsgs(m=>[...m,{role:"agent",text:msg,qrs}]);
    setHist(h=>[...h,{role:"assistant",content:msg}]);
  }

  function confirmSeats(seats){
    const h = hall;
    if(!h) return;
    const base = h.totalGuests || h.cap;

    // Demo zal seçilibsə — hazır masaları saxla, yeni yaratma
    const hasDemo = h.hasLayout && tables.length>0 && tables[0].pos && tables[0].pos.xPct!=null;
    if(hasDemo){
      // Demo masaların seats-ini yenilə
      const tbls = tables.map(t=>({...t, seats}));
      setHall({...h, tblCount:tbls.length, seatsPerTable:seats, _step:"done"});
      setTables(tbls);
      setSchemaOpen(true);
      setSchemaTutStep(1); // tutorial başlat
      setFillMode("one-by-one");
      setActiveTable(null);
      const msg = `✅ ${tbls.length} masa hazır — hər masada ${seats} yer · ümumilikdə ${base} nəfər.

🗺️ Zalin real sxemi göstərilir!`;
      setMsgs(m=>[...m,{role:"agent",text:msg,qrs:[]}]);
      setHist(h2=>[...h2,{role:"assistant",content:msg}]);
      setTimeout(()=>saveCurrentEvent({tables:tbls,status:"natamam"}),100);
      return;
    }

    const tblCount = Math.max(5, Math.min(60, Math.ceil(base / seats)));
    const tbls = Array.from({length:tblCount},(_,i)=>({id:i+1,seats,guests:[],label:""}));
    setHall({...h, tblCount, seatsPerTable:seats, _step:"done"});
    setTables(tbls);
    setSchemaOpen(true);
    setSchemaTutStep(1); // tutorial başlat
    setFillMode("one-by-one");
    setMsgs(m=>[...m,{role:"agent",text:msg,qrs:[]}]);
    setHist(h2=>[...h2,{role:"assistant",content:msg}]);
    setTimeout(()=>saveCurrentEvent({tables:tbls,status:"natamam"}),100);
  }

  async function send(txt){
    if(!txt.trim()||busy) return;
    setInput("");
    setBusy(true);



    if(txt==="🔍 Restoran axtar"){ setRestOpen(true); setBusy(false); return; }

    // ═══ ONBOARDING STATE MACHINE — tamamilə client-side ═══
    function obReply(msg, qrs=[]){
      setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:msg,qrs}]);
      setHist(h=>[...h,{role:"user",content:txt},{role:"assistant",content:msg}]);
      setBusy(false);
    }
    function obWarn(msg){
      // reminder — don't advance, just warn
      setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:msg,qrs:[]}]);
      setHist(h=>[...h,{role:"user",content:txt},{role:"assistant",content:msg}]);
      setBusy(false);
    }
    const empty = !txt.trim();

    if(obStep==="type"){
      if(txt==="💍 Toy"){    setEvType("toy");        setObStep("toy_couple"); obReply("Gözəl! 💍\n\nBəyin və gəlinin adını yazın:\n(məs: Rəşad Əliyev / Günel Həsənova)"); setTimeout(()=>saveCurrentEvent({evType:"toy",obStep:"toy_couple"}),100); return; }
      if(txt==="💫 Nişan"){  setEvType("nishan");     setObStep("nishan_couple"); obReply("Mübarək! 💫\n\nOğlan və qızın adını yazın:\n(məs: Tural Quliyev / Aytən Məmmədova)"); setTimeout(()=>saveCurrentEvent({evType:"nishan",obStep:"nishan_couple"}),100); return; }
      if(txt==="🎂 Ad günü"){setEvType("adgunu");     setObStep("adgunu_name");   obReply("Əla! 🎂\n\nAd sahibinin adı-soyadı?"); setTimeout(()=>saveCurrentEvent({evType:"adgunu",obStep:"adgunu_name"}),100); return; }
      if(txt==="🏢 Korporativ"){setEvType("korporativ");setObStep("korp_company");obReply("Əla! 🏢\n\nŞirkətin adı nədir?"); setTimeout(()=>saveCurrentEvent({evType:"korporativ",obStep:"korp_company"}),100); return; }
    }

    // TOY
    if(obStep==="toy_couple"){
      if(empty){ obWarn("Zəhmət olmasa bəyin və gəlinin adını yazın 🙏\n(məs: Zahid Zəhra, və ya: Zahid Əliyev / Zəhra Quliyeva)"); return; }
      function parseCouple(t){
        // "/" və ya "," ilə ayır
        const sl=t.split(/[\/,]+/).map(s=>s.trim()).filter(Boolean);
        if(sl.length>=2) return [sl[0], sl.slice(1).join(" ")];
        // "və","ve","&" ilə ayır
        const an=t.split(/\s+(?:və|ve|&)\s+/i).map(s=>s.trim()).filter(Boolean);
        if(an.length>=2) return [an[0], an[1]];
        // boşluqla: 4+ söz → yarıya böl, 2-3 söz → birinci/qalan
        const w=t.trim().split(/\s+/);
        if(w.length===1) return [t,""];
        if(w.length===2) return [w[0],w[1]];
        if(w.length===3) return [w[0],w.slice(1).join(" ")];
        const mid=Math.floor(w.length/2);
        return [w.slice(0,mid).join(" "), w.slice(mid).join(" ")];
      }
      const [boy,girl]=parseCouple(txt);
      if(!girl){ obWarn(boy+" — gəlinin adını da əlavə edin 🙏\nMəs: "+boy+" Zəhra, yaxud: "+boy+" / Zəhra Quliyeva"); return; }
      setObData(d=>({...d,boy,girl}));
      setObStep("toy_date");
      setTimeout(()=>saveCurrentEvent({obStep:"toy_date",obData:{...obData,boy,girl}}),100);
      obReply(boy+" & "+girl+" — nə gözəl cüt! 🥂\n\nToy tarixi? (məs: 15 Avqust 2025)"); return;
    }
    if(obStep==="toy_date"){
      if(empty){ obWarn("Toy tarixini yazın zəhmət olmasa 📅"); return; }
      setObData(d=>({...d,date:txt})); setObStep("restoran");
      setTimeout(()=>saveCurrentEvent({obStep:"restoran",obData:{...obData,date:txt}}),100);
      obReply("📅 "+txt+" — qeyd edildi!\n\nİndi zal seçək 👇",["🔍 Restoran axtar"]);
      setTimeout(()=>saveCurrentEvent({obStep:"restoran",obData:{...obData,date:txt},status:"natamam"}),100);
      return;
    }

    // NİŞAN
    if(obStep==="nishan_couple"){
      if(empty){ obWarn("Zəhmət olmasa oğlan və qızın adını yazın 🙏\n(məs: Tural Aytən, yaxud: Tural Quliyev / Aytən Məmmədova)"); return; }
      function parseCouple2(t){
        const sl=t.split(/[\/,]+/).map(s=>s.trim()).filter(Boolean);
        if(sl.length>=2) return [sl[0], sl.slice(1).join(" ")];
        const an=t.split(/\s+(?:və|ve|&)\s+/i).map(s=>s.trim()).filter(Boolean);
        if(an.length>=2) return [an[0], an[1]];
        const w=t.trim().split(/\s+/);
        if(w.length===1) return [t,""];
        if(w.length===2) return [w[0],w[1]];
        if(w.length===3) return [w[0],w.slice(1).join(" ")];
        const mid=Math.floor(w.length/2);
        return [w.slice(0,mid).join(" "), w.slice(mid).join(" ")];
      }
      const [boy,girl]=parseCouple2(txt);
      if(!girl){ obWarn(boy+" — qızın adını da əlavə edin 🙏"); return; }
      setObData(d=>({...d,boy,girl})); setObStep("nishan_date");
      setTimeout(()=>saveCurrentEvent({obStep:"nishan_date",obData:{...obData,boy,girl}}),100);
      obReply(boy+" & "+girl+" — mübarək! 💫\n\nNişan tarixi?"); return;
    }
    if(obStep==="nishan_date"){
      if(empty){ obWarn("Nişan tarixini yazın zəhmət olmasa 📅"); return; }
      setObData(d=>({...d,date:txt})); setObStep("nishan_ring");
      obReply("Nişan üzükləri hazırdırmı?",["✅ Bəli, hazırdır","⏳ Hələ yox"]); return;
    }
    if(obStep==="nishan_ring"){
      setObData(d=>({...d,ring:txt})); setObStep("restoran");
      obReply("Əla! Zal seçək 👇",["🔍 Restoran axtar"]); return;
    }

    // AD GÜNÜ
    if(obStep==="adgunu_name"){
      if(empty){ obWarn("Ad sahibinin adını yazın zəhmət olmasa 🙏"); return; }
      setObData(d=>({...d,name:txt})); setObStep("adgunu_age");
      setTimeout(()=>saveCurrentEvent({obStep:"adgunu_age",obData:{...obData,name:txt}}),100);
      obReply(txt+" — neçə yaşı tamam olur?"); return;
    }
    if(obStep==="adgunu_age"){
      if(empty){ obWarn("Yaşı yazın zəhmət olmasa 🎂"); return; }
      setObData(d=>({...d,age:txt})); setObStep("adgunu_date");
      obReply(txt+" yaş — gözəl! 🎂\n\nTədbir tarixi?"); return;
    }
    if(obStep==="adgunu_date"){
      if(empty){ obWarn("Tarixi yazın zəhmət olmasa 📅"); return; }
      setObData(d=>({...d,date:txt})); setObStep("adgunu_surprise");
      obReply("Sürpriz məclis olacaqmı?",["🤫 Bəli — gizli saxlanılsın","🎉 Xeyr, açıqdır"]); return;
    }
    if(obStep==="adgunu_surprise"){
      setObData(d=>({...d,surprise:txt})); setObStep("restoran");
      obReply("Əla! Zal seçək 👇",["🔍 Restoran axtar"]); return;
    }

    // KORPORATİV
    if(obStep==="korp_company"){
      if(empty){ obWarn("Şirkətin adını yazın zəhmət olmasa 🙏"); return; }
      setObData(d=>({...d,company:txt})); setObStep("korp_topic");
      obReply(txt+" — mövzunu/tədbirin adını deyin?"); return;
    }
    if(obStep==="korp_topic"){
      if(empty){ obWarn("Tədbirin mövzusunu yazın zəhmət olmasa 🙏"); return; }
      setObData(d=>({...d,topic:txt})); setObStep("korp_date");
      obReply("Tədbir tarixi?"); return;
    }
    if(obStep==="korp_date"){
      if(empty){ obWarn("Tarixi yazın zəhmət olmasa 📅"); return; }
      setObData(d=>({...d,date:txt})); setObStep("restoran");
      setTimeout(()=>saveCurrentEvent({obStep:"restoran",obData:{...obData,date:txt}}),100);
      obReply("📅 "+txt+" — qeyd edildi! Zal seçək 👇",["🔍 Restoran axtar"]); return;
    }
    // Hall total step — neçə nəfər
    if(hall && hall._step==="total"){
      if(/^\d+$/.test(txt)){ const n=parseInt(txt); if(n>=1){ confirmTotal(n); setBusy(false); return; } }
      setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:"Zəhmət olmasa yalnız rəqəm yazın (məs: 120)",qrs:[]}]);
      setBusy(false); return;
    }
    // Hall seats step — stolda neçə nəfər
    if(hall && hall._step==="seats"){
      if(["6","8","10","12"].includes(txt)){ confirmSeats(parseInt(txt)); setBusy(false); return; }
      if(txt==="Digər"){
        setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:"Masada neçə yer olsun? Rəqəm yazın:",qrs:[]}]);
        setBusy(false); return;
      }
      if(/^\d+$/.test(txt)){ const n=parseInt(txt); if(n>=2&&n<=30){ confirmSeats(n); setBusy(false); return; } }
      setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:"Zəhmət olmasa rəqəm yazın",qrs:["6","8","10","12","Digər"]}]);
      setBusy(false); return;
    }

    // ═══ DƏVƏTNAMƏ FLOW ═══
    if(txt==="🗺️ Sxemi aç"){
      setSchemaOpen(true);
      setBusy(false); return;
    }
    if(txt==="🪑 Masa-masa ayrıca"||txt==="📨 Hamısına birdəfəlik"){
      if(totG===0){
        obReply("Hələ masalarda qonaq yoxdur! Əvvəlcə sxemə qayıdıb qonaqları əlavə et 🙏",["🗺️ Sxemi aç"]);
        return;
      }
    }
    if(txt==="🪑 Masa-masa ayrıca"){
      setDevetPNGOpen({tbl: tables.find(t=>(t.guests||[]).length>0)||tables[0]});
      obReply("Dəvətnamə paneli açıldı! 📨\n\nMətni hazırla və saxla. Sonra ⏳ Göndərilməyən bölməsindən hər masanı ayrıca seçib göndər.",["⏳ Göndərilməyən bölməsi"]);
      return;
    }
    if(txt==="📨 Hamısına birdəfəlik"){
      setDevetPNGOpen({tbl: tables.find(t=>(t.guests||[]).length>0)||tables[0]});
      obReply("Dəvətnamə paneli açıldı! 📨\n\nMətni hazırla və saxla. Sonra ⏳ Göndərilməyən bölməsindən \"Hamısını seç\" basıb hamısına birdəfəlik göndər.",["⏳ Göndərilməyən bölməsi"]);
      return;
    }
    if(txt==="📨 Dəvətnaməni hazırla"||txt==="📨 Dəvət göndər"||txt==="📨 Dəvətnamə hazırla"){
      setDevetPNGOpen({tbl: tables.find(t=>(t.guests||[]).length>0)||tables[0]});
      obReply("Dəvətnamə səhifəsi açıldı! 👇\n\nÖz şəkil/videonu yüklə və ya hazır şablonlardan birini seç. Masa məlumatları avtomatik əlavə olunacaq.",["⏳ Göndərilməyən bölməsi"]);
      return;
    }
    if(txt==="📋 Masa-masa seç"){
      const masalar=tables.filter(t=>t.guests.length>0);
      if(masalar.length===0){obReply("Hələ heç bir masada qonaq yoxdur 🙏");return;}
      const qrs=masalar.map(t=>"🪑 Masa "+(t.label&&t.label!=="__extra__"?t.label:t.id));
      obReply("Hansı masadan başlayaq? 👇",qrs);
      return;
    }
    if(txt==="📨 Hamısına birdəfəyə"){
      const masalar=tables.filter(t=>t.guests.length>0);
      if(masalar.length===0){obReply("Hələ heç bir masada qonaq yoxdur 🙏");return;}
      setObStep("devetname_all");
      setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:"Bütün masalar:",qrs:[],masaCards:masalar,ev,hall}]);
      setHist(h=>[...h,{role:"user",content:txt},{role:"assistant",content:"Bütün masalar göstərildi"}]);
      setBusy(false); return;
    }
    if(txt.startsWith("🪑 Masa ")){
      const label = txt.replace("🪑 Masa ","").trim();
      const tbl = tables.find(t=>(t.label&&t.label!=="__extra__"?String(t.label):String(t.id))===label);
      if(tbl){
        setMsgs(m=>[...m,{role:"user",text:txt,qrs:[]},{role:"agent",text:"Masa "+label+":",qrs:[],masaCard:tbl,ev,hall}]);
        setHist(h=>[...h,{role:"user",content:txt},{role:"assistant",content:"Masa "+label+" göstərildi"}]);
        setBusy(false); return;
      }
    }
    // ═══════════════════════

    const userMsg = {role:"user",text:txt,qrs:[]};
    setMsgs(m=>[...m,userMsg]);
    const nh = [...hist,{role:"user",content:txt}];
    setHist(nh);

    // Cari state-i sistem prompt-a əlavə et
    const curTables = tabRef.current;
    const tablesSummary = curTables.length > 0
      ? curTables.map(t=>{
          const occ = (t.guests||[]).reduce((s,g)=>s+(g.count||1),0);
          const names = (t.guests||[]).map(g=>g.name).join(", ");
          return `Masa ${t.id}: ${occ}/${t.seats||8} dolu${names?" — "+names:""}`;
        }).join("\n")
      : "Hələ masa yoxdur";
    const evInfo = evRef.current;
    const savedEvsList = savedEventsRef.current.map(e=>{
      const nm = e.couple||(e.obData?.boy&&e.obData?.girl?e.obData.boy+" & "+e.obData.girl:e.obData?.name||"Məclis");
      return `ID:${e.id} — ${nm} (${e.evType||"?"}, ${e.obData?.date||"tarixsiz"})`;
    }).join("\n");
    const stateInfo = `\n\nCARİ VƏZİYYƏT:
Məclis: ${evType==="toy"?"💍 Toy":evType==="nishan"?"💫 Nişan":evType==="adgunu"?"🎂 Ad günü":evType==="korporativ"?"🏢 Korporativ":"Seçilməyib"}
${evInfo?.obData?.boy?`Bəy: ${evInfo.obData.boy}, Gəlin: ${evInfo.obData.girl}`:""}
${evInfo?.obData?.date?`Tarix: ${evInfo.obData.date}`:""}
${hall?`Zal: ${hall._venueName||""} — ${hall.name||""}`:"Zal seçilməyib"}
Masalar:
${tablesSummary}

YADDA SAXLANMIŞ MƏCLİSLƏR:
${savedEvsList||"Yoxdur"}`;

    try {
      const res = await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:SYS+stateInfo,
          messages:nh
        })
      });
      const d = await res.json();
      const raw = (d.content&&d.content[0]&&d.content[0].text)||"Xəta baş verdi.";

      // Agent əmrlərini icra et
      if(raw.includes("[OPEN_SCHEMA]")){ setSchemaOpen(true); }
      if(raw.includes("[OPEN_INVITE]")){ /* dəvətnamə paneli */ }
      if(raw.includes("[OPEN_REST]")){ setRestOpen(true); }
      if(raw.includes("[SHOW_STATS]")){ setStatsOpen&&setStatsOpen(true); }

      // [ADD_GUEST_PANEL:ID] — sxemi aç, masanı seç, slot formu aç
      const addPanelMatch = raw.match(/\[ADD_GUEST_PANEL:(\d+)\]/);
      if(addPanelMatch){
        const tId = parseInt(addPanelMatch[1]);
        setSchemaOpen(true);
        setActiveTable(tId);
        setAgentSlotTable(tId);
      }

      // [OPEN_TABLE:ID] — tək masanı seç
      const tableMatch = raw.match(/\[OPEN_TABLE:(\d+)\]/);
      if(tableMatch){
        const tId = parseInt(tableMatch[1]);
        setActiveTable(tId);
        setSchemaOpen(true);
      }

      // [OPEN_MECLIS:ID_or_NAME] — yadda saxlanmış məclisi aç
      const meclisMatch = raw.match(/\[OPEN_MECLIS:([^\]]+)\]/);
      if(meclisMatch){
        const mId = meclisMatch[1].trim();
        const evs = savedEventsRef.current;
        // Əvvəlcə ID ilə axtar, sonra ad ilə
        let found = evs.find(e=>e.id===mId);
        if(!found){
          const mIdLow = mId.toLowerCase();
          found = evs.find(e=>{
            const nm = (e.couple||""+" "+(e.obData?.boy||"")+" "+(e.obData?.girl||"")+" "+(e.obData?.name||"")).toLowerCase();
            return nm.includes(mIdLow) || mIdLow.split(" ").some(w=>w.length>2&&nm.includes(w));
          });
        }
        if(found){ loadEvent(found); gulivaSpeak(found.couple||"Məclis yükləndi"); }
        else { gulivaSpeak("Bu adda məclis tapılmadı."); }
      }

      // [ADD_GUEST:MasaID:Ad:Say] parse et
      const addMatches = [...raw.matchAll(/\[ADD_GUEST:(\d+):([^:]+):(\d+)\]/g)];
      if(addMatches.length>0){
        addMatches.forEach(m=>{
          const tblId=parseInt(m[1]), gName=m[2].trim(), gCount=parseInt(m[3])||1;
          const newG={id:Date.now()+Math.random(),name:gName,count:gCount,phone:"",gender:"",invited:false,tableId:tblId};
          const next=applyGuests([newG],tabRef.current);
          setTables(next);
        });
      }

      // Əmr etiketlərini cavabdan çıxar
      const cleanRaw = raw.replace(/\[OPEN_SCHEMA\]|\[OPEN_INVITE\]|\[OPEN_REST\]|\[SHOW_STATS\]|\[ADD_GUEST_PANEL:\d+\]|\[ADD_GUEST:[^\]]+\]|\[OPEN_TABLE:\d+\]|\[OPEN_MECLIS:[^\]]+\]/g,"").trim();

      const {text,qrs,newEv,adds,focN,labels} = parseCmd(cleanRaw);
      let cur = tabRef.current;
      if(newEv){ const merged={...evRef.current,...newEv}; setEv(merged); }
      if(adds.length>0){
        const wid = adds.filter(g=>g.name).map(g=>({...g,id:Date.now()+Math.random(),tableId:g.tbl}));
        const next = applyGuests(wid,cur);
        setTables(next); setGlog(gl=>[...gl,...wid]); cur=next;
      }
      if(labels.length>0){
        labels.forEach(({tbl,label})=>setTableLabel(tbl,label));
      }
      if(focN!==null) setActiveTable(focN);
      if(qrs.includes("🔍 Restoran axtar")) setRestOpen(true);
      setMsgs(m=>[...m,{role:"agent",text,qrs}]);
      setHist([...nh,{role:"assistant",content:raw}]);
      // Guliya səslə cavab verir
      const plainText = text.replace(/[🎊✅📅🗺️📸⬜💍💫🎂🏢🥂👇🔍]/g,"").replace(/\n/g," ").trim();
      gulivaSpeak(plainText);
    } catch(e){
      setMsgs(m=>[...m,{role:"agent",text:"Xəta baş verdi. Yenidən cəhd edin.",qrs:[]}]);
    }
    setBusy(false);
    inpRef.current&&inpRef.current.focus();
  }

  function gulivaSpeak(text){
    if(!text) return;
    // Android Chrome-da speechSynthesis user gesture tələb edir
    // Voices yüklənməyibsə — yenidən cəhd et
    const doSpeak = ()=>{
      if(!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang="az-AZ"; u.rate=1.0; u.pitch=1.1; u.volume=1;
      const vs=window.speechSynthesis.getVoices();
      // Əvvəlcə Azərbaycan, sonra Türk, sonra Rus, sonra default
      const v=vs.find(x=>x.lang.startsWith("az"))
        ||vs.find(x=>x.lang.startsWith("tr"))
        ||vs.find(x=>x.lang.startsWith("ru"))
        ||vs.find(x=>x.lang.startsWith("en")&&x.name.toLowerCase().includes("female"))
        ||vs[0];
      if(v) u.voice=v;
      setIsSpeaking(true);
      u.onend=()=>{
        setIsSpeaking(false);
        setTimeout(()=>{
          if(voiceActiveRef.current && !isListening) startVoice();
        },400);
      };
      u.onerror=()=>{ setIsSpeaking(false); };
      window.speechSynthesis.speak(u);
      // Android workaround — səs başlamırsa resume et
      setTimeout(()=>{
        if(window.speechSynthesis.paused) window.speechSynthesis.resume();
      },100);
    };
    const vs=window.speechSynthesis.getVoices();
    if(vs.length>0){ doSpeak(); }
    else{
      window.speechSynthesis.onvoiceschanged=()=>{ doSpeak(); };
      // 500ms gözlə, əgər voices gəlmədisə yenə cəhd et
      setTimeout(doSpeak, 500);
    }
  }

  function toggleVoice(){
    if(isSpeaking){ window.speechSynthesis&&window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    if(isListening){ stopVoice(); return; }
    startVoice();
  }

  function startVoice(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ alert("Mikrofon bu brauzerdə işləmir. Chrome istifadə edin."); return; }
    const r=new SR();
    r.lang="az-AZ"; r.interimResults=false; r.continuous=true;
    r.onstart=()=>setIsListening(true);
    r.onresult=e=>{
      // Yalnız son nəticəni al
      const result = e.results[e.results.length-1];
      if(!result.isFinal) return;
      const t=result[0].transcript.trim();
      if(!t) return;
      const lower=t.toLowerCase();
      // "Guliya dur/dayans/stop" — dayandır
      if(lower.includes("dur")||lower.includes("dayans")||lower.includes("stop")){
        gulivaSpeak("Dayandım. Lazım olanda yenidən çağırın.");
        stopVoice();
        return;
      }
      // "Guliya" açar sözü təkrar aktivləşmə
      if((lower==="guliya"||lower==="güliya")&&lower.length<10){
        gulivaSpeak("Bəli, buyurun!");
        return;
      }
      send(t);
    };
    r.onerror=e=>{
      if(e.error==="not-allowed"){ gulivaSpeak("Mikrofon icazəsi lazımdır."); setIsListening(false); return; }
      // Digər xətalarda yenidən başla
      if(voiceActiveRef.current && e.error!=="aborted"){
        setTimeout(()=>{ if(voiceActiveRef.current) startVoice(); },1000);
      }
    };
    r.onend=()=>{
      setIsListening(false);
      // Guliya danışmırsa və aktiv rejim varsa — yenidən başla
      if(voiceActiveRef.current){
        setTimeout(()=>{
          if(voiceActiveRef.current) startVoice();
        },500);
      }
    };
    voiceRecogRef.current=r;
    voiceActiveRef.current=true;
    try{ r.start(); }catch(e){}
  }

  function stopVoice(){
    voiceActiveRef.current=false;
    setIsListening(false);
    if(voiceRecogRef.current) try{ voiceRecogRef.current.stop(); }catch(e){}
  }

  const CSS = `\n@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');\n*{box-sizing:border-box;margin:0;padding:0;}\nhtml,body,#root{height:100%;font-family:'DM Sans',sans-serif;color:#f2e8d0;}\n.app{height:100vh;display:flex;flex-direction:column;background:#080604;}\n.tb{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(201,168,76,.06);border-bottom:1px solid rgba(201,168,76,.12);flex-shrink:0;}\n.logo{font-family:'Playfair Display',serif;font-size:18px;color:#c9a84c;letter-spacing:3px;}\n.logo span{color:#f2e8d0;font-style:italic;}\n.pill{display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(201,168,76,.1);border-radius:20px;border:1px solid rgba(201,168,76,.2);}\n.dot{width:7px;height:7px;border-radius:50%;background:#50c878;animation:pulse 2s ease infinite;}\n@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(80,200,120,.4)}70%{box-shadow:0 0 0 7px rgba(80,200,120,0)}100%{box-shadow:0 0 0 0 rgba(80,200,120,0)}}\n.pn{font-size:11px;color:#e8cc78;font-weight:600;}\n.tbx{display:flex;gap:6px;}\n.tt{padding:6px 12px;border-radius:8px;border:1px solid rgba(201,168,76,.25);background:rgba(201,168,76,.08);color:#c9a84c;font-size:12px;cursor:pointer;}\n.tt:hover{background:rgba(201,168,76,.18);}\n.split{flex:1;display:flex;overflow:hidden;}\n.chat-panel{width:320px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid rgba(201,168,76,.12);background:#080604;}\n.schema-panel{flex:1;overflow:hidden;background:#060402;display:flex;flex-direction:column;}\n.schema-hdr{padding:10px 14px;border-bottom:1px solid rgba(201,168,76,.1);flex-shrink:0;}\n.schema-body{flex:1;overflow:hidden;}\n.body{flex:1;display:flex;flex-direction:column;overflow:hidden;}\n.chat{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}\n.chat::-webkit-scrollbar{width:3px;}.chat::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);}\n.mw{display:flex;gap:8px;animation:mi .2s ease;}\n@keyframes mi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}\n.mw.user{flex-direction:row-reverse;}\n.av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}\n.av.a{background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);}\n.av.u{background:rgba(255,255,255,.06);}\n.bb{padding:9px 12px;border-radius:12px;font-size:12px;line-height:1.5;max-width:90%;white-space:pre-wrap;}\n.bb.a{background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.12);color:#f2e8d0;}\n.bb.u{background:rgba(255,255,255,.07);color:#f2e8d0;margin-left:auto;}\n.qw{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;}\n.qb{padding:6px 11px;border-radius:16px;border:1px solid rgba(201,168,76,.35);background:rgba(201,168,76,.08);color:#e8cc78;font-size:11px;cursor:pointer;}\n.qb:hover{background:rgba(201,168,76,.2);}\n.tbb{display:flex;align-items:center;justify-content:center;min-width:44px;}\n.ds{display:flex;gap:3px;}.ds span{width:5px;height:5px;border-radius:50%;background:#c9a84c;animation:ds .9s ease infinite;}\n.ds span:nth-child(2){animation-delay:.2s;}.ds span:nth-child(3){animation-delay:.4s;}\n@keyframes ds{0%,80%,100%{opacity:.2}40%{opacity:1}}\n.ir{padding:8px 12px;display:flex;gap:6px;border-top:1px solid rgba(201,168,76,.1);flex-shrink:0;}\n.inp{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:9px 12px;color:#f2e8d0;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;}\n.inp:focus{border-color:rgba(201,168,76,.5);}\n.sndb{padding:9px 14px;background:rgba(201,168,76,.2);border:1px solid rgba(201,168,76,.4);border-radius:10px;color:#c9a84c;font-size:15px;cursor:pointer;}\n.sndb:hover{background:rgba(201,168,76,.35);}\n.sndb:disabled{opacity:.3;cursor:not-allowed;}\n.qbar{display:flex;gap:5px;padding:7px 12px;border-top:1px solid rgba(201,168,76,.08);flex-wrap:wrap;flex-shrink:0;}\n.qbn{padding:6px 11px;border-radius:16px;border:1px solid rgba(201,168,76,.2);background:transparent;color:#9a8060;font-size:11px;cursor:pointer;}\n.qbn:hover{border-color:rgba(201,168,76,.4);color:#c9a84c;}\n.qbn.on{border-color:rgba(201,168,76,.4);color:#c9a84c;background:rgba(201,168,76,.08);}\n.cnt{display:inline-block;margin-left:4px;background:rgba(201,168,76,.25);border-radius:10px;padding:0 5px;font-size:10px;}\n.ov{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:center;justify-content:center;}\n.rsp{background:#0f0a04;border:1px solid rgba(201,168,76,.2);border-radius:16px;width:90%;max-width:480px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;}\n.rsh{padding:14px 16px;border-bottom:1px solid rgba(201,168,76,.12);}\n.rsi{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(201,168,76,.2);border-radius:8px;padding:8px 12px;color:#f2e8d0;font-size:13px;margin-top:8px;outline:none;}\n.rsb{overflow-y:auto;padding:12px 16px;flex:1;}\n.dcl{background:transparent;border:none;color:#9a8060;font-size:18px;cursor:pointer;padding:4px 8px;}\n.back-btn{padding:7px 14px;border-radius:8px;border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.06);color:#c9a84c;font-size:12px;cursor:pointer;}\n.back-btn:hover{background:rgba(201,168,76,.15);}\n.pbar-bg{height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;margin-top:4px;}\n.pbar{height:100%;background:linear-gradient(90deg,#c9a84c,#e8cc78);border-radius:2px;transition:width .5s;}
@keyframes tpulse{0%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(1.3)}65%{transform:translate(-50%,-50%) scale(0.92)}100%{transform:translate(-50%,-50%) scale(1)}}
.tpulse{animation:tpulse 0.65s ease;}
.lp-selected{filter:drop-shadow(0 0 8px rgba(255,60,60,0.9));}
@keyframes fingerpoint{0%{opacity:0;transform:translate(-50%,-120%) scale(0.7)}20%{opacity:1;transform:translate(-50%,-120%) scale(1)}80%{opacity:1;transform:translate(-50%,-120%) scale(1)}100%{opacity:0;transform:translate(-50%,-130%) scale(0.8)}}
.finger{animation:fingerpoint 1s ease forwards;}\n`;

  return (
    <div>
      <style>{CSS}</style>
      <div className="app">
        {/* TOP BAR */}
        <div className="tb">
          <div className="logo">GONAG<span>.AZ</span></div>
          <div className="pill"><div className="dot"/><span className="pn">Guliya</span></div>
          <div className="tbx">
            <button className="tt" onClick={()=>setMeclisOpen(true)} style={{position:"relative"}}>
              🗂 Məclislərim
              {savedEvents.length>0&&<span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#c9a84c",color:"#080604",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{savedEvents.length}</span>}
            </button>
          </div>
        </div>

        <div className="body">
          <div className="chat">
            {msgs.map((m,i)=>(
              <div key={i} className={"mw "+m.role}>
                <div className={"av "+(m.role==="agent"?"a":"u")}>{m.role==="agent"?"👩‍💼":"👤"}</div>
                <div>
                  <div className={"bb "+(m.role==="agent"?"a":"u")}>{m.text}</div>
                  {m.masaCard&&(
                    <MasaDevetCard tbl={m.masaCard} ev={m.ev} hall={m.hall} setDevetPNGOpen={setDevetPNGOpen}/>
                  )}
                  {m.masaCards&&m.masaCards.map((t,ti)=>(
                    <MasaDevetCard key={ti} tbl={t} ev={m.ev} hall={m.hall} setDevetPNGOpen={setDevetPNGOpen}/>
                  ))}
                  {m.role==="agent"&&i===msgs.length-1&&(m.qrs&&m.qrs.length)>0&&(
                    <div className="qw">{m.qrs.map((q,qi)=><button key={qi} className="qb" onClick={()=>send(q)}>{q}</button>)}</div>
                  )}
                </div>
              </div>
            ))}
            {busy&&<div className="mw agent"><div className="av a">👩‍💼</div><div className="bb a tbb"><div className="ds"><span/><span/><span/></div></div></div>}
            <div ref={endRef}/>
          </div>
          <div className="ir">
            <button onClick={toggleVoice} style={{
              width:40,height:40,borderRadius:"50%",border:"2px solid",flexShrink:0,
              borderColor:isListening?"#50c878":isSpeaking?"#c9a84c":"rgba(201,168,76,.4)",
              background:isListening?"rgba(80,200,120,.2)":isSpeaking?"rgba(201,168,76,.2)":"rgba(201,168,76,.08)",
              color:isListening?"#50c878":isSpeaking?"#c9a84c":"rgba(201,168,76,.7)",
              fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .2s",
              boxShadow:isListening?"0 0 12px rgba(80,200,120,.5)":isSpeaking?"0 0 12px rgba(201,168,76,.4)":"none"
            }}>
              {isListening?"🔴":isSpeaking?"🔊":"🎙️"}
            </button>
            <input ref={inpRef} className="inp" placeholder="Yazın..." value={input}
              onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}} disabled={busy}/>
            <button className="sndb" onClick={()=>send(input)} disabled={!input.trim()||busy}>➤</button>
          </div>
          <div className="qbar">
            {hasS&&<button className="qbn on" onClick={()=>{
              setSchemaOpen(true);
              if(schemaTutStep===0) setSchemaTutStep(1);
            }}>
              🗺️ Sxem <span className="cnt">{tables.length}</span>
            </button>}
            {tables.length>0&&<button className="qbn on" onClick={()=>{
              if(totG===0){
                setMsgs(m=>[...m,{role:"agent",text:"Əvvəlcə masalara qonaq əlavə et! 🙏\n\nSxemi aç → masaları doldur → sonra dəvətnamə göndər.",qrs:["🗺️ Sxemi aç","Sonra"]}]);
                return;
              }
              // Birinci masanı PNG panelə aç
              const firstTbl = tables.find(t=>(t.guests||[]).length>0)||tables[0];
              setDevetPNGOpen({tbl: firstTbl});
            }}>
              📨 Dəvətnamə
            </button>}
            {totG>0&&(()=>{
              const invCnt=tables.flatMap(t=>t.guests).filter(g=>g.invited).length;
              const notCnt=totG-invCnt;
              return (<>
                <button className="qbn on" onClick={()=>setInvitedDrawerOpen(true)}
                  style={{borderColor:"rgba(80,200,120,.4)",color:"#50c878",background:"rgba(80,200,120,.08)"}}>
                  ✓ Göndərilən <span className="cnt" style={{background:"rgba(80,200,120,.3)"}}>{invCnt}</span>
                </button>
                <button className="qbn on" onClick={()=>setNotInvitedDrawerOpen(true)}
                  style={{borderColor:"rgba(232,184,122,.4)",color:"#e8b87a",background:"rgba(232,184,122,.06)"}}>
                  ⏳ Göndərilməyən <span className="cnt" style={{background:"rgba(232,184,122,.25)"}}>{notCnt}</span>
                </button>
              </>);
            })()}
            {totG>0&&<button className="qbn on" onClick={()=>setStatsOpen(true)}>
              📊 Statistika
            </button>}
            {totG>0&&<button className="qbn on" onClick={()=>printAll(tables,obData,hall)}>
              🖨️ Çap et
            </button>}
          </div>
        </div>
      </div>

      {/* MƏCLİSLƏRİM PANEL */}
      {devetPNGOpen&&(
        <DevetnamePNGPanel
          tbl={devetPNGOpen.tbl}
          allTables={tables}
          obData={obData}
          hallName={hall?hall._venueName+(hall.name?" — "+hall.name:""):""}
          onClose={()=>setDevetPNGOpen(null)}
        />
      )}
      {meclisOpen&&(
        <MeclislerimPanel
          events={savedEvents}
          onSelect={loadEvent}
          onDelete={deleteEvent}
          onClose={()=>setMeclisOpen(false)}
          onNewEvent={()=>{
            setMeclisOpen(false);
            // Əvvəlcə aktiv məclisi saxla
            if(currentEvId) saveCurrentEvent({status:"natamam"});
            setEvType(null); setObStep("type"); setObData({});
            setTables([]); setHall(null); setCurrentEvId(null);
            setHist([]);
            setMsgs([{role:"agent",text:"Salam! 👋 Yeni məclis başladırıq!\n\nHansı məclis üçün planlaşdırırsınız?",qrs:["💍 Toy","💫 Nişan","🎂 Ad günü","🏢 Korporativ"]}]);
          }}
        />
      )}

      {/* RESTAURANT MODAL */}
      {realPhotoOpen&&hall&&(
        <div style={{position:"fixed",inset:0,zIndex:300,
          backgroundImage:`url(${hall.planImageUrl||DEMO_HALL.imageUrl})`,
          backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundPosition:"center",
          backgroundColor:"rgba(0,0,0,.95)"}}
          onClick={()=>setRealPhotoOpen(false)}>
          <div style={{position:"absolute",top:16,left:0,right:0,textAlign:"center",
            color:"rgba(201,168,76,.7)",fontSize:12,letterSpacing:1}}>
            {hall._venueName} — {hall.name}
          </div>
          <div style={{position:"absolute",bottom:24,left:0,right:0,textAlign:"center",
            color:"rgba(255,255,255,.3)",fontSize:11}}>
            Bağlamaq üçün toxun
          </div>
        </div>
      )}

      {layoutPickOpen&&(
        <LayoutPickerModal
          hall={layoutPickOpen.hall||hall}
          onConfirm={(mode,photoUrl)=>confirmLayoutMode(mode,photoUrl,layoutPickOpen.hall||hall)}
          onClose={()=>setLayoutPickOpen(false)}
        />
      )}

      {restOpen&&(
        <div className="ov" onClick={()=>setRestOpen(false)}>
          <div className="rsp" onClick={e=>e.stopPropagation()}>
            <div className="rsh">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"'Playfair Display',serif",color:"#c9a84c",fontSize:16}}>🏛️ Restoran seç</div>
                <button className="dcl" onClick={()=>setRestOpen(false)}>✕</button>
              </div>
            </div>
            <div className="rsb">
              {RESTAURANTS.map(r=><RestCard key={r.id} rest={r} onPick={pickHall}/>)}
            </div>
          </div>
        </div>
      )}

      {/* SCHEMA BOTTOM DRAWER */}
      {/* STATİSTİKA */}
      {statsOpen&&(
        <StatsPanel
          tables={tables}
          ev={ev}
          onClose={()=>setStatsOpen(false)}
        />
      )}


      {schemaOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:100}} onClick={()=>tryCloseSchema()}>
          <div style={{position:"absolute",left:0,right:0,bottom:0,maxHeight:"90vh",background:"#0a0603",borderTop:"1px solid rgba(201,168,76,.2)",borderRadius:"20px 20px 0 0",display:"flex",flexDirection:"column",overflowY:"hidden"}} onClick={e=>e.stopPropagation()}>
            {/* Handle */}
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 16px 10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontFamily:"'Playfair Display',serif",color:"#c9a84c",fontSize:16}}>🗺️ Masa Sxemi</div>
                {schemaTutStep===-1&&(
                  <button onClick={()=>setSchemaTutStep(1)}
                    style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(201,168,76,.4)",
                      background:"rgba(201,168,76,.1)",color:"#c9a84c",fontSize:11,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>?</button>
                )}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {hall&&(hall.planImageUrl||DEMO_HALL.imageUrl)&&(
                  <button onClick={()=>setRealPhotoOpen(true)}
                    style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(201,168,76,.35)",
                      background:"rgba(201,168,76,.1)",color:"#c9a84c",fontSize:11,
                      fontWeight:700,cursor:"pointer"}}>
                    📸 Real şəkil
                  </button>
                )}
                <button style={{background:"transparent",border:"none",color:"#9a8060",fontSize:18,cursor:"pointer"}} onClick={()=>tryCloseSchema()}>✕</button>
              </div>
            </div>

            {/* TUTORIAL OVERLAY */}
            {schemaTutStep>0&&schemaTutStep<=3&&(
              <SchemaTutTooltip
                step={schemaTutStep}
                onNext={()=>setSchemaTutStep(schemaTutStep<3?schemaTutStep+1:-1)}
                onSkip={()=>setSchemaTutStep(-1)}
                onBack={()=>setSchemaTutStep(schemaTutStep-1)}
              />
            )}
            <div style={{flex:1,overflowY:"auto",padding:"0 14px 16px",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
              <SchemaDrawer
                tables={tables}
                activeTable={activeTable}
                agentSlotTable={agentSlotTable}
                onAgentSlotClear={()=>setAgentSlotTable(null)}
                hall={hall}
                pct={pct}
                onSave={()=>{ saveCurrentEvent({tables}); setSchemaChanged(false); }}
                layoutMode={layoutMode}
                onAddTable={()=>{
                  const newId = (tables.length>0?Math.max(...tables.map(t=>t.id)):0)+1;
                  const newT = {id:newId,seats:10,guests:[],label:"",pos:{xPct:50,yPct:50}};
                  setTables(ts=>[...ts,newT]);
                }}
                onTableClick={(id)=>{
                  setActiveTable(id);
                  if(fillMode==="one-by-one"){
                    const t=tabRef.current.find(x=>x.id===id);
                    const msg=`${id}-ci masa seçildi${(t&&t.label)?" ("+t.label+")":""}. Qonaqları əlavə edin.`;
                    setMsgs(m=>[...m,{role:"agent",text:msg,qrs:[]}]);
                  }
                }} onMove={moveGuest}
                onDelete={deleteGuest}
                onEdit={editGuest}
                onLabel={setTableLabel}
                onPositionChange={(tblId,pos)=>{
                  setTables(ts=>ts.map(t=>t.id===tblId?{...t,pos}:t));
                }} onAddGuest={(tblId,g)=>{
                  const wid=[{...g,id:Date.now()+Math.random(),tbl:tblId,tableId:tblId}];
                  setTables(ts=>{
                    const next=ts.map(t=>t.id===tblId?{...t,guests:[...t.guests,...wid]}:t);
                    setTimeout(()=>saveCurrentEvent({tables:next}),200);
                    return next;
                  });
                  setGlog(gl=>[...gl,...wid]);
                  setSchemaChanged(true);
                }}
              />
            </div>

            {/* Boş çıxmaq promptu */}
            {schemaEmptyExit&&(
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.85)",zIndex:60,
                display:"flex",alignItems:"center",justifyContent:"center",
                borderRadius:"20px 20px 0 0"}} onClick={function(e){e.stopPropagation();}}>
                <div style={{background:"linear-gradient(145deg,#1e1608,#140f05)",
                  border:"1.5px solid rgba(232,184,122,.35)",borderRadius:16,
                  padding:"20px",width:"82%",maxWidth:280}}>
                  <div style={{fontSize:24,textAlign:"center",marginBottom:8}}>⚠️</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,
                    color:"#e8b87a",textAlign:"center",marginBottom:8}}>
                    Masalar boşdur
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.6)",textAlign:"center",
                    lineHeight:1.6,marginBottom:16}}>
                    Hələ heç bir qonaq əlavə edilməyib. Əmin olduqda çıxa bilərsiniz.
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <button onClick={function(){
                      setSchemaEmptyExit(false);
                    }} style={{padding:"11px",borderRadius:10,border:"none",
                      background:"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))",
                      color:"#f2e8d0",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      ← Qayıt, qonaq əlavə edim
                    </button>
                    <button onClick={function(){
                      setSchemaEmptyExit(false);
                      setSchemaOpen(false);
                    }} style={{padding:"10px",borderRadius:10,
                      border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.05)",
                      color:"rgba(255,255,255,.45)",fontSize:12,cursor:"pointer"}}>
                      Sonra əlavə edəcəm, çıxım
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Saxlanmayıb prompt */}
            {schemaUnsaved&&(
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.85)",zIndex:60,
                display:"flex",alignItems:"center",justifyContent:"center",
                borderRadius:"20px 20px 0 0"}} onClick={function(e){e.stopPropagation();}}>
                <div style={{background:"linear-gradient(145deg,#1e1608,#140f05)",
                  border:"1.5px solid rgba(201,168,76,.4)",borderRadius:16,
                  padding:"20px",width:"82%",maxWidth:280}}>
                  <div style={{fontSize:22,textAlign:"center",marginBottom:8}}>💾</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,
                    color:"#c9a84c",textAlign:"center",marginBottom:8}}>
                    Dəyişikliklər saxlanmayıb
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.6)",textAlign:"center",
                    lineHeight:1.6,marginBottom:16}}>
                    Qonaqlar yadda saxlanılsın?
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <button onClick={function(){
                      saveCurrentEvent({tables:tabRef.current});
                      setSchemaChanged(false);
                      setSchemaUnsaved(false);
                      setSchemaOpen(false);
                    }} style={{padding:"11px",borderRadius:10,border:"none",
                      background:"linear-gradient(90deg,rgba(201,168,76,.5),rgba(201,168,76,.3))",
                      color:"#f2e8d0",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      Bəli, saxla və çıx
                    </button>
                    <button onClick={function(){
                      setSchemaChanged(false);
                      setSchemaUnsaved(false);
                      setSchemaOpen(false);
                    }} style={{padding:"10px",borderRadius:10,
                      border:"1px solid rgba(220,80,80,.3)",background:"rgba(220,80,80,.08)",
                      color:"rgba(220,80,80,.8)",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      Yox, çıx
                    </button>
                    <button onClick={function(){setSchemaUnsaved(false);}}
                      style={{padding:"8px",borderRadius:10,border:"none",
                        background:"transparent",color:"rgba(255,255,255,.3)",
                        fontSize:11,cursor:"pointer"}}>
                      Ləğv et
                    </button>
                  </div>
                  <div style={{fontSize:9,color:"rgba(201,168,76,.3)",textAlign:"center",marginTop:10,lineHeight:1.5}}>
                    Siz həmişə qonaq masasını redaktə edə bilərsiniz
                  </div>
                </div>
              </div>
            )}

            {/* Alt — Dəvətnamələri göndər */}
            <div style={{padding:"8px 16px 16px",borderTop:"1px solid rgba(201,168,76,.08)",textAlign:"center"}}>
              <button onClick={function(){
                setSchemaChanged(false);
                setSchemaOpen(false);
                saveCurrentEvent({tables:tabRef.current});
                var totG=tables.reduce(function(s,t){return s+t.guests.reduce(function(ss,g){return ss+(g.count||1);},0);},0);
                var tblCount=tables.filter(function(t){return t.guests.length>0;}).length;
                setMsgs(function(m){return [...m,{role:"agent",
                  text:"Saxlanıldı! "+totG+" qonaq, "+tblCount+" masa dolu.\n\nDəvətnamələri necə göndərək? 📨",
                  qrs:["🪑 Masa-masa ayrıca","📨 Hamısına birdəfəlik"]}];});
              }} style={{padding:"10px",borderRadius:10,border:"none",width:"100%",
                background:"linear-gradient(90deg,rgba(201,168,76,.4),rgba(201,168,76,.2))",
                color:"#f2e8d0",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                📨 Dəvətnamələri göndər
              </button>
              <div style={{fontSize:9,color:"rgba(201,168,76,.35)",marginTop:5}}>
                Siz həmişə qonaq masasını redaktə edə bilərsiniz
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GUEST DRAWER */}
      {guestOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:100}} onClick={()=>setGuestOpen(false)}>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:340,background:"#0a0603",borderLeft:"1px solid rgba(201,168,76,.15)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(201,168,76,.12)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",color:"#c9a84c",fontSize:15}}>👥 Qonaqlar</div>
              <button className="dcl" onClick={()=>setGuestOpen(false)}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              {glog.length===0?(
                <div style={{textAlign:"center",color:"#5a4a30",fontSize:13,padding:30}}>Hələ qonaq yoxdur</div>
              ):glog.map((g,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,marginBottom:4,border:"1px solid rgba(201,168,76,.1)",background:"rgba(201,168,76,.04)"}}>
                  <div>
                    <div style={{fontSize:13,color:"#f2e8d0"}}>{g.name}</div>
                    <div style={{fontSize:10,color:"#9a8060",marginTop:2}}>
                      Stol {g.tbl||g.tableId} · {g.count||1}n
                      {g.side&&<span style={{marginLeft:5,padding:"1px 6px",borderRadius:6,fontSize:9,background:sideBg(g.side),color:sideColor(g.side)}}>{g.side}</span>}
                    </div>
                  </div>
                  {g.phone&&<div style={{fontSize:11,color:"#9a8060"}}>{g.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GÖNDƏRILƏN QONAQLAR DRAWER */}
      {invitedDrawerOpen&&(()=>{
        const invitedTables=tables.filter(t=>t.guests.some(g=>g.invited));
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:150}} onClick={()=>setInvitedDrawerOpen(false)}>
            <div style={{position:"absolute",left:0,right:0,bottom:0,maxHeight:"88vh",background:"#0a0603",
              borderTop:"2px solid rgba(80,200,120,.3)",borderRadius:"20px 20px 0 0",
              display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
                <div style={{width:36,height:4,borderRadius:2,background:"rgba(80,200,120,.3)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 16px 12px"}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#50c878",fontWeight:700}}>✓ Dəvət Göndərilən</div>
                  <div style={{fontSize:11,color:"rgba(80,200,120,.5)",marginTop:2}}>{tables.flatMap(t=>t.guests).filter(g=>g.invited).length} qonaq · {invitedTables.length} masa</div>
                </div>
                <button onClick={()=>setInvitedDrawerOpen(false)} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 14px 24px",WebkitOverflowScrolling:"touch"}}>
                {invitedTables.length===0?(
                  <div style={{textAlign:"center",color:"rgba(80,200,120,.3)",padding:30,fontSize:13}}>Hələ heç kimə göndərilməyib</div>
                ):invitedTables.map(t=>{
                  const sc=t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":"#50c878";
                  const invG=t.guests.filter(g=>g.invited);
                  return (
                    <div key={t.id} style={{marginBottom:12,background:"rgba(80,200,120,.05)",border:"1px solid rgba(80,200,120,.2)",borderRadius:14,overflow:"hidden"}}>
                      {/* Masa header */}
                      <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(80,200,120,.1)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#50c878"}}>№{t.id}</span>
                          {t.label&&t.label!=="__extra__"&&<span style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{t.label}</span>}
                          {t.side&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:sc+"22",color:sc}}>{t.side}</span>}
                        </div>
                        <span style={{fontSize:10,color:"rgba(80,200,120,.6)"}}>✓ {invG.length}/{t.guests.length}</span>
                      </div>
                      {/* Qonaqlar */}
                      <div style={{padding:"8px 14px"}}>
                        {invG.map(g=>(
                          <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                            <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:"rgba(80,200,120,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#50c878"}}>{g.name[0]}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,color:"#f2e8d0"}}>{g.name}</div>
                              {g.phone&&<div style={{fontSize:9,color:"rgba(255,255,255,.35)"}}>{g.phone}</div>}
                            </div>
                            <span style={{fontSize:9,color:"#50c878"}}>✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* GÖNDƏRILMƏYƏN QONAQLAR DRAWER */}
      {notInvitedDrawerOpen&&(
        <NotInvDrawerBody
          notInvTables={tables.filter(t=>t.guests.length>0&&t.guests.some(g=>!g.invited))}
          onClose={()=>setNotInvitedDrawerOpen(false)}
          onMarkSent={(ids)=>{setTables(ts=>ts.map(t=>({...t,guests:t.guests.map(g=>ids.includes(g.id)?{...g,invited:true}:g)})));}}
          devetData={devetData}
          obData={obData}
        />
      )}
    </div>
  );
}
// ─── SCHEMA TUTORIAL TOOLTIP ────────────────────────────────
function SchemaTutTooltip({ step, onNext, onSkip, onBack }){
  const steps=[
    {
      // Addım 1: Masanın üstündəki qələm — sağ yuxarıda masa 1
      targetStyle:{top:"38%", right:"22%"},
      arrowStyle:{top:"calc(38% + 28px)", right:"calc(22% + 6px)", transform:"rotate(45deg)"},
      side:"right",
      emoji:"✏️",
      title:"Masaya bas — ad və tərəf qeyd et",
      desc:"Hər masanın üstündəki kiçik ✏ düyməsinə bas. Popup açılar — masa adı yaz, Oğlan evi / Qız evi seç.",
      okText:"OK →"
    },
    {
      // Addım 2: Düzəlt düyməsi — yuxarı sağ
      targetStyle:{top:"13%", right:"4%"},
      arrowStyle:{top:"calc(13% + 28px)", right:"calc(4% + 30px)", transform:"rotate(30deg)"},
      side:"right",
      emoji:"🔄",
      title:"Masaları istədiyin yerə qoy",
      desc:"Yuxarıdakı Duzelt duymesine bas, sonra masalari barmaqla surusdur. Bitdikde Bitir bas.",
      okText:"OK →"
    },
    {
      // Addım 3: Masanı bas — ortada
      targetStyle:{top:"45%", left:"30%"},
      arrowStyle:{top:"calc(45% + 28px)", left:"calc(30% + 10px)", transform:"rotate(-20deg)"},
      side:"left",
      emoji:"➕",
      title:"Masaya bas — qonaq əlavə et",
      desc:"İstənilən masanın üstünə bas → aşağıdan panel açılır → qonaq adı, nömrəsi, sayını daxil et.",
      okText:"🚀 Başla!"
    }
  ];
  const s=steps[step-1];

  // Arrow SVG path from target to tooltip
  const isRight=s.side==="right";
  const boxLeft=isRight?"auto":"8%";
  const boxRight=isRight?"8%":"auto";

  return (
    <div style={{position:"absolute",inset:0,zIndex:50,pointerEvents:"none",
      borderRadius:"20px 20px 0 0",overflow:"hidden"}}>

      {/* Dim overlay */}
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.72)"}}/>

      {/* Spotlight circle around target */}
      <div style={{position:"absolute",...s.targetStyle,
        width:36,height:36,borderRadius:"50%",
        boxShadow:"0 0 0 2000px rgba(0,0,0,0)",
        border:"2.5px solid #f5d060",
        filter:"drop-shadow(0 0 10px rgba(245,208,96,.8))",
        pointerEvents:"none"}}/>

      {/* SVG arrow line */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none"}}>
        <defs>
          <marker id={"ta"+step} markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f5d060"/>
          </marker>
        </defs>
        {step===1&&(
          <path d="M 75% 42% Q 70% 55%, 62% 62%"
            fill="none" stroke="#f5d060" strokeWidth="2"
            strokeDasharray="6,4" opacity="0.8"
            markerEnd={"url(#ta"+step+")"}/>
        )}
        {step===2&&(
          <path d="M 90% 16% Q 85% 26%, 75% 30%"
            fill="none" stroke="#f5d060" strokeWidth="2"
            strokeDasharray="6,4" opacity="0.8"
            markerEnd={"url(#ta"+step+")"}/>
        )}
        {step===3&&(
          <path d="M 38% 48% Q 32% 58%, 35% 65%"
            fill="none" stroke="#f5d060" strokeWidth="2"
            strokeDasharray="6,4" opacity="0.8"
            markerEnd={"url(#ta"+step+")"}/>
        )}
      </svg>

      {/* Tooltip box */}
      <div style={{position:"absolute",
        bottom: step===3?"8%":"auto",
        top: step===3?"auto": step===2?"28%":"52%",
        left: boxLeft,
        right: boxRight,
        width:"75%", maxWidth:240,
        background:"linear-gradient(145deg,#1e1608,#140f05)",
        border:"1.5px solid rgba(245,208,96,.55)",
        borderRadius:12,padding:"10px 11px",
        boxShadow:"0 6px 28px rgba(0,0,0,.8)",
        pointerEvents:"all"}}>

        {/* Progress */}
        <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:7}}>
          {[1,2,3].map(function(i){
            return <div key={i} style={{
              width:i===step?16:5,height:5,borderRadius:3,
              background:i===step?"#f5d060":i<step?"rgba(245,208,96,.4)":"rgba(245,208,96,.12)",
              transition:"all .25s"}}/>;
          })}
        </div>

        {/* Content */}
        <div style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:5}}>
          <span style={{fontSize:16,flexShrink:0,lineHeight:1.2}}>{s.emoji}</span>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:700,
            color:"#f5d060",lineHeight:1.3}}>{s.title}</div>
        </div>
        <div style={{fontSize:10.5,color:"rgba(255,255,255,.6)",lineHeight:1.5,marginBottom:9}}>
          {s.desc}
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <button onClick={onSkip} style={{padding:"5px 6px",borderRadius:7,border:"none",
            background:"transparent",color:"rgba(255,255,255,.22)",fontSize:9,cursor:"pointer"}}>
            Keç
          </button>
          {step>1&&(
            <button onClick={onBack} style={{padding:"6px 8px",borderRadius:7,
              border:"1px solid rgba(245,208,96,.2)",background:"transparent",
              color:"rgba(245,208,96,.5)",fontSize:10,cursor:"pointer"}}>
              ←
            </button>
          )}
          <button onClick={onNext} style={{flex:1,padding:"7px",borderRadius:8,border:"none",
            background:"linear-gradient(90deg,rgba(245,208,96,.55),rgba(245,208,96,.3))",
            color:"#1c1408",fontSize:11,fontWeight:800,cursor:"pointer"}}>
            {s.okText}
          </button>
        </div>
      </div>
    </div>
  );
}


function NotInvDrawerBody({ notInvTables, allGuests, onClose, onSendOne, onMarkSent, devetData, obData }){
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // Nömrəsi olan göndərilməmiş qonaqlar — göndərmək üçün
  const withPhone = notInvTables.flatMap(function(t){
    return t.guests.filter(function(g){ return !g.invited && (g.phone||"").replace(/\D/g,"").length>=7; }).map(function(g){ return g.id; });
  });
  // Masa seçimi üçün — o masanın bütün göndərilməmiş qonaqları (nömrəsiz də)
  const allSel = withPhone.length>0 && withPhone.every(function(id){ return selected.has(id); });

  function toggle(id){
    setSelected(function(prev){
      var s=new Set(prev); if(s.has(id)) s.delete(id); else s.add(id); return s;
    });
  }
  function toggleAll(){ setSelected(allSel ? new Set() : new Set(withPhone)); }

  function buildMsg(g, tbl){
    var evName = (obData&&obData.boy&&obData.girl) ? (obData.boy+" & "+obData.girl)
      : ((obData&&obData.name)||(obData&&obData.company)||"Məclis");
    var evDate = (obData&&obData.date)||"";
    var tblLabel = tbl&&tbl.label&&tbl.label!=="__extra__" ? tbl.label : "";
    var tblSide = tbl&&tbl.side ? tbl.side : "";

    // Masadakı bütün qonaqların adları
    var allTblGuests = tbl ? tbl.guests : [];
    var guestLines = allTblGuests.map(function(gg){
      var prefix = "  • ";
      var extra = "";
      if(gg.ushaqCount>0) extra += " ("+gg.ushaqCount+" uşaq)";
      if(gg.gender==="kishi") extra += " 👨";
      else if(gg.gender==="qadin") extra += " 👩";
      return prefix+gg.name+(gg.count>1?" ("+gg.count+"n)":"")+extra;
    }).join("\n");

    // Masa vizual sxemi — ASCII dairə
    var masaVizual = "      ╔══════╗\n"
      + "      ║  "+String(tbl.id)+(tbl.id<10?" ":"")+"  ║\n"
      + "      ╚══════╝\n";

    // Hall məlumatı
    var hallInfo = "";
    if(devetData&&devetData.hallName) hallInfo += "\n🏛️ "+devetData.hallName;
    if(devetData&&devetData.hallAddr) hallInfo += "\n📍 "+devetData.hallAddr;
    if(devetData&&devetData.hallMaps) hallInfo += "\n🗺️ Xəritə: "+devetData.hallMaps;

    // Əsas dəvət mətni
    var customMetn = (devetData&&devetData.metn)
      ? devetData.metn.replace(/\[Ad\]/g,g.name).replace(/\[Masa\]/g,String(tbl.id)+(tblLabel?" — "+tblLabel:""))
      : "";

    var msg = "";
    msg += "🎊 *Dəvətnamə*\n";
    msg += "━━━━━━━━━━━━━━━━━━\n\n";
    msg += "Hörmətli *"+g.name+"*,\n\n";

    if(customMetn){
      msg += customMetn+"\n\n";
    } else {
      msg += "*"+evName+"* mərasiminə dəvət olunursunuz!\n";
      if(evDate) msg += "📅 Tarix: "+evDate+"\n";
      msg += "\n";
    }

    msg += "━━━━━━━━━━━━━━━━━━\n";
    msg += "🪑 *Masa məlumatı*\n\n";
    msg += masaVizual+"\n";
    msg += "🔢 Masa № *"+tbl.id+"*";
    if(tblLabel) msg += " — "+tblLabel;
    if(tblSide) msg += " ("+tblSide+")";
    msg += "\n\n";

    if(guestLines){
      msg += "👥 *Masadakı qonaqlar:*\n"+guestLines+"\n\n";
    }

    msg += "━━━━━━━━━━━━━━━━━━\n";
    if(hallInfo) msg += hallInfo+"\n";
    msg += "\n✨ *GONAG.AZ*";

    return msg;
  }

  function sendOne(g, tbl){
    var num=(g.phone||"").replace(/\D/g,"");
    if(!num){ alert(g.name+" — nömrə yoxdur!"); return; }
    window.open("https://wa.me/"+num+"?text="+encodeURIComponent(buildMsg(g,tbl)),"_blank");
    if(onMarkSent) onMarkSent([g.id]);
  }

  function sendSelected(){
    var toSend=[];
    notInvTables.forEach(function(t){
      t.guests.filter(function(g){ return !g.invited&&selected.has(g.id); }).forEach(function(g){ toSend.push({g:g,t:t}); });
    });
    if(toSend.length===0){ alert("Seçilmiş qonaq yoxdur!"); return; }
    setSending(true);
    toSend.forEach(function(item,i){
      setTimeout(function(){
        sendOne(item.g, item.t);
        setSentCount(function(c){ return c+1; });
        if(i===toSend.length-1) setTimeout(function(){ setSending(false); setSelected(new Set()); setSentCount(0); },600);
      }, i*700);
    });
  }

  const totalNotInv = notInvTables.flatMap(function(t){ return t.guests.filter(function(g){ return !g.invited; }); }).length;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:150}} onClick={onClose}>
      <div style={{position:"absolute",left:0,right:0,bottom:0,maxHeight:"92vh",background:"#080604",
        borderTop:"2px solid rgba(232,184,122,.4)",borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column"}} onClick={function(e){e.stopPropagation();}}>

        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(232,184,122,.3)"}}/>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 16px 8px"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#e8b87a",fontWeight:700}}>⏳ Göndərilməyən</div>
            <div style={{fontSize:11,color:"rgba(232,184,122,.5)",marginTop:1}}>{totalNotInv+" qonaq · "+notInvTables.length+" masa"}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{padding:"0 14px 8px"}}>
          {devetData&&devetData.metn ? (
            <div style={{background:"rgba(80,200,120,.08)",border:"1px solid rgba(80,200,120,.2)",borderRadius:9,padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span>✅</span>
              <span style={{fontSize:11,color:"#50c878",fontWeight:600}}>Dəvətnamə hazırdır</span>
              {devetData.media&&<span style={{fontSize:9,color:"rgba(80,200,120,.5)",marginLeft:4}}>{"📎 "+devetData.media.name}</span>}
            </div>
          ) : (
            <div style={{background:"rgba(232,184,122,.08)",border:"1px solid rgba(232,184,122,.2)",borderRadius:9,padding:"6px 12px",fontSize:10,color:"#e8b87a"}}>
              ⚠️ Dəvətnamə hazırlanmayıb — standart mətn göndəriləcək
            </div>
          )}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px 8px"}}>
          <button onClick={toggleAll}
            style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,
              border:"1px solid rgba(232,184,122,.3)",
              background:allSel?"rgba(232,184,122,.15)":"transparent",
              color:"#e8b87a",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            <span style={{width:16,height:16,borderRadius:4,border:"1.5px solid #e8b87a",
              background:allSel?"#e8b87a":"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,color:"#080604",fontWeight:800}}>
              {allSel?"✓":""}
            </span>
            {"Hamısını seç ("+withPhone.length+")"}
          </button>
          {selected.size>0&&<span style={{fontSize:11,color:"rgba(232,184,122,.7)"}}>{"Seçildi: "+selected.size}</span>}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"0 14px 100px",WebkitOverflowScrolling:"touch"}}>
          {notInvTables.map(function(t){
            var sc=t.side==="Oğlan evi"?"#7aade8":t.side==="Qız evi"?"#e87aad":"#e8b87a";
            var notG=t.guests.filter(function(g){ return !g.invited; });
            var sentG=t.guests.filter(function(g){ return g.invited; });
            var tblWithPhone=notG.filter(function(g){ return (g.phone||"").replace(/\D/g,"").length>=7; });
            var tblAllSel=tblWithPhone.length>0&&tblWithPhone.every(function(g){ return selected.has(g.id); });

            function toggleTable(){
              setSelected(function(prev){
                var s=new Set(prev);
                if(tblAllSel){ tblWithPhone.forEach(function(g){ s.delete(g.id); }); }
                else { tblWithPhone.forEach(function(g){ s.add(g.id); }); }
                return s;
              });
            }

            return (
              <div key={t.id} style={{marginBottom:14,borderRadius:16,overflow:"hidden",border:"1px solid "+sc+"33",background:"rgba(255,255,255,.02)"}}>
                <div onClick={toggleTable} style={{padding:"10px 14px",background:tblAllSel?sc+"22":sc+"11",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:34,height:34,borderRadius:10,
                      background:tblAllSel?sc:sc+"22",
                      border:"1.5px solid "+sc+"55",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:14,fontWeight:800,
                      color:tblAllSel?"#080604":sc}}>
                      {tblAllSel?"✓":t.id}
                    </div>
                    <div>
                      {t.label&&t.label!=="__extra__"&&<div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"}}>{t.label}</div>}
                      {t.side&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:sc+"22",color:sc}}>{t.side}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {sentG.length>0&&<div style={{fontSize:9,color:"rgba(80,200,120,.6)"}}>{"✓ "+sentG.length+" göndərildi"}</div>}
                    <div style={{fontSize:10,color:tblAllSel?sc:"rgba(232,184,122,.6)"}}>
                      {tblAllSel?"Seçildi":"⏳ "+notG.length+" qalır"}
                    </div>
                  </div>
                </div>
                <div style={{padding:"6px 12px"}}>
                  {notG.map(function(g){
                    var hasPhone=(g.phone||"").replace(/\D/g,"").length>=7;
                    var isSel=selected.has(g.id);
                    var gSc=g.gender==="kishi"?"#7aade8":g.gender==="qadin"?"#e87aad":"rgba(201,168,76,.7)";
                    return (
                      <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                        <div onClick={hasPhone?function(){toggle(g.id);}:undefined}
                          style={{width:20,height:20,borderRadius:6,flexShrink:0,
                            cursor:hasPhone?"pointer":"default",
                            border:"1.5px solid "+(isSel?"#e8b87a":hasPhone?"rgba(255,255,255,.2)":"rgba(255,255,255,.08)"),
                            background:isSel?"#e8b87a":"transparent",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:11,color:"#080604",fontWeight:800}}>
                          {isSel?"✓":""}
                        </div>
                        <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:gSc+"22",border:"1.5px solid "+gSc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:gSc}}>
                          {g.name[0]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:"#f2e8d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                          {!hasPhone&&<div style={{fontSize:9,color:"rgba(220,80,80,.5)"}}>⚠️ nömrə yoxdur</div>}
                        </div>
                        <button onClick={function(){sendOne(g,t);}} disabled={!hasPhone}
                          style={{padding:"6px 10px",borderRadius:8,border:"none",flexShrink:0,
                            background:hasPhone?"rgba(37,211,102,.2)":"rgba(255,255,255,.04)",
                            color:hasPhone?"#25d366":"rgba(255,255,255,.15)",
                            fontSize:11,fontWeight:700,cursor:hasPhone?"pointer":"default"}}>
                          📱
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selected.size>0&&(
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"12px 14px",background:"rgba(8,6,4,.97)",borderTop:"1px solid rgba(232,184,122,.2)"}}>
            {sending ? (
              <div style={{textAlign:"center",padding:"10px",color:"#e8b87a",fontSize:12,fontWeight:600}}>
                {"📱 Göndərilir... "+sentCount+"/"+selected.size}
              </div>
            ) : (
              <button onClick={sendSelected}
                style={{width:"100%",padding:"13px",borderRadius:12,border:"none",
                  background:"linear-gradient(90deg,rgba(37,211,102,.45),rgba(37,211,102,.25))",
                  color:"#25d366",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                {"📱 "+selected.size+" nəfərə WhatsApp göndər"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutPickerModal({ hall, onConfirm, onClose }){
  const isGulistan = hall && hall._venueName==="Gülüstan Sarayı" && (hall.name==="Böyük Zal"||hall.name==="Kiçik Zal");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end"}}
      onClick={onClose}>
      <div style={{width:"100%",background:"#0e0a04",borderTop:"1px solid rgba(201,168,76,.25)",
        borderRadius:"20px 20px 0 0",padding:"20px 16px 36px"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,168,76,.25)",margin:"0 auto 16px"}}/>
        <div style={{fontFamily:"'Playfair Display',serif",color:"#c9a84c",fontSize:17,textAlign:"center",marginBottom:6}}>
          🗺️ Sxem növünü seçin
        </div>
        <div style={{color:"rgba(201,168,76,.45)",fontSize:11,textAlign:"center",marginBottom:20}}>
          {hall&&hall._venueName} — {hall&&hall.name}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {isGulistan&&(
            <button onClick={()=>onConfirm("ready",null)}
              style={{padding:"14px 16px",borderRadius:12,border:"1px solid rgba(80,200,120,.4)",
                background:"rgba(80,200,120,.08)",cursor:"pointer",textAlign:"left",width:"100%"}}>
              <div style={{color:"#50c878",fontSize:14,fontWeight:700,marginBottom:3}}>🗺️ Hazır Plan</div>
              <div style={{color:"rgba(255,255,255,.45)",fontSize:11}}>Sistemdəki hazır zal sxemi — masalar real yerlərdə</div>
            </button>
          )}
          <button onClick={()=>onConfirm("custom",null)}
            style={{padding:"14px 16px",borderRadius:12,border:"1px solid rgba(150,150,150,.2)",
              background:"rgba(150,150,150,.05)",cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:14,fontWeight:700,marginBottom:3}}>⬜ Özüm Qurarım</div>
            <div style={{color:"rgba(255,255,255,.35)",fontSize:11}}>Boş sxem — masaları özünüz əlavə edib yerləşdirin</div>
          </button>
        </div>
      </div>
    </div>
  );
}
