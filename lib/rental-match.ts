// Pure matching rules shared by both rental marketplace directions.
export function scoreRentalMatch(property:any,request:any){
 const norm=(v:unknown)=>String(v??'').trim().toLowerCase();
 const fail={matches:false,score:0,details:{}};
 if(property.status!=='active'||property.purpose!==request.purpose||String(property.owner)===String(request.user))return fail;
 const types=request.propertyTypes||[],loc=request.location||{},b=request.budget||{},req=request.requirements||{};
 if(types.length&&!types.some((t:string)=>norm(t)===norm(property.type)))return fail;
 const cities=loc.cities||[],districts=loc.districts||[];
 if(!loc.flexible&&(cities.length||districts.length)&&!cities.some((x:string)=>norm(x)===norm(property.address?.city))&&!districts.some((x:string)=>norm(x)===norm(property.address?.district)))return fail;
 const frequency=property.purpose==='booking'?'daily':property.rentFrequency;
 if(frequency!==b.frequency||norm(property.currency||'LKR')!==norm(b.currency||'LKR')||!Number.isFinite(property.price)||property.price<b.min||property.price>b.max)return fail;
 for(const k of ['bedrooms','bathrooms','areaSqft']){const bounds=req[k]||{},v=property[k];if((bounds.min!==undefined&&(!Number.isFinite(v)||v<bounds.min))||(bounds.max!==undefined&&(!Number.isFinite(v)||v>bounds.max)))return fail;}
 if(request.hasPets&&!property.policies?.petsAllowed)return fail;
 if(request.moveInDate&&property.availability?.availableFrom&&new Date(property.availability.availableFrom)>new Date(request.moveInDate))return fail;
 const wanted=(request.amenities||[]).map(norm),actual=(property.amenities||[]).map(norm);
 const amenitiesMatch=wanted.length?Math.round(wanted.filter((x:string)=>actual.includes(x)).length/wanted.length*100):100;
 return {matches:true,score:Math.round(85+amenitiesMatch*.15),details:{typeMatch:true,locationMatch:true,budgetMatch:true,bedroomsMatch:true,bathroomsMatch:true,areaMatch:true,amenitiesMatch}};
}
