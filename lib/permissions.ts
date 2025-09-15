import { IUser } from '@/models/User';

export function getRoles(user?: Partial<IUser> | null): string[] {
  if (!user) return [];
  if (Array.isArray((user as any).roles)) return (user as any).roles;
  if ((user as any).role) return [(user as any).role];
  return [];
}

export function hasRole(user: Partial<IUser> | null | undefined, role: string) {
  return getRoles(user).includes(role);
}

export function hasAnyRole(user: Partial<IUser> | null | undefined, roles: string[]) {
  const r = getRoles(user);
  return roles.some(role => r.includes(role));
}
