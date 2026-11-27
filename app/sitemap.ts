import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import BlogPost from '@/models/BlogPost';
import { neighbourhoods } from '@/lib/discovery/content';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/listings`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  for (const path of ['/explore', '/tools/living-cost', ...neighbourhoods.map(n => '/explore/'+n.slug)]) {
    staticPages.push({ url: new URL(path, BASE_URL).toString() });
  }

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
        lastModified: property.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      blogPages = posts.map((post: any) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || now,
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
