import crypto from 'crypto';
import { assertSafeUploadKey, requireEnv } from '@/lib/security';

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    '%' + char.charCodeAt(0).toString(16).toUpperCase()
  );
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function getConfig() {
  const bucket = requireEnv('S3_BUCKET');
  const region = requireEnv('S3_REGION');
  const accessKeyId = requireEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('S3_SECRET_ACCESS_KEY');
  return { bucket, region, accessKeyId, secretAccessKey };
}

function objectHost(bucket: string, region: string) {
  return `${bucket}.s3.${region}.amazonaws.com`;
}

function canonicalObjectPath(key: string) {
  const safeKey = assertSafeUploadKey(key);
  return '/' + safeKey.split('/').map(encodeRfc3986).join('/');
}

export async function generateSignedUrl(
  key: string,
  _contentType: string,
  expiresSeconds = 300
): Promise<string> {
  const { bucket, region, accessKeyId, secretAccessKey } = getConfig();
  const host = objectHost(bucket, region);
  const canonicalUri = canonicalObjectPath(key);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|.d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(Math.min(900, Math.max(60, expiresSeconds))),
    'X-Amz-SignedHeaders': 'host',
  };

  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((name) => `${encodeRfc3986(name)}=${encodeRfc3986(query[name])}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

export function getPublicUrl(key: string): string {
  const { bucket, region } = getConfig();
  const safeKey = assertSafeUploadKey(key);
  const customBase = process.env.S3_PUBLIC_BASE_URL?.trim();

  if (customBase) {
    return `${customBase.replace(/\/$/, '')}/${safeKey.split('/').map(encodeRfc3986).join('/')}`;
  }

  return `https://${objectHost(bucket, region)}/${safeKey
    .split('/')
    .map(encodeRfc3986)
    .join('/')}`;
}

// Server-side upload/delete helpers were previously backed by the deprecated
// aws-sdk v2 package, which is not installed by this project. Uploads now go
// directly from the browser to S3 through presigned URLs.
export async function uploadFile(): Promise<never> {
  throw new Error('Use generateSignedUrl for direct-to-S3 uploads');
}

export async function deleteFile(): Promise<never> {
  throw new Error('S3 deletion is not implemented in this client; use a dedicated storage service');
}
