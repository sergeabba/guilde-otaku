// Interprétations pixel art des photos locales, et non portraits photoréalistes.
// Apparence déclarée explicitement par membre : aucun teint/coiffure tiré de son id.
import { Mask, add, lerp, paint, type Vec } from '../sprite-kit.ts';
import { hand, shoe, CELL_W as W, CELL_H as H, type SpriteChar } from '../rig.ts';
import { CRAIG_SPRITES } from './craig.ts';
import { MELRICK_SPRITES } from './melrick.ts';

type Hair = 'court' | 'rase' | 'afro' | 'tresses' | 'locks' | 'long' | 'boucles' | 'chignon' | 'bonnet' | 'casquette' | 'voile';
type Outfit = 'tee' | 'polo' | 'costume' | 'chemise' | 'tunique' | 'robe' | 'debardeur' | 'veste' | 'maillot';
type Accessory = 'lunettes' | 'soleil' | 'casque' | 'masque' | 'barbe';
interface Appearance { id: number; name: string; skin: string; hair: Hair; outfit: Outfit; top: string; pants: string; hairColor?: string; accessory?: Accessory; slim?: boolean; }
// Annaëlle (54) reste provisoire : sa photo manque dans cette archive.
export const APPEARANCES: Appearance[] = [
 {id:2,name:'Jaïze Ben',skin:'#704b37',hair:'rase',outfit:'tunique',top:'#b4a37c',pants:'#3e3830',accessory:'lunettes'},
 {id:3,name:'Dr Leyna-Chloé',skin:'#754a36',hair:'voile',outfit:'robe',top:'#111d1c',pants:'#1b2228',hairColor:'#151b22',slim:true},
 {id:4,name:'Serge Le Don',skin:'#9e6849',hair:'bonnet',outfit:'veste',top:'#202737',pants:'#29313e',hairColor:'#594e44',slim:true},
 {id:5,name:'Roys',skin:'#805138',hair:'court',outfit:'debardeur',top:'#c6c6c0',pants:'#343b47',accessory:'barbe'},
 {id:6,name:'Gabriel Gabibou',skin:'#85583f',hair:'court',outfit:'tee',top:'#e8e5de',pants:'#283f51'},
 {id:7,name:'Anthony',skin:'#774c35',hair:'court',outfit:'costume',top:'#273c59',pants:'#273343',slim:true},
 {id:8,name:'Mike',skin:'#794e37',hair:'court',outfit:'tee',top:'#565454',pants:'#24272d'},
 {id:9,name:'Maxime MX Geek',skin:'#8f674e',hair:'rase',outfit:'costume',top:'#66838c',pants:'#496571'},
 {id:10,name:'Hugo',skin:'#7c513b',hair:'casquette',outfit:'veste',top:'#705239',pants:'#34313a',hairColor:'#bebdb6',accessory:'lunettes'},
 {id:11,name:'Kévin',skin:'#774b32',hair:'court',outfit:'tee',top:'#e7e1cb',pants:'#283249'},
 {id:12,name:'Gomes Jonathan',skin:'#8c5f45',hair:'court',outfit:'polo',top:'#7b8879',pants:'#333b40',slim:true},
 {id:13,name:'Eric The SVAGE',skin:'#a47553',hair:'locks',outfit:'tee',top:'#bba17c',pants:'#45464c'},
 {id:14,name:'BVSH',skin:'#785037',hair:'tresses',outfit:'chemise',top:'#e4dfa5',pants:'#435348',slim:true},
 {id:15,name:'OXANCE',skin:'#9d724e',hair:'casquette',outfit:'tee',top:'#252d20',pants:'#3d4a40',hairColor:'#d1c19a'},
 {id:16,name:'Ben Uchiwa',skin:'#794d38',hair:'court',outfit:'tee',top:'#292e3b',pants:'#24293a',accessory:'barbe'},
 {id:17,name:'Adnan',skin:'#946347',hair:'court',outfit:'tee',top:'#303a4f',pants:'#273545',accessory:'lunettes'},
 {id:18,name:'Remy',skin:'#cfaa8c',hair:'rase',outfit:'polo',top:'#171f25',pants:'#343947'},
 {id:19,name:'Lucas',skin:'#704b34',hair:'court',outfit:'costume',top:'#59666a',pants:'#3a4b50',slim:true},
 {id:20,name:'Dorian XYZ',skin:'#8b5d42',hair:'court',outfit:'tee',top:'#252b35',pants:'#2d3546',accessory:'casque'},
 {id:21,name:'Gleyn',skin:'#916247',hair:'court',outfit:'chemise',top:'#875647',pants:'#25292c',accessory:'barbe'},
 {id:22,name:'Vaneck',skin:'#8d5e43',hair:'afro',outfit:'tee',top:'#192330',pants:'#343b4b',accessory:'lunettes',slim:true},
 {id:23,name:'Bruni Warner',skin:'#9a6c50',hair:'rase',outfit:'tee',top:'#35413f',pants:'#252d3a',accessory:'barbe'},
 {id:24,name:'Saske Kun',skin:'#c78b6e',hair:'chignon',outfit:'debardeur',top:'#222526',pants:'#4c4355',slim:true},
 {id:25,name:'Abigaëlle',skin:'#b57b5c',hair:'tresses',outfit:'debardeur',top:'#4d3446',pants:'#373140',slim:true},
 {id:26,name:'Graziella',skin:'#986345',hair:'tresses',outfit:'chemise',top:'#e0e4dd',pants:'#3d4157',slim:true},
 {id:27,name:'Godwin Balara',skin:'#a97651',hair:'bonnet',outfit:'tee',top:'#535b52',pants:'#34383c',hairColor:'#b0a48a'},
 {id:28,name:'Séréna Sun Set',skin:'#875338',hair:'tresses',outfit:'debardeur',top:'#211e26',pants:'#514053',slim:true},
 {id:29,name:'Fenela',skin:'#b1825c',hair:'locks',outfit:'debardeur',top:'#1f2329',pants:'#303b46',slim:true},
 {id:30,name:'Phillipe',skin:'#996a49',hair:'court',outfit:'costume',top:'#c7d4d8',pants:'#384455',accessory:'soleil',slim:true},
 {id:31,name:'Sylver ED',skin:'#80553d',hair:'court',outfit:'tunique',top:'#a5967c',pants:'#6c6659'},
 {id:32,name:'NEVERHOOD',skin:'#7c523c',hair:'afro',outfit:'veste',top:'#292731',pants:'#292b36',slim:true},
 {id:33,name:'Clay',skin:'#b77f5b',hair:'long',outfit:'tee',top:'#b6b3a6',pants:'#434653',slim:true},
 {id:34,name:'Loreena Maëlice',skin:'#b88460',hair:'boucles',outfit:'robe',top:'#ac7165',pants:'#493746',hairColor:'#705344',slim:true},
 {id:35,name:'Christoff',skin:'#81573d',hair:'court',outfit:'polo',top:'#c19e81',pants:'#9f9b7e',slim:true},
 {id:36,name:'Junior MG',skin:'#805b41',hair:'court',outfit:'tee',top:'#344941',pants:'#363d42',accessory:'barbe'},
 {id:37,name:'Thomas',skin:'#a27551',hair:'court',outfit:'chemise',top:'#6588b8',pants:'#3a4058',accessory:'soleil'},
 {id:38,name:'Jeanice',skin:'#8f5c3e',hair:'long',outfit:'robe',top:'#2b835f',pants:'#304b48',slim:true},
 {id:39,name:'Grace',skin:'#8b5438',hair:'tresses',outfit:'robe',top:'#da6040',pants:'#4b302e',slim:true},
 {id:40,name:'Floriane Nao',skin:'#946448',hair:'boucles',outfit:'tee',top:'#21252b',pants:'#bbb49e',slim:true},
 {id:41,name:'Traicy',skin:'#986b4e',hair:'tresses',outfit:'debardeur',top:'#27252b',pants:'#35445a',slim:true},
 {id:42,name:'Herta',skin:'#ae7956',hair:'long',outfit:'chemise',top:'#7860a0',pants:'#36304d',slim:true},
 {id:43,name:'Tina',skin:'#946345',hair:'tresses',outfit:'robe',top:'#b5b78c',pants:'#3b4132',slim:true},
 {id:44,name:'Kadi',skin:'#8e5f42',hair:'voile',outfit:'robe',top:'#ce8a37',pants:'#8c542c',hairColor:'#e49a41',slim:true},
 {id:45,name:'Prunelle Come',skin:'#ae7a55',hair:'afro',outfit:'debardeur',top:'#262a30',pants:'#354151',hairColor:'#514a45',accessory:'lunettes',slim:true},
 {id:46,name:'DAOUD',skin:'#9b704d',hair:'casquette',outfit:'tee',top:'#d8c9ab',pants:'#455044',hairColor:'#8e8a70'},
 {id:47,name:'Emmanuel Lony',skin:'#8a5d3f',hair:'court',outfit:'maillot',top:'#b6b36f',pants:'#334142',slim:true},
 {id:48,name:'Éméraude Norina',skin:'#9b6046',hair:'chignon',outfit:'tee',top:'#e2dcdd',pants:'#7e414b',slim:true},
 {id:49,name:'Lune',skin:'#b27b59',hair:'boucles',outfit:'debardeur',top:'#a55c51',pants:'#3c3847',slim:true},
 {id:50,name:'Jeremih Noah',skin:'#92684b',hair:'locks',outfit:'chemise',top:'#48504c',pants:'#2e3d3e',accessory:'barbe'},
 {id:51,name:'Suliane',skin:'#77533e',hair:'court',outfit:'costume',top:'#373944',pants:'#34343d',slim:true},
 {id:52,name:'Lucia',skin:'#b17c58',hair:'tresses',outfit:'robe',top:'#d4acb3',pants:'#66464f',slim:true},
 {id:53,name:'Marie Esther',skin:'#88553b',hair:'afro',outfit:'robe',top:'#cb7186',pants:'#a94764',slim:true},
 {id:55,name:'Paule Ackerman',skin:'#b2845e',hair:'court',outfit:'debardeur',top:'#202535',pants:'#d5d6c9',accessory:'lunettes',slim:true},
];

function tint(value: string, amount: number) {
 const n=parseInt(value.slice(1),16);
 return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*amount))).toString(16).padStart(2,'0')).join('');
}

function character(a: Appearance): SpriteChar {
 const headW=a.slim?12:14;
 return {
  key:`m${a.id}`,name:a.name, reference:`Interprétation stylisée de la photo locale de ${a.name}. Apparence à valider par le membre.`,
  palette:{ink:'#131420',skin:a.skin,skinS:tint(a.skin,.72),skinL:tint(a.skin,1.22),hair:a.hairColor??'#201e28',hairL:tint(a.hairColor??'#302a2c',1.8),top:a.top,topS:tint(a.top,.64),topL:tint(a.top,1.3),pants:a.pants,pantsS:tint(a.pants,.6),pantsL:tint(a.pants,1.25),white:'#e5e3d9',gold:'#d5b26e',sole:'#5a5660',eye:'#f4ece1'},
  body:{...MELRICK_SPRITES.body,head:headW,chestW:a.slim?12:16,hipW:a.slim?11:13},
  anims: a.outfit==='tunique'?CRAIG_SPRITES.anims:MELRICK_SPRITES.anims,
  draw(cv,j,p,C){
   const F=j.fwd,D:Vec=[-j.up[0],-j.up[1]],at=(v:Vec,dx:number,dy:number)=>add(add(v,F,dx),D,dy);
   const cloth={base:C.top,shadow:C.topS,light:C.topL},skin={base:C.skin,shadow:C.skinS,light:C.skinL};
   const fill=(m:Mask,c:{base:number;shadow?:number;light?:number})=>paint(cv,m,c,C.ink);
   const longSleeve=['costume','chemise','tunique','veste','robe'].includes(a.outfit);
   const arm=(shoulder:Vec,elbow:Vec,h:Vec,front:boolean)=>{
    fill(new Mask(W,H).limb(shoulder,elbow,a.slim?5.5:7,5.5),a.outfit==='debardeur'?skin:cloth);
    fill(new Mask(W,H).limb(elbow,lerp(elbow,h,.84),5,4),longSleeve?cloth:skin);
    hand(cv,W,H,elbow,h,front?p.handF:p.handB,skin,C.ink);
   };
   // La chevelure longue se dessine derrière les épaules, sans masquer le visage.
   const hc=j.headC;
   if(['tresses','locks','long','boucles','voile'].includes(a.hair)){
    const back=new Mask(W,H).limb(at(hc,-5,-3),at(j.neck,-8,a.hair==='tresses'||a.hair==='long'?27:20),a.hair==='voile'?15:14,a.hair==='voile'?19:11);
    fill(back,{base:C.hair,shadow:C.ink,light:C.hairL});
    if(a.hair==='tresses'||a.hair==='locks')for(let k=0;k<4;k++)for(let n=0;n<10;n++){const v=at(hc,-6+k*2,2+n*2);cv.set(Math.round(v[0]),Math.round(v[1]),n%3===0?C.hairL:C.hair);}
   }
   arm(j.shoulderB,j.elbowB,j.handB,false);
   const leg=(hip:Vec,knee:Vec,foot:Vec,front:boolean)=>{
    const m=new Mask(W,H).limb(hip,knee,a.slim?6:7,5.8).limb(knee,foot,5.8,4.6);
    fill(m,front?{base:C.pants,shadow:C.pantsS,light:C.pantsL}:{base:C.pantsS});
    shoe(cv,W,H,knee,foot,7,{base:C.ink,light:C.sole},C.ink,Math.abs(foot[1]-Math.max(j.footF[1],j.footB[1]))<1.5&&!p.rot);
   };
   leg(j.hipB,j.kneeB,j.footB,false);leg(j.hipF,j.kneeF,j.footF,true);
   const sh=a.slim?6:8,waist=a.slim?5:7;
   const torso=new Mask(W,H).poly([at(j.neck,-sh,2),at(j.neck,sh,2),at(j.hip,waist,4),at(j.hip,-waist,4)]);
   if(a.outfit==='robe'||a.outfit==='tunique')torso.poly([at(j.hip,-waist,-3),at(j.hip,waist,-3),at(j.kneeF,8,0),at(j.kneeB,-8,0)]);
   fill(torso,cloth);
   // Couture centrale, plis et ceinture : plusieurs pixels de relief, sans lissage.
   for(let k=6;k<20;k++){const q=at(j.neck,0,k);if(torso.has(Math.round(q[0]),Math.round(q[1])))cv.set(Math.round(q[0]),Math.round(q[1]),C.topL);}
   if(a.outfit==='costume'||a.outfit==='veste'){
    const shirt=new Mask(W,H).poly([at(j.neck,-3,2),at(j.neck,4,2),at(j.hip,1,-1)]);fill(shirt,{base:C.white});
    if(a.outfit==='costume')fill(new Mask(W,H).limb(at(j.neck,1,5),at(j.neck,1,17),2,3),{base:C.pantsS});
   }
   if(a.outfit==='chemise'||a.outfit==='polo')for(let k=5;k<20;k+=4){const q=at(j.neck,2,k);cv.set(Math.round(q[0]),Math.round(q[1]),C.white);}
   if(a.outfit==='maillot')fill(new Mask(W,H).limb(at(j.neck,-2,4),at(j.hip,-1,0),3,3),{base:C.pantsS});
   if(a.outfit==='debardeur')fill(new Mask(W,H).ellipse(at(j.neck,0,3),3,3),skin);
   const face=new Mask(W,H).ellipse(hc,headW/2,7.5);fill(face,skin);
   const hx=Math.round(hc[0]),hy=Math.round(hc[1]);
   // Volume et silhouette des cheveux/accessoires d'après la photo.
   const hair=new Mask(W,H);
   if(a.hair==='rase')hair.limb([hx-4,hy-6],[hx+3,hy-6],2,2);
   else if(a.hair==='afro'||a.hair==='boucles'){
    for(let k=0;k<7;k++){const t=Math.PI+k*Math.PI/6;hair.disc([hx+Math.cos(t)*6,hy-5+Math.sin(t)*5],3.8);}
   }else if(a.hair==='chignon')hair.ellipse([hx-1,hy-7],7,4).disc([hx-4,hy-12],4.8);
   else if(a.hair==='locks'){
    hair.ellipse([hx-1,hy-7],7,3);for(let k=0;k<5;k++)hair.limb([hx-6+k*3,hy-7],[hx-9+k*4,hy-13-(k%2)*2],2.3,2);
   }else if(a.hair==='voile')hair.ellipse([hx-2,hy-5],8,5).limb([hx-7,hy-4],[hx-6,hy+8],4,4);
   else hair.ellipse([hx-1,hy-6],7,3.8).limb([hx-6,hy-5],[hx-6,hy+1],3,2);
   fill(hair,{base:C.hair,light:C.hairL});
   if(a.hair==='casquette')fill(new Mask(W,H).limb([hx-5,hy-7],[hx+8,hy-7],4,3),{base:C.hair,light:C.hairL});
   if(a.hair==='bonnet'){
    fill(new Mask(W,H).ellipse([hx-1,hy-8],7.5,5),{base:C.hair,light:C.hairL});
    for(let x=-6;x<=5;x+=2){cv.set(hx+x,hy-8,C.hairL);cv.set(hx+x,hy-9,C.hairL);}
   }
   // Visage orienté trois-quarts : sourcil, œil, nez, bouche ; expressions liées aux coups.
   cv.set(hx+2,hy-2,C.ink);cv.set(hx+3,hy-2,C.ink);
   if(p.face!=='ko'&&p.face!=='hurt'){cv.set(hx+3,hy-1,C.eye);cv.set(hx+4,hy-1,C.ink);}else {cv.set(hx+3,hy,C.ink);cv.set(hx+4,hy-1,C.ink);}
   cv.set(hx+6,hy+1,C.skinL);cv.set(hx+5,hy+4,C.ink);
   if(a.hair==='voile')fill(new Mask(W,H).limb(at(j.neck,-7,1),at(j.neck,5,7),4,3),{base:C.hair,light:C.hairL});
   if(p.face==='shout')cv.set(hx+5,hy+5,C.ink);
   if(a.accessory==='barbe')for(let x=-4;x<6;x++)for(let y=4;y<7;y++)if(face.has(hx+x,hy+y))cv.set(hx+x,hy+y,C.hair);
   if(a.accessory==='lunettes'||a.accessory==='soleil'){
    for(let x=-3;x<=6;x++)cv.set(hx+x,hy-1,C.ink);
    for(let x=1;x<=5;x++)cv.set(hx+x,hy,a.accessory==='soleil'?C.ink:C.topL);
   }
   if(a.accessory==='casque')fill(new Mask(W,H).limb([hx-6,hy-5],[hx-7,hy+3],4,4),{base:C.ink,light:C.sole});
   arm(j.shoulderF,j.elbowF,j.handF,true);
  }
 };
}
export const ROSTER_SPRITES: SpriteChar[] = APPEARANCES.map(character);
