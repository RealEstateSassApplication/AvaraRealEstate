import {cache} from 'react';
import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import {BreadcrumbSchema} from '@/components/seo/JsonLd';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import '@/models/User';
const base=process.env.NEXT_PUBLIC_BASE_URL||'https://avara.lk';
export const dynamic='force-dynamic';
type Props={params:{slug:string}};
type Post={title:string;slug:string;excerpt:string;content:string;category:string;featuredImage?:string;tags?:string[];publishedAt?:Date;updatedAt?:Date;metaTitle?:string;metaDescription?:string;author?:{name?:string;firstName?:string;lastName?:string}|null};
const getPost=cache(async(slug:string):Promise<Post|null>=>{
 if(!/^[a-z0-9-]{1,200}$/.test(slug))return null;
 if(!process.env.MONGODB_URI)throw Error('Journal database is not configured');
 await dbConnect();
 return await BlogPost.findOne({slug,status:'published'}).select('title slug excerpt content category featuredImage tags publishedAt updatedAt metaTitle metaDescription author').populate('author','name firstName lastName').lean() as Post|null;
});
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const p=await getPost(params.slug);if(!p)return {title:'Article not found',robots:{index:false,follow:false}};
 const title=p.metaTitle||p.title,description=(p.metaDescription||p.excerpt).slice(0,160),url='/blog/'+p.slug;
 return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:'article',publishedTime:p.publishedAt?.toISOString(),modifiedTime:p.updatedAt?.toISOString(),images:[p.featuredImage||'/opengraph-image']}};
}
export default async function Page({params}:Props){
 const p=await getPost(params.slug);if(!p)notFound();
 const url=new URL('/blog/'+p.slug,base).toString();
 const author=p.author?.name||[p.author?.firstName,p.author?.lastName].filter(Boolean).join(' ')||'Avara';
 const schema={'@context':'https://schema.org','@type':'Article',headline:p.title,description:p.excerpt,mainEntityOfPage:url,datePublished:p.publishedAt?.toISOString(),dateModified:p.updatedAt?.toISOString(),author:{'@type':p.author?'Person':'Organization',name:author},publisher:{'@type':'Organization',name:'Avara',url:base},image:p.featuredImage||undefined,inLanguage:'en-LK'};
 return <div className="avara-editorial min-h-screen"><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><BreadcrumbSchema items={[{name:'Home',url:base},{name:'Journal',url:new URL('/blog',base).toString()},{name:p.title,url}]}/><main className="avara-shell avara-section"><Link href="/blog" className="avara-text-link">← All journal articles</Link><article className="mx-auto mt-8 max-w-3xl min-w-0"><p className="avara-kicker">{p.category?.replaceAll('-',' ')||'Journal'}</p><h1 className="avara-display mt-4 text-[clamp(2.8rem,5vw,5rem)] leading-tight">{p.title}</h1><p className="mt-5 text-lg text-[#5f685e]">{p.excerpt}</p><p className="mt-5 text-sm text-[#5f685e]">{author}{p.publishedAt&&<> · <time dateTime={p.publishedAt.toISOString()}>{p.publishedAt.toISOString().slice(0,10)}</time></>}</p>{p.featuredImage&&<img src={p.featuredImage} alt={p.title} className="mt-8 aspect-video w-full rounded-xl object-cover"/>}<div className="mt-9 whitespace-pre-wrap break-words leading-[1.9] text-[#47534b]">{p.content}</div>{!!p.tags?.length&&<div className="mt-8 flex flex-wrap gap-2">{p.tags.map(t=><span key={t} className="rounded-full border px-3 py-1 text-xs">{t}</span>)}</div>}<div className="mt-10 border-t pt-6"><Link href="/guides" className="avara-text-link">Explore practical property guides →</Link></div></article></main><DiscoveryFooter/></div>;
}
