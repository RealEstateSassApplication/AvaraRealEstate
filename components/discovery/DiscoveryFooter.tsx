import Link from 'next/link';
import { propertyOSRepository } from '@/lib/discovery/content';

export default function DiscoveryFooter() {
  return <footer className="border-t border-white/10 bg-[#20352b] text-white">
    <div className="avara-shell grid gap-10 py-14 sm:grid-cols-3 lg:py-20">
      <div><Link href="/" className="avara-display text-6xl leading-none">avara<span className="text-[#d2b57b]">.</span></Link><p className="mt-5 max-w-xs text-sm leading-[1.9] text-white/80">A better way to discover property and plan your next move in Sri Lanka.</p></div>
      <div className="space-y-3 text-sm"><h2 className="text-xs font-semibold uppercase tracking-[.18em] text-[#d2b57b]">Discover</h2><Link className="block text-white/80 hover:text-white" href="/explore">Neighbourhoods</Link><Link className="block text-white/80 hover:text-white" href="/listings">Properties</Link><Link className="block text-white/80 hover:text-white" href="/tools">Property planning tools</Link><Link className="block text-white/80 hover:text-white" href="/blog">Insights</Link></div>
      <div className="space-y-3 text-sm"><h2 className="text-xs font-semibold uppercase tracking-[.18em] text-[#d2b57b]">For property owners</h2><Link className="block text-white/80 hover:text-white" href="/host/apply">List a property</Link><a className="block text-white/80 hover:text-white" href={propertyOSRepository}>Property Management OS on GitHub</a></div>
    </div>
    <div className="avara-shell border-t border-white/15 py-5 text-xs text-white/70">© {new Date().getFullYear()} Avara. Sri Lanka.</div>
  </footer>;
}
