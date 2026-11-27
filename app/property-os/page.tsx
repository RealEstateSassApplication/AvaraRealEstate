import type { Metadata } from 'next';
import Header from '@/components/ui/layout/Header';

export const metadata: Metadata = {
  title: 'Property Management OS',
  description: 'Explore the separate Property Management OS project for rental portfolio operations.',
  alternates: { canonical: '/property-os' },
};

const repository = 'https://github.com/RealEstateSassApplication/property-management-OS';
const sourceCommit = '4470b971748df1aeed618807f32c7e6677fdf906';

export default function PropertyOSPage() {
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]">
    <Header />
    <main className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-xs font-semibold uppercase tracking-widest">Avara / Property Management OS</p>
      <h1 className="mt-4 max-w-3xl font-serif text-5xl sm:text-6xl">Manage the properties you own and operate.</h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-700">A separate software project for property managers, landlords and rental portfolios, with foundations for leasing, rent records and maintenance.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={repository+'/archive/'+sourceCommit+'.zip'} className="rounded-lg bg-[#20372e] px-5 py-3 font-semibold text-white">Download source ZIP</a>
        <a href={repository} className="rounded-lg border border-[#20372e] px-5 py-3 font-semibold">View repository and setup instructions</a>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-slate-600">Developer source snapshot, not an installer or production-ready hosted service. Requires separate Next.js, Go and PostgreSQL setup. Review licensing and deployment requirements in the repository.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['Property and unit records','Tenants and leases','Rent obligations and payments','Maintenance and work orders','Owner reporting foundations','Documents and inspections'].map(title => <div key={title} className="rounded-xl border border-[#d8d8cc] bg-white p-5"><h2 className="text-lg font-semibold">{title}</h2></div>)}
      </div>
      <section className="mt-8 rounded-xl border border-[#d8d8cc] bg-white p-6">
        <h2 className="font-serif text-2xl">Development preview</h2>
        <p className="mt-3 text-slate-700">The project contains substantial foundations. Production authentication, approved imports, billing, reconciliation and the Avara integration require further work and verification. Do not use real customer data until security and operational acceptance checks are complete.</p>
      </section>
    </main>
  </div>;
}
