import{matrix,boneMatrices,skin,solveIK,multiply,inverse,point,clamp}from'./math.mjs';import{evaluate,exposures}from'./project.mjs';import{buildPath,paint,brush,texturedTriangle}from'./drawing.mjs';
export class Renderer{
 constructor(platform,assets={},plugins={}){this.platform=platform;this.assets=assets;this.plugins=plugins;}
 render(c,project,time,{guides=false,background=true}={}){
  const p=evaluate(project,time);c.save();c.resetTransform();c.clearRect(0,0,c.canvas.width,c.canvas.height);c.scale(c.canvas.width/p.width,c.canvas.height/p.height);if(background){c.fillStyle=paint(c,p.background??'#fff',[0,0,p.width,p.height]);c.fillRect(0,0,p.width,p.height);}
  const cam=p.camera??{};c.translate(p.width/2,p.height/2);c.scale(cam.zoom??1,cam.zoom??1);c.rotate(-(cam.rotation??0)*Math.PI/180);c.translate(-(cam.x??p.width/2),-(cam.y??p.height/2));
  const env={project:p,time,guides,depth:0};for(const n of p.nodes??[])this.node(c,n,env);c.restore();return p;
 }
 node(c,n,env){
  if(n.visible===false||env.time<(n.start??-Infinity)||env.time>=(n.end??Infinity))return;if(env.depth>64)throw Error('Drawing recursion exceeded');
  c.save();c.transform(...matrix(n));c.globalAlpha*=clamp(n.opacity??1);c.globalCompositeOperation=n.blend??'source-over';
  if(n.blur)c.filter=`blur(${n.blur}px)`;if(n.shadow){c.shadowColor=n.shadow.color??'#0006';c.shadowBlur=n.shadow.blur??10;c.shadowOffsetX=n.shadow.x??0;c.shadowOffsetY=n.shadow.y??0;}
  if(n.clip)c.clip(buildPath(this.platform.Path2D,n.clip));const w=n.width??100,h=n.height??100;
  const fillStroke=path=>{if(n.fill){c.fillStyle=paint(c,n.fill,[0,0,w,h]);c.fill(path,n.fillRule??'nonzero');}if(n.stroke){c.strokeStyle=paint(c,n.stroke);c.lineWidth=n.strokeWidth??1;c.lineCap=n.lineCap??'round';c.lineJoin=n.lineJoin??'round';c.setLineDash(n.dash??[]);c.stroke(path);}};
  switch(n.type){
   case'group':for(const child of n.children??[])this.node(c,child,{...env,depth:env.depth+1});break;
   case'path':fillStroke(buildPath(this.platform.Path2D,n.commands??n.d));break;
   case'ellipse':{const p=new this.platform.Path2D();p.ellipse(0,0,n.rx??w/2,n.ry??h/2,0,0,Math.PI*2);fillStroke(p);break;}
   case'rect':{const p=new this.platform.Path2D();p.rect(0,0,w,h);fillStroke(p);break;}
   case'image':{const frames=n.frames,frame=frames?.[n.loop?Math.floor(Math.max(0,env.time-(n.offset??0))*(n.fps??24))%frames.length:Math.min(frames.length-1,Math.floor(Math.max(0,env.time-(n.offset??0))*(n.fps??24)))];const img=this.assets[frame??n.asset];if(!img)throw Error('Missing image '+n.asset);if(n.crop)c.drawImage(img,...n.crop,0,0,w,h);else c.drawImage(img,0,0,w,h);break;}
   case'text':c.font=n.font??'32px sans-serif';c.textAlign=n.align??'left';c.textBaseline=n.baseline??'alphabetic';c.fillStyle=paint(c,n.fill??'#111');c.fillText(n.text??'',0,0);break;
   case'brush':brush(c,n);break;
   case'drawing':{const id=exposures(n.exposures,env.time)??n.drawing;const nodes=env.project.drawings?.[id];if(!nodes)throw Error('Missing drawing '+id);for(const child of nodes)this.node(c,child,{...env,depth:env.depth+1});break;}
   case'skeleton':{
    const bones=structuredClone(n.bones??[]);
    for(const constraint of n.ik??[]){if(constraint.enabled===false)continue;const root=bones.find(b=>b.id===constraint.root),child=bones.find(b=>b.id===constraint.child);if(!root||!child)throw Error('Unknown IK bones');const m=boneMatrices(bones),parent=root.parent?m[root.parent]:[1,0,0,1,0,0],target=point(inverse(parent),constraint.target),solution=solveIK([root.x??0,root.y??0],target,root.length,child.length,constraint.bend??1);root.rotation=solution.rootAngle;child.rotation=solution.childAngle;}
    const pose=boneMatrices(bones),bind=boneMatrices(n.bindBones??n.bones);
    for(const slot of n.slots??[]){if(slot.skin){this.node(c,{...slot.node,vertices:skin(slot.node.vertices,slot.skin,bind,pose)},{...env,depth:env.depth+1});}else{if(!pose[slot.bone])throw Error('Unknown slot bone '+slot.bone);c.save();c.transform(...pose[slot.bone]);this.node(c,slot.node,{...env,depth:env.depth+1});c.restore();}}
    if(env.guides){c.strokeStyle='#ff5f80';c.lineWidth=2;for(const b of bones){const a=point(pose[b.id],[0,0]),e=point(pose[b.id],[b.length??30,0]);c.beginPath();c.moveTo(...a);c.lineTo(...e);c.stroke();}}
    break;
   }
   case'mesh':{
    const vertices=n.vertices.map((v,i)=>[v[0]+(n.offsets?.[i]?.[0]??0),v[1]+(n.offsets?.[i]?.[1]??0)]),img=this.assets[n.asset];
    for(const tri of n.triangles){const dst=tri.map(i=>vertices[i]);if(img)texturedTriangle(c,img,tri.map(i=>n.uv[i]),dst);else{const p=new this.platform.Path2D();p.moveTo(...dst[0]);p.lineTo(...dst[1]);p.lineTo(...dst[2]);p.closePath();fillStroke(p);}}
    break;
   }
   case'custom':{const fn=this.plugins[n.renderer];if(!fn)throw Error('Missing custom renderer '+n.renderer);fn(c,n,env,{assets:this.assets,platform:this.platform});break;}
   default:throw Error('Unknown node '+n.type);
  }
  c.restore();
 }
}
