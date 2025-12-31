'use client';

import PropertyCard from '@/components/property/PropertyCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home } from 'lucide-react';

interface MatchedPropertiesPanelProps {
  properties: any[];
  onToggleFavorite?: (propertyId: string) => void;
  favorites?: string[];
}

export default function MatchedPropertiesPanel({
  properties,
  onToggleFavorite,
  favorites = []
}: MatchedPropertiesPanelProps) {
  if (!properties || properties.length === 0) {
    return (
      <Alert>
        <Home className="h-4 w-4" />
        <AlertDescription>
          No matching properties found yet. We'll notify you when properties matching your criteria become available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {properties.length} Matching {properties.length === 1 ? 'Property' : 'Properties'}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property._id}
            property={property}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(property._id)}
          />
        ))}
      </div>
    </div>
  );
}
