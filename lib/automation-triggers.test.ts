import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const model = () => ({ findUnique: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn() });
  return { customer: model(), audience: model(), automationRun: model() };
});

vi.mock('@/lib/prisma', () => ({ default: mockDb }));

import {
  getCustomersForBirthdayTrigger,
  getCustomersForInactiveTrigger,
  getCustomersForNewCustomerTrigger,
  getCustomersForHolidayTrigger,
  filterByAudience,
  getAlreadySentCustomerIds,
  isHolidayTriggerDay,
} from './automation-triggers';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('automation-triggers', () => {
  const customers = [
    { id: 'c1', firstName: 'Alice', lastName: 'A', email: 'alice@test.com' },
    { id: 'c2', firstName: 'Bob', lastName: 'B', email: 'bob@test.com' },
  ];

  describe('getCustomersForBirthdayTrigger', () => {
    it('should query customers by birth month/day offset from today', async () => {
      mockDb.customer.findMany.mockResolvedValue(customers);

      const result = await getCustomersForBirthdayTrigger('shop-1', 7);

      expect(mockDb.customer.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          shopId: 'shop-1',
          birthMonth: expect.any(Number),
          birthDay: expect.any(Number),
        }),
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      expect(result).toEqual(customers);
    });
  });

  describe('getCustomersForInactiveTrigger', () => {
    it('should query customers inactive for N days', async () => {
      mockDb.customer.findMany.mockResolvedValue(customers);

      const result = await getCustomersForInactiveTrigger('shop-1', 30);

      expect(mockDb.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ shopId: 'shop-1' }),
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      );
      expect(result).toEqual(customers);
    });
  });

  describe('getCustomersForNewCustomerTrigger', () => {
    it('should query customers created N days ago', async () => {
      mockDb.customer.findMany.mockResolvedValue(customers);

      const result = await getCustomersForNewCustomerTrigger('shop-1', 1);

      expect(mockDb.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shopId: 'shop-1',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
      expect(result).toEqual(customers);
    });
  });

  describe('getCustomersForHolidayTrigger', () => {
    it('should return all shop customers when today is the trigger day', async () => {
      const today = new Date();
      const targetMonth = today.getMonth() + 1;
      const targetDay = today.getDate();

      mockDb.customer.findMany.mockResolvedValue(customers);

      const result = await getCustomersForHolidayTrigger('shop-1', targetMonth, targetDay, 0);

      expect(result).toEqual(customers);
    });

    it('should return empty array when today is not the trigger day', async () => {
      const result = await getCustomersForHolidayTrigger('shop-1', 1, 1, 0);

      const today = new Date();
      if (today.getMonth() + 1 !== 1 || today.getDate() !== 1) {
        expect(result).toEqual([]);
        expect(mockDb.customer.findMany).not.toHaveBeenCalled();
      }
    });
  });

  describe('filterByAudience', () => {
    it('should return all customers when audienceId is null', async () => {
      const result = await filterByAudience(customers, null);
      expect(result).toEqual(customers);
    });

    it('should filter to only customers in the audience', async () => {
      mockDb.audience.findUnique.mockResolvedValue({
        id: 'aud-1',
        customerIds: ['c1'],
      });

      const result = await filterByAudience(customers, 'aud-1');

      expect(result).toEqual([customers[0]]);
    });

    it('should return all customers when audience is not found', async () => {
      mockDb.audience.findUnique.mockResolvedValue(null);

      const result = await filterByAudience(customers, 'nonexistent');

      expect(result).toEqual(customers);
    });
  });

  describe('getAlreadySentCustomerIds', () => {
    it('should return set of customer ids from past runs', async () => {
      mockDb.automationRun.findMany.mockResolvedValue([
        { customerId: 'c1' },
        { customerId: 'c2' },
      ]);

      const result = await getAlreadySentCustomerIds('auto-1', 'birthday');

      expect(result).toBeInstanceOf(Set);
      expect(result.has('c1')).toBe(true);
      expect(result.has('c2')).toBe(true);
    });

    it('should use different time windows for different trigger types', async () => {
      mockDb.automationRun.findMany.mockResolvedValue([]);

      await getAlreadySentCustomerIds('auto-1', 'new_customer');

      const call = mockDb.automationRun.findMany.mock.calls[0][0];
      const sinceDate = call.where.createdAt.gte as Date;
      expect(sinceDate.getTime()).toBe(0);
    });
  });

  describe('isHolidayTriggerDay', () => {
    it('should return true when today matches the computed trigger date', () => {
      const today = new Date();
      const targetMonth = today.getMonth() + 1;
      const targetDay = today.getDate();

      expect(isHolidayTriggerDay(targetMonth, targetDay, 0)).toBe(true);
    });

    it('should return true for daysBefore offset from a future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const targetMonth = future.getMonth() + 1;
      const targetDay = future.getDate();

      expect(isHolidayTriggerDay(targetMonth, targetDay, 5)).toBe(true);
    });

    it('should return false when today does not match', () => {
      const today = new Date();
      const otherMonth = ((today.getMonth() + 5) % 12) + 1;
      expect(isHolidayTriggerDay(otherMonth, 15, 0)).toBe(false);
    });
  });
});
