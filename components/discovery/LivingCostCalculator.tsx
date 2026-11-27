'use client';

import { useState } from 'react';

const fields = [
  ['rent', 'Rent'], ['commute', 'Transport / commute'], ['utilities', 'Utilities'],
  ['internet', 'Internet and phone'], ['groceries', 'Groceries'], ['other', 'Other recurring expenses'],
] as const;
type Field = typeof fields[number][0];
const format = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 });

export default function LivingCostCalculator() {
  const [values, setValues] = useState<Record<Field, string>>({ rent: '', commute: '', utilities: '', internet: '', groceries: '', other: '' });
  const valid = fields.every(([key]) => values[key] === '' || (Number.isFinite(Number(values[key])) && Number(values[key]) >= 0 && Number(values[key]) <= 1000000000));
  const total = fields.reduce((sum, [key]) => sum + Number(values[key] || 0), 0);
  return <section className="mt-8 grid gap-6 md:grid-cols-2">
    <div className="space-y-4 rounded-2xl border border-[#d8d8cc] bg-white p-6">
      {fields.map(([key, label]) => <div key={key}>
        <label htmlFor={key} className="block text-sm font-medium">{label} (LKR/month)</label>
        <input id={key} type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" value={values[key]} onChange={e => setValues(prev => ({...prev, [key]: e.target.value}))} placeholder="0" className="mt-1 w-full rounded-md border border-slate-300 p-3 text-slate-900" />
      </div>)}
    </div>
    <div className="self-start rounded-2xl bg-[#20372e] p-8 text-white" aria-live="polite">
      <p className="text-sm text-white/80">Estimated monthly budget</p>
      {valid ? <><p className="mt-3 break-words text-4xl font-semibold">{format.format(total)}</p><p className="mt-4 text-white/80">Annual recurring budget: {format.format(total * 12)}</p></> : <p className="mt-3">Enter non-negative amounts up to LKR 1 billion per field.</p>}
      <p className="mt-5 text-sm text-white/80">Blank fields count as zero. Excludes deposits, moving costs and one-off purchases unless you budget for them separately.</p>
    </div>
  </section>;
}
