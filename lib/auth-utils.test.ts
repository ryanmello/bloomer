import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockedVerifyPw } = vi.hoisted(() => {
  const fn = vi.fn;
  const model = () => ({ findUnique: fn(), findFirst: fn(), findMany: fn(), create: fn(), update: fn(), updateMany: fn(), delete: fn(), deleteMany: fn(), count: fn() });
  return {
    mockDb: { user: model(), shop: model(), customer: model(), coupon: model() },
    mockedVerifyPw: fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ default: mockDb }));
vi.mock('@/utils/password', () => ({ verifyPassword: mockedVerifyPw }));

import { getUserFromDb, createUser, userExists } from './auth-utils';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth-utils', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('getUserFromDb', () => {
    it('should return user when email and password match', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockedVerifyPw.mockReturnValue(true);

      const result = await getUserFromDb('test@example.com', 'password123');

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockedVerifyPw).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await getUserFromDb('nobody@example.com', 'password');

      expect(result).toBeNull();
      expect(mockedVerifyPw).not.toHaveBeenCalled();
    });

    it('should return null when user has no password set', async () => {
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, password: null });

      const result = await getUserFromDb('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockedVerifyPw.mockReturnValue(false);

      const result = await getUserFromDb('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null and not throw when db throws', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('DB down'));

      const result = await getUserFromDb('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      mockDb.user.create.mockResolvedValue(mockUser);

      const result = await createUser('test@example.com', 'hashed', 'Test', 'User');

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          firstName: 'Test',
          lastName: 'User',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should pass undefined for optional fields when not provided', async () => {
      mockDb.user.create.mockResolvedValue(mockUser);

      await createUser('test@example.com', 'hashed');

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          firstName: undefined,
          lastName: undefined,
        },
      });
    });

    it('should return null when creation fails', async () => {
      mockDb.user.create.mockRejectedValue(new Error('Duplicate email'));

      const result = await createUser('dup@example.com', 'hashed');

      expect(result).toBeNull();
    });
  });

  describe('userExists', () => {
    it('should return true when user is found', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const result = await userExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false when user is not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await userExists('nobody@example.com');

      expect(result).toBe(false);
    });

    it('should return false when db throws', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await userExists('test@example.com');

      expect(result).toBe(false);
    });
  });
});
