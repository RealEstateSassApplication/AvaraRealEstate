import { z } from 'zod';

const optionalNonNegativeNumber = z.number().finite().min(0).optional();
const propertyTypes = [
  'apartment', 'house', 'villa', 'bungalow', 'land', 'commercial', 'room',
  'studio', 'penthouse', 'duplex', 'office', 'warehouse', 'shop', 'serviced-apartment'
] as const;

const propertyInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(10000),
  type: z.enum(propertyTypes),
  purpose: z.enum(['rent', 'sale', 'booking']),
  price: z.number().finite().min(0),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  rentFrequency: z.enum(['monthly', 'weekly', 'daily']).optional(),
  bedrooms: optionalNonNegativeNumber,
  bathrooms: optionalNonNegativeNumber,
  areaSqft: optionalNonNegativeNumber,
  landSize: optionalNonNegativeNumber,
  images: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
  address: z.object({
    street: z.string().trim().min(1).max(250),
    city: z.string().trim().min(1).max(120),
    district: z.string().trim().min(1).max(120),
    province: z.string().trim().min(1).max(120).optional(),
    postalCode: z.string().trim().max(30).optional(),
    country: z.string().trim().min(2).max(100).optional(),
  }),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().finite().min(-180).max(180),
      z.number().finite().min(-90).max(90),
    ]),
  }).optional(),
  amenities: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  features: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  utilities: z.object({
    electricity: z.boolean().optional(),
    water: z.boolean().optional(),
    gas: z.boolean().optional(),
    internet: z.boolean().optional(),
    parking: z.boolean().optional(),
  }).optional(),
  availability: z.object({
    immediate: z.boolean().optional(),
    availableFrom: z.union([z.string(), z.date()]).optional(),
    minimumStay: z.number().finite().min(1).optional(),
    maximumStay: z.number().finite().min(1).optional(),
  }).optional(),
  pricing: z.object({
    weeklyDiscount: z.number().finite().min(0).max(50).optional(),
    monthlyDiscount: z.number().finite().min(0).max(50).optional(),
    cleaningFee: z.number().finite().min(0).optional(),
    securityDeposit: z.number().finite().min(0).optional(),
  }).optional(),
  policies: z.object({
    smokingAllowed: z.boolean().optional(),
    petsAllowed: z.boolean().optional(),
    partiesAllowed: z.boolean().optional(),
    checkInTime: z.string().trim().max(20).optional(),
    checkOutTime: z.string().trim().max(20).optional(),
  }).optional(),
});

export const createPropertySchema = propertyInputSchema.superRefine((value, ctx) => {
  if ((value.purpose === 'rent' || value.purpose === 'booking') && !value.rentFrequency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rentFrequency'],
      message: 'Rent frequency is required for rentals and bookings',
    });
  }
  if (
    value.availability?.minimumStay &&
    value.availability?.maximumStay &&
    value.availability.minimumStay > value.availability.maximumStay
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['availability', 'maximumStay'],
      message: 'Maximum stay must be greater than or equal to minimum stay',
    });
  }
});

export const updatePropertySchema = propertyInputSchema.partial();
