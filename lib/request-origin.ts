import type {NextRequest} from 'next/server';
// Reject browser cross-origin mutations; non-browser API clients may omit Origin.
// Allow explicit configured canonical origins for trusted reverse proxies.
export function isTrustedMutation(request: NextRequest): boolean {
 const fetchSite=request.headers.get('sec-fetch-site');
 if(fetchSite==='cross-site')return false;
 const origin=request.headers.get('origin');
 if(!origin)return fetchSite!=='same-site';
 const allowed=new Set<string>([request.nextUrl.origin]);
 for(const value of [process.env.NEXT_PUBLIC_BASE_URL,process.env.NEXT_PUBLIC_APP_URL]){if(value){try{allowed.add(new URL(value).origin);}catch{}}}
 return allowed.has(origin);
}
