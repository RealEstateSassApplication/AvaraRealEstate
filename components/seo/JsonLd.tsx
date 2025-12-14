'use client';

import React from 'react';

// Organization Schema - for site-wide use
export interface OrganizationSchemaProps {
    name?: string;
    url?: string;
    logo?: string;
    description?: string;
    address?: {
        city: string;
        country: string;
    };
    contactPoint?: {
        telephone: string;
        email: string;
    };
}

export function OrganizationSchema({
    name = 'Avara Real Estate',
    url = 'https://avara.lk',
    logo = 'https://avara.lk/logo.png',
    description = 'Sri Lanka\'s premier real estate platform for buying, renting, and booking properties.',
    address = { city: 'Colombo', country: 'Sri Lanka' },
    contactPoint = { telephone: '+94771234567', email: 'contact@avara.lk' }
}: OrganizationSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name,
        url,
        logo,
        description,
        address: {
            '@type': 'PostalAddress',
            addressLocality: address.city,
            addressCountry: address.country
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: contactPoint.telephone,
            email: contactPoint.email,
            contactType: 'customer service'
        },
        areaServed: {
            '@type': 'Country',
            name: 'Sri Lanka'
        },
        sameAs: [
            'https://www.facebook.com/avara.lk',
            'https://www.instagram.com/avara.lk',
            'https://www.linkedin.com/company/avara-lk'
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// Real Estate Listing Schema - for individual property pages
export interface RealEstateListingSchemaProps {
    name: string;
    description: string;
    url: string;
    image: string[];
    price: number;
    priceCurrency?: string;
    address: {
        street?: string;
        city: string;
        district: string;
        country?: string;
    };
    propertyType: string;
    purpose: 'rent' | 'sale' | 'booking';
    bedrooms?: number;
    bathrooms?: number;
    floorSize?: number;
    coordinates?: {
        lat: number;
        lng: number;
    };
    datePosted?: string;
}

export function RealEstateListingSchema({
    name,
    description,
    url,
    image,
    price,
    priceCurrency = 'LKR',
    address,
    propertyType,
    purpose,
    bedrooms,
    bathrooms,
    floorSize,
    coordinates,
    datePosted
}: RealEstateListingSchemaProps) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name,
        description,
        url,
        image,
        datePosted: datePosted || new Date().toISOString(),
        offers: {
            '@type': 'Offer',
            price,
            priceCurrency,
            availability: 'https://schema.org/InStock',
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: address.street || '',
            addressLocality: address.city,
            addressRegion: address.district,
            addressCountry: address.country || 'Sri Lanka'
        },
        '@graph': [
            {
                '@type': propertyType === 'land' ? 'LandPlot' : 'Accommodation',
                name,
                numberOfBedrooms: bedrooms,
                numberOfBathroomsTotal: bathrooms,
                floorSize: floorSize ? {
                    '@type': 'QuantitativeValue',
                    value: floorSize,
                    unitCode: 'FTK' // Square feet
                } : undefined
            }
        ]
    };

    // Add geo coordinates if available
    if (coordinates?.lat && coordinates?.lng) {
        schema.geo = {
            '@type': 'GeoCoordinates',
            latitude: coordinates.lat,
            longitude: coordinates.lng
        };
    }

    // Add offer type based on purpose
    if (purpose === 'rent') {
        schema.offers['@type'] = 'Offer';
        schema.offers.businessFunction = 'http://purl.org/goodrelations/v1#LeaseOut';
    } else if (purpose === 'sale') {
        schema.offers.businessFunction = 'http://purl.org/goodrelations/v1#Sell';
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// Blog Post Schema - for blog articles
export interface BlogPostSchemaProps {
    headline: string;
    description: string;
    url: string;
    image?: string;
    author: {
        name: string;
    };
    datePublished: string;
    dateModified?: string;
}

export function BlogPostSchema({
    headline,
    description,
    url,
    image,
    author,
    datePublished,
    dateModified
}: BlogPostSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline,
        description,
        url,
        image,
        author: {
            '@type': 'Person',
            name: author.name
        },
        publisher: {
            '@type': 'Organization',
            name: 'Avara Real Estate',
            logo: {
                '@type': 'ImageObject',
                url: 'https://avara.lk/logo.png'
            }
        },
        datePublished,
        dateModified: dateModified || datePublished,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// Breadcrumb Schema - for navigation SEO
export interface BreadcrumbSchemaProps {
    items: Array<{
        name: string;
        url: string;
    }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// FAQ Schema - for FAQ pages (good for SEO)
export interface FAQSchemaProps {
    questions: Array<{
        question: string;
        answer: string;
    }>;
}

export function FAQSchema({ questions }: FAQSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: q.answer
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
