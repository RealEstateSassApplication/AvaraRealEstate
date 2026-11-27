/** Pure planning calculations; inputs are user assumptions, never market data. */
export type LandUnit = 'sqft'|'sqm'|'perch'|'acre'|'hectare';
export const squareMetresPerUnit: Record<LandUnit, number> = {
  sqft: 0.09290304, sqm: 1, perch: 272.25 * 0.09290304,
  acre: 43560 * 0.09290304, hectare: 10000,
};
function bounded(value: number, min: number, max: number, name: string) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError('Invalid ' + name);
  return value;
}
function wholeYears(value: number, max: number, name: string) {
  bounded(value,1,max,name);
  if (!Number.isInteger(value)) throw new RangeError('Use whole years for ' + name);
  return value;
}
export function convertLand(value: number, from: LandUnit, to: LandUnit): number {
  bounded(value,0,1e12,'land area');
  if (!Object.prototype.hasOwnProperty.call(squareMetresPerUnit,from) || !Object.prototype.hasOwnProperty.call(squareMetresPerUnit,to)) throw new RangeError('Unknown area unit');
  return value * squareMetresPerUnit[from] / squareMetresPerUnit[to];
}

export type MortgageInput = { price: number; downPayment: number; annualRate: number; years: number };
export type LoanMonth = { month: number; payment: number; principal: number; interest: number; balance: number };
export function mortgage(input: MortgageInput) {
  const price=bounded(input.price,0,1e10,'property price');
  const down=bounded(input.downPayment,0,price,'down payment');
  const rate=bounded(input.annualRate,0,40,'annual interest rate')/1200;
  const months=wholeYears(input.years,40,'loan term')*12;
  const principal=price-down;
  // Numerically stable for small nonzero interest rates.
  const payment=rate===0 ? principal/months : principal*rate/(-Math.expm1(-months*Math.log1p(rate)));
  const schedule: LoanMonth[]=[];
  let balance=principal, totalInterest=0, totalPaid=0;
  for(let month=1;month<=months;month++){
    const interest=balance*rate;
    const principalPaid=month===months ? balance : Math.min(balance, Math.max(0,payment-interest));
    const actualPayment=principalPaid+interest;
    balance=Math.max(0,balance-principalPaid);
    totalInterest+=interest;
    totalPaid+=actualPayment;
    schedule.push({month,payment:actualPayment,principal:principalPaid,interest,balance});
  }
  return {principal,monthlyPayment:payment,totalInterest,totalPaid,schedule};
}

export type ComparisonInput = MortgageInput & { monthlyRent:number; rentGrowth:number; appreciation:number; maintenanceMonthly:number; purchaseFees:number; sellingFeePercent:number; horizonYears:number };
export function rentBuy(input: ComparisonInput) {
  const loan=mortgage(input);
  const horizon=wholeYears(input.horizonYears,40,'comparison horizon');
  const rent=bounded(input.monthlyRent,0,1e9,'monthly rent');
  const rentGrowth=bounded(input.rentGrowth,0,30,'annual rent growth')/100;
  const appreciation=bounded(input.appreciation,-20,30,'annual appreciation')/100;
  const maintenance=bounded(input.maintenanceMonthly,0,1e9,'monthly owner costs');
  const purchaseFees=bounded(input.purchaseFees,0,1e10,'purchase costs');
  const sellingRate=bounded(input.sellingFeePercent,0,30,'selling fee')/100;
  let renterPaid=0, mortgagePaid=0, ownerCosts=0, balance=loan.principal;
  const annual: {year:number;rentNet:number;buyNet:number;homeValue:number;remainingLoan:number}[]=[];
  for(let month=1;month<=horizon*12;month++){
    renterPaid+=rent*Math.pow(1+rentGrowth,Math.floor((month-1)/12));
    const row=loan.schedule[month-1];
    if(row){mortgagePaid+=row.payment;balance=row.balance;}
    ownerCosts+=maintenance;
    if(month%12===0){
      const year=month/12;
      const homeValue=input.price*Math.pow(1+appreciation,year);
      const netSaleProceeds=homeValue*(1-sellingRate)-balance;
      annual.push({year,rentNet:renterPaid,buyNet:input.downPayment+purchaseFees+mortgagePaid+ownerCosts-netSaleProceeds,homeValue,remainingLoan:balance});
    }
  }
  const last=annual[annual.length-1];
  return {...last, annual, mortgagePaid, ownerCosts, initialCash:input.downPayment+purchaseFees, monthlyMortgage:loan.monthlyPayment, difference:last.buyNet-last.rentNet};
}
