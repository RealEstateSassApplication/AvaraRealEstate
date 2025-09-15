// PropertyService - clean single implementation
import dbConnect from '@/lib/db';
import Property, { IProperty } from '@/models/Property';
import User from '@/models/User';
import { Types } from 'mongoose';

export interface PropertyFilters {
  purpose?: 'rent' | 'sale' | 'short-term';
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  lat?: number;
  lng?: number;
  radius?: number; // km
  city?: string;
  district?: string;
  search?: string; // full‑text
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

function buildQuery(filters: PropertyFilters) {
  // For now include both active and pending so newly created listings appear.
  // Later, replace with moderation/approval flow.
  const query: any = { status: { $in: ['active', 'pending'] } };
  if (filters.purpose) query.purpose = filters.purpose;
  if (filters.type?.length) query.type = { $in: filters.type };
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };
  if (filters.city) query['address.city'] = new RegExp(filters.city, 'i');
  if (filters.district) query['address.district'] = new RegExp(filters.district, 'i');
  // geolocation search removed (we no longer store coordinates)
  if (filters.search) query.$text = { $search: filters.search };
  if (filters.featured) query.featured = true;
  if (filters.verified) query.verified = true;
  return query;
}

class PropertyService {
  static async create(data: Partial<IProperty>, ownerId?: string) {
    await dbConnect();
    if (ownerId) {
      const property = new Property({ ...data, owner: new Types.ObjectId(ownerId), status: 'pending' });
      const saved = await property.save();
      await User.findByIdAndUpdate(ownerId, { $addToSet: { listings: saved._id } });
      return saved as IProperty;
    }
    return (await Property.create(data as any)) as IProperty;
  }

  static async getById(id: string, includeOwner = true) {
    await dbConnect();
    if (!Types.ObjectId.isValid(id)) return null;
    const q = Property.findById(id);
    if (includeOwner) q.populate('owner', 'name profilePhoto verified phone email');
    const prop = await q.exec();
    if (prop) await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return prop as IProperty | null;
  }

  static async searchProperties(filters: PropertyFilters = {}, page = 1, limit = 20): Promise<PropertySearchResult> {
    await dbConnect();
    const query = buildQuery(filters);
    const sort: any = { featured: -1, createdAt: -1 };
    if (filters.search) sort.score = { $meta: 'textScore' };
    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(query).sort(sort).skip(skip).limit(limit).populate('owner', 'name profilePhoto verified').lean(),
      Property.countDocuments(query),
    ]);
    return {
      properties: properties as unknown as IProperty[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters,
    };
  }

  // Backwards compatible alias
  static async search(query: any, options: { limit?: number; skip?: number } = {}) {
    const limit = options.limit || 20;
    const skip = options.skip || 0;
    const page = Math.floor(skip / limit) + 1;
    return this.searchProperties(query as PropertyFilters, page, limit);
  }

  static async updateProperty(propertyId: string, updates: Partial<IProperty>, ownerId?: string) {
    await dbConnect();
    const q: any = { _id: propertyId };
    if (ownerId) q.owner = ownerId;
    const updated = await Property.findOneAndUpdate(q, updates, { new: true }).populate('owner', 'name profilePhoto verified');
    return updated as IProperty | null;
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
    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find({ owner: ownerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Property.countDocuments({ owner: ownerId }),
    ]);
    return {
      properties: properties as unknown as IProperty[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async toggleFavorite(userId: string, propertyId: string) {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const objId = new Types.ObjectId(propertyId);
    const isFavorite = (user.favorites || []).some((f: any) => (f.equals ? f.equals(objId) : f.toString() === objId.toString()));
    if (isFavorite) {
      await User.findByIdAndUpdate(userId, { $pull: { favorites: propertyId } });
      return false;
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { favorites: propertyId } });
    return true;
  }

  static async getFeaturedProperties(limit = 8) {
    await dbConnect();
    return (await Property.find({ status: 'active', featured: true }).sort({ createdAt: -1 }).limit(limit).populate('owner', 'name profilePhoto verified').lean()) as unknown as IProperty[];
  }
}

export default PropertyService;
