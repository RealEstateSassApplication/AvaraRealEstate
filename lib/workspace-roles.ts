export type WorkspaceRole='customer'|'manager'|'admin';
export function rolesFor(user:{role?:unknown;roles?:unknown}){const arr=Array.isArray(user.roles)?user.roles.filter((r):r is string=>typeof r==='string'):[];return Array.from(new Set([...arr,...(typeof user.role==='string'?[user.role]:[])]));}
export function workspaces(user:{role?:unknown;roles?:unknown}):WorkspaceRole[]{const r=rolesFor(user);return ['customer',...(r.includes('host')?['manager' as const]:[]),...(r.some(x=>['admin','super-admin'].includes(x))?['admin' as const]:[])];}
export function preferredWorkspace(user:{role?:unknown;roles?:unknown}):WorkspaceRole{const roles=workspaces(user);return roles.includes('admin')?'admin':roles.includes('manager')?'manager':'customer';}
