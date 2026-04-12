import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockedSendEmail, mockedTriggers } = vi.hoisted(() => {
  const fn = vi.fn;
  const model = () => ({ findUnique: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn(), updateMany: fn() });
  return {
    mockDb: { shop: model(), automation: model(), automationRun: model(), campaignRecipient: model() },
    mockedSendEmail: fn(),
    mockedTriggers: {
      getCustomersForBirthdayTrigger: fn(),
      getCustomersForInactiveTrigger: fn(),
      getCustomersForNewCustomerTrigger: fn(),
      getCustomersForHolidayTrigger: fn(),
      filterByAudience: fn(),
      getAlreadySentCustomerIds: fn(),
      isHolidayTriggerDay: fn(),
    },
  };
});

vi.mock('@/lib/prisma', () => ({ default: mockDb }));
vi.mock('@/lib/resend-email', () => ({ sendAutomationEmail: mockedSendEmail }));
vi.mock('@/lib/automation-triggers', () => mockedTriggers);

import { processAutomationsForShop, processAllAutomations } from './automation-engine';

const mockedGetBirthday = mockedTriggers.getCustomersForBirthdayTrigger;
const mockedFilterAudience = mockedTriggers.filterByAudience;
const mockedAlreadySent = mockedTriggers.getAlreadySentCustomerIds;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('automation-engine', () => {
  const mockShop = { id: 'shop-1', name: 'Test Shop' };

  const baseAutomation = {
    id: 'auto-1',
    name: 'Birthday Promo',
    triggerType: 'birthday',
    timing: 0,
    actionType: 'email',
    emailSubject: 'Happy Birthday {{firstName}}!',
    emailBody: '<p>Happy birthday!</p>',
    audienceId: null,
    targetDate: null,
    targetMonth: null,
    targetDay: null,
    shopId: 'shop-1',
    status: 'active',
    audience: null,
  };

  const customers = [
    { id: 'c1', firstName: 'Alice', lastName: 'A', email: 'alice@test.com' },
    { id: 'c2', firstName: 'Bob', lastName: 'B', email: 'bob@test.com' },
  ];

  describe('processAutomationsForShop', () => {
    it('should throw when shop is not found', async () => {
      mockDb.shop.findUnique.mockResolvedValue(null);

      await expect(processAutomationsForShop('bad-id')).rejects.toThrow('Shop not found');
    });

    it('should return empty results when no active automations', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([]);

      const result = await processAutomationsForShop('shop-1');

      expect(result.automationsProcessed).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should skip automations without email content', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([
        { ...baseAutomation, emailSubject: null, emailBody: null },
      ]);

      const result = await processAutomationsForShop('shop-1');

      expect(result.results[0].emailsSent).toBe(0);
    });

    it('should process birthday automations in dry-run mode', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([baseAutomation]);
      mockedGetBirthday.mockResolvedValue(customers);
      mockedFilterAudience.mockResolvedValue(customers);
      mockedAlreadySent.mockResolvedValue(new Set());

      const result = await processAutomationsForShop('shop-1', { dryRun: true });

      expect(result.totalEmailsSent).toBe(2);
      expect(result.totalEmailsFailed).toBe(0);
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    it('should skip already-sent customers', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([baseAutomation]);
      mockedGetBirthday.mockResolvedValue(customers);
      mockedFilterAudience.mockResolvedValue(customers);
      mockedAlreadySent.mockResolvedValue(new Set(['c1']));

      const result = await processAutomationsForShop('shop-1', { dryRun: true });

      expect(result.results[0].customersSkipped).toBe(1);
      expect(result.results[0].emailsSent).toBe(1);
    });

    it('should send real emails and log runs when not in dry-run', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([baseAutomation]);
      mockDb.campaignRecipient.findMany.mockResolvedValue([]);
      mockDb.automationRun.findMany.mockResolvedValue([]);
      mockedGetBirthday.mockResolvedValue([customers[0]]);
      mockedFilterAudience.mockResolvedValue([customers[0]]);
      mockedAlreadySent.mockResolvedValue(new Set());
      mockedSendEmail.mockResolvedValue({ success: true, emailId: 'email-1' });
      mockDb.automationRun.create.mockResolvedValue({});

      const result = await processAutomationsForShop('shop-1', { dryRun: false });

      expect(mockedSendEmail).toHaveBeenCalledOnce();
      expect(mockDb.automationRun.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          automationId: 'auto-1',
          customerId: 'c1',
          status: 'sent',
        }),
      });
      expect(result.totalEmailsSent).toBe(1);
    });

    it('should record failures when email send fails', async () => {
      mockDb.shop.findUnique.mockResolvedValue(mockShop);
      mockDb.automation.findMany.mockResolvedValue([baseAutomation]);
      mockDb.campaignRecipient.findMany.mockResolvedValue([]);
      mockDb.automationRun.findMany.mockResolvedValue([]);
      mockedGetBirthday.mockResolvedValue([customers[0]]);
      mockedFilterAudience.mockResolvedValue([customers[0]]);
      mockedAlreadySent.mockResolvedValue(new Set());
      mockedSendEmail.mockResolvedValue({ success: false, error: 'Rate limited' });
      mockDb.automationRun.create.mockResolvedValue({});

      const result = await processAutomationsForShop('shop-1', { dryRun: false });

      expect(result.totalEmailsFailed).toBe(1);
      expect(result.results[0].customers[0].status).toBe('failed');
    });
  });

  describe('processAllAutomations', () => {
    it('should process automations for all shops with active automations', async () => {
      mockDb.shop.findMany.mockResolvedValue([{ id: 'shop-1' }, { id: 'shop-2' }]);
      mockDb.shop.findUnique
        .mockResolvedValueOnce({ id: 'shop-1', name: 'Shop 1' })
        .mockResolvedValueOnce({ id: 'shop-2', name: 'Shop 2' });
      mockDb.automation.findMany.mockResolvedValue([]);

      const results = await processAllAutomations({ dryRun: true });

      expect(results).toHaveLength(2);
    });

    it('should continue processing other shops if one fails', async () => {
      mockDb.shop.findMany.mockResolvedValue([{ id: 'bad' }, { id: 'shop-2' }]);
      mockDb.shop.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'shop-2', name: 'Shop 2' });
      mockDb.automation.findMany.mockResolvedValue([]);

      const results = await processAllAutomations({ dryRun: true });

      expect(results).toHaveLength(1);
    });
  });
});
