import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import dbConnect from './db';
import User, { IUser } from '@/models/User';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const placeholder = !secret ||
    secret === 'your-secret-key' ||
    secret.includes('change-this-in-production') ||
    secret.startsWith('your-');
  if (placeholder || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with a non-placeholder value of at least 32 characters');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest): Promise<IUser | null> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies?.get?.('token')?.value || null;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-passwordHash');
    return user as IUser | null;
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<IUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(request: NextRequest, roles: string[]): Promise<IUser> {
  const user = await requireAuth(request);
  const userRolesRaw = Array.isArray((user as any).roles)
    ? (user as any).roles
    : ((user as any).role ? [(user as any).role] : []);
  const userRoles = userRolesRaw.map((x: any) => String(x));
  const allowed = roles.map(String).some((role) => userRoles.includes(role));
  if (!allowed) throw new Error('Insufficient permissions');
  return user;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export default async function getUserFromReq(req: any) {
  try {
    const cookieHeader = req.headers?.get ? req.headers.get('cookie') : req.headers?.cookie;
    let token: string | null = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|; )token=([^;]+)/);
      token = match ? match[1] : null;
    }
    if (!token && req.headers) {
      const auth = req.headers.get ? req.headers.get('authorization') : req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) token = auth.replace('Bearer ', '');
    }
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    await dbConnect();
    const user = await User.findById(decoded.userId).select('-passwordHash');
    return user as IUser | null;
  } catch {
    return null;
  }
}
