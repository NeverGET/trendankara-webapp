/**
 * Password hashing and verification utilities
 * SIMPLE implementation using bcryptjs
 */

import bcrypt from 'bcryptjs';

// Number of salt rounds for bcrypt (10 as per security requirements)
const SALT_ROUNDS = 10;

// Minimum password length
const MIN_PASSWORD_LENGTH = 6;

/**
 * Hash a plaintext password
 * @param password - The plaintext password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - The plaintext password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise<boolean> - True if the password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password complexity
 * SIMPLE validation - just check minimum length
 * @param password - The password to validate
 * @returns Object with isValid and message
 */
export function validatePasswordComplexity(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password) {
    return {
      isValid: false,
      message: 'Şifre gerekli' // Turkish: Password is required
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı` // Turkish: Password must be at least X characters
    };
  }

  // SIMPLE approach - no complex requirements
  // Could add more rules here if needed:
  // - Uppercase letters
  // - Numbers
  // - Special characters
  // But keeping it simple as per project motto

  return {
    isValid: true
  };
}

/**
 * Generate a random password
 * Useful for creating temporary passwords
 * @param length - The length of the password to generate
 * @returns string - A random password
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}