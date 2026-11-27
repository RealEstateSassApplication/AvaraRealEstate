import type {MetadataRoute} from 'next';import {publicBase} from '@/lib/discovery/collections';
const privatePaths=['/workspace','/admin','/host','/user','/api/','/auth','/dashboard','/owner','/favorites','/messages','/request-property','/rentals/my-requests','/rentals/opportunities'];
export default function robots():MetadataRoute.Robots{const allow=['/','/api/agent/properties','/api/agent/openapi.json'];return {rules:[{userAgent:'*',allow,disallow:privatePaths},{userAgent:'OAI-SearchBot',allow,disallow:privatePaths},{userAgent:'GPTBot',disallow:'/'}],sitemap:publicBase()+'/sitemap.xml'};}
