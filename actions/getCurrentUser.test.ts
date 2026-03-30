import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const model = () => ({ findUnique: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn() });
  return {
    mockDb: { user: model() },
    mockAuth: fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ default: mockDb }));
vi.mock('@/auth', () => ({ auth: mockAuth }));

import { getCurrentUser } from './getCurrentUser';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCurrentUser', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  it('should return user when session exists and user is found', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    const result = await getCurrentUser();

    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(result).toEqual(mockUser);
  });

  it('should return null when there is no session', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return null when session has no email', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it('should return null when user is not in the database', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'gone@example.com' } });
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it('should return null when auth throws', async () => {
    mockAuth.mockRejectedValue(new Error('Session expired'));

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });
});
