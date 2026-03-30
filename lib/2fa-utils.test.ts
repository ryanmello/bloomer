import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSecret,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
  normalizeBackupCode,
} from './2fa-utils';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'test-encryption-key-for-vitest');
});

describe('2fa-utils', () => {
  describe('generateSecret', () => {
    it('should return a non-empty string', () => {
      const secret = generateSecret();
      expect(secret).toBeTruthy();
      expect(typeof secret).toBe('string');
    });

    it('should produce unique secrets on each call', () => {
      const s1 = generateSecret();
      const s2 = generateSecret();
      expect(s1).not.toBe(s2);
    });
  });

  describe('verifyTOTP', () => {
    it('should return false for an invalid token', () => {
      const secret = generateSecret();
      expect(verifyTOTP(secret, '000000')).toBe(false);
    });

    it('should return false gracefully on error', () => {
      expect(verifyTOTP('', '')).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the requested number of codes', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('should default to 5 codes', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(5);
    });

    it('should format codes as XXXX-XXXX-XXXX', () => {
      const codes = generateBackupCodes(3);
      for (const code of codes) {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
      }
    });

    it('should generate unique codes', () => {
      const codes = generateBackupCodes(10);
      const unique = new Set(codes);
      expect(unique.size).toBe(10);
    });
  });

  describe('hashBackupCodes / verifyBackupCode', () => {
    it('should hash codes and verify the originals against them', async () => {
      const codes = generateBackupCodes(3);
      const hashed = await hashBackupCodes(codes);

      expect(hashed).toHaveLength(3);
      for (const h of hashed) {
        expect(h).toMatch(/^\$2[aby]\$/);
      }

      const result = await verifyBackupCode(codes[1], hashed);
      expect(result).toEqual({ valid: true, index: 1 });
    });

    it('should reject an incorrect code', async () => {
      const codes = generateBackupCodes(2);
      const hashed = await hashBackupCodes(codes);

      const result = await verifyBackupCode('XXXX-XXXX-XXXX', hashed);
      expect(result).toEqual({ valid: false, index: -1 });
    });
  });

  describe('encryptSecret / decryptSecret', () => {
    it('should round-trip encrypt and decrypt a secret', () => {
      const original = 'MY_TOTP_SECRET_ABC123';
      const encrypted = encryptSecret(original);

      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(':');

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertexts for the same input (random IV)', () => {
      const original = 'SAME_SECRET';
      const e1 = encryptSecret(original);
      const e2 = encryptSecret(original);
      expect(e1).not.toBe(e2);
    });

    it('should throw when no encryption key is available', () => {
      vi.stubEnv('AUTH_SECRET', '');
      vi.stubEnv('NEXTAUTH_SECRET', '');
      vi.stubEnv('ENCRYPTION_KEY', '');

      expect(() => encryptSecret('secret')).toThrow('Encryption key not found');
    });

    it('should throw for malformed encrypted input', () => {
      expect(() => decryptSecret('not-valid-format')).toThrow();
    });
  });

  describe('normalizeBackupCode', () => {
    it('should strip hyphens and uppercase', () => {
      expect(normalizeBackupCode('abcd-ef12-3456')).toBe('ABCDEF123456');
    });

    it('should handle already normalized input', () => {
      expect(normalizeBackupCode('ABCDEF123456')).toBe('ABCDEF123456');
    });
  });
});
