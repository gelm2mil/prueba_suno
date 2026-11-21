import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// GELM CITY 3D — juego de absorción estilo arena urbana.
// Controles: WASD/flechas o botones táctiles. Los bots son IA local (no multijugador online).

const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc5d2);
scene.fog = new THREE.Fog(0x9bc5d2, 135, 390);
const camera = new THREE.PerspectiveCamera(43, innerWidth/innerHeight, .1, 850);
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
const WORLD=200, ROAD=12, GRID=30;
slab(420,.3,420,M.grass,0,-.28,0);
for(let i=-6;i<=6;i++){
 slab(420,.12,ROAD,M.road,0,-.05,i*GRID);slab(ROAD,.12,420,M.road,i*GRID,-.04,0);
 for(const s of [-1,1]){slab(420,.22,3,M.side,0,.03,i*GRID+s*7.7);slab(3,.22,420,M.side,i*GRID+s*7.7,.03,0)}
 for(let p=-200;p<=200;p+=12){slab(2.7,.025,.16,M.stripe,p,.04,i*GRID);slab(.16,.025,2.7,M.stripe,i*GRID,.04,p)}
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
 }else if(type==='bag'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const sack=new THREE.Mesh(new THREE.SphereGeometry(.52,10,8),mat(0x20272c));sack.scale.set(.9,1.05,.85);sack.position.y=.48;obj.add(sack);
  const knot=new THREE.Mesh(new THREE.ConeGeometry(.13,.28,6),mat(0x11171b));knot.position.set(0,1.0,0);obj.add(knot);
 }else if(type==='bottle'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.75,8),mat(0x42b8a5,.35));bottle.position.y=.38;obj.add(bottle);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.2,8),mat(0x42b8a5,.35));neck.position.y=.86;obj.add(neck);
 }else if(type==='can'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const can=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.55,10),mat(color,.35));can.position.y=.28;obj.add(can);
 }else if(type==='paper'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,.08,z);
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.85,.65),new THREE.MeshStandardMaterial({color:0xf4f0df,side:THREE.DoubleSide}));sheet.rotation.x=-Math.PI/2;obj.add(sheet);
 }else if(type==='marble'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,.19,z);
  const marble=new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),new THREE.MeshStandardMaterial({color,metalness:.18,roughness:.22}));obj.add(marble);
  const glint=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),mat(0xffffff,.15));glint.position.set(-.07,.09,.12);obj.add(glint);
 }else if(type==='yoyo'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const disc1=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.13,14),mat(color,.35));disc1.rotation.x=Math.PI/2;disc1.position.y=.38;obj.add(disc1);
  const disc2=disc1.clone();disc2.position.y=.58;obj.add(disc2);
  const axle=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.25,10),mat(0xb9c4c8,.3));axle.rotation.x=Math.PI/2;axle.position.y=.48;obj.add(axle);
 }else if(type==='top'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.ConeGeometry(.42,.85,10),mat(color,.42));body.position.y=.48;obj.add(body);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat(0xc7a46b));cap.position.y=.93;obj.add(cap);
 }else if(type==='claypot'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const pm=new THREE.MeshStandardMaterial({color,roughness:.96});
  const belly=new THREE.Mesh(new THREE.SphereGeometry(.43,12,9),pm);belly.scale.set(1,.88,1);belly.position.y=.4;obj.add(belly);
  const mouth=new THREE.Mesh(new THREE.CylinderGeometry(.25,.29,.16,12),pm);mouth.position.y=.78;obj.add(mouth);
  const opening=new THREE.Mesh(new THREE.CircleGeometry(.21,12),mat(0x493027));opening.rotation.x=-Math.PI/2;opening.position.y=.865;obj.add(opening);
 }else if(type==='claybowl'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const bm=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.48,.27,.34,12,1,true),bm);bowl.position.y=.19;obj.add(bowl);
  const inside=new THREE.Mesh(new THREE.CircleGeometry(.37,12),mat(0x6d4634));inside.rotation.x=-Math.PI/2;inside.position.y=.36;obj.add(inside);
 }else if(type==='clayjug'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const jm=new THREE.MeshStandardMaterial({color,roughness:1});
  const belly=new THREE.Mesh(new THREE.SphereGeometry(.38,12,9),jm);belly.scale.set(1,1.05,1);belly.position.y=.43;obj.add(belly);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.13,.19,.35,10),jm);neck.position.y=.82;obj.add(neck);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.14,.045,6,12),jm);rim.position.y=1.02;obj.add(rim);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.22,.055,6,12,Math.PI*1.55),jm);handle.position.set(.34,.55,0);handle.rotation.z=Math.PI/2;obj.add(handle);
 }else if(type==='claycomal'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const cm=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.55,.5,.12,16),cm);disc.position.y=.12;obj.add(disc);
 }else if(type==='marketstall'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const legsMat=mat(0x76543b),canopy=mat(color);
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const leg=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.1,6),legsMat);leg.position.set(sx*.95,1.05,sz*.62);obj.add(leg);
  }
  const roof=new THREE.Mesh(new THREE.BoxGeometry(2.25,.16,1.65),canopy);roof.position.y=2.15;obj.add(roof);
  const counter=new THREE.Mesh(new THREE.BoxGeometry(2.0,.55,1.2),mat(0x9a6a43));counter.position.y=.65;obj.add(counter);
  for(let k=0;k<4;k++){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.18,7,6),mat([0xe84a3c,0xf0b62f,0x4caa54,0xd86c35][k]));fruit.position.set(-.6+k*.4,1.05,.05);obj.add(fruit)}
 }else if(type==='produce'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const geo= new THREE.SphereGeometry(.28,8,7);
  const fruit=new THREE.Mesh(geo,mat(color));fruit.position.y=.28;fruit.scale.set(1,.82,1);obj.add(fruit);
  const leaf=new THREE.Mesh(new THREE.ConeGeometry(.08,.18,5),mat(0x39884b));leaf.position.y=.54;obj.add(leaf);
 }else if(type==='textile'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,.08,z);
  const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.9),new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:1}));cloth.rotation.x=-Math.PI/2;cloth.rotation.z=.15;obj.add(cloth);
  for(let k=0;k<4;k++){const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.12,.018,.055),mat([0xf2d15b,0x3b8c77,0xb7414a,0xe8e0c8][k]));stripe.position.set(0,.025,.3-k*.2);obj.add(stripe)}
 }else if(type==='bus'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.5,1.8,7.0),mat(color,.42));body.position.y=1.15;obj.add(body);
  const windows=new THREE.Mesh(new THREE.BoxGeometry(2.53,.72,5.7),M.glass);windows.position.y=1.72;obj.add(windows);
  const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.6,.22,.18),mat(0xd8d6cb));bumper.position.set(0,.42,3.55);obj.add(bumper);
  for(const sx of [-1,1])for(const sz of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.22,10),mat(0x202328));wheel.rotation.z=Math.PI/2;wheel.position.set(sx*1.28,.42,sz*2.25);obj.add(wheel)}
 }else if(type==='tuktuk'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.0,2.25),mat(color));body.position.y=.72;obj.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.55,.14,1.55),mat(0x252b30));roof.position.set(0,1.55,-.15);obj.add(roof);
  const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.25,.55,.06),M.glass);windshield.position.set(0,1.2,.98);obj.add(windshield);
  for(const sx of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.18,9),mat(0x202328));wheel.rotation.z=Math.PI/2;wheel.position.set(sx*.78,.3,.65);obj.add(wheel)}
  const rear=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.18,9),mat(0x202328));rear.rotation.z=Math.PI/2;rear.position.set(0,.3,-.9);obj.add(rear);
 }else if(type==='corn'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const cob=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.9,8),mat(0xf1c94a));cob.position.y=.48;obj.add(cob);
  for(let k=-1;k<=1;k++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.12,.72,5),mat(0x4c9146));leaf.position.set(k*.13,.4,0);leaf.rotation.z=k*.55;obj.add(leaf)}
 }else if(type==='pond'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const water=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.2,.12,24),new THREE.MeshStandardMaterial({color:0x4aa9c1,roughness:.22,metalness:.1}));water.position.y=.08;obj.add(water);
  const bank=new THREE.Mesh(new THREE.TorusGeometry(4.25,.28,7,24),mat(0x8a9d67));bank.rotation.x=Math.PI/2;bank.position.y=.1;obj.add(bank);
 }else if(type==='mayanruin'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const stone=mat(0x8b8170);
  for(let tier=0;tier<4;tier++){const w=3.8-tier*.72;const step=new THREE.Mesh(new THREE.BoxGeometry(w,.65,w),stone);step.position.y=.33+tier*.58;obj.add(step)}
  const shrine=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.1,1.35),mat(0x746b60));shrine.position.y=2.85;obj.add(shrine);
 }else if(type==='mural'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.2,.22),mat(0xead8b7));wall.position.y=1.1;obj.add(wall);
  const colors=[0xd14c45,0xe0b83f,0x317f9e,0x398b59,0x8b5ba6];
  for(let i=0;i<5;i++){const panel=new THREE.Mesh(new THREE.BoxGeometry(.52,1.45,.06),mat(colors[i]));panel.position.set(-1.3+i*.65,1.1,.15);obj.add(panel)}
 }else if(type==='coffeeplant'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,1.1,6),mat(0x68452d));stem.position.y=.55;obj.add(stem);
  for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.28,7,6),mat(i%2?0x347c42:0x4a994c));leaf.scale.set(1,.35,.65);leaf.position.set(Math.cos(i)*.38,.45+(i%3)*.2,Math.sin(i)*.38);obj.add(leaf)}
  for(let i=0;i<3;i++){const berry=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),mat(0xb93d32));berry.position.set(.12+i*.1,.45+i*.12,.25);obj.add(berry)}
 }else if(type==='pedestrian'){
  obj=new THREE.Group();scene.add(obj);obj.position.set(x,0,z);
  const skin=mat([0xd99a70,0x8e5b3d,0xf0c39b,0xb87955][Math.floor(Math.random()*4)]);
  const shirt=mat(color),pants=mat([0x253b62,0x33363e,0x5d4638,0x31584a][Math.floor(Math.random()*4)]);
  const torso=new THREE.Mesh(new THREE.BoxGeometry(.48,.68,.28),shirt);torso.position.y=1.05;obj.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),skin);head.position.y=1.55;obj.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.205,8,6),mat(0x30231e));hair.scale.set(1,.48,1);hair.position.set(0,1.68,-.015);obj.add(hair);
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const arm=new THREE.Mesh(new THREE.BoxGeometry(.14,.52,.16),skin);arm.position.set(side*.34,1.08,0);obj.add(arm);arms.push(arm);
   const leg=new THREE.Mesh(new THREE.BoxGeometry(.17,.52,.19),pants);leg.position.set(side*.13,.43,0);obj.add(leg);legs.push(leg);
  }
  obj.userData.animParts={arms,legs,torso,head};
  obj.userData.motion=Math.random()<.24?'dance':(Math.random()<.5?'run':'walk');
  obj.userData.phase=Math.random()*Math.PI*2;
  obj.userData.walkSpeed=obj.userData.motion==='run'?5.2:(obj.userData.motion==='dance'?0:2.1);
 }else{
  obj=mesh(new THREE.BoxGeometry(1.3,1.3,1.3),mat(color),x,.65,z);
 }
 obj.userData.radius=radius;obj.userData.points=points;obj.userData.alive=true;obj.userData.kind=type;
 objects.push(obj);return obj;
}
// DEPARTAMENTO DE CHIMALTENANGO — mapa de juego inspirado en sus 16 municipios.
// La cuadrícula es una interpretación jugable, no un plano cartográfico a escala.
const rnd=(a,b)=>a+Math.random()*(b-a);
const municipalZones=[
 {name:'CHIMALTENANGO',x:-135,z:-135,theme:'market',landmark:'losaposentos'},
 {name:'EL TEJAR',x:-45,z:-135,theme:'clay'},
 {name:'SAN MARTÍN JILOTEPEQUE',x:45,z:-135,theme:'corn'},
 {name:'SAN JOSÉ POAQUIL',x:135,z:-135,theme:'market'},
 {name:'TECPÁN GUATEMALA',x:-135,z:-45,theme:'heritage',landmark:'iximche'},
 {name:'SANTA APOLONIA',x:-45,z:-45,theme:'market'},
 {name:'SAN JUAN COMALAPA',x:45,z:-45,theme:'art',landmark:'mural'},
 {name:'SANTA CRUZ BALANYÁ',x:135,z:-45,theme:'fields'},
 {name:'PATZÚN',x:-135,z:45,theme:'textile'},
 {name:'PATZICÍA',x:-45,z:45,theme:'fields'},
 {name:'ZARAGOZA',x:45,z:45,theme:'fields'},
 {name:'PARRAMOS',x:135,z:45,theme:'market'},
 {name:'SAN ANDRÉS ITZAPA',x:-135,z:135,theme:'market'},
 {name:'ACATENANGO',x:-45,z:135,theme:'volcano',landmark:'volcano'},
 {name:'SAN PEDRO YEPOCAPA',x:45,z:135,theme:'coffee',landmark:'coffee'},
 {name:'SAN MIGUEL POCHUTA',x:135,z:135,theme:'coffee',landmark:'coffee'}
];
const zonePalette=[0xd58b72,0x8aadb4,0xe0c69a,0x969bb8,0xb7c2b0,0xc18eaa,0xd0a66f];
for(let gx=-6;gx<=5;gx++)for(let gz=-6;gz<=5;gz++){
 const cx=gx*GRID+15,cz=gz*GRID+15;
 if(gx===0&&gz===0)continue;
 const small=Math.random()<.56,mid=!small&&Math.random()<.78;
 const w=small?4.5+rnd(0,1.4):(mid?6.5+rnd(0,1.4):9+rnd(0,2));
 const d=small?4.5+rnd(0,1.4):(mid?6.5+rnd(0,1.4):9+rnd(0,2));
 const h=small?3.5+rnd(0,2):(mid?5.5+rnd(0,3):8+rnd(0,5));
 const color=zonePalette[Math.floor(Math.random()*zonePalette.length)];
 const b=slab(w,h,d,mat(color),cx,h/2,cz);
 b.userData.building=true;b.userData.radius=small?2.9:(mid?4.5:6.4);
 b.userData.points=small?90:(mid?180:300);b.userData.alive=true;b.userData.kind='building';objects.push(b);
 // Simple windows and a small roofline detail.
 for(let k=-1;k<=1;k++){slab(.65,.85,.06,M.glass,cx+k*1.55,h*.58,cz-d/2-.04);slab(.06,.85,.65,M.glass,cx-w/2-.04,h*.58,cz+k*1.55)}
}
function addZoneMarker(name,x,z){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
 const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(10,28,40,.86)';ctx.fillRect(0,0,512,96);
 ctx.strokeStyle='#00eaff';ctx.lineWidth=5;ctx.strokeRect(3,3,506,90);
 ctx.fillStyle='#ffffff';ctx.font='bold 30px Arial';ctx.textAlign='center';ctx.fillText(name,256,60);
 const tex=new THREE.CanvasTexture(canvas);const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
 spr.position.set(x,8,z);spr.scale.set(16,3,1);scene.add(spr);
}
function addZoneDecor(zone){
 const {x,z,theme}=zone;
 // Each municipal area gets recognizable local-market and landscape props.
 if(theme==='market'||theme==='art'||theme==='textile'){
  for(let i=0;i<5;i++)addObject('marketstall',x+rnd(-12,12),z+rnd(-12,12),1.65,38,[0xc94c43,0x247b9c,0xd9a62d,0x4b8a57,0x8a5aa5][i%5]);
 }
 if(theme==='clay'||theme==='heritage'){
  for(let i=0;i<9;i++)addObject(i%2?'claypot':'clayjug',x+rnd(-13,13),z+rnd(-13,13),.62,15,[0x9b5738,0xb66b43,0x8c4933,0xc18455][i%4]);
 }
 if(theme==='corn'||theme==='fields'){
  for(let i=0;i<22;i++)addObject(i%3?'produce':'corn',x+rnd(-14,14),z+rnd(-14,14),.38,7,[0xf0b52f,0x45a45b,0xc84b3d,0x8dba42][i%4]);
 }
 if(theme==='textile'||theme==='art'){
  for(let i=0;i<12;i++)addObject('textile',x+rnd(-14,14),z+rnd(-14,14),.62,12,[0xc94b45,0x277d9d,0xe0b238,0x4c8a58][i%4]);
 }
 if(theme==='volcano'||theme==='coffee'){
  for(let i=0;i<12;i++)addObject('produce',x+rnd(-14,14),z+rnd(-14,14),.38,7,[0x8d3d32,0x5b3928,0x6b8d42][i%3]);
 }
 if(theme==='coffee'){
  for(let i=0;i<14;i++)addObject('coffeeplant',x+rnd(-13,13),z+rnd(-13,13),.65,16,0x438b48);
 }
 if(zone.landmark==='losaposentos')addObject('pond',x+17,z+8,4.5,120,0x4aa9c1);
 if(zone.landmark==='iximche'){
  for(let i=0;i<4;i++)addObject('mayanruin',x-9+i*6,z+7,2.8,95,0x8b8170);
 }
 if(zone.landmark==='mural'){
  for(let i=0;i<3;i++)addObject('mural',x-8+i*8,z+10,2.2,65,0xead8b7);
 }
 if(zone.landmark==='volcano'){
  const volcano=mesh(new THREE.ConeGeometry(13,19,9),mat(0x665b56),x,9,z+19,false);
  volcano.userData.radius=13;volcano.userData.points=450;volcano.userData.alive=true;volcano.userData.building=true;volcano.userData.kind='volcano';objects.push(volcano);
  const snow=mesh(new THREE.ConeGeometry(3.2,4.2,9),mat(0xdedbd2),x,18.5,z+19,false);
 }
 if(theme==='market'){
  for(let i=0;i<12;i++)addObject('produce',x+rnd(-14,14),z+rnd(-14,14),.38,7,[0xe84a3c,0xf0b62f,0x4caa54,0xd86c35][i%4]);
 }
 addZoneMarker(zone.name,x,z);
}
for(const zone of municipalZones)addZoneDecor(zone);

// General urban furniture, litter, toys, pottery and people spread over the full map.
for(let i=0;i<210;i++){
 const x=rnd(-188,188),z=rnd(-188,188);
 if(Math.abs(x%GRID)<8||Math.abs(z%GRID)<8)continue;
 const pick=Math.random();
 if(pick<.20)addObject('cone',x,z,.55,8,0xff8b25);
 else if(pick<.37)addObject('bin',x,z,.7,12,0x268d85);
 else if(pick<.53)addObject('bench',x,z,1.15,20,0x9b6740);
 else if(pick<.72)addObject('tree',x,z,1.3,24,0x438a4c);
 else if(pick<.88)addObject('lamp',x,z,1.0,18,0x65737a);
 else addObject('box',x,z,.9,15,0xd6b56b);
}
// Buses and tuk-tuks inspired by the department's everyday transport.
for(let i=0;i<34;i++){
 const horizontal=Math.random()>.5,road=Math.round(rnd(-5,5))*GRID,along=rnd(-185,185);
 const x=horizontal?along:road+(Math.random()>.5?4:-4);
 const z=horizontal?road+(Math.random()>.5?4:-4):along;
 const vehicle=i%4===0?'bus':'tuktuk';
 const obj=addObject(vehicle,x,z,vehicle==='bus'?3.8:1.25,vehicle==='bus'?85:32,
   [0xe0b72e,0x287fbd,0x3b9a59,0xd34b43][i%4]);
 obj.rotation.y=horizontal?Math.PI/2:0;
}
// Cars parked along the extended streets.
for(let i=0;i<48;i++){
 const horizontal=Math.random()>.5,road=Math.round(rnd(-5,5))*GRID,along=rnd(-185,185);
 const x=horizontal?along:road+(Math.random()>.5?4:-4);
 const z=horizontal?road+(Math.random()>.5?4:-4):along;
 const car=addObject('car',x,z,1.85,55,[0x267fc2,0xe4b12b,0x36a66d,0xd84c54][i%4]);
 car.rotation.y=horizontal?Math.PI/2:0;
}
// Everyday small items and litter.
for(let i=0;i<220;i++){
 const x=rnd(-188,188),z=rnd(-188,188);
 if(Math.abs(x%GRID)<7||Math.abs(z%GRID)<7)continue;
 const r=Math.random();
 if(r<.28)addObject('bag',x,z,.62,10,0x20272c);
 else if(r<.49)addObject('bottle',x,z,.34,6,0x42b8a5);
 else if(r<.68)addObject('can',x,z,.3,5,[0xd94c45,0x3f8bc9,0xc6a83e][i%3]);
 else addObject('paper',x,z,.25,3,0xf4f0df);
}
// Pedestrians are distributed across streets, markets and municipal squares.
const pedestrianColors=[0xe34d5b,0x347fc1,0xe1a83a,0x6d55b5,0x35a77b,0xe5e7e8,0xd477a6];
for(let i=0;i<72;i++){
 let x=rnd(-184,184),z=rnd(-184,184);
 if(Math.abs(x%GRID)<7||Math.abs(z%GRID)<7){x+=Math.sign(x||1)*8;z+=Math.sign(z||1)*8}
 const p=addObject('pedestrian',x,z,.52,18,pedestrianColors[i%pedestrianColors.length]);
 p.userData.motion=['walk','walk','run','dance'][i%4];
 p.userData.walkSpeed=p.userData.motion==='run'?5:(p.userData.motion==='walk'?2:0);
 p.userData.direction=new THREE.Vector2(Math.random()-.5,Math.random()-.5).normalize();
 p.rotation.y=Math.atan2(p.userData.direction.x,p.userData.direction.y);
}
// Traditional toys: marbles, yoyos, spinning tops and pottery pieces.
const toyColors=[0xe34b73,0x35a9e8,0x43c58b,0xf2c84b,0x8b69ff];
for(let i=0;i<190;i++){
 const x=rnd(-188,188),z=rnd(-188,188);
 if(Math.abs(x%GRID)<7||Math.abs(z%GRID)<7)continue;
 const kind=i%3;
 if(kind===0)addObject('marble',x,z,.23,4,toyColors[i%toyColors.length]);
 else if(kind===1)addObject('yoyo',x,z,.48,9,toyColors[i%toyColors.length]);
 else addObject('top',x,z,.48,10,toyColors[i%toyColors.length]);
}
const clayColors=[0x9b5738,0xb66b43,0x8c4933,0xc18455,0x70402f];
for(let i=0;i<110;i++){
 const x=rnd(-188,188),z=rnd(-188,188);
 if(Math.abs(x%GRID)<7||Math.abs(z%GRID)<7)continue;
 const kind=i%4;
 if(kind===0)addObject('claypot',x,z,.62,14,clayColors[i%clayColors.length]);
 else if(kind===1)addObject('claybowl',x,z,.55,12,clayColors[i%clayColors.length]);
 else if(kind===2)addObject('clayjug',x,z,.62,15,clayColors[i%clayColors.length]);
 else addObject('claycomal',x,z,.65,16,clayColors[i%clayColors.length]);
}

// Reposición continua de objetos pequeños para que el departamento nunca quede vacío.
const RESPAWN_TARGET=720, RESPAWN_MAX=800;
let respawnClock=0;
function countLiveCollectibles(){
 let n=0;for(const o of objects)if(o.userData.alive&&!o.userData.building)n++;return n;
}
function spawnReplacement(){
 for(let tries=0;tries<24;tries++){
  const a=Math.random()*Math.PI*2,d=24+Math.random()*65;
  const x=THREE.MathUtils.clamp(player.x+Math.cos(a)*d,-190,190);
  const z=THREE.MathUtils.clamp(player.z+Math.sin(a)*d,-190,190);
  if(Math.abs(x%GRID)<8||Math.abs(z%GRID)<8)continue;
  if(typeof holes!=='undefined'&&holes.some(h=>h.alive&&Math.hypot(h.x-x,h.z-z)<10))continue;
  const r=Math.random();
  if(r<.20)addObject('produce',x,z,.38,7,[0xe84a3c,0xf0b62f,0x4caa54][Math.floor(Math.random()*3)]);
  else if(r<.38)addObject('paper',x,z,.25,3,0xf4f0df);
  else if(r<.54)addObject('can',x,z,.3,5,0xd94c45);
  else if(r<.68)addObject('bag',x,z,.62,10,0x20272c);
  else if(r<.80)addObject('marble',x,z,.23,4,0x35a9e8);
  else if(r<.90)addObject('yoyo',x,z,.48,9,0xe44b45);
  else addObject('claypot',x,z,.62,14,0x9b5738);
  return true;
 }
 return false;
}
function replenishCity(dt){
 respawnClock+=dt;if(respawnClock<.45)return;respawnClock=0;
 const live=countLiveCollectibles();
 if(live<RESPAWN_TARGET)for(let i=0;i<Math.min(5,RESPAWN_MAX-live);i++)spawnReplacement();
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
const botNames=['NOVA','SHADOW','BOLT','PIXEL','TITÁN','ECLIPSE','CHIBOLO'];
const botColors=[0xff4b78,0xffb52e,0x8b69ff,0x48e28b,0xff7045,0xe1e8ff,0xff69d2];
for(let i=0;i<botNames.length;i++)makeHole(botNames[i],botColors[i],rnd(-165,165),rnd(-165,165),false);

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
 const p=o.position;
 const dx=h.x-p.x,dz=h.z-p.z;
 const dist=Math.hypot(dx,dz);
 const objR=o.userData.radius||1;
 // Hole.io-style rule: the object stays still. It is absorbed only after
 // the hole physically overlaps/covers its footprint; there is no suction at a distance.
 const covered=dist <= Math.max(.08,h.radius-objR*.28);
 if(!covered||!canEat(h,o))return false;
 if(o.userData.building){scene.remove(o);o.userData.alive=false}
 else removeObject(o);
 addGrowth(h,o.userData.points||10);
 if(h.isPlayer)showToast(`+${o.userData.points||10} • ¡ABSORBIDO!`);
 return true;
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
   else h.target=best?best:{x:rnd(-180,180),z:rnd(-180,180)};
  }
  let tx=(h.target.x??h.target.position.x)-h.x,tz=(h.target.z??h.target.position.z)-h.z;const d=Math.hypot(tx,tz)||1;tx/=d;tz/=d;
  h.x+=tx*(h.speed/(1+h.radius*.05))*dt;h.z+=tz*(h.speed/(1+h.radius*.05))*dt;
  h.dir.set(tx,tz);
 }
 h.x=THREE.MathUtils.clamp(h.x,-195,195);h.z=THREE.MathUtils.clamp(h.z,-195,195);
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

function animateCityLife(dt){
 for(const o of objects){
  if(!o.userData.alive)continue;
  if(o.userData.kind==='pedestrian'){
   const p=o.userData.animParts;if(!p)continue;
   o.userData.phase=(o.userData.phase||0)+dt*(o.userData.motion==='dance'?7:(o.userData.motion==='run'?11:5));
   const t=o.userData.phase;
   if(o.userData.motion==='dance'){
    p.legs[0].rotation.x=Math.sin(t)*.35;p.legs[1].rotation.x=-Math.sin(t)*.35;
    p.arms[0].rotation.z=.65+Math.sin(t*1.4)*.55;p.arms[1].rotation.z=-.65-Math.sin(t*1.4)*.55;
    p.torso.rotation.y=Math.sin(t*.5)*.22;p.torso.position.y=1.05+Math.abs(Math.sin(t*2))*.09;
   }else{
    const swing=Math.sin(t)*(o.userData.motion==='run'?.75:.42);
    p.legs[0].rotation.x=swing;p.legs[1].rotation.x=-swing;
    p.arms[0].rotation.x=-swing*.8;p.arms[1].rotation.x=swing*.8;
    p.torso.position.y=1.05+Math.abs(Math.sin(t*2))*(o.userData.motion==='run'?.10:.035);
    const d=o.userData.direction||new THREE.Vector2(1,0);
    o.position.x+=d.x*o.userData.walkSpeed*dt;o.position.z+=d.y*o.userData.walkSpeed*dt;
    if(Math.abs(o.position.x)>88||Math.abs(o.position.z)>88||Math.random()<dt*.035){
     d.set(Math.random()-.5,Math.random()-.5).normalize();o.userData.direction=d;o.rotation.y=Math.atan2(d.x,d.y);
    }
   }
  }else if(o.userData.kind==='bag'){o.rotation.y+=dt*.35}
  else if(o.userData.kind==='bottle'||o.userData.kind==='can'){o.rotation.y+=dt*.15}
 }
}

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 if(!paused&&!gameEnded){
  timeLeft=Math.max(0,timeLeft-dt);
  animateCityLife(dt);
  replenishCity(dt);
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
 const desired=new THREE.Vector3(player.x,36+player.radius*1.95,player.z+29+player.radius*1.25);
 camera.position.lerp(desired,.075);camera.lookAt(player.x,0,player.z);
 renderer.render(scene,camera);
}
updateHud();animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
