/**
 * Authentication type definitions
 * SIMPLE types for auth system
 */

import type { DefaultSession } from 'next-auth';

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'super_admin' | 'editor';

/**
 * Extended user type with role
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

/**
 * Session type with extended user
 */
export interface Session {
  user: User;
  expires: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Authentication response types
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

/**
 * Permission matrix for roles
 * Defines what each role can do
 */
export const PERMISSIONS = {
  super_admin: {
    users: { create: true, read: true, update: true, delete: true },
    polls: { create: true, read: true, update: true, delete: true },
    news: { create: true, read: true, update: true, delete: true },
    media: { create: true, read: true, update: true, delete: true },
    settings: { create: true, read: true, update: true, delete: true },
    content: { create: true, read: true, update: true, delete: true }
  },
  admin: {
    users: { create: false, read: false, update: false, delete: false },
    polls: { create: true, read: true, update: true, delete: true },
    news: { create: true, read: true, update: true, delete: true },
    media: { create: true, read: true, update: true, delete: true },
    settings: { create: false, read: true, update: true, delete: false },
    content: { create: true, read: true, update: true, delete: true }
  },
  editor: {
    users: { create: false, read: false, update: false, delete: false },
    polls: { create: false, read: true, update: false, delete: false },
    news: { create: true, read: true, update: true, delete: false },
    media: { create: true, read: true, update: false, delete: false },
    settings: { create: false, read: true, update: false, delete: false },
    content: { create: false, read: true, update: true, delete: false }
  }
} as const;

/**
 * Check if a role has permission for an action
 * @param role - The user role
 * @param resource - The resource to access
 * @param action - The action to perform
 * @returns boolean - True if permission granted
 */
export function hasPermission(
  role: UserRole,
  resource: keyof typeof PERMISSIONS.admin,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  return PERMISSIONS[role]?.[resource]?.[action] || false;
}

/**
 * Module augmentation for next-auth types
 * This extends the default session type with our custom fields
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }
}

/**
 * Module augmentation for next-auth/jwt types
 */
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}