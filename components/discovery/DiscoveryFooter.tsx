import Link from 'next/link';
import { propertyOSRepository } from '@/lib/discovery/content';

export default function DiscoveryFooter() {
  return <footer className="border-t border-white/10 bg-[#20372e] text-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 lg:px-8">
      <div><Link href="/" className="font-serif text-4xl">avara<span className="text-[#d2b57b]">.</span></Link><p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">A better way to discover property and plan your next move in Sri Lanka.</p></div>
      <div className="space-y-3 text-sm"><h2 className="font-semibold">Discover</h2><Link className="block text-white/80 hover:text-white" href="/explore">Neighbourhoods</Link><Link className="block text-white/80 hover:text-white" href="/listings">Properties</Link><Link className="block text-white/80 hover:text-white" href="/tools/living-cost">Living cost calculator</Link><Link className="block text-white/80 hover:text-white" href="/blog">Insights</Link></div>
      <div className="space-y-3 text-sm"><h2 className="font-semibold">For property owners</h2><Link className="block text-white/80 hover:text-white" href="/host/apply">List a property</Link><a className="block text-white/80 hover:text-white" href={propertyOSRepository}>Property Management OS on GitHub</a></div>
    </div>
    <div className="mx-auto max-w-7xl border-t border-white/15 px-5 py-5 text-xs text-white/70 lg:px-8">© {new Date().getFullYear()} Avara. Sri Lanka.</div>
  </footer>;
}
