import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import BlogPost from '@/models/BlogPost';
import { neighbourhoods } from '@/lib/discovery/content';
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

  for (const path of ['/about', '/guides', '/explore', '/tools', '/tools/living-cost', '/tools/mortgage', '/tools/rent-vs-buy', '/tools/land-converter', ...neighbourhoods.map(n => '/explore/'+n.slug)]) {
    staticPages.push({ url: new URL(path, BASE_URL).toString() });
  }

  for(const guide of guides) staticPages.push({url:new URL('/guides/'+guide.slug,BASE_URL).toString(),lastModified:guideReviewed});

  let propertyPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  // Dynamic sitemap records are an enhancement, not a build dependency. Preview
  // and CI environments may intentionally omit database credentials, so always
  // return the static discovery surface if MongoDB is unavailable.
  if (process.env.MONGODB_URI) {
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

  return [
    ...staticPages,
    ...propertyPages,
    ...blogPages,
  ];
}
