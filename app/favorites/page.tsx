import Link from 'next/link';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import SavedCollection from '@/components/discovery/SavedCollection';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import {cookies} from 'next/headers';
import getUserFromReq from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function FavoritesPage(){
 const user=await getUserFromReq({headers:{cookie:cookies().toString()}});
 if(!user)return <div className="avara-editorial min-h-screen"><Header/><main className="avara-shell py-16"><h1 className="avara-display text-4xl">Your saved properties</h1><p className="mt-4">Sign in to create your shortlist.</p><Link className="mt-6 inline-block rounded-lg bg-[#243b31] px-5 py-3 text-white" href="/auth/login?next=%2Ffavorites">Sign in</Link></main><DiscoveryFooter/></div>;
 await dbConnect();
 const rows=await Property.find({_id:{$in:user.favorites||[]},status:'active'}).select('title description type purpose price currency rentFrequency bedrooms bathrooms areaSqft images address.city address.district amenities ratings featured verified trustScore trustLevel owner').populate('owner','name profilePhoto verified').lean();
 return <div className="avara-editorial min-h-screen"><Header/><main className="avara-shell py-12"><p className="avara-kicker">Your collection</p><h1 className="avara-display mt-3 text-5xl">Saved properties.</h1><SavedCollection initial={JSON.parse(JSON.stringify(rows))}/></main><DiscoveryFooter/></div>;
}
