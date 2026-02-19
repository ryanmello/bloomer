import { describe, it, expect, vi } from 'vitest';

// Mock external dependencies before importing
vi.mock('resend', () => ({
  Resend: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    automation: { update: vi.fn() },
    campaign: { update: vi.fn() },
    campaignRecipient: { updateMany: vi.fn() },
  },
}));

import { replaceMergeTags, MERGE_TAGS } from './resend-email';

describe('Ticket 2: Email Integration', () => {
  describe('MERGE_TAGS', () => {
    it('should export supported merge tags', () => {
      expect(MERGE_TAGS).toContain('{{firstName}}');
      expect(MERGE_TAGS).toContain('{{lastName}}');
      expect(MERGE_TAGS).toContain('{{email}}');
      expect(MERGE_TAGS).toContain('{{shopName}}');
    });
  });

  describe('replaceMergeTags', () => {
    it('should replace {{firstName}} with provided value', () => {
      const result = replaceMergeTags('Hello {{firstName}}!', { firstName: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    it('should replace {{lastName}} with provided value', () => {
      const result = replaceMergeTags('Dear {{firstName}} {{lastName}}', {
        firstName: 'Alice',
        lastName: 'Smith',
      });
      expect(result).toBe('Dear Alice Smith');
    });

    it('should replace {{shopName}} with provided value', () => {
      const result = replaceMergeTags('Welcome to {{shopName}}!', { shopName: 'Bloomer Flowers' });
      expect(result).toBe('Welcome to Bloomer Flowers!');
    });

    it('should replace {{email}} with provided value', () => {
      const result = replaceMergeTags('Your email: {{email}}', { email: 'alice@example.com' });
      expect(result).toBe('Your email: alice@example.com');
    });

    it('should replace all merge tags in a single string', () => {
      const template = 'Hi {{firstName}} {{lastName}}, welcome to {{shopName}}! Contact: {{email}}';
      const result = replaceMergeTags(template, {
        firstName: 'Alice',
        lastName: 'Smith',
        shopName: 'Bloomer Flowers',
        email: 'alice@example.com',
      });
      expect(result).toBe('Hi Alice Smith, welcome to Bloomer Flowers! Contact: alice@example.com');
    });

    it('should use fallback "Customer" when firstName is missing', () => {
      const result = replaceMergeTags('Hello {{firstName}}!', {});
      expect(result).toBe('Hello Customer!');
    });

    it('should use fallback "Our Shop" when shopName is missing', () => {
      const result = replaceMergeTags('Welcome to {{shopName}}!', {});
      expect(result).toBe('Welcome to Our Shop!');
    });

    it('should use empty string for missing lastName and email', () => {
      const result = replaceMergeTags('Name: {{lastName}}, Email: {{email}}', {});
      expect(result).toBe('Name: , Email: ');
    });

    it('should handle multiple occurrences of the same tag', () => {
      const result = replaceMergeTags('{{firstName}} loves {{firstName}}', { firstName: 'Alice' });
      expect(result).toBe('Alice loves Alice');
    });

    it('should handle HTML content with merge tags', () => {
      const html = '<h1>Hello {{firstName}}!</h1><p>From {{shopName}}</p>';
      const result = replaceMergeTags(html, { firstName: 'Alice', shopName: 'Bloomer' });
      expect(result).toBe('<h1>Hello Alice!</h1><p>From Bloomer</p>');
    });
  });
});
