import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Zal ölçüsü — faiz koordinatlarını metrə çeviririk (real ölçü ehtiyac olarsa dəyişilə bilər)
const HALL_W = 14; // metr, en
const HALL_D = 10; // metr, dərinlik

const MODEL_FILES = {
  table: "/models/round_banquet_table.glb",
  vipTable: "/models/vip_round_table.glb",
  chair: "/models/banquet_chair.glb",
  plant: "/models/decorative_plant.glb",
  flower: "/models/flower_centerpiece.glb",
  door: "/models/double_entrance_door.glb",
  danceFloor: "/models/dance_floor.glb",
  musicStage: "/models/musicians_stage.glb",
  brideGroom: "/models/bride_groom_stage.glb",
  wall: "/models/modular_wall.glb",
  floorTile: "/models/hall_floor_tile.glb",
};

function pctToMeters(xPct, yPct){
  const x = (xPct/100 - 0.5) * HALL_W;
  const z = (yPct/100 - 0.5) * HALL_D;
  return [x, z];
}

export default function Hall3D({ hall, tables, onClose }){
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(()=>{
    const mount = mountRef.current;
    if(!mount) return;
    let disposed = false;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF2ECDD);

    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a5e, 1.15);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff4e0, 1.5);
    dir.position.set(12, 22, 10);
    scene.add(dir);

    const loader = new GLTFLoader();
    const cache = {};
    const keys = Object.keys(MODEL_FILES);

    function loadModel(key){
      return new Promise((resolve)=>{
        loader.load(
          MODEL_FILES[key],
          (gltf)=>{
            cache[key] = gltf.scene;
            if(!disposed) setLoadedCount(c=>c+1);
            resolve();
          },
          undefined,
          ()=>{ resolve(); } // xəta olsa belə davam et, sadəcə həmin model görünməyəcək
        );
      });
    }

    let camAngle = 0.6, camElevation = 1.15, camDist = 15;
    function updateCamera(){
      camera.position.set(
        Math.sin(camAngle)*camDist,
        7*camElevation + 3,
        Math.cos(camAngle)*camDist
      );
      camera.lookAt(0, 0, 0);
    }

    (async ()=>{
      try{
        await Promise.all(keys.map(loadModel));
      }catch(e){ if(!disposed) setLoadError(true); }
      if(disposed) return;

      // Döşəmə
      if(cache.floorTile){
        const cols = Math.ceil(HALL_W/5), rows = Math.ceil(HALL_D/5);
        for(let cx=0; cx<cols; cx++){
          for(let cz=0; cz<rows; cz++){
            const tile = cache.floorTile.clone();
            tile.position.set((cx-cols/2+0.5)*5, 0, (cz-rows/2+0.5)*5);
            scene.add(tile);
          }
        }
      }

      // Divarlar (Zal Builder-də çəkilmiş wall_edges əsasında)
      if(hall && hall._wallEdges && hall._wallPath && cache.wall){
        hall._wallEdges.forEach(ed=>{
          const a = hall._wallPath.find(p=>p.id===ed.from);
          const b = hall._wallPath.find(p=>p.id===ed.to);
          if(!a||!b) return;
          const [ax,az] = pctToMeters(a.x, a.y);
          const [bx,bz] = pctToMeters(b.x, b.y);
          const dx=bx-ax, dz=bz-az;
          const len = Math.sqrt(dx*dx+dz*dz) || 0.1;
          const angle = Math.atan2(dz,dx);
          const wall = cache.wall.clone();
          const scaleX = len/3.05; // modular_wall.glb ~3.05m uzunluğunda
          wall.scale.set(scaleX, 1, 1);
          wall.position.set((ax+bx)/2, 0, (az+bz)/2);
          wall.rotation.y = -angle;
          scene.add(wall);
        });
      }

      // Zonalar (Bəy&Gəlin, Rəqs meydanı, Musiqiçilər, Giriş)
      if(hall && hall._hallElements){
        hall._hallElements.forEach(el=>{
          const [x,z] = pctToMeters(el.xPct, el.yPct);
          const key = el.type==="danceFloor"?"danceFloor"
            : el.type==="brideGroom"?"brideGroom"
            : el.type==="stage"?"musicStage"
            : el.type==="entrance"?"door"
            : null;
          if(key && cache[key]){
            const m = cache[key].clone();
            m.position.set(x,0,z);
            scene.add(m);
          }
        });
      }

      // Masalar + stullar (real qonaq datası ilə eyni koordinatlar)
      (tables||[]).forEach(t=>{
        if(!t.pos) return;
        const [x,z] = pctToMeters(t.pos.xPct, t.pos.yPct);
        const isVip = (t.side==="VIP") || (t.label||"").toLowerCase().includes("vip");
        const tableModel = cache[isVip?"vipTable":"table"];
        if(tableModel){
          const tm = tableModel.clone();
          tm.position.set(x,0,z);
          scene.add(tm);
        }
        if(cache.chair){
          const seats = t.seats||8;
          const chairR = 1.05 + (seats>10?0.15:0);
          for(let i=0;i<seats;i++){
            const angle = (i/seats)*Math.PI*2;
            const cx = x + chairR*Math.cos(angle);
            const cz = z + chairR*Math.sin(angle);
            const ch = cache.chair.clone();
            ch.position.set(cx,0,cz);
            ch.rotation.y = -angle + Math.PI;
            scene.add(ch);
          }
        }
      });

      setLoading(false);
      updateCamera();
    })();

    updateCamera();

    let isDown=false, lastX=0, lastY=0;
    function onDown(e){ isDown=true; const t=e.touches?e.touches[0]:e; lastX=t.clientX; lastY=t.clientY; }
    function onMove(e){
      if(!isDown) return;
      const t=e.touches?e.touches[0]:e;
      const dx=t.clientX-lastX, dy=t.clientY-lastY;
      camAngle -= dx*0.008;
      camElevation = Math.max(0.35, Math.min(2.4, camElevation - dy*0.004));
      lastX=t.clientX; lastY=t.clientY;
      updateCamera();
    }
    function onUp(){ isDown=false; }
    function onWheel(e){
      e.preventDefault();
      camDist = Math.max(6, Math.min(30, camDist + e.deltaY*0.02));
      updateCamera();
    }
    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, {passive:true});
    el.addEventListener("touchmove", onMove, {passive:true});
    el.addEventListener("touchend", onUp);
    el.addEventListener("wheel", onWheel, {passive:false});

    let rafId;
    function animate(){
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    function handleResize(){
      const w = mount.clientWidth, h = mount.clientHeight;
      if(!w||!h) return;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w,h);
    }
    window.addEventListener("resize", handleResize);

    return ()=>{
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  },[hall, tables]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"#F7F1E4",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
        background:"#FFFFFF",borderBottom:"1px solid #E7E1D6",flexShrink:0}}>
        <span style={{fontWeight:700,fontSize:14,color:"#211A16",fontFamily:"'Fraunces',serif"}}>🎬 Real Görünüş</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#6B6259",cursor:"pointer"}}>✕</button>
      </div>
      <div ref={mountRef} style={{flex:1,position:"relative",touchAction:"none",overflow:"hidden"}}>
        {loading && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            background:"rgba(247,241,228,.95)",gap:8,zIndex:5}}>
            <div style={{width:32,height:32,border:"3px solid rgba(193,56,42,.2)",borderTopColor:"#C1382A",borderRadius:"50%",animation:"h3d-spin 0.8s linear infinite"}}/>
            <div style={{fontSize:12,color:"#6B6259"}}>Modellər yüklənir... {loadedCount}/{Object.keys(MODEL_FILES).length}</div>
            <style>{"@keyframes h3d-spin{to{transform:rotate(360deg)}}"}</style>
          </div>
        )}
        {loadError && !loading && (
          <div style={{position:"absolute",top:10,left:10,right:10,padding:10,borderRadius:10,background:"rgba(193,56,42,.1)",border:"1px solid rgba(193,56,42,.3)",fontSize:11,color:"#C1382A",zIndex:5}}>
            ⚠️ Bəzi modellər yüklənmədi — internet bağlantısını yoxlayın
          </div>
        )}
      </div>
      <div style={{padding:"8px 16px",fontSize:10,color:"#6B6259",textAlign:"center",background:"#FFFFFF",borderTop:"1px solid #E7E1D6",flexShrink:0}}>
        Sürüşdürüb baxın, çimdikləyib/skrollayıb yaxınlaşdırın
      </div>
    </div>
  );
}
