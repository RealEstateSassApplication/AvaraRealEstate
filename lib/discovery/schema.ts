import { z } from 'zod';
import { collections, neighbourhoods } from './content';

const copy = (max: number) => z.string().trim().min(1).max(max);
const section = z.object({ eyebrow: copy(100), title: copy(160), enabled: z.boolean() }).strict();
const collection = z.object({ title: copy(100), description: copy(240), href: z.string(), number: z.string() }).strict();
const area = z.object({ slug: z.string(), name: z.string(), label: copy(100), accent: z.string(), intro: copy(600), checks: z.array(copy(300)).min(1).max(8) }).strict();

export const contentSchema = z.object({
  website: z.object({seoTitle:copy(100),seoDescription:copy(300),heroImage:z.string().max(500).refine(v=>v===''||(/^https:\/\//.test(v)&&(()=>{try{return !new URL(v).username&&!new URL(v).password;}catch{return false;}})())),showOwnerCallout:z.boolean(),ownerTitle:copy(100),ownerDescription:copy(300)}).strict().default({seoTitle:'Sri Lanka Property, Architecture & Home Building | Avara',seoDescription:'Explore Sri Lankan homes, land, rentals and stays. Compare property, read architecture and home-building guides, and plan your next move with Avara.',heroImage:'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',showOwnerCallout:true,ownerTitle:'Have a property to share?',ownerDescription:'Create a clear, accurate listing so people can discover your home, land or stay.'}),
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
  website:{seoTitle:'Sri Lanka Property, Architecture & Home Building | Avara',seoDescription:'Explore Sri Lankan homes, land, rentals and stays. Compare property, read architecture and home-building guides, and plan your next move with Avara.',heroImage:'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',showOwnerCallout:true,ownerTitle:'Have a property to share?',ownerDescription:'Create a clear, accurate listing so people can discover your home, land or stay.'},
  hero: { eyebrow: 'A different way to discover Sri Lanka', title: 'Discover property. Design your next move.', description: 'Browse homes, land and stays across Sri Lanka. Discover architecture, compare properties and plan a better place to live.', cta: 'Discover Avara' },
  sections: {
    collections: { eyebrow: 'Start with what matters', title: 'Find your kind of place.', enabled: true },
    listings: { eyebrow: 'On the market', title: 'Discover available properties.', enabled: true },
    neighbourhoods: { eyebrow: 'The neighbourhood edit', title: 'A home is more than four walls.', enabled: true },
    tools: { eyebrow: 'Make informed decisions', title: 'Plan your next chapter.', enabled: true },
  },
  directory: { title: 'Explore Sri Lanka, neighbourhood by neighbourhood.', description: 'Explore local viewing guides and property search across Sri Lanka. Start with the Colombo region and use the same practical criteria wherever you plan to move.' },
  collections: collections.map(c => ({...c})),
  neighbourhoods: neighbourhoods.map(n => ({...n, checks: [...n.checks]})),
};

export const mutationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), expectedRevision: z.number().int().min(0).max(2147483646), content: contentSchema }).strict(),
  z.object({ action: z.literal('publish'), expectedRevision: z.number().int().min(1).max(2147483646) }).strict(),
]);
