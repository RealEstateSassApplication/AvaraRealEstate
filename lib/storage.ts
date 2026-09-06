import fs from 'fs';
import path from 'path';
import { assertSafeUploadKey, sanitizeFileName } from '@/lib/security';

const PUBLIC_UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  }
}

export function generateUploadKey(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  return `properties/${Date.now()}-${safeName}`;
}

export function getPublicUrl(key: string) {
  const safeKey = assertSafeUploadKey(key);
  return `/uploads/${safeKey}`;
}

function resolveSafeFilePath(key: string) {
  const safeKey = assertSafeUploadKey(key);
  const filePath = path.resolve(PUBLIC_UPLOADS_DIR, safeKey);
  const relative = path.relative(PUBLIC_UPLOADS_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid upload path');
  }
  return { safeKey, filePath };
}

export async function saveFile(key: string, buffer: Buffer) {
  ensureUploadsDir();
  const { safeKey, filePath } = resolveSafeFilePath(key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  await fs.promises.writeFile(filePath, data as any, { flag: 'wx' });
  return getPublicUrl(safeKey);
}

export async function deleteFile(key: string) {
  const { filePath } = resolveSafeFilePath(key);
  if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
}

const storage = {
  generateUploadKey,
  getPublicUrl,
  saveFile,
  deleteFile,
};

export default storage;
