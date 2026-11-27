const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
// Evaluate the actual dependency-free TS calculation module using the installed compiler.
const source = fs.readFileSync('lib/discovery/calculations.ts','utf8');
const output = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const compiled = {exports:{}};
new Function('exports','module',output)(compiled.exports,compiled);
const {mortgage,rentBuy,convertLand}=compiled.exports;
const close=(actual,expected,eps=1e-6)=>assert.ok(Math.abs(actual-expected)<=eps,actual+' vs '+expected);
test('land definitions and round trip',()=>{
 close(convertLand(1,'perch','sqft'),272.25);
 close(convertLand(160,'perch','acre'),1);
 close(convertLand(1,'hectare','sqm'),10000);
 close(convertLand(convertLand(10,'perch','sqm'),'sqm','perch'),10);
 close(convertLand(0,'acre','perch'),0);
 assert.throws(()=>convertLand(-1,'acre','perch'));
 assert.throws(()=>convertLand(1,'unknown','perch'));
});
test('zero-interest loan and full cash purchase',()=>{
 const z=mortgage({price:1200000,downPayment:0,annualRate:0,years:1});
 close(z.monthlyPayment,100000);close(z.totalInterest,0);close(z.totalPaid,1200000);close(z.schedule[11].balance,0);
 const c=mortgage({price:1000000,downPayment:1000000,annualRate:12,years:10});
 close(c.monthlyPayment,0);close(c.totalPaid,0);close(c.totalInterest,0);
});
test('fixed-rate amortization and conservation',()=>{
 const l=mortgage({price:1000000,downPayment:0,annualRate:12,years:1});
 close(l.monthlyPayment,88848.7886783417,0.01);
 close(l.schedule[11].balance,0);close(l.totalPaid,l.principal+l.totalInterest,0.0001);
 assert.equal(l.schedule.length,12);
 assert.ok(l.schedule.every((m,i)=>m.balance>=0&&(!i||m.balance<=l.schedule[i-1].balance)));
});
test('invalid mortgage assumptions fail',()=>{
 const p={price:100,downPayment:0,annualRate:10,years:1};
 for(const bad of [{downPayment:101},{annualRate:-1},{years:0},{years:1.5},{price:NaN}])assert.throws(()=>mortgage({...p,...bad}));
});
test('rent growth and zero-cost owner sale',()=>{
 const p={price:1000000,downPayment:1000000,annualRate:0,years:1,monthlyRent:10000,rentGrowth:10,appreciation:0,maintenanceMonthly:0,purchaseFees:0,sellingFeePercent:0,horizonYears:2};
 const c=rentBuy(p);
 close(c.rentNet,252000);close(c.buyNet,0);close(c.remainingLoan,0);close(c.difference,-252000);
 assert.equal(c.annual.length,2);
});
test('comparison after mortgage ends, purchase and sale costs',()=>{
 const p={price:1200000,downPayment:0,annualRate:0,years:1,monthlyRent:10000,rentGrowth:0,appreciation:0,maintenanceMonthly:1000,purchaseFees:20000,sellingFeePercent:5,horizonYears:2};
 const c=rentBuy(p);
 close(c.mortgagePaid,1200000);close(c.ownerCosts,24000);close(c.buyNet,104000);close(c.rentNet,240000);close(c.remainingLoan,0);
 assert.throws(()=>rentBuy({...p,horizonYears:0}));
});
test('sale before loan maturity subtracts outstanding principal',()=>{
 const c=rentBuy({price:1200000,downPayment:0,annualRate:0,years:2,monthlyRent:0,rentGrowth:0,appreciation:0,maintenanceMonthly:0,purchaseFees:0,sellingFeePercent:0,horizonYears:1});
 close(c.remainingLoan,600000);close(c.mortgagePaid,600000);close(c.buyNet,0);
});
