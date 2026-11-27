'use client';
import { useState, type ReactNode } from 'react';
import { mortgage, rentBuy, convertLand, type LandUnit, type MortgageInput, type ComparisonInput } from '@/lib/discovery/calculations';

const money=new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR',maximumFractionDigits:0});
const amount=new Intl.NumberFormat('en-LK',{maximumSignificantDigits:9});
type Config={key:string;label:string;initial:string;min:number;max:number;step?:string;note?:string};
const loanFields:Config[]=[
 {key:'price',label:'Property price (LKR)',initial:'15000000',min:0,max:1e10},
 {key:'downPayment',label:'Down payment (LKR)',initial:'3000000',min:0,max:1e10},
 {key:'annualRate',label:'Annual interest rate (%)',initial:'12',min:0,max:40,step:'0.01'},
 {key:'years',label:'Loan term (years)',initial:'20',min:1,max:40,step:'1'},
];
const comparisonFields:Config[]=[...loanFields,
 {key:'monthlyRent',label:'Starting monthly rent (LKR)',initial:'85000',min:0,max:1e9},
 {key:'rentGrowth',label:'Annual rent increase (%)',initial:'5',min:0,max:30,step:'0.1'},
 {key:'appreciation',label:'Annual property value change (%)',initial:'3',min:-20,max:30,step:'0.1'},
 {key:'maintenanceMonthly',label:'Monthly owner costs (LKR)',initial:'10000',min:0,max:1e9,note:'Maintenance, insurance and other owner-only recurring costs.'},
 {key:'purchaseFees',label:'One-off purchase costs (LKR)',initial:'500000',min:0,max:1e10},
 {key:'sellingFeePercent',label:'Selling costs (% of sale price)',initial:'3',min:0,max:30,step:'0.1'},
 {key:'horizonYears',label:'Comparison period (years)',initial:'10',min:1,max:40,step:'1'},
];
function useFields(config:Config[]){
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(config.map(f=>[f.key,f.initial])));
 const valid=config.every(f=>values[f.key].trim()!==''&&Number.isFinite(Number(values[f.key]))&&Number(values[f.key])>=f.min&&Number(values[f.key])<=f.max&&(f.step!=='1'||Number.isInteger(Number(values[f.key]))));
 return {values,setValues,valid,numbers:Object.fromEntries(config.map(f=>[f.key,Number(values[f.key])]))};
}
function Inputs({config,values,change}:{config:Config[];values:Record<string,string>;change:(key:string,value:string)=>void}){
 return <div className="space-y-4 rounded-2xl border border-[#d8d8cc] bg-white p-5 sm:p-7">{config.map(f=><label key={f.key} className="block text-sm font-medium">{f.label}<input type="number" min={f.min} max={f.max} step={f.step||'any'} value={values[f.key]} onChange={e=>change(f.key,e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3 text-slate-900"/>{f.note&&<span className="mt-1 block text-xs font-normal text-slate-600">{f.note}</span>}</label>)}</div>;
}
function Layout({children}:{children:ReactNode}){return <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">{children}</section>;}
function Summary({children}:{children:ReactNode}){return <div className="self-start space-y-5 rounded-2xl bg-[#20372e] p-5 text-white sm:p-7" aria-live="polite">{children}</div>;}
function Metric({label,value}:{label:string;value:number}){return <div className="border-t border-white/25 pt-3"><p className="text-sm text-white/85">{label}</p><p className="mt-1 break-words text-xl font-semibold">{money.format(value)}</p></div>;}
function Invalid(){return <p role="alert">Enter valid numbers within the field limits. Down payment cannot exceed the property price; year fields must be whole years.</p>;}
export function MortgageCalculator(){
 const f=useFields(loanFields);let result:ReturnType<typeof mortgage>|null=null;
 if(f.valid){try{result=mortgage(f.numbers as MortgageInput);}catch{/* invalid scenario */}}
 return <Layout><Inputs config={loanFields} values={f.values} change={(k,v)=>f.setValues(old=>({...old,[k]:v}))}/>
  <div className="min-w-0 space-y-5"><Summary>{result?<><p className="text-sm text-white/85">Estimated monthly repayment</p><p className="break-words text-4xl font-semibold">{money.format(result.monthlyPayment)}</p><Metric label="Loan principal" value={result.principal}/><Metric label="Total loan interest" value={result.totalInterest}/><Metric label="Total loan repayments" value={result.totalPaid}/><p className="text-xs text-white/85">Fixed annual nominal interest, monthly repayments, no fees or changes in rate. Illustrative inputs, not a lender quote.</p></>:<Invalid/>}</Summary>
  {result&&<details className="rounded-xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Annual loan balance schedule</summary><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th scope="col">Year</th><th scope="col">Remaining balance</th></tr></thead><tbody>{result.schedule.filter(m=>m.month%12===0).map(m=><tr key={m.month} className="border-t"><th scope="row" className="py-2 font-normal">{m.month/12}</th><td className="py-2">{money.format(m.balance)}</td></tr>)}</tbody></table></div></details>}</div>
 </Layout>;
}
export function RentBuyCalculator(){
 const f=useFields(comparisonFields);let result:ReturnType<typeof rentBuy>|null=null;
 if(f.valid){try{result=rentBuy(f.numbers as ComparisonInput);}catch{/* invalid scenario */}}
 return <Layout><Inputs config={comparisonFields} values={f.values} change={(k,v)=>f.setValues(old=>({...old,[k]:v}))}/>
 <div className="min-w-0 space-y-5"><Summary>{result?<><p className="text-sm text-white/85">Difference in nominal net housing cost</p><p className="break-words text-4xl font-semibold">{money.format(Math.abs(result.difference))}</p><p>{Math.abs(result.difference)<0.5?'Both scenarios are approximately equal.':result.difference>0?'Renting costs less under these assumptions.':'Buying costs less under these assumptions.'}</p><Metric label="Renting — cumulative rent" value={result.rentNet}/><Metric label="Buying — net cost after assumed sale" value={result.buyNet}/><Metric label="Buyer initial cash required" value={result.initialCash}/><Metric label="Estimated monthly mortgage" value={result.monthlyMortgage}/><Metric label="Estimated property value at exit" value={result.homeValue}/><Metric label="Remaining loan at exit" value={result.remainingLoan}/></>:<Invalid/>}</Summary>
 <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">How the comparison works</h2><p className="mt-2 text-sm leading-relaxed text-slate-700">Rent is increased once each year. Buying adds down payment, purchase costs, repayments and constant monthly owner costs, then subtracts hypothetical sale proceeds after selling costs and remaining debt. A negative buying net cost indicates proceeds exceed modeled cash outflows.</p><p className="mt-3 text-sm leading-relaxed text-slate-700">Both scenarios are nominal cash costs, not a full investment-return comparison. No investment return on saved cash, discounting, inflation adjustment, refundable deposits, taxes beyond entered fees, insurance beyond entered costs, or variable mortgage rates. Do not treat this as financial advice or an appraisal.</p></section>
 {result&&<details className="rounded-xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Compare annual exit scenarios</summary><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs sm:text-sm"><thead><tr><th scope="col">Year</th><th scope="col">Rent cost</th><th scope="col">Buy net cost</th></tr></thead><tbody>{result.annual.map(a=><tr key={a.year} className="border-t"><th scope="row" className="py-2 font-normal">{a.year}</th><td className="py-2">{money.format(a.rentNet)}</td><td className="py-2">{money.format(a.buyNet)}</td></tr>)}</tbody></table></div></details>}
 </div></Layout>;
}
const units: {id:LandUnit;label:string}[]=[{id:'perch',label:'Perches'},{id:'acre',label:'Acres'},{id:'sqft',label:'Square feet'},{id:'sqm',label:'Square metres'},{id:'hectare',label:'Hectares'}];
export function LandCalculator(){
 const [value,setValue]=useState('10');const [from,setFrom]=useState<LandUnit>('perch');
 const valid=value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1e12;
 return <Layout><div className="space-y-5 rounded-2xl border bg-white p-7"><label className="block text-sm font-medium">Area<input type="number" min="0" max="1000000000000" step="any" value={value} onChange={e=>setValue(e.target.value)} className="mt-2 block w-full rounded-lg border p-3"/></label><label className="block text-sm font-medium">Input unit<select value={from} onChange={e=>setFrom(e.target.value as LandUnit)} className="mt-2 block w-full rounded-lg border bg-white p-3">{units.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}</select></label><p className="text-sm text-slate-600">One perch = 272.25 square feet. One acre = 160 perches. One hectare = 10,000 square metres.</p></div><Summary>{valid?<>{units.map(u=><div key={u.id} className="border-b border-white/20 pb-3"><p className="text-sm text-white/80">{u.label}</p><p className="mt-1 break-words text-2xl font-semibold">{amount.format(convertLand(Number(value),from,u.id))}</p></div>)}<p className="text-xs text-white/85">Calculated using standard area definitions. Display values are rounded. For boundaries and legal area, refer to a surveyed plan.</p></>:<p role="alert">Enter an area from 0 to 1 trillion.</p>}</Summary></Layout>;
}
