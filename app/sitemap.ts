import { MetadataRoute } from 'next';
import {postgresPreview,readPublicRows} from '@/lib/postgres/public-read';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import BlogPost from '@/models/BlogPost';
import Development from '@/models/Development';
import { neighbourhoods } from '@/lib/discovery/content';
import {collections as searchCollections} from '@/lib/discovery/collections';
import {collectionCatalog} from '@/lib/discovery/public-catalog';
import {guides,guideReviewed} from '@/lib/discovery/guides';
export const revalidate=3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/listings`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  for (const path of ['/discover','/map','/compare','/new-properties','/developments','/market','/concierge','/rentals', '/about', '/guides', '/explore', '/tools', '/tools/living-cost', '/tools/mortgage', '/tools/rent-vs-buy', '/tools/land-converter', ...neighbourhoods.map(n => '/explore/'+n.slug)]) {
    staticPages.push({ url: new URL(path, BASE_URL).toString() });
  }

  for(const guide of guides) staticPages.push({url:new URL('/guides/'+guide.slug,BASE_URL).toString(),lastModified:guideReviewed});

  staticPages.push({url:new URL('/agent-access',BASE_URL).toString()});
  const populated=await Promise.all(searchCollections.map(async c=>({c,data:await collectionCatalog(c)})));
  for(const {c,data} of populated)if(data?.items.length)staticPages.push({url:new URL('/properties/'+c.slug,BASE_URL).toString()});
  let propertyPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  // Dynamic sitemap records are an enhancement, not a build dependency. Preview
  // and CI environments may intentionally omit database credentials, so always
  // return the static discovery surface if MongoDB is unavailable.
  if(postgresPreview()){try{const data=await readPublicRows({},100);propertyPages=data.rows.map(p=>({url:new URL('/listings/'+p.id,BASE_URL).toString(),lastModified:p.updated_at}));}catch{}}else if (process.env.MONGODB_URI) {
    try {
      await dbConnect();

      const [properties, posts] = await Promise.all([
        Property.find(
          { status: 'active' },
          { _id: 1, updatedAt: 1 }
        ).lean(),
        BlogPost.find(
          { status: 'published' },
          { slug: 1, updatedAt: 1 }
        ).lean(),
      ]);

      propertyPages = properties.map((property: any) => ({
        url: `${BASE_URL}/listings/${property._id}`,
        lastModified: property.updatedAt || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      blogPages = posts.map((post: any) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } catch (error) {
      console.error('Dynamic sitemap data unavailable:', error);
    }
  }

  let projects:MetadataRoute.Sitemap=[];
  if(!postgresPreview()&&process.env.MONGODB_URI){try{await dbConnect();const rows=await Development.find({status:'published'}).select('slug updatedAt').lean();projects=rows.map((x:{slug:string;updatedAt?:Date})=>({url:new URL('/developments/'+x.slug,BASE_URL).toString(),lastModified:x.updatedAt}));}catch{}}
  return [
    ...projects,
    ...staticPages,
    ...propertyPages,
    ...blogPages,
  ];
}
