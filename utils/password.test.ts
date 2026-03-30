import { describe, it, expect } from 'vitest';
import { saltAndHashPassword, verifyPassword } from './password';

describe('password utilities', () => {
  describe('saltAndHashPassword', () => {
    it('should return a bcrypt hash string', () => {
      const hash = saltAndHashPassword('mypassword');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should produce different hashes for the same input (unique salts)', () => {
      const hash1 = saltAndHashPassword('mypassword');
      const hash2 = saltAndHashPassword('mypassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for a matching password', () => {
      const hash = saltAndHashPassword('correctpassword');
      expect(verifyPassword('correctpassword', hash)).toBe(true);
    });

    it('should return false for a wrong password', () => {
      const hash = saltAndHashPassword('correctpassword');
      expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });

    it('should handle empty strings', () => {
      const hash = saltAndHashPassword('');
      expect(verifyPassword('', hash)).toBe(true);
      expect(verifyPassword('notempty', hash)).toBe(false);
    });
  });
});
