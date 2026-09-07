import crypto from 'crypto';
import path from 'path';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '' || value.startsWith('your-')) {
    throw new Error(`${name} is not configured`);
  }
  return value.trim();
}

export function assertImageUpload(contentType: string | null, size: number) {
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType.toLowerCase())) {
    throw new Error('Unsupported file type');
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    throw new Error('File must be between 1 byte and 10 MB');
  }
}

export function sanitizeFileName(fileName: string): string {
  const base = path.posix.basename(fileName.replace(/\\/g, '/'));
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  if (!safe || safe === '.' || safe === '..') throw new Error('Invalid file name');
  return safe.slice(0, 160);
}

export function assertSafeUploadKey(key: string): string {
  const normalized = path.posix.normalize(key.replace(/\\/g, '/'));
  if (
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.startsWith('/') ||
    !normalized.startsWith('properties/')
  ) {
    throw new Error('Invalid upload path');
  }
  return normalized;
}

export function verifyPayHereSignature(params: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  signature: string;
}) {
  const secret = requireEnv('PAYHERE_SECRET');
  const configuredMerchantId = requireEnv('PAYHERE_MERCHANT_ID');
  if (params.merchantId !== configuredMerchantId) return false;

  const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
  const localSignature = crypto
    .createHash('md5')
    .update(
      `${params.merchantId}${params.orderId}${params.amount}${params.currency}${params.statusCode}${secretHash}`
    )
    .digest('hex')
    .toUpperCase();

  const received = params.signature.toUpperCase();
  if (received.length !== localSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(localSignature));
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}
