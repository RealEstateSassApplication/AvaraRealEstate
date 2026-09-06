import dbConnect from '@/lib/db';
import Property, { IProperty } from '@/models/Property';
import User from '@/models/User';
import { Types } from 'mongoose';
import {
  calculatePropertyTrustScore,
  isPropertyVerified,
  trustLevelForScore,
} from '@/lib/propertyTrust';

export interface PropertyFilters {
  purpose?: 'rent' | 'sale' | 'booking';
  type?: string[] | string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[] | string;
  lat?: number;
  lng?: number;
  radius?: number;
  city?: string;
  district?: string;
  search?: string;
  featured?: boolean;
  verified?: boolean;
}

export interface PropertySearchResult {
  properties: IProperty[];
  total: number;
  page: number;
  totalPages: number;
  filters: PropertyFilters;
}

function toArray(value?: string[] | string) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildQuery(filters: PropertyFilters) {
  // The public search surface must never expose pending/rejected inventory.
  const query: any = { status: 'active' };
  if (filters.purpose) query.purpose = filters.purpose;

  const types = toArray(filters.type).filter(Boolean);
  if (types.length) query.type = { $in: types };

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }
  if (filters.bedrooms !== undefined) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms !== undefined) query.bathrooms = { $gte: filters.bathrooms };

  const amenities = toArray(filters.amenities).filter(Boolean);
  if (amenities.length) query.amenities = { $all: amenities };

  if (filters.city) query['address.city'] = new RegExp(escapeRegExp(filters.city), 'i');
  if (filters.district) query['address.district'] = new RegExp(escapeRegExp(filters.district), 'i');
  if (filters.search) query.$text = { $search: filters.search };
  if (filters.featured === true) query.featured = true;
  if (filters.verified === true) query.verified = true;

  if (
    Number.isFinite(filters.lat) &&
    Number.isFinite(filters.lng) &&
    Number.isFinite(filters.radius) &&
    Number(filters.radius) > 0
  ) {
    const radiusKm = Math.min(Math.max(Number(filters.radius), 0.1), 500);
    query.location = {
      $geoWithin: {
        $centerSphere: [
          [Number(filters.lng), Number(filters.lat)],
          radiusKm / 6378.1,
        ],
      },
    };
  }

  return query;
}

class PropertyService {
  static async create(data: Partial<IProperty>, ownerId: string) {
    await dbConnect();
    const property = new Property({
      ...data,
      owner: new Types.ObjectId(ownerId),
      status: 'pending',
      featured: false,
      verified: false,
      trustScore: 0,
      trustLevel: 'unverified',
    });
    const saved = await property.save();
    await User.findByIdAndUpdate(ownerId, { $addToSet: { listings: saved._id } });
    return saved as IProperty;
  }

  static async getById(id: string, includeOwner = true, includeNonPublic = false) {
    await dbConnect();
    if (!Types.ObjectId.isValid(id)) return null;
    const filter: any = { _id: id };
    if (!includeNonPublic) filter.status = 'active';
    const q = Property.findOne(filter);
    if (includeOwner) q.populate('owner', 'name profilePhoto verified phone email');
    const prop = await q.exec();
    if (prop) await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return prop as IProperty | null;
  }

  static async searchProperties(filters: PropertyFilters = {}, page = 1, limit = 20): Promise<PropertySearchResult> {
    await dbConnect();
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const query = buildQuery(filters);
    const sort: any = { featured: -1, trustScore: -1, createdAt: -1 };
    if (filters.search) sort.score = { $meta: 'textScore' };
    const skip = (safePage - 1) * safeLimit;
    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .populate('owner', 'name profilePhoto verified')
        .lean(),
      Property.countDocuments(query),
    ]);
    return {
      properties: properties as unknown as IProperty[],
      total,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      filters,
    };
  }

  static async search(query: any, options: { limit?: number; skip?: number } = {}) {
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = Math.max(0, Number(options.skip) || 0);
    const page = Math.floor(skip / limit) + 1;
    return this.searchProperties(query as PropertyFilters, page, limit);
  }

  static async updateProperty(propertyId: string, updates: Partial<IProperty>, ownerId?: string) {
    await dbConnect();
    const q: any = { _id: propertyId };
    if (ownerId) q.owner = ownerId;
    const property = await Property.findOne(q);
    if (!property) return null;

    Object.assign(property, updates);

    // Material owner edits invalidate only the trust checks affected by the edit.
    if (ownerId && updates.address) {
      property.verification.addressVerified = false;
      property.verification.inspectionVerified = false;
    }
    if (ownerId && updates.price !== undefined) {
      property.verification.pricingReviewed = false;
    }
    if (ownerId && updates.images) {
      property.verification.inspectionVerified = false;
    }

    const score = calculatePropertyTrustScore(property.verification || {});
    property.trustScore = score;
    property.trustLevel = trustLevelForScore(score);
    property.verified = isPropertyVerified(property.verification || {});

    await property.save();
    await property.populate('owner', 'name profilePhoto verified');
    return property as IProperty;
  }

  static async deleteProperty(propertyId: string, ownerId?: string) {
    await dbConnect();
    const q: any = { _id: propertyId };
    if (ownerId) q.owner = ownerId;
    const result = await Property.findOneAndDelete(q);
    if (result && ownerId) await User.findByIdAndUpdate(ownerId, { $pull: { listings: propertyId } });
    return !!result;
  }

  static async getPropertiesByOwner(ownerId: string, page = 1, limit = 10) {
    await dbConnect();
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;
    const [properties, total] = await Promise.all([
      Property.find({ owner: ownerId }).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Property.countDocuments({ owner: ownerId }),
    ]);
    return {
      properties: properties as unknown as IProperty[],
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  static async toggleFavorite(userId: string, propertyId: string) {
    await dbConnect();
    if (!Types.ObjectId.isValid(propertyId)) throw new Error('Invalid property id');
    const property = await Property.findOne({ _id: propertyId, status: 'active' }).select('_id');
    if (!property) throw new Error('Property not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const objId = new Types.ObjectId(propertyId);
    const isFavorite = (user.favorites || []).some((f: any) =>
      f.equals ? f.equals(objId) : f.toString() === objId.toString()
    );
    if (isFavorite) {
      await User.findByIdAndUpdate(userId, { $pull: { favorites: propertyId } });
      return false;
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { favorites: propertyId } });
    return true;
  }

  static async getFeaturedProperties(limit = 8) {
    await dbConnect();
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    return Property.find({ status: 'active', featured: true })
      .sort({ trustScore: -1, createdAt: -1 })
      .limit(safeLimit)
      .populate('owner', 'name profilePhoto verified')
      .lean() as unknown as IProperty[];
  }
}

export default PropertyService;
