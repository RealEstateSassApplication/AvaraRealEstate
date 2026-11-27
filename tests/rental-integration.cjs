const {test}=require('node:test');const assert=require('node:assert/strict');const mongoose=require('mongoose');const jwt=require('jsonwebtoken');
test('rental requests privacy, match, offer and close with real MongoDB',async()=>{
 const db=await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
 const id=()=>new mongoose.Types.ObjectId(),tenant=id(),host=id(),stranger=id(),property=id();
 const token=u=>jwt.sign({userId:String(u)},process.env.JWT_SECRET,{expiresIn:'1h'});
 const call=async(path,user,method='GET',body)=>{const res=await fetch('http://127.0.0.1:3000'+path,{method,headers:{...(user?{Authorization:'Bearer '+token(user)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()};};
 try{
 await db.collection('users').insertMany([tenant,host,stranger].map((u,i)=>({_id:u,name:'Test account '+i,email:'rental'+i+'@example.invalid',phone:'fixture-'+i,role:i===1?'host':'user',roles:[i===1?'host':'user'],verified:false})));
 await db.collection('properties').insertOne({_id:property,owner:host,title:'Fixture room',description:'Integration only',type:'room',purpose:'rent',status:'active',price:25000,currency:'LKR',rentFrequency:'monthly',address:{city:'Nugegoda',district:'Colombo',street:'Private test street'},bedrooms:1,amenities:[],policies:{petsAllowed:false},createdAt:new Date()});
 const input={propertyTypes:['room'],purpose:'rent',location:{cities:['Nugegoda'],districts:[],flexible:false},budget:{min:0,max:30000,currency:'LKR',frequency:'monthly'},additionalNotes:'private notes only',shareWithOwners:false};
 assert.equal((await call('/api/rental-requests',null,'POST',input)).status,401);
 assert.equal((await call('/api/rental-requests',tenant,'POST',{...input,budget:{...input.budget,max:-1}})).status,400);
 const created=await call('/api/rental-requests',tenant,'POST',input);assert.equal(created.status,201,JSON.stringify(created.data));assert.equal(created.data.matchedCount,1);const req=String(created.data.data._id),path='/api/rental-requests/'+req;
 assert.equal((await call(path,stranger)).status,404);assert.equal((await call('/api/host/rental-requests',host)).data.data.length,0);
 assert.equal((await call(path,tenant,'PATCH',{shareWithOwners:true})).status,200);
 const offers=await call('/api/host/rental-requests',host);assert.equal(offers.status,200);assert.equal(offers.data.data.length,1);assert.ok(!JSON.stringify(offers.data).includes('private notes only'));assert.ok(!JSON.stringify(offers.data).includes('@example.invalid'));
 assert.equal((await call(path+'/offer',stranger,'POST',{propertyId:String(property)})).status,404);
 assert.equal((await call(path+'/offer',host,'POST',{propertyId:String(property)})).status,201);
 assert.equal((await call(path+'/offer',host,'POST',{propertyId:String(property)})).status,409);
 const own=await call(path,tenant);assert.equal(own.data.data.offers.length,1);assert.equal(String(own.data.data.offers[0].property._id),String(property));assert.equal(own.data.data.offers[0].sender,undefined);
 assert.equal((await call(path,tenant,'DELETE')).status,200);assert.equal((await call('/api/host/rental-requests',host)).data.data.length,0);assert.equal((await call(path+'/offer',host,'POST',{propertyId:String(property)})).status,404);
 }finally{await db.close();}
});
