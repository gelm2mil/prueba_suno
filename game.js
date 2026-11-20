import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// GELM CITY 3D — juego de absorción estilo arena urbana.
// Controles: WASD/flechas o botones táctiles. Los bots son IA local (no multijugador online).

const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc5d2);
scene.fog = new THREE.Fog(0x9bc5d2, 65, 155);
const camera = new THREE.PerspectiveCamera(43, innerWidth/innerHeight, .1, 260);
camera.position.set(0,34,30);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#scene').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f8ff,0x67715e,2.1));
const sun = new THREE.DirectionalLight(0xffffff,2.0);
sun.position.set(-28,48,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);

const mat=(c,r=.85)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const M={grass:mat(0x8ba77b),road:mat(0x55585c),side:mat(0xcac8b8),stripe:mat(0xf3e6c5),concrete:mat(0xaeb4ad),glass:mat(0x83c6d3,.3),tree:mat(0x438a4c),trunk:mat(0x74513a)};
function mesh(geo,material,x,y,z,cast=true){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
function slab(w,h,d,m,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,false)}
const WORLD=92, ROAD=12, GRID=30;
slab(200,.3,200,M.grass,0,-.28,0);
for(let i=-3;i<=3;i++){
 slab(200,.12,ROAD,M.road,0,-.05,i*GRID);slab(ROAD,.12,200,M.road,i*GRID,-.04,0);
 for(const s of [-1,1]){slab(200,.22,3,M.side,0,.03,i*GRID+s*7.7);slab(3,.22,200,M.side,i*GRID+s*7.7,.03,0)}
 for(let p=-90;p<=90;p+=8){slab(2.7,.025,.16,M.stripe,p,.04,i*GRID);slab(.16,.025,2.7,M.stripe,i*GRID,.04,p)}
}
// Crosswalks
for(const s of [-1,1])for(let i=-4;i<=4;i++){slab(.78,.03,4.5,M.stripe,s*7.3+i*.95,.07,0);slab(4.5,.03,.78,M.stripe,0,.07,s*7.3+i*.95)}
// Blocks: buildings and small street props
const buildingColors=[0xd58b72,0x8aadb4,0xe0c69a,0x969bb8,0xb7c2b0,0xc18eaa,0xd0a66f].map(c=>mat(c));
const objects=[]; // absorbable static props: {mesh, radius, points, alive}
function addObject(type,x,z,radius,points,color){
 let obj;
 if(type==='cone'){
  obj=mesh(new THREE.ConeGeometry(.48,.95,8),mat(color),x,.48,z);
 }else if(type==='bin'){
  obj=mesh(new THREE.CylinderGeometry(.48,.48,1.25,10),mat(color),x,.63,z);
  const lid=mesh(new THREE.CylinderGeometry(.5,.5,.12,10),mat(0x263b43),x,1.28,z);obj.userData.extra=[lid];
 }else if(type==='bench'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const seat=new THREE.Mesh(new THREE.BoxGeometry(2.0,.2,.65),mat(0x9b6740));seat.position.y=.65;obj.add(seat);
  const back=new THREE.Mesh(new THREE.BoxGeometry(2,.8,.16),mat(0x9b6740));back.position.set(0,1,.28);obj.add(back);
 }else if(type==='tree'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.5,7),M.trunk);t.position.y=.75;obj.add(t);
  const c=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,1),M.tree);c.position.y=2;obj.add(c);
 }else if(type==='car'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const b=new THREE.Mesh(new THREE.BoxGeometry(1.8,.7,3.5),mat(color,.4));b.position.y=.75;obj.add(b);
  const c=new THREE.Mesh(new THREE.BoxGeometry(1.4,.62,1.6),M.glass);c.position.set(0,1.35,-.1);obj.add(c);
 }else if(type==='lamp'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,3.8,7),mat(0x59646a));pole.position.y=1.9;obj.add(pole);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.65,.2,.35),mat(0xffe8a2));head.position.set(.22,3.7,0);obj.add(head);
 }else{
  obj=mesh(new THREE.BoxGeometry(1.3,1.3,1.3),mat(color),x,.65,z);
 }
 obj.userData.radius=radius;obj.userData.points=points;obj.userData.alive=true;obj.userData.kind=type;
 objects.push(obj);return obj;
}
// City blocks and buildings. Large buildings are deliberately not absorbable until late-game.
for(let gx=-2;gx<=2;gx++)for(let gz=-2;gz<=2;gz++){
 const cx=gx*GRID+15,cz=gz*GRID+15;
 if(Math.abs(gx)===0&&Math.abs(gz)===0)continue;
 const w=9+Math.random()*5,d=9+Math.random()*5,h=8+Math.random()*15;
 const b=slab(w,h,d,buildingColors[Math.floor(Math.random()*buildingColors.length)],cx,h/2,cz);
 b.userData.building=true;b.userData.radius=Math.max(w,d)*.72;b.userData.points=500;b.userData.alive=true;b.userData.kind='building';objects.push(b);
 // windows
 for(let k=-1;k<=1;k++){slab(.8,1.1,.08,M.glass,cx+k*2,h*.55,cz-d/2-.05);slab(.08,1.1,.8,M.glass,cx-w/2-.05,h*.55,cz+k*2)}
}
// Add props along sidewalks and plazas, away from building footprints.
const rnd=(a,b)=>a+Math.random()*(b-a);
for(let i=0;i<95;i++){
 const x=rnd(-85,85),z=rnd(-85,85);
 if(Math.abs(x%GRID)<8||Math.abs(z%GRID)<8)continue;
 const pick=Math.random();
 if(pick<.22)addObject('cone',x,z,.55,8,0xff8b25);
 else if(pick<.39)addObject('bin',x,z,.7,12,0x268d85);
 else if(pick<.55)addObject('bench',x,z,1.15,20,0x9b6740);
 else if(pick<.73)addObject('tree',x,z,1.3,24,0x438a4c);
 else if(pick<.92)addObject('lamp',x,z,1.0,18,0x65737a);
 else addObject('box',x,z,.9,15,0xd6b56b);
}
// Parked cars on streets; all are absorbable after growing.
for(let i=0;i<16;i++){
 const horizontal=Math.random()>.5;
 const road=Math.round(rnd(-2,2))*GRID;
 const along=rnd(-78,78);
 const x=horizontal?along:road+(Math.random()>.5?4:-4);
 const z=horizontal?road+(Math.random()>.5?4:-4):along;
 const car=addObject('car',x,z,1.85,55,[0x267fc2,0xe4b12b,0x36a66d,0xd84c54][i%4]);
 car.rotation.y=horizontal?Math.PI/2:0;
}

// Hole entities use a black disk, glowing rim and shadow well.
const holes=[];
function makeHole(name,color,x,z,isPlayer=false){
 const group=new THREE.Group();scene.add(group);group.position.set(x,.12,z);
 const disk=new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshBasicMaterial({color:0x020308}));
 disk.rotation.x=-Math.PI/2;disk.position.y=.02;group.add(disk);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.10,12,48),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.6,metalness:.3,roughness:.25}));
 rim.rotation.x=Math.PI/2;rim.position.y=.09;group.add(rim);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(.72,.035,8,48),new THREE.MeshBasicMaterial({color:0x26323b}));
 inner.rotation.x=Math.PI/2;inner.position.y=.095;group.add(inner);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.16,48),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.01;group.add(shadow);
 const hole={name,color,group,disk,rim,inner,shadow,radius:1.05,score:0,level:1,x,z,isPlayer,alive:true,speed:isPlayer?12:8,dir:new THREE.Vector2(1,0),think:0,target:null};
 holes.push(hole);setHoleScale(hole);return hole;
}
function setHoleScale(h){const s=h.radius;h.group.scale.setScalar(s);h.disk.scale.set(1,1,1);h.rim.rotation.z=0;h.inner.rotation.z=0}
const player=makeHole('TÚ',0x00eaff,0,0,true);
const botNames=['NOVA','SHADOW','BOLT','PIXEL','TITÁN','ECLIPSE'];
const botColors=[0xff4b78,0xffb52e,0x8b69ff,0x48e28b,0xff7045,0xe1e8ff];
for(let i=0;i<botNames.length;i++)makeHole(botNames[i],botColors[i],rnd(-72,72),rnd(-72,72),false);

// Floating name labels
function makeLabel(text,color){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillText(text,128,42);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(4.2,1.05,1);scene.add(s);return s}
holes.forEach(h=>h.label=makeLabel(h.name,h.isPlayer?'#00eaff':'#ff68a1'));

let score=0,level=1,xp=0,timeLeft=180,gameEnded=false,paused=false,toastTimeout=null;
const keys=new Set();
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key===' '?'Space':e.key)});
addEventListener('keyup',e=>keys.delete(e.key));
document.querySelectorAll('[data-key]').forEach(btn=>{
 const k=btn.dataset.key;const down=e=>{e.preventDefault();keys.add(k)};const up=e=>{e.preventDefault();keys.delete(k)};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);
});
function showToast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),1300)}
function rankList(){return [...holes.filter(h=>h.alive)].sort((a,b)=>b.score-a.score)}
function updateHud(){
 $('#score').textContent=score.toLocaleString('es-GT');$('#level').textContent=level;$('#size').textContent=player.radius.toFixed(1);
 const need=level*100;$('#xpLabel').textContent=`${xp} / ${need}`;$('#xpBar').style.width=`${Math.min(100,xp/need*100)}%`;
 const mins=Math.floor(timeLeft/60),secs=Math.floor(timeLeft%60);$('#timer').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
 const list=rankList();$('#ranking').innerHTML=list.slice(0,5).map((h,i)=>`<li class="${h.isPlayer?'me':''}">${h.name} — ${h.score}</li>`).join('');
}
function addGrowth(h,points){
 h.score+=points;h.radius=Math.min(18,h.radius+Math.max(.035,points/650));h.level=Math.max(1,Math.floor((h.radius-1)/.65)+1);setHoleScale(h);
 if(h.isPlayer){score=h.score;xp+=points;while(xp>=level*100){xp-=level*100;level++;player.radius=Math.min(18,player.radius+.22);setHoleScale(player);showToast(`¡SUBISTE AL NIVEL ${level}!`)}}
}
function removeObject(o){if(!o.userData.alive)return;o.userData.alive=false;scene.remove(o);if(o.userData.extra)o.userData.extra.forEach(e=>scene.remove(e))}
function canEat(h,o){const r=o.userData.radius||1;return h.radius>r*1.05}
function absorb(h,o,dt){
 const p=o.position;const dx=h.x-p.x,dz=h.z-p.z;const dist=Math.hypot(dx,dz);
 const objR=o.userData.radius||1;
 if(dist < h.radius*.82+objR*.35){
   if(o.userData.building){scene.remove(o);o.userData.alive=false}else removeObject(o);
   addGrowth(h,o.userData.points||10);
   if(h.isPlayer)showToast(`+${o.userData.points||10} • ¡ABSORBIDO!`);
   return true;
 }
 // Once eligible, objects slide toward the hole before disappearing.
 if(dist<h.radius*2.1+objR&&canEat(h,o)){
   const pull=Math.min(1,dt*(3.5+h.radius*.18));
   p.x+=dx*pull;p.z+=dz*pull;
   const s=Math.max(.04,1-pull*.9);o.scale.multiplyScalar(s);
 }
 return false;
}
function moveHole(h,dt){
 if(!h.alive)return;
 if(h.isPlayer){
  let x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  let z=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  const len=Math.hypot(x,z);if(len){x/=len;z/=len;h.dir.set(x,z)}
  const speed=h.speed/(1+h.radius*.045);h.x+=x*speed*dt;h.z+=z*speed*dt;
 }else{
  h.think-=dt;
  if(h.think<=0||!h.target||!h.target.userData?.alive){
   h.think=rnd(.5,1.5);
   let best=null,bestD=Infinity;
   for(const o of objects){if(!o.userData.alive||!canEat(h,o))continue;const d=Math.hypot(o.position.x-h.x,o.position.z-h.z);if(d<bestD&&d<35){best=o;bestD=d}}
   // Bots also avoid larger holes.
   const threats=holes.filter(q=>q!==h&&q.alive&&q.radius>h.radius*1.15);
   let threat=null,td=Infinity;for(const q of threats){const d=Math.hypot(q.x-h.x,q.z-h.z);if(d<td&&d<17){threat=q;td=d}}
   if(threat){h.target={x:h.x-(threat.x-h.x)*3,z:h.z-(threat.z-h.z)*3};}
   else h.target=best?best:{x:rnd(-80,80),z:rnd(-80,80)};
  }
  let tx=(h.target.x??h.target.position.x)-h.x,tz=(h.target.z??h.target.position.z)-h.z;const d=Math.hypot(tx,tz)||1;tx/=d;tz/=d;
  h.x+=tx*(h.speed/(1+h.radius*.05))*dt;h.z+=tz*(h.speed/(1+h.radius*.05))*dt;
  h.dir.set(tx,tz);
 }
 h.x=THREE.MathUtils.clamp(h.x,-94,94);h.z=THREE.MathUtils.clamp(h.z,-94,94);
 h.group.position.set(h.x,.12,h.z);h.group.rotation.y+=dt*.25;
 h.label.position.set(h.x,Math.max(2.2,h.radius*1.15),h.z);
}
function endGame(title,text){if(gameEnded)return;gameEnded=true;$('#overTitle').textContent=title;$('#overText').textContent=text;$('#finalScore').textContent=score;$('#finalLevel').textContent=level;const rank=rankList().findIndex(h=>h.isPlayer)+1;$('#finalRank').textContent=rank?`${rank}°`:'—';$('#gameover').classList.add('show')}
function resetGame(){
 for(const h of holes){scene.remove(h.group);scene.remove(h.label)}
 holes.length=0;
 for(const o of objects){if(o.userData.alive){if(o.userData.building){o.visible=true}else{o.visible=true;o.scale.set(1,1,1);o.userData.alive=true}}}
 // Restore absorbed props/buildings from a saved seed list if a fresh round starts.
 // A page reload fully regenerates the arena; restart button reloads for a clean reset.
 location.reload();
}
$('#restartBtn').onclick=resetGame;$('#restartSmall').onclick=resetGame;
$('#pauseBtn').onclick=()=>{if(gameEnded)return;paused=!paused;$('#pauseBtn').textContent=paused?'▶ SEGUIR':'Ⅱ PAUSA';$('#status').textContent=paused?'PAUSADO':'BOT CHALLENGE';showToast(paused?'JUEGO EN PAUSA':'¡A JUGAR!')};

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 if(!paused&&!gameEnded){
  timeLeft=Math.max(0,timeLeft-dt);
  holes.forEach(h=>moveHole(h,dt));
  // Object absorption by every active hole.
  for(const h of holes){if(!h.alive)continue;for(const o of objects){if(o.userData.alive&&canEat(h,o))absorb(h,o,dt)}}
  // Hole-vs-hole rule: only a clearly larger hole can swallow a smaller one.
  for(let i=0;i<holes.length;i++)for(let j=i+1;j<holes.length;j++){
   const a=holes[i],b=holes[j];if(!a.alive||!b.alive)continue;
   const d=Math.hypot(a.x-b.x,a.z-b.z);
   if(d<Math.max(a.radius,b.radius)*.72){
    if(a.radius>b.radius*1.18){a.score+=b.score+80;a.radius=Math.min(18,a.radius+b.radius*.22);setHoleScale(a);b.alive=false;b.group.visible=false;b.label.visible=false;if(a.isPlayer){score=a.score;showToast(`¡ABSORBISTE A ${b.name}! +${b.score+80}`)}}
    else if(b.radius>a.radius*1.18){b.score+=a.score+80;b.radius=Math.min(18,b.radius+a.radius*.22);setHoleScale(b);a.alive=false;a.group.visible=false;a.label.visible=false;if(a.isPlayer){endGame('¡TE ABSORBIERON!',`${b.name} te tragó. ¡Intenta crecer más rápido!`)}}
   }
  }
  if(timeLeft<=0)endGame('¡TIEMPO TERMINADO!','La ronda terminó. Revisa tu posición en la clasificación.');
  updateHud();
 }
 // Smooth overhead chase camera; keep all play area visible around player.
 const desired=new THREE.Vector3(player.x,31+player.radius*.8,player.z+25+player.radius*.35);
 camera.position.lerp(desired,.075);camera.lookAt(player.x,0,player.z);
 renderer.render(scene,camera);
}
updateHud();animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
