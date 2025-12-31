import Property, { IProperty } from '@/models/Property';
import { IRentalRequest } from '@/models/RentalRequest';

interface MatchedProperty {
  property: IProperty;
  score: number;
  matchDetails: {
    typeMatch: boolean;
    locationMatch: boolean;
    budgetMatch: boolean;
    bedroomsMatch: boolean;
    bathroomsMatch: boolean;
    areaMatch: boolean;
    amenitiesMatch: number; // percentage
  };
}

/**
 * Find properties matching a rental request criteria
 * @param request - The rental request to match against
 * @returns Array of matched properties with scores
 */
export async function findMatchingProperties(
  request: IRentalRequest
): Promise<MatchedProperty[]> {
  const query: any = {
    status: 'active',
    purpose: request.purpose
  };

  // Build the query
  const orConditions: any[] = [];

  // Property type filter
  if (request.propertyTypes && request.propertyTypes.length > 0) {
    query.type = { $in: request.propertyTypes };
  }

  // Location filter (cities or districts)
  if (!request.location.flexible) {
    const locationOr: any[] = [];
    if (request.location.cities && request.location.cities.length > 0) {
      locationOr.push({ 'address.city': { $in: request.location.cities } });
    }
    if (request.location.districts && request.location.districts.length > 0) {
      locationOr.push({ 'address.district': { $in: request.location.districts } });
    }
    if (locationOr.length > 0) {
      orConditions.push(...locationOr);
    }
  }

  // Rent frequency match
  if (request.purpose === 'rent' || request.purpose === 'booking') {
    query.rentFrequency = request.budget.frequency;
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  // Fetch properties that match basic criteria
  const properties = await Property.find(query).lean();

  // Score and filter properties
  const matchedProperties: MatchedProperty[] = [];

  for (const property of properties) {
    const matchDetails = {
      typeMatch: true, // Already filtered in query
      locationMatch: true, // Already filtered in query or flexible
      budgetMatch: false,
      bedroomsMatch: true,
      bathroomsMatch: true,
      areaMatch: true,
      amenitiesMatch: 0
    };

    let score = 0;

    // Check budget (critical - 30 points)
    const propertyPrice = property.price || 0;
    if (propertyPrice >= request.budget.min && propertyPrice <= request.budget.max) {
      matchDetails.budgetMatch = true;
      score += 30;
      
      // Bonus for being in the middle of the range
      const budgetRange = request.budget.max - request.budget.min;
      if (budgetRange > 0) {
        const pricePosition = (propertyPrice - request.budget.min) / budgetRange;
        if (pricePosition >= 0.3 && pricePosition <= 0.7) {
          score += 5; // Sweet spot bonus
        }
      }
    } else {
      // Skip properties outside budget
      continue;
    }

    // Property type match (already filtered, 15 points)
    score += 15;

    // Location match (already filtered or flexible, 15 points)
    if (!request.location.flexible) {
      const hasCityPreference = request.location.cities.length > 0;
      const hasDistrictPreference = request.location.districts.length > 0;
      
      if (hasCityPreference || hasDistrictPreference) {
        const cityMatch = !hasCityPreference || request.location.cities.includes(property.address?.city || '');
        const districtMatch = !hasDistrictPreference || request.location.districts.includes(property.address?.district || '');
        
        if (cityMatch || districtMatch) {
          score += 15;
        }
      } else {
        // No location preference specified, give full points
        score += 15;
      }
    } else {
      score += 15; // Full points for flexible location
    }

    // Bedrooms requirement (10 points)
    if (request.requirements.bedrooms) {
      const { min, max } = request.requirements.bedrooms;
      const propBedrooms = property.bedrooms || 0;
      
      if (min !== undefined && propBedrooms < min) {
        matchDetails.bedroomsMatch = false;
      } else if (max !== undefined && propBedrooms > max) {
        matchDetails.bedroomsMatch = false;
      } else {
        score += 10;
      }
    } else {
      score += 10;
    }

    // Bathrooms requirement (10 points)
    if (request.requirements.bathrooms) {
      const { min, max } = request.requirements.bathrooms;
      const propBathrooms = property.bathrooms || 0;
      
      if (min !== undefined && propBathrooms < min) {
        matchDetails.bathroomsMatch = false;
      } else if (max !== undefined && propBathrooms > max) {
        matchDetails.bathroomsMatch = false;
      } else {
        score += 10;
      }
    } else {
      score += 10;
    }

    // Area requirement (5 points)
    if (request.requirements.areaSqft) {
      const { min, max } = request.requirements.areaSqft;
      const propArea = property.areaSqft || 0;
      
      if (min !== undefined && propArea < min) {
        matchDetails.areaMatch = false;
      } else if (max !== undefined && propArea > max) {
        matchDetails.areaMatch = false;
      } else {
        score += 5;
      }
    } else {
      score += 5;
    }

    // Amenities matching (15 points)
    if (request.amenities && request.amenities.length > 0) {
      const propertyAmenities = property.amenities || [];
      const matchedAmenities = request.amenities.filter(amenity =>
        propertyAmenities.includes(amenity)
      );
      const amenitiesScore = (matchedAmenities.length / request.amenities.length) * 15;
      matchDetails.amenitiesMatch = Math.round((matchedAmenities.length / request.amenities.length) * 100);
      score += amenitiesScore;
    } else {
      score += 15; // No specific amenities required
      matchDetails.amenitiesMatch = 100;
    }

    // Pet-friendly bonus (if pets required, 5 points)
    if (request.hasPets) {
      if (property.policies?.petsAllowed) {
        score += 5;
      }
    } else {
      score += 5;
    }

    // Availability check (5 points)
    if (request.moveInDate) {
      const moveInDate = new Date(request.moveInDate);
      const availableFrom = property.availability?.availableFrom;
      
      if (property.availability?.immediate) {
        score += 5;
      } else if (availableFrom) {
        const availDate = new Date(availableFrom);
        if (availDate <= moveInDate) {
          score += 5;
        }
      }
    } else {
      score += 5;
    }

    // Only include properties with a minimum match score
    if (score >= 50) {
      matchedProperties.push({
        property: property as IProperty,
        score: Math.round(score),
        matchDetails
      });
    }
  }

  // Sort by score (highest first)
  matchedProperties.sort((a, b) => b.score - a.score);

  return matchedProperties;
}

/**
 * Check if a specific property matches a rental request
 * @param property - The property to check
 * @param request - The rental request
 * @returns Match score and details
 */
export function checkPropertyMatch(
  property: IProperty,
  request: IRentalRequest
): { matches: boolean; score: number; details: any } {
  // Similar logic as above but for a single property
  let score = 0;
  const details: any = {};

  // Basic checks
  if (property.status !== 'active' || property.purpose !== request.purpose) {
    return { matches: false, score: 0, details };
  }

  // Budget
  const propertyPrice = property.price || 0;
  if (propertyPrice >= request.budget.min && propertyPrice <= request.budget.max) {
    score += 30;
    details.budgetMatch = true;
  } else {
    return { matches: false, score: 0, details };
  }

  // Continue with other checks...
  return { matches: score >= 50, score, details };
}
