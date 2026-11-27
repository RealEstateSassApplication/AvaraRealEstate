import Link from 'next/link';
import { propertyOSRepository } from '@/lib/discovery/content';

export default function DiscoveryFooter() {
  return <footer className="border-t border-[#cbdcc6] bg-[#e3efdf] text-[#20352b]">
    <div className="avara-shell grid gap-10 py-14 sm:grid-cols-3 lg:py-20">
      <div><Link href="/" className="avara-display text-6xl leading-none">avara<span className="text-[#527b53]">.</span></Link><p className="mt-5 max-w-xs text-sm leading-[1.9] text-[#43594a]">A better way to discover property and plan your next move in Sri Lanka.</p></div>
      <div className="space-y-3 text-sm"><h2 className="text-xs font-semibold uppercase tracking-[.18em] text-[#527b53]">Discover</h2><Link className="block text-[#43594a] hover:text-[#20352b]" href="/explore">Neighbourhoods</Link><Link className="block text-[#43594a] hover:text-[#20352b]" href="/listings">Properties</Link><Link className="block text-[#43594a] hover:text-[#20352b]" href="/map">Property map</Link><Link className="block text-[#43594a] hover:text-[#20352b]" href="/developments">New developments</Link><Link className="block text-[#43594a] hover:text-[#20352b]" href="/blog">Journal</Link><Link className="block text-[#43594a] hover:text-[#20352b]" href="/about">About &amp; editorial approach</Link></div>
      <div className="space-y-3 text-sm"><h2 className="text-xs font-semibold uppercase tracking-[.18em] text-[#527b53]">For property owners</h2><Link className="block text-[#43594a] hover:text-[#20352b]" href="/host/apply">List a property</Link><a className="block text-[#43594a] hover:text-[#20352b]" href={propertyOSRepository}>Property Management OS on GitHub</a></div>
    </div>
    <div className="avara-shell border-t border-[#cbdcc6] py-5 text-xs text-[#53645a]">© {new Date().getFullYear()} Avara. Sri Lanka.</div>
  </footer>;
}
