'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <main className="avara-editorial min-h-screen"><div className="avara-shell avara-section"><p className="avara-kicker">Avara / Temporary interruption</p><h1 className="avara-display mt-5 text-5xl">Something went wrong.</h1><p className="mt-5 max-w-md text-[#5f685e]">This page could not load. Try again or return to the discovery homepage.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={reset} className="min-h-[48px] rounded-full bg-[#243b31] px-5 text-sm font-semibold text-white">Try again</button><Link href="/" className="inline-flex min-h-[48px] items-center rounded-full border px-5 text-sm font-semibold">Go home</Link></div></div></main>;
}
