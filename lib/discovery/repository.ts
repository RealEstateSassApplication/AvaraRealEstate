import 'server-only';
import { contentSchema, defaultContent, type DiscoveryContent } from './schema';

type DraftRow = { revision: number; content: unknown };
type PublicRow = { revision: number; content: unknown; published_at: string };
type HistoryRow = { revision: number; action: 'save'|'publish'; created_at: string };
export type CMSState = { draft: DiscoveryContent; revision: number; publishedRevision: number | null; publishedAt: string | null; history: HistoryRow[] };

export class CMSFailure extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function credentials(admin: boolean) {
  const raw = process.env.SUPABASE_URL?.trim();
  const key = (admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY)?.trim();
  if (!raw || !key) throw new CMSFailure(503, 'Discovery CMS is not configured.');
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) {
    throw new CMSFailure(503, 'Discovery CMS URL is invalid.');
  }
  return {url: url.origin, key};
}

async function request<T>(path: string, admin: boolean, init?: RequestInit): Promise<T> {
  const {url,key} = credentials(admin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url + '/rest/v1/' + path, {
      ...init, cache: 'no-store', signal: controller.signal,
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 409) throw new CMSFailure(409, 'Content changed in another session. Reload before saving.');
      throw new CMSFailure(503, 'Discovery CMS storage is unavailable.');
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof CMSFailure) throw error;
    throw new CMSFailure(503, 'Discovery CMS storage is unavailable.');
  } finally { clearTimeout(timer); }
}

export async function getPublicContent(): Promise<DiscoveryContent> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return defaultContent;
  try {
    const rows = await request<PublicRow[]>('discovery_cms_published?key=eq.site&select=content,revision,published_at', false);
    if (!rows.length) return defaultContent;
    return contentSchema.parse(rows[0].content);
  } catch {
    // Only bundled public editorial content may be used as a fallback, never drafts.
    console.warn('Discovery public content unavailable; serving bundled baseline.');
    return defaultContent;
  }
}

export async function getCMSState(): Promise<CMSState> {
  const [draft, published, history] = await Promise.all([
    request<DraftRow[]>('discovery_cms_draft?key=eq.site&select=revision,content', true),
    request<PublicRow[]>('discovery_cms_published?key=eq.site&select=revision,content,published_at', true),
    request<HistoryRow[]>('discovery_cms_revisions?key=eq.site&select=revision,action,created_at&order=revision.desc&limit=20', true),
  ]);
  return {
    draft: draft.length ? contentSchema.parse(draft[0].content) : defaultContent,
    revision: draft[0]?.revision ?? 0,
    publishedRevision: published[0]?.revision ?? null,
    publishedAt: published[0]?.published_at ?? null,
    history,
  };
}

export async function saveDraft(expectedRevision: number, content: DiscoveryContent, actor: string) {
  return request<number>('rpc/discovery_cms_mutate', true, { method: 'POST', body: JSON.stringify({ p_action:'save', p_expected:expectedRevision, p_content:content, p_actor:actor }) });
}
export async function publishDraft(expectedRevision: number, actor: string) {
  return request<number>('rpc/discovery_cms_mutate', true, { method: 'POST', body: JSON.stringify({ p_action:'publish', p_expected:expectedRevision, p_content:null, p_actor:actor }) });
}
