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

export function OrganizationSchema({name='Avara',url='https://avara.lk',logo,description='Property discovery and planning tools for Sri Lanka.',address,contactPoint}:OrganizationSchemaProps) {
 const schema={'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':url.replace(/\/$/,'')+'/#organization',name,url,description,logo,address:address?{'@type':'PostalAddress',addressLocality:address.city,addressCountry:address.country}:undefined,contactPoint:contactPoint?{'@type':'ContactPoint',telephone:contactPoint.telephone,email:contactPoint.email}:undefined,areaServed:{'@type':'Country',name:'Sri Lanka'}},
 {'@type':'WebSite','@id':url.replace(/\/$/,'')+'/#website',name,url,inLanguage:'en-LK',publisher:{'@id':url.replace(/\/$/,'')+'/#organization'}}
 ]};
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>;
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
    period?: string;
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
    datePosted,period
}: RealEstateListingSchemaProps) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name,
        description,
        url,
        image,
        datePosted,
        offers: {
            '@type': 'Offer',
            price,
            priceCurrency,
            url,
            ...(purpose!=='sale'&&period?{priceSpecification:{'@type':'UnitPriceSpecification',price,priceCurrency,unitText:period}}:{})
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: address.street || '',
            addressLocality: address.city,
            addressRegion: address.district,
            addressCountry: address.country || 'Sri Lanka'
        },
        mainEntity: {
                '@type': propertyType === 'apartment' ? 'Apartment' : propertyType === 'house' ? 'House' : propertyType === 'land' ? 'Place' : 'Accommodation',
                address:{'@type':'PostalAddress',addressLocality:address.city,addressRegion:address.district,addressCountry:address.country||'Sri Lanka'},
                name,
                numberOfBedrooms: bedrooms,
                numberOfBathroomsTotal: bathrooms,
                floorSize: floorSize ? {
                    '@type': 'QuantitativeValue',
                    value: floorSize,
                    unitCode: 'FTK' // Square feet
                } : undefined
            }
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
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
            name: 'Avara'
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
    );
}
