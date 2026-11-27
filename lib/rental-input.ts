import {z} from 'zod';
const names=z.array(z.string().trim().min(1).max(80)).max(12);
const locations=z.array(z.string().trim().min(1).max(80).regex(/^[\\p{L}\\p{M} .’'-]+$/u)).max(12);
const bound=z.object({min:z.number().finite().min(0).max(1000000).optional(),max:z.number().finite().min(0).max(1000000).optional()}).refine(x=>x.min===undefined||x.max===undefined||x.min<=x.max);
export const rentalInput=z.object({
 propertyTypes:z.array(z.enum(['apartment','house','villa','bungalow','room','commercial','land'])).min(1).max(7),
 purpose:z.enum(['rent','booking']),location:z.object({cities:locations,districts:locations,flexible:z.boolean()}).refine(x=>x.flexible||x.cities.length+x.districts.length>0),
 budget:z.object({min:z.number().finite().min(0).max(1e12),max:z.number().finite().positive().max(1e12),currency:z.enum(['LKR','USD']).default('LKR'),frequency:z.enum(['monthly','weekly','daily'])}).refine(x=>x.min<=x.max),
 requirements:z.object({bedrooms:bound.optional(),bathrooms:bound.optional(),areaSqft:bound.optional()}).default({}),
 amenities:names.default([]),moveInDate:z.string().datetime().optional(),durationMonths:z.number().int().min(1).max(120).optional(),occupants:z.number().int().min(1).max(100).optional(),hasPets:z.boolean().default(false),petDetails:z.string().max(200).optional(),additionalNotes:z.string().max(1000).optional(),
 contactPreferences:z.object({email:z.boolean(),sms:z.boolean(),whatsapp:z.boolean()}).default({email:false,sms:false,whatsapp:false}),shareWithOwners:z.boolean().default(false)
}).refine(x=>x.purpose!=='booking'||x.budget.frequency==='daily',{message:'Short stays use a daily budget'});
