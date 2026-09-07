import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import BlogPost from '@/models/BlogPost';

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

  const sriLankanCities = [
    'Colombo', 'Kandy', 'Galle', 'Negombo', 'Nuwara Eliya',
    'Bentota', 'Jaffna', 'Trincomalee', 'Batticaloa', 'Matara'
  ];

  const locationPages: MetadataRoute.Sitemap = sriLankanCities.map((city) => ({
    url: `${BASE_URL}/listings?city=${encodeURIComponent(city)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  const purposePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/listings?purpose=rent`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/listings?purpose=sale`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/listings?purpose=booking`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
  ];

  return [
    ...staticPages,
    ...purposePages,
    ...locationPages,
    ...propertyPages,
    ...blogPages,
  ];
}
