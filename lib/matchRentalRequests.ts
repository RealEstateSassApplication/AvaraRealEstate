import Property,{IProperty} from '@/models/Property';
import type {IRentalRequest} from '@/models/RentalRequest';
import {scoreRentalMatch} from './rental-match';
export const checkPropertyMatch=scoreRentalMatch;
export async function findMatchingProperties(request:IRentalRequest){
 const query:any={status:'active',purpose:request.purpose,owner:{$ne:request.user},price:{$gte:request.budget.min,$lte:request.budget.max},currency:request.budget.currency||'LKR'};
 if(request.purpose==='rent')query.rentFrequency=request.budget.frequency;
 if(request.propertyTypes?.length)query.type={$in:request.propertyTypes};
 const properties=await Property.find(query).sort({createdAt:-1}).limit(500).lean();
 return properties.map(p=>({property:p as unknown as IProperty,...scoreRentalMatch(p,request)})).filter(m=>m.matches).sort((a,b)=>b.score-a.score).slice(0,30).map(m=>({property:m.property,score:m.score,matchDetails:m.details}));
}
