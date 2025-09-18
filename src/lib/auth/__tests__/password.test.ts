/**
 * Test suite for password utility functions
 * Tests password hashing, verification, and validation functionality
 */

import bcrypt from 'bcryptjs';
import {
  hashPassword,
  verifyPassword,
  validatePasswordComplexity,
  generateRandomPassword
} from '../password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password successfully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should create different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should use the correct number of salt rounds', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      // bcrypt hashes start with $2a$10$ where 10 is the salt rounds
      expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/);
    });

    it('should throw error for passwords shorter than minimum length', async () => {
      const shortPassword = '12345'; // 5 characters, minimum is 6

      await expect(hashPassword(shortPassword)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should throw error for null/undefined password', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
      await expect(hashPassword(undefined as any)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should handle password exactly at minimum length', async () => {
      const minLengthPassword = '123456'; // exactly 6 characters
      const hashedPassword = await hashPassword(minLengthPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hashedPassword = await hashPassword(longPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'test@#$%^&*()_+{}|:"<>?[]\\;\',./-=`~';
      const hashedPassword = await hashPassword(specialPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'testpassword123';
      const wrongPassword = 'wrongpassword123';
      const hashedPassword = await hashPassword(correctPassword);

      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hashedPassword = await hashPassword('testpassword123');

      const isValid = await verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await verifyPassword('testpassword123', '');
      expect(isValid).toBe(false);
    });

    it('should return false for null/undefined inputs', async () => {
      const hashedPassword = await hashPassword('testpassword123');

      expect(await verifyPassword(null as any, hashedPassword)).toBe(false);
      expect(await verifyPassword(undefined as any, hashedPassword)).toBe(false);
      expect(await verifyPassword('testpassword123', null as any)).toBe(false);
      expect(await verifyPassword('testpassword123', undefined as any)).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await verifyPassword('testpassword123', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    it('should handle case sensitivity correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      expect(await verifyPassword(password, hashedPassword)).toBe(true);
      expect(await verifyPassword('testpassword123', hashedPassword)).toBe(false);
      expect(await verifyPassword('TESTPASSWORD123', hashedPassword)).toBe(false);
    });

    it('should verify passwords with special characters', async () => {
      const password = 'test@#$%^&*()_+';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('validatePasswordComplexity', () => {
    it('should validate password with minimum length', () => {
      const result = validatePasswordComplexity('123456');

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject password shorter than minimum length', () => {
      const result = validatePasswordComplexity('12345');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Şifre en az 6 karakter olmalı');
    });

    it('should reject empty password', () => {
      const result = validatePasswordComplexity('');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Şifre gerekli');
    });

    it('should reject null/undefined password', () => {
      expect(validatePasswordComplexity(null as any)).toEqual({
        isValid: false,
        message: 'Şifre gerekli'
      });

      expect(validatePasswordComplexity(undefined as any)).toEqual({
        isValid: false,
        message: 'Şifre gerekli'
      });
    });

    it('should validate long passwords', () => {
      const longPassword = 'a'.repeat(100);
      const result = validatePasswordComplexity(longPassword);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should validate passwords with special characters', () => {
      const result = validatePasswordComplexity('test@#$%^&*()');

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should validate passwords with mixed case and numbers', () => {
      const result = validatePasswordComplexity('TestPassword123');

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should validate simple passwords (following project motto)', () => {
      // The implementation follows the "keep it simple" motto
      // and only validates minimum length
      const result = validatePasswordComplexity('simple');

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should handle whitespace-only passwords', () => {
      const result = validatePasswordComplexity('      ');

      expect(result.isValid).toBe(true); // 6+ characters, even if whitespace
      expect(result.message).toBeUndefined();
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with default length', () => {
      const password = generateRandomPassword();

      expect(password).toBeDefined();
      expect(typeof password).toBe('string');
      expect(password.length).toBe(12); // default length
    });

    it('should generate password with specified length', () => {
      const lengths = [6, 8, 16, 20, 32];

      lengths.forEach(length => {
        const password = generateRandomPassword(length);
        expect(password.length).toBe(length);
      });
    });

    it('should generate different passwords on each call', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();

      expect(password1).not.toBe(password2);
    });

    it('should only contain valid characters', () => {
      const password = generateRandomPassword(100);
      const validCharset = /^[a-zA-Z0-9!@#$%^&*]+$/;

      expect(password).toMatch(validCharset);
    });

    it('should handle edge case of length 0', () => {
      const password = generateRandomPassword(0);
      expect(password).toBe('');
    });

    it('should handle length 1', () => {
      const password = generateRandomPassword(1);
      expect(password.length).toBe(1);
    });

    it('should generate password meeting minimum complexity', () => {
      const password = generateRandomPassword();
      const validation = validatePasswordComplexity(password);

      expect(validation.isValid).toBe(true);
    });

    it('should be able to hash generated passwords', async () => {
      const password = generateRandomPassword();
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(await verifyPassword(password, hashedPassword)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete password lifecycle', async () => {
      // Generate -> Validate -> Hash -> Verify
      const password = generateRandomPassword(10);

      // Validate
      const validation = validatePasswordComplexity(password);
      expect(validation.isValid).toBe(true);

      // Hash
      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();

      // Verify
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      // Verify wrong password fails
      const wrongPassword = generateRandomPassword(10);
      const isWrongValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isWrongValid).toBe(false);
    });

    it('should maintain security with concurrent operations', async () => {
      const password = 'testpassword123';

      // Create multiple hash operations concurrently
      const hashPromises = Array.from({ length: 5 }, () => hashPassword(password));
      const hashes = await Promise.all(hashPromises);

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);

      // All hashes should verify correctly
      const verifyPromises = hashes.map(hash => verifyPassword(password, hash));
      const results = await Promise.all(verifyPromises);

      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should handle Turkish characters in passwords', async () => {
      const turkishPassword = 'şifrem123çğıöü';

      // Should validate
      const validation = validatePasswordComplexity(turkishPassword);
      expect(validation.isValid).toBe(true);

      // Should hash and verify correctly
      const hashedPassword = await hashPassword(turkishPassword);
      const isValid = await verifyPassword(turkishPassword, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should use secure salt rounds configuration', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      // Extract salt rounds from bcrypt hash
      const saltRounds = parseInt(hashedPassword.split('$')[2]);
      expect(saltRounds).toBe(10); // Security requirement
    });

    it('should be resistant to timing attacks', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      // Measure verification time for correct password
      const start1 = Date.now();
      await verifyPassword(password, hashedPassword);
      const time1 = Date.now() - start1;

      // Measure verification time for incorrect password
      const start2 = Date.now();
      await verifyPassword('wrongpassword123', hashedPassword);
      const time2 = Date.now() - start2;

      // Times should be similar (bcrypt is designed to be constant-time)
      // Allow for some variance due to system load
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(50); // 50ms tolerance
    });

    it('should handle hash corruption gracefully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      // Corrupt the hash
      const corruptedHash = hashedPassword.slice(0, -5) + 'xxxxx';

      // Should return false, not throw error
      const isValid = await verifyPassword(password, corruptedHash);
      expect(isValid).toBe(false);
    });

    it('should not leak information through error messages', async () => {
      // All invalid inputs should throw the same error message
      const invalidPasswords = ['', '123', '12345', null, undefined];

      for (const invalidPassword of invalidPasswords) {
        try {
          await hashPassword(invalidPassword as any);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toBe('Password must be at least 6 characters');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle bcrypt errors gracefully', async () => {
      // Mock bcrypt to throw an error
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Bcrypt error'));

      await expect(hashPassword('testpassword123')).rejects.toThrow('Bcrypt error');

      // Restore original function
      bcrypt.hash = originalHash;
    });

    it('should handle verification errors gracefully', async () => {
      // Mock bcrypt to throw an error
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Bcrypt compare error'));

      await expect(verifyPassword('test', 'hash')).rejects.toThrow('Bcrypt compare error');

      // Restore original function
      bcrypt.compare = originalCompare;
    });
  });
});