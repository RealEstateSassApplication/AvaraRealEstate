import {ImageResponse} from 'next/server';
export const runtime='edge';
export const alt='Avara — Property, places and perspective';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#243b31',color:'#f7f5ef',padding:72,flexDirection:'column',justifyContent:'space-between'}}><div style={{display:'flex',fontSize:64,letterSpacing:-3}}>avara<span style={{color:'#d2b57b'}}>.</span></div><div style={{display:'flex',flexDirection:'column',maxWidth:950}}><div style={{fontSize:24,color:'#d2b57b',letterSpacing:6}}>PROPERTY / PLACES / PERSPECTIVE</div><div style={{fontSize:88,lineHeight:1.05,marginTop:22,letterSpacing:-3}}>Discover where life happens.</div></div><div style={{display:'flex',fontSize:26,color:'#eaece2'}}>Sri Lanka · Guides · Listings · Planning tools</div></div>,size);}
