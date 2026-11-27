import { z } from 'zod';
import { collections, neighbourhoods } from './content';

const copy = (max: number) => z.string().trim().min(1).max(max);
const section = z.object({ eyebrow: copy(100), title: copy(160), enabled: z.boolean() }).strict();
const collection = z.object({ title: copy(100), description: copy(240), href: z.string(), number: z.string() }).strict();
const area = z.object({ slug: z.string(), name: z.string(), label: copy(100), accent: z.string(), intro: copy(600), checks: z.array(copy(300)).min(1).max(8) }).strict();

export const contentSchema = z.object({
  website: z.object({seoTitle:copy(100),seoDescription:copy(300),heroImage:z.string().max(500).refine(v=>v===''||(/^https:\/\//.test(v)&&(()=>{try{return !new URL(v).username&&!new URL(v).password;}catch{return false;}})())),showOwnerCallout:z.boolean(),ownerTitle:copy(100),ownerDescription:copy(300)}).strict().default({seoTitle:'Find property in Sri Lanka | Avara',seoDescription:'Discover homes, apartments, land and stays in Sri Lanka. Find a place to rent or buy and connect with property owners.',heroImage:'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',showOwnerCallout:true,ownerTitle:'Make your next move.',ownerDescription:'Find a home, manage your saved properties or list a place of your own.'}),
  hero: z.object({ eyebrow: copy(100), title: copy(100), description: copy(300), cta: copy(60) }).strict(),
  sections: z.object({ collections: section, listings: section, neighbourhoods: section, tools: section }).strict(),
  directory: z.object({ title: copy(120), description: copy(500) }).strict(),
  collections: z.array(collection).length(collections.length),
  neighbourhoods: z.array(area).length(neighbourhoods.length),
}).strict().superRefine((value, ctx) => {
  value.collections.forEach((item, i) => {
    if (item.href !== collections[i].href || item.number !== collections[i].number) {
      ctx.addIssue({ code: 'custom', path: ['collections', i], message: 'Collection destinations and identifiers are fixed.' });
    }
  });
  value.neighbourhoods.forEach((item, i) => {
    const original = neighbourhoods[i];
    if (item.slug !== original.slug || item.name !== original.name || item.accent !== original.accent) {
      ctx.addIssue({ code: 'custom', path: ['neighbourhoods', i], message: 'Neighbourhood identity and palette are fixed.' });
    }
  });
});
export type DiscoveryContent = z.infer<typeof contentSchema>;
export type SectionKey = keyof DiscoveryContent['sections'];

export const defaultContent: DiscoveryContent = {
  website:{seoTitle:'Find property in Sri Lanka | Avara',seoDescription:'Discover homes, apartments, land and stays in Sri Lanka. Find a place to rent or buy and connect with property owners.',heroImage:'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',showOwnerCallout:true,ownerTitle:'Make your next move.',ownerDescription:'Find a home, manage your saved properties or list a place of your own.'},
  hero: { eyebrow: 'A different way to discover Sri Lanka', title: 'Find somewhere you belong.', description: 'Explore homes, get to know neighbourhoods and understand what your next move could cost.', cta: 'Explore places' },
  sections: {
    collections: { eyebrow: 'Start with what matters', title: 'Find your kind of place.', enabled: true },
    listings: { eyebrow: 'On the market', title: 'Discover available properties.', enabled: true },
    neighbourhoods: { eyebrow: 'The neighbourhood edit', title: 'A home is more than four walls.', enabled: true },
    tools: { eyebrow: 'Make informed decisions', title: 'Plan your next chapter.', enabled: true },
  },
  directory: { title: 'Find a place that fits your life.', description: 'Start with five places in the Colombo region. Use practical viewing questions, browse properties and build your own budget. These are planning checklists, not market rankings or measured area profiles.' },
  collections: collections.map(c => ({...c})),
  neighbourhoods: neighbourhoods.map(n => ({...n, checks: [...n.checks]})),
};

export const mutationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), expectedRevision: z.number().int().min(0).max(2147483646), content: contentSchema }).strict(),
  z.object({ action: z.literal('publish'), expectedRevision: z.number().int().min(1).max(2147483646) }).strict(),
]);
