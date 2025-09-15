import Header from '@/components/ui/layout/Header';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import PropertyCard from '@/components/property/PropertyCard';
import { cookies } from 'next/headers';
import getUserFromReq from '@/lib/auth';

export default async function FavoritesPage() {
  // Use server-side cookie auth to get the current user
  const cookieHeader = cookies().toString();
  const fakeReq: any = { headers: { cookie: cookieHeader } };
  const user = await getUserFromReq(fakeReq);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-xl font-semibold">Sign in to see your favorites</h2>
        </div>
      </div>
    );
  }

  await dbConnect();
  const populatedAny = await User.findById(user._id).populate('favorites').lean() as any;
  const favorites = (populatedAny?.favorites || []) as any[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Your Favorites</h1>
        {favorites.length === 0 ? (
          <div className="text-center text-muted-foreground">You have no favorites yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((f) => (
              <PropertyCard key={f._id} property={f} onToggleFavorite={() => {}} isFavorite={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
