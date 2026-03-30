import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockGetCurrentUser } = vi.hoisted(() => {
  const fn = vi.fn;
  const model = () => ({ findUnique: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn() });
  return {
    mockDb: { coupon: model() },
    mockGetCurrentUser: fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ default: mockDb }));
vi.mock('@/actions/getCurrentUser', () => ({ getCurrentUser: mockGetCurrentUser }));

import { createCoupon, getUserCoupons, updateCoupon, deleteCoupon } from './getCoupons';

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('coupon actions', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };

  describe('createCoupon', () => {
    it('should return error when user is not logged in', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await createCoupon(makeFormData({
        codeName: 'SAVE10',
        discount: '10',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'You must be logged in to create coupons' });
    });

    it('should return error when required fields are missing', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await createCoupon(makeFormData({
        codeName: '',
        discount: '0',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'All fields are required' });
    });

    it('should return error when discount is out of range', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await createCoupon(makeFormData({
        codeName: 'BAD',
        discount: '150',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'Discount must be between 0 and 100' });
    });

    it('should return error when coupon code already exists', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue({ id: 'existing' });

      const result = await createCoupon(makeFormData({
        codeName: 'DUP',
        discount: '10',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'This coupon code already exists' });
    });

    it('should create coupon successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue(null);
      const created = { id: 'coupon-1', codeName: 'SAVE10', discount: 10 };
      mockDb.coupon.create.mockResolvedValue(created);

      const result = await createCoupon(makeFormData({
        codeName: 'SAVE10',
        discount: '10',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ success: true, coupon: created });
      expect(mockDb.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          codeName: 'SAVE10',
          discount: 10,
          userId: 'user-1',
        }),
      });
    });
  });

  describe('getUserCoupons', () => {
    it('should return error when not logged in', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await getUserCoupons();

      expect(result).toEqual({ error: 'You must be logged in' });
    });

    it('should return coupons for the current user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      const coupons = [{ id: 'c1' }, { id: 'c2' }];
      mockDb.coupon.findMany.mockResolvedValue(coupons);

      const result = await getUserCoupons();

      expect(result).toEqual({ success: true, coupons });
      expect(mockDb.coupon.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateCoupon', () => {
    it('should return error when not logged in', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await updateCoupon('c1', makeFormData({
        codeName: 'X',
        discount: '10',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'You must be logged in' });
    });

    it('should return error when coupon belongs to another user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue({ id: 'c1', userId: 'other-user' });

      const result = await updateCoupon('c1', makeFormData({
        codeName: 'X',
        discount: '10',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ error: 'Coupon not found or unauthorized' });
    });

    it('should update coupon when authorized', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue({ id: 'c1', userId: 'user-1' });
      const updated = { id: 'c1', codeName: 'UPDATED' };
      mockDb.coupon.update.mockResolvedValue(updated);

      const result = await updateCoupon('c1', makeFormData({
        codeName: 'UPDATED',
        discount: '20',
        validUntil: '2026-12-31',
      }));

      expect(result).toEqual({ success: true, coupon: updated });
    });
  });

  describe('deleteCoupon', () => {
    it('should return error when not logged in', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await deleteCoupon('c1');

      expect(result).toEqual({ error: 'You must be logged in' });
    });

    it('should return error when coupon belongs to another user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue({ id: 'c1', userId: 'other-user' });

      const result = await deleteCoupon('c1');

      expect(result).toEqual({ error: 'Coupon not found or unauthorized' });
    });

    it('should delete coupon when authorized', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockDb.coupon.findUnique.mockResolvedValue({ id: 'c1', userId: 'user-1' });
      mockDb.coupon.delete.mockResolvedValue({});

      const result = await deleteCoupon('c1');

      expect(result).toEqual({ success: true });
    });
  });
});
