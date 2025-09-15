import fs from 'fs';
import path from 'path';

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  }
}

export function generateUploadKey(fileName: string) {
  const key = `properties/${Date.now()}-${fileName}`;
  return key;
}

export function getPublicUrl(key: string) {
  // key like properties/123-file.jpg -> public/uploads/properties/123-file.jpg
  return `/uploads/${key}`;
}

export async function saveFile(key: string, buffer: Buffer) {
  ensureUploadsDir();
  const filePath = path.join(PUBLIC_UPLOADS_DIR, key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // convert Buffer to Uint8Array for compatibility with fs.promises.writeFile typing
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  await fs.promises.writeFile(filePath, data as any);
  return getPublicUrl(key);
}

export async function deleteFile(key: string) {
  const filePath = path.join(PUBLIC_UPLOADS_DIR, key);
  if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
}

const storage = {
  generateUploadKey,
  getPublicUrl,
  saveFile,
  deleteFile,
};

export default storage;
