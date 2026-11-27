import type {MetadataRoute} from 'next';
const BASE_URL=process.env.NEXT_PUBLIC_BASE_URL||'https://avara.lk';
// Search crawlers may discover public pages; authenticated routes remain access-controlled.
const privatePaths=['/admin','/host','/user','/api','/auth','/dashboard','/owner','/favorites','/messages','/request-property','/rentals/my-requests','/rentals/opportunities'];
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:'/',disallow:privatePaths},{userAgent:'OAI-SearchBot',allow:'/',disallow:privatePaths}],sitemap:new URL('/sitemap.xml',BASE_URL).toString()};}
