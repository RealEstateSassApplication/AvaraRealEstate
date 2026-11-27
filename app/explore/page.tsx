import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/ui/layout/Header';

export const metadata: Metadata = {
  title: 'Explore neighbourhoods in Sri Lanka',
  description: 'Explore five Colombo-area locations, browse rental listings and plan your living costs.',
  alternates: { canonical: '/explore' },
};

const areas = ['Colombo', 'Nugegoda', 'Maharagama', 'Rajagiriya', 'Dehiwala'];

export default function ExplorePage() {
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]">
    <Header />
    <main className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-widest">Avara Explore / Colombo region</p>
      <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight sm:text-6xl">Where would you like to live?</h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-700">Start with a location, explore available listings and consider your commute, daily needs and housing budget before choosing a home.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area, i) => <article key={area} className="rounded-2xl border border-[#d8d8cc] bg-white p-6">
          <p className="text-xs text-slate-500">AREA {String(i+1).padStart(2,'0')}</p>
          <h2 className="mt-3 font-serif text-3xl">{area}</h2>
          <p className="mt-3 text-sm text-slate-600">Check rent, transport options, utilities, nearby amenities and your daily travel needs.</p>
          <Link className="mt-6 inline-block font-medium underline" href={'/listings?purpose=rent&city='+encodeURIComponent(area)}>Browse rental listings</Link>
        </article>)}
      </div>
      <section className="mt-10 rounded-2xl bg-[#20372e] p-8 text-white">
        <h2 className="font-serif text-3xl">What will it cost to live there?</h2>
        <p className="mt-3 max-w-xl text-white/80">Estimate your own monthly expenses. We do not yet publish measured neighbourhood cost indices or verified market averages.</p>
        <Link className="mt-5 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-[#20372e]" href="/tools/living-cost">Open living cost calculator</Link>
      </section>
    </main>
  </div>;
}
