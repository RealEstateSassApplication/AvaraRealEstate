export const collections=[
{slug:'rent',title:'Property for rent in Sri Lanka',description:'Browse advertised rental homes, apartments and rooms across Sri Lanka.',purpose:'rent'},
{slug:'buy',title:'Property for sale in Sri Lanka',description:'Discover homes, apartments and land advertised for sale in Sri Lanka.',purpose:'sale'},
{slug:'stays',title:'Short stays in Sri Lanka',description:'Explore properties advertised for short stays. Confirm dates and prices with the owner.',purpose:'booking'},
{slug:'rooms-for-rent',title:'Rooms for rent in Sri Lanka',description:'Find advertised rooms and compare location, rent period and amenities before arranging a viewing.',purpose:'rent',type:'room'},
{slug:'apartments-for-rent',title:'Apartments for rent in Sri Lanka',description:'Browse advertised apartments for rent, including their location, price and features.',purpose:'rent',type:'apartment'},
{slug:'houses-for-sale',title:'Houses for sale in Sri Lanka',description:'Explore houses advertised for sale and check the property details with the owner.',purpose:'sale',type:'house'},
{slug:'land-for-sale',title:'Land for sale in Sri Lanka',description:'Browse advertised land for sale. Confirm boundaries, access and title independently.',purpose:'sale',type:'land'},
] as const;
export type Collection=typeof collections[number];export const findCollection=(slug:string)=>collections.find(c=>c.slug===slug);
export const collectionQuery=(c:Collection)=>new URLSearchParams({purpose:c.purpose,...('type'in c?{type:c.type}:{})}).toString();
export const publicBase=()=>new URL(process.env.NEXT_PUBLIC_BASE_URL||'https://avara.lk').origin;
