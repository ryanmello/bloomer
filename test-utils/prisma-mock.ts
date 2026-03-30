import { vi } from 'vitest';

type MockModel = Record<string, ReturnType<typeof vi.fn>>;

function createMockModel(): MockModel {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  };
}

export function createMockPrisma() {
  return {
    user: createMockModel(),
    shop: createMockModel(),
    customer: createMockModel(),
    coupon: createMockModel(),
    campaign: createMockModel(),
    campaignRecipient: createMockModel(),
    automation: createMockModel(),
    automationRun: createMockModel(),
    audience: createMockModel(),
    event: createMockModel(),
    form: createMockModel(),
    formSubmission: createMockModel(),
    product: createMockModel(),
    order: createMockModel(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
