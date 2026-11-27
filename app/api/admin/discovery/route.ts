import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { mutationSchema, contentSchema } from '@/lib/discovery/schema';
import { CMSFailure, getCMSState, saveDraft, publishDraft } from '@/lib/discovery/repository';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, private' };
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers }); }
function failure(error: unknown) {
  if (error instanceof CMSFailure) return json({error:error.message}, error.status);
  if (error instanceof Error && error.message === 'Authentication required') return json({error:'Sign in as an administrator.'},401);
  if (error instanceof Error && error.message === 'Insufficient permissions') return json({error:'Administrator access required.'},403);
  console.error('Discovery CMS request failed');
  return json({error:'Discovery CMS is unavailable.'},503);
}
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin','super-admin']);
    return json(await getCMSState());
  } catch (error) { return failure(error); }
}
function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = [request.nextUrl.origin];
  for (const raw of [process.env.NEXT_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    try { if (raw) allowed.push(new URL(raw).origin); } catch { /* ignore invalid config */ }
  }
  return allowed.includes(origin);
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin','super-admin']);
    if (!allowedOrigin(request)) return json({error:'Invalid request origin.'},403);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'JSON required.'},415);
    // Bound the streamed request before decoding; do not trust Content-Length alone.
    const reader = request.body?.getReader();
    if (!reader) return json({error:'JSON required.'},400);
    const decoder = new TextDecoder();
    let raw = '', bytes = 0;
    try {
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 65536) { await reader.cancel(); return json({error:'Content too large.'},413); }
        raw += decoder.decode(value,{stream:true});
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return json({error:'Invalid JSON.'},400); }
    const parsed = mutationSchema.safeParse(input);
    if (!parsed.success) return json({error:'Invalid content.',issues:parsed.error.issues.map(i=>({path:i.path.join('.'),message:i.message}))},400);
    const mutation = parsed.data;
    const actor = String(user._id);
    if (mutation.action === 'save') {
      await saveDraft(mutation.expectedRevision, mutation.content, actor);
    } else {
      const state = await getCMSState();
      if (state.revision !== mutation.expectedRevision) return json({error:'Content changed in another session. Reload before publishing.'},409);
      // Revalidate persisted draft before publication; SQL revision lock prevents races.
      if (!contentSchema.safeParse(state.draft).success) return json({error:'Draft failed validation.'},400);
      await publishDraft(mutation.expectedRevision, actor);
    }
    return json(await getCMSState());
  } catch (error) { return failure(error); }
}
