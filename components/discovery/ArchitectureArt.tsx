import { useId } from 'react';

export type ArtKind = 'apartment'|'house'|'land'|'stay'|'city'|'garden'|'coast';
const palettes: Record<ArtKind, [string,string,string,string,string]> = {
 apartment:['#c9b9a2','#e7d9c5','#827a68','#5a695a','#384d42'],
 house:['#d4bc99','#f0e1c8','#a17a59','#70836a','#3c5145'],
 land:['#bfc6a8','#e8dfc9','#9b9f73','#748c65','#415c46'],
 stay:['#c6b9a2','#e9dac1','#a47e62','#8a9a87','#4b7370'],
 city:['#b5c0b5','#e8e3d4','#82938a','#66786e','#42564e'],
 garden:['#c2c4a5','#e7debf','#96936e','#768763','#425b46'],
 coast:['#b6c8c8','#e7ded0','#a5b5ab','#7c9b9a','#426c70'],
};
export default function ArchitectureArt({kind,className=''}:{kind:ArtKind;className?:string}){
 const id=useId().replace(/:/g,'');
 const [sky,light,stone,green,dark]=palettes[kind];
 const city=kind==='city'||kind==='apartment', land=kind==='land'||kind==='garden';
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" className={className}>
  <defs><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor={sky}/><stop offset="1" stopColor={light}/></linearGradient><pattern id={id+'line'} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke={dark} strokeOpacity=".13" strokeWidth=".65"/></pattern></defs>
  <rect width="640" height="420" fill={'url(#'+id+'sky)'}/>
  <circle cx="477" cy="86" r="50" fill={light} opacity=".9"/>
  <path d="M0 270 Q110 185 225 254 T440 223 T640 242 V420H0Z" fill={green} opacity=".5"/>
  <path d="M0 323 Q155 253 310 307 T640 277 V420H0Z" fill={green}/>
  {city?<g stroke={dark} strokeWidth="1.1">
   <path d="M89 316V156H181V316M181 316V98H300V316M300 316V137H392V316M392 316V192H495V316" fill={light}/>
   <path d="M181 98L204 79H321L300 98M300 98L321 79V297L300 316M392 137L409 121H510L495 192" fill={stone}/>
   {[0,1,2,3,4].map(i=><g key={i} fill={dark} opacity=".68"><rect x="200" y={116+i*36} width="30" height="19"/><rect x="248" y={116+i*36} width="30" height="19"/><path d={'M185 '+(143+i*36)+'H296'} fill="none"/>{i<4&&<><rect x="105" y={170+i*36} width="22" height="18"/><rect x="143" y={170+i*36} width="22" height="18"/><rect x="319" y={154+i*36} width="22" height="18"/><rect x="356" y={154+i*36} width="22" height="18"/></>}</g>)}
   <path d="M89 316H495V335H89Z" fill={stone}/>
  </g>:land?<g stroke={light} strokeWidth="1.8" fill="none" opacity=".9">
   <path d="M0 348L252 259L640 330M0 390L302 274L640 371M142 420L348 288M323 420L425 300M510 420L502 314"/>
   <path d="M0 348L252 259L640 330V420H0Z" fill={'url(#'+id+'line)'}/>
  </g>:<g stroke={dark} strokeWidth="1.3">
   <path d="M82 316V218L262 132L425 192V316Z" fill={light}/>
   <path d="M66 222L260 120L443 190L432 205L260 147L80 238Z" fill={stone}/>
   <path d="M262 147V316H425V205Z" fill={stone}/>
   <path d="M108 242H232V316H108Z" fill={dark}/>
   <path d="M147 242V316M192 242V316M108 275H232" stroke={light} opacity=".8"/>
   <path d="M282 217H402V302H282Z" fill={dark}/>
   <path d="M322 217V302M362 217V302" stroke={light}/>
   <path d="M425 316V251H529V316Z" fill={light}/>
   <path d="M410 250L483 218L544 249L535 258H425Z" fill={stone}/>
   <path d="M451 267H509V316H451Z" fill={dark}/>
   <path d="M68 316H550V333H68Z" fill={stone}/>
   {kind==='stay'&&<path d="M141 351H478L548 394H94Z" fill="#82a9a2" stroke={light} strokeWidth="3"/>}
  </g>}
  <g fill={dark}><path d="M55 331V198H59V331Z"/><path d="M57 214C17 193 4 164 34 158C58 156 59 186 57 214C72 169 115 164 107 185C100 203 76 209 57 214C29 217 14 239 14 248C30 245 50 229 57 214Z"/><path d="M575 337V203H580V337Z"/><path d="M578 215C543 183 511 191 522 203C535 216 558 217 578 215C567 183 589 160 603 178C611 192 590 212 578 215C619 204 633 230 626 239C607 233 593 225 578 215Z"/></g>
  <path d="M0 395Q170 359 338 389T640 372V420H0Z" fill={dark} opacity=".85"/>
  <path d="M0 403Q170 367 338 397T640 380" stroke={light} strokeOpacity=".35" fill="none"/>
 </svg>;
}
