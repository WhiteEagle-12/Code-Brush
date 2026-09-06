import fs from'node:fs/promises';import{gridMesh}from'../src/index.mjs';
const ellipse=(id,x,y,rx,ry,fill)=>({id,type:'ellipse',x,y,rx,ry,fill});
const path=(id,d,fill,stroke='#332c25',strokeWidth=2)=>({id,type:'path',d,fill,stroke,strokeWidth});
const gradient=(a,b)=>({type:'linear',from:[-100,-220],to:[110,0],stops:[[0,a],[1,b]]});
const body=path('torso','M -164 -115 C -181 -165 -130 -211 -72 -194 C -40 -231 4 -244 41 -213 Q 90 -192 119 -155 L 102 -68 C 70 -46 17 -72 -17 -61 C -63 -47 -130 -51 -153 -87Z',gradient('#b48249','#563d2d'));
const head=(pose)=>[
 {...ellipse('ear',28,-64,17,21,'#674730'),stroke:'#3b2d24',strokeWidth:2},
 path('skull','M -32 -53 Q -4 -82 35 -54 Q 50 -42 64 -22 L 112 -9 Q 130 7 110 21 L 53 27 Q 20 52 -20 32 Q -55 18 -43 -19Z',gradient('#b1814d','#6c4930')),
 path('muzzle','M 54 -18 Q 75 -13 112 -9 Q 132 10 108 22 L 60 22 Q 42 12 54 -18Z','#c8ab78','#614930',1.2),
 ellipse('nose',114,0,13,9,'#24312b'),
 pose==='closed'?{id:'eye',type:'path',d:'M 36 -25 Q 45 -19 54 -25',stroke:'#251f1c',strokeWidth:3}:ellipse('eye',46,-26,5,6,'#171f18'),
 ...(pose==='closed'?[]:[ellipse('glint',47,-28,1.6,1.7,'#e7e0c2')]),
 {id:'brow',type:'path',d:pose==='alert'?'M 33 -39 Q 45 -47 55 -35':'M 32 -37 Q 43 -42 55 -33',stroke:'#422e20',strokeWidth:3},
 {id:'mouth',type:'path',d:'M 70 16 Q 93 21 106 15',stroke:'#4e3828',strokeWidth:2}
];
const bones=[],slots=[],tracks=[];
for(const[name,x,y,phase,near]of[['rearFar',-120,-107,.5,false],['frontFar',67,-152,0,false],['rearNear',-100,-106,0,true],['frontNear',78,-152,.5,true]]){
 const upper=name+'Upper',lower=name+'Lower',isFront=name.startsWith('front'),length=isFront?75:53;
 bones.push({id:upper,x,y,rotation:80,length},{id:lower,parent:upper,x:length,y:0,rotation:0,length:isFront?74:66});
 const col=near?'#88603c':'#4d3b2c';
 slots.push({bone:upper,node:path(name+'Thigh',`M -20 -24 Q 25 -35 ${length} -17 Q ${length+18} 0 ${length} 21 Q 20 33 -20 24Z`,col)},
 {bone:lower,node:path(name+'Shin',`M -10 -17 Q 33 -24 ${isFront?65:57} -11 L ${isFront?78:70} -4 Q 83 13 64 17 L 8 19 Q -13 11 -10 -17Z`,col)});
 const keys=[];for(let i=0;i<=40;i++){const t=i/4,walk=t<3||t>5.8&&t<9.2;keys.push([t,80+(walk?Math.sin((t*1.8+phase)*Math.PI*2)*23:0),'linear']);}tracks.push({target:'legs',property:`bones.${bones.length-2}.rotation`,keys});
}
// Put far limbs behind the torso and near limbs in front by duplicating the skeleton's depth groups.
const far={id:'farLegs',type:'skeleton',bones,slots:slots.slice(0,4)},near={id:'legs',type:'skeleton',bones,slots:slots.slice(4)};
for(const tr of [...tracks])tracks.push({...structuredClone(tr),target:'farLegs'});
const bear={id:'bear',type:'group',x:350,y:700,children:[far,body,{id:'tail',type:'ellipse',x:-166,y:-104,rx:22,ry:14,fill:'#785538'},near,{id:'head',type:'drawing',x:105,y:-182,drawing:'profile',exposures:[{start:3.2,end:4.4,drawing:'alert'},{start:4.4,end:4.65,drawing:'closed'},{start:7.1,end:10,drawing:'closed'}]}]};
const p={version:1,title:'Quadruped rig study',width:1920,height:1080,fps:24,duration:10,background:'#19392e',assets:{grotto:'assets/grotto.png'},drawings:{profile:head('profile'),alert:head('alert'),closed:head('closed')},nodes:[{id:'background',type:'image',asset:'grotto',width:1920,height:1080},bear,{id:'waterOccluder',type:'rect',x:1378,y:0,width:220,height:780,fill:{type:'linear',from:[0,0],to:[220,0],stops:[[0,'#97cfd300'],[.5,'#83b9c4d9'],[1,'#437b87ee']]}}],tracks:[...tracks,{target:'bear',property:'x',keys:[[0,280],[3,970,'linear'],[5.8,985],[9.4,1590,'linear'],[10,1640]]},{target:'bear',property:'opacity',keys:[[0,1],[8.2,1],[9.5,0],[10,0]]},{target:'head',property:'rotation',keys:[[0,0],[3,-5],[4.2,-15],[4.5,12],[5.8,0],[7.2,24],[10,24]]}],shots:[{id:'approach',start:0,end:3.2},{id:'listen',start:3.2,end:5.8,camera:{x:1120,y:560,zoom:1.7}},{id:'enter',start:5.8,end:10,camera:{x:1130,y:560,zoom:1.25}}]};
p.nodes=p.nodes.filter(n=>n.id==='bear');p.assets={};p.background='#c0c6b5';p.shots=[{id:'rig-study',start:0,end:10}];p.tracks=p.tracks.filter(t=>t.property!=='opacity');p.tracks.find(t=>t.target==='bear'&&t.property==='x').keys=[[0,720],[10,1000]];await fs.writeFile(new URL('quadruped-study.json',import.meta.url),JSON.stringify(p,null,2));
const ink=structuredClone(p);ink.title='Ink / anatomy study';ink.background='#eee6d2';ink.assets={};ink.nodes=[bear];ink.shots=[{id:'study',start:0,end:10}];ink.tracks=ink.tracks.filter(t=>t.property!=='opacity');ink.tracks.find(t=>t.target==='bear'&&t.property==='x').keys=[[0,720],[10,1000]];
function outline(n){if(n.fill)n.fill='#e2d3ae';if(n.type==='path'||n.type==='ellipse'){n.stroke='#292d29';n.strokeWidth=2.4;}for(const c of n.children??[])outline(c);for(const s of n.slots??[])outline(s.node);}ink.nodes.forEach(outline);Object.values(ink.drawings).flat().forEach(outline);
await fs.writeFile(new URL('ink-study.json',import.meta.url),JSON.stringify(ink,null,2));
// A separate abstract brush/morph/mesh scene exercises tools the bear does not use.
const m=gridMesh(250,250,4,4),off=m.vertices.map(([x,y])=>[Math.sin(y/70)*45,Math.sin(x/70)*30]);
const tools={version:1,title:'Drawing, morph and mesh',width:1280,height:720,fps:24,duration:4,background:'#eee7d5',nodes:[{id:'wash',type:'brush',points:[[120,530,.2],[160,420,.8],[245,350,1],[340,280,.4],[450,160,.1]],size:60,color:'#347d76',flow:.13,grain:3,scatter:.2,spacing:4,seed:7},{id:'morph',type:'path',x:520,y:300,commands:[['M',0,0],['C',30,-140,160,-140,190,0],['C',160,110,30,110,0,0],['Z']],fill:'#b86744',stroke:'#513e31',strokeWidth:3},{id:'cloth',type:'mesh',x:880,y:230,...m,fill:'#cab26f',stroke:'#7a704b',strokeWidth:1}],tracks:[{target:'morph',property:'commands',keys:[[0,[['M',0,0],['C',30,-140,160,-140,190,0],['C',160,110,30,110,0,0],['Z']]],[2,[['M',0,0],['C',-70,-50,230,-50,190,0],['C',200,180,-30,180,0,0],['Z']]],[4,[['M',0,0],['C',30,-140,160,-140,190,0],['C',160,110,30,110,0,0],['Z']]]]},{target:'cloth',property:'offsets',keys:[[0,m.vertices.map(()=>[0,0])],[2,off],[4,m.vertices.map(()=>[0,0])]]}]};
await fs.writeFile(new URL('drawing-lab.json',import.meta.url),JSON.stringify(tools,null,2));
