import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import BlogPost from '@/models/BlogPost';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await dbConnect();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/listings`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    // Fetch all active properties
    let propertyPages: MetadataRoute.Sitemap = [];
    try {
        const properties = await Property.find(
            { status: 'active' },
            { _id: 1, updatedAt: 1 }
        ).lean();

        propertyPages = properties.map((property: any) => ({
            url: `${BASE_URL}/listings/${property._id}`,
            lastModified: property.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));
    } catch (error) {
        console.error('Error fetching properties for sitemap:', error);
    }

    // Fetch all published blog posts
    let blogPages: MetadataRoute.Sitemap = [];
    try {
        const posts = await BlogPost.find(
            { status: 'published' },
            { slug: 1, updatedAt: 1 }
        ).lean();

        blogPages = posts.map((post: any) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.updatedAt || new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Error fetching blog posts for sitemap:', error);
    }

    // Location-based pages for Sri Lankan cities (SEO boost)
    const sriLankanCities = [
        'Colombo', 'Kandy', 'Galle', 'Negombo', 'Nuwara Eliya',
        'Bentota', 'Jaffna', 'Trincomalee', 'Batticaloa', 'Matara'
    ];

    const locationPages: MetadataRoute.Sitemap = sriLankanCities.map(city => ({
        url: `${BASE_URL}/listings?city=${encodeURIComponent(city)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.75,
    }));

    // Purpose-based pages
    const purposePages: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}/listings?purpose=rent`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.85,
        },
        {
            url: `${BASE_URL}/listings?purpose=sale`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.85,
        },
        {
            url: `${BASE_URL}/listings?purpose=booking`,
            lastModified: new Date(),
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
