import{createCanvas,path,line,ellipse,grad,local,wash,rng}from'./paint.mjs';
let background,foreground;
function pine(c,x,y,h,color,seed){const r=rng(seed);line(c,`M ${x} ${y} Q ${x+4} ${y-h*.5} ${x} ${y-h}`,color,h*.019);for(let j=0;j<18;j++){const u=j/18,Y=y-h+u*h,w=h*(.03+u*.25);path(c,`M ${x} ${Y-14} Q ${x-w*.55} ${Y+9} ${x-w} ${Y+18+r()*12} L ${x-w*.4} ${Y+13} ${x-w*.6} ${Y+26} Q ${x} ${Y+19} ${x+w} ${Y+24} Q ${x+w*.35} ${Y+8} ${x} ${Y-14}Z`,color)}}
function fern(c,x,y,s,seed){const r=rng(seed);local(c,x,y,s,0,()=>{for(let j=0;j<7;j++){let angle=-2.8+j*.35;const len=45+r()*45;line(c,`M 0 0 Q ${Math.cos(angle)*len*.25} ${Math.sin(angle)*len*.9} ${Math.cos(angle)*len} ${Math.sin(angle)*len}`, '#648d70',1.4);for(let k=2;k<12;k++){const u=k/12,X=Math.cos(angle)*len*u,Y=Math.sin(angle)*len*Math.sin(u*Math.PI/2),w=9*(1-u)+2;path(c,`M ${X} ${Y} q ${-w} -12 ${-w*1.6} -8 Q ${X-w} ${Y+1} ${X} ${Y} q ${w} -12 ${w*1.6} -8 Q ${X+w} ${Y+2} ${X} ${Y}Z`,j%2?'#427263':'#7d9a67')}}})}
function build(){
 background=createCanvas(1600,900);const c=background.getContext('2d');
 c.fillStyle=grad(c,0,0,0,900,[[0,'#e7d6b0'],[.3,'#c3d4c0'],[.7,'#648e89'],[1,'#203f48']]);c.fillRect(0,0,1600,900);
 // Hand-designed glacial silhouettes and snow channels.
 wash(c,'M -90 475 L 108 252 181 296 341 115 447 265 520 218 656 359 810 250 1000 482Z',[[0,'#8eaaa4'],[1,'#759694']],[-90,115,1090,400],11,2200);
 path(c,'M 203 283 L 341 115 447 265 367 218 350 239 321 207 294 264 270 258Z','#d9e0ca');
 path(c,'M 341 115 L 315 215 348 192 369 232 387 225 447 265 407 207Z','#b3c9bd');
 wash(c,'M -100 486 L 129 371 248 410 424 272 578 426 679 383 865 491 1090 456 1160 800 -100 800Z',[[0,'#6e9b94'],[1,'#335e66']],[-100,272,1260,530],12,2300);

 // Thin hand-painted snow fissures and broad glacial planes.
 path(c,'M 340 129 L 335 212 299 270 316 242 323 250 353 207 359 218 371 215Z','#dfe3c955');
 line(c,'M 339 168 L 335 222 302 270 M 366 227 L 388 250 394 270','#e8e8ca77',2);
 const mountainBrush=rng(31);for(let i=0;i<300;i++){const x=80+mountainBrush()*650,y=350+mountainBrush()*145;c.globalAlpha=.02+mountainBrush()*.045;line(c,`M ${x} ${y} l ${10+mountainBrush()*60} ${-8-mountainBrush()*22}`,'#d0d5b2',1+mountainBrush()*4)}c.globalAlpha=1;
 path(c,'M 11 418 Q 208 390 383 441 Q 564 476 812 453 Q 604 481 358 466 Q 198 421 11 435Z','#b8cdc225');
 for(let i=0;i<42;i++)pine(c,-30+i*25,575+(i%5)*18,90+(i%7)*12,'#42777a',i+30);
 // Monumental asymmetric canyon wall, carved ledges and mineral faces.
 wash(c,'M 821 -40 L 1660 -40 1660 770 1250 748 1094 660 1058 447 969 398 947 218 856 187Z',[[0,'#526c65'],[.5,'#36565a'],[1,'#243f49']],[821,-40,840,820],33,5200);
 const slabs=[['M 926 -20 L 1152 -20 1132 153 1066 255 999 240 983 143Z','#6d7b69'],['M 994 242 L 1089 221 1148 282 1107 462 1055 507 1024 404Z','#466668'],['M 1390 -20 L 1532 -20 1511 184 1430 280 1370 246 1338 98Z','#77856d'],['M 1470 258 L 1630 174 1650 590 1576 650 1440 602 1417 414Z','#405b58'],['M 1085 503 L 1160 452 1290 560 1277 735 1126 704 1051 625Z','#254b53'],['M 1440 600 L 1600 567 1650 744 1474 789 1373 715Z','#2b5056']];
 for(let i=0;i<slabs.length;i++)wash(c,slabs[i][0],[[0,slabs[i][1]],[1,'#294c51']],[950,-20,700,800],50+i,1400);
 const cracks=['M 967 44 L 1003 145 988 176 1003 241 1053 262','M 1080 37 L 1053 146 1089 190 1066 254','M 1038 334 L 1064 397 1055 484','M 1475 71 L 1434 155 1450 191 1429 249','M 1522 277 L 1481 371 1507 424 1470 519','M 1599 346 L 1561 444 1590 515 1550 585'];for(const d of cracks){line(c,d,'#263e46',4);line(c,d,'#8b9879',.9)}
 // Moss shelves follow the geology; their irregular strokes soften its contours.
 const r=rng(67);for(let i=0;i<720;i++){let side=r()>.44,x=side?1405+r()*220:930+r()*185,y=r()*695;const shelf=(Math.sin(y*.038+x*.009)+Math.sin(x*.051+y*.024))>.9;if(shelf){c.globalAlpha=.2+r()*.5;line(c,`M ${x} ${y} l ${7+r()*22} ${-2+r()*3}`,['#9eac75','#6d9469','#bfd096'][i%3],2+r()*5)}}c.globalAlpha=1;

 // Vegetation hugs fissures and hangs from wet ledges.
 for(const[x,y,sc,sd]of[[971,221,.8,41],[1045,400,.65,42],[1464,267,1.1,43],[1514,587,1.5,44],[1016,581,.75,45]]){
  fern(c,x,y,sc,sd);
  const rr=rng(sd);for(let k=0;k<6;k++){const X=x+(rr()-.5)*44,Y=y-10,L=28+rr()*83;line(c,`M ${X} ${Y} q -7 ${L*.4} 4 ${L}`,'#6c896555',1.5);for(let j=0;j<8;j++)ellipse(c,X+Math.sin(j)*4,Y+j*L/8,2.5,4.3,j%2?'#7e9970':'#4f7b66',.3)}
 }
 for(let i=0;i<160;i++){const rr=rng(2000+i),X=1420+rr()*200,Y=100+rr()*630;c.globalAlpha=.06;line(c,`M ${X} ${Y} l ${-5-rr()*20} ${15+rr()*65}`,'#aab59c',2+rr()*4)}c.globalAlpha=1;
 // Forest bank and shallow stream.
 wash(c,'M -80 580 Q 212 511 450 598 Q 650 652 827 606 Q 950 587 1129 650 L 1470 900 -80 900Z',[[0,'#53766c'],[.5,'#284f53'],[1,'#182f3a']],[-80,510,1550,390],75,3100);
 wash(c,'M 854 693 Q 1084 627 1360 663 Q 1397 762 1620 781 L 1650 945 487 945 Q 691 799 854 693Z',[[0,'#a4c6ba'],[.25,'#4a9999'],[.7,'#396e79'],[1,'#335766']],[480,635,1150,320],92,1600);
 // Ochre sandstone ledge is the bear's path into the falling water.
 wash(c,'M -80 715 Q 90 674 235 694 L 391 680 519 696 691 680 811 701 927 680 1089 685 1220 700 1290 740 1178 766 1020 756 877 779 715 756 553 794 375 773 227 800 -80 810Z',[[0,'#b9ae7b'],[.3,'#89916c'],[1,'#415e57']],[-80,674,1370,150],102,2900);
 path(c,'M -80 792 L 220 781 376 759 557 780 715 744 879 767 1020 743 1178 755 1290 740 1236 797 1084 803 969 817 894 806 838 844 695 812 551 843 373 812 230 843 -80 879Z','#294b4f');
 line(c,'M 57 705 L 231 713 390 696 M 526 711 L 669 697 806 712 M 878 701 L 1045 705 1178 718','#d0c393',2.5);
 for(let i=0;i<130;i++){const x=r()*1230,y=711+r()*46;line(c,`M ${x} ${y} l ${3+r()*21} ${-2+r()*3}`,i%3?'#556b5a':'#d4c59a',.6+r()*1.6)}

 // Small individually shaded stream stones and tufts along the ledge.
 for(const[x,y,w,h]of[[390,781,45,16],[579,790,24,10],[824,814,38,14],[957,783,28,11],[1417,800,47,21],[1310,829,31,12],[733,849,20,8]]){
  ellipse(c,x+3,y+5,w+5,h*.8,'#173e4b66');wash(c,`M ${x-w} ${y} Q ${x-w*.7} ${y-h*1.5} ${x} ${y-h} Q ${x+w*.7} ${y-h*.9} ${x+w} ${y} Q ${x+w*.4} ${y+h*.4} ${x-w} ${y}Z`,[[0,'#a3aa89'],[1,'#3e6465']],[x-w,y-h*1.5,w*2,h*2],Math.round(x),80);line(c,`M ${x-w*.65} ${y-h*.4} q ${w*.4} ${-h*.5} ${w*.9} -1`,'#c0c5a0',1.1)
 }
 for(let i=0;i<65;i++){const x=35+r()*970,y=682+r()*10;for(let k=0;k<3;k++)line(c,`M ${x} ${y} q ${k*3-3} -8 ${k*4-5} ${-11-r()*12}`,'#7a9464',.8)}
 for(let i=0;i<12;i++)pine(c,-40+i*37,648+(i%4)*9,180+(i%5)*43,['#29565a','#315f5e','#3d7067'][i%3],300+i);
 // Light entering the canyon, before the character layer.
 c.save();c.globalCompositeOperation='screen';path(c,'M 374 -30 L 484 -30 1120 800 895 790Z',grad(c,450,0,920,790,[[0,'#f4d49b22'],[1,'#f4d49b00']]));path(c,'M 533 -30 L 579 -30 1240 800 1150 790Z',grad(c,550,0,1190,790,[[0,'#f4d49b1a'],[1,'#f4d49b00']]));c.restore();
 foreground=createCanvas(1600,900);const f=foreground.getContext('2d');
 wash(f,'M -80 711 Q 33 721 144 841 L 344 936 -80 970Z',[[0,'#244b4c'],[1,'#102f39']],[-80,710,450,270],115,700);
 wash(f,'M 1288 937 L 1370 845 1430 853 1502 761 1670 750 1680 950Z',[[0,'#1d444a'],[1,'#102a35']],[1288,750,400,220],116,700);
 for(let i=0;i<12;i++)fern(f,-15+i*17,795+i*8,1.0+(i%3)*.2,i+501);
 for(let i=0;i<9;i++)fern(f,1430+i*24,861-(i%4)*9,1.1,i+601);
 // A weathered cedar trunk gives the left foreground a natural frame.
 wash(f,'M -50 -40 L 54 -40 Q 41 171 59 339 Q 79 537 16 744 L -45 820Z',[[0,'#263f3c'],[1,'#15333a']],[-50,-40,140,890],702,1100);
 line(f,'M 17 -20 Q 1 185 31 349 Q 43 490 5 644','#5e6952',4);line(f,'M 36 120 Q 117 94 221 2','#253f3b',16);line(f,'M 29 206 Q 100 193 138 132','#2b4540',11);
}
export function landscape(c,front=false){if(!background)build();c.drawImage(front?foreground:background,0,0)}
export function water(c,t,front=false){
 const r=rng(front?879:878),x=1193;
 if(!front){
 // Water falls in interleaving painted ribbons, not a uniform rectangular sheet.
 path(c,'M 1138 -40 Q 1118 125 1155 260 Q 1171 373 1132 523 Q 1124 625 1082 699 Q 1194 740 1415 706 Q 1280 539 1344 382 Q 1338 218 1348 -40Z',grad(c,1120,0,1360,500,[[0,'#d2e6d4'],[.23,'#9bc9c4'],[.52,'#e6efda'],[.8,'#93c5c2'],[1,'#b8d9ce']]));
 }
 c.save();const curtain=path(c,'M 1138 -40 Q 1118 125 1155 260 Q 1171 373 1132 523 Q 1124 625 1082 699 Q 1194 740 1415 706 Q 1280 539 1344 382 Q 1338 218 1348 -40Z');c.clip(curtain);
 for(let i=0;i<(front?36:64);i++){
  const px=1130+r()*184,wide=2+r()*(front?8:14),speed=170+r()*240,phase=r()*1100,y=((t*speed+phase)%1050)-220,len=65+r()*200;
  c.globalAlpha=front?.13+r()*.23:.16+r()*.35;
  const drift=Math.sin(y*.009+i)*9;
  path(c,`M ${px} ${y} Q ${px+drift-12} ${y+len*.4} ${px+drift} ${y+len} L ${px+drift+wide*.4} ${y+len-8} Q ${px+wide-5} ${y+len*.4} ${px+wide} ${y}Z`,front?'#f1f5df':i%3?'#eef3df':'#5fa6ad');
 }c.restore();c.globalAlpha=1;
 if(front){
  for(let i=0;i<48;i++){const u=((t*(.22+r()*.2)+r())%1),a=r()*Math.PI,x=1215+Math.cos(a)*u*(70+r()*190),y=706-Math.sin(u*Math.PI)*(15+r()*85)+u*36;c.globalAlpha=(1-u)*.55;ellipse(c,x,y,1+r()*4,1+r()*2,'#eaf2dc')}
  for(let i=0;i<24;i++){const x=1090+r()*310,y=699+r()*42;c.globalAlpha=.035;ellipse(c,x+Math.sin(t*.8+i)*15,y,35+r()*70,8+r()*18,'#e1efdb')}
 }else{
  for(let i=0;i<90;i++){const x=680+r()*950,y=744+r()*158;c.globalAlpha=.1+r()*.2;line(c,`M ${x+Math.sin(t*1.3+i)*9} ${y} q ${10+r()*20} -3 ${15+r()*48} 0`,i%3?'#b9d6bd':'#244e62',.5+r()*1.4)}
 }c.globalAlpha=1;
}
export function flecks(c,t){const r=rng(882);for(let i=0;i<24;i++){const x=90+r()*1420,y=(r()*900+t*(2+r()*8))%900;c.globalAlpha=.1+r()*.22;ellipse(c,x+Math.sin(t*.6+i)*10,y,1.0,1.0,'#ffe5ad')}c.globalAlpha=1}
